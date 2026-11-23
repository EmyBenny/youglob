import {
  ChevronLeft,
  ChevronRight,
  Cpu,
  Heart,
  Layers,
  Palette,
  Plus,
  RotateCw,
  Share2,
  Star,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { COLOR_SWATCH_MAP, formatNaira, type Product } from '../types/ecommerce';
import { SafeImage } from './SafeImage';
import { ShareSheet } from './ShareSheet';

interface ProductDetailViewProps {
  product: Product;
  initialMode?: 'overview' | 'studio' | 'lookbook';
  onBack: () => void;
  onSelectProduct: (product: Product, mode?: 'overview' | 'studio' | 'lookbook') => void;
  onOpenCartCheckout: () => void;
}

export function ProductDetailView({
  product,
  initialMode = 'overview',
  onBack,
  onSelectProduct,
  onOpenCartCheckout,
}: ProductDetailViewProps) {
  const { products, reviews, addToCart, addReview, pushLocalToast } = useStore();
  const { profile, toggleWishlist } = useAuth();

  const [viewMode, setViewMode] = useState<'overview' | 'studio' | 'lookbook'>(initialMode);
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || 'Space Gray');
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'Standard');
  const [selectedStyle, setSelectedStyle] = useState(product.styles[0] || 'Standard');
  const [attrTab, setAttrTab] = useState<'colors' | 'size' | 'styles'>('colors');
  const [infoTab, setInfoTab] = useState<'pairing' | 'about' | 'reviews'>('about');
  const [rotationDeg, setRotationDeg] = useState(0);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [specGuideOpen, setSpecGuideOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const gallery = useMemo(() => {
    const imgs = [product.imageUrl, ...product.galleryImages].filter(Boolean);
    return Array.from(new Set(imgs));
  }, [product.imageUrl, product.galleryImages]);

  const activeImage = gallery[activeGalleryIndex % gallery.length] || product.imageUrl;

  const relatedProducts = useMemo(
    () => products.filter((p) => p.id !== product.id).slice(0, 3),
    [products, product.id]
  );

  const productReviews = useMemo(
    () => reviews.filter((r) => r.productId === product.id),
    [reviews, product.id]
  );

  const nextProduct = () => {
    const idx = products.findIndex((p) => p.id === product.id);
    const next = products[(idx + 1) % products.length];
    if (next) {
      setActiveGalleryIndex(0);
      setRotationDeg(0);
      setSelectedColor(next.colors[0] || 'Space Gray');
      setSelectedSize(next.sizes[0] || 'Standard');
      setSelectedStyle(next.styles[0] || 'Standard');
      onSelectProduct(next, viewMode);
    }
  };

  const handleAddToCart = (openCheckoutImmediately = false) => {
    if (product.stock <= 0) {
      pushLocalToast({
        title: 'Out of Stock',
        message: 'This hardware item is currently awaiting restock.',
        tone: 'rose',
      });
      return;
    }
    addToCart({
      productId: product.id,
      title: product.title,
      price: product.price,
      imageUrl: product.imageUrl,
      color: selectedColor,
      size: selectedSize,
      style: selectedStyle,
      quantity: 1,
    });
    if (openCheckoutImmediately) {
      onOpenCartCheckout();
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      await addReview(product.id, reviewRating, reviewComment);
      setReviewComment('');
      setReviewRating(5);
    } catch (err) {
      pushLocalToast({
        title: 'Review Notice',
        message: err instanceof Error ? err.message : 'Unable to post review.',
        tone: 'amber',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const isWishlisted = profile?.wishlist.includes(product.id) ?? false;

  return (
    <div className="bg-[#F5FFF4] min-h-screen pb-28 md:pb-16">
      {/* Top Action Bar */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-4 pb-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl text-sm font-semibold text-[#474150] hover:bg-white transition-colors whitespace-nowrap"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {/* Inspection Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-white border border-[#9C99B8]/40 rounded-xl">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'studio', label: '360°' },
            { id: 'lookbook', label: 'Gallery' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setViewMode(tab.id as 'overview' | 'studio' | 'lookbook')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                viewMode === tab.id
                  ? 'bg-[#474150] text-[#F5FFF4] shadow-xs'
                  : 'text-[#474150]/75 hover:text-[#474150]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            aria-label="Share product"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-white hover:bg-[#9C99B8]/15 text-[#474150] border border-[#9C99B8]/40 flex items-center justify-center transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextProduct}
            className="hidden sm:inline-flex min-h-[44px] px-3.5 rounded-xl text-xs font-semibold text-[#474150] hover:bg-white items-center gap-1 whitespace-nowrap"
          >
            Next Model
            <ChevronRight className="w-3.5 h-3.5 text-[#996E00]" />
          </button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* MODE 1: Dark Charcoal Showcase + Spec Configurator + Related Gear */}
        {viewMode === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 bg-gradient-to-br from-[#474150] via-[#3A3442] to-[#2E2935] rounded-3xl p-6 md:p-8 text-[#F5FFF4] relative overflow-hidden border border-[#9C99B8]/30">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-6 space-y-4 z-10">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#FFBB00]">
                    <span>{product.category}</span>
                    <span className="text-[#9C99B8]">·</span>
                    <span className="tabular-nums">
                      {product.stock > 0 ? `${product.stock} in stock` : 'Sold Out'}
                    </span>
                  </div>

                  <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-balance">
                    {product.title}
                  </h1>

                  <div className="space-y-0.5">
                    <span className="font-mono text-2xl sm:text-3xl font-extrabold tabular-nums text-[#F5FFF4] block">
                      {formatNaira(product.price)}
                    </span>
                    <span className="text-xs text-[#C7C5DA]">{selectedSize} · {selectedColor}</span>
                  </div>

                  <button
                    type="button"
                    disabled={product.stock <= 0}
                    onClick={() => handleAddToCart(true)}
                    className="px-6 py-3 rounded-xl bg-[#FFBB00] hover:bg-[#E5A800] text-[#2E2935] font-display text-sm font-bold transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    Buy Now
                  </button>
                </div>

                <div className="col-span-6 relative">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#2E2935] ring-1 ring-[#9C99B8]/30">
                    <SafeImage
                      src={activeImage}
                      alt={product.title}
                      fallbackTitle={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white rounded-2xl p-5 border border-[#9C99B8]/35 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'colors', label: 'Finish', icon: Palette },
                    { id: 'size', label: 'Config', icon: Cpu },
                    { id: 'styles', label: 'Edition', icon: Layers },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const active = attrTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setAttrTab(tab.id as 'colors' | 'size' | 'styles')}
                        className={`min-h-[44px] rounded-xl px-3 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors ${
                          active
                            ? 'bg-[#474150] text-[#F5FFF4] shadow-sm'
                            : 'bg-[#9C99B8]/15 text-[#474150] hover:bg-[#9C99B8]/25'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {attrTab === 'colors' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#474150]">Selected: {selectedColor}</span>
                      <span className="text-[#474150]/70">Chassis Finishes</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {product.colors.map((color) => {
                        const active = selectedColor === color;
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setSelectedColor(color)}
                            title={color}
                            aria-label={`Select finish ${color}`}
                            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-transform ${
                              active ? 'border-[#FFBB00] scale-110' : 'border-[#9C99B8]/50'
                            }`}
                          >
                            <span
                              className="w-7 h-7 rounded-full border border-black/10"
                              style={{ backgroundColor: COLOR_SWATCH_MAP[color] || '#9C99B8' }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {attrTab === 'size' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#474150]">Configuration: {selectedSize}</span>
                      <button
                        type="button"
                        onClick={() => setSpecGuideOpen(true)}
                        className="text-[#996E00] font-semibold hover:underline"
                      >
                        Hardware Matrix
                      </button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`min-h-[44px] px-3.5 rounded-xl text-xs font-bold border transition-colors ${
                            selectedSize === size
                              ? 'bg-[#474150] text-[#F5FFF4] border-[#474150]'
                              : 'bg-[#F5FFF4] text-[#474150] border-[#9C99B8]/40 hover:border-[#FFBB00]'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {attrTab === 'styles' && (
                  <div className="space-y-2.5">
                    <p className="text-xs font-semibold text-[#474150]">Edition / Build: {selectedStyle}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {product.styles.map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setSelectedStyle(style)}
                          className={`min-h-[44px] px-4 rounded-xl text-xs font-semibold border transition-colors ${
                            selectedStyle === style
                              ? 'bg-[#474150] text-[#F5FFF4] border-[#474150]'
                              : 'bg-[#F5FFF4] text-[#474150] border-[#9C99B8]/40 hover:border-[#FFBB00]'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Compatible & Related Hardware */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-bold text-[#474150]">Recommended Hardware</h2>
                  <button
                    type="button"
                    onClick={nextProduct}
                    className="text-xs font-semibold text-[#996E00] inline-flex items-center gap-1"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {relatedProducts.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => onSelectProduct(rel, 'overview')}
                      className="rounded-xl bg-white border border-[#9C99B8]/35 p-3 flex items-center justify-between gap-2 cursor-pointer hover:border-[#FFBB00] transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-display text-xs font-bold text-[#474150] truncate">{rel.title}</p>
                        <p className="font-mono text-xs text-[#474150]/75 font-semibold mt-0.5 tabular-nums">
                          {formatNaira(rel.price)}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart({
                              productId: rel.id,
                              title: rel.title,
                              price: rel.price,
                              imageUrl: rel.imageUrl,
                              color: rel.colors[0] || 'Space Gray',
                              size: rel.sizes[0] || 'Standard',
                              style: rel.styles[0] || 'Standard',
                              quantity: 1,
                            });
                          }}
                          aria-label={`Quick add ${rel.title}`}
                          className="mt-2 w-7 h-7 rounded-lg bg-[#FFBB00] text-[#2E2935] flex items-center justify-center"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="w-16 h-14 rounded-lg overflow-hidden bg-[#F5FFF4] shrink-0">
                        <SafeImage
                          src={rel.imageUrl}
                          alt={rel.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Inline Purchase Module */}
              <div className="hidden md:flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => void toggleWishlist(product.id)}
                  aria-label="Toggle wishlist"
                  className="min-w-[48px] min-h-[48px] rounded-xl bg-white border border-[#9C99B8]/40 flex items-center justify-center text-[#474150] hover:bg-[#9C99B8]/15"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-[#FFBB00] text-[#474150]' : ''}`} />
                </button>
                <button
                  type="button"
                  disabled={product.stock <= 0}
                  onClick={() => handleAddToCart(false)}
                  className="flex-1 min-h-[48px] rounded-xl bg-white border border-[#9C99B8]/50 text-[#474150] font-display text-sm font-bold hover:bg-[#9C99B8]/15 transition-colors disabled:opacity-40"
                >
                  Add to Bag
                </button>
                <button
                  type="button"
                  disabled={product.stock <= 0}
                  onClick={() => handleAddToCart(true)}
                  className="flex-1 min-h-[48px] rounded-xl bg-[#FFBB00] text-[#2E2935] font-display text-sm font-bold hover:bg-[#E5A800] transition-colors disabled:opacity-40"
                >
                  Buy Now · {formatNaira(product.price)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: 360 Studio Inspection + Specs / Pairing / Reviews */}
        {viewMode === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 space-y-4">
              <div className="text-center">
                <p className="text-xs font-semibold text-[#996E00]">
                  YouGlob {product.category} Inspection
                </p>
                <h1 className="font-display text-2xl font-bold text-[#474150] mt-1">{product.title}</h1>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#9C99B8]/35 flex flex-col items-center">
                <div className="w-72 h-56 sm:w-96 sm:h-72 rounded-2xl overflow-hidden bg-[#F5FFF4] flex items-center justify-center">
                  <div
                    className="w-full h-full transition-transform duration-150"
                    style={{
                      transform: `perspective(900px) rotateY(${rotationDeg}deg) scale(${
                        1 - Math.abs(rotationDeg) * 0.001
                      })`,
                    }}
                  >
                    <SafeImage
                      src={activeImage}
                      alt={`${product.title} 360 preview`}
                      fallbackTitle={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="w-full max-w-xs mt-5 space-y-2">
                  <div className="h-3 rounded-full border border-[#9C99B8]/35 bg-[#F5FFF4] flex items-center px-2 relative">
                    <input
                      type="range"
                      min={-45}
                      max={45}
                      value={rotationDeg}
                      onChange={(e) => {
                        const deg = Number(e.target.value);
                        setRotationDeg(deg);
                        if (gallery.length > 1) {
                          const idx = Math.floor(((deg + 45) / 91) * gallery.length);
                          setActiveGalleryIndex(Math.min(gallery.length - 1, Math.max(0, idx)));
                        }
                      }}
                      aria-label="Rotate hardware angle"
                      className="w-full accent-[#474150] cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#474150]/70">
                    <RotateCw className="w-3.5 h-3.5 text-[#996E00]" />
                    <span>Drag slider to inspect chassis angles &amp; gallery</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                {gallery.slice(0, 4).map((img, i) => (
                  <button
                    key={`${img}-${i}`}
                    type="button"
                    onClick={() => setActiveGalleryIndex(i)}
                    className={`h-20 rounded-xl overflow-hidden border-2 bg-white transition-all ${
                      activeGalleryIndex === i ? 'border-[#FFBB00] shadow-sm' : 'border-transparent'
                    }`}
                  >
                    <SafeImage
                      src={img}
                      alt={`${product.title} view ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-[#9C99B8]/35 space-y-5">
              <div className="flex items-center justify-between border-b border-[#9C99B8]/30">
                {[
                  { id: 'pairing', label: 'Compatible Gear' },
                  { id: 'about', label: 'Specifications' },
                  { id: 'reviews', label: `Reviews (${productReviews.length || product.reviewCount})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setInfoTab(tab.id as 'pairing' | 'about' | 'reviews')}
                    className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                      infoTab === tab.id
                        ? 'border-[#FFBB00] text-[#474150]'
                        : 'border-transparent text-[#474150]/65 hover:text-[#474150]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {infoTab === 'about' && (
                <div className="space-y-4">
                  <p className="text-sm text-[#474150]/80 leading-relaxed">{product.description}</p>
                  <div className="rounded-xl bg-[#F5FFF4] p-4 space-y-2 border border-[#9C99B8]/35">
                    <p className="text-xs font-bold text-[#474150]">Technical Architecture</p>
                    <p className="font-mono text-xs text-[#474150]/85">{product.fabricSpecs}</p>
                    <div className="flex items-center gap-4 pt-2 text-xs text-[#474150]">
                      <span className="font-mono tabular-nums font-bold">{formatNaira(product.price)}</span>
                      <span className="text-[#9C99B8]">·</span>
                      <span className="tabular-nums">{product.stock} units available</span>
                    </div>
                  </div>
                </div>
              )}

              {infoTab === 'pairing' && (
                <div className="space-y-3">
                  <p className="text-xs text-[#474150]/70">
                    Pair your setup with compatible YouGlob Technology hardware:
                  </p>
                  {relatedProducts.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onSelectProduct(item, 'studio')}
                      className="flex items-center justify-between p-3 rounded-xl border border-[#9C99B8]/35 hover:border-[#FFBB00] cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <SafeImage
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-14 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="text-sm font-semibold text-[#474150]">{item.title}</p>
                          <p className="font-mono text-xs text-[#474150]/70 tabular-nums">
                            {formatNaira(item.price)} · {item.stock} left
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#996E00]" />
                    </div>
                  ))}
                </div>
              )}

              {infoTab === 'reviews' && (
                <div className="space-y-4">
                  <form
                    onSubmit={(e) => void handleReviewSubmit(e)}
                    className="bg-[#F5FFF4] p-4 rounded-xl space-y-3 border border-[#9C99B8]/35"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#474150]">Write a Review</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setReviewRating(num)}
                            aria-label={`Rate ${num} stars`}
                          >
                            <Star
                              className={`w-4 h-4 ${
                                num <= reviewRating ? 'fill-[#FFBB00] text-[#FFBB00]' : 'text-[#9C99B8]/50'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share thermals, keyboard feel, display clarity, and battery notes..."
                      className="w-full rounded-xl border border-[#9C99B8]/40 bg-white p-2.5 text-xs text-[#474150] outline-none focus:border-[#474150]"
                    />
                    <button
                      type="submit"
                      disabled={submittingReview || !reviewComment.trim()}
                      className="px-4 py-2 rounded-xl bg-[#FFBB00] text-[#2E2935] text-xs font-bold disabled:opacity-50"
                    >
                      {submittingReview ? 'Posting...' : 'Post Review'}
                    </button>
                  </form>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto">
                    {productReviews.length === 0 ? (
                      <p className="text-xs text-[#474150]/70 py-4 text-center">
                        Rated {product.rating.toFixed(1)}/5 across {product.reviewCount} verified buyers.
                      </p>
                    ) : (
                      productReviews.map((rev) => (
                        <div key={rev.id} className="p-3.5 rounded-xl border border-[#9C99B8]/35 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#474150]">{rev.userName}</span>
                            <span className="text-xs font-mono text-[#996E00] font-bold tabular-nums">
                              {rev.rating}/5 ★
                            </span>
                          </div>
                          <p className="text-xs text-[#474150]/80">{rev.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="hidden md:flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={product.stock <= 0}
                  onClick={() => handleAddToCart(false)}
                  className="flex-1 min-h-[48px] rounded-xl border border-[#9C99B8]/50 text-[#474150] font-display text-sm font-bold hover:bg-[#9C99B8]/15"
                >
                  Add to Bag
                </button>
                <button
                  type="button"
                  disabled={product.stock <= 0}
                  onClick={() => handleAddToCart(true)}
                  className="flex-1 min-h-[48px] rounded-xl bg-[#FFBB00] text-[#2E2935] font-display text-sm font-bold hover:bg-[#E5A800]"
                >
                  Buy Now · {formatNaira(product.price)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODE 3: Hardware Gallery & Configuration */}
        {viewMode === 'lookbook' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#474150] to-[#2E2935] border border-[#9C99B8]/30 p-8 flex flex-col items-center">
              <div className="w-full max-w-lg aspect-[4/3] rounded-2xl overflow-hidden bg-white shadow-lg">
                <SafeImage
                  src={gallery[gallery.length - 1] || product.imageUrl}
                  alt={`${product.title} gallery`}
                  fallbackTitle={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#9C99B8]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`min-h-[40px] px-3 rounded-xl text-xs font-bold transition-colors ${
                        selectedSize === size
                          ? 'bg-[#474150] text-[#F5FFF4]'
                          : 'bg-[#9C99B8]/15 text-[#474150] hover:bg-[#9C99B8]/25'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setSpecGuideOpen(true)}
                  className="text-xs font-semibold text-[#996E00] hover:underline"
                >
                  Hardware Spec Matrix
                </button>
              </div>

              <div className="space-y-1.5 sm:text-right">
                <div className="flex items-center gap-2 sm:justify-end">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      aria-label={`Choose finish ${color}`}
                      className={`w-7 h-7 rounded-full border-2 ${
                        selectedColor === color ? 'border-[#FFBB00] scale-110' : 'border-[#9C99B8]/50'
                      }`}
                      style={{ backgroundColor: COLOR_SWATCH_MAP[color] || '#9C99B8' }}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium text-[#474150]/70">Finish · {selectedColor}</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={() => handleAddToCart(false)}
                className="flex-1 min-h-[48px] rounded-xl bg-white border border-[#9C99B8]/50 text-[#474150] font-display text-sm font-bold hover:bg-[#9C99B8]/15"
              >
                Add to Bag
              </button>
              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={() => handleAddToCart(true)}
                className="flex-1 min-h-[48px] rounded-xl bg-[#FFBB00] text-[#2E2935] font-display text-sm font-bold hover:bg-[#E5A800]"
              >
                Buy Now · {formatNaira(product.price)}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 text-[#474150]">
              <button
                type="button"
                onClick={() => setViewMode('studio')}
                aria-label="Previous view"
                className="min-w-[44px] min-h-[44px] rounded-xl hover:bg-white flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                {(['overview', 'studio', 'lookbook'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setViewMode(m)}
                    aria-label={`Switch to ${m}`}
                    className={`h-2 rounded-full transition-all ${
                      viewMode === m ? 'w-5 bg-[#FFBB00]' : 'w-2 bg-[#9C99B8]/50'
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={nextProduct}
                aria-label="Next product"
                className="min-w-[44px] min-h-[44px] rounded-xl hover:bg-white flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Mobile Bottom Dual Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F5FFF4]/95 backdrop-blur-md border-t border-[#9C99B8]/35 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          disabled={product.stock <= 0}
          onClick={() => handleAddToCart(false)}
          className="flex-1 min-h-[46px] rounded-xl border border-[#9C99B8]/50 bg-white text-[#474150] font-display text-sm font-bold disabled:opacity-40"
        >
          Add to Bag
        </button>
        <button
          type="button"
          disabled={product.stock <= 0}
          onClick={() => handleAddToCart(true)}
          className="flex-1 min-h-[46px] rounded-xl bg-[#FFBB00] text-[#2E2935] font-display text-sm font-bold disabled:opacity-40"
        >
          {product.stock > 0 ? 'Buy Now' : 'Sold Out'}
        </button>
      </div>

      {specGuideOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#474150]/55 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSpecGuideOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#9C99B8]/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#474150]">YouGlob Hardware Matrix</h3>
              <button
                type="button"
                onClick={() => setSpecGuideOpen(false)}
                className="text-xs font-semibold text-[#996E00]"
              >
                Done
              </button>
            </div>
            <table className="w-full text-xs text-left tabular-nums">
              <thead>
                <tr className="border-b border-[#9C99B8]/30 text-[#474150]/70">
                  <th className="py-2">System Tier</th>
                  <th className="py-2">Memory</th>
                  <th className="py-2">Storage</th>
                  <th className="py-2">Warranty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#9C99B8]/20 text-[#474150] font-medium">
                {[
                  ['AeroBook Pro 16', '32GB LPDDR5X', '1TB PCIe 4.0', '24 Months'],
                  ['Forge X15 Creator', '32GB DDR5', '1TB Gen4 NVMe', '24 Months'],
                  ['Titan Z9 Tower', '64GB DDR5', '2TB Gen4 NVMe', '36 Months'],
                  ['Cube Mini Pro', '32GB DDR5', '1TB NVMe', '24 Months'],
                  ['VisionPro 32" 4K', '90W USB-C PD', 'Built-in KVM', '36 Months'],
                  ['Thunderbolt 4 Dock', '40Gbps Host', '14 Ports', '24 Months'],
                ].map(([tier, mem, stor, war]) => (
                  <tr key={tier}>
                    <td className="py-2.5 font-bold">{tier}</td>
                    <td className="py-2.5">{mem}</td>
                    <td className="py-2.5">{stor}</td>
                    <td className="py-2.5">{war}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {shareOpen && <ShareSheet product={product} onClose={() => setShareOpen(false)} />}
    </div>
  );
}
