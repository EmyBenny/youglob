import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { SEED_PRODUCTS } from '../data/seedCatalog';
import { db } from '../lib/firebase';
import type {
  AdminEmailLog,
  CartItem,
  NotificationItem,
  Order,
  OrderStatus,
  Product,
  Review,
} from '../types/ecommerce';
import { useAuth } from './AuthContext';

export interface LiveToast {
  id: string;
  title: string;
  message: string;
  tone: 'violet' | 'emerald' | 'amber' | 'rose';
}

interface StoreContextValue {
  products: Product[];
  loadingProducts: boolean;
  isSeededInFirestore: boolean;
  orders: Order[];
  reviews: Review[];
  notifications: NotificationItem[];
  emailLogs: AdminEmailLog[];
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  toasts: LiveToast[];
  wsConnected: boolean;
  wsSupported: boolean;
  pushPermission: NotificationPermission | 'unsupported';
  requestPushPermission: () => Promise<void>;
  dismissToast: (id: string) => void;
  pushLocalToast: (toast: Omit<LiveToast, 'id'>) => void;
  addToCart: (item: CartItem) => void;
  updateCartQuantity: (productId: string, color: string, size: string, delta: number) => void;
  removeFromCart: (productId: string, color: string, size: string) => void;
  clearCart: () => void;
  placeOrder: (params: {
    customerName: string;
    shippingAddress: string;
    paymentMethod: 'card' | 'express_wallet';
    cardNumber?: string;
    expiry?: string;
    cvc?: string;
  }) => Promise<Order>;
  updateOrderStatus: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
  addReview: (productId: string, rating: number, comment: string) => Promise<void>;
  upsertProduct: (product: Omit<Product, 'createdAtMs' | 'updatedAtMs'>) => Promise<void>;
  adjustProductStock: (productId: string, newStock: number) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  sendPromoBroadcast: (title: string, message: string) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  refreshEmailLogs: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const LOCAL_ORDERS_KEY = 'youglob_design_orders_v1';
const LOCAL_REVIEWS_KEY = 'youglob_design_reviews_v1';
const LOCAL_NOTIFS_KEY = 'youglob_design_notifs_v1';
const LOCAL_STOCK_KEY = 'youglob_design_stock_v1';
const LOCAL_CUSTOM_SKUS_KEY = 'youglob_design_custom_skus_v1';
const LOCAL_EMAIL_LOGS_KEY = 'youglob_design_email_logs_v1';

function readJsonStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJsonStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota issues
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, isAdmin } = useAuth();

  const [firestoreProducts, setFirestoreProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [customSkus, setCustomSkus] = useState<Product[]>(() =>
    readJsonStorage<Product[]>(LOCAL_CUSTOM_SKUS_KEY, [])
  );
  const [stockOverrides, setStockOverrides] = useState<Record<string, number>>(() =>
    readJsonStorage<Record<string, number>>(LOCAL_STOCK_KEY, {})
  );
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  const [orders, setOrders] = useState<Order[]>(() => readJsonStorage<Order[]>(LOCAL_ORDERS_KEY, []));
  const [localReviews, setLocalReviews] = useState<Review[]>(() =>
    readJsonStorage<Review[]>(LOCAL_REVIEWS_KEY, [])
  );
  const [firestoreReviews, setFirestoreReviews] = useState<Review[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    readJsonStorage<NotificationItem[]>(LOCAL_NOTIFS_KEY, [
      {
        id: 'ntf-welcome-youglob',
        targetUserId: 'all',
        type: 'promotion',
        title: 'Welcome to YouGlob Technology',
        message: 'Explore pro laptops, custom desktop workstations, 4K monitors, and Thunderbolt accessories.',
        orderId: '',
        readBy: [],
        createdAtMs: Date.now(),
      },
    ])
  );

  const [emailLogs, setEmailLogs] = useState<AdminEmailLog[]>(() =>
    readJsonStorage<AdminEmailLog[]>(LOCAL_EMAIL_LOGS_KEY, [])
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toasts, setToasts] = useState<LiveToast[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsSupported, setWsSupported] = useState(true);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushLocalToast = useCallback((toast: Omit<LiveToast, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [{ ...toast, id }, ...prev].slice(0, 4));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const triggerBrowserNotification = useCallback((title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body });
      } catch {
        // Ignore browser restrictions inside sandboxed iframes
      }
    }
  }, []);

  const requestPushPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPushPermission('unsupported');
      return;
    }
    const result = await Notification.requestPermission();
    setPushPermission(result);
    if (result === 'granted') {
      pushLocalToast({
        title: 'Push Alerts Enabled',
        message: 'You will receive real-time order updates and new drop alerts.',
        tone: 'emerald',
      });
    }
  }, [pushLocalToast]);

  // Subscribe to public product catalog (non-blocking)
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'products'),
      (snap) => {
        const validCats = new Set([
          'Laptops',
          'Desktops',
          'Monitors',
          'Keyboards & Mice',
          'Docks & Hubs',
          'Storage & RAM',
          'Audio & Webcams',
        ]);
        const list: Product[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: String(data.id || d.id),
              title: String(data.title || ''),
              subtitle: String(data.subtitle || ''),
              category: data.category || 'Laptops',
              price: Number(data.price || 0),
              stock: Number(data.stock || 0),
              lowStockThreshold: Number(data.lowStockThreshold || 5),
              description: String(data.description || ''),
              fabricSpecs: String(data.fabricSpecs || ''),
              colors: Array.isArray(data.colors) ? data.colors.map(String) : ['Space Gray'],
              sizes: Array.isArray(data.sizes) ? data.sizes.map(String) : ['16GB / 512GB'],
              styles: Array.isArray(data.styles) ? data.styles.map(String) : ['Standard'],
              imageUrl: String(data.imageUrl || ''),
              galleryImages: Array.isArray(data.galleryImages) ? data.galleryImages.map(String) : [],
              featured: Boolean(data.featured),
              badge: String(data.badge || 'In Stock'),
              rating: Number(data.rating || 4.8),
              reviewCount: Number(data.reviewCount || 0),
              createdAtMs: Date.now(),
              updatedAtMs: Date.now(),
            };
          })
          .filter((p) => validCats.has(p.category) && p.id.startsWith('yg-'));
        setFirestoreProducts(list);
        setLoadingProducts(false);
      },
      () => {
        setLoadingProducts(false);
      }
    );
    return () => unsub();
  }, []);

  // Merge latest SEED_PRODUCTS, Firestore docs, and design-mode local edits
  const products = useMemo<Product[]>(() => {
    const now = Date.now();
    const map = new Map<string, Product>();

    for (const seed of SEED_PRODUCTS) {
      map.set(seed.id, { ...seed, createdAtMs: now, updatedAtMs: now });
    }
    for (const fp of firestoreProducts) {
      map.set(fp.id, fp);
    }
    for (const custom of customSkus) {
      map.set(custom.id, custom);
    }

    return Array.from(map.values())
      .filter((p) => !deletedIds.includes(p.id))
      .map((p) => ({
        ...p,
        stock: typeof stockOverrides[p.id] === 'number' ? stockOverrides[p.id] : p.stock,
      }))
      .sort((a, b) => Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title));
  }, [firestoreProducts, customSkus, stockOverrides, deletedIds]);

  // Subscribe to public reviews
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'reviews'),
      (snap) => {
        const list: Review[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id || d.id),
            productId: String(data.productId || ''),
            userId: String(data.userId || ''),
            userName: String(data.userName || 'Customer'),
            rating: Number(data.rating || 5),
            comment: String(data.comment || ''),
            createdAtMs: Date.now(),
          };
        });
        setFirestoreReviews(list);
      },
      () => {
        // Ignore if offline or unauthenticated
      }
    );
    return () => unsub();
  }, []);

  const reviews = useMemo(() => {
    const merged = [...localReviews, ...firestoreReviews];
    const seen = new Set<string>();
    return merged
      .filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      })
      .sort((a, b) => b.createdAtMs - a.createdAtMs);
  }, [localReviews, firestoreReviews]);

  const mergeEmailLogs = useCallback((incoming: AdminEmailLog[]) => {
    if (!incoming.length) return;
    setEmailLogs((prev) => {
      const seen = new Set(incoming.map((l) => l.id));
      const next = [...incoming, ...prev.filter((l) => !seen.has(l.id))].slice(0, 100);
      writeJsonStorage(LOCAL_EMAIL_LOGS_KEY, next);
      return next;
    });
  }, []);

  const refreshEmailLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/email-logs');
      if (res.ok) {
        const json = (await res.json()) as { logs?: AdminEmailLog[] };
        if (Array.isArray(json.logs) && json.logs.length > 0) {
          mergeEmailLogs(json.logs);
        }
      }
    } catch {
      // Ignore transient network errors
    }
  }, [mergeEmailLogs]);

  useEffect(() => {
    void refreshEmailLogs();
  }, [refreshEmailLogs]);

  // WebSocket real-time push connection (auto-disables gracefully on serverless hosts like Vercel)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closedByEffect = false;
    let hasOpenedOnce = false;
    let consecutiveInitialFailures = 0;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socketUrl = `${protocol}//${window.location.host}/ws`;
      try {
        ws = new WebSocket(socketUrl);
      } catch {
        setWsSupported(false);
        return;
      }

      ws.onopen = () => {
        hasOpenedOnce = true;
        consecutiveInitialFailures = 0;
        setWsSupported(true);
        setWsConnected(true);
        ws?.send(
          JSON.stringify({
            type: 'register',
            userId: user.uid,
            isAdmin,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as {
            event?: string;
            title?: string;
            message?: string;
            meta?: { emailLog?: AdminEmailLog };
          };
          if (!data.event || data.event === 'system:connected') return;

          if (data.event === 'email:dispatched' && data.meta?.emailLog) {
            mergeEmailLogs([data.meta.emailLog]);
            return;
          }

          const title = data.title || 'YouGlob Update';
          const message = data.message || '';
          const tone =
            data.event === 'inventory:low_stock'
              ? 'amber'
              : data.event === 'order:created' || data.event === 'order:status_updated'
                ? 'emerald'
                : 'violet';

          pushLocalToast({ title, message, tone });
          triggerBrowserNotification(title, message);
        } catch {
          // Ignore invalid socket messages
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (closedByEffect) return;

        if (!hasOpenedOnce) {
          consecutiveInitialFailures += 1;
          if (consecutiveInitialFailures >= 2) {
            setWsSupported(false);
            return;
          }
        }
        reconnectTimer = setTimeout(connect, 3500);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      closedByEffect = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [user.uid, isAdmin, mergeEmailLogs, pushLocalToast, triggerBrowserNotification]);

  const addToCart = useCallback(
    (item: CartItem) => {
      const liveProduct = products.find((p) => p.id === item.productId);
      const available = liveProduct ? liveProduct.stock : 0;
      if (available <= 0) {
        pushLocalToast({
          title: 'Out of Stock',
          message: `${item.title} is currently sold out.`,
          tone: 'rose',
        });
        return;
      }

      setCart((prev) => {
        const idx = prev.findIndex(
          (c) => c.productId === item.productId && c.color === item.color && c.size === item.size
        );
        if (idx >= 0) {
          const nextQty = Math.min(available, prev[idx].quantity + item.quantity);
          const updated = [...prev];
          updated[idx] = { ...updated[idx], quantity: nextQty };
          return updated;
        }
        return [...prev, { ...item, quantity: Math.min(available, item.quantity) }];
      });

      pushLocalToast({
        title: 'Added to Bag',
        message: `${item.title} (${item.size} · ${item.color})`,
        tone: 'emerald',
      });
    },
    [products, pushLocalToast]
  );

  const updateCartQuantity = useCallback(
    (productId: string, color: string, size: string, delta: number) => {
      const liveProduct = products.find((p) => p.id === productId);
      const maxStock = liveProduct ? liveProduct.stock : 99;
      setCart((prev) =>
        prev
          .map((item) => {
            if (item.productId === productId && item.color === color && item.size === size) {
              const nextQty = Math.min(maxStock, item.quantity + delta);
              return nextQty > 0 ? { ...item, quantity: nextQty } : null;
            }
            return item;
          })
          .filter((item): item is CartItem => item !== null)
      );
    },
    [products]
  );

  const removeFromCart = useCallback((productId: string, color: string, size: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.productId === productId && item.color === color && item.size === size))
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartSubtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  const placeOrder: StoreContextValue['placeOrder'] = async (params) => {
    if (cart.length === 0) {
      throw new Error('Your shopping bag is empty.');
    }

    for (const item of cart) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error(`${item.title} is no longer available.`);
      if (product.stock < item.quantity) {
        throw new Error(`Only ${product.stock} unit(s) left for ${product.title}.`);
      }
    }

    const subtotal = Math.round(cartSubtotal);
    const shipping = subtotal >= 250000 ? 0 : 8500;
    const total = subtotal + shipping;
    const amountCents = Math.round(total * 100);

    const paymentRes = await fetch('/api/payments/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amountCents,
        currency: 'NGN',
        method: params.paymentMethod,
        cardNumber: params.cardNumber,
        expiry: params.expiry,
        cvc: params.cvc,
        cardholderName: params.customerName,
        customerEmail: user.email,
        itemsSummary: cart.map((c) => ({
          id: c.productId,
          title: c.title,
          quantity: c.quantity,
          price: c.price,
        })),
      }),
    });

    const paymentJson = (await paymentRes.json()) as {
      error?: string;
      paymentIntentId?: string;
      method?: string;
      last4?: string;
    };

    if (!paymentRes.ok || !paymentJson.paymentIntentId) {
      throw new Error(paymentJson.error || 'Payment authorization failed.');
    }

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const orderNumber = `YG-${Math.floor(100000 + Math.random() * 900000)}`;
    const notifId = `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      userId: user.uid,
      customerEmail: user.email,
      customerName: params.customerName.trim().slice(0, 100) || 'YouGlob Customer',
      items: cart.map((c) => ({
        productId: c.productId,
        title: c.title,
        price: c.price,
        quantity: c.quantity,
        color: c.color,
        size: c.size,
        style: c.style,
        imageUrl: c.imageUrl,
      })),
      subtotal,
      shipping,
      total,
      status: 'paid',
      paymentIntentId: paymentJson.paymentIntentId.slice(0, 128),
      paymentMethod: (paymentJson.method || 'Card').slice(0, 40),
      paymentLast4: (paymentJson.last4 || '4242').slice(0, 4),
      shippingAddress: params.shippingAddress.trim().slice(0, 300),
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
    };

    const lowStockItems: Array<{ id: string; title: string; remainingStock: number }> = [];
    const nextOverrides = { ...stockOverrides };

    for (const item of cart) {
      const liveProduct = products.find((p) => p.id === item.productId);
      if (liveProduct) {
        const nextStock = Math.max(0, liveProduct.stock - item.quantity);
        nextOverrides[liveProduct.id] = nextStock;
        if (nextStock <= liveProduct.lowStockThreshold) {
          lowStockItems.push({
            id: liveProduct.id,
            title: liveProduct.title,
            remainingStock: nextStock,
          });
        }
      }
    }

    setStockOverrides(nextOverrides);
    writeJsonStorage(LOCAL_STOCK_KEY, nextOverrides);

    setOrders((prev) => {
      const next = [newOrder, ...prev];
      writeJsonStorage(LOCAL_ORDERS_KEY, next);
      return next;
    });

    const newNotif: NotificationItem = {
      id: notifId,
      targetUserId: 'all',
      type: 'order_update',
      title: `Order ${orderNumber} Confirmed`,
      message: `Your payment of ₦${total.toLocaleString('en-NG')} succeeded and items are queued for dispatch.`,
      orderId,
      readBy: [],
      createdAtMs: Date.now(),
    };
    setNotifications((prev) => {
      const next = [newNotif, ...prev].slice(0, 50);
      writeJsonStorage(LOCAL_NOTIFS_KEY, next);
      return next;
    });

    clearCart();

    try {
      const eventRes = await fetch('/api/notifications/order-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: 'created',
          orderId,
          orderNumber,
          total,
          status: 'paid',
          customerName: params.customerName,
          lowStockItems,
        }),
      });
      if (eventRes.ok) {
        const eventJson = (await eventRes.json()) as { emailLogs?: AdminEmailLog[] };
        if (Array.isArray(eventJson.emailLogs) && eventJson.emailLogs.length > 0) {
          mergeEmailLogs(eventJson.emailLogs);
        }
      }
      if (!wsConnected) {
        pushLocalToast({
          title: `Order ${orderNumber} Confirmed`,
          message: `Payment of ₦${total.toLocaleString('en-NG')} verified.`,
          tone: 'emerald',
        });
      }
    } catch {
      // Non-fatal
    }

    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    setOrders((prev) => {
      const next = prev.map((o) =>
        o.id === orderId ? { ...o, status: nextStatus, updatedAtMs: Date.now() } : o
      );
      writeJsonStorage(LOCAL_ORDERS_KEY, next);
      return next;
    });

    const notifId = `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newNotif: NotificationItem = {
      id: notifId,
      targetUserId: 'all',
      type: 'order_update',
      title: `Order ${order.orderNumber} ${nextStatus.toUpperCase()}`,
      message: `Your order status was updated to ${nextStatus}.`,
      orderId,
      readBy: [],
      createdAtMs: Date.now(),
    };
    setNotifications((prev) => {
      const next = [newNotif, ...prev].slice(0, 50);
      writeJsonStorage(LOCAL_NOTIFS_KEY, next);
      return next;
    });

    try {
      const statusRes = await fetch('/api/notifications/order-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: 'status_updated',
          orderId,
          orderNumber: order.orderNumber,
          status: nextStatus,
          targetUserId: order.userId,
        }),
      });
      if (statusRes.ok) {
        const statusJson = (await statusRes.json()) as { emailLogs?: AdminEmailLog[] };
        if (Array.isArray(statusJson.emailLogs) && statusJson.emailLogs.length > 0) {
          mergeEmailLogs(statusJson.emailLogs);
        }
      }
    } catch {
      // Non-fatal
    }
  };

  const addReview = async (productId: string, rating: number, comment: string) => {
    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newReview: Review = {
      id: reviewId,
      productId,
      userId: user.uid,
      userName: profile.displayName || 'YouGlob Customer',
      rating: Math.max(1, Math.min(5, Math.round(rating))),
      comment: comment.trim().slice(0, 600),
      createdAtMs: Date.now(),
    };

    setLocalReviews((prev) => {
      const next = [newReview, ...prev];
      writeJsonStorage(LOCAL_REVIEWS_KEY, next);
      return next;
    });

    pushLocalToast({
      title: 'Review Published',
      message: 'Thank you for sharing your hardware review with YouGlob Technology.',
      tone: 'emerald',
    });
  };

  const upsertProduct = async (product: Omit<Product, 'createdAtMs' | 'updatedAtMs'>) => {
    const cleanId = product.id.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 64);
    const now = Date.now();
    const fullProduct: Product = {
      ...product,
      id: cleanId,
      createdAtMs: now,
      updatedAtMs: now,
    };

    setCustomSkus((prev) => {
      const filtered = prev.filter((p) => p.id !== cleanId);
      const next = [fullProduct, ...filtered];
      writeJsonStorage(LOCAL_CUSTOM_SKUS_KEY, next);
      return next;
    });

    pushLocalToast({
      title: 'Product Added',
      message: `${product.title} added to catalog.`,
      tone: 'emerald',
    });
  };

  const adjustProductStock = async (productId: string, newStock: number) => {
    const clamped = Math.max(0, Math.round(newStock));
    setStockOverrides((prev) => {
      const next = { ...prev, [productId]: clamped };
      writeJsonStorage(LOCAL_STOCK_KEY, next);
      return next;
    });
  };

  const deleteProduct = async (productId: string) => {
    setDeletedIds((prev) => [...prev, productId]);
    pushLocalToast({
      title: 'SKU Removed',
      message: 'Product removed from storefront view.',
      tone: 'amber',
    });
  };

  const sendPromoBroadcast = async (title: string, message: string) => {
    const notifId = `promo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newNotif: NotificationItem = {
      id: notifId,
      targetUserId: 'all',
      type: 'promotion',
      title: title.trim().slice(0, 100),
      message: message.trim().slice(0, 300),
      orderId: '',
      readBy: [],
      createdAtMs: Date.now(),
    };

    setNotifications((prev) => {
      const next = [newNotif, ...prev].slice(0, 50);
      writeJsonStorage(LOCAL_NOTIFS_KEY, next);
      return next;
    });

    try {
      await fetch('/api/notifications/promo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, message }),
      });
      if (!wsConnected) {
        pushLocalToast({
          title: newNotif.title,
          message: newNotif.message,
          tone: 'violet',
        });
      }
    } catch {
      // Non-fatal
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) =>
        n.id === notificationId && !n.readBy.includes(user.uid)
          ? { ...n, readBy: [...n.readBy, user.uid].slice(0, 100) }
          : n
      );
      writeJsonStorage(LOCAL_NOTIFS_KEY, next);
      return next;
    });
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        loadingProducts,
        isSeededInFirestore: firestoreProducts.length > 0,
        orders,
        reviews,
        notifications,
        emailLogs,
        cart,
        cartCount,
        cartSubtotal,
        toasts,
        wsConnected,
        wsSupported,
        pushPermission,
        requestPushPermission,
        dismissToast,
        pushLocalToast,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        placeOrder,
        updateOrderStatus,
        addReview,
        upsertProduct,
        adjustProductStock,
        deleteProduct,
        sendPromoBroadcast,
        markNotificationRead,
        refreshEmailLogs,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used inside StoreProvider');
  }
  return ctx;
}
