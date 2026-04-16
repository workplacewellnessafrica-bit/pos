import { useState, useMemo } from "react";
import { 
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Input,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@shoplink/ui";
import { formatCurrency } from "@shoplink/shared";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Send,
  BarChart3,
  Clock,
  TrendingUp,
  Lock,
  ChevronDown,
  ChevronUp,
  Search,
  Package
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "../api/client";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

interface TransactionLog {
  id: string;
  itemCount: number;
  total: number;
  paymentMethod: string;
  timestamp: Date;
  items: { name: string; quantity: number; price: number }[];
}

export function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [adminPinOpen, setAdminPinOpen] = useState(false);
  const [transactionLogs, setTransactionLogs] = useState<TransactionLog[]>([]);
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);

  // 1. Fetch Products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await api.get("/products");
      return res.data;
    }
  });

  const products = productsData?.data || [];

  // 2. Checkout Mutation
  const checkoutMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const res = await api.post("/orders", orderData);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success("Sale completed successfully!");
      
      const newTransaction: TransactionLog = {
        id: res.data.id,
        itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
        total: cartTotal,
        paymentMethod,
        timestamp: new Date(),
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      };

      setTransactionLogs([newTransaction, ...transactionLogs]);
      setCart([]);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Checkout failed");
    }
  });

  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.barcode && p.barcode.includes(searchTerm))
    );
  }, [products, searchTerm]);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    const price = parseFloat(product.basePrice || "0");
    
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { 
        id: product.id, 
        name: product.name, 
        price, 
        quantity: 1, 
        stock: product.totalStock || 999 
      }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const nextQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: nextQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    checkoutMutation.mutate({
      items: cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price.toString()
      })),
      paymentMethod,
      status: "COMPLETED"
    });
  };

  // Analytics
  const totalRevenue = transactionLogs.reduce((sum, log) => sum + log.total, 0);
  const topSellers = useMemo(() => {
    const counts: Record<string, number> = {};
    transactionLogs.forEach(log => {
      log.items.forEach(item => {
        counts[item.name] = (counts[item.name] || 0) + item.quantity;
      });
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [transactionLogs]);

  return (
    <div className="min-h-screen bg-[#050c18] text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0a1628]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">ShopLink Desktop</h1>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Store Terminal • Active</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
             <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Session Total</p>
                <p className="text-2xl font-black text-white">{formatCurrency(totalRevenue)}</p>
             </div>
             <Button variant="outline" size="icon" onClick={() => setAdminPinOpen(true)} className="border-slate-800 bg-slate-900/50">
                <Lock className="w-4 h-4 text-slate-400" />
             </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6">
        <Tabs defaultValue="sales" className="space-y-6">
          <TabsList className="bg-slate-900/50 border border-slate-800 p-1 rounded-xl w-fit">
            <TabsTrigger value="sales" className="px-8 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg">Sales</TabsTrigger>
            <TabsTrigger value="history" className="px-8 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg">History</TabsTrigger>
            <TabsTrigger value="analytics" className="px-8 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg">Insights</TabsTrigger>
          </TabsList>

          {/* SALES TAB */}
          <TabsContent value="sales" className="grid grid-cols-12 gap-6 outline-none">
            {/* Products grid */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input 
                  placeholder="Search products by name or barcode..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 bg-slate-900/50 border-slate-800 text-lg rounded-2xl shadow-inner focus:ring-blue-500/50"
                />
              </div>

              {productsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-40 bg-slate-900/40 animate-pulse rounded-2xl border border-slate-800/50" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[calc(100vh-320px)] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredProducts.map((p: any) => (
                    <Card 
                      key={p.id} 
                      onClick={() => addToCart(p)}
                      className="group relative overflow-hidden bg-slate-900/30 border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-900/50 transition-all cursor-pointer rounded-2xl"
                    >
                      <CardHeader className="p-4 pb-0">
                        <Badge variant="outline" className="w-fit mb-2 border-slate-700 text-slate-500 text-[10px]">
                          {p.category?.name || "Uncategorized"}
                        </Badge>
                        <CardTitle className="text-sm font-bold text-slate-200 line-clamp-2 group-hover:text-white">{p.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 flex items-end justify-between">
                        <span className="text-lg font-black text-blue-400">{formatCurrency(p.basePrice)}</span>
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Plus className="w-4 h-4" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Sidebar */}
            <div className="col-span-12 lg:col-span-4">
              <Card className="bg-slate-900/80 border-slate-800 h-[calc(100vh-210px)] flex flex-col rounded-3xl overflow-hidden backdrop-blur-md">
                <CardHeader className="border-b border-slate-800 p-6">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                       Active Cart
                       <Badge className="bg-blue-600 ml-2">{cartItemCount}</Badge>
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setCart([])} className="text-slate-500 hover:text-rose-400">
                       <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                   {cart.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 opacity-50">
                        <ShoppingCart className="w-12 h-12" />
                        <p className="font-bold text-sm uppercase tracking-widest">Cart is empty</p>
                     </div>
                   ) : (
                     cart.map(item => (
                       <div key={item.id} className="flex gap-4 p-3 rounded-2xl bg-slate-800/30 border border-slate-800">
                          <div className="flex-1 space-y-1">
                             <h4 className="text-sm font-bold text-slate-200 line-clamp-1">{item.name}</h4>
                             <p className="text-xs text-blue-400 font-bold">{formatCurrency(item.price)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="flex items-center bg-slate-900/80 rounded-lg p-1 border border-slate-700">
                                <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, -1)} className="h-7 w-7 text-slate-400 hover:text-white">
                                   <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-8 text-center text-sm font-black text-white">{item.quantity}</span>
                                <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, 1)} className="h-7 w-7 text-slate-400 hover:text-white">
                                   <Plus className="w-3 h-3" />
                                </Button>
                             </div>
                          </div>
                       </div>
                     ))
                   )}
                </CardContent>

                <div className="mt-auto p-6 bg-slate-900 border-t border-slate-800 space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between text-slate-400 font-medium">
                      <span>Subtotal</span>
                      <span>{formatCurrency(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-black text-white">
                      <span>Grand Total</span>
                      <span className="text-blue-400">{formatCurrency(cartTotal)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                     {["CASH", "MPESA", "CARD", "OTHER"].map(m => (
                       <Button 
                        key={m} 
                        variant={paymentMethod === m ? "default" : "outline"}
                        onClick={() => setPaymentMethod(m)}
                        className={`h-12 font-bold ${paymentMethod === m ? "bg-blue-600" : "border-slate-800 bg-slate-900 text-slate-400"}`}
                       >
                         {m === "MPESA" ? "M-Pesa" : m}
                       </Button>
                     ))}
                  </div>

                  <Button 
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || checkoutMutation.isPending}
                    className="w-full h-16 text-lg font-black bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-500/20"
                  >
                    {checkoutMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "COMPLETE SALE"}
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="outline-none">
            <Card className="bg-slate-900/50 border-slate-800 rounded-3xl">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Transaction History
                </CardTitle>
                <CardDescription className="text-slate-500">Recent sales processed at this terminal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {transactionLogs.length === 0 ? (
                  <div className="py-20 text-center text-slate-600">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-sm">No recent transactions</p>
                  </div>
                ) : (
                  transactionLogs.map(log => (
                    <div key={log.id} className="group rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-all overflow-hidden">
                       <div 
                        onClick={() => setExpandedTransaction(expandedTransaction === log.id ? null : log.id)}
                        className="p-5 flex items-center justify-between cursor-pointer"
                       >
                          <div className="flex gap-4 items-center">
                             <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-colors">
                                {log.id.slice(-2).toUpperCase()}
                             </div>
                             <div>
                                <h4 className="font-bold text-white text-sm">Sale #{log.id.slice(-6).toUpperCase()}</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{log.timestamp.toLocaleTimeString()} • {log.paymentMethod}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-6">
                             <div className="text-right">
                                <p className="font-black text-white">{formatCurrency(log.total)}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">{log.itemCount} items</p>
                             </div>
                             {expandedTransaction === log.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                       </div>
                       {expandedTransaction === log.id && (
                         <div className="px-5 pb-5 pt-0 border-t border-slate-800/50 space-y-2 mt-4">
                           {log.items.map((it, idx) => (
                             <div key={idx} className="flex justify-between text-xs text-slate-400">
                                <span>{it.quantity}x {it.name}</span>
                                <span className="font-mono">{formatCurrency(it.price * it.quantity)}</span>
                             </div>
                           ))}
                         </div>
                       )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* INSIGHTS TAB */}
          <TabsContent value="analytics" className="space-y-6 outline-none">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-3xl">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Total Net Sales</p>
                   <h3 className="text-3xl font-black text-white">{formatCurrency(totalRevenue)}</h3>
                   <div className="flex items-center gap-2 mt-4 text-green-400">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-bold font-mono">+12.5% vs yesterday</span>
                   </div>
                </Card>
                <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-3xl">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Transaction Count</p>
                   <h3 className="text-3xl font-black text-white">{transactionLogs.length}</h3>
                   <p className="text-xs text-slate-500 mt-4 font-bold">Processed at this terminal</p>
                </Card>
                {/* Add more metrics as needed */}
             </div>

             <Card className="bg-slate-900/50 border-slate-800 rounded-3xl">
               <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-400" />
                    Bestselling Products (Session)
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="space-y-3">
                    {topSellers.map(([name, qty], i) => (
                      <div key={name} className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/30 border border-slate-800">
                        <div className="flex items-center gap-4">
                           <div className="text-lg font-black text-slate-700 w-6">#{i+1}</div>
                           <h4 className="font-bold text-slate-200">{name}</h4>
                        </div>
                        <Badge className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3">{qty} sold</Badge>
                      </div>
                    ))}
                  </div>
               </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={adminPinOpen} onOpenChange={setAdminPinOpen}>
         <DialogContent className="bg-[#0a1628] border-slate-800 max-w-sm">
            <DialogHeader>
               <DialogTitle className="text-white">Admin Authentication</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
               <p className="text-sm text-slate-400">Enter your secure 6-digit PIN to access terminal management and overrides.</p>
               <Input 
                type="password" 
                maxLength={6}
                className="h-16 text-center text-3xl tracking-[1em] font-black bg-slate-900 border-slate-700"
                placeholder="••••••"
               />
               <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-12 border-slate-700 text-slate-300" onClick={() => setAdminPinOpen(false)}>Cancel</Button>
                  <Button className="h-12 bg-blue-600 hover:bg-blue-500 font-bold" onClick={() => {
                    setAdminPinOpen(false);
                    toast.success("Admin authorized");
                  }}>Verify PIN</Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
