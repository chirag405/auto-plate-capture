
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Demo', href: '/demo' },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'About', href: '/about' },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="bg-brand-blue text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link to="/" className="-m-1.5 p-1.5 flex items-center space-x-2">
            <span className="text-2xl font-bold">PlateAI</span>
          </Link>
        </div>
        <div className="flex lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-brand-lightBlue"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </Button>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`text-sm font-semibold leading-6 transition-colors ${
                location.pathname === item.href
                  ? 'text-brand-accent'
                  : 'text-white hover:text-brand-accent'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <Link to="/demo">
            <Button className="bg-brand-accent hover:bg-opacity-90">
              Try Now
            </Button>
          </Link>
        </div>
      </nav>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-brand-blue">
          <div className="fixed inset-0 flex">
            <div className="w-full">
              <div className="flex h-16 items-center justify-between px-6">
                <Link to="/" className="-m-1.5 p-1.5 flex items-center space-x-2">
                  <span className="text-2xl font-bold">PlateAI</span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-brand-lightBlue"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6" aria-hidden="true" />
                </Button>
              </div>
              <div className="mt-6 flow-root px-6">
                <div className="space-y-6 py-6">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`block py-3 text-base font-semibold leading-7 ${
                        location.pathname === item.href
                          ? 'text-brand-accent'
                          : 'text-white hover:text-brand-accent'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
                <div className="mt-6">
                  <Link 
                    to="/demo"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button className="w-full bg-brand-accent hover:bg-opacity-90">
                      Try Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
