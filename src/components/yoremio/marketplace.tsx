"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";

import {
  yoremioApi,
  type AdminDashboardDto,
  type AppBootstrapDto,
  type BulkStockItemValues,
  type BuyerProfileDto,
  type BuyerProfileUpdateValues,
  type CategoryDto,
  type ChatConversationDto,
  type ChatMessageDto,
  type CommentDto,
  type DemandDto,
  type FeaturedSellerDto,
  type LoginResponse,
  type NotificationDto,
  type OfferSubmitValues,
  type OpenMarketDemandValues,
  type OrtakAlimCreateValues,
  type OrtakAlimDto,
  type Paginated,
  type PlanliGonderimCreateValues,
  type PlanliGonderimDto,
  type PriceAlertDto,
  type ProductDto,
  type RatingDto,
  type ReviewEligibilityDto,
  type SellerDashboardDto,
  type SellerProfileDto,
  type SellerProfileUpdateValues,
  type SmartAlternativesDto,
  type StockAlertDto,
} from "@/lib/api";

type CategoryFormValues = Omit<CategoryDto, "id">;
import { bindChatEvents, createChatConnection, sendChatMessage } from "@/lib/chat";
import {
  AccessRequiredScreen,
  AdminDashboard,
  GlobalStatesScreen,
  ReviewsScreen,
} from "@/components/yoremio/admin-and-misc-screens";
import {
  BuyerRegisterScreen,
  LoginScreen,
  SellerRegisterScreen,
  VerificationScreen,
} from "@/components/yoremio/auth-screens";
import { BuyerDashboard } from "@/components/yoremio/buyer-dashboard";
import { DiscoveryScreen } from "@/components/yoremio/discover-screen";
import { HomeScreen } from "@/components/yoremio/home-screen";
import {
  SellerDashboard,
  SellerProductScreen,
  SellerProfileScreen,
} from "@/components/yoremio/seller-dashboard";
import {
  apiErrorInfo,
  buyerScreenFor,
  clearStoredSession,
  dashboardScreenFor,
  defaultProductSorts,
  emptyProductsResult,
  hasRole,
  PAGE_SIZE,
  readStoredSessionToken,
  storeSession,
  type AdminTab,
  type AuthCompleteOptions,
  type AuthState,
  type BuyerTab,
  type LoadState,
  type ProductSubmitValues,
  type Screen,
  type SellerTab,
  type SortKey,
  type ToastKind,
  type ToastState,
} from "@/components/yoremio/types";
import {
  ConfirmModal,
  DemandDetailModal,
  OpenMarketDemandModal,
  SellerStorefrontModal,
  Toast,
  type ChatContextSelection,
} from "@/components/yoremio/ui-kit";

type ConfirmModalState = {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<void>;
} | null;

export function YoremioMarketplace() {
  const [screen, setScreen] = useState<Screen>("home");
  const [authUser, setAuthUser] = useState<AuthState | null>(null);
  const [bootstrap, setBootstrap] = useState<AppBootstrapDto | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [lastErrorTraceId, setLastErrorTraceId] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState("");

  // Navigation sub-tabs for dashboards
  const [buyerTab, setBuyerTab] = useState<BuyerTab>("overview");
  const [sellerTab, setSellerTab] = useState<SellerTab>("overview");
  const [adminTab, setAdminTab] = useState<AdminTab>("overview");

  // Catalog state
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [featuredSellers, setFeaturedSellers] = useState<FeaturedSellerDto[]>([]);
  const [productsPage, setProductsPage] = useState<Paginated<ProductDto>>(() =>
    emptyProductsResult(1),
  );
  const [productsState, setProductsState] = useState<LoadState>("loading");
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null);
  const [smartAlternatives, setSmartAlternatives] = useState<SmartAlternativesDto | null>(null);
  const [planliGonderimler, setPlanliGonderimler] = useState<PlanliGonderimDto[]>([]);
  const [ortakAlimlar, setOrtakAlimlar] = useState<OrtakAlimDto[]>([]);
  const [selectedDeliveryCity, setSelectedDeliveryCity] = useState("");

  // Filters
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [teslimatSehir, setTeslimatSehir] = useState("");
  const [uretimSehir, setUretimSehir] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sadeceYeniHasat, setSadeceYeniHasat] = useState(false);
  const [sadeceEldenTeslim, setSadeceEldenTeslim] = useState(false);
  const [sadeceKargolu, setSadeceKargolu] = useState(false);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);

  // Authenticated user role data
  const [favorites, setFavorites] = useState<ProductDto[]>([]);
  const [recommended, setRecommended] = useState<ProductDto[]>([]);
  const [buyerDemands, setBuyerDemands] = useState<DemandDto[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlertDto[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlertDto[]>([]);
  const [followedSellers, setFollowedSellers] = useState<FeaturedSellerDto[]>([]);
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfileDto | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfileDto | null>(null);
  const [sellerStats, setSellerStats] = useState<SellerDashboardDto | null>(null);
  const [adminStats, setAdminStats] = useState<AdminDashboardDto | null>(null);
  const [sellerTrustScore, setSellerTrustScore] = useState<number>(0);
  const [sellerProducts, setSellerProducts] = useState<ProductDto[]>([]);
  const [sellerDemands, setSellerDemands] = useState<DemandDto[]>([]);
  const [marketDemands, setMarketDemands] = useState<DemandDto[]>([]);
  const [sellerShipments, setSellerShipments] = useState<PlanliGonderimDto[]>([]);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [productPrefillSource, setProductPrefillSource] = useState<ProductDto | null>(null);

  // Reviews
  const [reviewProduct, setReviewProduct] = useState<ProductDto | null>(null);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [ratings, setRatings] = useState<RatingDto[]>([]);
  const [eligibility, setEligibility] = useState<ReviewEligibilityDto | null>(null);
  const [averageScore, setAverageScore] = useState<number | null>(null);

  // Notifications & Chat
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState<ChatConversationDto[]>([]);
  const [chatTargetId, setChatTargetId] = useState("");
  const [chatContext, setChatContext] = useState<ChatContextSelection | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [signalrConnected, setSignalrConnected] = useState(false);
  const [typingFromUserId, setTypingFromUserId] = useState<string | null>(null);

  // Modals
  const [storefrontSellerId, setStorefrontSellerId] = useState<string | null>(null);
  const [inspectedDemandId, setInspectedDemandId] = useState<number | null>(null);
  const [openMarketOpen, setOpenMarketOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>(null);
  const [confirmPending, setConfirmPending] = useState(false);

  const hubRef = useRef<signalR.HubConnection | null>(null);
  const tokenRef = useRef<string>("");
  const chatTargetRef = useRef<string>("");
  const chatContextRef = useRef<ChatContextSelection | null>(null);
  const typingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    tokenRef.current = authUser?.token ?? "";
  }, [authUser?.token]);

  useEffect(() => {
    chatTargetRef.current = chatTargetId;
  }, [chatTargetId]);

  useEffect(() => {
    chatContextRef.current = chatContext;
  }, [chatContext]);

  const showToast = useCallback(
    (message: string, kind: ToastKind = "info", traceId?: string | null) => {
      setToast({ kind, message, traceId });
      if (kind === "error" && traceId) {
        setLastErrorTraceId(traceId);
      }
    },
    [],
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const features = bootstrap?.features;
  const chatEnabled = features?.chatEnabled !== false;
  const demandFlowEnabled = features?.demandFlowEnabled !== false;
  const favoritesEnabled = features?.favoritesEnabled !== false;
  const ratingsEnabled = features?.ratingsEnabled !== false;
  const reviewsEnabled = features?.reviewsEnabled !== false;
  const devVerificationInboxEnabled = features?.devVerificationInboxEnabled === true;

  const sortOptions = useMemo(() => {
    const serverSorts = bootstrap?.productSorts;
    return serverSorts?.length ? serverSorts : defaultProductSorts;
  }, [bootstrap?.productSorts]);

  const effectiveSignalrConnected = Boolean(
    authUser?.token && chatEnabled && signalrConnected,
  );

  const favoriteIds = useMemo(
    () => new Set(favorites.map((item) => item.id)),
    [favorites],
  );
  const priceAlarmProductIds = useMemo(
    () => new Set(priceAlerts.map((item) => item.urunId)),
    [priceAlerts],
  );
  const stockAlarmProductIds = useMemo(
    () => new Set(stockAlerts.map((item) => item.urunId)),
    [stockAlerts],
  );
  const followedSellerIds = useMemo(
    () => new Set(followedSellers.map((item) => item.kullaniciId)),
    [followedSellers],
  );

  const unreadMessageCount = useMemo(
    () => conversations.reduce((sum, conv) => sum + (conv.unreadCount ?? 0), 0),
    [conversations],
  );

  // Public bootstrap + categories + featured sellers + planned shipments + ortak alim
  const loadPublicBase = useCallback(async (deliveryCity?: string) => {
    const [bootRes, catRes, sellerRes, shipRes, oaRes] = await Promise.allSettled([
      yoremioApi.bootstrap(),
      yoremioApi.categories(),
      yoremioApi.featuredSellers(8),
      yoremioApi.planliGonderimler({ hedefSehir: deliveryCity || undefined }),
      yoremioApi.ortakAlimlar({ hedefSehir: deliveryCity || undefined }),
    ]);

    if (bootRes.status === "fulfilled") {
      setBootstrap(bootRes.value);
      if (bootRes.value.categories?.length) {
        setCategories(bootRes.value.categories);
      }
    }
    if (catRes.status === "fulfilled") {
      setCategories(catRes.value);
    }
    if (sellerRes.status === "fulfilled") {
      setFeaturedSellers(sellerRes.value);
    }
    if (shipRes.status === "fulfilled") {
      setPlanliGonderimler(shipRes.value);
    }
    if (oaRes.status === "fulfilled") {
      setOrtakAlimlar(oaRes.value.items);
    }
  }, []);

  // Smart location-aware product discovery loader
  const loadProducts = useCallback(async () => {
    setProductsState("loading");
    try {
      const parsedMin = minPrice.trim() ? Number(minPrice) : undefined;
      const parsedMax = maxPrice.trim() ? Number(maxPrice) : undefined;
      const discover = await yoremioApi.discoverProducts({
        page,
        pageSize: PAGE_SIZE,
        q: query.trim() || undefined,
        kategoriId: categoryId ?? undefined,
        sehir: city.trim() || undefined,
        ilce: district.trim() || undefined,
        teslimatSehir: teslimatSehir.trim() || undefined,
        uretimSehir: uretimSehir.trim() || undefined,
        minFiyat: Number.isFinite(parsedMin) ? parsedMin : undefined,
        maxFiyat: Number.isFinite(parsedMax) ? parsedMax : undefined,
        sadeceStoktaOlanlar: onlyInStock || undefined,
        sadeceDogrulanmisSatici: verifiedOnly || undefined,
        sadeceYeniHasat: sadeceYeniHasat || undefined,
        sadeceEldenTeslim: sadeceEldenTeslim || undefined,
        sadeceKargolu: sadeceKargolu || undefined,
        minOrtalamaPuan: minRating ?? undefined,
        sort,
      });

      setProductsPage(discover.sonuclar);
      setSmartAlternatives(discover.alternatifler ?? null);
      setProductsState("idle");
      setSelectedProduct((prev) => {
        if (prev && discover.sonuclar.items.some((item) => item.id === prev.id)) {
          return discover.sonuclar.items.find((item) => item.id === prev.id) ?? prev;
        }
        return discover.sonuclar.items[0] ?? null;
      });
    } catch (error) {
      const info = apiErrorInfo(error);
      setProductsState("error");
      showToast(info.message, "error", info.traceId);
    }
  }, [
    page,
    query,
    categoryId,
    city,
    district,
    teslimatSehir,
    uretimSehir,
    minPrice,
    maxPrice,
    onlyInStock,
    verifiedOnly,
    sadeceYeniHasat,
    sadeceEldenTeslim,
    sadeceKargolu,
    minRating,
    sort,
    showToast,
  ]);

  const loadAuthenticatedData = useCallback(
    async (user: AuthState) => {
      const token = user.token;
      const tasks: Promise<void>[] = [];

      tasks.push(
        yoremioApi
          .notifications(token, false, 1, 30)
          .then((res) => setNotifications(res.items))
          .catch(() => {}),
      );

      tasks.push(
        yoremioApi
          .unreadNotificationCount(token)
          .then((count) => setUnreadCount(count))
          .catch(() => {}),
      );

      if (chatEnabled) {
        tasks.push(
          yoremioApi
            .conversations(token)
            .then((convs) => {
              setConversations(convs);
              setChatTargetId((prev) => prev || convs[0]?.userId || "");
            })
            .catch(() => {}),
        );
      }

      if (hasRole(user, "ALICI")) {
        tasks.push(
          yoremioApi
            .buyerProfile(token)
            .then(setBuyerProfile)
            .catch(() => {}),
        );
        if (favoritesEnabled) {
          tasks.push(
            yoremioApi
              .favoriteProducts(token)
              .then(setFavorites)
              .catch(() => {}),
          );
        }
        tasks.push(
          yoremioApi
            .recommendedProducts(token)
            .then(setRecommended)
            .catch(() => {}),
        );
        tasks.push(
          yoremioApi
            .priceAlerts(token)
            .then(setPriceAlerts)
            .catch(() => {}),
        );
        tasks.push(
          yoremioApi
            .stockAlerts(token)
            .then(setStockAlerts)
            .catch(() => {}),
        );
        tasks.push(
          yoremioApi
            .followedSellers(token)
            .then(setFollowedSellers)
            .catch(() => {}),
        );
        tasks.push(
          yoremioApi
            .ortakAlimlar()
            .then((res) => setOrtakAlimlar(res.items))
            .catch(() => {}),
        );
        if (demandFlowEnabled) {
          tasks.push(
            yoremioApi
              .buyerDemands(token)
              .then(setBuyerDemands)
              .catch(() => {}),
          );
        }
      }

      if (hasRole(user, "SATICI")) {
        tasks.push(
          yoremioApi
            .sellerDashboard(token)
            .then(setSellerStats)
            .catch(() => {}),
        );
        tasks.push(
          yoremioApi
            .sellerProfile(token)
            .then((prof) => {
              setSellerProfile(prof);
              return yoremioApi
                .sellerTrustScore(prof.kullaniciId)
                .then((trust) => setSellerTrustScore(trust.guvenSkoru))
                .catch(() => {});
            })
            .catch(() => {}),
        );
        tasks.push(
          yoremioApi
            .sellerProducts(token)
            .then(setSellerProducts)
            .catch(() => {}),
        );
        tasks.push(
          yoremioApi
            .planliGonderimler({ saticiId: user.userId })
            .then(setSellerShipments)
            .catch(() => {}),
        );
        if (demandFlowEnabled) {
          tasks.push(
            yoremioApi
              .sellerDemands(token)
              .then(setSellerDemands)
              .catch(() => {}),
          );
          tasks.push(
            yoremioApi
              .openMarketDemands(token)
              .then((res) => setMarketDemands(res.items))
              .catch(() => {}),
          );
        }
      }

      if (hasRole(user, "ADMIN")) {
        tasks.push(
          yoremioApi
            .adminDashboard(token)
            .then(setAdminStats)
            .catch(() => {}),
        );
      }

      await Promise.all(tasks);
    },
    [chatEnabled, demandFlowEnabled, favoritesEnabled],
  );

  const handleAuthComplete = useCallback(
    async (
      login: LoginResponse,
      persistent: boolean,
      options?: AuthCompleteOptions,
    ) => {
      const session: AuthState = {
        token: login.token,
        userId: login.userId,
        userName: login.email,
        email: login.email,
        role: login.role,
        roles: login.roles,
        emailConfirmed: true,
      };
      storeSession(login, persistent);
      setAuthUser(session);
      await loadAuthenticatedData(session);

      if (!options?.silent) {
        showToast("Oturum açıldı, hoş geldin!", "success");
        setScreen(dashboardScreenFor(session));
      }
    },
    [loadAuthenticatedData, showToast],
  );

  // Initial session restore + email link verification check
  useEffect(() => {
    let active = true;

    const init = async () => {
      await loadPublicBase();

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const verifyUserId = params.get("userId");
        const verifyToken = params.get("token");
        if (verifyUserId && verifyToken) {
          try {
            await yoremioApi.confirmEmailLink(verifyUserId, verifyToken);
            if (active) {
              showToast("E-posta başarıyla doğrulandı!", "success");
              setScreen("login");
            }
          } catch (err) {
            const info = apiErrorInfo(err);
            if (active) showToast(info.message, "error", info.traceId);
          } finally {
            window.history.replaceState({}, "", window.location.pathname);
          }
        }
      }

      const storedToken = readStoredSessionToken();
      if (!storedToken || !active) return;

      try {
        const me = await yoremioApi.me(storedToken);
        if (!active) return;
        const restored: AuthState = { ...me, token: storedToken };
        setAuthUser(restored);
        await loadAuthenticatedData(restored);
      } catch {
        clearStoredSession();
      }
    };

    void init();
    return () => {
      active = false;
    };
  }, [loadAuthenticatedData, loadPublicBase, showToast]);

  // Reload products when filter params change
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProducts();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [loadProducts]);

  // Load conversation messages when chat target or context changes
  useEffect(() => {
    if (!authUser?.token || !chatTargetId || !chatEnabled) return;
    let cancelled = false;
    const token = authUser.token;

    const loadChat = async () => {
      try {
        const res = await yoremioApi.messages(
          token,
          chatTargetId,
          1,
          80,
          chatContext?.urunId ?? undefined,
          chatContext?.talepId ?? undefined,
        );
        if (cancelled) return;
        setMessages(res.items);
        await yoremioApi.markConversationRead(token, chatTargetId).catch(() => {});
        setConversations((prev) =>
          prev.map((c) => (c.userId === chatTargetId ? { ...c, unreadCount: 0 } : c)),
        );
      } catch {
        if (!cancelled) setMessages([]);
      }
    };

    void loadChat();
    return () => {
      cancelled = true;
    };
  }, [authUser?.token, chatContext?.talepId, chatContext?.urunId, chatEnabled, chatTargetId]);

  // Real-time SignalR ChatHub connection lifecycle
  useEffect(() => {
    if (!authUser?.token || !chatEnabled) {
      return;
    }

    const connection = createChatConnection(() => tokenRef.current);
    hubRef.current = connection;

    const unbind = bindChatEvents(connection, {
      onConnected: () => {
        setSignalrConnected(true);
      },
      onReceive: (msg) => {
        const currentTarget = chatTargetRef.current;
        if (msg.senderId === currentTarget || msg.receiverId === currentTarget) {
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
          );
          if (msg.senderId === currentTarget && tokenRef.current) {
            void yoremioApi
              .markConversationRead(tokenRef.current, currentTarget)
              .catch(() => {});
          }
        }
        if (tokenRef.current) {
          void yoremioApi
            .conversations(tokenRef.current)
            .then(setConversations)
            .catch(() => {});
        }
      },
      onSent: (msg) => {
        const currentTarget = chatTargetRef.current;
        if (msg.senderId === currentTarget || msg.receiverId === currentTarget) {
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
          );
        }
        if (tokenRef.current) {
          void yoremioApi
            .conversations(tokenRef.current)
            .then(setConversations)
            .catch(() => {});
        }
      },
      onRead: (readerUserId, readAtUtc) => {
        if (readerUserId === chatTargetRef.current) {
          setMessages((prev) =>
            prev.map((m) => (m.readAt ? m : { ...m, readAt: readAtUtc })),
          );
        }
      },
      onConversationRead: (readerUserId, _markedCount, readAtUtc) => {
        if (readerUserId === chatTargetRef.current) {
          setMessages((prev) =>
            prev.map((m) => (m.readAt ? m : { ...m, readAt: readAtUtc })),
          );
        }
      },
      onTyping: (senderId) => {
        setTypingFromUserId(senderId);
        if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
        typingTimerRef.current = window.setTimeout(() => {
          setTypingFromUserId(null);
        }, 2800);
      },
      onNotification: (notification) => {
        setNotifications((prev) =>
          prev.some((n) => n.id === notification.id)
            ? prev
            : [notification, ...prev].slice(0, 50),
        );
        if (typeof notification.okunmamisSayisi === "number") {
          setUnreadCount(notification.okunmamisSayisi);
        } else {
          setUnreadCount((prev) => prev + 1);
        }
        showToast(`${notification.baslik}: ${notification.mesaj}`, "info");
      },
      onUnreadNotifications: (count) => {
        setUnreadCount(count);
      },
    });

    connection.onreconnected(() => setSignalrConnected(true));
    connection.onclose(() => setSignalrConnected(false));

    connection
      .start()
      .then(() => setSignalrConnected(true))
      .catch(() => setSignalrConnected(false));

    return () => {
      unbind();
      setSignalrConnected(false);
      hubRef.current = null;
      void connection.stop();
    };
  }, [authUser?.token, chatEnabled, showToast]);

  const handleLogout = () => {
    clearStoredSession();
    setAuthUser(null);
    setFavorites([]);
    setRecommended([]);
    setBuyerDemands([]);
    setPriceAlerts([]);
    setStockAlerts([]);
    setFollowedSellers([]);
    setBuyerProfile(null);
    setSellerProfile(null);
    setSellerStats(null);
    setAdminStats(null);
    setSellerTrustScore(0);
    setSellerProducts([]);
    setSellerDemands([]);
    setMarketDemands([]);
    setSellerShipments([]);
    setNotifications([]);
    setUnreadCount(0);
    setConversations([]);
    setMessages([]);
    setChatTargetId("");
    setChatContext(null);
    setScreen("home");
    showToast("Çıkış yapıldı.", "info");
  };

  const openReviewsForProduct = async (product: ProductDto) => {
    setReviewProduct(product);
    setScreen("reviews");
    const [commRes, rateRes, avgRes, eligRes] = await Promise.allSettled([
      yoremioApi.comments(product.id),
      yoremioApi.productRatings(product.id),
      yoremioApi.averageRating(product.id),
      authUser?.token
        ? yoremioApi.reviewEligibility(authUser.token, product.id)
        : Promise.resolve(null),
    ]);

    if (commRes.status === "fulfilled") setComments(commRes.value);
    if (rateRes.status === "fulfilled") setRatings(rateRes.value);
    if (avgRes.status === "fulfilled") setAverageScore(avgRes.value.ortalama);
    if (eligRes.status === "fulfilled") setEligibility(eligRes.value);
  };

  const handleToggleFavorite = async (productId: number) => {
    if (!authUser) {
      showToast("Favorilere eklemek için giriş yapmalısın.", "info");
      setScreen("login");
      return;
    }
    if (!hasRole(authUser, "ALICI")) {
      showToast("Favori işlemi yalnızca alıcı hesaplarında aktiftir.", "info");
      return;
    }

    const exists = favoriteIds.has(productId);
    try {
      if (exists) {
        await yoremioApi.removeFavorite(authUser.token, productId);
        setFavorites((prev) => prev.filter((item) => item.id !== productId));
        showToast("Ürün favorilerden çıkarıldı.", "info");
      } else {
        await yoremioApi.addFavorite(authUser.token, productId);
        const list = await yoremioApi.favoriteProducts(authUser.token);
        setFavorites(list);
        showToast("Ürün favorilerine eklendi!", "success");
      }
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
    }
  };

  const handleCreateDemand = async (
    product: ProductDto,
    miktar: number,
    note?: string,
  ) => {
    if (!authUser) {
      showToast("Talep oluşturmak için giriş yapmalısın.", "info");
      setScreen("login");
      return;
    }
    if (!hasRole(authUser, "ALICI")) {
      showToast("Talep yalnızca alıcı hesaplarıyla oluşturulabilir.", "info");
      return;
    }

    setActionStatus(`demand-${product.id}`);
    try {
      const created = await yoremioApi.createDemand(
        authUser.token,
        product.id,
        miktar,
        note,
      );
      setBuyerDemands((prev) => [created, ...prev]);
      showToast("Talebin üreticiye iletildi! Teklif geldiğinde bildirim alacaksın.", "success");
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
    } finally {
      setActionStatus(null);
    }
  };

  const handleAcceptOffer = async (offerId: number) => {
    if (!authUser) return;
    setActionStatus(`offer-accept-${offerId}`);
    try {
      await yoremioApi.acceptOffer(authUser.token, offerId);
      await loadAuthenticatedData(authUser);
      setInspectedDemandId(null);
      showToast("Teklif kabul edildi — durum Anlaşıldı olarak güncellendi!", "success");
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
    } finally {
      setActionStatus(null);
    }
  };

  const handleRejectOffer = async (offerId: number) => {
    if (!authUser) return;
    setActionStatus(`offer-reject-${offerId}`);
    try {
      await yoremioApi.rejectOffer(authUser.token, offerId);
      await loadAuthenticatedData(authUser);
      showToast("Teklif reddedildi.", "info");
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
    } finally {
      setActionStatus(null);
    }
  };

  const handleCancelDemand = (talepId: number) => {
    if (!authUser) return;
    setConfirmModal({
      title: "Talebi İptal Et",
      description:
        "Bu talebi iptal etmek istediğine emin misin? İptal edilen taleplere yeni teklif gönderilemez.",
      confirmLabel: "Evet, Talebi İptal Et",
      danger: true,
      onConfirm: async () => {
        setActionStatus(`demand-cancel-${talepId}`);
        try {
          await yoremioApi.cancelDemand(authUser.token, talepId);
          await loadAuthenticatedData(authUser);
          setInspectedDemandId(null);
          showToast("Talep iptal edildi.", "info");
        } catch (err) {
          const info = apiErrorInfo(err);
          showToast(info.message, "error", info.traceId);
        } finally {
          setActionStatus(null);
        }
      },
    });
  };

  const handleSubmitOffer = async (talepId: number, values: OfferSubmitValues) => {
    if (!authUser) return;
    setActionStatus(`offer-submit-${talepId}`);
    try {
      await yoremioApi.upsertOffer(authUser.token, talepId, values);
      await loadAuthenticatedData(authUser);
      setInspectedDemandId(null);
      showToast("Fiyat ve teslimat teklifin alıcıya iletildi!", "success");
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
    } finally {
      setActionStatus(null);
    }
  };

  const handleConfirmAgreement = async (talepId: number) => {
    if (!authUser) return;
    setActionStatus(`agreement-${talepId}`);
    try {
      await yoremioApi.confirmAgreement(authUser.token, talepId, true);
      await loadAuthenticatedData(authUser);
      showToast("Anlaşma/teslim onayınız kaydedildi!", "success");
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
    } finally {
      setActionStatus(null);
    }
  };

  const handleRepeatDemand = async (talepId: number) => {
    if (!authUser) return;
    setActionStatus(`demand-repeat-${talepId}`);
    try {
      const repeated = await yoremioApi.repeatDemand(authUser.token, talepId);
      setBuyerDemands((prev) => [repeated, ...prev]);
      showToast("Talebin yeniden açıldı!", "success");
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
    } finally {
      setActionStatus(null);
    }
  };

  const handleCreateOpenMarketDemand = async (values: OpenMarketDemandValues) => {
    if (!authUser) {
      showToast("Açık pazar talebi açmak için giriş yapmalısın.", "info");
      setScreen("login");
      return false;
    }
    setActionStatus("open-market-create");
    try {
      const created = await yoremioApi.createOpenMarketDemand(authUser.token, values);
      setBuyerDemands((prev) => [created, ...prev]);
      showToast("Açık pazar talebin uygun üreticilere iletildi!", "success");
      return true;
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
      return false;
    } finally {
      setActionStatus(null);
    }
  };

  const handleStartChatWithUser = (
    otherUserId: string,
    initialStoreName?: string,
    context?: ChatContextSelection,
  ) => {
    if (!authUser) {
      showToast("Mesajlaşmak için giriş yapmalısın.", "info");
      setScreen("login");
      return;
    }

    setConversations((prev) => {
      if (prev.some((c) => c.userId === otherUserId)) return prev;
      return [
        {
          userId: otherUserId,
          userName: initialStoreName || "Kullanıcı",
          magazaAdi: initialStoreName || null,
          lastMessage: "Yeni sohbet başlatılıyor",
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
        },
        ...prev,
      ];
    });
    setChatTargetId(otherUserId);
    setChatContext(context ?? null);

    if (hasRole(authUser, "SATICI")) {
      setSellerTab("chat");
      setScreen("seller");
    } else if (hasRole(authUser, "ALICI")) {
      setBuyerTab("chat");
      setScreen("buyer");
    } else {
      setScreen(dashboardScreenFor(authUser));
    }
  };

  const handleSendMessage = async (receiverId: string, message: string) => {
    if (!authUser) return;
    setActionStatus("chat-send");
    const activeCtx = chatContextRef.current;
    try {
      const hub = hubRef.current;
      if (hub && hub.state === signalR.HubConnectionState.Connected) {
        await sendChatMessage(
          hub,
          receiverId,
          message,
          activeCtx?.urunId ?? undefined,
          activeCtx?.talepId ?? undefined,
        );
      } else {
        const sent = await yoremioApi.sendMessage(
          authUser.token,
          receiverId,
          message,
          activeCtx?.urunId ?? undefined,
          activeCtx?.talepId ?? undefined,
        );
        setMessages((prev) => [...prev, sent]);
      }
    } catch {
      try {
        const sent = await yoremioApi.sendMessage(
          authUser.token,
          receiverId,
          message,
          activeCtx?.urunId ?? undefined,
          activeCtx?.talepId ?? undefined,
        );
        setMessages((prev) => [...prev, sent]);
      } catch (err) {
        const info = apiErrorInfo(err);
        showToast(info.message, "error", info.traceId);
      }
    } finally {
      setActionStatus(null);
    }
  };

  const handleSavePriceAlert = async (product: ProductDto, hedefFiyat: number) => {
    if (!authUser || !hasRole(authUser, "ALICI")) {
      showToast("Fiyat alarmı kurmak için alıcı olarak giriş yapmalısın.", "info");
      if (!authUser) setScreen("login");
      return;
    }
    try {
      const saved = await yoremioApi.savePriceAlert(authUser.token, product.id, hedefFiyat);
      setPriceAlerts((prev) => [saved, ...prev.filter((a) => a.urunId !== product.id)]);
      showToast(`${product.adi} için fiyat alarmı kaydedildi!`, "success");
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
    }
  };

  const handleDeletePriceAlert = async (urunId: number) => {
    if (!authUser) return;
    try {
      await yoremioApi.deletePriceAlert(authUser.token, urunId);
      setPriceAlerts((prev) => prev.filter((a) => a.urunId !== urunId));
      showToast("Fiyat alarmı kaldırıldı.", "info");
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
    }
  };

  const handleToggleStockAlarm = async (product: ProductDto) => {
    if (!authUser || !hasRole(authUser, "ALICI")) {
      showToast("Stok alarmı kurmak için alıcı olarak giriş yapmalısın.", "info");
      if (!authUser) setScreen("login");
      return;
    }
    try {
      if (stockAlarmProductIds.has(product.id)) {
        await yoremioApi.deleteStockAlert(authUser.token, product.id);
        setStockAlerts((prev) => prev.filter((a) => a.urunId !== product.id));
        showToast("Stok alarmı kaldırıldı.", "info");
      } else {
        const saved = await yoremioApi.saveStockAlert(authUser.token, product.id);
        setStockAlerts((prev) => [saved, ...prev.filter((a) => a.urunId !== product.id)]);
        showToast(`${product.adi} için stok alarmı aktif!`, "success");
      }
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
    }
  };

  const handleToggleFollowSeller = async (saticiId: string) => {
    if (!authUser || !hasRole(authUser, "ALICI")) {
      showToast("Üretici takip etmek için alıcı hesabıyla giriş yapmalısın.", "info");
      if (!authUser) setScreen("login");
      return;
    }
    try {
      if (followedSellerIds.has(saticiId)) {
        await yoremioApi.unfollowSeller(authUser.token, saticiId);
        setFollowedSellers((prev) => prev.filter((s) => s.kullaniciId !== saticiId));
        showToast("Üretici takibi bırakıldı.", "info");
      } else {
        await yoremioApi.followSeller(authUser.token, saticiId);
        const list = await yoremioApi.followedSellers(authUser.token);
        setFollowedSellers(list);
        showToast("Üretici takip edildi! Yeni ürün ve sevkiyatlarda bildirim alacaksın.", "success");
      }
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
    }
  };

  const handleJoinOrtakAlim = async (campaign: OrtakAlimDto) => {
    if (!authUser || !hasRole(authUser, "ALICI")) {
      showToast("Ortak alıma katılmak için alıcı hesabıyla giriş yapmalısın.", "info");
      if (!authUser) setScreen("login");
      return;
    }
    try {
      await yoremioApi.joinOrtakAlim(authUser.token, campaign.id, { katilimMiktari: 1 });
      const fresh = await yoremioApi.ortakAlimlar();
      setOrtakAlimlar(fresh.items);
      showToast(`"${campaign.baslik}" kampanyasına katılımın alındı!`, "success");
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
    }
  };

  const handleLeaveOrtakAlim = async (id: number) => {
    if (!authUser) return;
    try {
      await yoremioApi.leaveOrtakAlim(authUser.token, id);
      const fresh = await yoremioApi.ortakAlimlar();
      setOrtakAlimlar(fresh.items);
      showToast("Ortak alım kampanyasından ayrıldın.", "info");
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
    }
  };

  const handleCreateOrtakAlim = async (values: OrtakAlimCreateValues) => {
    if (!authUser) return false;
    setActionStatus("ortak-alim-create");
    try {
      await yoremioApi.createOrtakAlim(authUser.token, values);
      const fresh = await yoremioApi.ortakAlimlar();
      setOrtakAlimlar(fresh.items);
      showToast("Ortak alım kampanyası yayınlandı!", "success");
      return true;
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
      return false;
    } finally {
      setActionStatus(null);
    }
  };

  const handleApproveOrtakAlim = async (id: number) => {
    if (!authUser) return;
    try {
      await yoremioApi.approveOrtakAlim(authUser.token, id);
      const fresh = await yoremioApi.ortakAlimlar();
      setOrtakAlimlar(fresh.items);
      showToast("Ortak alım önerisi üretici tarafından onaylandı!", "success");
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
    }
  };

  const handleUpdateOrtakAlimStatus = async (id: number, durum: string) => {
    if (!authUser) return;
    try {
      await yoremioApi.updateOrtakAlimStatus(authUser.token, id, durum);
      const fresh = await yoremioApi.ortakAlimlar();
      setOrtakAlimlar(fresh.items);
      showToast("Ortak alım durumu güncellendi.", "success");
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
    }
  };

  const handleBulkUpdateStock = async (items: BulkStockItemValues[]) => {
    if (!authUser) return false;
    setActionStatus("bulk-stock");
    try {
      await yoremioApi.bulkUpdateStock(authUser.token, items);
      await Promise.all([loadAuthenticatedData(authUser), loadProducts()]);
      showToast("Ürün stok ve fiyatları toplu güncellendi!", "success");
      return true;
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
      return false;
    } finally {
      setActionStatus(null);
    }
  };

  const handleCreateShipment = async (values: PlanliGonderimCreateValues) => {
    if (!authUser) return false;
    setActionStatus("shipment-create");
    try {
      await yoremioApi.createPlanliGonderim(authUser.token, values);
      const [allShips, myShips] = await Promise.all([
        yoremioApi.planliGonderimler({ hedefSehir: selectedDeliveryCity || undefined }),
        yoremioApi.planliGonderimler({ saticiId: authUser.userId }),
      ]);
      setPlanliGonderimler(allShips);
      setSellerShipments(myShips);
      showToast("Planlı sevkiyat duyurusu yayınlandı!", "success");
      return true;
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
      return false;
    } finally {
      setActionStatus(null);
    }
  };

  const handleCancelShipment = async (id: number) => {
    if (!authUser) return;
    try {
      await yoremioApi.cancelPlanliGonderim(authUser.token, id);
      const [allShips, myShips] = await Promise.all([
        yoremioApi.planliGonderimler({ hedefSehir: selectedDeliveryCity || undefined }),
        yoremioApi.planliGonderimler({ saticiId: authUser.userId }),
      ]);
      setPlanliGonderimler(allShips);
      setSellerShipments(myShips);
      showToast("Planlı sevkiyat iptal edildi.", "info");
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
    }
  };

  const handleTyping = (receiverId: string) => {
    const hub = hubRef.current;
    if (hub && hub.state === signalR.HubConnectionState.Connected && receiverId) {
      void hub.invoke("SendTyping", receiverId).catch(() => {});
    }
  };

  const handleSaveProduct = async (values: ProductSubmitValues, urunId?: number) => {
    if (!authUser) return;
    setActionStatus("product-save");
    try {
      await yoremioApi.upsertProduct(authUser.token, values, urunId);
      await Promise.all([loadAuthenticatedData(authUser), loadProducts()]);
      setEditingProduct(null);
      setProductPrefillSource(null);
      setSellerTab("products");
      setScreen("seller");
      showToast(
        urunId ? "Ürün başarıyla güncellendi!" : "Yeni ürünün vitrine eklendi!",
        "success",
      );
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
    } finally {
      setActionStatus(null);
    }
  };

  const handleDeleteProduct = (product: ProductDto) => {
    if (!authUser) return;
    setConfirmModal({
      title: "Ürünü Sil",
      description: `"${product.adi}" ürününü kalıcı olarak silmek istediğine emin misin?`,
      confirmLabel: "Evet, Ürünü Sil",
      danger: true,
      onConfirm: async () => {
        setActionStatus(`delete-${product.id}`);
        try {
          await yoremioApi.deleteProduct(authUser.token, product.id);
          await Promise.all([loadAuthenticatedData(authUser), loadProducts()]);
          showToast("Ürün silindi.", "info");
        } catch (err) {
          const info = apiErrorInfo(err);
          showToast(info.message, "error", info.traceId);
        } finally {
          setActionStatus(null);
        }
      },
    });
  };

  const handleSaveSellerProfile = async (values: SellerProfileUpdateValues) => {
    if (!authUser) return;
    setActionStatus("seller-profile");
    try {
      const updated = await yoremioApi.updateSellerProfile(authUser.token, values);
      setSellerProfile(updated);
      setAuthUser((prev) =>
        prev
          ? {
              ...prev,
              magazaAdi: updated.magazaAdi,
              sehir: updated.sehir ?? prev.sehir,
              ilce: updated.ilce ?? prev.ilce,
            }
          : prev,
      );
      await Promise.all([loadPublicBase(), loadProducts()]);
      setScreen("seller");
      showToast("Mağaza profilin güncellendi!", "success");
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
    } finally {
      setActionStatus(null);
    }
  };

  const handleSaveBuyerProfile = async (values: BuyerProfileUpdateValues) => {
    if (!authUser) return false;
    setActionStatus("buyer-profile");
    try {
      const updated = await yoremioApi.updateBuyerProfile(authUser.token, values);
      setBuyerProfile(updated);
      setAuthUser((prev) =>
        prev
          ? {
              ...prev,
              userName: updated.userName ?? prev.userName,
              phoneNumber: updated.phoneNumber ?? prev.phoneNumber,
              sehir: updated.sehir ?? prev.sehir,
              ilce: updated.ilce ?? prev.ilce,
            }
          : prev,
      );
      await yoremioApi
        .recommendedProducts(authUser.token)
        .then(setRecommended)
        .catch(() => {});
      showToast("Alıcı profilin ve konum tercihlerin güncellendi!", "success");
      return true;
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
      return false;
    } finally {
      setActionStatus(null);
    }
  };

  const handleClearFilters = () => {
    setQuery("");
    setCategoryId(null);
    setCity("");
    setDistrict("");
    setTeslimatSehir("");
    setUretimSehir("");
    setMinPrice("");
    setMaxPrice("");
    setOnlyInStock(false);
    setVerifiedOnly(false);
    setSadeceYeniHasat(false);
    setSadeceEldenTeslim(false);
    setSadeceKargolu(false);
    setMinRating(null);
    setSort("newest");
    setPage(1);
  };

  const modalLayer = (
    <>
      <ConfirmModal
        open={Boolean(confirmModal)}
        title={confirmModal?.title ?? ""}
        description={confirmModal?.description ?? ""}
        confirmLabel={confirmModal?.confirmLabel}
        danger={confirmModal?.danger}
        pending={confirmPending}
        onCancel={() => {
          if (!confirmPending) setConfirmModal(null);
        }}
        onConfirm={async () => {
          if (!confirmModal) return;
          setConfirmPending(true);
          try {
            await confirmModal.onConfirm();
            setConfirmModal(null);
          } finally {
            setConfirmPending(false);
          }
        }}
      />

      <SellerStorefrontModal
        saticiId={storefrontSellerId}
        canFollow={hasRole(authUser, "ALICI")}
        isFollowing={Boolean(storefrontSellerId && followedSellerIds.has(storefrontSellerId))}
        onToggleFollow={handleToggleFollowSeller}
        onClose={() => setStorefrontSellerId(null)}
        onSelectProduct={(product) => {
          setStorefrontSellerId(null);
          setSelectedProduct(product);
          setScreen("discover");
        }}
        onStartChat={(saticiId) => {
          setStorefrontSellerId(null);
          handleStartChatWithUser(saticiId);
        }}
      />

      <DemandDetailModal
        demandId={inspectedDemandId}
        token={authUser?.token}
        mode={hasRole(authUser, "SATICI") ? "seller" : "buyer"}
        actionStatus={actionStatus}
        onClose={() => setInspectedDemandId(null)}
        onAcceptOffer={handleAcceptOffer}
        onRejectOffer={handleRejectOffer}
        onCancelDemand={handleCancelDemand}
        onConfirmAgreement={handleConfirmAgreement}
        onSubmitOffer={handleSubmitOffer}
        onStartChat={(otherUserId, context) => {
          setInspectedDemandId(null);
          handleStartChatWithUser(otherUserId, undefined, context);
        }}
        onGoReviews={async (urunId) => {
          setInspectedDemandId(null);
          try {
            const prod = await yoremioApi.product(urunId);
            void openReviewsForProduct(prod);
          } catch {
            setScreen("discover");
          }
        }}
      />

      <OpenMarketDemandModal
        open={openMarketOpen}
        categories={categories}
        initialProductName={query}
        initialCity={teslimatSehir || buyerProfile?.sehir || authUser?.sehir || ""}
        pending={actionStatus === "open-market-create"}
        onClose={() => setOpenMarketOpen(false)}
        onSubmit={handleCreateOpenMarketDemand}
      />

      {toast ? <Toast toast={toast} onClose={() => setToast(null)} /> : null}
    </>
  );

  // Screen rendering
  if (screen === "home") {
    return (
      <>
        <HomeScreen
          authUser={authUser}
          sellerProfile={sellerProfile}
          notificationUnreadCount={unreadCount}
          unreadMessageCount={unreadMessageCount}
          categories={categories}
          products={productsPage.items}
          featuredSellers={featuredSellers}
          planliGonderimler={planliGonderimler}
          ortakAlimlar={ortakAlimlar}
          cities={bootstrap?.cities}
          selectedDeliveryCity={selectedDeliveryCity}
          productsState={productsState}
          favoriteIds={favoriteIds}
          selectedCategoryId={categoryId}
          verifiedOnly={verifiedOnly}
          sort={sort}
          query={query}
          favoritesEnabled={favoritesEnabled}
          onSelectCategory={(id) => {
            setCategoryId(id);
            setPage(1);
          }}
          onDeliveryCityChange={(val) => {
            setSelectedDeliveryCity(val);
            void yoremioApi
              .planliGonderimler({ hedefSehir: val || undefined })
              .then(setPlanliGonderimler)
              .catch(() => {});
          }}
          onToggleVerifiedOnly={(val) => {
            setVerifiedOnly(val);
            setPage(1);
          }}
          onSelectSort={(val) => {
            setSort(val);
            setPage(1);
          }}
          onQueryChange={(val) => {
            setQuery(val);
            setPage(1);
          }}
          onOpenProduct={(product) => {
            setSelectedProduct(product);
            setScreen("discover");
          }}
          onOpenStorefront={(id) => setStorefrontSellerId(id)}
          onToggleFavorite={handleToggleFavorite}
          onOpenOpenMarketModal={() => {
            if (!authUser) {
              showToast("Açık talep açmak için giriş yapmalısın.", "info");
              setScreen("login");
              return;
            }
            setOpenMarketOpen(true);
          }}
          onJoinOrtakAlim={handleJoinOrtakAlim}
          onNavigate={setScreen}
          onLogout={handleLogout}
          onRetry={() => void loadProducts()}
        />
        {modalLayer}
      </>
    );
  }

  if (screen === "discover") {
    return (
      <>
        <DiscoveryScreen
          authUser={authUser}
          sellerProfile={sellerProfile}
          notificationUnreadCount={unreadCount}
          unreadMessageCount={unreadMessageCount}
          categories={categories}
          locations={bootstrap?.locations}
          cities={bootstrap?.cities}
          productsPage={productsPage}
          productsState={productsState}
          selectedProduct={selectedProduct}
          favoriteIds={favoriteIds}
          query={query}
          categoryId={categoryId}
          city={city}
          district={district}
          teslimatSehir={teslimatSehir}
          uretimSehir={uretimSehir}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onlyInStock={onlyInStock}
          verifiedOnly={verifiedOnly}
          sadeceYeniHasat={sadeceYeniHasat}
          sadeceEldenTeslim={sadeceEldenTeslim}
          sadeceKargolu={sadeceKargolu}
          minRating={minRating}
          sort={sort}
          sortOptions={sortOptions}
          smartAlternatives={smartAlternatives}
          priceAlarmProductIds={priceAlarmProductIds}
          stockAlarmProductIds={stockAlarmProductIds}
          followedSellerIds={followedSellerIds}
          actionStatus={actionStatus}
          demandFlowEnabled={demandFlowEnabled}
          favoritesEnabled={favoritesEnabled}
          chatEnabled={chatEnabled}
          onQueryChange={(val) => {
            setQuery(val);
            setPage(1);
          }}
          onCategoryChange={(val) => {
            setCategoryId(val);
            setPage(1);
          }}
          onCityChange={(val) => {
            setCity(val);
            setPage(1);
          }}
          onDistrictChange={(val) => {
            setDistrict(val);
            setPage(1);
          }}
          onTeslimatSehirChange={(val) => {
            setTeslimatSehir(val);
            setPage(1);
          }}
          onUretimSehirChange={(val) => {
            setUretimSehir(val);
            setPage(1);
          }}
          onMinPriceChange={(val) => {
            setMinPrice(val);
            setPage(1);
          }}
          onMaxPriceChange={(val) => {
            setMaxPrice(val);
            setPage(1);
          }}
          onOnlyInStockChange={(val) => {
            setOnlyInStock(val);
            setPage(1);
          }}
          onVerifiedOnlyChange={(val) => {
            setVerifiedOnly(val);
            setPage(1);
          }}
          onSadeceYeniHasatChange={(val) => {
            setSadeceYeniHasat(val);
            setPage(1);
          }}
          onSadeceEldenTeslimChange={(val) => {
            setSadeceEldenTeslim(val);
            setPage(1);
          }}
          onSadeceKargoluChange={(val) => {
            setSadeceKargolu(val);
            setPage(1);
          }}
          onMinRatingChange={(val) => {
            setMinRating(val);
            setPage(1);
          }}
          onSortChange={(val) => {
            setSort(val);
            setPage(1);
          }}
          onPageChange={setPage}
          onSelectProduct={setSelectedProduct}
          onOpenStorefront={(id) => setStorefrontSellerId(id)}
          onCreateDemand={handleCreateDemand}
          onOpenOpenMarketModal={() => {
            if (!authUser) {
              showToast("Açık talep açmak için giriş yapmalısın.", "info");
              setScreen("login");
              return;
            }
            setOpenMarketOpen(true);
          }}
          onSavePriceAlert={handleSavePriceAlert}
          onToggleStockAlarm={handleToggleStockAlarm}
          onToggleFollowSeller={handleToggleFollowSeller}
          onJoinOrtakAlim={handleJoinOrtakAlim}
          onToggleFavorite={handleToggleFavorite}
          onStartChat={(product) => {
            if (product.saticiId) {
              handleStartChatWithUser(product.saticiId, product.saticiMagazaAdi ?? undefined, {
                urunId: product.id,
                label: product.adi,
              });
            }
          }}
          onGoReviews={(product) => void openReviewsForProduct(product)}
          onClearFilters={handleClearFilters}
          onRetry={() => void loadProducts()}
          onNavigate={setScreen}
          onLogout={handleLogout}
        />
        {modalLayer}
      </>
    );
  }

  if (screen === "login") {
    return (
      <>
        <LoginScreen
          onBack={() => setScreen("home")}
          onNavigate={setScreen}
          onAuthComplete={handleAuthComplete}
          onNeedsVerification={(email) => {
            setPendingVerifyEmail(email);
            setScreen("verify");
          }}
          showToast={showToast}
        />
        {modalLayer}
      </>
    );
  }

  if (screen === "buyer-register") {
    return (
      <>
        <BuyerRegisterScreen
          locations={bootstrap?.locations}
          cities={bootstrap?.cities}
          onBack={() => setScreen("home")}
          onNavigate={setScreen}
          onRegistered={(email) => {
            setPendingVerifyEmail(email);
            setScreen("verify");
          }}
          showToast={showToast}
        />
        {modalLayer}
      </>
    );
  }

  if (screen === "seller-register") {
    return (
      <>
        <SellerRegisterScreen
          locations={bootstrap?.locations}
          cities={bootstrap?.cities}
          onBack={() => setScreen("home")}
          onNavigate={setScreen}
          onRegistered={(email) => {
            setPendingVerifyEmail(email);
            setScreen("verify");
          }}
          showToast={showToast}
        />
        {modalLayer}
      </>
    );
  }

  if (screen === "verify") {
    return (
      <>
        <VerificationScreen
          initialEmail={pendingVerifyEmail}
          devVerificationInboxEnabled={devVerificationInboxEnabled}
          onBack={() => setScreen("home")}
          onNavigate={setScreen}
          showToast={showToast}
        />
        {modalLayer}
      </>
    );
  }

  if (screen === "buyer") {
    if (!authUser || !hasRole(authUser, "ALICI")) {
      return (
        <>
          <AccessRequiredScreen
            title="Alıcı Paneli Yetkisi Gerekli"
            text="Taleplerini, favorilerini ve mesajlarını yönetmek için alıcı hesabıyla giriş yapmalısın."
            onLogin={() => setScreen("login")}
            onHome={() => setScreen("home")}
          />
          {modalLayer}
        </>
      );
    }

    return (
      <>
        <BuyerDashboard
          authUser={authUser}
          activeTab={buyerTab}
          onTabChange={setBuyerTab}
          notificationUnreadCount={unreadCount}
          unreadMessageCount={unreadMessageCount}
          favorites={favorites}
          recommended={recommended}
          demands={buyerDemands}
          priceAlerts={priceAlerts}
          stockAlerts={stockAlerts}
          followedSellers={followedSellers}
          ortakAlimlar={ortakAlimlar}
          planliGonderimler={planliGonderimler}
          buyerProfile={buyerProfile}
          categories={categories}
          locations={bootstrap?.locations}
          cities={bootstrap?.cities}
          conversations={conversations}
          messages={messages}
          chatTargetId={chatTargetId}
          chatContext={chatContext}
          actionStatus={actionStatus}
          signalrConnected={effectiveSignalrConnected}
          typingFromUserId={typingFromUserId}
          chatEnabled={chatEnabled}
          favoritesEnabled={favoritesEnabled}
          onSelectChatTarget={(id, ctx) => {
            setChatTargetId(id);
            if (ctx) setChatContext(ctx);
          }}
          onClearChatContext={() => setChatContext(null)}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onAcceptOffer={handleAcceptOffer}
          onRejectOffer={handleRejectOffer}
          onCancelDemand={handleCancelDemand}
          onRepeatDemand={handleRepeatDemand}
          onOpenOpenMarketModal={() => setOpenMarketOpen(true)}
          onDeletePriceAlert={handleDeletePriceAlert}
          onDeleteStockAlarm={(urunId) => {
            const found = stockAlerts.find((a) => a.urunId === urunId);
            if (found) {
              void yoremioApi
                .deleteStockAlert(authUser.token, urunId)
                .then(() => {
                  setStockAlerts((prev) => prev.filter((a) => a.urunId !== urunId));
                  showToast("Stok alarmı kaldırıldı.", "info");
                })
                .catch(() => {});
            }
          }}
          onUnfollowSeller={handleToggleFollowSeller}
          onJoinOrtakAlim={handleJoinOrtakAlim}
          onLeaveOrtakAlim={handleLeaveOrtakAlim}
          onSuggestOrtakAlim={handleCreateOrtakAlim}
          onInspectDemand={(id) => setInspectedDemandId(id)}
          onOpenProduct={(product) => {
            setSelectedProduct(product);
            setScreen("discover");
          }}
          onOpenStorefront={(id) => setStorefrontSellerId(id)}
          onToggleFavorite={handleToggleFavorite}
          onSaveProfile={handleSaveBuyerProfile}
          onNavigate={setScreen}
          onLogout={handleLogout}
        />
        {modalLayer}
      </>
    );
  }

  if (screen === "seller") {
    if (!authUser || !hasRole(authUser, "SATICI")) {
      return (
        <>
          <AccessRequiredScreen
            title="Üretici / Satıcı Yetkisi Gerekli"
            text="Mağaza paneline erişmek için doğrulanmış bir satıcı hesabıyla oturum açmalısın."
            onLogin={() => setScreen("login")}
            onHome={() => setScreen("home")}
          />
          {modalLayer}
        </>
      );
    }

    return (
      <>
        <SellerDashboard
          authUser={authUser}
          activeTab={sellerTab}
          onTabChange={setSellerTab}
          profile={sellerProfile}
          sellerStats={sellerStats}
          trustScore={sellerTrustScore}
          products={sellerProducts}
          demands={sellerDemands}
          marketDemands={marketDemands}
          sellerShipments={sellerShipments}
          ortakAlimlar={ortakAlimlar}
          conversations={conversations}
          messages={messages}
          chatTargetId={chatTargetId}
          chatContext={chatContext}
          notificationUnreadCount={unreadCount}
          unreadMessageCount={unreadMessageCount}
          actionStatus={actionStatus}
          signalrConnected={effectiveSignalrConnected}
          typingFromUserId={typingFromUserId}
          chatEnabled={chatEnabled}
          onSelectChatTarget={(id, ctx) => {
            setChatTargetId(id);
            if (ctx) setChatContext(ctx);
          }}
          onClearChatContext={() => setChatContext(null)}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onCreateProduct={() => {
            setEditingProduct(null);
            setProductPrefillSource(null);
            setScreen("seller-product");
          }}
          onEditProduct={(product) => {
            setEditingProduct(product);
            setProductPrefillSource(null);
            setScreen("seller-product");
          }}
          onDuplicateProduct={(product) => {
            setEditingProduct(null);
            setProductPrefillSource(product);
            setScreen("seller-product");
          }}
          onToggleProductStatus={async (product) => {
            setActionStatus(`status-${product.id}`);
            try {
              await yoremioApi.updateProductStatus(
                authUser.token,
                product.id,
                product.aktifMi === false,
              );
              await Promise.all([loadAuthenticatedData(authUser), loadProducts()]);
              showToast("Ürün vitrin durumu güncellendi.", "success");
            } catch (err) {
              const info = apiErrorInfo(err);
              showToast(info.message, "error", info.traceId);
            } finally {
              setActionStatus(null);
            }
          }}
          onDeleteProduct={handleDeleteProduct}
          onBulkUpdateStock={handleBulkUpdateStock}
          onCreateShipment={handleCreateShipment}
          onCancelShipment={handleCancelShipment}
          onCreateOrtakAlim={handleCreateOrtakAlim}
          onApproveOrtakAlim={handleApproveOrtakAlim}
          onUpdateOrtakAlimStatus={handleUpdateOrtakAlimStatus}
          onInspectDemand={(id) => setInspectedDemandId(id)}
          onOpenStorefront={(id) => setStorefrontSellerId(id)}
          onNavigate={setScreen}
          onLogout={handleLogout}
        />
        {modalLayer}
      </>
    );
  }

  if (screen === "seller-product") {
    if (!authUser || !hasRole(authUser, "SATICI")) {
      return (
        <>
          <AccessRequiredScreen
            title="Satıcı Yetkisi Gerekli"
            text="Ürün eklemek veya düzenlemek için satıcı hesabıyla giriş yapmalısın."
            onLogin={() => setScreen("login")}
            onHome={() => setScreen("home")}
          />
          {modalLayer}
        </>
      );
    }

    return (
      <>
        <SellerProductScreen
          key={editingProduct?.id ?? productPrefillSource?.id ?? "new"}
          categories={categories}
          editingProduct={editingProduct}
          prefillSource={productPrefillSource}
          bootstrapUploads={bootstrap?.uploads}
          actionStatus={actionStatus}
          onBack={() => setScreen("seller")}
          onSubmit={handleSaveProduct}
          onDeleteImage={async (urunId, resimId) => {
            await yoremioApi.deleteProductImage(authUser.token, urunId, resimId);
            const updated = await yoremioApi.product(urunId);
            setEditingProduct(updated);
            await loadAuthenticatedData(authUser);
            showToast("Ürün görseli kaldırıldı.", "info");
          }}
          onDeleteVideo={async (urunId, videoId) => {
            await yoremioApi.deleteProductVideo(authUser.token, urunId, videoId);
            const updated = await yoremioApi.product(urunId);
            setEditingProduct(updated);
            await loadAuthenticatedData(authUser);
            showToast("Ürün videosu kaldırıldı.", "info");
          }}
          showToast={showToast}
        />
        {modalLayer}
      </>
    );
  }

  if (screen === "seller-profile") {
    if (!authUser || !hasRole(authUser, "SATICI")) {
      return (
        <>
          <AccessRequiredScreen
            title="Satıcı Yetkisi Gerekli"
            text="Mağaza bilgilerini yönetmek için satıcı hesabıyla giriş yapmalısın."
            onLogin={() => setScreen("login")}
            onHome={() => setScreen("home")}
          />
          {modalLayer}
        </>
      );
    }

    return (
      <>
        <SellerProfileScreen
          key={sellerProfile?.kullaniciId ?? "profile"}
          profile={sellerProfile}
          trustScore={sellerTrustScore}
          locations={bootstrap?.locations}
          cities={bootstrap?.cities}
          maxImageBytes={bootstrap?.uploads?.maxImageBytes}
          actionStatus={actionStatus}
          onBack={() => setScreen("seller")}
          onSave={handleSaveSellerProfile}
          onOpenStorefront={(id) => setStorefrontSellerId(id)}
        />
        {modalLayer}
      </>
    );
  }

  if (screen === "admin") {
    if (!authUser || !hasRole(authUser, "ADMIN")) {
      return (
        <>
          <AccessRequiredScreen
            title="Yönetici Yetkisi Gerekli"
            text="Kategori ve platform yönetimi yalnızca Admin rolündeki hesaplara açıktır."
            onLogin={() => setScreen("login")}
            onHome={() => setScreen("home")}
          />
          {modalLayer}
        </>
      );
    }

    return (
      <>
        <AdminDashboard
          authUser={authUser}
          activeTab={adminTab}
          onTabChange={setAdminTab}
          adminStats={adminStats}
          categories={categories}
          totalProducts={productsPage.totalCount}
          featuredSellerCount={featuredSellers.length}
          unreadNotifications={unreadCount}
          actionStatus={actionStatus}
          showToast={showToast}
          onModerationUpdated={() => {
            void yoremioApi
              .adminDashboard(authUser.token)
              .then(setAdminStats)
              .catch(() => {});
            void loadPublicBase();
            void loadProducts();
          }}
          onCreateCategory={async (values: CategoryFormValues) => {
            setActionStatus("category-save");
            try {
              await yoremioApi.createCategory(authUser.token, values);
              const fresh = await yoremioApi.categories();
              setCategories(fresh);
              showToast("Kategori eklendi!", "success");
              return true;
            } catch (err) {
              const info = apiErrorInfo(err);
              showToast(info.message, "error", info.traceId);
              return false;
            } finally {
              setActionStatus(null);
            }
          }}
          onUpdateCategory={async (id, values) => {
            setActionStatus("category-save");
            try {
              await yoremioApi.updateCategory(authUser.token, id, values);
              const fresh = await yoremioApi.categories();
              setCategories(fresh);
              showToast("Kategori güncellendi!", "success");
              return true;
            } catch (err) {
              const info = apiErrorInfo(err);
              showToast(info.message, "error", info.traceId);
              return false;
            } finally {
              setActionStatus(null);
            }
          }}
          onDeleteCategory={(category) => {
            setConfirmModal({
              title: "Kategoriyi Sil",
              description: `"${category.adi}" kategorisini silmek istediğine emin misin?`,
              confirmLabel: "Evet, Sil",
              danger: true,
              onConfirm: async () => {
                setActionStatus(`category-delete-${category.id}`);
                try {
                  await yoremioApi.deleteCategory(authUser.token, category.id);
                  const fresh = await yoremioApi.categories();
                  setCategories(fresh);
                  showToast("Kategori silindi.", "info");
                } catch (err) {
                  const info = apiErrorInfo(err);
                  showToast(info.message, "error", info.traceId);
                } finally {
                  setActionStatus(null);
                }
              },
            });
          }}
          onNavigate={setScreen}
          onLogout={handleLogout}
        />
        {modalLayer}
      </>
    );
  }

  if (screen === "reviews") {
    return (
      <>
        <ReviewsScreen
          authUser={authUser}
          sellerProfile={sellerProfile}
          notificationUnreadCount={unreadCount}
          unreadMessageCount={unreadMessageCount}
          product={reviewProduct}
          comments={comments}
          ratings={ratings}
          eligibility={eligibility}
          averageScore={averageScore}
          actionStatus={actionStatus}
          ratingsEnabled={ratingsEnabled}
          reviewsEnabled={reviewsEnabled}
          onBack={() => setScreen("discover")}
          onRate={async (score) => {
            if (!authUser || !reviewProduct) {
              showToast("Puan vermek için giriş yapmalısın.", "info");
              setScreen("login");
              return;
            }
            setActionStatus("rate");
            try {
              const res = await yoremioApi.rateProduct(
                authUser.token,
                reviewProduct.id,
                score,
              );
              const nextAvg = res.urunOrtalama ?? res.ortalama;
              setAverageScore(nextAvg);
              const [freshRatings, freshElig] = await Promise.all([
                yoremioApi.productRatings(reviewProduct.id),
                yoremioApi.reviewEligibility(authUser.token, reviewProduct.id).catch(() => null),
              ]);
              setRatings(freshRatings);
              if (freshElig) setEligibility(freshElig);
              showToast("Puanın kaydedildi!", "success");
            } catch (err) {
              const info = apiErrorInfo(err);
              showToast(info.message, "error", info.traceId);
            } finally {
              setActionStatus(null);
            }
          }}
          onAddComment={async (text) => {
            if (!authUser || !reviewProduct) {
              showToast("Yorum eklemek için giriş yapmalısın.", "info");
              setScreen("login");
              return false;
            }
            setActionStatus("comment-add");
            try {
              await yoremioApi.addComment(authUser.token, reviewProduct.id, text);
              const fresh = await yoremioApi.comments(reviewProduct.id);
              setComments(fresh);
              showToast("Yorumun eklendi!", "success");
              return true;
            } catch (err) {
              const info = apiErrorInfo(err);
              showToast(info.message, "error", info.traceId);
              return false;
            } finally {
              setActionStatus(null);
            }
          }}
          onUpdateComment={async (yorumId, text) => {
            if (!authUser || !reviewProduct) return false;
            setActionStatus(`comment-edit-${yorumId}`);
            try {
              await yoremioApi.updateComment(
                authUser.token,
                yorumId,
                reviewProduct.id,
                text,
              );
              const fresh = await yoremioApi.comments(reviewProduct.id);
              setComments(fresh);
              showToast("Yorumun güncellendi!", "success");
              return true;
            } catch (err) {
              const info = apiErrorInfo(err);
              showToast(info.message, "error", info.traceId);
              return false;
            } finally {
              setActionStatus(null);
            }
          }}
          onDeleteComment={(yorumId) => {
            if (!authUser || !reviewProduct) return;
            setConfirmModal({
              title: "Yorumu Sil",
              description: "Kendi yorumunu kalıcı olarak silmek istediğine emin misin?",
              confirmLabel: "Evet, Sil",
              danger: true,
              onConfirm: async () => {
                await yoremioApi.deleteComment(authUser.token, yorumId);
                const fresh = await yoremioApi.comments(reviewProduct.id);
                setComments(fresh);
                showToast("Yorum silindi.", "info");
              },
            });
          }}
          onOpenStorefront={(id) => setStorefrontSellerId(id)}
          onNavigate={setScreen}
          onLogout={handleLogout}
        />
        {modalLayer}
      </>
    );
  }

  return (
    <>
      <GlobalStatesScreen
        authUser={authUser}
        sellerProfile={sellerProfile}
        notifications={notifications}
        unreadCount={unreadCount}
        unreadMessageCount={unreadMessageCount}
        lastErrorTraceId={lastErrorTraceId}
        actionStatus={actionStatus}
        onMarkRead={async (id) => {
          if (!authUser) return;
          setActionStatus(`notif-${id}`);
          try {
            await yoremioApi.markNotificationRead(authUser.token, id);
            setNotifications((prev) =>
              prev.map((n) => (n.id === id ? { ...n, okunduMu: true } : n)),
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
          } finally {
            setActionStatus(null);
          }
        }}
        onMarkAllRead={async () => {
          if (!authUser) return;
          await yoremioApi.markAllNotificationsRead(authUser.token);
          setNotifications((prev) => prev.map((n) => ({ ...n, okunduMu: true })));
          setUnreadCount(0);
          showToast("Tüm bildirimler okundu işaretlendi.", "info");
        }}
        onInspectNotification={(item) => {
          const url = (item.aksiyonUrl ?? "").toLowerCase();
          const tur = (item.tur ?? "").toLowerCase();
          if (url.includes("mesaj") || tur.includes("mesaj") || tur.includes("chat")) {
            if (hasRole(authUser, "SATICI")) setSellerTab("chat");
            else setBuyerTab("chat");
            setScreen(buyerScreenFor(authUser));
            return;
          }
          if (url.includes("talep") || tur.includes("talep") || tur.includes("teklif")) {
            if (hasRole(authUser, "SATICI")) setSellerTab("demands");
            else setBuyerTab("demands");
            setScreen(dashboardScreenFor(authUser));
            return;
          }
          setScreen(dashboardScreenFor(authUser));
        }}
        onNavigate={setScreen}
        onLogout={handleLogout}
        showToast={showToast}
      />
      {modalLayer}
    </>
  );
}
