import { Bell, BellRing, Check, Megaphone, PackageCheck, TriangleAlert, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

export function LiveToastStack() {
  const { toasts, dismissToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none">
      {toasts.map((toast) => {
        const accent =
          toast.tone === 'rose'
            ? 'border-rose-300 bg-white'
            : toast.tone === 'amber'
              ? 'border-[#FFBB00] bg-white'
              : 'border-[#9C99B8]/40 bg-white';

        const iconColor =
          toast.tone === 'emerald'
            ? 'bg-emerald-50 text-emerald-700'
            : toast.tone === 'amber'
              ? 'bg-[#FFBB00]/20 text-[#996E00]'
              : toast.tone === 'rose'
                ? 'bg-rose-50 text-rose-600'
                : 'bg-[#9C99B8]/20 text-[#474150]';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border p-3.5 shadow-lg flex items-start gap-3 transition-transform ${accent}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
              <BellRing className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#474150] truncate">{toast.title}</p>
              <p className="text-xs text-[#474150]/75 mt-0.5 line-clamp-2">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="p-1 text-[#9C99B8] hover:text-[#474150]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ open, onClose }: NotificationDrawerProps) {
  const { user } = useAuth();
  const {
    notifications,
    wsConnected,
    wsSupported,
    pushPermission,
    requestPushPermission,
    markNotificationRead,
  } = useStore();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#474150]/50 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <aside
        className="w-full max-w-md bg-[#F5FFF4] h-full flex flex-col shadow-2xl border-l border-[#9C99B8]/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 bg-white border-b border-[#9C99B8]/35 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-[#474150]">YouGlob Live Alerts</h2>
            <p className="text-xs text-[#474150]/70 mt-0.5">
              {wsConnected
                ? 'Real-time push feed connected'
                : wsSupported
                  ? 'Reconnecting to live feed'
                  : 'Live storefront alerts active'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-[#9C99B8]/15 hover:bg-[#9C99B8]/25 flex items-center justify-center text-[#474150]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {pushPermission !== 'granted' && pushPermission !== 'unsupported' && (
          <div className="p-4 bg-[#F5FFF4] border-b border-[#9C99B8]/35 flex items-center justify-between gap-3">
            <div className="text-xs text-[#474150]">
              <p className="font-semibold">Enable Browser Push Alerts</p>
              <p className="text-[#474150]/70 mt-0.5">Get instant alerts for order dispatches and fresh hardware stock.</p>
            </div>
            <button
              type="button"
              onClick={() => void requestPushPermission()}
              className="px-3.5 py-2 rounded-xl bg-[#FFBB00] text-[#2E2935] text-xs font-bold hover:bg-[#E5A800] whitespace-nowrap shrink-0"
            >
              Enable
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto divide-y divide-[#9C99B8]/25">
          {notifications.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Bell className="w-8 h-8 text-[#996E00] mx-auto" />
              <p className="text-sm font-medium text-[#474150]">No notifications yet</p>
              <p className="text-xs text-[#474150]/70">
                Order status updates and YouGlob Technology drop promotions will appear here automatically.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const isRead = item.readBy.includes(user.uid);
              const Icon =
                item.type === 'order_update'
                  ? PackageCheck
                  : item.type === 'low_stock'
                    ? TriangleAlert
                    : Megaphone;
              const iconBg =
                item.type === 'order_update'
                  ? 'bg-emerald-50 text-emerald-700'
                  : item.type === 'low_stock'
                    ? 'bg-[#FFBB00]/20 text-[#996E00]'
                    : 'bg-[#9C99B8]/20 text-[#474150]';

              return (
                <div
                  key={item.id}
                  className={`p-4 flex items-start gap-3 transition-colors ${isRead ? 'bg-white' : 'bg-[#FFBB00]/10'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#474150] truncate">{item.title}</p>
                      <span className="text-[11px] text-[#474150]/55 tabular-nums shrink-0">
                        {new Date(item.createdAtMs).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-[#474150]/75 mt-1 leading-relaxed">{item.message}</p>
                    {!isRead && (
                      <button
                        type="button"
                        onClick={() => void markNotificationRead(item.id)}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#996E00] hover:underline"
                      >
                        <Check className="w-3 h-3" />
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
}
