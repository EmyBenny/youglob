import {
  BarChart3,
  Box,
  ImagePlus,
  Mail,
  Megaphone,
  Minus,
  PackageCheck,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatNaira, type CategoryType, type OrderStatus, type Product } from '../types/ecommerce';
import { BrandLogo, getStoredCustomLogo, setStoredCustomLogo } from './BrandLogo';

export function AdminDashboardView() {
  const {
    products,
    orders,
    emailLogs,
    adjustProductStock,
    upsertProduct,
    deleteProduct,
    updateOrderStatus,
    sendPromoBroadcast,
    refreshEmailLogs,
    pushLocalToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'analytics' | 'inventory' | 'orders' | 'communications'>('analytics');
  const [promoTitle, setPromoTitle] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [sendingPromo, setSendingPromo] = useState(false);

  const [newSkuModal, setNewSkuModal] = useState(false);
  const [skuTitle, setSkuTitle] = useState('');
  const [skuSubtitle, setSkuSubtitle] = useState('');
  const [skuCategory, setSkuCategory] = useState<Exclude<CategoryType, 'All'>>('Laptops');
  const [skuPrice, setSkuPrice] = useState('850000');
  const [skuStock, setSkuStock] = useState('12');
  const [skuDescription, setSkuDescription] = useState('');
  const [hasCustomLogo, setHasCustomLogo] = useState(() => Boolean(getStoredCustomLogo()));

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      pushLocalToast({
        title: 'Logo Too Large',
        message: 'Please select an image smaller than 1.5MB.',
        tone: 'amber',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setStoredCustomLogo(reader.result);
        setHasCustomLogo(true);
        pushLocalToast({
          title: 'Brand Logo Updated',
          message: 'Your YouGlob Technology logo is now live across the header.',
          tone: 'emerald',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setStoredCustomLogo(null);
    setHasCustomLogo(false);
    pushLocalToast({
      title: 'Default Emblem Restored',
      message: 'Reverted to default YouGlob Technology emblem.',
      tone: 'emerald',
    });
  };

  const analytics = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== 'cancelled');
    const grossRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
    const totalUnitsSold = validOrders.reduce(
      (sum, o) => sum + o.items.reduce((s, item) => s + item.quantity, 0),
      0
    );
    const totalInventoryUnits = products.reduce((sum, p) => sum + p.stock, 0);
    const lowStockProducts = products.filter((p) => p.stock <= p.lowStockThreshold);

    const revenueByCategory: Record<string, number> = {
      Laptops: 0,
      Desktops: 0,
      Monitors: 0,
      'Keyboards & Mice': 0,
      'Docks & Hubs': 0,
      'Storage & RAM': 0,
      'Audio & Webcams': 0,
    };

    for (const order of validOrders) {
      for (const item of order.items) {
        const prod = products.find((p) => p.id === item.productId);
        const cat = prod?.category || 'Laptops';
        revenueByCategory[cat] = (revenueByCategory[cat] || 0) + item.price * item.quantity;
      }
    }

    const maxCatRev = Math.max(1, ...Object.values(revenueByCategory));

    return {
      grossRevenue,
      orderCount: validOrders.length,
      totalUnitsSold,
      totalInventoryUnits,
      lowStockProducts,
      revenueByCategory,
      maxCatRev,
    };
  }, [orders, products]);

  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoTitle.trim() || !promoMessage.trim()) return;
    setSendingPromo(true);
    try {
      await sendPromoBroadcast(promoTitle, promoMessage);
      setPromoTitle('');
      setPromoMessage('');
      pushLocalToast({
        title: 'Promotion Pushed',
        message: 'Live alert delivered to all connected YouGlob Technology shoppers.',
        tone: 'emerald',
      });
    } finally {
      setSendingPromo(false);
    }
  };

  const handleAddSku = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = skuTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48);
    if (!id) return;

    const categoryImageMap: Record<Exclude<CategoryType, 'All'>, string> = {
      Laptops: '/src/assets/images/yg_probook_laptop_1795426268025.jpg',
      Desktops: '/src/assets/images/yg_tower_desktop_1795426267921.jpg',
      Monitors: '/src/assets/images/yg_ultrawide_monitor_1795426268309.jpg',
      'Keyboards & Mice': '/src/assets/images/yg_keyboard_mouse_1795426268605.jpg',
      'Docks & Hubs': '/src/assets/images/yg_dock_nvme_ssd_1795426267987.jpg',
      'Storage & RAM': '/src/assets/images/yg_dock_nvme_ssd_1795426267987.jpg',
      'Audio & Webcams': '/src/assets/images/yg_audio_webcam_1795426268441.jpg',
    };
    const defaultImg = categoryImageMap[skuCategory] || '/src/assets/images/yg_probook_laptop_1795426268025.jpg';

    const newProd: Omit<Product, 'createdAtMs' | 'updatedAtMs'> = {
      id: `yg-${id}-${Date.now().toString().slice(-4)}`,
      title: skuTitle.trim(),
      subtitle: skuSubtitle.trim() || 'YouGlob Technology Hardware Series',
      category: skuCategory,
      price: Math.max(1000, Number(skuPrice) || 850000),
      stock: Math.max(0, Math.round(Number(skuStock) || 12)),
      lowStockThreshold: 4,
      description:
        skuDescription.trim() ||
        'Serial-verified hardware supplied by YouGlob Technology with manufacturer warranty.',
      fabricSpecs: 'Factory Bench Tested · 24-Month YouGlob Hardware Warranty',
      colors: ['Space Gray', 'Obsidian Black', 'Anodized Silver'],
      sizes: ['16GB / 512GB', '32GB / 1TB'],
      styles: ['Standard Edition', 'Pro Bundle'],
      imageUrl: defaultImg,
      galleryImages: [defaultImg],
      featured: false,
      badge: 'New Arrival',
      rating: 4.9,
      reviewCount: 1,
    };

    await upsertProduct(newProd);
    setNewSkuModal(false);
    setSkuTitle('');
    setSkuSubtitle('');
    setSkuDescription('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 pb-28 space-y-6">
      {/* Header & Section Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#474150]">
            YouGlob Technology Operations
          </h1>
          <p className="text-xs text-[#474150]/70 mt-0.5">
            Live hardware inventory, Naira revenue analytics, branding, and customer notifications
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white border border-[#9C99B8]/35 rounded-xl overflow-x-auto no-scrollbar">
          {[
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'inventory', label: 'Inventory', icon: Box },
            { id: 'orders', label: 'Orders', icon: PackageCheck },
            { id: 'communications', label: 'Brand & Alerts', icon: Mail },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#474150] text-[#F5FFF4]'
                    : 'text-[#474150]/75 hover:text-[#474150] hover:bg-[#9C99B8]/15'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4-Column KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#9C99B8]/35">
          <p className="text-xs font-medium text-[#474150]/70">Gross Revenue</p>
          <p className="font-mono text-2xl font-bold text-[#474150] mt-1 tabular-nums">
            {formatNaira(analytics.grossRevenue)}
          </p>
          <p className="text-[11px] text-[#996E00] mt-1 tabular-nums font-semibold">
            {analytics.orderCount} verified order(s)
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#9C99B8]/35">
          <p className="text-xs font-medium text-[#474150]/70">Units Sold</p>
          <p className="font-mono text-2xl font-bold text-[#474150] mt-1 tabular-nums">
            {analytics.totalUnitsSold}
          </p>
          <p className="text-[11px] text-[#474150]/65 mt-1">Across hardware catalog</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#9C99B8]/35">
          <p className="text-xs font-medium text-[#474150]/70">Warehouse Stock</p>
          <p className="font-mono text-2xl font-bold text-[#474150] mt-1 tabular-nums">
            {analytics.totalInventoryUnits}
          </p>
          <p className="text-[11px] text-[#474150]/65 mt-1 tabular-nums">{products.length} active SKUs</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#9C99B8]/35">
          <p className="text-xs font-medium text-[#474150]/70">Low Stock Alerts</p>
          <p
            className={`font-mono text-2xl font-bold mt-1 tabular-nums ${
              analytics.lowStockProducts.length > 0 ? 'text-[#996E00]' : 'text-emerald-700'
            }`}
          >
            {analytics.lowStockProducts.length}
          </p>
          <p className="text-[11px] text-[#474150]/65 mt-1">
            {analytics.lowStockProducts.length > 0 ? 'Restock recommended' : 'All SKUs healthy'}
          </p>
        </div>
      </div>

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-[#9C99B8]/35 space-y-4">
            <h2 className="font-display text-base font-bold text-[#474150]">Revenue by Category</h2>
            <div className="space-y-3">
              {Object.entries(analytics.revenueByCategory).map(([category, rev]) => {
                const pct = Math.round((rev / analytics.maxCatRev) * 100);
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#474150]">{category}</span>
                      <span className="font-mono font-bold text-[#474150] tabular-nums">
                        {formatNaira(rev)}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[#9C99B8]/20 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#FFBB00] transition-all"
                        style={{ width: `${Math.max(rev > 0 ? 6 : 0, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#9C99B8]/35 space-y-4">
            <h2 className="font-display text-base font-bold text-[#474150]">Stock Health Watchlist</h2>
            {analytics.lowStockProducts.length === 0 ? (
              <p className="text-xs text-[#474150]/70 py-8 text-center">
                All YouGlob Technology SKUs are above their restock threshold.
              </p>
            ) : (
              <div className="divide-y divide-[#9C99B8]/25">
                {analytics.lowStockProducts.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#474150]">{p.title}</p>
                      <p className="text-xs text-[#996E00] font-medium tabular-nums">
                        {p.stock} left (threshold {p.lowStockThreshold})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void adjustProductStock(p.id, p.stock + 10)}
                      className="px-3 py-1.5 rounded-xl bg-[#F5FFF4] border border-[#9C99B8]/40 text-[#474150] text-xs font-bold hover:bg-[#9C99B8]/15"
                    >
                      +10 Restock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-[#9C99B8]/35 overflow-hidden">
          <div className="p-5 border-b border-[#9C99B8]/30 flex items-center justify-between gap-4">
            <h2 className="font-display text-base font-bold text-[#474150]">Live Warehouse Inventory</h2>
            <button
              type="button"
              onClick={() => setNewSkuModal(true)}
              className="px-4 py-2 rounded-xl bg-[#FFBB00] hover:bg-[#E5A800] text-[#2E2935] text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Hardware SKU
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5FFF4] text-[#474150]/75 border-b border-[#9C99B8]/30">
                <tr>
                  <th className="py-3 px-4 font-semibold">Hardware Model</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold text-right">Price</th>
                  <th className="py-3 px-4 font-semibold text-right">Stock</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#9C99B8]/20">
                {products.map((p) => {
                  const statusLabel =
                    p.stock === 0 ? 'Out of Stock' : p.stock <= p.lowStockThreshold ? 'Low Stock' : 'In Stock';
                  const statusClass =
                    p.stock === 0
                      ? 'text-rose-600'
                      : p.stock <= p.lowStockThreshold
                        ? 'text-[#996E00]'
                        : 'text-emerald-700';

                  return (
                    <tr key={p.id} className="hover:bg-[#F5FFF4]">
                      <td className="py-3 px-4 font-semibold text-[#474150]">{p.title}</td>
                      <td className="py-3 px-4 text-[#474150]/70">{p.category}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#474150]">
                        {formatNaira(p.price)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-[#474150]">
                        {p.stock}
                      </td>
                      <td className={`py-3 px-4 font-semibold ${statusClass}`}>{statusLabel}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void adjustProductStock(p.id, Math.max(0, p.stock - 1))}
                            aria-label={`Decrease ${p.title} stock`}
                            className="w-8 h-8 rounded-lg border border-[#9C99B8]/40 text-[#474150] flex items-center justify-center hover:bg-[#9C99B8]/15"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void adjustProductStock(p.id, p.stock + 5)}
                            aria-label={`Restock ${p.title}`}
                            className="px-2.5 h-8 rounded-lg bg-[#F5FFF4] border border-[#9C99B8]/40 text-[#474150] font-bold hover:bg-[#9C99B8]/15"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteProduct(p.id)}
                            aria-label={`Delete ${p.title}`}
                            className="w-8 h-8 rounded-lg text-[#9C99B8] hover:text-rose-600 flex items-center justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-[#9C99B8]/35 overflow-hidden">
          <div className="p-5 border-b border-[#9C99B8]/30">
            <h2 className="font-display text-base font-bold text-[#474150]">Order Fulfillment Pipeline</h2>
          </div>
          {orders.length === 0 ? (
            <p className="p-10 text-center text-xs text-[#474150]/70">No customer orders recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5FFF4] text-[#474150]/75 border-b border-[#9C99B8]/30">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Order</th>
                    <th className="py-3 px-4 font-semibold">Customer</th>
                    <th className="py-3 px-4 font-semibold text-right">Total</th>
                    <th className="py-3 px-4 font-semibold">Payment</th>
                    <th className="py-3 px-4 font-semibold">Fulfillment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#9C99B8]/20">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#F5FFF4]">
                      <td className="py-3 px-4 font-mono font-bold text-[#474150]">{order.orderNumber}</td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#474150]">{order.customerName}</p>
                        <p className="text-[11px] text-[#474150]/70">{order.customerEmail}</p>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-[#474150]">
                        {formatNaira(order.total)}
                      </td>
                      <td className="py-3 px-4 text-[#474150]/75">
                        {order.paymentMethod} ···· {order.paymentLast4}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={order.status}
                          onChange={(e) => void updateOrderStatus(order.id, e.target.value as OrderStatus)}
                          aria-label={`Update status for ${order.orderNumber}`}
                          className="rounded-xl border border-[#9C99B8]/40 bg-white px-3 py-1.5 text-xs font-semibold text-[#474150]"
                        >
                          <option value="paid">Paid</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* BRAND & ALERTS TAB */}
      {activeTab === 'communications' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            {/* Company Logo Slot */}
            <div className="bg-white rounded-2xl p-6 border border-[#9C99B8]/35 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImagePlus className="w-5 h-5 text-[#996E00]" />
                  <h2 className="font-display text-base font-bold text-[#474150]">Company Brand Logo</h2>
                </div>
                {hasCustomLogo && (
                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className="text-xs font-semibold text-[#474150]/70 hover:text-[#474150]"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="p-4 rounded-xl bg-[#F5FFF4] border border-[#9C99B8]/35 flex items-center justify-between gap-4">
                <BrandLogo />
                <label className="px-3.5 py-2 rounded-xl bg-[#474150] hover:bg-[#383340] text-[#F5FFF4] text-xs font-semibold cursor-pointer whitespace-nowrap">
                  Upload Logo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="sr-only"
                  />
                </label>
              </div>
              <p className="text-xs text-[#474150]/70">
                Upload a custom PNG, SVG, or JPEG override to preview it across the storefront header.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#9C99B8]/35 space-y-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#996E00]" />
                <h2 className="font-display text-base font-bold text-[#474150]">Send Live Push Promotion</h2>
              </div>
              <form onSubmit={(e) => void handlePromoSubmit(e)} className="space-y-3">
                <input
                  type="text"
                  required
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  placeholder="Headline (e.g. Workstation & Monitor Bundle Offer)"
                  className="w-full min-h-[44px] rounded-xl border border-[#9C99B8]/40 bg-[#F5FFF4] px-3.5 text-sm text-[#474150] outline-none focus:border-[#474150]"
                />
                <textarea
                  rows={3}
                  required
                  value={promoMessage}
                  onChange={(e) => setPromoMessage(e.target.value)}
                  placeholder="Promotional message pushed instantaneously to connected shoppers..."
                  className="w-full rounded-xl border border-[#9C99B8]/40 bg-[#F5FFF4] p-3.5 text-sm text-[#474150] outline-none focus:border-[#474150]"
                />
                <button
                  type="submit"
                  disabled={sendingPromo}
                  className="w-full min-h-[46px] rounded-xl bg-[#FFBB00] hover:bg-[#E5A800] text-[#2E2935] text-sm font-bold disabled:opacity-50 transition-colors"
                >
                  {sendingPromo ? 'Broadcasting...' : 'Broadcast Live Push Alert'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-[#9C99B8]/35 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#996E00]" />
                <h2 className="font-display text-base font-bold text-[#474150]">Automated Admin Email Dispatch Log</h2>
              </div>
              <button
                type="button"
                onClick={() => void refreshEmailLogs()}
                className="p-2 rounded-xl hover:bg-[#9C99B8]/15 text-[#474150]"
                aria-label="Refresh email log"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {emailLogs.length === 0 ? (
              <p className="text-xs text-[#474150]/70 py-8 text-center">
                Automated admin emails fire automatically on new orders, cancellations, and low-stock events.
              </p>
            ) : (
              <div className="divide-y divide-[#9C99B8]/25 max-h-96 overflow-y-auto">
                {emailLogs.map((log) => (
                  <div key={log.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-[#474150]">{log.subject}</p>
                      <span className="text-[11px] font-mono text-[#996E00] font-semibold">
                        {log.deliveryMode === 'smtp' ? 'SMTP Sent' : 'Queued'}
                      </span>
                    </div>
                    <p className="text-xs text-[#474150]/75">{log.summary}</p>
                    <p className="text-[11px] text-[#474150]/55 tabular-nums">
                      To: {log.recipient} · {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add SKU Modal */}
      {newSkuModal && (
        <div
          className="fixed inset-0 z-50 bg-[#474150]/55 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setNewSkuModal(false)}
        >
          <form
            onSubmit={(e) => void handleAddSku(e)}
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#9C99B8]/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <h3 className="font-display text-lg font-bold text-[#474150]">Add New Hardware SKU</h3>
            <input
              type="text"
              required
              value={skuTitle}
              onChange={(e) => setSkuTitle(e.target.value)}
              placeholder="Model Name (e.g. YouGlob EliteBook 14 G11)"
              className="w-full min-h-[44px] rounded-xl border border-[#9C99B8]/40 bg-[#F5FFF4] px-3 text-sm text-[#474150] outline-none focus:border-[#474150]"
            />
            <input
              type="text"
              value={skuSubtitle}
              onChange={(e) => setSkuSubtitle(e.target.value)}
              placeholder="Spec Summary (e.g. Core Ultra 7 · 32GB · 1TB NVMe)"
              className="w-full min-h-[44px] rounded-xl border border-[#9C99B8]/40 bg-[#F5FFF4] px-3 text-sm text-[#474150] outline-none focus:border-[#474150]"
            />
            <div className="grid grid-cols-3 gap-2">
              <select
                value={skuCategory}
                onChange={(e) => setSkuCategory(e.target.value as Exclude<CategoryType, 'All'>)}
                className="min-h-[44px] rounded-xl border border-[#9C99B8]/40 bg-[#F5FFF4] px-2 text-xs font-semibold text-[#474150]"
              >
                <option value="Laptops">Laptops</option>
                <option value="Desktops">Desktops</option>
                <option value="Monitors">Monitors</option>
                <option value="Keyboards & Mice">Keyboards &amp; Mice</option>
                <option value="Docks & Hubs">Docks &amp; Hubs</option>
                <option value="Storage & RAM">Storage &amp; RAM</option>
                <option value="Audio & Webcams">Audio &amp; Webcams</option>
              </select>
              <input
                type="number"
                required
                min={1000}
                value={skuPrice}
                onChange={(e) => setSkuPrice(e.target.value)}
                placeholder="Price (₦)"
                className="min-h-[44px] rounded-xl border border-[#9C99B8]/40 bg-[#F5FFF4] px-3 text-sm text-[#474150] tabular-nums"
              />
              <input
                type="number"
                required
                min={0}
                value={skuStock}
                onChange={(e) => setSkuStock(e.target.value)}
                placeholder="Stock"
                className="min-h-[44px] rounded-xl border border-[#9C99B8]/40 bg-[#F5FFF4] px-3 text-sm text-[#474150] tabular-nums"
              />
            </div>
            <textarea
              rows={2}
              value={skuDescription}
              onChange={(e) => setSkuDescription(e.target.value)}
              placeholder="Hardware architecture, ports, and warranty..."
              className="w-full rounded-xl border border-[#9C99B8]/40 bg-[#F5FFF4] p-3 text-sm text-[#474150] outline-none focus:border-[#474150]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewSkuModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#9C99B8]/40 text-xs font-semibold text-[#474150]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#FFBB00] hover:bg-[#E5A800] text-[#2E2935] text-xs font-bold transition-colors"
              >
                Save to Catalog
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
