import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Package, QrCode as QrCodeIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import algosdk from 'algosdk';
import { getAlgodClient, waitForConfirmation } from '@/lib/algorand';

interface MedicineBatch {
  drugName: string;
  batchId: string;
  manufacturer: string;
  manufactureDate: string;
  expiryDate: string;
  quantity: string;
}

const Producer = () => {
  const { accountAddress, isConnected, walletInstance, activeWallet } = useWallet();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [appId, setAppId] = useState<string | null>(null);

  const [formData, setFormData] = useState<MedicineBatch>({
    drugName: '',
    batchId: '',
    manufacturer: '',
    manufactureDate: '',
    expiryDate: '',
    quantity: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !accountAddress || !walletInstance) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to register a batch',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    setQrCodeData(null);
    setTxHash(null);
    setAppId(null);

    try {
      // Step 1: Create and send payment transaction (0.02 Algos fee)
      const algodClient = new algosdk.Algodv2(
        "",
        "https://testnet-api.algonode.cloud",
        ""
      );
      const params = await algodClient.getTransactionParams().do();

      // 0.02 Algos = 20,000 microAlgos
      const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: accountAddress!,
        receiver: accountAddress!, // Sending to self as a registration fee
        amount: 20000,
        suggestedParams: params,
        note: new Uint8Array(
          Buffer.from(Medicine Registration: ${formData.batchId})
        ),
      });
      console.log("flag 1");

      let signedTxn;
      // Sign transaction based on wallet type
      if (walletInstance.signTransactions) {
        // Lute wallet API - expects array of transactions
        const signedTxns = await walletInstance.signTransactions([
          [{ txn: paymentTxn }],
        ]);
        signedTxn = signedTxns[0];
      } else if (walletInstance.signTransaction) {
        // Pera/Defly wallet API - expects grouped transactions
        const signedTxns = await walletInstance.signTransaction([
          [{ txn: paymentTxn }],
        ]);
        signedTxn = signedTxns[0];
      } else {
        throw new Error("Wallet does not support transaction signing");
      }
      console.log("flag2");
      // Send transaction
      const txResponse = await algodClient.sendRawTransaction(signedTxn).do();
      const txId = txResponse.txid;
      console.log("Transaction sent with ID:", txId);

      // Wait for confirmation with increased rounds and better error handling
      try {
        const maxRoundsToWait = 10; // Increased from default 4-5 to 10 rounds
        const confirmedTxn = await algosdk.waitForConfirmation(
          algodClient,
          txId,
          maxRoundsToWait
        );
        console.log(
          "Payment transaction confirmed in round:",
          confirmedTxn["confirmed-round"]
        );
        console.log("Transaction ID:", txId);
        console.log("Check your transaction at: https://lora.algokit.io/testnet/transaction/" + txId);
      } catch (error) {
        console.error("Transaction confirmation error:", error);
        console.error("Transaction ID:", txId);
        console.error(
          "Check your transaction at: https://lora.algokit.io/testnet/transaction/" + txId
        );
        throw new Error(
          Transaction ${txId} not confirmed after ${10} rounds. Check the explorer link above for details.
        );
      }
      toast({
        title: "Payment Confirmed",
        description: "0.02 Algos registration fee paid successfully",
      });

      // Step 2: Call backend function to register medicine
      const { data, error } = await supabase.functions.invoke(
        "register-medicine",
        {
          body: {
            batchId: formData.batchId,
            drugName: formData.drugName,
            manufacturer: formData.manufacturer,
            manufactureDate: formData.manufactureDate,
            expiryDate: formData.expiryDate,
            quantity: formData.quantity,
            producerWallet: accountAddress,
            paymentTxId: txId,
          },
        }
      );

      if (error) {
        console.error("Backend error:", error);
        throw error;
      }

      console.log("Registration response:", data);

      if (data.qrCodeImage) {
        setQrCodeData(data.qrCodeImage);
      }
      if (data.transactionHash) {
        setTxHash(data.transactionHash);
      }
      if (data.appId) {
        setAppId(data.appId);
      }

      toast({
        title: "Batch Registered Successfully",
        description: Batch ${formData.batchId} has been recorded on the blockchain,
      });

      // Reset form
      setFormData({
        drugName: "",
        batchId: "",
        manufacturer: "",
        manufactureDate: "",
        expiryDate: "",
        quantity: "",
      });
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'Failed to register batch. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="container py-20">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Please connect your Pera Wallet to access the producer dashboard
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Producer Dashboard
          </h1>
          <p className="text-muted-foreground">
            Register new medicine batches on the blockchain
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Register Medicine Batch</CardTitle>
              <CardDescription>
                Fill in the details to create a new batch record
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="drugName">Drug Name</Label>
                  <Input
                    id="drugName"
                    name="drugName"
                    value={formData.drugName}
                    onChange={handleInputChange}
                    placeholder="e.g., Paracetamol 500mg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batchId">Batch ID</Label>
                  <Input
                    id="batchId"
                    name="batchId"
                    value={formData.batchId}
                    onChange={handleInputChange}
                    placeholder="e.g., BATCH-2025-001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer Name</Label>
                  <Input
                    id="manufacturer"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    placeholder="Company name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manufactureDate">Manufacture Date</Label>
                    <Input
                      id="manufactureDate"
                      name="manufactureDate"
                      type="date"
                      value={formData.manufactureDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      name="expiryDate"
                      type="date"
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="Number of units"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering on Blockchain...
                    </>
                  ) : (
                    'Register Batch'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {qrCodeData && (
              <Card className="border-success shadow-verified">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCodeIcon className="h-5 w-5 text-success" />
                    Generated QR Code
                  </CardTitle>
                  <CardDescription>
                    Attach this QR code to your medicine packaging
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <img src={qrCodeData} alt="Batch QR Code" className="mb-4 rounded-lg" />
                  {txHash && (
                    <div className="w-full space-y-2">
                      <div className="p-4 bg-success-light rounded-lg">
                        <p className="text-sm font-medium mb-1">Transaction Hash:</p>
                        <p className="text-xs font-mono text-muted-foreground break-all">
                          {txHash}
                        </p>
                      </div>
                      {appId && (
                        <div className="p-4 bg-primary/10 rounded-lg">
                          <p className="text-sm font-medium mb-1">Blockchain App ID:</p>
                          <p className="text-xs font-mono text-muted-foreground break-all">
                            {appId}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.download = qr-${formData.batchId || 'batch'}.png;
                      link.href = qrCodeData;
                      link.click();
                    }}
                  >
                    Download QR Code
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-2">
                  <span className="flex-shrink-0 font-semibold text-primary">1.</span>
                  <p>Fill in all medicine batch details accurately</p>
                </div>
                <div className="flex gap-2">
                  <span className="flex-shrink-0 font-semibold text-primary">2.</span>
                  <p>Submit to generate QR code and blockchain record</p>
                </div>
                <div className="flex gap-2">
                  <span className="flex-shrink-0 font-semibold text-primary">3.</span>
                  <p>Download and attach QR code to packaging</p>
                </div>
                <div className="flex gap-2">
                  <span className="flex-shrink-0 font-semibold text-primary">4.</span>
                  <p>Wait for government verification approval</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Producer;
