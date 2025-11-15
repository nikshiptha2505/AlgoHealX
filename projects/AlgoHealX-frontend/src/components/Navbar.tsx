import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { WalletSelector } from './WalletSelector';
import { Button } from './ui/button';
import { Shield, Wallet, LogOut, Menu, X } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { accountAddress, isConnected, disconnectWallet } = useWallet();
  const { user, logout } = useAuth();
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    disconnectWallet();
    logout();
    navigate('/login');
  };

  // Show different navigation based on auth status
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  const authenticatedLinks = user ? [
    { path: /${user.role}, label: 'Dashboard' },
    { path: '/verify', label: 'Verify' },
  ] : [];

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to={user ? /${user.role} : '/login'} className="flex items-center gap-2 font-bold text-xl">
            <Shield className="h-6 w-6 text-primary" />
            <span>AlgoHealX</span>
          </Link>

          {/* Desktop Navigation */}
          {!isAuthPage && user && (
            <div className="hidden md:flex items-center gap-6">
              {authenticatedLinks.map((link) => (
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
            </div>
          )}

          {/* Desktop User Info & Logout */}
          {!isAuthPage && (
            <div className="hidden md:block">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                  </div>
                  {isConnected && (
                    <div className="text-xs font-mono bg-primary/10 px-2 py-1 rounded">
                      {accountAddress?.slice(0, 6)}...{accountAddress?.slice(-4)}
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button onClick={() => navigate('/login')}>
                  <Wallet className="mr-2 h-4 w-4" />
                  Login
                </Button>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          {!isAuthPage && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && !isAuthPage && (
          <div className="md:hidden border-t bg-background">
            <div className="container px-4 py-4 space-y-3">
              {user && authenticatedLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t">
                {user ? (
                  <div className="space-y-2">
                    <div className="text-sm px-3 py-2 bg-muted rounded-md">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                      {isConnected && (
                        <div className="text-xs font-mono mt-1">
                          {accountAddress?.slice(0, 6)}...{accountAddress?.slice(-4)}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => {
                      navigate('/login');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Login
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <WalletSelector
        open={showWalletSelector}
        onOpenChange={setShowWalletSelector}
      />
    </>
  );
};

export default Navbar;
