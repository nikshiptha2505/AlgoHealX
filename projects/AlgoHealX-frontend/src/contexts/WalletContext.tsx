import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import { DeflyWalletConnect } from '@blockshake/defly-connect';
import LuteConnect from 'lute-connect';

export type WalletType = 'pera' | 'defly' | 'lute';

interface WalletInstance {
  connect: () => Promise<string[] | any>;
  disconnect: () => void;
  reconnectSession?: () => Promise<string[]>;
  signTransaction?: (txnGroup: any, signerAddress?: string) => Promise<Uint8Array[]>;
  signTransactions?: (txns: any[], indexesToSign?: number[]) => Promise<Uint8Array[]>;
}

interface WalletContextType {
  accountAddress: string | null;
  isConnected: boolean;
  connectWallet: (walletType: WalletType) => Promise<void>;
  disconnectWallet: () => void;
  activeWallet: WalletType | null;
  walletInstance: WalletInstance | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Initialize wallet instances
const peraWallet = new PeraWalletConnect();
const deflyWallet = new DeflyWalletConnect();
const luteWallet = new LuteConnect();

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [activeWallet, setActiveWallet] = useState<WalletType | null>(null);
  const [walletInstance, setWalletInstance] = useState<WalletInstance | null>(null);

  useEffect(() => {
    // Try to reconnect to previous session
    const reconnect = async () => {
      try {
        // Try Pera first
        const peraAccounts = await peraWallet.reconnectSession();
        if (peraAccounts && peraAccounts.length) {
          setAccountAddress(peraAccounts[0]);
          setActiveWallet('pera');
          setWalletInstance(peraWallet);
          return;
        }
      } catch (e) {
        console.log('No Pera session');
      }

      try {
        // Try Defly
        const deflyAccounts = await deflyWallet.reconnectSession();
        if (deflyAccounts && deflyAccounts.length) {
          setAccountAddress(deflyAccounts[0]);
          setActiveWallet('defly');
          setWalletInstance(deflyWallet);
          return;
        }
      } catch (e) {
        console.log('No Defly session');
      }
    };

    reconnect();

    // Set up disconnect listeners
    peraWallet.connector?.on('disconnect', () => {
      if (activeWallet === 'pera') {
        setAccountAddress(null);
        setActiveWallet(null);
        setWalletInstance(null);
      }
    });

    deflyWallet.connector?.on('disconnect', () => {
      if (activeWallet === 'defly') {
        setAccountAddress(null);
        setActiveWallet(null);
        setWalletInstance(null);
      }
    });
  }, []);

  const connectWallet = async (walletType: WalletType) => {
    try {
      let accounts: string[];
      let instance: WalletInstance;

      switch (walletType) {
        case 'pera':
          accounts = await peraWallet.connect();
          instance = peraWallet;
          break;
        case 'defly':
          accounts = await deflyWallet.connect();
          instance = deflyWallet;
          break;
        case 'lute':
          // Lute requires genesisID, using Algorand testnet
          const genesisID = 'testnet-v1.0';
          const luteAccounts = await luteWallet.connect(genesisID);
          accounts = Array.isArray(luteAccounts) ? luteAccounts : [luteAccounts];
          instance = {
            connect: async () => {
              const accounts = await luteWallet.connect(genesisID);
              return Array.isArray(accounts) ? accounts : [accounts];
            },
            disconnect: () => {
              // Lute doesn't have a disconnect method, handle locally
              setAccountAddress(null);
              setActiveWallet(null);
              setWalletInstance(null);
            },
            signTransactions: async (txns: any[], indexesToSign?: number[]) => {
              // Use Lute's signTxns method
              return await (luteWallet as any).signTxns(txns, indexesToSign);
            },
          };
          break;
        default:
          throw new Error('Unsupported wallet type');
      }

      if (accounts && accounts.length) {
        setAccountAddress(accounts[0]);
        setActiveWallet(walletType);
        setWalletInstance(instance);
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    if (walletInstance) {
      walletInstance.disconnect();
      setAccountAddress(null);
      setActiveWallet(null);
      setWalletInstance(null);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        accountAddress,
        isConnected: !!accountAddress,
        connectWallet,
        disconnectWallet,
        activeWallet,
        walletInstance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};
