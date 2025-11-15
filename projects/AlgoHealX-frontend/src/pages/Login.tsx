import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/contexts/WalletContext";
import { useAuth } from "@/contexts/AuthContext";
import { WalletSelector } from "@/components/WalletSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  Wallet,
  QrCode,
  CheckCircle2,
  Truck,
  AlertTriangle,
  Clock,
  XCircle,
  ShieldCheck,
  CheckCircle,
  Loader2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { QRScanner } from "@/components/QRScanner";

interface Medicine {
  id: string;
  batch_id: string;
  drug_name: string;
  manufacturer: string;
  status: string;
  producer_wallet: string;
  created_at: string;
}

interface VerificationResult {
  isAuthentic: boolean;
  status: string;
  batchId: string;
  drugName: string;
  manufacturer: string;
  expiryDate: string;
  quantity?: number;
  registrationTxHash?: string;
  approvalTxHash?: string;
  supplyChainEvents: Array<{
    eventType: string;
    location?: string;
    timestamp: string;
    blockchainTxHash?: string;
  }>;
}

const Login = () => {
  // Wallet / Auth
  const { accountAddress, isConnected } = useWallet();
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // UI state
  const [walletSelectorOpen, setWalletSelectorOpen] = useState(false);
  const { toast } = useToast();

  // Medicines & verification state
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batchId, setBatchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  // Pagination for Registered Medicines
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(medicines.length / PAGE_SIZE));
  const paginatedMedicines = medicines.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const goNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));
  const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToPage = (n: number) => setCurrentPage(Math.min(Math.max(1, n), totalPages));

  // ref to medicines container for scrolling
  const medicinesRef = useRef<HTMLDivElement | null>(null);

  // Featured cards (UI)
  const features = [
    {
      icon: Shield,
      title: "Blockchain Security",
      description: "Immutable records on Algorand blockchain ensure medicine authenticity",
      color: "text-primary",
    },
    {
      icon: QrCode,
      title: "QR Code Verification",
      description: "Instant verification through scanning or image upload",
      color: "text-accent",
    },
    {
      icon: CheckCircle2,
      title: "Government Approved",
      description: "Regulatory verification ensures compliance and safety",
      color: "text-success",
    },
    {
      icon: Truck,
      title: "Supply Chain Tracking",
      description: "Complete transparency from manufacturer to consumer",
      color: "text-warning",
    },
  ];

  useEffect(() => {
    // redirect if already logged in
    if (user) navigate(/${user.role});
  }, [user, navigate]);

  useEffect(() => {
    const fetchMedicines = async () => {
      // fetch a reasonable number for frontend pagination; increase if needed
      const { data } = await supabase.from("medicines").select("*").order("created_at", { ascending: false }).limit(50);
      if (data) setMedicines(data);
    };

    fetchMedicines();

    const channel = supabase
      .channel("medicines-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "medicines",
        },
        () => {
          fetchMedicines();
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.warn("Failed to remove supabase channel gracefully", e);
      }
    };
  }, []);

  useEffect(() => {
    // auto-login when wallet connects
    const handleWalletLogin = async () => {
      if (isConnected && accountAddress) {
        const existingUser = await login(accountAddress);

        if (existingUser) {
          toast({
            title: "Welcome back",
            description: Welcome back, ${existingUser.name}!,
          });
          navigate(/${existingUser.role});
        } else {
          toast({
            title: "Wallet not registered",
            description: "Wallet not registered. Please complete signup.",
          });
          navigate("/signup", { state: { walletAddress: accountAddress } });
        }
      }
    };

    handleWalletLogin();
  }, [isConnected, accountAddress, login, navigate, toast]);

  const handleVerify = async () => {
    if (!batchId.trim()) {
      toast({
        title: "Batch ID Required",
        description: "Please enter a batch ID to verify",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-medicine", {
        body: { batchId },
      });

      if (error) throw error;

      setVerificationResult(data);

      toast({
        title: data.isAuthentic ? "Medicine Verified" : "Verification Warning",
        description: data.isAuthentic ? "Medicine is authentic and approved" : "Medicine not approved or issues found",
        variant: data.isAuthentic ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Failed to verify medicine",
        variant: "destructive",
      });
      setVerificationResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.batchId) setBatchId(parsed.batchId);
      else setBatchId(data);
    } catch (err) {
      setBatchId(data);
    }
    setShowScanner(false);

    toast({
      title: "QR Code Scanned",
      description: "Batch ID captured successfully",
    });
  };

  const getStatusBadge = (status: string) => {
    const base = "inline-flex items-center text-sm font-medium px-3 py-1 rounded-full whitespace-nowrap";
    if (status === "approved") {
      return (
        <span className={base + " bg-green-100 text-green-800 ring-1 ring-green-50"}>
          <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
          Approved
        </span>
      );
    } else if (status === "rejected") {
      return (
        <span className={base + " bg-red-100 text-red-800 ring-1 ring-red-50"}>
          <XCircle className="h-4 w-4 mr-2 text-red-600" />
          Rejected
        </span>
      );
    }
    // Pending / default
    return (
      <span className={base + " bg-yellow-100 text-yellow-800 ring-1 ring-yellow-50"}>
        <Clock className="h-4 w-4 mr-2 text-yellow-600" />
        Pending
      </span>
    );
  };

  // when user changes page, scroll list into view
  useEffect(() => {
    medicinesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage]);

  return (
    <div className="min-h-screen">
      {/* Hero Section (slightly tighter vertical spacing) */}
      <section className="relative overflow-hidden bg-gradient-hero py-16 md:py-24">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 backdrop-blur-sm">
              <AlertTriangle className="h-4 w-4 text-warning-foreground" />
              <span className="text-sm font-medium text-primary-foreground">Fighting Counterfeit Medicines with Blockchain</span>
            </div>
            <h1 className="mb-6 text-4xl font-bold text-primary-foreground md:text-6xl">Secure Medicine Authentication System</h1>
            <p className="mb-8 text-lg text-primary-foreground/90 md:text-xl">
              AlgoHealX leverages Algorand blockchain to ensure every medicine is authentic, safe, and traceable from production to
              consumption.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isConnected ? (
                <Link to="/verify">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    <QrCode className="mr-2 h-5 w-5" />
                    Verify Medicine
                  </Button>
                </Link>
              ) : (
                <Button size="lg" variant="secondary" onClick={() => setWalletSelectorOpen(true)} className="w-full sm:w-auto">
                  <Shield className="mr-2 h-5 w-5" />
                  Get Started
                </Button>
              )}
              <a href="#features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary text-primary hover:bg-primary/10">
                  Learn More
                </Button>
              </a>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-grid-white/[0.05] -z-0" />
      </section>

      {/* login section - remove full-screen min-height to avoid large gaps */}
      <section>
        <div className="flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-6 py-12">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Shield className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight">AlgoHealX</h1>
              <p className="text-muted-foreground">Secure Medicine Supply Chain on Algorand</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Connect Your Wallet</CardTitle>
                <CardDescription>Connect your Algorand wallet to access your dashboard</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setWalletSelectorOpen(true)} className="w-full" size="lg">
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect Wallet
                </Button>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                  <p>New to AlgoHealX?</p>
                  <Button variant="link" onClick={() => navigate("/signup")} className="text-primary">
                    Create an account
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="text-center text-xs text-muted-foreground">
              <p>Supported wallets: Pera (preferred), Defly, and Lute</p>
            </div>
          </div>
        </div>
      </section>

      {/* Verification section */}
      <section id="verify-section">
        <div className="container py-10">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <ShieldCheck className="h-8 w-8 text-primary" />
                Verify Medicine Authenticity
              </h1>
              <p className="text-muted-foreground">Verify medicine with approval status and blockchain transaction history</p>
            </div>

            {/* Verification Methods */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Batch ID Verification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Verify by Batch ID
                  </CardTitle>
                  <CardDescription>Enter the batch ID manually</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="batchId">Batch ID</Label>
                      <Input
                        id="batchId"
                        value={batchId}
                        onChange={(e) => setBatchId(e.target.value)}
                        placeholder="e.g., BATCH-2025-001"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleVerify();
                        }}
                      />
                    </div>
                    <Button onClick={handleVerify} className="w-full bg-gradient-primary" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Verify Medicine
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* QR Code Verification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Verify by QR Code
                  </CardTitle>
                  <CardDescription>Scan QR code or upload image</CardDescription>
                </CardHeader>
                <CardContent>
                  {!showScanner ? (
                    <Button onClick={() => setShowScanner(true)} className="w-full" variant="outline" disabled={loading}>
                      <QrCode className="h-4 w-4 mr-2" />
                      Open QR Scanner
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Verification Results */}
            {verificationResult && (
              <Card className={verificationResult.isAuthentic ? "border-success" : "border-destructive"}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {verificationResult.isAuthentic ? (
                        <CheckCircle className="h-6 w-6 text-success" />
                      ) : (
                        <XCircle className="h-6 w-6 text-destructive" />
                      )}
                      {verificationResult.isAuthentic ? "Authentic Medicine" : "Warning: Issues Found"}
                    </CardTitle>
                    <Badge variant={verificationResult.isAuthentic ? "default" : "destructive"}>
                      {verificationResult.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Approval Status */}
                    <div className="p-4 rounded-lg bg-muted">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        Regulatory Approval Status
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge variant={verificationResult.status === "approved" ? "default" : "destructive"} className="mt-1">
                            {verificationResult.status.toUpperCase()}
                          </Badge>
                        </div>
                        {verificationResult.approvalTxHash && (
                          <div>
                            <p className="text-sm text-muted-foreground">Approval TX</p>
                            <p className="font-mono text-xs mt-1">{verificationResult.approvalTxHash.slice(0, 12)}...</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Medicine Details */}
                    <div>
                      <h3 className="font-semibold mb-3">Medicine Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Batch ID</p>
                          <p className="font-medium">{verificationResult.batchId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Drug Name</p>
                          <p className="font-medium">{verificationResult.drugName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Manufacturer</p>
                          <p className="font-medium">{verificationResult.manufacturer}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Expiry Date</p>
                          <p className="font-medium">{new Date(verificationResult.expiryDate).toLocaleDateString()}</p>
                        </div>
                        {verificationResult.quantity && (
                          <div>
                            <p className="text-sm text-muted-foreground">Quantity</p>
                            <p className="font-medium">{verificationResult.quantity} units</p>
                          </div>
                        )}
                        {verificationResult.registrationTxHash && (
                          <div>
                            <p className="text-sm text-muted-foreground">Registration TX</p>
                            <p className="font-mono text-xs">{verificationResult.registrationTxHash.slice(0, 12)}...</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Supply Chain Journey */}
                    <div>
                      <h3 className="font-semibold mb-3">Blockchain Transaction History</h3>
                      <div className="space-y-3">
                        {verificationResult.supplyChainEvents.length > 0 ? (
                          verificationResult.supplyChainEvents.map((event, index) => (
                            <div key={index} className="p-3 rounded-lg border">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium capitalize">{event.eventType}</p>
                                  {event.location && <p className="text-sm text-muted-foreground mt-1">Location: {event.location}</p>}
                                  <p className="text-xs text-muted-foreground mt-1">{new Date(event.timestamp).toLocaleString()}</p>
                                </div>
                                {event.blockchainTxHash && (
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">TX Hash</p>
                                    <p className="font-mono text-xs">{event.blockchainTxHash.slice(0, 10)}...</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">No distribution events recorded yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Registered Medicines Section */}
      {medicines.length > 0 && (
        <section className="py-12 border-b bg-secondary/50">
          <div className="container" ref={medicinesRef}>
            <h2 className="text-2xl font-bold mb-6">Recently Registered Medicines</h2>
            <div className="grid gap-4">
              {paginatedMedicines.map((medicine) => (
                <Card key={medicine.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">{medicine.drug_name}</CardTitle>
                        <CardDescription>
                          Batch: {medicine.batch_id} | {medicine.manufacturer}
                        </CardDescription>
                      </div>

                      <div className="shrink-0">{getStatusBadge(medicine.status)}</div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {/* Pagination controls */}
            {medicines.length > PAGE_SIZE && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    goPrev();
                  }}
                  disabled={currentPage === 1}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-md border bg-white/60 hover:bg-white/80 disabled:opacity-50"
                  aria-label="Previous page"
                >
                  &lt;
                </button>

                <div className="hidden sm:flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const page = idx + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => {
                          goToPage(page);
                        }}
                        className={`h-8 min-w-[32px] px-2 rounded-md text-sm ${
                          currentPage === page ? "bg-primary text-white" : "bg-white/40"
                        }`}
                        aria-current={currentPage === page ? "page" : undefined}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    goNext();
                  }}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-md border bg-white/60 hover:bg-white/80 disabled:opacity-50"
                  aria-label="Next page"
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How AlgoHealX Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A comprehensive system that ensures medicine authenticity at every step
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-medical transition-all duration-300">
                <div className="mb-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Every Stakeholder</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Secure portals for producers, regulators, distributors, and consumers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Producers", path: "/producer", desc: "Register medicine batches" },
              { title: "Regulators", path: "/regulator", desc: "Verify and approve" },
              { title: "Distributors", path: "/distributor", desc: "Track supply chain" },
              { title: "Consumers", path: "#verify-section", desc: "Verify authenticity" },
            ].map((role, index) => (
              <a key={index} href={role.path}>
                <Card className="p-6 h-full hover:shadow-medical transition-all duration-300 hover:scale-105 cursor-pointer">
                  <h3 className="text-xl font-semibold mb-2">{role.title}</h3>
                  <p className="text-muted-foreground mb-4">{role.desc}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Access Portal
                  </Button>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-5" />
            <div className="relative p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Secure Your Medicines?</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of healthcare providers using blockchain technology to fight counterfeit medicines
              </p>
              {isConnected ? (
                <Link to="/producer">
                  <Button size="lg" className="bg-gradient-primary shadow-medical">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Button size="lg" className="bg-gradient-primary shadow-medical" onClick={() => setWalletSelectorOpen(true)}>
                  Connect Wallet to Start
                </Button>
              )}
            </div>
          </Card>
        </div>
      </section>

      <WalletSelector open={walletSelectorOpen} onOpenChange={setWalletSelectorOpen} />
    </div>
  );
};

export default Login;
