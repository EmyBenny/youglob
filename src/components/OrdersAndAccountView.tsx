import { Bell, Heart, Package, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { formatNaira, type Product } from '../types/ecommerce';
import { SafeImage } from './SafeImage';

interface OrdersAndAccountViewProps {
  onSelectProduct: (product: Product) => void;
  onOpenAdmin: () => void;
}

export function OrdersAndAccountView({ onSelectProduct, onOpenAdmin }: OrdersAndAccountViewProps) {
  const { profile } = useAuth();
  const { orders, products, pushPermission, requestPushPermission, updateOrderStatus } = useStore();

  const wishlistedProducts = products.filter((p) => profile.wishlist.includes(p.id));

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 pb-28 space-y-6">
      {/* Storefront Hub Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#9C99B8]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#474150] text-[#FFBB00] flex items-center justify-center font-display text-lg font-bold">
            YG
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-[#474150]">
              YouGlob Orders &amp; Saved Hardware
            </h1>
            <p className="text-xs text-[#474150]/70 mt-0.5">
              Live order tracking, saved configurations, and instant dispatch notifications
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {pushPermission !== 'granted' && pushPermission !== 'unsupported' && (
            <button
              type="button"
              onClick={() => void requestPushPermission()}
              className="px-4 py-2.5 rounded-xl bg-[#F5FFF4] text-[#474150] text-xs font-semibold flex items-center gap-1.5 border border-[#9C99B8]/40"
            >
              <Bell className="w-4 h-4 text-[#996E00]" />
              Enable Push Alerts
            </button>
          )}
          <button
            type="button"
            onClick={onOpenAdmin}
            className="px-4 py-2.5 rounded-xl bg-[#474150] hover:bg-[#383340] text-[#F5FFF4] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-[#FFBB00]" />
            Store Operations
          </button>
        </div>
      </div>

      {/* Real-Time Order Tracking */}
      <section className="bg-white rounded-2xl p-6 border border-[#9C99B8]/35 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#996E00]" />
            <h2 className="font-display text-lg font-bold text-[#474150]">Order History &amp; Live Tracking</h2>
          </div>
          <span className="text-xs text-[#474150]/70 font-bold tabular-nums">{orders.length} order(s)</span>
        </div>

        {orders.length === 0 ? (
          <div className="py-10 text-center space-y-1">
            <p className="text-sm font-semibold text-[#474150]">No orders placed yet</p>
            <p className="text-xs text-[#474150]/70">
              Complete any checkout in the Bag drawer and your live order tracking will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl border border-[#9C99B8]/35 p-4 space-y-3 bg-[#F5FFF4]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-bold text-[#474150]">{order.orderNumber}</p>
                    <p className="text-xs text-[#474150]/70">
                      {new Date(order.createdAtMs).toLocaleDateString()} · {order.paymentMethod} ···· {order.paymentLast4}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold uppercase tracking-wide ${
                        order.status === 'delivered'
                          ? 'text-emerald-700'
                          : order.status === 'cancelled'
                            ? 'text-rose-600'
                            : 'text-[#996E00]'
                      }`}
                    >
                      Status: {order.status}
                    </span>
                    <span className="font-mono text-sm font-bold text-[#474150] tabular-nums">
                      {formatNaira(order.total)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#9C99B8]/35 text-xs"
                    >
                      <span className="font-semibold text-[#474150]">{item.title}</span>
                      <span className="text-[#474150]/70">
                        {item.size} / {item.color} × {item.quantity} ({formatNaira(item.price)})
                      </span>
                    </div>
                  ))}
                </div>

                {order.status === 'paid' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => void updateOrderStatus(order.id, 'cancelled')}
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Wishlist */}
      <section className="bg-white rounded-2xl p-6 border border-[#9C99B8]/35 space-y-4">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-[#474150] fill-[#FFBB00]" />
          <h2 className="font-display text-lg font-bold text-[#474150]">Saved Wishlist</h2>
        </div>

        {wishlistedProducts.length === 0 ? (
          <p className="text-xs text-[#474150]/70 py-4">
            Tap the heart icon on any laptop, desktop, monitor, or accessory to save it here.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {wishlistedProducts.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectProduct(item)}
                className="flex items-center gap-3 p-3 rounded-xl border border-[#9C99B8]/35 hover:border-[#FFBB00] bg-[#F5FFF4] cursor-pointer transition-colors"
              >
                <SafeImage
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-16 h-12 rounded-lg object-cover shrink-0 border border-[#9C99B8]/35"
                />
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold text-[#474150] truncate">{item.title}</p>
                  <p className="font-mono text-xs text-[#996E00] font-semibold tabular-nums">
                    {formatNaira(item.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
