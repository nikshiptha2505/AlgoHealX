import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import algosdk from 'algosdk';

interface Medicine {
  id: string;
  batch_id: string;
  drug_name: string;
  manufacturer: string;
  manufacture_date: string;
  expiry_date: string;
  quantity: number;
  producer_wallet: string;
  status: string;
  created_at: string;
}

const Regulator = () => {
  const { accountAddress, isConnected, walletInstance } = useWallet();
  const { toast } = useToast();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [complianceScores, setComplianceScores] = useState<{ [key: string]: number }>({});
  const [rejectionReasons, setRejectionReasons] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchMedicines = async () => {
      const { data } = await supabase
        .from('medicines')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setMedicines(data);
    };

    fetchMedicines();

    // Real-time subscription
    const channel = supabase
      .channel('regulator-medicines')
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

  const sendBlockchainTransaction = async () => {
    if (!walletInstance) throw new Error('Wallet not initialized');

    try {
      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
      const params = await algodClient.getTransactionParams().do();

      // Create 0.02 ALGO payment transaction
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: accountAddress!,
        receiver: accountAddress!, // Self-payment as proof
        amount: 20000, // 0.02 ALGO in microAlgos
        suggestedParams: params,
        note: new Uint8Array(Buffer.from('Regulator Approval'))
      });

      const txnGroup = [{ txn }];

      // Sign with wallet - handle both APIs
      let signedTxn: Uint8Array[];
      if (walletInstance.signTransactions) {
        // Lute wallet API - expects array of transactions
        signedTxn = await walletInstance.signTransactions([txn]);
      } else if (walletInstance.signTransaction) {
        // Pera/Defly wallet API - expects grouped transactions
        signedTxn = await walletInstance.signTransaction([txnGroup]);
      } else {
        throw new Error('Wallet does not support transaction signing');
      }

      const response = await algodClient.sendRawTransaction(signedTxn).do();
      console.log("Transaction ID:", response.txid);
      console.log("Check your transaction at: https://lora.algokit.io/testnet/transaction/" + response.txid);

      return response.txid || txn.txID();
    } catch (error) {
      console.error('Blockchain transaction error:', error);
      throw error;
    }
  };

  const handleApprove = async (medicine: Medicine) => {
    if (!isConnected || !accountAddress) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet',
        variant: 'destructive',
      });
      return;
    }

    setLoading(medicine.id);

    try {
      // Send blockchain transaction
      const txHash = await sendBlockchainTransaction();

      // Call backend
      const { error } = await supabase.functions.invoke('approve-medicine', {
        body: {
          batchId: medicine.batch_id,
          regulatorWallet: accountAddress,
          status: 'approved',
          complianceScore: complianceScores[medicine.id] || 95,
        },
      });

      if (error) throw error;

      toast({
        title: 'Batch Approved',
        description: `Transaction: ${txHash}`,
      });
    } catch (error) {
      console.error('Approval error:', error);
      toast({
        title: 'Approval Failed',
        description: error instanceof Error ? error.message : 'Failed to approve',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (medicine: Medicine) => {
    if (!isConnected || !accountAddress) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet',
        variant: 'destructive',
      });
      return;
    }

    const reason = rejectionReasons[medicine.id];
    if (!reason) {
      toast({
        title: 'Rejection Reason Required',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    setLoading(medicine.id);

    try {
      const { error } = await supabase.functions.invoke('approve-medicine', {
        body: {
          batchId: medicine.batch_id,
          regulatorWallet: accountAddress,
          status: 'rejected',
          rejectionReason: reason,
        },
      });

      if (error) throw error;

      toast({
        title: 'Batch Rejected',
        description: 'Medicine batch has been rejected',
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Rejection error:', error);
      toast({
        title: 'Rejection Failed',
        description: error instanceof Error ? error.message : 'Failed to reject',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="container py-20">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Please connect your Pera Wallet to access the regulator dashboard
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const pendingMedicines = medicines.filter(m => m.status === 'pending');
  const approvedMedicines = medicines.filter(m => m.status === 'approved');

  return (
    <div className="container py-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Regulator Dashboard
          </h1>
          <p className="text-muted-foreground">
            Review and verify medicine batches with blockchain transactions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-3xl font-bold text-warning">{pendingMedicines.length}</p>
                </div>
                <Clock className="h-10 w-10 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-3xl font-bold text-success">{approvedMedicines.length}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Batches</p>
                  <p className="text-3xl font-bold text-primary">{medicines.length}</p>
                </div>
                <ShieldCheck className="h-10 w-10 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Batches */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Pending Verification</h2>
          <div className="space-y-4">
            {pendingMedicines.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No pending batches for review
                </CardContent>
              </Card>
            ) : (
              pendingMedicines.map((medicine) => (
                <Card key={medicine.id} className="border-warning/50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{medicine.drug_name}</CardTitle>
                        <CardDescription className="mt-1">
                          Batch ID: {medicine.batch_id} | Manufacturer: {medicine.manufacturer}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-warning-light text-warning-foreground border-warning">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Manufactured</p>
                        <p className="font-medium">{new Date(medicine.manufacture_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expires</p>
                        <p className="font-medium">{new Date(medicine.expiry_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Quantity</p>
                        <p className="font-medium">{medicine.quantity} units</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Producer</p>
                        <p className="font-medium font-mono text-xs">{medicine.producer_wallet.slice(0, 10)}...</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Compliance Score (0-100)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={complianceScores[medicine.id] || 95}
                            onChange={(e) => setComplianceScores({
                              ...complianceScores,
                              [medicine.id]: parseInt(e.target.value)
                            })}
                          />
                        </div>
                        <div>
                          <Label>Rejection Reason</Label>
                          <Input
                            placeholder="Optional"
                            value={rejectionReasons[medicine.id] || ''}
                            onChange={(e) => setRejectionReasons({
                              ...rejectionReasons,
                              [medicine.id]: e.target.value
                            })}
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApprove(medicine)}
                          className="flex-1 bg-gradient-success"
                          disabled={loading === medicine.id}
                        >
                          {loading === medicine.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve (0.02 ALGO)
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleReject(medicine)}
                          variant="destructive"
                          className="flex-1"
                          disabled={loading === medicine.id}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Approved Batches */}
        {approvedMedicines.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Approved Batches</h2>
            <div className="space-y-4">
              {approvedMedicines.map((medicine) => (
                <Card key={medicine.id} className="border-success/50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{medicine.drug_name}</CardTitle>
                        <CardDescription className="mt-1">
                          Batch ID: {medicine.batch_id} | Manufacturer: {medicine.manufacturer}
                        </CardDescription>
                      </div>
                      <Badge className="bg-success text-success-foreground">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approved
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Regulator;
