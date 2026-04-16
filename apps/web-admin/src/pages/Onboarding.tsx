import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Input,
  Label,
  Checkbox
} from "@shoplink/ui";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Store,
  Zap,
  BarChart3,
  Users,
  ShoppingCart,
} from "lucide-react";
import api from "@/api/client";

type Step = "welcome" | "basic" | "features" | "customization" | "review" | "complete";

interface OnboardingData {
  storeName: string;
  phone: string;
  address: string;
  features: {
    pos: boolean;
    analytics: boolean;
    inventory: boolean;
    staffManagement: boolean;
  };
  settings: {
    currency: string;
    taxRate: string;
    paymentMethods: string[];
  };
}

const FEATURES = [
  {
    id: "pos",
    name: "Modern POS",
    description: "Cloud-syncing checkout interface with barcode support",
    icon: ShoppingCart,
    recommended: true,
  },
  {
    id: "analytics",
    name: "Deep Analytics",
    description: "Revenue trends, product performance, and local insights",
    icon: BarChart3,
    recommended: true,
  },
  {
    id: "inventory",
    name: "Auto-Inventory",
    description: "Stocks update automatically as you sell",
    icon: Zap,
    recommended: true,
  },
  {
    id: "staffManagement",
    name: "Staff Control",
    description: "Manage multiple cashiers and track their performance",
    icon: Users,
    recommended: false,
  },
];

const PAYMENT_METHODS = ["Cash", "M-Pesa", "Card", "Credit"];

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("welcome");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    storeName: "",
    phone: "",
    address: "",
    features: {
      pos: true,
      analytics: true,
      inventory: true,
      staffManagement: false,
    },
    settings: {
      currency: "KES",
      taxRate: "16",
      paymentMethods: ["Cash", "M-Pesa"],
    },
  });

  const handleNext = () => {
    if (step === "welcome") setStep("basic");
    else if (step === "basic") {
      if (!data.storeName || !data.phone) {
        toast.error("Please fill in the required store information");
        return;
      }
      setStep("features");
    } else if (step === "features") setStep("customization");
    else if (step === "customization") setStep("review");
    else if (step === "review") {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step === "basic") setStep("welcome");
    else if (step === "features") setStep("basic");
    else if (step === "customization") setStep("features");
    else if (step === "review") setStep("customization");
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // 1. Update Business Profile
      await api.patch('/settings/business', {
        name: data.storeName,
        phone: data.phone,
        address: data.address,
        currency: data.settings.currency,
      });

      // 2. Update Business Settings
      await api.patch('/settings', {
        taxRate: Number(data.settings.taxRate),
        enableCash: data.settings.paymentMethods.includes("Cash"),
        enableMpesa: data.settings.paymentMethods.includes("M-Pesa"),
        enableCard: data.settings.paymentMethods.includes("Card"),
        enableOther: data.settings.paymentMethods.includes("Credit"),
      });

      toast.success("Platform configured successfully!");
      setStep("complete");
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to complete setup");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFeature = (id: string) => {
    setData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [id]: !prev.features[id as keyof typeof prev.features]
      }
    }));
  };

  const togglePayment = (method: string) => {
    setData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        paymentMethods: prev.settings.paymentMethods.includes(method)
          ? prev.settings.paymentMethods.filter(m => m !== method)
          : [...prev.settings.paymentMethods, method]
      }
    }));
  };

  return (
    <div className="min-h-screen bg-[#050c18] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress bar */}
        {step !== "complete" && (
          <div className="mb-8">
            <div className="flex justify-between text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
              <span>Step {
                step === "welcome" ? "1" : 
                step === "basic" ? "2" : 
                step === "features" ? "3" : 
                step === "customization" ? "4" : "5"
              } of 5</span>
              <span>{Math.round((
                step === "welcome" ? 1 : 
                step === "basic" ? 2 : 
                step === "features" ? 3 : 
                step === "customization" ? 4 : 5
              ) / 5 * 100)}% Complete</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                style={{ width: `${(
                  step === "welcome" ? 1 : 
                  step === "basic" ? 2 : 
                  step === "features" ? 3 : 
                  step === "customization" ? 4 : 5
                ) / 5 * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Welcome Step */}
        {step === "welcome" && (
          <Card className="border-slate-800 bg-[#0a1628]/80 backdrop-blur-xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/20">
                <Store className="w-8 h-8 text-blue-400" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Powering ShopLink
              </CardTitle>
              <CardDescription className="text-slate-400 text-lg mt-2">
                Let's transition your store to the next generation of commerce.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-4">
                {[
                  "Migrate your business profile",
                  "Enable advanced POS & Inventory features",
                  "Configure localized payment methods",
                  "Unlock real-time sales analytics"
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-400/5 border border-slate-400/10">
                    <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                    <span className="text-slate-200 text-sm font-medium">{text}</span>
                  </div>
                ))}
              </div>
              <Button onClick={handleNext} className="w-full h-12 text-md font-bold shadow-lg shadow-blue-500/20 mt-4">
                Let's Begin <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Basic Info Step */}
        {step === "basic" && (
          <Card className="border-slate-800 bg-[#0a1628]/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white">Store Identity</CardTitle>
              <CardDescription className="text-slate-400">Basic details about your business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="storeName" className="text-slate-300">Business Name</Label>
                <Input 
                  id="storeName" 
                  value={data.storeName}
                  onChange={e => setData(d => ({ ...d, storeName: e.target.value }))}
                  placeholder="e.g. Nairobi Prime Grocers"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300">Phone / WhatsApp</Label>
                <Input 
                  id="phone" 
                  value={data.phone}
                  onChange={e => setData(d => ({ ...d, phone: e.target.value }))}
                  placeholder="+254 7XX XXX XXX"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-slate-300">Location Address</Label>
                <textarea 
                  id="address" 
                  value={data.address}
                  onChange={e => setData(d => ({ ...d, address: e.target.value }))}
                  placeholder="Plot 123, Westlands, Nairobi"
                  className="w-full bg-slate-900 border-slate-700 text-white text-sm p-3 rounded-md outline-none focus:ring-1 focus:ring-blue-500 min-h-[80px]"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={handleBack} variant="outline" className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Features <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features Step */}
        {step === "features" && (
          <Card className="border-slate-800 bg-[#0a1628]/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white">Power Tools</CardTitle>
              <CardDescription className="text-slate-400">Select which ShopLink tools you want to activate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {FEATURES.map(f => {
                  const Icon = f.icon;
                  const active = data.features[f.id as keyof typeof data.features];
                  return (
                    <div 
                      key={f.id}
                      onClick={() => toggleFeature(f.id)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                        active ? "border-blue-500 bg-blue-500/5" : "border-slate-800 bg-slate-900/40 opacity-70"
                      }`}
                    >
                      <div className="mt-1">
                        <Checkbox checked={active} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-5 h-5 ${active ? "text-blue-400" : "text-slate-400"}`} />
                          <h4 className="text-sm font-bold text-white">{f.name}</h4>
                          {f.recommended && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">Recommended</span>}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{f.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 pt-6">
                <Button onClick={handleBack} variant="outline" className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800">
                   Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Settings <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customization Step */}
        {step === "customization" && (
          <Card className="border-slate-800 bg-[#0a1628]/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white">Localization</CardTitle>
              <CardDescription className="text-slate-400">Configure currency and methods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Store Currency</Label>
                  <select 
                    className="w-full bg-slate-900 border-slate-700 text-white text-sm p-2 rounded-md outline-none"
                    value={data.settings.currency}
                    onChange={e => setData(d => ({ ...d, settings: { ...d.settings, currency: e.target.value }}))}
                  >
                    <option value="KES">KES - Kenya Shilling</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="NGN">NGN - Nigerian Naira</option>
                    <option value="UGX">UGX - Uganda Shilling</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Default VAT (%)</Label>
                  <Input 
                    type="number"
                    value={data.settings.taxRate}
                    onChange={e => setData(d => ({ ...d, settings: { ...d.settings, taxRate: e.target.value }}))}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label className="text-slate-300">Enabled Payment Methods</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(m => {
                    const active = data.settings.paymentMethods.includes(m);
                    return (
                      <div 
                        key={m}
                        onClick={() => togglePayment(m)}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                          active ? "bg-blue-500/10 border-blue-500/50 text-blue-100" : "bg-slate-900 border-slate-800 text-slate-400"
                        }`}
                      >
                        <Checkbox checked={active} />
                        <span className="text-sm font-medium">{m}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleBack} variant="outline" className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800">
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Review <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review Step */}
        {step === "review" && (
          <Card className="border-slate-800 bg-[#0a1628]/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white">Final Review</CardTitle>
              <CardDescription className="text-slate-400">Launch your new ShopLink store with these settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400 text-sm">Business</span>
                  <span className="text-white font-bold">{data.storeName}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Currency</p>
                    <p className="text-white text-sm">{data.settings.currency}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">VAT Rate</p>
                    <p className="text-white text-sm">{data.settings.taxRate}%</p>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-2">Activated Features</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(data.features).filter(([,v]) => v).map(([k]) => (
                      <span key={k} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {k.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleBack} variant="outline" className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800" disabled={isSubmitting}>
                   Back
                </Button>
                <Button onClick={handleComplete} className="flex-1 h-12" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Launch System <CheckCircle2 className="ml-2 w-5 h-5" /></>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Complete Step */}
        {step === "complete" && (
          <Card className="border-blue-500/50 bg-[#0a1628]/80 backdrop-blur-2xl text-center py-12">
            <CardContent className="space-y-6">
              <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white">Transition Complete</h2>
                <p className="text-slate-400">Welcome to high-performance commerce.</p>
              </div>
              <div className="flex justify-center pt-4">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
