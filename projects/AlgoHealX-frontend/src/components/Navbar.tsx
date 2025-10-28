import { Shield, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { Link, useLocation } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

const Navbar = () => {
  const { accountAddress, isConnected, connectWallet, disconnectWallet } = useWallet();
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/producer', label: 'Producer' },
    { path: '/regulator', label: 'Regulator' },
    { path: '/distributor', label: 'Distributor' },
    { path: '/verify', label: 'Verify' },
  ];

  const NavItems = () => (
    <>
      {navLinks.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          className={`text-sm font-medium transition-colors hover:text-primary ${
            location.pathname === link.path
              ? 'text-primary'
              : 'text-muted-foreground'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AlgoHealX
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <NavItems />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isConnected ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 rounded-lg border bg-muted px-3 py-1.5">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-mono text-foreground">
                  {accountAddress?.slice(0, 6)}...{accountAddress?.slice(-4)}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={disconnectWallet}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              onClick={connectWallet}
              className="bg-gradient-primary shadow-medical"
            >
              Connect Wallet
            </Button>
          )}

          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 mt-6">
                <NavItems />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
