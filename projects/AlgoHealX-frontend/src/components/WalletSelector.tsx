import { useState } from 'react';
import { useWallet, type WalletType } from '@/contexts/WalletContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

interface WalletOption {
  id: WalletType;
  name: string;
  description: string;
}

const walletOptions: WalletOption[] = [
  {
    id: 'pera',
    name: 'Pera Wallet (prefered)',
    description: 'Most popular Algorand wallet',
  },
  {
    id: 'defly',
    name: 'Defly Wallet',
    description: 'Fast and secure Algorand wallet',
  },
  {
    id: 'lute',
    name: 'Lute Wallet',
    description: 'Simple and elegant Algorand wallet',
  },
];

interface WalletSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WalletSelector = ({ open, onOpenChange }: WalletSelectorProps) => {
  const { connectWallet } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async (walletType: WalletType) => {
    setIsConnecting(true);
    try {
      await connectWallet(walletType);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Select Wallet
          </DialogTitle>
          <DialogDescription>
            Choose your preferred Algorand wallet to connect
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {walletOptions.map((wallet) => (
            <Button
              key={wallet.id}
              variant="outline"
              className="w-full justify-start h-auto py-4 px-4"
              onClick={() => handleConnect(wallet.id)}
              disabled={isConnecting}
            >
              <div className="text-left">
                <div className="font-semibold">{wallet.name}</div>
                <div className="text-sm text-muted-foreground">
                  {wallet.description}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
