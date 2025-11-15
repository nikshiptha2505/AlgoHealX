import { Shield, QrCode, CheckCircle2, Truck, AlertTriangle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { WalletSelector } from '@/components/WalletSelector';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

interface Medicine {
  id: string;
  batch_id: string;
  drug_name: string;
  manufacturer: string;
  status: string;
  producer_wallet: string;
  created_at: string;
}

const Home = () => {
  const { isConnected } = useWallet();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [walletSelectorOpen, setWalletSelectorOpen] = useState(false);

  useEffect(() => {
    const fetchMedicines = async () => {
      const { data } = await supabase
        .from('medicines')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) setMedicines(data);
    };

    fetchMedicines();

    // Real-time subscription
    const channel = supabase
      .channel('medicines-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medicines'
        },
        () => {
          fetchMedicines();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusBadge = (status: string) => {
    if (status === 'approved') {
      return (
        <Badge className="bg-success text-success-foreground">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    } else if (status === 'rejected') {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-warning-light text-warning-foreground">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const features = [
    {
      icon: Shield,
      title: 'Blockchain Security',
      description: 'Immutable records on Algorand blockchain ensure medicine authenticity',
      color: 'text-primary',
    },
    {
      icon: QrCode,
      title: 'QR Code Verification',
      description: 'Instant verification through scanning or image upload',
      color: 'text-accent',
    },
    {
      icon: CheckCircle2,
      title: 'Government Approved',
      description: 'Regulatory verification ensures compliance and safety',
      color: 'text-success',
    },
    {
      icon: Truck,
      title: 'Supply Chain Tracking',
      description: 'Complete transparency from manufacturer to consumer',
      color: 'text-warning',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-32">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 backdrop-blur-sm">
              <AlertTriangle className="h-4 w-4 text-warning-foreground" />
              <span className="text-sm font-medium text-primary-foreground">
                Fighting Counterfeit Medicines with Blockchain
              </span>
            </div>
            <h1 className="mb-6 text-4xl font-bold text-primary-foreground md:text-6xl">
              Secure Medicine Authentication System
            </h1>
            <p className="mb-8 text-lg text-primary-foreground/90 md:text-xl">
              AlgoHealX leverages Algorand blockchain to ensure every medicine is authentic,
              safe, and traceable from production to consumption.
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
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => setWalletSelectorOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Shield className="mr-2 h-5 w-5" />
                  Get Started
                </Button>
              )}
              <Link to="/verify">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-grid-white/[0.05] -z-0" />
      </section>

      {/* Registered Medicines Section */}
      {medicines.length > 0 && (
        <section className="py-12 border-b bg-secondary/50">
          <div className="container">
            <h2 className="text-2xl font-bold mb-6">Recently Registered Medicines</h2>
            <div className="grid gap-4">
              {medicines.map((medicine) => (
                <Card key={medicine.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{medicine.drug_name}</CardTitle>
                        <CardDescription>
                          Batch: {medicine.batch_id} | {medicine.manufacturer}
                        </CardDescription>
                      </div>
                      {getStatusBadge(medicine.status)}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 md:py-32">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How AlgoHealX Works
            </h2>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for Every Stakeholder
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Secure portals for producers, regulators, distributors, and consumers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Producers', path: '/producer', desc: 'Register medicine batches' },
              { title: 'Regulators', path: '/regulator', desc: 'Verify and approve' },
              { title: 'Distributors', path: '/distributor', desc: 'Track supply chain' },
              { title: 'Consumers', path: '/verify', desc: 'Verify authenticity' },
            ].map((role, index) => (
              <Link key={index} to={role.path}>
                <Card className="p-6 h-full hover:shadow-medical transition-all duration-300 hover:scale-105 cursor-pointer">
                  <h3 className="text-xl font-semibold mb-2">{role.title}</h3>
                  <p className="text-muted-foreground mb-4">{role.desc}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Access Portal
                  </Button>
                </Card>
              </Link>
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
              <h2 className="text-3xl font-bold mb-4">
                Ready to Secure Your Medicines?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of healthcare providers using blockchain technology
                to fight counterfeit medicines
              </p>
              {isConnected ? (
                <Link to="/producer">
                  <Button size="lg" className="bg-gradient-primary shadow-medical">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Button 
                  size="lg" 
                  className="bg-gradient-primary shadow-medical"
                  onClick={() => setWalletSelectorOpen(true)}
                >
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

export default Home;
