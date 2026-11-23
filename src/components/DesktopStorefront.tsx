import { Heart, Plus, Search, Share2, SlidersHorizontal, X } from 'lucide-react';
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
import { SafeImage } from './SafeImage';
import { ShareSheet } from './ShareSheet';

interface DesktopStorefrontProps {
  filteredProducts: Product[];
  filters: FilterState;
  onUpdateFilters: (patch: Partial<FilterState>) => void;
  onResetFilters: () => void;
  onSelectProduct: (product: Product, initialMode?: 'overview' | 'studio' | 'lookbook') => void;
  onQuickBuy: (product: Product) => void;
}

const CATEGORIES: CategoryType[] = [
  'All',
  'Laptops',
  'Desktops',
  'Monitors',
  'Keyboards & Mice',
  'Docks & Hubs',
  'Storage & RAM',
  'Audio & Webcams',
];

export function DesktopStorefront({
  filteredProducts,
  filters,
  onUpdateFilters,
  onResetFilters,
  onSelectProduct,
  onQuickBuy,
}: DesktopStorefrontProps) {
  const { products, addToCart } = useStore();
  const { profile, toggleWishlist } = useAuth();
  const [shareProduct, setShareProduct] = useState<Product | null>(null);

  const heroProduct = products.find((p) => p.id === 'yg-probook-16-m4') || products[0];
  const allColors = Array.from(new Set(products.flatMap((p) => p.colors))).slice(0, 6);

  return (
    <div className="hidden md:block bg-[#F5FFF4] pb-20">
      {/* Section 1: Storefront Split Hero */}
      {heroProduct && (
        <section className="max-w-7xl mx-auto px-8 pt-8 pb-10">
          <div className="grid grid-cols-12 gap-8 items-stretch">
            {/* Left Copy & Flagship Spotlight */}
            <div className="col-span-6 bg-white rounded-3xl p-10 border border-[#9C99B8]/35 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#474150]/75">
                  <span>YouGlob Technology Hardware</span>
                  <span aria-hidden="true" className="text-[#9C99B8]">·</span>
                  <span className="tabular-nums text-[#996E00] font-bold">
                    {heroProduct.stock} units in stock
                  </span>
                </div>

                <h1 className="font-display text-4xl xl:text-5xl font-bold text-[#474150] leading-[1.08] text-balance">
                  Laptops, Desktops &amp; Pro Accessories
                </h1>

                <p className="text-base text-[#474150]/80 leading-relaxed max-w-lg">
                  Precision workstation laptops, custom desktop towers, 4K IPS displays, mechanical keyboards, and Thunderbolt docks built for engineers, creators, and modern offices.
                </p>
              </div>

              <div className="pt-8 space-y-5">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-3xl font-bold text-[#474150] tabular-nums">
                    {formatNaira(heroProduct.price)}
                  </span>
                  <span className="text-sm text-[#474150]/70">
                    {heroProduct.title} · {heroProduct.sizes[0]}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onQuickBuy(heroProduct)}
                    className="px-7 py-3.5 rounded-xl bg-[#FFBB00] hover:bg-[#E5A800] text-[#2E2935] font-display text-sm font-bold transition-colors whitespace-nowrap shadow-xs"
                  >
                    Buy Now
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectProduct(heroProduct, 'studio')}
                    className="px-7 py-3.5 rounded-xl bg-[#9C99B8]/15 hover:bg-[#9C99B8]/25 text-[#474150] border border-[#9C99B8]/40 font-display text-sm font-bold transition-colors whitespace-nowrap"
                  >
                    Inspect 360° Studio
                  </button>
                </div>
              </div>
            </div>

            {/* Right Deep Charcoal Hardware Showcase */}
            <div
              onClick={() => onSelectProduct(heroProduct, 'lookbook')}
              className="col-span-6 bg-gradient-to-br from-[#474150] via-[#3A3442] to-[#2E2935] rounded-3xl p-8 text-[#F5FFF4] border border-[#9C99B8]/30 grid grid-cols-12 gap-6 items-stretch cursor-pointer group overflow-hidden"
            >
              <div className="col-span-5 flex flex-col justify-between py-2">
                <div>
                  <p className="text-xs font-semibold text-[#FFBB00]">
                    Workstation Series
                  </p>
                  <h2 className="font-display text-2xl font-bold mt-2 leading-tight text-[#F5FFF4]">
                    {heroProduct.title}
                  </h2>
                  <p className="text-sm text-[#C7C5DA] mt-2 leading-relaxed">
                    {heroProduct.fabricSpecs}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-bold text-[#FFBB00] group-hover:translate-x-1 transition-transform">
                  Explore Hardware Gallery →
                </span>
              </div>
              <div className="col-span-7 rounded-2xl overflow-hidden bg-[#2E2935] min-h-[340px] ring-1 ring-[#9C99B8]/30">
                <SafeImage
                  src={heroProduct.imageUrl}
                  alt={heroProduct.title}
                  fallbackTitle={heroProduct.title}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section 2: Search, Multi-Facet Filter Toolbar & 3-Column Product Grid */}
      <section id="catalog-section" className="max-w-7xl mx-auto px-8 space-y-6">
        <div className="bg-white rounded-2xl p-5 border border-[#9C99B8]/35 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Search Input */}
            <div className="flex items-center gap-2.5 bg-[#F5FFF4] border border-[#9C99B8]/40 focus-within:border-[#474150] rounded-xl px-4 py-2 flex-1 min-w-[240px] max-w-sm">
              <Search className="w-4 h-4 text-[#474150]/70 shrink-0" />
              <input
                type="search"
                value={filters.search}
                onChange={(e) => onUpdateFilters({ search: e.target.value })}
                placeholder="Search laptops, desktops, monitors, SSDs..."
                aria-label="Search YouGlob Technology catalog"
                className="flex-1 bg-transparent text-sm text-[#474150] placeholder:text-[#474150]/50 outline-none"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => onUpdateFilters({ search: '' })}
                  aria-label="Clear search"
                  className="text-[#9C99B8] hover:text-[#474150]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Segmented Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#9C99B8]/15 rounded-xl overflow-x-auto no-scrollbar max-w-full">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onUpdateFilters({ category: cat })}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    filters.category === cat
                      ? 'bg-[#474150] text-[#F5FFF4] shadow-xs'
                      : 'text-[#474150]/80 hover:text-[#474150]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#9C99B8]/25 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#474150]">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#996E00]" />
                Filters:
              </span>

              <select
                value={filters.priceBand}
                onChange={(e) => onUpdateFilters({ priceBand: e.target.value as FilterState['priceBand'] })}
                aria-label="Filter by price"
                className="rounded-lg border border-[#9C99B8]/40 bg-[#F5FFF4] px-3 py-2 text-xs font-medium text-[#474150]"
              >
                <option value="all">All Prices</option>
                <option value="under150k">Under ₦150,000</option>
                <option value="150kto750k">₦150,000 – ₦750,000</option>
                <option value="over750k">₦750,000+</option>
              </select>

              <div className="flex items-center gap-1.5 pl-2">
                <button
                  type="button"
                  onClick={() => onUpdateFilters({ color: 'All' })}
                  className={`px-2.5 py-1.5 rounded-lg font-medium border ${
                    filters.color === 'All'
                      ? 'border-[#FFBB00] bg-[#FFBB00]/20 text-[#474150] font-semibold'
                      : 'border-[#9C99B8]/40 text-[#474150]/75'
                  }`}
                >
                  All Finishes
                </button>
                {allColors.map((col) => (
                  <button
                    key={col}
                    type="button"
                    title={col}
                    aria-label={`Filter finish ${col}`}
                    onClick={() => onUpdateFilters({ color: filters.color === col ? 'All' : col })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      filters.color === col ? 'border-[#FFBB00] scale-110' : 'border-[#9C99B8]/60'
                    }`}
                    style={{ backgroundColor: COLOR_SWATCH_MAP[col] || '#9C99B8' }}
                  />
                ))}
              </div>

              <label className="inline-flex items-center gap-2 pl-2 cursor-pointer text-[#474150] font-medium">
                <input
                  type="checkbox"
                  checked={filters.inStockOnly}
                  onChange={(e) => onUpdateFilters({ inStockOnly: e.target.checked })}
                  className="accent-[#474150] w-4 h-4"
                />
                In Stock Only
              </label>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[#474150]/70 tabular-nums font-medium">
                {filteredProducts.length} item{filteredProducts.length === 1 ? '' : 's'}
              </span>
              <select
                value={filters.sortBy}
                onChange={(e) => onUpdateFilters({ sortBy: e.target.value as FilterState['sortBy'] })}
                aria-label="Sort products"
                className="rounded-lg border border-[#9C99B8]/40 bg-[#F5FFF4] px-3 py-2 text-xs font-medium text-[#474150]"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3-Column Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-14 text-center border border-[#9C99B8]/35 space-y-4">
            <p className="font-display text-xl font-bold text-[#474150]">No matching hardware found</p>
            <p className="text-sm text-[#474150]/70">Adjust your search keywords or clear active filters.</p>
            <button
              type="button"
              onClick={onResetFilters}
              className="px-6 py-2.5 rounded-xl bg-[#FFBB00] text-[#2E2935] text-sm font-bold hover:bg-[#E5A800]"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredProducts.map((product) => {
              const isWishlisted = profile?.wishlist.includes(product.id) ?? false;
              const lowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;
              return (
                <article
                  key={product.id}
                  onClick={() => onSelectProduct(product, 'overview')}
                  className="bg-white rounded-2xl p-5 border border-[#9C99B8]/35 hover:border-[#FFBB00] hover:-translate-y-0.5 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#F5FFF4] mb-4">
                      <SafeImage
                        src={product.imageUrl}
                        alt={product.title}
                        fallbackTitle={product.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShareProduct(product);
                          }}
                          aria-label={`Share ${product.title}`}
                          className="w-9 h-9 rounded-full bg-[#F5FFF4]/95 backdrop-blur-xs text-[#474150] hover:bg-[#FFBB00] hover:text-[#2E2935] flex items-center justify-center shadow-xs transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void toggleWishlist(product.id);
                          }}
                          aria-label={`Save ${product.title} to wishlist`}
                          className="w-9 h-9 rounded-full bg-[#F5FFF4]/95 backdrop-blur-xs text-[#474150] hover:bg-[#FFBB00] hover:text-[#2E2935] flex items-center justify-center shadow-xs transition-colors"
                        >
                          <Heart
                            className={`w-4 h-4 ${isWishlisted ? 'fill-[#FFBB00] text-[#474150]' : ''}`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#474150]/70">
                      <span className="font-semibold text-[#474150]">{product.category}</span>
                      <span aria-hidden="true" className="text-[#9C99B8]">·</span>
                      <span
                        className={`tabular-nums font-medium ${
                          product.stock === 0
                            ? 'text-rose-600'
                            : lowStock
                              ? 'text-[#996E00]'
                              : 'text-emerald-700'
                        }`}
                      >
                        {product.stock === 0
                          ? 'Out of Stock'
                          : lowStock
                            ? `Low Stock (${product.stock})`
                            : `${product.stock} in stock`}
                      </span>
                    </div>

                    <h3 className="font-display text-base font-bold text-[#474150] mt-1 truncate">
                      {product.title}
                    </h3>
                    <p className="text-xs text-[#474150]/70 mt-0.5 truncate">{product.subtitle}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#9C99B8]/25">
                    <span className="font-mono text-base font-bold text-[#474150] tabular-nums">
                      {formatNaira(product.price)}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={product.stock <= 0}
                        onClick={(e) => {
                          e.stopPropagation();
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
                        }}
                        aria-label={`Quick add ${product.title}`}
                        className="w-10 h-10 rounded-xl border border-[#9C99B8]/40 hover:bg-[#9C99B8]/20 text-[#474150] flex items-center justify-center disabled:opacity-40"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={product.stock <= 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickBuy(product);
                        }}
                        className="px-4 py-2 rounded-xl bg-[#FFBB00] hover:bg-[#E5A800] text-[#2E2935] text-xs font-bold transition-colors disabled:opacity-40 whitespace-nowrap"
                      >
                        {product.stock > 0 ? 'Buy Now' : 'Sold Out'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 3: YouGlob Technology Assurance Strip */}
      <section className="max-w-7xl mx-auto px-8 pt-12">
        <div className="bg-white rounded-2xl p-8 border border-[#9C99B8]/35 grid grid-cols-3 gap-8">
          <div>
            <p className="font-display text-lg font-bold text-[#474150]">Bench-Tested Hardware</p>
            <p className="text-sm text-[#474150]/75 mt-1.5 leading-relaxed">
              Every laptop, desktop tower, monitor, and NVMe drive is serial-verified with live warehouse stock sync.
            </p>
          </div>
          <div>
            <p className="font-display text-lg font-bold text-[#474150]">Secure Naira Checkout</p>
            <p className="text-sm text-[#474150]/75 mt-1.5 leading-relaxed">
              Card and express wallet authorizations are verified server-side in Naira (₦) with instant tax receipts.
            </p>
          </div>
          <div>
            <p className="font-display text-lg font-bold text-[#474150]">Insured Express Dispatch</p>
            <p className="text-sm text-[#474150]/75 mt-1.5 leading-relaxed">
              Real-time push notifications track your hardware from bench QC to doorstep delivery.
            </p>
          </div>
        </div>
      </section>

      {shareProduct && <ShareSheet product={shareProduct} onClose={() => setShareProduct(null)} />}
    </div>
  );
}
