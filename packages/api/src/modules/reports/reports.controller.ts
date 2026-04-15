import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.js';
import { prisma } from '../../lib/prisma.js';
import ExcelJS from 'exceljs';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

function parseDateRange(req: Request) {
  const { dateFrom, dateTo } = req.query as Record<string, string | undefined>;
  return {
    gte: dateFrom ? new Date(dateFrom) : startOfDay(subDays(new Date(), 29)),
    lte: dateTo   ? new Date(dateTo)   : endOfDay(new Date()),
  };
}

export const revenueReport = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const dateRange = parseDateRange(req);

  const orders = await prisma.order.findMany({
    where: { businessId, status: 'COMPLETED', createdAt: dateRange },
    select: { total: true, subtotal: true, taxAmount: true, discountTotal: true, paymentMethod: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Group by day
  const byDay = (orders as any[]).reduce((acc: Record<string, { revenue: number; count: number }>, o: any) => {
    const day = format(o.createdAt, 'yyyy-MM-dd');
    if (!acc[day]) acc[day] = { revenue: 0, count: 0 };
    acc[day]!.revenue += Number(o.total);
    acc[day]!.count += 1;
    return acc;
  }, {} as Record<string, { revenue: number; count: number }>);

  const totalRevenue = (orders as any[]).reduce((s: number, o: any) => s + Number(o.total), 0);
  const totalTax = (orders as any[]).reduce((s: number, o: any) => s + Number(o.taxAmount), 0);
  const totalDiscount = (orders as any[]).reduce((s: number, o: any) => s + Number(o.discountTotal), 0);

  const paymentBreakdown = (orders as any[]).reduce((acc: Record<string, number>, o: any) => {
    acc[o.paymentMethod] = (acc[o.paymentMethod] ?? 0) + Number(o.total);
    return acc;
  }, {} as Record<string, number>);

  res.json({
    success: true,
    data: {
      totalRevenue, totalTax, totalDiscount,
      orderCount: orders.length,
      avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      byDay,
      paymentBreakdown,
    },
  });
});

export const productsReport = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const dateRange = parseDateRange(req);

  const lines = await prisma.orderLine.findMany({
    where: { order: { businessId, status: 'COMPLETED', createdAt: dateRange } },
    include: {
      product: { select: { name: true } },
      variant: { include: { variantOptions: { include: { optionValue: true } } } },
    },
  });

  // Aggregate by product
  const byProduct = (lines as any[]).reduce((acc: Record<string, { name: string; quantity: number; revenue: number }>, l: any) => {
    const key = l.productId ?? l.variantId ?? 'unknown';
    const name = l.product?.name ?? 'Unknown';
    if (!acc[key]) acc[key] = { name, quantity: 0, revenue: 0 };
    acc[key]!.quantity += l.quantity;
    acc[key]!.revenue += Number(l.lineTotal);
    return acc;
  }, {} as Record<string, { name: string; quantity: number; revenue: number }>);

  const sorted = Object.entries(byProduct)
    .map(([id, v]: [string, any]) => ({ id, name: v.name, quantity: v.quantity, revenue: v.revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  res.json({ success: true, data: sorted });
});

export const staffReport = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const dateRange = parseDateRange(req);

  const orders = await prisma.order.findMany({
    where: { businessId, status: 'COMPLETED', createdAt: dateRange },
    select: { cashierId: true, total: true, cashier: { select: { name: true } } },
  });

  const byStaff = (orders as any[]).reduce((acc: Record<string, { name: string; count: number; revenue: number }>, o: any) => {
    if (!acc[o.cashierId]) acc[o.cashierId] = { name: o.cashier.name, count: 0, revenue: 0 };
    acc[o.cashierId]!.count += 1;
    acc[o.cashierId]!.revenue += Number(o.total);
    return acc;
  }, {} as Record<string, { name: string; count: number; revenue: number }>);

  res.json({ success: true, data: Object.entries(byStaff).map(([id, v]: [string, any]) => ({ id, name: v.name, count: v.count, revenue: v.revenue })) });
});

export const exportXls = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const dateRange = parseDateRange(req);
  const type = (req.query['type'] as string) ?? 'revenue';

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'DukaPOS';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(type === 'revenue' ? 'Revenue' : 'Products');

  if (type === 'revenue') {
    sheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Receipt No', key: 'receiptNo', width: 18 },
      { header: 'Cashier', key: 'cashier', width: 22 },
      { header: 'Payment', key: 'payment', width: 12 },
      { header: 'Subtotal', key: 'subtotal', width: 14 },
      { header: 'Discount', key: 'discount', width: 12 },
      { header: 'Tax', key: 'tax', width: 12 },
      { header: 'Total', key: 'total', width: 14 },
    ];

    const orders = await prisma.order.findMany({
      where: { businessId, status: 'COMPLETED', createdAt: dateRange },
      include: { cashier: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    orders.forEach((o: any) => sheet.addRow({
      date: format(o.createdAt, 'yyyy-MM-dd HH:mm'),
      receiptNo: o.receiptNo,
      cashier: o.cashier.name,
      payment: o.paymentMethod,
      subtotal: Number(o.subtotal),
      discount: Number(o.discountTotal),
      tax: Number(o.taxAmount),
      total: Number(o.total),
    }));
  }

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="dukapos-${type}-${format(new Date(), 'yyyy-MM-dd')}.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
});
