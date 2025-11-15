import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { WalletSelector } from '@/components/WalletSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Wallet, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const Signup = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { accountAddress, isConnected } = useWallet();
  const { signup, user } = useAuth();
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '' as 'producer' | 'regulator' | 'distributor' | '',
  });

  const walletFromState = location.state?.walletAddress;
  const connectedWallet = walletFromState || accountAddress;

  useEffect(() => {
    if (user) {
      navigate(`/${user.role}`);
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connectedWallet) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!formData.name || !formData.email || !formData.phone || !formData.role) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await signup({
        wallet_address: connectedWallet,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
      });

      toast.success('Account created successfully!');
      navigate(`/${formData.role}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Join AlgoHealX</h1>
          <p className="text-muted-foreground">
            Create your account to get started
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Fill in your details to register
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Wallet Connection */}
              <div className="space-y-2">
                <Label>Wallet Address</Label>
                {connectedWallet ? (
                  <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-md border">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-mono truncate flex-1">
                      {connectedWallet}
                    </span>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setShowWalletSelector(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Wallet
                  </Button>
                )}
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'producer' | 'regulator' | 'distributor') =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="producer">Producer</SelectItem>
                    <SelectItem value="regulator">Regulator</SelectItem>
                    <SelectItem value="distributor">Distributor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Already have an account?</p>
              <Button
                variant="link"
                onClick={() => navigate('/login')}
                className="text-primary"
              >
                Sign in
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <WalletSelector
        open={showWalletSelector}
        onOpenChange={setShowWalletSelector}
      />
    </div>
  );
};

export default Signup;