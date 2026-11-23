import { Bell, Heart, Home, ShoppingBag, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AdminDashboardView } from './components/AdminDashboardView';
import { BrandLogo } from './components/BrandLogo';
import { CartCheckoutDrawer } from './components/CartCheckoutDrawer';
import { DesktopStorefront } from './components/DesktopStorefront';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MobileStorefront } from './components/MobileStorefront';
import { LiveToastStack, NotificationDrawer } from './components/NotificationCenter';
import { OrdersAndAccountView } from './components/OrdersAndAccountView';
import { ProductDetailView } from './components/ProductDetailView';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider, useStore } from './context/StoreContext';
import type { FilterState, Product } from './types/ecommerce';

type ActiveSection = 'shop' | 'orders' | 'admin';

const INITIAL_FILTERS: FilterState = {
  search: '',
  category: 'Laptops',
  priceBand: 'all',
  color: 'All',
  inStockOnly: false,
  sortBy: 'featured',
};

function StorefrontShell() {
  const { user, isAdmin } = useAuth();
  const { products, cartCount, notifications, addToCart } = useStore();

  const [section, setSection] = useState<ActiveSection>('shop');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [detailMode, setDetailMode] = useState<'overview' | 'studio' | 'lookbook'>('overview');
  const [cartOpen, setCartOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      return { ...INITIAL_FILTERS, category: 'All' };
    }
    return INITIAL_FILTERS;
  });

  // Handle shared product deep-links (?product=<id>)
  useEffect(() => {
    if (typeof window === 'undefined' || products.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('product');
    if (sharedId && products.some((p) => p.id === sharedId)) {
      setSelectedProductId(sharedId);
    }
  }, [products]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) || null,
    [products, selectedProductId]
  );

  const filteredProducts = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const result = products.filter((p) => {
      if (filters.category !== 'All' && p.category !== filters.category) return false;
      if (filters.inStockOnly && p.stock <= 0) return false;
      if (filters.color !== 'All' && !p.colors.includes(filters.color)) return false;

      if (filters.priceBand === 'under150k' && p.price >= 150000) return false;
      if (filters.priceBand === '150kto750k' && (p.price < 150000 || p.price > 750000)) return false;
      if (filters.priceBand === 'over750k' && p.price <= 750000) return false;

      if (query) {
        const hay = `${p.title} ${p.subtitle} ${p.category} ${p.fabricSpecs} ${p.description}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }

      return true;
    });

    if (filters.sortBy === 'price-asc') {
      return [...result].sort((a, b) => a.price - b.price);
    }
    if (filters.sortBy === 'price-desc') {
      return [...result].sort((a, b) => b.price - a.price);
    }
    if (filters.sortBy === 'rating') {
      return [...result].sort((a, b) => b.rating - a.rating);
    }
    return result;
  }, [products, filters]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.readBy.includes(user.uid)).length,
    [notifications, user.uid]
  );

  const updateFilters = (patch: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const resetFilters = () => {
    setFilters({
      ...INITIAL_FILTERS,
      category: typeof window !== 'undefined' && window.innerWidth >= 768 ? 'All' : 'Laptops',
    });
  };

  const handleSelectProduct = (
    product: Product,
    mode: 'overview' | 'studio' | 'lookbook' = 'overview'
  ) => {
    setDetailMode(mode);
    setSelectedProductId(product.id);
    setSection('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickBuy = (product: Product) => {
    addToCart({
      productId: product.id,
      title: product.title,
      price: product.price,
      imageUrl: product.imageUrl,
      color: product.colors[0] || 'Space Gray',
      size: product.sizes[0] || 'Standard',
      style: product.styles[0] || 'Standard',
      quantity: 1,
    });
    setCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F5FFF4] text-[#474150]">
      {/* Desktop Top Navigation Bar — Strict 3-Zone Contract */}
      <header className="hidden md:flex sticky top-0 z-30 bg-[#F5FFF4]/95 backdrop-blur-md border-b border-[#9C99B8]/35 px-8 h-16 items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark + Logo */}
        <button
          type="button"
          onClick={() => {
            setSelectedProductId(null);
            setSection('shop');
          }}
          className="whitespace-nowrap shrink-0 flex items-center"
        >
          <BrandLogo />
        </button>

        {/* Zone 2: Single-Line Navigation Links */}
        <nav className="flex items-center gap-7 text-sm font-semibold text-[#474150]/75">
          <button
            type="button"
            onClick={() => {
              setSelectedProductId(null);
              setSection('shop');
            }}
            className={`whitespace-nowrap shrink-0 hover:text-[#474150] transition-colors ${
              section === 'shop' && !selectedProduct
                ? 'text-[#474150] font-bold underline underline-offset-8 decoration-[#FFBB00] decoration-2'
                : ''
            }`}
          >
            Catalog
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedProductId(null);
              setSection('orders');
            }}
            className={`whitespace-nowrap shrink-0 hover:text-[#474150] transition-colors ${
              section === 'orders'
                ? 'text-[#474150] font-bold underline underline-offset-8 decoration-[#FFBB00] decoration-2'
                : ''
            }`}
          >
            Orders
          </button>
          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="whitespace-nowrap shrink-0 hover:text-[#474150] transition-colors tabular-nums"
          >
            Alerts{unreadCount > 0 ? ` (${unreadCount})` : ''}
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedProductId(null);
              setSection('admin');
            }}
            className={`whitespace-nowrap shrink-0 hover:text-[#474150] transition-colors ${
              section === 'admin'
                ? 'text-[#474150] font-bold underline underline-offset-8 decoration-[#FFBB00] decoration-2'
                : ''
            }`}
          >
            {isAdmin ? 'Analytics' : 'Admin'}
          </button>
        </nav>

        {/* Zone 3: Single Primary Action */}
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="px-5 py-2 rounded-xl bg-[#FFBB00] hover:bg-[#E5A800] text-[#2E2935] text-xs font-bold transition-colors whitespace-nowrap shrink-0 tabular-nums shadow-xs"
        >
          Bag ({cartCount})
        </button>
      </header>

      {/* Main Active Viewport */}
      <main>
        {selectedProduct && section === 'shop' ? (
          <ProductDetailView
            key={selectedProduct.id}
            product={selectedProduct}
            initialMode={detailMode}
            onBack={() => setSelectedProductId(null)}
            onSelectProduct={(p, m) => handleSelectProduct(p, m || 'overview')}
            onOpenCartCheckout={() => setCartOpen(true)}
          />
        ) : section === 'orders' ? (
          <OrdersAndAccountView
            onSelectProduct={(p) => handleSelectProduct(p, 'overview')}
            onOpenAdmin={() => setSection('admin')}
          />
        ) : section === 'admin' ? (
          <AdminDashboardView />
        ) : (
          <>
            <MobileStorefront
              filteredProducts={filteredProducts}
              filters={filters}
              onUpdateFilters={updateFilters}
              onResetFilters={resetFilters}
              onSelectProduct={handleSelectProduct}
              onQuickBuy={handleQuickBuy}
            />
            <DesktopStorefront
              filteredProducts={filteredProducts}
              filters={filters}
              onUpdateFilters={updateFilters}
              onResetFilters={resetFilters}
              onSelectProduct={handleSelectProduct}
              onQuickBuy={handleQuickBuy}
            />
          </>
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (Hidden inside PDP sticky checkout bar) */}
      {!selectedProduct && (
        <nav
          aria-label="Mobile primary navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F5FFF4]/95 backdrop-blur-md border-t border-[#9C99B8]/35 h-16 px-6 grid grid-cols-4 items-center"
        >
          <button
            type="button"
            onClick={() => setSection('shop')}
            aria-label="Home"
            className="flex flex-col items-center justify-center min-h-[44px]"
          >
            <span
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                section === 'shop'
                  ? 'bg-[#474150] text-[#F5FFF4] shadow-sm'
                  : 'text-[#474150]/70'
              }`}
            >
              <Home className="w-5 h-5" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label="Shopping Bag"
            className="flex flex-col items-center justify-center min-h-[44px] relative text-[#474150]"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-1.5 right-4 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FFBB00] text-[#2E2935] text-[10px] font-bold flex items-center justify-center tabular-nums">
                {cartCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            aria-label="Notifications and Saved"
            className="flex flex-col items-center justify-center min-h-[44px] relative text-[#474150]"
          >
            {unreadCount > 0 ? <Bell className="w-5 h-5 text-[#474150]" /> : <Heart className="w-5 h-5" />}
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-4 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FFBB00] text-[#2E2935] text-[10px] font-bold flex items-center justify-center tabular-nums">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSection(section === 'orders' ? 'admin' : 'orders')}
            aria-label="Orders and Operations"
            className="flex flex-col items-center justify-center min-h-[44px]"
          >
            <span
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                section === 'orders' || section === 'admin'
                  ? 'bg-[#474150] text-[#F5FFF4]'
                  : 'text-[#474150]/70'
              }`}
            >
              <User className="w-5 h-5" />
            </span>
          </button>
        </nav>
      )}

      <CartCheckoutDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onViewOrders={() => {
          setSelectedProductId(null);
          setSection('orders');
        }}
      />

      <NotificationDrawer open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      <LiveToastStack />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StoreProvider>
          <StorefrontShell />
        </StoreProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
