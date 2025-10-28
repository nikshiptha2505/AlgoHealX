import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';

interface WalletContextType {
  accountAddress: string | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  peraWallet: PeraWalletConnect | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const peraWallet = new PeraWalletConnect();

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize wallet connection
    const initWallet = async () => {
      try {
        // Reconnect to session if exists
        const accounts = await peraWallet.reconnectSession();
        if (accounts && accounts.length) {
          setAccountAddress(accounts[0]);
        }
      } catch (e) {
        // Session doesn't exist or reconnection failed, which is fine
        console.log('No existing session');
      } finally {
        setIsInitialized(true);
      }
    };

    initWallet();

    // Set up disconnect listener
    peraWallet.connector?.on('disconnect', () => {
      setAccountAddress(null);
    });
  }, []);

  const connectWallet = async () => {
    try {
      const accounts = await peraWallet.connect();
      setAccountAddress(accounts[0]);
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  const disconnectWallet = () => {
    peraWallet.disconnect();
    setAccountAddress(null);
  };

  return (
    <WalletContext.Provider
      value={{
        accountAddress,
        isConnected: !!accountAddress,
        connectWallet,
        disconnectWallet,
        peraWallet,
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
