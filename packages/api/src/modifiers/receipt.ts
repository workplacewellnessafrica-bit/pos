export const generateReceiptHTML = (order: any, business: any) => {
  const lineItems = order.lines.map((l: any) => `
    <tr>
      <td style="padding: 4px 0">${l.product?.name} ${l.variant ? `(${l.variant.variantOptions?.map((o: any) => o.optionValue.value).join('/')})` : ''}</td>
      <td style="text-align: center">${l.quantity}</td>
      <td style="text-align: right">${Number(l.lineTotal).toLocaleString('en-KE')}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: monospace; font-size: 14px; width: 300px; margin: 0 auto; color: #000; }
          .center { text-align: center; }
          .line { border-bottom: 1px dashed #000; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; }
          th { border-bottom: 1px solid #000; padding-bottom: 4px; text-align: left; }
        </style>
      </head>
      <body>
        <div class="center">
          <h2>${business.name}</h2>
          <p>Receipt: ${order.receiptNo}</p>
          <p>Date: ${new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div class="line"></div>
        <table>
          <tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Total</th></tr>
          ${lineItems}
        </table>
        <div class="line"></div>
        <table>
          <tr><td>Subtotal:</td><td style="text-align:right">${Number(order.subtotal).toLocaleString('en-KE')}</td></tr>
          <tr><td>Tax:</td><td style="text-align:right">${Number(order.taxAmount).toLocaleString('en-KE')}</td></tr>
          <tr><th><strong>Total:</strong></th><td style="text-align:right"><strong>KES ${Number(order.total).toLocaleString('en-KE')}</strong></td></tr>
          <tr><td>Tendered:</td><td style="text-align:right">${Number(order.amountTendered || 0).toLocaleString('en-KE')}</td></tr>
          <tr><td>Change:</td><td style="text-align:right">${Number(order.changeDue || 0).toLocaleString('en-KE')}</td></tr>
        </table>
        <div class="line"></div>
        <div class="center">
          <p>Thank you for your business!</p>
          <p>Served by: ${order.cashier?.name}</p>
        </div>
      </body>
    </html>
  `;
};
