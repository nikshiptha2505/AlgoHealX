import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Truck, ArrowRight, Package, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Medicine {
  id: string;
  batch_id: string;
  drug_name: string;
  manufacturer: string;
  status: string;
}

interface SupplyChainEvent {
  id: string;
  batch_id: string;
  event_type: string;
  sender_wallet: string;
  receiver_wallet: string;
  location: string;
  created_at: string;
}

const Distributor = () => {
  const { accountAddress, isConnected, walletInstance } = useWallet();
  const { toast } = useToast();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [destination, setDestination] = useState('');
  const [location, setLocation] = useState('');
  const [supplyChain, setSupplyChain] = useState<SupplyChainEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch approved medicines only
      const { data: medsData } = await supabase
        .from('medicines')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (medsData) setMedicines(medsData);

      // Fetch supply chain events
      const { data: eventsData } = await supabase
        .from('supply_chain_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (eventsData) setSupplyChain(eventsData);
    };

    fetchData();

    // Real-time subscriptions
    const medicinesChannel = supabase
      .channel('distributor-medicines')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medicines'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    const eventsChannel = supabase
      .channel('supply-chain-events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'supply_chain_events'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(medicinesChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, []);

  const sendBlockchainTransaction = async () => {
    if (!walletInstance) throw new Error('Wallet not initialized');

    try {
      const algosdk = (await import('algosdk')).default;
      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
      const params = await algodClient.getTransactionParams().do();

      // Create 0.01 ALGO payment transaction for distribution
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: accountAddress!,
        receiver: accountAddress!,
        amount: 10000, // 0.01 ALGO
        suggestedParams: params,
        note: new Uint8Array(Buffer.from('Medicine Distribution'))
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

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !accountAddress) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to log transfers',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Send blockchain transaction first
      const txHash = await sendBlockchainTransaction();

      const { error } = await supabase.functions.invoke('track-transfer', {
        body: {
          batchId: selectedBatch,
          senderWallet: accountAddress,
          receiverWallet: destination,
          location,
          eventType: 'transfer',
          blockchainTxHash: txHash,
        },
      });

      if (error) throw error;

      toast({
        title: 'Transfer Logged',
        description: Transaction: ${txHash.slice(0, 12)}...,
      });

      setSelectedBatch('');
      setDestination('');
      setLocation('');
    } catch (error) {
      console.error('Transfer error:', error);
      toast({
        title: 'Transfer Failed',
        description: error instanceof Error ? error.message : 'Failed to log transfer',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="container py-20">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Please connect your Pera Wallet to access the distributor dashboard
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const batchSupplyChain = supplyChain.filter(e => e.batch_id === selectedBatch);

  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Truck className="h-8 w-8 text-primary" />
            Distributor Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track and log approved medicine batch transfers
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Log Transfer</CardTitle>
              <CardDescription>
                Record the movement of approved medicine batches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTransfer} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="batch">Select Approved Batch</Label>
                  <Select value={selectedBatch} onValueChange={setSelectedBatch} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicines.map((med) => (
                        <SelectItem key={med.id} value={med.batch_id}>
                          {med.batch_id} - {med.drug_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination">Destination Wallet</Label>
                  <Input
                    id="destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Receiver's wallet address"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Bangalore, India"
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-gradient-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Logging Transfer...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Log Transfer
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supply Chain Timeline</CardTitle>
              <CardDescription>
                {selectedBatch ? Tracking: ${selectedBatch} : 'Select a batch to view timeline'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!selectedBatch ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Select a batch from the form to view its supply chain
                  </p>
                ) : batchSupplyChain.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No supply chain events recorded yet
                  </p>
                ) : (
                  batchSupplyChain.map((event, index) => (
                    <div key={event.id} className="relative pl-6 pb-4 border-l-2 border-primary/20 last:border-0">
                      <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-gradient-primary" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{event.sender_wallet.slice(0, 10)}...</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{event.receiver_wallet?.slice(0, 10)}...</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {event.location}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Distributor;
