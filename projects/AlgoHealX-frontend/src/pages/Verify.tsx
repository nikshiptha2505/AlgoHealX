import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, CheckCircle, XCircle, Loader2, Search, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { QRScanner } from '@/components/QRScanner';

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

const Verify = () => {
  const { toast } = useToast();
  const [batchId, setBatchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const handleVerify = async () => {
    if (!batchId.trim()) {
      toast({
        title: 'Batch ID Required',
        description: 'Please enter a batch ID to verify',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-medicine', {
        body: { batchId },
      });

      if (error) throw error;

      setVerificationResult(data);

      toast({
        title: data.isAuthentic ? 'Medicine Verified' : 'Verification Warning',
        description: data.isAuthentic
          ? 'Medicine is authentic and approved'
          : 'Medicine not approved or issues found',
        variant: data.isAuthentic ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: 'Verification Failed',
        description: error instanceof Error ? error.message : 'Failed to verify medicine',
        variant: 'destructive',
      });
      setVerificationResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.batchId) {
        setBatchId(parsed.batchId);
      } else {
        setBatchId(data);
      }
    } catch (err) {
      setBatchId(data);
    }
    setShowScanner(false);
    toast({
      title: "OR Code SCanned",
      description: "Batch ID captured Successfully",
    });
  };

  return (
    <div className="container py-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Verify Medicine Authenticity
          </h1>
          <p className="text-muted-foreground">
            Verify medicine with approval status and blockchain transaction history
          </p>
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
              <CardDescription>
                Enter the batch ID manually
              </CardDescription>
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
                      if (e.key === 'Enter') handleVerify();
                    }}
                  />
                </div>
                <Button
                  onClick={handleVerify}
                  className="w-full bg-gradient-primary"
                  disabled={loading}
                >
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
              <CardDescription>
                Scan QR code or upload image
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showScanner ? (
                <Button
                  onClick={() => setShowScanner(true)}
                  className="w-full"
                  variant="outline"
                  disabled={loading}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Open QR Scanner
                </Button>
              ) : (
                <div className="space-y-4">
                  <QRScanner
                    onScan={handleQRScan}
                    onClose={() => setShowScanner(false)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Verification Results */}
        {verificationResult && (
          <Card className={verificationResult.isAuthentic ? 'border-success' : 'border-destructive'}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {verificationResult.isAuthentic ? (
                    <CheckCircle className="h-6 w-6 text-success" />
                  ) : (
                    <XCircle className="h-6 w-6 text-destructive" />
                  )}
                  {verificationResult.isAuthentic ? 'Authentic Medicine' : 'Warning: Issues Found'}
                </CardTitle>
                <Badge variant={verificationResult.isAuthentic ? 'default' : 'destructive'}>
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
                      <Badge
                        variant={verificationResult.status === 'approved' ? 'default' : 'destructive'}
                        className="mt-1"
                      >
                        {verificationResult.status.toUpperCase()}
                      </Badge>
                    </div>
                    {verificationResult.approvalTxHash && (
                      <div>
                        <p className="text-sm text-muted-foreground">Approval TX</p>
                        <p className="font-mono text-xs mt-1">
                          {verificationResult.approvalTxHash.slice(0, 12)}...
                        </p>
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
                      <p className="font-medium">
                        {new Date(verificationResult.expiryDate).toLocaleDateString()}
                      </p>
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
                        <p className="font-mono text-xs">
                          {verificationResult.registrationTxHash.slice(0, 12)}...
                        </p>
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
                              {event.location && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Location: {event.location}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(event.timestamp).toLocaleString()}
                              </p>
                            </div>
                            {event.blockchainTxHash && (
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">TX Hash</p>
                                <p className="font-mono text-xs">
                                  {event.blockchainTxHash.slice(0, 10)}...
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No distribution events recorded yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Verify;
