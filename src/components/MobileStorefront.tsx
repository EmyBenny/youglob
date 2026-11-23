import {
  ArrowRight,
  Cpu,
  HardDrive,
  Headphones,
  Heart,
  Keyboard,
  Laptop,
  Monitor,
  Plus,
  Search,
  SlidersHorizontal,
  Usb,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import {
  COLOR_SWATCH_MAP,
  formatNaira,
  type CategoryType,
  type FilterState,
  type Product,
} from '../types/ecommerce';
import { BrandLogo } from './BrandLogo';
import { SafeImage } from './SafeImage';

interface MobileStorefrontProps {
  filteredProducts: Product[];
  filters: FilterState;
  onUpdateFilters: (patch: Partial<FilterState>) => void;
  onResetFilters: () => void;
  onSelectProduct: (product: Product, initialMode?: 'overview' | 'studio' | 'lookbook') => void;
  onQuickBuy: (product: Product) => void;
}

const CATEGORY_TABS: Array<{ id: CategoryType; label: string; icon: typeof Laptop }> = [
  { id: 'Laptops', label: 'Laptops', icon: Laptop },
  { id: 'Desktops', label: 'Desktops', icon: Cpu },
  { id: 'Monitors', label: 'Monitors', icon: Monitor },
  { id: 'Keyboards & Mice', label: 'Keyboards', icon: Keyboard },
  { id: 'Docks & Hubs', label: 'Docks', icon: Usb },
  { id: 'Storage & RAM', label: 'Storage', icon: HardDrive },
  { id: 'Audio & Webcams', label: 'Audio', icon: Headphones },
  { id: 'All', label: 'All', icon: SlidersHorizontal },
];

export function MobileStorefront({
  filteredProducts,
  filters,
  onUpdateFilters,
  onResetFilters,
  onSelectProduct,
  onQuickBuy,
}: MobileStorefrontProps) {
  const { products, addToCart } = useStore();
  const { profile, toggleWishlist } = useAuth();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const laptopProduct =
    products.find((p) => p.id === 'yg-probook-16-m4') ||
    products.find((p) => p.category === 'Laptops') ||
    products[0];
  const desktopProduct =
    products.find((p) => p.id === 'yg-workstation-tower-pro') ||
    products.find((p) => p.category === 'Desktops') ||
    products[0];
  const spotlightProduct =
    products.find((p) => p.id === 'yg-mech-keyboard-combo') ||
    products.find((p) => p.id === 'yg-32-4k-studio-monitor') ||
    products[0];

  const hasActiveSearchOrFilter =
    filters.search.trim().length > 0 ||
    filters.priceBand !== 'all' ||
    filters.color !== 'All' ||
    filters.inStockOnly ||
    (filters.category !== 'Laptops' && filters.category !== 'All') ||
    filters.category === 'All';

  const allColors = Array.from(new Set(products.flatMap((p) => p.colors))).slice(0, 6);

  return (
    <div className="md:hidden pb-24 bg-[#F5FFF4] min-h-screen">
      {/* Top Search Bar + Brand Wordmark */}
      <div className="px-4 pt-4 pb-3 bg-[#F5FFF4]">
        <div className="flex items-center justify-between mb-3 px-1">
          <BrandLogo compact />
          <span className="text-[11px] font-semibold text-[#474150]/70">
            Laptops · Desktops · Gear
          </span>
        </div>

        <div className="flex items-center gap-2.5 bg-white rounded-2xl px-4 py-2 border border-[#9C99B8]/40 shadow-xs">
          <Search className="w-4 h-4 text-[#474150]/70 shrink-0" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => onUpdateFilters({ search: e.target.value })}
            placeholder="Find laptops, desktops, monitors, SSDs..."
            aria-label="Search YouGlob Technology catalog"
            className="flex-1 bg-transparent text-sm text-[#474150] placeholder:text-[#474150]/50 outline-none min-h-[36px]"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onUpdateFilters({ search: '' })}
              aria-label="Clear search"
              className="p-1 text-[#9C99B8] hover:text-[#474150]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setFilterSheetOpen(true)}
            aria-label="Open product filters"
            className="min-w-[36px] min-h-[36px] rounded-xl bg-[#9C99B8]/15 border border-[#9C99B8]/35 text-[#474150] flex items-center justify-center"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Horizontal Category Icon Strip */}
        <div className="flex items-center gap-3 mt-4 overflow-x-auto no-scrollbar pb-1">
          {CATEGORY_TABS.map((cat) => {
            const Icon = cat.icon;
            const active = filters.category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onUpdateFilters({ category: cat.id })}
                className="flex flex-col items-center gap-1.5 min-w-[58px] shrink-0 group"
              >
                <span
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                    active
                      ? 'bg-[#474150] text-[#FFBB00] shadow-sm'
                      : 'bg-white text-[#474150]/75 border border-[#9C99B8]/35 group-hover:text-[#474150]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </span>
                <span
                  className={`text-[11px] font-semibold whitespace-nowrap ${
                    active ? 'text-[#474150] font-bold' : 'text-[#474150]/70'
                  }`}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bento Showcase Grid */}
      {!hasActiveSearchOrFilter && laptopProduct && desktopProduct && spotlightProduct && (
        <div className="px-4 pt-2 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            {/* Left Light Card */}
            <div
              onClick={() => onSelectProduct(laptopProduct, 'studio')}
              className="bg-white rounded-2xl p-3.5 flex flex-col justify-between border border-[#9C99B8]/35 cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div className="flex items-start justify-between gap-1">
                <div>
                  <h2 className="font-display text-sm font-bold text-[#474150] leading-tight">
                    {laptopProduct.title}
                  </h2>
                  <p className="text-[11px] text-[#474150]/70 mt-0.5 line-clamp-1">
                    {laptopProduct.sizes[0]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart({
                      productId: laptopProduct.id,
                      title: laptopProduct.title,
                      price: laptopProduct.price,
                      imageUrl: laptopProduct.imageUrl,
                      color: laptopProduct.colors[0] || 'Space Gray',
                      size: laptopProduct.sizes[0] || 'Standard',
                      style: laptopProduct.styles[0] || 'Standard',
                      quantity: 1,
                    });
                  }}
                  aria-label={`Quick add ${laptopProduct.title}`}
                  className="w-7 h-7 rounded-lg bg-[#9C99B8]/15 hover:bg-[#FFBB00] text-[#474150] flex items-center justify-center shrink-0 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="my-2.5 h-28 rounded-xl overflow-hidden bg-[#F5FFF4]">
                <SafeImage
                  src={laptopProduct.imageUrl}
                  alt={laptopProduct.title}
                  fallbackTitle={laptopProduct.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickBuy(laptopProduct);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#FFBB00] text-[#2E2935] text-[11px] font-bold hover:bg-[#E5A800] transition-colors whitespace-nowrap"
                >
                  Buy Now
                </button>
                <span className="font-mono text-[11px] font-bold text-[#474150] tabular-nums">
                  {formatNaira(laptopProduct.price)}
                </span>
              </div>
            </div>

            {/* Right Column: Dark Charcoal Workstation Card + View All Button */}
            <div className="flex flex-col gap-2.5">
              <div
                onClick={() => onSelectProduct(desktopProduct, 'lookbook')}
                className="flex-1 bg-gradient-to-br from-[#474150] via-[#3A3442] to-[#2E2935] rounded-2xl p-3.5 flex flex-col justify-between text-[#F5FFF4] border border-[#9C99B8]/30 cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <h2 className="font-display text-sm font-bold text-[#F5FFF4] leading-tight">
                      {desktopProduct.title}
                    </h2>
                    <p className="text-[11px] text-[#FFBB00] mt-0.5 line-clamp-1 font-medium">
                      Pro Workstation
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void toggleWishlist(desktopProduct.id);
                    }}
                    aria-label="Toggle wishlist"
                    className="w-7 h-7 rounded-lg bg-[#F5FFF4]/10 flex items-center justify-center shrink-0"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        profile?.wishlist.includes(desktopProduct.id)
                          ? 'fill-[#FFBB00] text-[#FFBB00]'
                          : 'text-[#F5FFF4]'
                      }`}
                    />
                  </button>
                </div>

                <div className="my-2 h-24 rounded-xl overflow-hidden bg-[#2E2935] ring-1 ring-[#9C99B8]/30">
                  <SafeImage
                    src={desktopProduct.imageUrl}
                    alt={desktopProduct.title}
                    fallbackTitle={desktopProduct.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickBuy(desktopProduct);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#FFBB00] text-[#2E2935] text-[11px] font-bold hover:bg-[#E5A800] transition-colors whitespace-nowrap"
                  >
                    Buy Now
                  </button>
                  <span className="font-mono text-[11px] font-bold text-[#F5FFF4] tabular-nums">
                    {formatNaira(desktopProduct.price)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onUpdateFilters({ category: 'All' })}
                className="w-full min-h-[44px] rounded-xl bg-white border border-[#9C99B8]/40 text-[#474150] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#9C99B8]/10 transition-colors"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#996E00]" />
              </button>
            </div>
          </div>

          {/* Bottom Horizontal Spotlight Card */}
          <div
            onClick={() => onSelectProduct(spotlightProduct, 'overview')}
            className="bg-white rounded-2xl p-4 flex items-center justify-between gap-3 border border-[#9C99B8]/35 cursor-pointer active:scale-[0.99] transition-transform"
          >
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h2 className="font-display text-base font-bold text-[#474150] leading-snug">
                  {spotlightProduct.title}
                </h2>
                <p className="text-xs text-[#474150]/70 mt-0.5">
                  {spotlightProduct.category} ·{' '}
                  <span className="font-mono tabular-nums font-bold text-[#474150]">
                    {formatNaira(spotlightProduct.price)}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectProduct(spotlightProduct, 'overview');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#474150] text-[#F5FFF4] text-xs font-semibold hover:bg-[#383340] transition-colors whitespace-nowrap"
                >
                  Inspect Gear
                </button>
                <span className="text-[11px] font-mono text-[#996E00] font-bold tabular-nums">
                  {spotlightProduct.stock} left
                </span>
              </div>
            </div>

            <div className="w-28 h-24 rounded-xl overflow-hidden bg-[#F5FFF4] shrink-0 border border-[#9C99B8]/30">
              <SafeImage
                src={spotlightProduct.imageUrl}
                alt={spotlightProduct.title}
                fallbackTitle={spotlightProduct.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filtered / Full Catalog Feed */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-sm font-bold text-[#474150]">
            {hasActiveSearchOrFilter ? 'Filtered Hardware' : 'All YouGlob Collections'}
          </h3>
          {hasActiveSearchOrFilter && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs font-semibold text-[#996E00] underline underline-offset-2"
            >
              Reset Filters
            </button>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-[#9C99B8]/35 space-y-3">
            <p className="text-sm font-semibold text-[#474150]">No hardware matches your filters</p>
            <p className="text-xs text-[#474150]/70">Try clearing your search or switching categories.</p>
            <button
              type="button"
              onClick={onResetFilters}
              className="px-4 py-2 rounded-xl bg-[#FFBB00] text-[#2E2935] text-xs font-bold"
            >
              Show All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product, 'overview')}
                className="bg-white rounded-2xl p-3 border border-[#9C99B8]/35 hover:border-[#FFBB00] flex flex-col justify-between cursor-pointer transition-colors"
              >
                <div className="relative h-32 rounded-xl overflow-hidden bg-[#F5FFF4] mb-2.5">
                  <SafeImage
                    src={product.imageUrl}
                    alt={product.title}
                    fallbackTitle={product.title}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void toggleWishlist(product.id);
                    }}
                    aria-label={`Save ${product.title}`}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#F5FFF4]/95 backdrop-blur-xs flex items-center justify-center text-[#474150]"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        profile?.wishlist.includes(product.id) ? 'fill-[#FFBB00] text-[#474150]' : ''
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <p className="text-[11px] text-[#474150]/70 truncate">
                    {product.category} · {product.stock} in stock
                  </p>
                  <h4 className="font-display text-sm font-bold text-[#474150] truncate mt-0.5">
                    {product.title}
                  </h4>
                </div>

                <div className="flex items-center justify-between mt-2.5 gap-1.5">
                  <span className="font-mono text-xs font-bold text-[#474150] tabular-nums">
                    {formatNaira(product.price)}
                  </span>
                  <button
                    type="button"
                    disabled={product.stock <= 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickBuy(product);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#FFBB00] text-[#2E2935] text-[11px] font-bold disabled:opacity-40 whitespace-nowrap"
                  >
                    {product.stock > 0 ? 'Buy' : 'Out'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Multi-Facet Filter Bottom Sheet */}
      {filterSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#474150]/55 backdrop-blur-xs flex items-end"
          onClick={() => setFilterSheetOpen(false)}
        >
          <div
            className="bg-[#F5FFF4] w-full rounded-t-3xl p-6 space-y-5 max-h-[82vh] overflow-y-auto border-t border-[#9C99B8]/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 bg-[#9C99B8]/50 rounded-full mx-auto" />
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#474150]">Filter &amp; Sort</h3>
              <button
                type="button"
                onClick={onResetFilters}
                className="text-xs font-semibold text-[#996E00]"
              >
                Reset All
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#474150]">Price Range (Naira)</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'all', label: 'All Prices' },
                  { id: 'under150k', label: 'Under ₦150,000' },
                  { id: '150kto750k', label: '₦150k – ₦750k' },
                  { id: 'over750k', label: '₦750,000+' },
                ].map((band) => (
                  <button
                    key={band.id}
                    type="button"
                    onClick={() => onUpdateFilters({ priceBand: band.id as FilterState['priceBand'] })}
                    className={`min-h-[44px] rounded-xl text-xs font-semibold border transition-colors ${
                      filters.priceBand === band.id
                        ? 'bg-[#474150] text-[#F5FFF4] border-[#474150]'
                        : 'bg-white text-[#474150] border-[#9C99B8]/40'
                    }`}
                  >
                    {band.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#474150]">Chassis Finish</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateFilters({ color: 'All' })}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                    filters.color === 'All'
                      ? 'bg-[#474150] text-[#F5FFF4] border-[#474150]'
                      : 'bg-white text-[#474150] border-[#9C99B8]/40'
                  }`}
                >
                  All Finishes
                </button>
                {allColors.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => onUpdateFilters({ color: col })}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
                      filters.color === col
                        ? 'bg-[#474150] text-[#F5FFF4] border-[#474150]'
                        : 'bg-white text-[#474150] border-[#9C99B8]/40'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/15"
                      style={{ backgroundColor: COLOR_SWATCH_MAP[col] || '#9C99B8' }}
                    />
                    {col}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#474150]">Sort Order</p>
              <select
                value={filters.sortBy}
                onChange={(e) => onUpdateFilters({ sortBy: e.target.value as FilterState['sortBy'] })}
                className="w-full min-h-[44px] rounded-xl border border-[#9C99B8]/40 bg-white px-3 text-sm text-[#474150]"
              >
                <option value="featured">Featured Hardware</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            <label className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-[#474150]">In Stock Only</span>
              <input
                type="checkbox"
                checked={filters.inStockOnly}
                onChange={(e) => onUpdateFilters({ inStockOnly: e.target.checked })}
                className="w-5 h-5 accent-[#474150]"
              />
            </label>

            <button
              type="button"
              onClick={() => setFilterSheetOpen(false)}
              className="w-full min-h-[48px] rounded-xl bg-[#FFBB00] text-[#2E2935] text-sm font-bold"
            >
              Show {filteredProducts.length} Result{filteredProducts.length === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
