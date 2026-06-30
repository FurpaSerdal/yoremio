"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { HubConnectionState, type HubConnection } from "@microsoft/signalr";
import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bell,
  Check,
  CircleDollarSign,
  Clock3,
  Edit3,
  Filter,
  Heart,
  ImagePlus,
  Inbox,
  Leaf,
  Loader2,
  LogOut,
  MapPin,
  MessageCircle,
  PackagePlus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Star,
  Store,
  Trash2,
  Truck,
  UploadCloud,
  UserRound,
  Users,
  Video,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/yoremio/brand-logo";
import { bindChatEvents, createChatConnection } from "@/lib/chat";
import {
  API_BASE_URL,
  ApiClientError,
  mediaUrl,
  yoremioApi,
  type AppBootstrapDto,
  type AppFeatureFlags,
  type AppUploadsConfig,
  type AdminDashboardDto,
  type CategoryDto,
  type ChatConversationDto,
  type ChatMessageDto,
  type DashboardSummaryDto,
  type DemandDto,
  type LoginResponse,
  type Paginated,
  type ProductDto,
  type ProductFormValues,
  type SellerProfileDto,
  type SellerDashboardDto,
  type SellerTrustScoreDto,
  type SessionUser,
  type UserRole,
} from "@/lib/api";
import { cn, formatPrice, formatShortDate } from "@/lib/utils";

const PAGE_SIZE = 12;

const workspaces = [
  { id: "buyer", label: "Alıcı", icon: Heart },
  { id: "seller", label: "Satıcı", icon: Store },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "admin", label: "Admin", icon: ShieldCheck },
] as const;

const categoryTones = [
  "bg-emerald-50 text-emerald-800 border-emerald-200",
  "bg-rose-50 text-rose-800 border-rose-200",
  "bg-sky-50 text-sky-800 border-sky-200",
  "bg-violet-50 text-violet-800 border-violet-200",
  "bg-amber-50 text-amber-900 border-amber-200",
];

const productPlaceholderImage = "/products/product-placeholder.svg";
const categoryImages = [
  "/products/photo-tulum-peyniri.jpg",
  "/products/photo-yayla-bali.jpg",
  "/products/photo-koy-yumurtasi.jpg",
  "/products/photo-tarla-domatesi.jpg",
  "/products/photo-kocbasi-nohut.jpg",
  "/products/photo-amasya-elmasi.jpg",
];

type Workspace = (typeof workspaces)[number]["id"];
type SortKey = string;
type AuthState = SessionUser & Pick<LoginResponse, "token">;
type ToastKind = "success" | "error" | "info";
type ToastState = {
  kind: ToastKind;
  message: string;
} | null;
type LoadState = "idle" | "loading" | "error";

const fallbackProductSorts = [
  "newest",
  "oldest",
  "price_asc",
  "price_desc",
  "name_asc",
  "name_desc",
  "top_rated",
  "most_reviewed",
  "most_favorited",
];

const sortLabels: Record<string, string> = {
  newest: "En yeni",
  oldest: "En eski",
  price_asc: "Fiyat artan",
  price_desc: "Fiyat azalan",
  name_asc: "İsim A-Z",
  name_desc: "İsim Z-A",
  top_rated: "En yüksek puan",
  most_reviewed: "En çok yorum",
  most_favorited: "En çok favori",
};

function rolesOf(authUser: AuthState | null) {
  if (!authUser) return [];
  return authUser.roles?.length ? authUser.roles : [authUser.role];
}

function hasRole(authUser: AuthState | null, role: UserRole) {
  return rolesOf(authUser).includes(role);
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function uploadValidationMessage(
  files: File[],
  limitBytes: number,
  typePrefixes: string[],
  label: string,
) {
  const invalidType = files.find(
    (file) => !typePrefixes.some((prefix) => file.type.startsWith(prefix)),
  );
  if (invalidType) return `${label} dosyası desteklenmiyor: ${invalidType.name}`;

  const oversize = files.find((file) => file.size > limitBytes);
  if (oversize) {
    return `${oversize.name} en fazla ${formatBytes(limitBytes)} olabilir.`;
  }

  return null;
}

function productUploadValidationMessage(
  values: ProductFormValues,
  uploads?: AppUploadsConfig,
) {
  if (!uploads) return null;

  const imagesMessage = uploadValidationMessage(
    values.resimler ?? [],
    uploads.maxImageBytes,
    uploads.imageContentTypePrefixes,
    "Resim",
  );
  if (imagesMessage) return imagesMessage;

  const videosMessage = uploadValidationMessage(
    values.videolar ?? [],
    uploads.maxVideoBytes,
    uploads.videoContentTypePrefixes,
    "Video",
  );
  if (videosMessage) return videosMessage;

  const totalBytes = [...(values.resimler ?? []), ...(values.videolar ?? [])].reduce(
    (sum, file) => sum + file.size,
    0,
  );

  if (totalBytes > uploads.maxMultipartBodyBytes) {
    return `Toplam medya boyutu en fazla ${formatBytes(uploads.maxMultipartBodyBytes)} olabilir.`;
  }

  return null;
}

function emptyProductsResult(page = 1): Paginated<ProductDto> {
  return {
    items: [],
    page,
    pageSize: PAGE_SIZE,
    totalCount: 0,
    totalPages: 1,
  };
}

const emptyProductsPage: Paginated<ProductDto> = {
  items: [],
  page: 1,
  pageSize: PAGE_SIZE,
  totalCount: 0,
  totalPages: 1,
};

function apiErrorMessage(error: unknown) {
  return error instanceof ApiClientError
    ? error.message
    : "Beklenmeyen bir hata oluştu.";
}

function productImage(product: ProductDto) {
  const firstImage = product.resimler?.[0]?.url?.trim();

  if (!firstImage || firstImage.startsWith("/products/")) {
    return productPlaceholderImage;
  }

  const remote = mediaUrl(firstImage);
  if (remote) return remote;

  return productPlaceholderImage;
}

function categoryTone(categoryId: number) {
  return categoryTones[(categoryId - 1) % categoryTones.length];
}

function sellerName(product: ProductDto) {
  return product.saticiMagazaAdi ?? "Yöremio satıcısı";
}

function conversationName(conversation?: ChatConversationDto | null) {
  return conversation?.userName ?? conversation?.email ?? "Yöremio kullanıcısı";
}

function productLocation(product: ProductDto) {
  const parts = [product.saticiSehir, product.saticiIlce].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "Konum belirtilmedi";
}

function roleLabel(role: UserRole) {
  if (role === "ADMIN") return "Admin";
  return role === "SATICI" ? "Satıcı" : "Alıcı";
}

function accountDisplayName(
  authUser: AuthState | null,
  sellerProfile?: SellerProfileDto | null,
) {
  if (!authUser) return "";
  if (hasRole(authUser, "SATICI")) {
    return sellerProfile?.magazaAdi?.trim() || "Satıcı hesabı";
  }

  return authUser.userName && !authUser.userName.includes("@")
    ? authUser.userName
    : "Alıcı hesabı";
}

export function YoremioMarketplace() {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<number | "all">("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [minRating, setMinRating] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [workspace, setWorkspace] = useState<Workspace>("buyer");
  const [authOpen, setAuthOpen] = useState(false);
  const [authPreferredRole, setAuthPreferredRole] = useState<UserRole>("ALICI");
  const [authUser, setAuthUser] = useState<AuthState | null>(null);
  const [bootstrap, setBootstrap] = useState<AppBootstrapDto | null>(null);
  const [dashboardSummary, setDashboardSummary] =
    useState<DashboardSummaryDto | null>(null);
  const [sellerDashboard, setSellerDashboard] =
    useState<SellerDashboardDto | null>(null);
  const [adminDashboard, setAdminDashboard] = useState<AdminDashboardDto | null>(null);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [productsPage, setProductsPage] =
    useState<Paginated<ProductDto>>(emptyProductsPage);
  const [, setMarketState] = useState<LoadState>("idle");
  const [marketError, setMarketError] = useState<string | null>(null);
  const [activeProductId, setActiveProductId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [productDetail, setProductDetail] = useState<ProductDto | null>(null);
  const [trustScore, setTrustScore] = useState<SellerTrustScoreDto | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [favoriteProducts, setFavoriteProducts] = useState<ProductDto[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<ProductDto[]>([]);
  const [buyerDemands, setBuyerDemands] = useState<DemandDto[]>([]);
  const [sellerProfile, setSellerProfile] = useState<SellerProfileDto | null>(null);
  const [sellerProducts, setSellerProducts] = useState<ProductDto[]>([]);
  const [sellerDemands, setSellerDemands] = useState<DemandDto[]>([]);
  const [conversations, setConversations] = useState<ChatConversationDto[]>([]);
  const [chatTargetId, setChatTargetId] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessageDto[]>([]);
  const [chatState, setChatState] = useState<LoadState>("idle");
  const [signalRState, setSignalRState] = useState("Kapalı");
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const chatConnection = useRef<HubConnection | null>(null);
  const productSorts = bootstrap?.productSorts?.length
    ? bootstrap.productSorts
    : fallbackProductSorts;

  const openSellerWorkspace = useCallback(() => {
    setWorkspace("seller");
    if (!hasRole(authUser, "SATICI")) {
      setAuthPreferredRole("SATICI");
      setAuthOpen(true);
    }
    window.setTimeout(() => {
      document.getElementById("paneller")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 50);
  }, [authUser]);

  const selectedProduct =
    productDetail ??
    (activeProductId === null
      ? undefined
      : productsPage.items.find((product) => product.id === activeProductId)) ??
    productsPage.items[0] ??
    null;

  const selectedCategory =
    categoryId === "all"
      ? undefined
      : categories.find((category) => category.id === categoryId);

  const showToast = useCallback((message: string, kind: ToastKind) => {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 4600);
  }, []);

  const clearSession = useCallback(() => {
    window.localStorage.removeItem("yoremio-token");
    window.localStorage.removeItem("yoremio-user");
    setAuthUser(null);
    setFavoriteIds(new Set());
    setFavoriteProducts([]);
    setRecommendedProducts([]);
    setBuyerDemands([]);
    setSellerProfile(null);
    setSellerProducts([]);
    setSellerDemands([]);
    setDashboardSummary(null);
    setSellerDashboard(null);
    setAdminDashboard(null);
    setConversations([]);
    setChatMessages([]);
    setChatTargetId("");
  }, []);

  const refreshSelectedProduct = useCallback(
    async (productId = activeProductId) => {
      if (productId === null) return;

      try {
        const freshProduct = await yoremioApi.product(productId);
        setProductDetail(freshProduct);
        setProductsPage((current) => ({
          ...current,
          items: current.items.map((item) =>
            item.id === freshProduct.id ? freshProduct : item,
          ),
        }));
      } catch (error) {
        setMarketError(apiErrorMessage(error));
      }
    },
    [activeProductId],
  );

  const refreshRoleData = useCallback(async () => {
    if (!authUser) return;

    try {
      const [nextConversations, nextSummary] = await Promise.all([
        yoremioApi.conversations(authUser.token),
        yoremioApi.dashboardSummary(authUser.token),
      ]);
      setConversations(nextConversations);
      setDashboardSummary(nextSummary);

      if (hasRole(authUser, "ALICI")) {
        const [favorites, recommended, demands] = await Promise.all([
          yoremioApi.favoriteProducts(authUser.token),
          yoremioApi.recommendedProducts(authUser.token),
          yoremioApi.buyerDemands(authUser.token),
        ]);
        setFavoriteProducts(favorites);
        setFavoriteIds(new Set(favorites.map((product) => product.id)));
        setRecommendedProducts(recommended);
        setBuyerDemands(demands);
      }

      if (hasRole(authUser, "SATICI")) {
        const [profile, products, demands, dashboard] = await Promise.all([
          yoremioApi.sellerProfile(authUser.token),
          yoremioApi.sellerProducts(authUser.token),
          yoremioApi.sellerDemands(authUser.token),
          yoremioApi.sellerDashboard(authUser.token),
        ]);
        setSellerProfile(profile);
        setSellerProducts(products);
        setSellerDemands(demands);
        setSellerDashboard(dashboard);
      }

      if (hasRole(authUser, "ADMIN")) {
        const dashboard = await yoremioApi.adminDashboard(authUser.token);
        setAdminDashboard(dashboard);
      }
    } catch (error) {
      const message = apiErrorMessage(error);
      showToast(message, "error");

      if (error instanceof ApiClientError && error.status === 401) {
        clearSession();
      }
    }
  }, [authUser, clearSession, showToast]);

  useEffect(() => {
    const token = window.localStorage.getItem("yoremio-token");
    if (!token) return;

    let ignore = false;

    yoremioApi
      .me(token)
      .then((user) => {
        if (ignore) return;

        const session: LoginResponse = {
          token,
          userId: user.userId,
          email: user.email,
          role: user.role,
          roles: user.roles,
        };

        window.localStorage.setItem("yoremio-user", JSON.stringify(session));
        setAuthUser({
          ...user,
          token,
        });
      })
      .catch(() => {
        if (!ignore) clearSession();
      });

    return () => {
      ignore = true;
    };
  }, [clearSession]);

  useEffect(() => {
    let ignore = false;

    yoremioApi
      .bootstrap()
      .then((nextBootstrap) => {
        if (ignore) return;
        setBootstrap(nextBootstrap);
        setCategories(nextBootstrap.categories);
        setSort((current) =>
          nextBootstrap.productSorts.includes(current)
            ? current
            : nextBootstrap.productSorts[0] ?? "newest",
        );
      })
      .catch(async (error) => {
        if (!ignore) {
          try {
            const nextCategories = await yoremioApi.categories();
            if (!ignore) setCategories(nextCategories);
          } catch {
            if (!ignore) setCategories([]);
          }
          showToast(apiErrorMessage(error), "error");
        }
      });

    return () => {
      ignore = true;
    };
  }, [showToast]);

  useEffect(() => {
    let ignore = false;
    setMarketState("loading");

    yoremioApi
      .products({
        page,
        pageSize: PAGE_SIZE,
        q: query.trim() || undefined,
        kategoriId: categoryId === "all" ? undefined : categoryId,
        minFiyat: minPrice ? Number(minPrice) : undefined,
        maxFiyat: maxPrice ? Number(maxPrice) : undefined,
        sehir: cityFilter.trim() || undefined,
        sadeceStoktaOlanlar: inStockOnly,
        minOrtalamaPuan: minRating ? Number(minRating) : undefined,
        sort,
      })
      .then((nextPage) => {
        if (ignore) return;
        const normalizedPage = {
          ...nextPage,
          totalPages: Math.max(1, nextPage.totalPages),
        };

        setProductsPage(normalizedPage);
        setMarketState("idle");
        setMarketError(null);

        if (normalizedPage.items.length === 0) {
          setActiveProductId(null);
          setProductDetail(null);
          setDetailOpen(false);
          return;
        }

        if (!normalizedPage.items.some((product) => product.id === activeProductId)) {
          setActiveProductId(normalizedPage.items[0].id);
        }
      })
      .catch((error) => {
        if (ignore) return;
        setProductsPage(emptyProductsResult(page));
        setActiveProductId(null);
        setProductDetail(null);
        setDetailOpen(false);
        setMarketState("error");
        setMarketError(apiErrorMessage(error));
      });

    return () => {
      ignore = true;
    };
  }, [
    activeProductId,
    categoryId,
    cityFilter,
    inStockOnly,
    maxPrice,
    minPrice,
    minRating,
    page,
    query,
    sort,
  ]);

  useEffect(() => {
    setPage(1);
  }, [categoryId, cityFilter, inStockOnly, maxPrice, minPrice, minRating, query, sort]);

  useEffect(() => {
    let ignore = false;
    setProductDetail(null);

    if (activeProductId === null) return;

    yoremioApi
      .product(activeProductId)
      .then((product) => {
        if (!ignore) setProductDetail(product);
      })
      .catch(() => {
        if (!ignore) setProductDetail(null);
      });

    return () => {
      ignore = true;
    };
  }, [activeProductId]);

  useEffect(() => {
    let ignore = false;

    if (!selectedProduct?.saticiId) {
      setTrustScore(null);
      return;
    }

    yoremioApi
      .sellerTrustScore(selectedProduct.saticiId)
      .then((score) => {
        if (!ignore) setTrustScore(score);
      })
      .catch(() => {
        if (!ignore) setTrustScore(null);
      });

    return () => {
      ignore = true;
    };
  }, [selectedProduct?.saticiId]);

  useEffect(() => {
    void refreshRoleData();
  }, [refreshRoleData]);

  useEffect(() => {
    if (!authUser?.token) {
      setSignalRState("Kapalı");
      return;
    }

    let disposed = false;
    const connection = createChatConnection(() => authUser.token);
    chatConnection.current = connection;

    const unbind = bindChatEvents(connection, {
      onReceive: (message) => {
        setChatMessages((current) => {
          const belongsToOpenChat =
            message.senderId === chatTargetId || message.receiverId === chatTargetId;
          if (!belongsToOpenChat) return current;
          if (current.some((item) => item.id === message.id)) return current;
          return [...current, message];
        });
        void refreshRoleData();
      },
      onSent: (message) => {
        setChatMessages((current) => {
          if (current.some((item) => item.id === message.id)) return current;
          return [...current, message];
        });
        void refreshRoleData();
      },
      onRead: (readerUserId, readAtUtc) => {
        setChatMessages((current) =>
          current.map((message) =>
            message.receiverId === readerUserId && !message.readAt
              ? { ...message, readAt: readAtUtc }
              : message,
          ),
        );
      },
      onTyping: (fromUserId) => {
        if (fromUserId === chatTargetId) {
          setSignalRState("Yazıyor");
          window.setTimeout(() => setSignalRState("Canlı"), 1600);
        }
      },
    });

    setSignalRState("Bağlanıyor");
    const startPromise = connection
      .start()
      .then(async () => {
        if (disposed) {
          if (connection.state !== HubConnectionState.Disconnected) {
            await connection.stop();
          }
          return;
        }

        setSignalRState("Canlı");
      })
      .catch(() => {
        if (!disposed) setSignalRState("Bağlantı yok");
      });

    return () => {
      disposed = true;
      unbind();
      if (chatConnection.current === connection) {
        chatConnection.current = null;
      }

      void startPromise.finally(() => {
        if (connection.state !== HubConnectionState.Disconnected) {
          void connection.stop();
        }
      });
    };
  }, [authUser?.token, chatTargetId, refreshRoleData]);

  useEffect(() => {
    if (!chatTargetId && conversations[0]?.userId) {
      setChatTargetId(conversations[0].userId);
    }
  }, [chatTargetId, conversations]);

  useEffect(() => {
    let ignore = false;

    if (!authUser?.token || !chatTargetId) {
      setChatMessages([]);
      return;
    }

    setChatState("loading");
    yoremioApi
      .messages(authUser.token, chatTargetId)
      .then((messages) => {
        if (ignore) return;
        setChatMessages(messages.items);
        setChatState("idle");
        void yoremioApi.markConversationRead(authUser.token, chatTargetId);
      })
      .catch((error) => {
        if (ignore) return;
        setChatMessages([]);
        setChatState("error");
        showToast(apiErrorMessage(error), "error");
      });

    return () => {
      ignore = true;
    };
  }, [authUser?.token, chatTargetId, showToast]);

  const requireAuth = (role?: UserRole) => {
    if (!authUser) {
      setAuthOpen(true);
      showToast("Bu işlem için giriş yapmalısın.", "info");
      return false;
    }

    if (role && !hasRole(authUser, role)) {
      showToast(`Bu işlem ${roleLabel(role)} rolü gerektirir.`, "error");
      return false;
    }

    return true;
  };

  const handleFavorite = async (product: ProductDto) => {
    if (!requireAuth("ALICI")) return;
    if (!authUser) return;

    const isFavorite = favoriteIds.has(product.id);
    setActionStatus(`favorite-${product.id}`);

    try {
      if (isFavorite) {
        await yoremioApi.removeFavorite(authUser.token, product.id);
      } else {
        await yoremioApi.addFavorite(authUser.token, product.id);
      }

      setFavoriteIds((current) => {
        const next = new Set(current);
        if (isFavorite) next.delete(product.id);
        else next.add(product.id);
        return next;
      });
      await refreshSelectedProduct(product.id);
      await refreshRoleData();
      showToast(isFavorite ? "Favoriden çıkarıldı." : "Favoriye eklendi.", "success");
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setActionStatus(null);
    }
  };

  const handleDemand = async (urunId: number, miktar: number, note?: string) => {
    if (!requireAuth("ALICI")) return;
    if (!authUser) return;

    setActionStatus(`demand-${urunId}`);
    try {
      await yoremioApi.createDemand(authUser.token, urunId, miktar, note);
      await refreshRoleData();
      showToast("Talep satıcıya gönderildi.", "success");
      setWorkspace("buyer");
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setActionStatus(null);
    }
  };

  const handleRating = async (urunId: number, rating: number) => {
    if (!requireAuth("ALICI")) return;
    if (!authUser) return;

    setActionStatus(`rating-${urunId}`);
    try {
      await yoremioApi.rateProduct(authUser.token, urunId, rating);
      await refreshSelectedProduct(urunId);
      showToast("Puan kaydedildi.", "success");
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setActionStatus(null);
    }
  };

  const handleComment = async (urunId: number, content: string) => {
    if (!requireAuth("ALICI")) return;
    if (!authUser) return;

    setActionStatus(`comment-${urunId}`);
    try {
      await yoremioApi.addComment(authUser.token, urunId, content);
      await refreshSelectedProduct(urunId);
      showToast("Yorum eklendi.", "success");
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setActionStatus(null);
    }
  };

  const handleDeleteComment = async (commentId: number, urunId: number) => {
    if (!requireAuth("ALICI")) return;
    if (!authUser) return;
    if (!window.confirm("Yorumu silmek istiyor musun?")) return;

    setActionStatus(`delete-comment-${commentId}`);
    try {
      await yoremioApi.deleteComment(authUser.token, commentId);
      await refreshSelectedProduct(urunId);
      showToast("Yorum silindi.", "success");
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setActionStatus(null);
    }
  };

  const handleAcceptOffer = async (offerId: number) => {
    if (!requireAuth("ALICI")) return;
    if (!authUser) return;

    setActionStatus(`accept-${offerId}`);
    try {
      await yoremioApi.acceptOffer(authUser.token, offerId);
      await refreshRoleData();
      showToast("Teklif kabul edildi. Talep anlaşma durumuna geçti.", "success");
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setActionStatus(null);
    }
  };

  const handleProfileUpdate = async (values: {
    magazaAdi: string;
    adres: string;
    sehir: string;
    ilce: string;
    phoneNumber: string;
  }) => {
    if (!requireAuth("SATICI")) return;
    if (!authUser) return;

    setActionStatus("profile");
    try {
      const profile = await yoremioApi.updateSellerProfile(authUser.token, values);
      setSellerProfile(profile);
      showToast("Satıcı profili güncellendi.", "success");
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setActionStatus(null);
    }
  };

  const handleProductSave = async (
    values: ProductFormValues,
    productId?: number,
  ) => {
    if (!requireAuth("SATICI")) return;
    if (!authUser) return;

    const uploadError = productUploadValidationMessage(values, bootstrap?.uploads);
    if (uploadError) {
      showToast(uploadError, "error");
      return;
    }

    setActionStatus("product-form");
    try {
      const product = await yoremioApi.upsertProduct(authUser.token, values, productId);
      await refreshRoleData();
      await refreshSelectedProduct(product.id);
      setActiveProductId(product.id);
      setDetailOpen(true);
      showToast(productId ? "Ürün güncellendi." : "Ürün eklendi.", "success");
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setActionStatus(null);
    }
  };

  const handleProductDelete = async (urunId: number) => {
    if (!requireAuth("SATICI")) return;
    if (!authUser) return;
    if (!window.confirm("Bu ürünü silmek istiyor musun?")) return;

    setActionStatus(`delete-product-${urunId}`);
    try {
      await yoremioApi.deleteProduct(authUser.token, urunId);
      await refreshRoleData();
      setProductsPage((current) => ({
        ...current,
        items: current.items.filter((product) => product.id !== urunId),
      }));
      if (activeProductId === urunId) {
        setActiveProductId(null);
        setProductDetail(null);
        setDetailOpen(false);
      }
      showToast("Ürün silindi.", "success");
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setActionStatus(null);
    }
  };

  const handleProductStatus = async (urunId: number, aktifMi: boolean) => {
    if (!requireAuth("SATICI")) return;
    if (!authUser) return;

    setActionStatus(`status-product-${urunId}`);
    try {
      const product = await yoremioApi.updateProductStatus(
        authUser.token,
        urunId,
        aktifMi,
      );
      await refreshRoleData();
      setProductsPage((current) => ({
        ...current,
        items: current.items.map((item) => (item.id === product.id ? product : item)),
      }));
      await refreshSelectedProduct(product.id);
      showToast(aktifMi ? "Ürün aktife alındı." : "Ürün pasife alındı.", "success");
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setActionStatus(null);
    }
  };

  const handleDeleteMedia = async (
    urunId: number,
    mediaId: number,
    kind: "image" | "video",
  ) => {
    if (!requireAuth("SATICI")) return;
    if (!authUser) return;
    if (!window.confirm("Bu medyayı silmek istiyor musun?")) return;

    setActionStatus(`media-${mediaId}`);
    try {
      if (kind === "image") {
        await yoremioApi.deleteProductImage(authUser.token, urunId, mediaId);
      } else {
        await yoremioApi.deleteProductVideo(authUser.token, urunId, mediaId);
      }

      await refreshRoleData();
      await refreshSelectedProduct(urunId);
      showToast("Medya silindi.", "success");
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setActionStatus(null);
    }
  };

  const handleOffer = async (
    talepId: number,
    values: { birimFiyat?: number; mesaj: string },
  ) => {
    if (!requireAuth("SATICI")) return;
    if (!authUser) return;

    setActionStatus(`offer-${talepId}`);
    try {
      await yoremioApi.upsertOffer(authUser.token, talepId, values);
      await refreshRoleData();
      showToast("Teklif gönderildi.", "success");
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setActionStatus(null);
    }
  };

  const handleCategorySave = async (
    values: { adi: string; aciklama: string },
    categoryToUpdate?: number,
  ) => {
    if (!requireAuth("ADMIN")) return;
    if (!authUser) return;

    setActionStatus("category");
    try {
      if (categoryToUpdate) {
        await yoremioApi.updateCategory(authUser.token, categoryToUpdate, values);
      } else {
        await yoremioApi.createCategory(authUser.token, values);
      }
      const nextCategories = await yoremioApi.categories();
      setCategories(nextCategories);
      showToast(
        categoryToUpdate ? "Kategori güncellendi." : "Kategori oluşturuldu.",
        "success",
      );
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setActionStatus(null);
    }
  };

  const handleCategoryDelete = async (id: number) => {
    if (!requireAuth("ADMIN")) return;
    if (!authUser) return;
    if (!window.confirm("Bu kategoriyi silmek istiyor musun?")) return;

    setActionStatus("category");
    try {
      await yoremioApi.deleteCategory(authUser.token, id);
      setCategories((current) => current.filter((category) => category.id !== id));
      showToast("Kategori silindi.", "success");
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setActionStatus(null);
    }
  };

  const handleOpenChat = (sellerId: string) => {
    if (!requireAuth()) return;
    setChatTargetId(sellerId);
    setWorkspace("chat");
    setDetailOpen(false);
    window.setTimeout(() => {
      document.getElementById("paneller")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 50);
  };

  const handleSendMessage = async (receiverId: string, message: string) => {
    if (!requireAuth()) return;
    if (!authUser) return;

    setActionStatus("chat-send");
    try {
      const connection = chatConnection.current;

      if (connection?.state === HubConnectionState.Connected) {
        try {
          await connection.invoke("SendMessage", receiverId, message);
        } catch {
          const sent = await yoremioApi.sendMessage(authUser.token, receiverId, message);
          setChatMessages((current) => [...current, sent]);
        }
      } else {
        const sent = await yoremioApi.sendMessage(authUser.token, receiverId, message);
        setChatMessages((current) => [...current, sent]);
      }

      setChatTargetId(receiverId);
      await refreshRoleData();
      showToast("Mesaj gönderildi.", "success");
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setActionStatus(null);
    }
  };

  const totalOpenSellerDemands = sellerDemands.filter(
    (demand) => demand.durum === "ACIK",
  ).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader
        authUser={authUser}
        sellerProfile={sellerProfile}
        dashboardSummary={dashboardSummary}
        query={query}
        onQueryChange={setQuery}
        onSearchSubmit={() =>
          document.getElementById("kesif")?.scrollIntoView({
            behavior: "smooth",
          })
        }
        onSellerClick={openSellerWorkspace}
        onLoginClick={() => {
          setAuthPreferredRole("ALICI");
          setAuthOpen(true);
        }}
        onLogout={clearSession}
      />

      <main>
        <section id="kesif" className="mx-auto max-w-[1760px] px-3 py-4 sm:px-5">
          <div className="grid gap-4 lg:grid-cols-[238px_minmax(0,1fr)]">
            <DiscoverySidebar
              categories={categories}
              activeId={categoryId}
              selectedCategory={selectedCategory}
              cityFilter={cityFilter}
              minPrice={minPrice}
              maxPrice={maxPrice}
              minRating={minRating}
              inStockOnly={inStockOnly}
              onCategorySelect={setCategoryId}
              onCityChange={setCityFilter}
              onMinPriceChange={setMinPrice}
              onMaxPriceChange={setMaxPrice}
              onMinRatingChange={setMinRating}
              onStockToggle={() => setInStockOnly(!inStockOnly)}
              onApply={() => setPage(1)}
              onClear={() => {
                setQuery("");
                setCategoryId("all");
                setInStockOnly(false);
                setMinPrice("");
                setMaxPrice("");
                setCityFilter("");
                setMinRating("");
                setSort("newest");
              }}
            />

            <div className="min-w-0 space-y-4">
              <div className="surface-glass rounded-lg p-3 sm:p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="green">
                        <Leaf className="size-3.5" aria-hidden />
                        Ürün keşfet
                      </Badge>
                      <Badge variant="outline">
                        {productsPage.totalCount} sonuç
                      </Badge>
                    </div>
                    <h1 className="mt-2 text-2xl font-black tracking-normal text-brand-brown sm:text-3xl">
                      Ardahan ve çevresinden canlı yerel ürünler
                    </h1>
                    {marketError ? (
                      <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-red-700">
                        <AlertTriangle className="size-4" aria-hidden />
                        {marketError}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Gerçek görsel, stok, satıcı güveni ve hızlı talep akışı tek ekranda.
                      </p>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center xl:justify-end">
                    <div className="grid h-10 grid-cols-3 rounded-md border border-border bg-background p-1 text-sm font-bold">
                      <button className="rounded-sm bg-white px-3 text-primary shadow-sm" type="button">
                        Ürünler
                      </button>
                      <button className="rounded-sm px-3 text-muted-foreground hover:text-foreground" type="button">
                        Satıcılar
                      </button>
                      <button className="rounded-sm px-3 text-muted-foreground hover:text-foreground" type="button">
                        Kampanyalar
                      </button>
                    </div>
                    <select
                      value={sort}
                      onChange={(event) => setSort(event.target.value as SortKey)}
                      className="h-10 rounded-md border border-border bg-white px-3 text-sm font-bold outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                    >
                      {productSorts.map((item) => (
                        <option key={item} value={item}>
                          Sırala: {sortLabels[item] ?? item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="lg:hidden">
                <CategoryShelf
                  categories={categories}
                  activeId={categoryId}
                  onSelect={setCategoryId}
                  selectedCategory={selectedCategory}
                />
              </div>

              {productsPage.items.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {productsPage.items.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      category={categories.find(
                        (category) => category.id === product.kategoriId,
                      )}
                      active={product.id === selectedProduct?.id}
                      isFavorite={favoriteIds.has(product.id)}
                      onSelect={() => {
                        setActiveProductId(product.id);
                        setDetailOpen(true);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <MarketEmptyState
                  icon={Search}
                  hasError={Boolean(marketError)}
                  onClearFilters={() => {
                    setQuery("");
                    setCategoryId("all");
                    setInStockOnly(false);
                    setMinPrice("");
                    setMaxPrice("");
                    setCityFilter("");
                    setMinRating("");
                    setSort("newest");
                  }}
                  onSellerPanelClick={openSellerWorkspace}
                  title="Sonuç bulunamadı."
                  description="Arama, kategori veya stok filtresini değiştir."
                />
              )}

              {productsPage.items.length > 0 ? (
                <PaginationBar
                  page={productsPage.page}
                  totalPages={productsPage.totalPages}
                  onPageChange={setPage}
                />
              ) : null}
            </div>
          </div>
        </section>

        <section id="paneller" className="border-t border-border/70 bg-[#fbfaf7]">
          <WorkspaceSection
            workspace={workspace}
            setWorkspace={setWorkspace}
            authUser={authUser}
            uploads={bootstrap?.uploads}
            selectedProduct={selectedProduct}
            categories={categories}
            recommendedProducts={recommendedProducts}
            favoriteProducts={favoriteProducts}
            buyerDemands={buyerDemands}
            sellerProfile={sellerProfile}
            sellerProducts={sellerProducts}
            sellerDemands={sellerDemands}
            sellerDashboard={sellerDashboard}
            adminDashboard={adminDashboard}
            totalOpenSellerDemands={totalOpenSellerDemands}
            conversations={conversations}
            chatMessages={chatMessages}
            chatTargetId={chatTargetId}
            chatState={chatState}
            signalRState={signalRState}
            actionStatus={actionStatus}
            onLogin={() => setAuthOpen(true)}
            onSelectProduct={(id) => {
              setActiveProductId(id);
              setDetailOpen(true);
            }}
            onDemand={handleDemand}
            onAcceptOffer={handleAcceptOffer}
            onProfileUpdate={handleProfileUpdate}
            onProductSave={handleProductSave}
            onProductStatus={handleProductStatus}
            onProductDelete={handleProductDelete}
            onDeleteMedia={handleDeleteMedia}
            onOffer={handleOffer}
            onCategorySave={handleCategorySave}
            onCategoryDelete={handleCategoryDelete}
            onChatTargetChange={setChatTargetId}
            onSendMessage={handleSendMessage}
          />
        </section>
      </main>

      {selectedProduct ? (
        <ProductDetailDialog
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
        >
          <ProductDetail
            product={selectedProduct}
            trustScore={trustScore}
            category={categories.find(
              (category) => category.id === selectedProduct.kategoriId,
            )}
            authUser={authUser}
            canReview={buyerDemands.some(
              (demand) =>
                demand.urunId === selectedProduct.id && demand.durum === "ANLASILDI",
            )}
            features={bootstrap?.features}
            isFavorite={favoriteIds.has(selectedProduct.id)}
            actionStatus={actionStatus}
            onFavorite={handleFavorite}
            onDemand={handleDemand}
            onRate={handleRating}
            onComment={handleComment}
            onDeleteComment={handleDeleteComment}
            onOpenChat={handleOpenChat}
          />
        </ProductDetailDialog>
      ) : null}

      {toast ? <Toast toast={toast} onClose={() => setToast(null)} /> : null}

      <AuthDialog
        key={authPreferredRole}
        open={authOpen}
        initialRole={authPreferredRole}
        bootstrap={bootstrap}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={(user) => {
          setAuthUser(user);
          setAuthOpen(false);
          showToast(`${roleLabel(user.role)} hesabıyla giriş yapıldı.`, "success");
        }}
      />
    </div>
  );
}

function DiscoverySidebar({
  categories,
  activeId,
  selectedCategory,
  cityFilter,
  minPrice,
  maxPrice,
  minRating,
  inStockOnly,
  onCategorySelect,
  onCityChange,
  onMinPriceChange,
  onMaxPriceChange,
  onMinRatingChange,
  onStockToggle,
  onApply,
  onClear,
}: {
  categories: CategoryDto[];
  activeId: number | "all";
  selectedCategory?: CategoryDto;
  cityFilter: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  inStockOnly: boolean;
  onCategorySelect: (value: number | "all") => void;
  onCityChange: (value: string) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onMinRatingChange: (value: string) => void;
  onStockToggle: () => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 rounded-lg border border-border bg-white p-3 shadow-[0_8px_24px_rgba(32,39,52,0.055)]">
        <div className="border-b border-border pb-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
            Kategoriler
          </p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {selectedCategory?.aciklama ?? "Yerel ürünleri kategori, konum ve güvene göre daralt."}
          </p>
        </div>

        <div className="mt-3 grid gap-1.5">
          <button
            type="button"
            onClick={() => onCategorySelect("all")}
            className={cn(
              "flex h-9 items-center justify-between rounded-md px-2.5 text-sm font-bold transition",
              activeId === "all"
                ? "bg-secondary text-primary"
                : "text-foreground hover:bg-background",
            )}
          >
            Tümü
            <span className="text-xs text-muted-foreground">Pazar</span>
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategorySelect(category.id)}
              className={cn(
                "flex h-9 items-center justify-between rounded-md px-2.5 text-sm font-bold transition",
                activeId === category.id
                  ? "bg-secondary text-primary"
                  : "text-foreground hover:bg-background",
              )}
            >
              <span className="truncate">{category.adi}</span>
              <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <Field label="Konum" htmlFor="market-city">
            <Input
              id="market-city"
              value={cityFilter}
              onChange={(event) => onCityChange(event.target.value)}
              placeholder="Ardahan"
              className="h-10 bg-background"
            />
          </Field>

          <div className="grid gap-2">
            <p className="text-xs font-bold text-muted-foreground">Fiyat Aralığı</p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min={0}
                value={minPrice}
                onChange={(event) => onMinPriceChange(event.target.value)}
                placeholder="Min"
                className="h-10 bg-background"
              />
              <Input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(event) => onMaxPriceChange(event.target.value)}
                placeholder="Maks"
                className="h-10 bg-background"
              />
            </div>
          </div>

          <Field label="Güven puanı" htmlFor="market-rating">
            <select
              id="market-rating"
              value={minRating}
              onChange={(event) => onMinRatingChange(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
            >
              <option value="">Tüm puanlar</option>
              <option value="4">4+ puan</option>
              <option value="3">3+ puan</option>
              <option value="2">2+ puan</option>
            </select>
          </Field>

          <button
            type="button"
            role="switch"
            aria-checked={inStockOnly}
            onClick={onStockToggle}
            className="flex h-10 w-full items-center justify-between rounded-md border border-border bg-background px-3 text-sm font-bold transition hover:border-primary/35"
          >
            Yakınımdakiler / stokta
            <span
              className={cn(
                "relative h-5 w-9 rounded-full transition",
                inStockOnly ? "bg-primary" : "bg-muted-foreground/[0.3]",
              )}
            >
              <span
                className={cn(
                  "absolute top-1 size-3 rounded-full bg-white shadow transition",
                  inStockOnly ? "left-5" : "left-1",
                )}
              />
            </span>
          </button>

          <Button type="button" className="w-full" onClick={onApply}>
            <Filter aria-hidden />
            Filtrele
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={onClear}>
            <RefreshCw aria-hidden />
            Filtreleri temizle
          </Button>
        </div>
      </div>
    </aside>
  );
}

function AppHeader({
  authUser,
  sellerProfile,
  dashboardSummary,
  query,
  onQueryChange,
  onSearchSubmit,
  onSellerClick,
  onLoginClick,
  onLogout,
}: {
  authUser: AuthState | null;
  sellerProfile: SellerProfileDto | null;
  dashboardSummary: DashboardSummaryDto | null;
  query: string;
  onQueryChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSellerClick: () => void;
  onLoginClick: () => void;
  onLogout: () => void;
}) {
  const displayName = accountDisplayName(authUser, sellerProfile);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-[#fbfaf7]/96 shadow-[0_8px_24px_rgba(32,39,52,0.06)]">
      <div className="mx-auto grid min-h-[76px] max-w-[1760px] grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2 sm:px-5">
        <Link href="/" className="min-w-0">
          <BrandLogo compact />
        </Link>

        <nav className="hidden items-center justify-center gap-7 text-sm font-extrabold text-foreground lg:flex">
          <a href="#kesif" className="transition hover:text-primary">
            Kategoriler
          </a>
          <button
            type="button"
            onClick={onSellerClick}
            className="transition hover:text-primary"
          >
            Nasıl Çalışır?
          </button>
        </nav>

        <div className="col-span-3 grid gap-2 md:col-span-1 md:col-start-2 md:row-start-1 md:mx-auto md:w-full md:max-w-xl lg:col-start-2 lg:max-w-[520px]">
          <form
            className="relative"
            onSubmit={(event) => {
              event.preventDefault();
              onSearchSubmit();
            }}
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Ürün, kategori veya satıcı ara..."
              className="h-12 border-border bg-white/92 pl-11 pr-12 shadow-[0_8px_24px_rgba(32,39,52,0.06)]"
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 size-9 -translate-y-1/2"
              title="Ara"
            >
              <Search aria-hidden />
            </Button>
          </form>
        </div>

        <div className="col-start-3 row-start-1 flex items-center justify-end gap-1.5 sm:gap-2">
          <Button variant="ghost" size="icon" title="Sepet">
            <ShoppingBasket aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" title="Favoriler">
            <Heart aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Bildirimler"
            className="relative hidden sm:inline-flex"
          >
            <Bell aria-hidden />
            {dashboardSummary && dashboardSummary.unreadMessages > 0 ? (
              <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-tomato text-[10px] font-black text-white">
                {Math.min(99, dashboardSummary.unreadMessages)}
              </span>
            ) : null}
          </Button>
          {authUser ? (
            <>
              <Button variant="outline" size="icon" className="md:hidden" asChild>
                <Link href="/profil" title="Profil">
                  <UserRound aria-hidden />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="hidden max-w-56 bg-white md:inline-flex"
                asChild
              >
                <Link href="/profil">
                  <UserRound aria-hidden />
                  <span className="truncate">
                    {displayName} · {rolesOf(authUser).map(roleLabel).join(" + ")}
                  </span>
                </Link>
              </Button>
              <Button
                variant="default"
                size="icon"
                title="Çıkış yap"
                onClick={onLogout}
              >
                <LogOut aria-hidden />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="default"
                onClick={onLoginClick}
                className="hidden sm:inline-flex"
              >
                <UserRound aria-hidden />
                Giriş Yap / Kayıt Ol
              </Button>
              <Button
                variant="default"
                size="icon"
                onClick={onLoginClick}
                className="sm:hidden"
                title="Giriş yap"
              >
                <UserRound aria-hidden />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function AuthDialog({
  open,
  initialRole,
  bootstrap,
  onClose,
  onAuthenticated,
}: {
  open: boolean;
  initialRole: UserRole;
  bootstrap: AppBootstrapDto | null;
  onClose: () => void;
  onAuthenticated: (user: AuthState) => void;
}) {
  const [mode, setMode] = useState<"login" | "buyer" | "seller" | "verify">("login");
  const [role, setRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [magazaAdi, setMagazaAdi] = useState("");
  const [vergiNo, setVergiNo] = useState("");
  const [adres, setAdres] = useState("");
  const [sehir, setSehir] = useState("");
  const [ilce, setIlce] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const devVerificationUrl =
    bootstrap?.features.devVerificationInboxEnabled &&
    bootstrap.verification.devVerificationInboxUrl
      ? `${API_BASE_URL}${bootstrap.verification.devVerificationInboxUrl}`
      : null;

  if (!open) return null;

  const chooseLoginRole = (nextRole: UserRole) => {
    setRole(nextRole);
    setMode("login");
    setError(null);
    setMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    setMessage(null);

    try {
      if (mode === "login") {
        const login = await yoremioApi.login(email.trim(), password);
        window.localStorage.setItem("yoremio-token", login.token);
        window.localStorage.setItem("yoremio-user", JSON.stringify(login));

        let fullUser: AuthState = {
          token: login.token,
          userId: login.userId,
          email: login.email,
          userName: login.email,
          role: login.role,
          roles: login.roles,
          emailConfirmed: false,
          phoneNumberConfirmed: false,
        };

        try {
          const me = await yoremioApi.me(login.token);
          fullUser = { ...me, token: login.token };
        } catch {
          // Login token is still usable; session bootstrap will retry /me later.
        }

        setStatus("success");
        onAuthenticated(fullUser);
        return;
      }

      if (mode === "buyer") {
        await yoremioApi.registerBuyer({ email: email.trim(), password });
        setMessage("Alıcı kaydı oluşturuldu. Doğrulama linkini kontrol et.");
        setMode("login");
        setPassword("");
      }

      if (mode === "seller") {
        await yoremioApi.registerSeller({
          email: email.trim(),
          password,
          phoneNumber,
          magazaAdi,
          vergiNo,
          adres,
          sehir,
          ilce,
        });
        setMessage(
          "Satıcı kaydı oluşturuldu. Email ve telefon doğrulaması tamamlanınca giriş yapabilirsin.",
        );
        setMode("login");
        setPassword("");
      }

      if (mode === "verify") {
        await yoremioApi.confirmEmail(email.trim(), verifyCode.trim());
        setMessage("Doğrulama tamamlandı.");
      }

      setStatus("success");
    } catch (caught) {
      setError(apiErrorMessage(caught));
      setStatus("idle");
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setError("Doğrulama mesajı için e-posta gir.");
      return;
    }

    setStatus("loading");
    setError(null);
    setMessage(null);

    try {
      await yoremioApi.resendVerification(email.trim());
      setMessage("Doğrulama mesajı varsa yeniden gönderildi.");
      setStatus("success");
    } catch (caught) {
      setError(apiErrorMessage(caught));
      setStatus("idle");
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 px-3 py-3 sm:px-4 sm:py-6">
      <div
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-white shadow-[0_12px_34px_rgba(0,0,0,0.18)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border bg-[#fbfaf7] px-4 py-3 sm:px-5">
          <div className="max-w-xl">
            <BrandLogo compact />
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Güvenli oturum
            </p>
            <h2 id="auth-title" className="mt-1 text-xl font-black text-brand-brown">
              {mode === "login"
                ? "Hesabına geri dön"
                : mode === "buyer"
                  ? "Alıcı kaydını başlat"
                  : mode === "seller"
                    ? "Satıcı vitrini oluştur"
                    : "Kod doğrulama"}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} title="Kapat" className="shrink-0">
            <X aria-hidden />
          </Button>
        </div>

        <form className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4" onSubmit={handleSubmit}>
          <div className="grid rounded-md border border-border bg-muted/70 p-1 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => chooseLoginRole("ALICI")}
              className={cn(
                "h-9 rounded-sm px-3 text-sm font-black transition-colors",
                mode === "login" && role === "ALICI"
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Alıcı
            </button>
            <button
              type="button"
              onClick={() => chooseLoginRole("SATICI")}
              className={cn(
                "h-9 rounded-sm px-3 text-sm font-black transition-colors",
                mode === "login" && role === "SATICI"
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Satıcı
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("ALICI");
                setMode("buyer");
              }}
              className={cn(
                "h-9 rounded-sm px-3 text-sm font-black transition-colors",
                mode === "buyer"
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Alıcı kayıt
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("SATICI");
                setMode("seller");
              }}
              className={cn(
                "h-9 rounded-sm px-3 text-sm font-black transition-colors",
                mode === "seller"
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Satıcı kayıt
            </button>
          </div>

          {mode === "verify" ? (
            <div className="mx-auto grid w-full max-w-md gap-3">
              <div className="grid place-items-center rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-5 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-white text-primary shadow-sm">
                  <ShieldCheck className="size-7" aria-hidden />
                </span>
                <p className="mt-3 text-sm font-semibold text-muted-foreground">
                  E-posta adresine gelen 6 haneli kodu gir.
                </p>
              </div>
              <Field label="E-posta" htmlFor="verify-email">
                <Input
                  id="verify-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="ornek@mail.com"
                  required
                />
              </Field>
              <Field label="Kod" htmlFor="verify-code">
                <Input
                  id="verify-code"
                  value={verifyCode}
                  onChange={(event) => setVerifyCode(event.target.value)}
                  placeholder="123456"
                  inputMode="numeric"
                  required
                />
              </Field>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="E-posta" htmlFor="login-email">
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="ornek@mail.com"
                  required
                />
              </Field>
              <Field label="Şifre" htmlFor="login-password">
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="En az 8 karakter, güçlü şifre"
                  required
                />
              </Field>
            </div>
          )}

          {mode === "seller" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Telefon" htmlFor="seller-phone">
                <Input
                  id="seller-phone"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  required
                />
              </Field>
              <Field label="Mağaza adı" htmlFor="seller-store">
                <Input
                  id="seller-store"
                  value={magazaAdi}
                  onChange={(event) => setMagazaAdi(event.target.value)}
                  required
                />
              </Field>
              <Field label="Vergi no" htmlFor="seller-tax">
                <Input
                  id="seller-tax"
                  value={vergiNo}
                  onChange={(event) => setVergiNo(event.target.value)}
                  required
                />
              </Field>
              <Field label="Adres" htmlFor="seller-address">
                <Input
                  id="seller-address"
                  value={adres}
                  onChange={(event) => setAdres(event.target.value)}
                />
              </Field>
              <Field label="Şehir" htmlFor="seller-city">
                <Input
                  id="seller-city"
                  value={sehir}
                  onChange={(event) => setSehir(event.target.value)}
                />
              </Field>
              <Field label="İlçe" htmlFor="seller-district">
                <Input
                  id="seller-district"
                  value={ilce}
                  onChange={(event) => setIlce(event.target.value)}
                />
              </Field>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
              {message}
            </div>
          ) : null}

          {(mode === "login" || mode === "seller") ? (
            <div className="flex flex-col gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground">
                Satıcı doğrulaması gelmediyse e-postanı yazıp tekrar iste.
              </p>
              <div className="flex flex-wrap gap-2">
              {devVerificationUrl ? (
                <a
                  href={devVerificationUrl}
                  target="_blank"
                  rel="noreferrer"
                    className="inline-flex h-9 items-center rounded-md px-2 text-xs font-black text-primary underline-offset-4 hover:underline"
                >
                    Dev kutusu
                </a>
              ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleResendVerification}
                  disabled={status === "loading"}
                >
                  <RefreshCw aria-hidden />
                  Tekrar gönder
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMode(mode === "verify" ? "login" : "verify")}
            >
              <ShieldCheck aria-hidden />
              {mode === "verify" ? "Girişe dön" : "Doğrulama ekranı"}
            </Button>
            <Button type="submit" disabled={status === "loading"}>
              {status === "loading" ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden />
                  İşleniyor
                </>
              ) : (
                <>
                  <Check aria-hidden />
                  {mode === "login" ? "Giriş yap" : "Gönder"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategoryShelf({
  categories,
  activeId,
  onSelect,
  selectedCategory,
}: {
  categories: CategoryDto[];
  activeId: number | "all";
  onSelect: (value: number | "all") => void;
  selectedCategory?: CategoryDto;
}) {
  return (
    <div className="surface-soft rounded-lg px-4 py-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-normal text-brand-brown sm:text-2xl">
            Popüler Kategoriler
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedCategory?.aciklama ??
              "Sebze, meyve, süt ürünleri, bakliyat ve kahvaltılık"}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onSelect("all")}>
          <ArrowRight aria-hidden />
          Tüm Kategoriler
        </Button>
      </div>
      <div className="scroll-shelf mt-5 flex gap-3 overflow-x-auto pb-2">
        <CategoryChip
          active={activeId === "all"}
          imageSrc="/hero-market.png"
          label="Tümü"
          onClick={() => onSelect("all")}
        />
        {categories.map((category, index) => {
          const imageSrc = categoryImages[(category.id + index) % categoryImages.length];
          return (
            <CategoryChip
              key={category.id}
              active={activeId === category.id}
              imageSrc={imageSrc}
              label={category.adi}
              onClick={() => onSelect(category.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function CategoryChip({
  active,
  imageSrc,
  label,
  onClick,
}: {
  active: boolean;
  imageSrc: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-[126px] shrink-0 snap-start flex-col items-center gap-2 rounded-lg border p-3 text-center outline-none transition-colors",
        active
          ? "border-primary/30 bg-secondary text-primary shadow-sm"
          : "border-border/70 bg-white text-foreground hover:border-primary/30 hover:text-primary",
      )}
    >
      <span
        className={cn(
          "relative size-20 overflow-hidden rounded-md border bg-muted shadow-sm transition-colors",
          active
            ? "border-primary ring-4 ring-primary/10"
            : "border-border group-hover:border-primary/50",
        )}
      >
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes="80px"
          className="object-cover"
        />
      </span>
      <span className="line-clamp-2 min-h-9 text-xs font-black leading-4">
        {label}
      </span>
    </button>
  );
}

function MarketEmptyState({
  icon: Icon = Search,
  title,
  description,
  hasError,
  onClearFilters,
  onSellerPanelClick,
}: {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  hasError: boolean;
  onClearFilters: () => void;
  onSellerPanelClick: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-dashed border-border bg-white shadow-sm">
      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px] lg:items-center">
        <div>
          <div className="grid size-12 place-items-center rounded-md bg-secondary text-primary">
            <Icon className="size-6" aria-hidden />
          </div>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {hasError ? "Bağlantı kontrol edilmeli" : "Vitrin boş"}
          </p>
          <h3 className="mt-2 text-2xl font-black tracking-normal text-brand-brown">
            {title ?? "Henüz yayında ürün yok."}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description ??
              "Yöremio gerçek veriyi gösterir. Veritabanında ürün yoksa kullanıcıya rastgele demo ürün basılmaz."}
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="premium" onClick={onSellerPanelClick}>
              <PackagePlus aria-hidden />
              Ürün ekle
            </Button>
            <Button type="button" variant="outline" onClick={onClearFilters}>
              <Filter aria-hidden />
              Filtreleri temizle
            </Button>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-sm font-bold text-brand-brown">Yayın hazır kontrol</p>
          <div className="mt-3 space-y-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Check className="size-4 text-primary" aria-hidden />
              Kayıt yoksa demo ürün gösterilmez.
            </p>
            <p className="flex items-center gap-2">
              <Check className="size-4 text-primary" aria-hidden />
              Satıcı panelinden gerçek ürün eklenir.
            </p>
            <p className="flex items-center gap-2">
              <Check className="size-4 text-primary" aria-hidden />
              Liste dolunca detay, talep ve chat akışına bağlanır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductDetailDialog({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-ink/52 p-2 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Detay panelini kapat"
        onClick={onClose}
      />
      <div
        className="relative flex h-[min(760px,calc(100svh-28px))] w-[min(1180px,calc(100vw-32px))] flex-col overflow-hidden rounded-lg border border-white/20 bg-background shadow-[0_12px_36px_rgba(0,0,0,0.2)]"
        role="dialog"
        aria-modal="true"
        aria-label="Ürün detayı"
      >
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-white px-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Ürün detayı
            </p>
            <p className="truncate text-xs font-semibold text-brand-brown">
              Detay, talep ve mesajlaşma tek panelde
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} title="Kapat">
            <X aria-hidden />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden p-2">
          {children}
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  category,
  active,
  isFavorite,
  onSelect,
}: {
  product: ProductDto;
  category?: CategoryDto;
  active: boolean;
  isFavorite: boolean;
  onSelect: () => void;
}) {
  return (
    <article
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      tabIndex={0}
      className={cn(
        "group min-w-0 cursor-pointer overflow-hidden rounded-lg border bg-white text-left shadow-[0_6px_18px_rgba(32,39,52,0.05)] outline-none transition-colors duration-150 hover:shadow-[0_10px_26px_rgba(32,39,52,0.08)] focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary ring-2 ring-primary/[0.14]"
          : "border-border hover:border-primary/[0.35]",
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={productImage(product)}
          alt={product.adi}
          fill
          sizes="(min-width: 1536px) 290px, (min-width: 768px) 45vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),transparent_45%,rgba(0,0,0,0.18))]" />
        <div className="absolute left-2 top-2 flex max-w-[calc(100%-4rem)] flex-wrap gap-1.5">
          {product.saticiDogrulanmis ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50/95 px-2 py-1 text-[10px] font-black text-emerald-800 shadow-sm">
              <ShieldCheck className="size-3" aria-hidden />
              Sertifikalı
            </span>
          ) : null}
          {category ? (
            <span
              className={cn(
                "rounded-md border px-2 py-1 text-[10px] font-bold shadow-sm",
                categoryTone(category.id),
              )}
            >
              {category.adi}
            </span>
          ) : null}
        </div>
        <span
          className={cn(
            "absolute right-2 top-2 grid size-8 shrink-0 place-items-center rounded-md bg-white/95 shadow-sm",
            isFavorite ? "text-red-600" : "text-primary",
          )}
        >
          <Heart
            className={cn("size-4", isFavorite && "fill-current")}
            aria-hidden
          />
        </span>
        {product.stokMiktari === 0 ? (
          <Badge className="absolute bottom-2 left-2" variant="gold">
            Ön sipariş
          </Badge>
        ) : null}
      </div>

      <div className="space-y-2.5 p-3">
        <div>
          <h3 className="line-clamp-1 text-base font-black text-brand-brown">
            {product.adi}
          </h3>
          <p className="mt-1 flex min-w-0 items-center gap-1 text-xs font-semibold text-primary">
            <Store className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{sellerName(product)}</span>
            {product.saticiDogrulanmis ? (
              <BadgeCheck className="size-3.5 shrink-0" aria-hidden />
            ) : null}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="min-w-0">
            <p className="flex min-w-0 items-center gap-1 text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden />
              <span className="truncate">{productLocation(product)}</span>
            </p>
          </div>
          <p className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-background px-2 py-1 font-black text-brand-brown shadow-sm">
            <Star className="size-3.5 fill-accent text-accent" aria-hidden />
            {product.ortalamaPuan.toFixed(1)}
          </p>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-end gap-2 border-t border-border pt-2.5">
          <div className="min-w-0">
            <p className="text-xl font-black text-brand-brown group-hover:text-primary">
              {formatPrice(product.fiyat)}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              {product.stokMiktari > 0 ? `${product.stokMiktari} stok` : "Stok bekliyor"} · {product.toplamYorum} yorum
            </p>
          </div>
          <Button size="icon" variant={active ? "default" : "outline"} title="Ürünü incele">
            <ShoppingBasket aria-hidden />
          </Button>
        </div>

        <p className="line-clamp-1 text-xs font-semibold text-muted-foreground">
          {product.aciklama || `${product.toplamFavori} kişi favorilerine ekledi.`}
        </p>
      </div>
    </article>
  );
}

function ProductDetail({
  product,
  category,
  trustScore,
  authUser,
  canReview,
  features,
  isFavorite,
  actionStatus,
  onFavorite,
  onDemand,
  onRate,
  onComment,
  onDeleteComment,
  onOpenChat,
}: {
  product: ProductDto;
  category?: CategoryDto;
  trustScore: SellerTrustScoreDto | null;
  authUser: AuthState | null;
  canReview: boolean;
  features?: AppFeatureFlags;
  isFavorite: boolean;
  actionStatus: string | null;
  onFavorite: (product: ProductDto) => void;
  onDemand: (urunId: number, miktar: number, note?: string) => void;
  onRate: (urunId: number, rating: number) => void;
  onComment: (urunId: number, content: string) => void;
  onDeleteComment: (commentId: number, urunId: number) => void;
  onOpenChat: (sellerId: string) => void;
}) {
  const [miktar, setMiktar] = useState(1);
  const [note, setNote] = useState("Hafta sonu teslim alabilirim.");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const shownTrust = trustScore?.guvenSkoru ?? (product.saticiDogrulanmis ? 84 : 62);
  const favoritesEnabled = features?.favoritesEnabled ?? true;
  const demandFlowEnabled = features?.demandFlowEnabled ?? true;
  const chatEnabled = features?.chatEnabled ?? true;
  const ratingsEnabled = features?.ratingsEnabled ?? true;
  const reviewsEnabled = features?.reviewsEnabled ?? true;
  const mediaItems = [
    ...product.resimler.map((item) => ({ ...item, kind: "image" as const })),
    ...product.videolar.map((item) => ({ ...item, kind: "video" as const })),
  ];
  const activeMedia = mediaItems[activeMediaIndex] ?? null;

  useEffect(() => {
    setMiktar(1);
    setComment("");
    setActiveMediaIndex(0);
  }, [product.id]);

  return (
    <section
      id="detay"
      className="grid h-full min-h-0 gap-2 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_340px] lg:overflow-hidden xl:grid-cols-[minmax(0,1fr)_350px]"
    >
      <div className="flex min-h-0 flex-col gap-2 overflow-hidden">
        <div className="min-h-0 overflow-hidden rounded-lg border border-border/80 bg-white shadow-[0_8px_22px_rgba(32,39,52,0.06)]">
          <div className="relative h-[min(35vh,300px)] min-h-[210px] overflow-hidden bg-muted">
            {activeMedia ? (
              activeMedia.kind === "video" ? (
                <video
                  key={activeMedia.id}
                  className="h-full w-full object-cover"
                  controls
                  poster={productImage(product)}
                >
                  <source src={mediaUrl(activeMedia.url)} />
                </video>
              ) : (
                <Image
                  src={mediaUrl(activeMedia.url) || productImage(product)}
                  alt={product.adi}
                  fill
                  sizes="(min-width: 1280px) 860px, 100vw"
                  className="object-cover"
                  priority
                />
              )
            ) : (
              <Image
                src={productImage(product)}
                alt={product.adi}
                fill
                sizes="(min-width: 1280px) 860px, 100vw"
                className="object-cover"
                priority
              />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/72 to-transparent px-3 py-3 text-white sm:px-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={product.stokMiktari > 0 ? "green" : "gold"}>
                  {product.stokMiktari > 0 ? "Stokta" : "Ön sipariş"}
                </Badge>
                {category ? <Badge variant="outline">{category.adi}</Badge> : null}
                {product.saticiDogrulanmis ? <Badge variant="green">Doğrulanmış satıcı</Badge> : null}
                {mediaItems.length > 0 ? (
                  <Badge variant="outline">
                    {activeMediaIndex + 1}/{mediaItems.length} medya
                  </Badge>
                ) : null}
              </div>
              <h2 className="mt-1 line-clamp-1 text-2xl font-black leading-tight">{product.adi}</h2>
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-white/80">
                <MapPin className="size-4" aria-hidden />
                {productLocation(product)}
              </p>
            </div>
          </div>

          <div className="border-t border-border p-2">
            {mediaItems.length > 0 ? (
              <div className="scroll-shelf flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
                {mediaItems.map((media, index) => {
                  const isActive = index === activeMediaIndex;
                  return (
                    <button
                      key={`${media.kind}-${media.id}`}
                      type="button"
                      onClick={() => setActiveMediaIndex(index)}
                      className={cn(
                        "relative h-14 w-20 shrink-0 snap-center overflow-hidden rounded-md border transition-colors sm:h-16 sm:w-24",
                        isActive ? "border-primary ring-2 ring-primary/20" : "border-border",
                      )}
                    >
                      {media.kind === "video" ? (
                        <div className="relative grid h-full w-full place-items-center bg-background text-primary">
                          <Video className="size-6" aria-hidden />
                          <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
                            Video
                          </span>
                        </div>
                      ) : (
                        <Image
                          src={mediaUrl(media.url)}
                          alt={`${product.adi} medya ${index + 1}`}
                          fill
                          sizes="(min-width: 1280px) 192px, 144px"
                          className="object-cover"
                        />
                      )}
                      <span
                        className={cn(
                          "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-black/70 text-white",
                        )}
                      >
                        {index + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid shrink-0 gap-2 sm:grid-cols-3">
          <Metric label="Puan" value={product.ortalamaPuan.toFixed(1)} icon={Star} />
          <Metric label="Yorum" value={String(product.toplamYorum)} icon={MessageCircle} />
          <Metric label="Favori" value={String(product.toplamFavori)} icon={Heart} />
        </div>

        <div className="shrink-0 rounded-lg border border-border/80 bg-white p-2.5 shadow-[0_8px_22px_rgba(32,39,52,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Satıcı güveni
              </p>
              <h3 className="truncate text-sm font-bold">{sellerName(product)}</h3>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                {product.saticiDogrulanmis ? (
                  <ShieldCheck className="size-4 text-primary" aria-hidden />
                ) : null}
                {trustScore?.urunSayisi ?? "Canlı"} ürün · {product.saticiId.slice(0, 8)}
              </p>
            </div>
            <TrustDial score={shownTrust} />
          </div>
          <p className="mt-1 line-clamp-1 text-xs leading-5 text-muted-foreground">
            Doğrulanmış satıcı, gerçek stok ve canlı talep akışı birlikte gösterilir. Bu panel hızlı karar vermek için tasarlandı.
          </p>
        </div>

        <div className="min-h-0 rounded-lg border border-border/80 bg-white p-2.5 shadow-[0_8px_22px_rgba(32,39,52,0.05)]">
          <div className="flex items-center gap-3 border-b border-border pb-1.5">
            <button
              type="button"
              className="border-b-2 border-primary pb-1.5 text-sm font-black text-brand-brown"
            >
              Ürün Açıklaması
            </button>
            <button
              type="button"
              className="pb-1.5 text-sm font-semibold text-muted-foreground"
            >
              Satıcı Hakkında
            </button>
          </div>
          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {product.aciklama || "Bu ürün için açıklama henüz eklenmedi."}
          </p>
        </div>
      </div>

      <aside className="flex min-h-0 flex-col gap-2 overflow-hidden">
        <div className="shrink-0 rounded-lg border border-border/80 bg-white p-2.5 shadow-[0_8px_24px_rgba(32,39,52,0.07)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-bold text-primary">
                {sellerName(product)}
                {product.saticiDogrulanmis ? (
                  <BadgeCheck className="size-4" aria-hidden />
                ) : null}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {productLocation(product)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onFavorite(product)}
              disabled={!favoritesEnabled || actionStatus === `favorite-${product.id}`}
              title={isFavorite ? "Favoriden çıkar" : "Favori ekle"}
            >
              {actionStatus === `favorite-${product.id}` ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <Heart className={cn(isFavorite && "fill-current text-red-600")} aria-hidden />
              )}
            </Button>
          </div>

          <h3 className="mt-2 line-clamp-1 text-xl font-black leading-tight text-brand-brown">
            {product.adi}
          </h3>
          <p className="mt-1 line-clamp-1 text-xs leading-5 text-muted-foreground">
            {product.aciklama || "Yerel üreticiden gelen taze ürün."}
          </p>

          <div className="mt-2 flex flex-wrap items-end gap-2">
            <p className="text-2xl font-black text-brand-brown">
              {formatPrice(product.fiyat)}
            </p>
            <span className="pb-0.5 text-sm font-bold text-foreground">/ kg</span>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <div className="rounded-md border border-border bg-background p-2">
              <p className="text-xs text-muted-foreground">Stok Durumu</p>
              <p className="mt-1 text-sm font-black">{product.stokMiktari} stok</p>
            </div>
            <div className="rounded-md border border-border bg-background p-2">
              <p className="text-xs text-muted-foreground">Kargo</p>
              <p className="mt-1 text-sm font-black">2-3 iş günü</p>
            </div>
            <div className="rounded-md border border-border bg-background p-2">
              <p className="text-xs text-muted-foreground">Kategori</p>
              <p className="mt-1 truncate text-sm font-black">
                {category?.adi ?? "Yerel ürün"}
              </p>
            </div>
          </div>

          <form
            className="mt-2 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!demandFlowEnabled) return;
              onDemand(product.id, miktar, note);
            }}
          >
            <div className="grid gap-2 sm:grid-cols-[88px_1fr]">
              <Input
                type="number"
                min={1}
                max={100000}
                value={miktar}
                onChange={(event) => setMiktar(Number(event.target.value))}
              />
              <Input
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                className="w-full"
                disabled={!demandFlowEnabled || actionStatus === `demand-${product.id}`}
              >
                {actionStatus === `demand-${product.id}` ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : (
                  <Send aria-hidden />
                )}
                Teklif Gönder
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => onOpenChat(product.saticiId)}
                disabled={!chatEnabled}
              >
                <MessageCircle aria-hidden />
                Mesaj Gönder
              </Button>
            </div>
          </form>

          <div className="mt-2 grid gap-2 border-t border-border pt-2 text-[11px] text-muted-foreground sm:grid-cols-3">
            <p className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" aria-hidden />
              Güvenli ödeme
            </p>
            <p className="flex items-center gap-2">
              <Check className="size-4 text-primary" aria-hidden />
              Koşulsuz iade
            </p>
            <p className="flex items-center gap-2">
              <Truck className="size-4 text-primary" aria-hidden />
              Hızlı teslimat
            </p>
          </div>
        </div>

        <form
          className="shrink-0 rounded-lg border border-border/80 bg-white p-2.5 shadow-[0_8px_22px_rgba(32,39,52,0.05)]"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canReview || !ratingsEnabled) return;
            onRate(product.id, rating);
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold">Puan ver</h3>
              <p className="text-xs text-muted-foreground">Deneyimden sonra değerlendir.</p>
            </div>
            <Star className="size-5 text-primary" aria-hidden />
          </div>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            <Field label="Yıldız" htmlFor="rating">
              <select
                id="rating"
                value={rating}
                onChange={(event) => setRating(Number(event.target.value))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} yıldız
                  </option>
                ))}
              </select>
            </Field>
            <Button
              disabled={
                !canReview || !ratingsEnabled || actionStatus === `rating-${product.id}`
              }
            >
              <Check aria-hidden />
              Kaydet
            </Button>
          </div>
          {!canReview || !ratingsEnabled ? (
            <p className="mt-1.5 line-clamp-1 text-[11px] font-semibold text-muted-foreground">
              Puan vermek için bu üründe anlaşılmış bir talebin olmalı.
            </p>
          ) : null}
        </form>

        <form
          className="shrink-0 rounded-lg border border-border/80 bg-white p-2.5 shadow-[0_8px_22px_rgba(32,39,52,0.05)]"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canReview || !reviewsEnabled) return;
            if (comment.trim().length >= 3) {
              onComment(product.id, comment.trim());
              setComment("");
            }
          }}
        >
          <Field label="Kısa yorum" htmlFor="comment">
            <Input
              id="comment"
              value={comment}
              minLength={3}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Ürün çok taze geldi."
            />
          </Field>
          <Button
            className="mt-2 w-full"
            variant="outline"
            disabled={!canReview || !reviewsEnabled || actionStatus === `comment-${product.id}`}
          >
            <MessageCircle aria-hidden />
            Yorum ekle
          </Button>
          {!canReview || !reviewsEnabled ? (
            <p className="mt-1.5 line-clamp-1 text-[11px] font-semibold text-muted-foreground">
              Yorum eklemek için kabul edilmiş teklif ve anlaşılmış talep gerekir.
            </p>
          ) : null}
        </form>

        <div className="min-h-0 overflow-hidden rounded-lg border border-border/80 bg-white shadow-[0_8px_22px_rgba(32,39,52,0.05)]">
          <div className="border-b border-border px-2.5 py-1.5">
            <h3 className="text-sm font-bold">Son yorumlar</h3>
          </div>
          <div className="divide-y divide-border">
            {product.yorumlar.length > 0 ? (
              product.yorumlar.slice(0, 2).map((commentItem) => (
                <div key={commentItem.id} className="px-2.5 py-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm leading-5">{commentItem.icerik}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {commentItem.kullaniciAdi ?? "Yöremio kullanıcısı"} · {formatShortDate(commentItem.tarih)}
                      </p>
                    </div>
                    {authUser?.userId === commentItem.kullaniciId ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Yorumu sil"
                        onClick={() => onDeleteComment(commentItem.id, product.id)}
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="px-2.5 py-2 text-xs text-muted-foreground">
                Bu ürün için henüz yorum yok.
              </p>
            )}
          </div>
        </div>
      </aside>
    </section>
  );
}

function WorkspaceSection({
  workspace,
  setWorkspace,
  authUser,
  uploads,
  selectedProduct,
  categories,
  recommendedProducts,
  favoriteProducts,
  buyerDemands,
  sellerProfile,
  sellerProducts,
  sellerDemands,
  sellerDashboard,
  adminDashboard,
  totalOpenSellerDemands,
  conversations,
  chatMessages,
  chatTargetId,
  chatState,
  signalRState,
  actionStatus,
  onLogin,
  onSelectProduct,
  onDemand,
  onAcceptOffer,
  onProfileUpdate,
  onProductSave,
  onProductStatus,
  onProductDelete,
  onDeleteMedia,
  onOffer,
  onCategorySave,
  onCategoryDelete,
  onChatTargetChange,
  onSendMessage,
}: {
  workspace: Workspace;
  setWorkspace: (value: Workspace) => void;
  authUser: AuthState | null;
  uploads?: AppUploadsConfig;
  selectedProduct: ProductDto | null;
  categories: CategoryDto[];
  recommendedProducts: ProductDto[];
  favoriteProducts: ProductDto[];
  buyerDemands: DemandDto[];
  sellerProfile: SellerProfileDto | null;
  sellerProducts: ProductDto[];
  sellerDemands: DemandDto[];
  sellerDashboard: SellerDashboardDto | null;
  adminDashboard: AdminDashboardDto | null;
  totalOpenSellerDemands: number;
  conversations: ChatConversationDto[];
  chatMessages: ChatMessageDto[];
  chatTargetId: string;
  chatState: LoadState;
  signalRState: string;
  actionStatus: string | null;
  onLogin: () => void;
  onSelectProduct: (id: number) => void;
  onDemand: (urunId: number, miktar: number, note?: string) => void;
  onAcceptOffer: (offerId: number) => void;
  onProfileUpdate: (values: {
    magazaAdi: string;
    adres: string;
    sehir: string;
    ilce: string;
    phoneNumber: string;
  }) => void;
  onProductSave: (values: ProductFormValues, productId?: number) => void;
  onProductStatus: (urunId: number, aktifMi: boolean) => void;
  onProductDelete: (urunId: number) => void;
  onDeleteMedia: (urunId: number, mediaId: number, kind: "image" | "video") => void;
  onOffer: (
    talepId: number,
    values: { birimFiyat?: number; mesaj: string },
  ) => void;
  onCategorySave: (
    values: { adi: string; aciklama: string },
    categoryToUpdate?: number,
  ) => void;
  onCategoryDelete: (id: number) => void;
  onChatTargetChange: (value: string) => void;
  onSendMessage: (receiverId: string, message: string) => void;
}) {
  return (
    <div className="mx-auto max-w-[1760px] px-3 py-10 sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="plum">
            <Sparkles className="size-3.5" aria-hidden />
            Genel panel
          </Badge>
          <h2 className="mt-3 text-3xl font-black tracking-normal text-brand-brown sm:text-4xl">
            Pazar operasyon merkezi
          </h2>
        </div>
        <div className="surface-glass flex w-full rounded-lg p-1 shadow-inner sm:w-auto">
          {workspaces.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setWorkspace(item.id)}
                className={cn(
                  "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition sm:flex-none",
                  workspace === item.id
                    ? "bg-white text-primary shadow-[0_8px_22px_rgba(32,39,52,0.1)]"
                    : "text-muted-foreground hover:bg-white/55 hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        {workspace === "buyer" ? (
          <BuyerWorkspace
            authUser={authUser}
            selectedProduct={selectedProduct}
            recommendedProducts={recommendedProducts}
            favoriteProducts={favoriteProducts}
            demands={buyerDemands}
            actionStatus={actionStatus}
            onLogin={onLogin}
            onSelectProduct={onSelectProduct}
            onDemand={onDemand}
            onAcceptOffer={onAcceptOffer}
          />
        ) : null}
        {workspace === "seller" ? (
          <SellerWorkspace
            authUser={authUser}
            categories={categories}
            profile={sellerProfile}
            products={sellerProducts}
            demands={sellerDemands}
            dashboard={sellerDashboard}
            totalOpenDemands={totalOpenSellerDemands}
            actionStatus={actionStatus}
            onLogin={onLogin}
            onSelectProduct={onSelectProduct}
            onProfileUpdate={onProfileUpdate}
            onProductSave={onProductSave}
            onProductStatus={onProductStatus}
            onProductDelete={onProductDelete}
            onDeleteMedia={onDeleteMedia}
            onOffer={onOffer}
            uploads={uploads}
          />
        ) : null}
        {workspace === "chat" ? (
          <ChatWorkspace
            authUser={authUser}
            selectedProduct={selectedProduct}
            conversations={conversations}
            messages={chatMessages}
            targetId={chatTargetId}
            chatState={chatState}
            signalRState={signalRState}
            actionStatus={actionStatus}
            onLogin={onLogin}
            onTargetChange={onChatTargetChange}
            onSendMessage={onSendMessage}
          />
        ) : null}
        {workspace === "admin" ? (
          <AdminWorkspace
            authUser={authUser}
            categories={categories}
            actionStatus={actionStatus}
            dashboard={adminDashboard}
            onLogin={onLogin}
            onCategorySave={onCategorySave}
            onCategoryDelete={onCategoryDelete}
          />
        ) : null}
      </div>
    </div>
  );
}

function BuyerWorkspace({
  authUser,
  selectedProduct,
  recommendedProducts,
  favoriteProducts,
  demands,
  actionStatus,
  onLogin,
  onSelectProduct,
  onDemand,
  onAcceptOffer,
}: {
  authUser: AuthState | null;
  selectedProduct: ProductDto | null;
  recommendedProducts: ProductDto[];
  favoriteProducts: ProductDto[];
  demands: DemandDto[];
  actionStatus: string | null;
  onLogin: () => void;
  onSelectProduct: (id: number) => void;
  onDemand: (urunId: number, miktar: number, note?: string) => void;
  onAcceptOffer: (offerId: number) => void;
}) {
  const [miktar, setMiktar] = useState(2);
  const [note, setNote] = useState("Toplu alım için fiyat rica ederim.");

  if (!hasRole(authUser, "ALICI")) {
    return <LockedPanel role="ALICI" onLogin={onLogin} />;
  }

  const openDemands = demands.filter((demand) => demand.durum === "ACIK").length;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <WorkspaceStat
            icon={Sparkles}
            label="Önerilen"
            value={String(recommendedProducts.length)}
          />
          <WorkspaceStat icon={Heart} label="Favori" value={String(favoriteProducts.length)} />
          <WorkspaceStat icon={PackagePlus} label="Açık talep" value={String(openDemands)} />
        </div>

        <Panel title="Taleplerim" description="Teklifler ve anlaşma durumları">
          {demands.length > 0 ? (
            <div className="divide-y divide-border">
              {demands.map((demand) => (
                <div key={demand.id} className="px-4 py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onSelectProduct(demand.urunId)}
                        className="text-left font-semibold transition hover:text-primary"
                      >
                        {demand.urunAdi}
                      </button>
                      <p className="text-sm text-muted-foreground">
                        {demand.miktar} adet · {formatShortDate(demand.olusturmaTarihi)}
                      </p>
                      {demand.not ? (
                        <p className="mt-2 text-sm leading-6">{demand.not}</p>
                      ) : null}
                    </div>
                    <Badge variant={demand.durum === "ACIK" ? "green" : "plum"}>
                      {demand.durum}
                    </Badge>
                  </div>
                  {demand.teklifler.length > 0 ? (
                    <div className="mt-3 grid gap-2">
                      {demand.teklifler.map((offer) => (
                        <div
                          key={offer.id}
                          className="grid gap-2 rounded-md border border-border bg-background p-3 md:grid-cols-[1fr_140px_auto] md:items-center"
                        >
                          <div>
                            <p className="font-semibold">
                              {offer.saticiMagazaAdi ?? "Satıcı"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {offer.mesaj}
                            </p>
                          </div>
                          <p className="font-black text-primary">
                            {offer.birimFiyat ? formatPrice(offer.birimFiyat) : "Fiyat yok"}
                          </p>
                          <Button
                            size="sm"
                            variant={offer.durum === "KABUL" ? "default" : "outline"}
                            disabled={
                              demand.durum !== "ACIK" ||
                              offer.durum === "KABUL" ||
                              actionStatus === `accept-${offer.id}`
                            }
                            onClick={() => onAcceptOffer(offer.id)}
                          >
                            <Check aria-hidden />
                            {offer.durum === "KABUL" ? "Kabul" : "Kabul et"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Inbox}
              title="Henüz talep yok."
              description="Ürün detayından veya hızlı talep formundan satıcıya talep gönderebilirsin."
            />
          )}
        </Panel>

        <ProductStrip
          title="Önerilen ürünler"
          products={recommendedProducts}
          onSelectProduct={onSelectProduct}
        />
        <ProductStrip
          title="Favorilerim"
          products={favoriteProducts}
          onSelectProduct={onSelectProduct}
        />
      </div>

      <Card className="p-4 lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold">Hızlı talep</h3>
            <p className="text-sm text-muted-foreground">
              Seçili ürün için satıcıya net bir istek gönder
            </p>
          </div>
          <Truck className="size-5 text-primary" aria-hidden />
        </div>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!selectedProduct) return;
            onDemand(selectedProduct.id, miktar, note);
          }}
        >
          <Input
            value={
              selectedProduct
                ? `${selectedProduct.id} · ${selectedProduct.adi}`
                : "Ürün seçilmedi"
            }
            readOnly
          />
          <Input
            type="number"
            min={1}
            value={miktar}
            onChange={(event) => setMiktar(Number(event.target.value))}
          />
          <Input value={note} onChange={(event) => setNote(event.target.value)} />
          <Button
            className="w-full"
            disabled={
              !selectedProduct ||
              actionStatus === `demand-${selectedProduct.id}`
            }
          >
            <Send aria-hidden />
            Gönder
          </Button>
        </form>
      </Card>
    </div>
  );
}

function SellerWorkspace({
  authUser,
  categories,
  profile,
  products,
  demands,
  dashboard,
  totalOpenDemands,
  actionStatus,
  onLogin,
  onSelectProduct,
  onProfileUpdate,
  onProductSave,
  onProductStatus,
  onProductDelete,
  onDeleteMedia,
  onOffer,
  uploads,
}: {
  authUser: AuthState | null;
  categories: CategoryDto[];
  profile: SellerProfileDto | null;
  products: ProductDto[];
  demands: DemandDto[];
  dashboard: SellerDashboardDto | null;
  totalOpenDemands: number;
  actionStatus: string | null;
  onLogin: () => void;
  onSelectProduct: (id: number) => void;
  onProfileUpdate: (values: {
    magazaAdi: string;
    adres: string;
    sehir: string;
    ilce: string;
    phoneNumber: string;
  }) => void;
  onProductSave: (values: ProductFormValues, productId?: number) => void;
  onProductStatus: (urunId: number, aktifMi: boolean) => void;
  onProductDelete: (urunId: number) => void;
  onDeleteMedia: (urunId: number, mediaId: number, kind: "image" | "video") => void;
  onOffer: (
    talepId: number,
    values: { birimFiyat?: number; mesaj: string },
  ) => void;
  uploads?: AppUploadsConfig;
}) {
  if (!hasRole(authUser, "SATICI")) {
    return <LockedPanel role="SATICI" onLogin={onLogin} />;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
      <div className="space-y-4">
        <SellerIdentityPanel
          profile={profile}
          dashboard={dashboard}
          productsCount={products.length}
          openDemands={totalOpenDemands}
        />
        <SellerProfileForm
          profile={profile}
          actionStatus={actionStatus}
          onProfileUpdate={onProfileUpdate}
        />
        <SellerRuleCard />
      </div>

      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <WorkspaceStat
            icon={Store}
            label="Aktif ürün"
            value={String(dashboard?.activeProducts ?? products.length)}
          />
          <WorkspaceStat
            icon={Users}
            label="Açık talep"
            value={String(dashboard?.openDemands ?? totalOpenDemands)}
          />
          <WorkspaceStat
            icon={ImagePlus}
            label="Okunmamış"
            value={String(dashboard?.unreadMessages ?? 0)}
          />
        </div>

        <ProductManager
          categories={categories}
          products={products}
          actionStatus={actionStatus}
          onSelectProduct={onSelectProduct}
          onProductSave={onProductSave}
          onProductStatus={onProductStatus}
          onProductDelete={onProductDelete}
          onDeleteMedia={onDeleteMedia}
          uploads={uploads}
        />

        <Panel title="Gelen talepler" description="Açık taleplere teklif ver">
          {demands.length > 0 ? (
            <div className="grid gap-3 p-4">
              {demands.map((demand) => (
                <SellerDemandCard
                  key={demand.id}
                  demand={demand}
                  actionStatus={actionStatus}
                  onOffer={onOffer}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Inbox}
              title="Gelen talep yok."
              description="Ürünlerin için talep geldiğinde burada teklif verebilirsin."
            />
          )}
        </Panel>
      </div>
    </div>
  );
}

function SellerIdentityPanel({
  profile,
  dashboard,
  productsCount,
  openDemands,
}: {
  profile: SellerProfileDto | null;
  dashboard: SellerDashboardDto | null;
  productsCount: number;
  openDemands: number;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-emerald-900/20 bg-primary text-primary-foreground shadow-[0_10px_26px_rgba(10,106,68,0.18)]">
      <div className="p-4">
        <BrandLogo compact inverse />
        <div className="mt-5 flex items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-md bg-white/12 ring-1 ring-white/15">
            <Store className="size-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-black">
              {profile?.magazaAdi || "Satıcı Paneli"}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-white/76">
              <MapPin className="size-3.5" aria-hidden />
              {[profile?.sehir, profile?.ilce].filter(Boolean).join(" / ") ||
                "Konum eklenmedi"}
            </p>
            <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-white/12 px-2 py-1 text-[11px] font-black text-white">
              <ShieldCheck className="size-3.5" aria-hidden />
              Doğrulanmış satıcı
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 border-t border-white/12 bg-black/10 text-center">
        <div className="p-3">
          <p className="text-lg font-black">{dashboard?.activeProducts ?? productsCount}</p>
          <p className="text-[11px] font-semibold text-white/68">Ürün</p>
        </div>
        <div className="border-x border-white/12 p-3">
          <p className="text-lg font-black">{dashboard?.openDemands ?? openDemands}</p>
          <p className="text-[11px] font-semibold text-white/68">Talep</p>
        </div>
        <div className="p-3">
          <p className="text-lg font-black">{dashboard?.unreadMessages ?? 0}</p>
          <p className="text-[11px] font-semibold text-white/68">Mesaj</p>
        </div>
      </div>
    </div>
  );
}

function SellerProfileForm({
  profile,
  actionStatus,
  onProfileUpdate,
}: {
  profile: SellerProfileDto | null;
  actionStatus: string | null;
  onProfileUpdate: (values: {
    magazaAdi: string;
    adres: string;
    sehir: string;
    ilce: string;
    phoneNumber: string;
  }) => void;
}) {
  const [magazaAdi, setMagazaAdi] = useState(profile?.magazaAdi ?? "");
  const [adres, setAdres] = useState(profile?.adres ?? "");
  const [sehir, setSehir] = useState(profile?.sehir ?? "");
  const [ilce, setIlce] = useState(profile?.ilce ?? "");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber ?? "");

  useEffect(() => {
    setMagazaAdi(profile?.magazaAdi ?? "");
    setAdres(profile?.adres ?? "");
    setSehir(profile?.sehir ?? "");
    setIlce(profile?.ilce ?? "");
    setPhoneNumber(profile?.phoneNumber ?? "");
  }, [profile]);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold">Satıcı profili</h3>
          <p className="text-sm text-muted-foreground">
            Mağaza bilgileri ve doğrulama
          </p>
        </div>
        <ShieldCheck className="size-5 text-primary" aria-hidden />
      </div>
      <form
        className="mt-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          onProfileUpdate({ magazaAdi, adres, sehir, ilce, phoneNumber });
        }}
      >
        <Input
          placeholder="Mağaza adı"
          value={magazaAdi}
          onChange={(event) => setMagazaAdi(event.target.value)}
        />
        <Input
          placeholder="Adres"
          value={adres}
          onChange={(event) => setAdres(event.target.value)}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            placeholder="Şehir"
            value={sehir}
            onChange={(event) => setSehir(event.target.value)}
          />
          <Input
            placeholder="İlçe"
            value={ilce}
            onChange={(event) => setIlce(event.target.value)}
          />
        </div>
        <Input
          placeholder="Telefon"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
        />
        <Button
          className="w-full"
          variant="premium"
          disabled={actionStatus === "profile"}
        >
          {actionStatus === "profile" ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Check aria-hidden />
          )}
          Profili güncelle
        </Button>
      </form>
    </Card>
  );
}

function SellerRuleCard() {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-primary">
          <ShieldCheck className="size-5" aria-hidden />
        </div>
        <div>
          <h3 className="font-bold">Kategori yönetimi admin alanında</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Satıcılar ürün eklerken mevcut kategorileri seçer. Kategori oluşturma,
            güncelleme ve silme işlemleri artık sadece ADMIN rolüyle yapılır.
          </p>
        </div>
      </div>
    </Card>
  );
}

function ProductManager({
  categories,
  products,
  actionStatus,
  onSelectProduct,
  onProductSave,
  onProductStatus,
  onProductDelete,
  onDeleteMedia,
  uploads,
}: {
  categories: CategoryDto[];
  products: ProductDto[];
  actionStatus: string | null;
  onSelectProduct: (id: number) => void;
  onProductSave: (values: ProductFormValues, productId?: number) => void;
  onProductStatus: (urunId: number, aktifMi: boolean) => void;
  onProductDelete: (urunId: number) => void;
  onDeleteMedia: (urunId: number, mediaId: number, kind: "image" | "video") => void;
  uploads?: AppUploadsConfig;
}) {
  const [editingProductId, setEditingProductId] = useState<number | undefined>();
  const editingProduct = products.find((product) => product.id === editingProductId);

  return (
    <Panel title="Ürün yönetimi" description="Ürün ekle, güncelle, medya yönet">
      <ProductForm
        categories={categories}
        product={editingProduct}
        actionStatus={actionStatus}
        uploads={uploads}
        onCancel={() => setEditingProductId(undefined)}
        onProductSave={(values, productId) => {
          onProductSave(values, productId);
          setEditingProductId(undefined);
        }}
      />

      <div className="border-t border-border p-4">
        {products.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-border bg-white">
            <div className="hidden grid-cols-[minmax(280px,1.5fr)_130px_110px_120px_160px] gap-3 border-b border-border bg-background px-3 py-2 text-xs font-black uppercase tracking-[0.1em] text-muted-foreground xl:grid">
              <span>Ürün</span>
              <span>Kategori</span>
              <span>Fiyat</span>
              <span>Durum</span>
              <span className="text-right">İşlemler</span>
            </div>
            <div className="divide-y divide-border">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="grid gap-3 p-3 xl:grid-cols-[minmax(280px,1.5fr)_130px_110px_120px_160px] xl:items-center"
                >
                  <div className="grid min-w-0 grid-cols-[72px_1fr] gap-3">
                    <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                      <Image
                        src={productImage(product)}
                        alt={product.adi}
                        fill
                        sizes="72px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onSelectProduct(product.id)}
                        className="line-clamp-1 text-left font-black text-brand-brown transition hover:text-primary"
                      >
                        {product.adi}
                      </button>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {product.stokMiktari} stok · {product.resimler.length} resim ·{" "}
                        {product.videolar.length} video
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5 xl:hidden">
                        <Badge variant="outline">
                          {categories.find((category) => category.id === product.kategoriId)?.adi ??
                            "Kategori"}
                        </Badge>
                        <Badge variant={product.aktifMi === false ? "gold" : "green"}>
                          {product.aktifMi === false ? "Pasif" : "Aktif"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="hidden truncate text-sm font-semibold text-muted-foreground xl:block">
                    {categories.find((category) => category.id === product.kategoriId)?.adi ??
                      "Kategori"}
                  </p>
                  <p className="text-sm font-black text-brand-brown xl:text-base">
                    {formatPrice(product.fiyat)}
                  </p>
                  <Badge
                    className="hidden w-fit xl:inline-flex"
                    variant={product.aktifMi === false ? "gold" : "green"}
                  >
                    {product.aktifMi === false ? "Pasif" : "Aktif"}
                  </Badge>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      title="Düzenle"
                      onClick={() => setEditingProductId(product.id)}
                    >
                      <Edit3 aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      title={product.aktifMi === false ? "Aktife al" : "Pasife al"}
                      onClick={() => onProductStatus(product.id, product.aktifMi === false)}
                      disabled={actionStatus === `status-product-${product.id}`}
                    >
                      <RefreshCw aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      title="Sil"
                      onClick={() => onProductDelete(product.id)}
                      disabled={actionStatus === `delete-product-${product.id}`}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                  {(product.resimler.length > 0 || product.videolar.length > 0) ? (
                    <div className="flex flex-wrap gap-2 xl:col-span-5">
                      {product.resimler.map((image) => (
                        <Button
                          key={image.id}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onDeleteMedia(product.id, image.id, "image")}
                          disabled={actionStatus === `media-${image.id}`}
                        >
                          <ImagePlus aria-hidden />
                          Resim {image.id}
                        </Button>
                      ))}
                      {product.videolar.map((video) => (
                        <Button
                          key={video.id}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onDeleteMedia(product.id, video.id, "video")}
                          disabled={actionStatus === `media-${video.id}`}
                        >
                          <Video aria-hidden />
                          Video {video.id}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={PackagePlus}
            title="Ürün yok."
            description="İlk ürününü ekleyerek satıcı vitrinini oluştur."
          />
        )}
      </div>
    </Panel>
  );
}

function ProductForm({
  categories,
  product,
  actionStatus,
  uploads,
  onCancel,
  onProductSave,
}: {
  categories: CategoryDto[];
  product?: ProductDto;
  actionStatus: string | null;
  uploads?: AppUploadsConfig;
  onCancel: () => void;
  onProductSave: (values: ProductFormValues, productId?: number) => void;
}) {
  const [adi, setAdi] = useState(product?.adi ?? "");
  const [aciklama, setAciklama] = useState(product?.aciklama ?? "");
  const [fiyat, setFiyat] = useState(product?.fiyat ?? 100);
  const [stokMiktari, setStokMiktari] = useState(product?.stokMiktari ?? 10);
  const [kategoriId, setKategoriId] = useState(
    product?.kategoriId ?? categories[0]?.id ?? 1,
  );
  const [resimler, setResimler] = useState<File[]>([]);
  const [videolar, setVideolar] = useState<File[]>([]);

  useEffect(() => {
    setAdi(product?.adi ?? "");
    setAciklama(product?.aciklama ?? "");
    setFiyat(product?.fiyat ?? 100);
    setStokMiktari(product?.stokMiktari ?? 10);
    setKategoriId(product?.kategoriId ?? categories[0]?.id ?? 1);
    setResimler([]);
    setVideolar([]);
  }, [categories, product]);

  const updateImages = (event: ChangeEvent<HTMLInputElement>) => {
    setResimler(Array.from(event.target.files ?? []));
  };

  const updateVideos = (event: ChangeEvent<HTMLInputElement>) => {
    setVideolar(Array.from(event.target.files ?? []));
  };

  return (
    <form
      className="grid gap-3 p-4 lg:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        onProductSave(
          {
            adi,
            aciklama,
            fiyat,
            stokMiktari,
            kategoriId,
            resimler,
            videolar,
          },
          product?.id,
        );
      }}
    >
      <Field label="Ürün adı" htmlFor="product-name">
        <Input
          id="product-name"
          value={adi}
          minLength={3}
          onChange={(event) => setAdi(event.target.value)}
          required={!product}
        />
      </Field>
      <Field label="Kategori" htmlFor="product-category">
        <select
          id="product-category"
          value={kategoriId}
          onChange={(event) => setKategoriId(Number(event.target.value))}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.adi}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Fiyat" htmlFor="product-price">
        <Input
          id="product-price"
          type="number"
          min={0.01}
          step={0.01}
          value={fiyat}
          onChange={(event) => setFiyat(Number(event.target.value))}
        />
      </Field>
      <Field label="Stok" htmlFor="product-stock">
        <Input
          id="product-stock"
          type="number"
          min={0}
          value={stokMiktari}
          onChange={(event) => setStokMiktari(Number(event.target.value))}
        />
      </Field>
      <Field label="Açıklama" htmlFor="product-description">
        <Input
          id="product-description"
          value={aciklama}
          onChange={(event) => setAciklama(event.target.value)}
        />
      </Field>
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Resimler" htmlFor="product-images">
          <Input
            id="product-images"
            type="file"
            accept="image/*"
            multiple
            onChange={updateImages}
          />
          {uploads ? (
            <span className="block text-xs font-normal text-muted-foreground">
              Dosya başına en fazla {formatBytes(uploads.maxImageBytes)}
            </span>
          ) : null}
        </Field>
        <Field label="Videolar" htmlFor="product-videos">
          <Input
            id="product-videos"
            type="file"
            accept="video/*"
            multiple
            onChange={updateVideos}
          />
          {uploads ? (
            <span className="block text-xs font-normal text-muted-foreground">
              Dosya başına en fazla {formatBytes(uploads.maxVideoBytes)}
            </span>
          ) : null}
        </Field>
      </div>
      <div className="flex gap-2 lg:col-span-2">
        {product ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            <X aria-hidden />
            İptal
          </Button>
        ) : null}
        <Button
          className="flex-1"
          variant="premium"
          disabled={actionStatus === "product-form"}
        >
          {actionStatus === "product-form" ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <UploadCloud aria-hidden />
          )}
          {product ? "Ürünü güncelle" : "Ürün ekle"}
        </Button>
      </div>
    </form>
  );
}

function AdminWorkspace({
  authUser,
  categories,
  actionStatus,
  dashboard,
  onLogin,
  onCategorySave,
  onCategoryDelete,
}: {
  authUser: AuthState | null;
  categories: CategoryDto[];
  actionStatus: string | null;
  dashboard: AdminDashboardDto | null;
  onLogin: () => void;
  onCategorySave: (
    values: { adi: string; aciklama: string },
    categoryToUpdate?: number,
  ) => void;
  onCategoryDelete: (id: number) => void;
}) {
  if (!hasRole(authUser, "ADMIN")) {
    return <LockedPanel role="ADMIN" onLogin={onLogin} />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
      <CategoryManager
        categories={categories}
        actionStatus={actionStatus}
        onCategorySave={onCategorySave}
        onCategoryDelete={onCategoryDelete}
      />
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <WorkspaceStat
            icon={Users}
            label="Kullanıcı"
            value={String(dashboard?.totalUsers ?? 0)}
          />
          <WorkspaceStat
            icon={Store}
            label="Aktif satıcı"
            value={String(dashboard?.activeSellers ?? 0)}
          />
          <WorkspaceStat
            icon={PackagePlus}
            label="Aktif ürün"
            value={String(dashboard?.activeProducts ?? 0)}
          />
          <WorkspaceStat
            icon={MessageCircle}
            label="Okunmamış"
            value={String(dashboard?.unreadMessages ?? 0)}
          />
        </div>
        <Panel title="Kategori sözleşmesi" description="Admin yetkili taksonomi yönetimi">
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="rounded-lg border border-border bg-background p-4"
              >
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  #{category.id}
                </p>
                <h3 className="mt-2 font-black text-brand-brown">{category.adi}</h3>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {category.aciklama || "Açıklama eklenmedi."}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function CategoryManager({
  categories,
  actionStatus,
  onCategorySave,
  onCategoryDelete,
}: {
  categories: CategoryDto[];
  actionStatus: string | null;
  onCategorySave: (
    values: { adi: string; aciklama: string },
    categoryToUpdate?: number,
  ) => void;
  onCategoryDelete: (id: number) => void;
}) {
  const [selectedId, setSelectedId] = useState<number | "new">("new");
  const selectedCategory =
    selectedId === "new"
      ? undefined
      : categories.find((category) => category.id === selectedId);
  const [adi, setAdi] = useState("");
  const [aciklama, setAciklama] = useState("");

  useEffect(() => {
    setAdi(selectedCategory?.adi ?? "");
    setAciklama(selectedCategory?.aciklama ?? "");
  }, [selectedCategory]);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold">Kategori yönetimi</h3>
          <p className="text-sm text-muted-foreground">
            Kategori oluştur, güncelle veya sil
          </p>
        </div>
        <Leaf className="size-5 text-primary" aria-hidden />
      </div>
      <form
        className="mt-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          onCategorySave(
            { adi, aciklama },
            selectedId === "new" ? undefined : selectedId,
          );
        }}
      >
        <select
          value={selectedId}
          onChange={(event) =>
            setSelectedId(event.target.value === "new" ? "new" : Number(event.target.value))
          }
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
        >
          <option value="new">Yeni kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.adi}
            </option>
          ))}
        </select>
        <Input
          placeholder="Kategori adı"
          value={adi}
          onChange={(event) => setAdi(event.target.value)}
          minLength={2}
          required
        />
        <Input
          placeholder="Açıklama"
          value={aciklama}
          onChange={(event) => setAciklama(event.target.value)}
        />
        <div className="flex gap-2">
          <Button className="flex-1" disabled={actionStatus === "category"}>
            <Check aria-hidden />
            {selectedId === "new" ? "Oluştur" : "Güncelle"}
          </Button>
          {selectedId !== "new" ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => onCategoryDelete(selectedId)}
              disabled={actionStatus === "category"}
            >
              <Trash2 aria-hidden />
              Sil
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

function SellerDemandCard({
  demand,
  actionStatus,
  onOffer,
}: {
  demand: DemandDto;
  actionStatus: string | null;
  onOffer: (
    talepId: number,
    values: { birimFiyat?: number; mesaj: string },
  ) => void;
}) {
  const existingOffer = demand.teklifler[0];
  const [birimFiyat, setBirimFiyat] = useState(existingOffer?.birimFiyat ?? 100);
  const [mesaj, setMesaj] = useState(
    existingOffer?.mesaj ?? "Toplu alım için özel fiyat uygulayabilirim.",
  );

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold">{demand.urunAdi}</p>
          <p className="text-sm text-muted-foreground">
            {demand.miktar} adet · {formatShortDate(demand.olusturmaTarihi)}
          </p>
          {demand.not ? <p className="mt-2 text-sm leading-6">{demand.not}</p> : null}
        </div>
        <Badge variant={demand.durum === "ACIK" ? "green" : "plum"}>
          {demand.durum}
        </Badge>
      </div>
      <form
        className="mt-3 grid gap-2 sm:grid-cols-[150px_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          onOffer(demand.id, { birimFiyat, mesaj });
        }}
      >
        <Input
          type="number"
          min={0.01}
          step={0.01}
          value={birimFiyat}
          onChange={(event) => setBirimFiyat(Number(event.target.value))}
        />
        <Input value={mesaj} onChange={(event) => setMesaj(event.target.value)} />
        <Button
          variant="premium"
          disabled={demand.durum !== "ACIK" || actionStatus === `offer-${demand.id}`}
        >
          <CircleDollarSign aria-hidden />
          Teklif ver
        </Button>
      </form>
    </div>
  );
}

function ChatWorkspace({
  authUser,
  selectedProduct,
  conversations,
  messages,
  targetId,
  chatState,
  signalRState,
  actionStatus,
  onLogin,
  onTargetChange,
  onSendMessage,
}: {
  authUser: AuthState | null;
  selectedProduct: ProductDto | null;
  conversations: ChatConversationDto[];
  messages: ChatMessageDto[];
  targetId: string;
  chatState: LoadState;
  signalRState: string;
  actionStatus: string | null;
  onLogin: () => void;
  onTargetChange: (value: string) => void;
  onSendMessage: (receiverId: string, message: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const currentTarget = targetId || selectedProduct?.saticiId || "";
  const selectedConversation = conversations.find(
    (conversation) => conversation.userId === currentTarget,
  );
  const currentName = selectedConversation
    ? conversationName(selectedConversation)
    : selectedProduct
      ? sellerName(selectedProduct)
      : "Görüşme seçilmedi";

  if (!authUser) {
    return <LockedPanel role="ALICI" onLogin={onLogin} anyRole />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
      <div className="rounded-lg border border-border/80 bg-white p-3 shadow-[0_8px_24px_rgba(32,39,52,0.055)]">
        <div className="flex items-center justify-between gap-2 px-1 py-2">
          <div>
            <h3 className="font-bold">Konuşmalar</h3>
            <p className="text-xs text-muted-foreground">Canlı chat ve okunma bilgisi</p>
          </div>
          <Badge variant={signalRState === "Canlı" ? "green" : "outline"}>
            {signalRState}
          </Badge>
        </div>

        <div className="mt-2 space-y-2">
          {conversations.length > 0 ? (
            conversations.map((conversation) => (
              <button
                key={conversation.userId}
                type="button"
                onClick={() => onTargetChange(conversation.userId)}
                className={cn(
                  "w-full rounded-lg border p-3 text-left transition",
                  currentTarget === conversation.userId
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-white hover:bg-muted",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-semibold">
                    {conversationName(conversation)}
                  </p>
                  {conversation.unreadCount > 0 ? (
                    <span className="grid size-6 place-items-center rounded-full bg-accent text-xs font-black text-accent-foreground">
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 line-clamp-1 text-sm opacity-80">
                  {conversation.lastMessage ?? "Henüz mesaj yok"}
                </p>
                {conversation.lastMessageAt ? (
                  <p className="mt-2 flex items-center gap-1 text-xs opacity-70">
                    <Clock3 className="size-3.5" aria-hidden />
                    {formatShortDate(conversation.lastMessageAt)}
                  </p>
                ) : null}
              </button>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              Henüz konuşma yok. Bir ürünün satıcısına mesaj gönderince burada görünür.
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border/80 bg-white shadow-[0_8px_24px_rgba(32,39,52,0.055)]">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-bold">
              {currentName}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {currentTarget ? "Güvenli mesajlaşma açık" : "Önce ürün detayından bir görüşme başlat"}
            </p>
          </div>
          <Badge variant="green">{signalRState}</Badge>
        </div>

        <div className="grid min-h-[24rem] content-end gap-3 bg-[linear-gradient(180deg,#f8f5ec,#fffdf8)] p-4 sm:min-h-[32rem]">
          {chatState === "loading" ? (
            <div className="grid place-items-center py-10 text-sm font-semibold text-muted-foreground">
              <Loader2 className="mb-2 size-5 animate-spin" aria-hidden />
              Mesajlar yükleniyor
            </div>
          ) : messages.length > 0 ? (
            messages.map((message) => (
              <ChatBubble key={message.id} mine={message.isMine}>
                <span>{message.message}</span>
                <span className="mt-1 block text-[11px] opacity-70">
                  {formatShortDate(message.sentAt)}
                </span>
              </ChatBubble>
            ))
          ) : (
            <EmptyState
              icon={MessageCircle}
              title="Mesaj geçmişi boş."
              description={
                currentTarget
                  ? "Bu görüşme için ilk mesajı yazabilirsin."
                  : "Mesaj başlatmak için ürün detayında Mesaj butonunu kullan."
              }
            />
          )}
        </div>

        <form
          className="grid gap-2 border-t border-border p-3 sm:grid-cols-[1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.trim() || !currentTarget) return;
            onSendMessage(currentTarget, draft.trim());
            setDraft("");
          }}
        >
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={
              currentTarget
                ? `${currentName} için mesaj yaz`
                : "Önce ürün detayından mesaj başlat"
            }
            maxLength={1000}
            disabled={!currentTarget}
          />
          <Button disabled={actionStatus === "chat-send" || !currentTarget}>
            {actionStatus === "chat-send" ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <Send aria-hidden />
            )}
            Gönder
          </Button>
        </form>
      </div>
    </div>
  );
}

function ProductStrip({
  title,
  products,
  onSelectProduct,
}: {
  title: string;
  products: ProductDto[];
  onSelectProduct: (id: number) => void;
}) {
  return (
    <Panel title={title} description="Canlı listeden">
      {products.length > 0 ? (
        <div className="grid gap-3 p-4 md:grid-cols-2">
          {products.slice(0, 6).map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelectProduct(product.id)}
              className="grid grid-cols-[72px_1fr] gap-3 rounded-lg border border-border bg-background p-2 text-left transition hover:border-primary/40"
            >
              <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                <Image
                  src={productImage(product)}
                  alt={product.adi}
                  fill
                  sizes="72px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="line-clamp-1 font-bold">{product.adi}</p>
                <p className="mt-1 text-sm text-primary">{formatPrice(product.fiyat)}</p>
                <p className="text-xs text-muted-foreground">
                  {product.ortalamaPuan.toFixed(1)} puan · {product.toplamYorum} yorum
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Inbox}
          title="Liste boş."
          description="Bu alan giriş yapılan kullanıcının verileriyle dolar."
        />
      )}
    </Panel>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/80 bg-white shadow-[0_8px_24px_rgba(32,39,52,0.055)]">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-[#fbfaf7] px-4 py-3">
        <div>
          <h3 className="font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function PaginationBar({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between rounded-lg border border-border/80 bg-white p-3 shadow-[0_8px_24px_rgba(32,39,52,0.055)]">
      <Button
        variant="outline"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Önceki
      </Button>
      <p className="text-sm font-semibold text-muted-foreground">
        {page} / {totalPages}
      </p>
      <Button
        variant="outline"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Sonraki
      </Button>
    </div>
  );
}

function LockedPanel({
  role,
  anyRole,
  onLogin,
}: {
  role: UserRole;
  anyRole?: boolean;
  onLogin: () => void;
}) {
  const sellerFeatures = [
    { icon: Store, label: "Satıcı profili" },
    { icon: PackagePlus, label: "Ürün ekle" },
    { icon: Edit3, label: "Ürün güncelle" },
    { icon: ImagePlus, label: "Medya yönetimi" },
    { icon: Users, label: "Gelen talepler" },
    { icon: CircleDollarSign, label: "Teklif ver" },
  ];

  return (
    <div className="rounded-lg border border-dashed border-primary/30 bg-white p-10 text-center shadow-[0_8px_24px_rgba(32,39,52,0.055)]">
      <ShieldCheck className="mx-auto size-9 text-primary" aria-hidden />
      <h3 className="mt-3 text-xl font-black text-brand-brown">
        {anyRole ? "Giriş gerekli" : `${roleLabel(role)} girişi gerekli`}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Bu panel güvenli oturum ve doğru hesap rolü gerektirir.
      </p>
      {role === "SATICI" && !anyRole ? (
        <div className="mx-auto mt-5 grid max-w-3xl gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sellerFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.label}
                className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-left text-sm font-semibold"
              >
                <Icon className="size-4 text-primary" aria-hidden />
                {feature.label}
              </div>
            );
          })}
        </div>
      ) : null}
      <Button className="mt-4" onClick={onLogin}>
        <UserRound aria-hidden />
        Giriş yap
      </Button>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border/90 bg-white p-8 text-center">
      <Icon className="mx-auto size-8 text-muted-foreground" aria-hidden />
      <p className="mt-3 font-bold">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function WorkspaceStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-white p-4 shadow-[0_8px_24px_rgba(32,39,52,0.055)]">
      <Icon className="size-5 text-primary" aria-hidden />
      <p className="mt-3 text-2xl font-black text-brand-brown">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-white p-2.5 shadow-sm">
      <Icon className="size-3.5 text-accent" aria-hidden />
      <p className="mt-1 text-base font-black text-brand-brown">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function TrustDial({ score }: { score: number }) {
  const roundedScore = Math.max(0, Math.min(100, Math.round(score)));

  return (
    <div
      className="grid size-14 shrink-0 place-items-center rounded-full"
      style={{
        background: `conic-gradient(var(--primary) ${roundedScore * 3.6}deg, #e3e8dd 0)`,
      }}
      aria-label={`Güven skoru ${roundedScore}`}
    >
      <div className="grid size-11 place-items-center rounded-full bg-white text-center">
        <span className="text-sm font-black text-primary">{roundedScore}</span>
      </div>
    </div>
  );
}

function ChatBubble({
  mine,
  children,
}: {
  mine?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6 shadow-sm",
          mine
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-white",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2 text-sm font-semibold" htmlFor={htmlFor}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Toast({
  toast,
  onClose,
}: {
  toast: NonNullable<ToastState>;
  onClose: () => void;
}) {
  return (
    <div className="fixed bottom-5 right-5 z-50 w-[min(420px,calc(100vw-32px))] rounded-lg border border-border bg-white p-4 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 grid size-8 shrink-0 place-items-center rounded-md",
            toast.kind === "success" && "bg-emerald-100 text-emerald-700",
            toast.kind === "error" && "bg-red-100 text-red-700",
            toast.kind === "info" && "bg-sky-100 text-sky-700",
          )}
        >
          {toast.kind === "success" ? (
            <Check className="size-4" aria-hidden />
          ) : toast.kind === "error" ? (
            <AlertTriangle className="size-4" aria-hidden />
          ) : (
            <RefreshCw className="size-4" aria-hidden />
          )}
        </div>
        <p className="min-w-0 flex-1 text-sm font-semibold leading-6">
          {toast.message}
        </p>
        <Button variant="ghost" size="icon" onClick={onClose} title="Kapat">
          <X aria-hidden />
        </Button>
      </div>
    </div>
  );
}
