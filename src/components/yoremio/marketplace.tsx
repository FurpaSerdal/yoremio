"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Edit3,
  Eye,
  Filter,
  Heart,
  Home,
  ImagePlus,
  Inbox,
  LayoutDashboard,
  Leaf,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Package,
  PackagePlus,
  PenLine,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Star,
  Store,
  Tag,
  Trash2,
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
import {
  API_BASE_URL,
  ApiClientError,
  mediaUrl,
  yoremioApi,
  type AdminDashboardDto,
  type AppBootstrapDto,
  type CategoryDto,
  type ChatConversationDto,
  type ChatMessageDto,
  type CommentDto,
  type DashboardSummaryDto,
  type DemandDto,
  type FeaturedSellerDto,
  type LoginResponse,
  type NotificationDto,
  type Paginated,
  type ProductDto,
  type ProductFormValues,
  type RatingDto,
  type ReviewEligibilityDto,
  type SellerDashboardDto,
  type SellerProfileDto,
  type SellerTrustScoreDto,
  type SessionUser,
  type UserRole,
} from "@/lib/api";
import { cn, formatPrice, formatShortDate } from "@/lib/utils";

const PAGE_SIZE = 12;
const productPlaceholderImage = "/products/product-placeholder.svg";
const sessionKeys = {
  token: "yoremio-token",
  user: "yoremio-user",
} as const;

type Screen =
  | "home"
  | "discover"
  | "login"
  | "buyer-register"
  | "seller-register"
  | "verify"
  | "buyer"
  | "seller"
  | "seller-product"
  | "seller-profile"
  | "admin"
  | "reviews"
  | "states";

type AuthState = SessionUser & Pick<LoginResponse, "token">;
type AuthCompleteOptions = {
  silent?: boolean;
};
type ToastKind = "success" | "error" | "info";
type ToastState = {
  kind: ToastKind;
  message: string;
} | null;
type LoadState = "idle" | "loading" | "error";
type SortKey = string;
type ProductSubmitValues = ProductFormValues & {
  aktifMi?: boolean;
};
type ProductListMode = "grid" | "list";
type ReviewTab = "comments" | "ratings" | "description";
type ReviewItem = {
  name: string;
  date: string;
  rating: number;
  text: string;
  helpful: number;
};

const defaultProductSorts = [
  "newest",
  "price_asc",
  "price_desc",
  "top_rated",
  "most_reviewed",
  "most_favorited",
];

const sortLabels: Record<string, string> = {
  newest: "En yeniler",
  oldest: "En eskiler",
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

function apiErrorMessage(error: unknown) {
  return error instanceof ApiClientError
    ? error.message
    : "Beklenmeyen bir hata oluştu.";
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

function readStoredSessionToken() {
  return (
    window.localStorage.getItem(sessionKeys.token) ??
    window.sessionStorage.getItem(sessionKeys.token)
  );
}

function storeSession(login: LoginResponse, persistent: boolean) {
  const primary = persistent ? window.localStorage : window.sessionStorage;
  const secondary = persistent ? window.sessionStorage : window.localStorage;

  primary.setItem(sessionKeys.token, login.token);
  primary.setItem(sessionKeys.user, JSON.stringify(login));
  secondary.removeItem(sessionKeys.token);
  secondary.removeItem(sessionKeys.user);
}

function clearStoredSession() {
  [window.localStorage, window.sessionStorage].forEach((storage) => {
    storage.removeItem(sessionKeys.token);
    storage.removeItem(sessionKeys.user);
  });
}

function mediaImageSrc(path?: string | null) {
  const image = path?.trim();
  if (!image) return productPlaceholderImage;
  if (image.startsWith("/products/")) return image;
  return mediaUrl(image) || productPlaceholderImage;
}

function productImage(product: ProductDto) {
  return mediaImageSrc(product.resimler?.[0]?.url);
}

function demandImage(demand: DemandDto) {
  return mediaImageSrc(demand.urunResimUrl);
}

function sellerCoverImage(seller: FeaturedSellerDto) {
  return mediaImageSrc(seller.kapakResimUrl);
}

function sellerName(product: ProductDto) {
  return product.saticiMagazaAdi ?? "Yöremio satıcısı";
}

function productLocation(product: ProductDto) {
  const parts = [product.saticiSehir, product.saticiIlce].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Konum belirtilmedi";
}

function accountName(authUser: AuthState | null, profile?: SellerProfileDto | null) {
  if (!authUser) return "Misafir";
  if (hasRole(authUser, "SATICI")) return profile?.magazaAdi || "Satıcı hesabı";
  return authUser.userName && !authUser.userName.includes("@")
    ? authUser.userName
    : authUser.email;
}

function dashboardScreenFor(authUser: AuthState | null): Screen {
  if (!authUser) return "login";
  if (hasRole(authUser, "ADMIN")) return "admin";
  if (hasRole(authUser, "SATICI")) return "seller";
  return "buyer";
}

function buyerScreenFor(authUser: AuthState | null): Screen {
  if (hasRole(authUser, "ALICI")) return "buyer";
  return authUser ? dashboardScreenFor(authUser) : "login";
}

function shortDate(value?: string | null) {
  if (!value) return "";
  try {
    return formatShortDate(value);
  } catch {
    return value;
  }
}


export function YoremioMarketplace() {
  const [screen, setScreen] = useState<Screen>("home");
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<number | "all">("all");
  const [cityFilter, setCityFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [authUser, setAuthUser] = useState<AuthState | null>(null);
  const [bootstrap, setBootstrap] = useState<AppBootstrapDto | null>(null);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [productsPage, setProductsPage] = useState<Paginated<ProductDto>>(
    emptyProductsResult(),
  );
  const [marketState, setMarketState] = useState<LoadState>("idle");
  const [marketError, setMarketError] = useState<string | null>(null);
  const [activeProductId, setActiveProductId] = useState<number | null>(null);
  const [productDetail, setProductDetail] = useState<ProductDto | null>(null);
  const [productDraftSource, setProductDraftSource] = useState<ProductDto | null>(null);
  const [trustScore, setTrustScore] = useState<SellerTrustScoreDto | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [favoriteProducts, setFavoriteProducts] = useState<ProductDto[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<ProductDto[]>([]);
  const [featuredSellers, setFeaturedSellers] = useState<FeaturedSellerDto[]>([]);
  const [buyerDemands, setBuyerDemands] = useState<DemandDto[]>([]);
  const [sellerProfile, setSellerProfile] = useState<SellerProfileDto | null>(null);
  const [sellerProducts, setSellerProducts] = useState<ProductDto[]>([]);
  const [sellerDemands, setSellerDemands] = useState<DemandDto[]>([]);
  const [dashboardSummary, setDashboardSummary] =
    useState<DashboardSummaryDto | null>(null);
  const [sellerDashboard, setSellerDashboard] =
    useState<SellerDashboardDto | null>(null);
  const [adminDashboard, setAdminDashboard] = useState<AdminDashboardDto | null>(null);
  const [conversations, setConversations] = useState<ChatConversationDto[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessageDto[]>([]);
  const [chatTargetId, setChatTargetId] = useState("");
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const productSorts = bootstrap?.productSorts?.length
    ? bootstrap.productSorts
    : defaultProductSorts;

  const visibleProducts = productsPage.items;
  const visibleCategories = categories;
  const visibleSellers = featuredSellers;
  const visibleFavoriteProducts = favoriteProducts;
  const visibleRecommendedProducts = recommendedProducts;
  const visibleBuyerDemands = buyerDemands;
  const visibleSellerProducts = sellerProducts;
  const visibleSellerDemands = sellerDemands;
  const visibleConversations = conversations;
  const visibleMessages = chatMessages;

  const selectedProduct =
    productDetail ??
    visibleProducts.find((product) => product.id === activeProductId) ??
    visibleProducts[0] ??
    null;

  const selectedCategory =
    categoryId === "all"
      ? undefined
      : visibleCategories.find((category) => category.id === categoryId);
  const editingSellerProduct =
    activeProductId === null
      ? null
      : visibleSellerProducts.find((product) => product.id === activeProductId) ?? null;

  const navigate = useCallback((nextScreen: Screen) => {
    setScreen(nextScreen);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 10);
  }, []);

  const showToast = useCallback((message: string, kind: ToastKind) => {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const clearSession = useCallback(() => {
    clearStoredSession();
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
    setNotificationUnreadCount(0);
    setChatTargetId("");
    showToast("Oturum kapatıldı.", "info");
    navigate("home");
  }, [navigate, showToast]);

  const handleAuthenticated = useCallback(
    (user: AuthState, options?: AuthCompleteOptions) => {
      setAuthUser(user);
      if (options?.silent) return;

      showToast("Giriş başarılı.", "success");
      if (hasRole(user, "SATICI")) navigate("seller");
      else if (hasRole(user, "ADMIN")) navigate("admin");
      else navigate("buyer");
    },
    [navigate, showToast],
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

      yoremioApi
        .unreadNotificationCount(authUser.token)
        .then(setNotificationUnreadCount)
        .catch(() => setNotificationUnreadCount(0));

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
      if (error instanceof ApiClientError && error.status === 401) {
        clearSession();
        return;
      }
      showToast(apiErrorMessage(error), "error");
    }
  }, [authUser, clearSession, showToast]);

  useEffect(() => {
    const token = readStoredSessionToken();
    if (!token) return;

    let ignore = false;

    yoremioApi
      .me(token)
      .then((user) => {
        if (!ignore) setAuthUser({ ...user, token });
      })
      .catch(() => {
        if (!ignore) {
          clearStoredSession();
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

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
        if (ignore) return;
        try {
          const nextCategories = await yoremioApi.categories();
          if (!ignore) setCategories(nextCategories);
        } catch {
          if (!ignore) setCategories([]);
        }
        setMarketError(apiErrorMessage(error));
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    yoremioApi
      .featuredSellers(6)
      .then((sellers) => {
        if (!ignore) setFeaturedSellers(sellers);
      })
      .catch(() => {
        if (!ignore) setFeaturedSellers([]);
      });

    return () => {
      ignore = true;
    };
  }, []);

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
        setActiveProductId((current) =>
          normalizedPage.items.some((product) => product.id === current)
            ? current
            : normalizedPage.items[0]?.id ?? null,
        );
      })
      .catch((error) => {
        if (ignore) return;
        setProductsPage(emptyProductsResult(page));
        setMarketState("error");
        setMarketError(apiErrorMessage(error));
        setActiveProductId(null);
      });

    return () => {
      ignore = true;
    };
  }, [categoryId, cityFilter, inStockOnly, maxPrice, minPrice, minRating, page, query, sort]);

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
  }, [selectedProduct?.id, selectedProduct?.saticiId]);

  useEffect(() => {
    void refreshRoleData();
  }, [refreshRoleData]);

  useEffect(() => {
    if (!chatTargetId && conversations[0]) {
      setChatTargetId(conversations[0].userId);
    }
  }, [chatTargetId, conversations]);

  useEffect(() => {
    if (!authUser || !chatTargetId) {
      setChatMessages([]);
      return;
    }

    let ignore = false;
    yoremioApi
      .messages(authUser.token, chatTargetId)
      .then((pageResult) => {
        if (ignore) return;
        setChatMessages(pageResult.items);
        yoremioApi
          .markConversationRead(authUser.token, chatTargetId)
          .then(() => {
            if (!ignore) {
              setConversations((current) =>
                current.map((conversation) =>
                  conversation.userId === chatTargetId
                    ? { ...conversation, unreadCount: 0 }
                    : conversation,
                ),
              );
            }
          })
          .catch(() => {
            // Read-state sync should never block the chat view.
          });
      })
      .catch((error) => {
        if (!ignore) showToast(apiErrorMessage(error), "error");
      });

    return () => {
      ignore = true;
    };
  }, [authUser, chatTargetId, showToast]);

  const selectProductById = useCallback(
    (productId: number, nextScreen: Screen = "discover") => {
      setActiveProductId(productId);
      setProductDetail(null);
      setProductDraftSource(null);
      navigate(nextScreen);
    },
    [navigate],
  );

  const selectProduct = useCallback(
    (product: ProductDto, nextScreen: Screen = "discover") => {
      selectProductById(product.id, nextScreen);
    },
    [selectProductById],
  );

  const requireRole = useCallback(
    (role: UserRole) => {
      if (!authUser || !hasRole(authUser, role)) {
        showToast(`${role === "SATICI" ? "Satıcı" : role === "ADMIN" ? "Admin" : "Alıcı"} girişi gerekli.`, "info");
        navigate("login");
        return false;
      }
      return true;
    },
    [authUser, navigate, showToast],
  );

  const toggleFavorite = useCallback(
    async (product: ProductDto) => {
      if (!requireRole("ALICI") || !authUser) return;

      const isFavorite = favoriteIds.has(product.id);
      setActionStatus(`favorite-${product.id}`);
      try {
        if (isFavorite) {
          await yoremioApi.removeFavorite(authUser.token, product.id);
          setFavoriteIds((current) => {
            const next = new Set(current);
            next.delete(product.id);
            return next;
          });
        } else {
          await yoremioApi.addFavorite(authUser.token, product.id);
          setFavoriteIds((current) => new Set(current).add(product.id));
        }
        await refreshRoleData();
      } catch (error) {
        showToast(apiErrorMessage(error), "error");
      } finally {
        setActionStatus(null);
      }
    },
    [authUser, favoriteIds, refreshRoleData, requireRole, showToast],
  );

  const createDemand = useCallback(
    async (product: ProductDto, amount = 1) => {
      if (!requireRole("ALICI") || !authUser) return;
      setActionStatus(`demand-${product.id}`);
      try {
        await yoremioApi.createDemand(
          authUser.token,
          product.id,
          amount,
          `${product.adi} için teklif almak istiyorum.`,
        );
        showToast("Talep oluşturuldu.", "success");
        await refreshRoleData();
        navigate("buyer");
      } catch (error) {
        showToast(apiErrorMessage(error), "error");
      } finally {
        setActionStatus(null);
      }
    },
    [authUser, navigate, refreshRoleData, requireRole, showToast],
  );

  const startNewProduct = useCallback(() => {
    setActiveProductId(null);
    setProductDetail(null);
    setProductDraftSource(null);
    navigate("seller-product");
  }, [navigate]);

  const duplicateProduct = useCallback(
    (product: ProductDto) => {
      setActiveProductId(null);
      setProductDetail(null);
      setProductDraftSource(product);
      navigate("seller-product");
      showToast("Urun kopyasi forma tasindi.", "info");
    },
    [navigate, showToast],
  );

  const sendChatMessage = useCallback(
    async (receiverId: string, message: string) => {
      if (!authUser) {
        navigate("login");
        return;
      }
      if (!receiverId) {
        showToast("Canlı mesaj için gerçek satıcı seçilmeli.", "info");
        return;
      }
      setActionStatus("chat-send");
      try {
        const sent = await yoremioApi.sendMessage(authUser.token, receiverId, message);
        setChatMessages((current) => [...current, sent]);
        await refreshRoleData();
      } catch (error) {
        showToast(apiErrorMessage(error), "error");
      } finally {
        setActionStatus(null);
      }
    },
    [authUser, navigate, refreshRoleData, showToast],
  );

  const handleProductSave = useCallback(
    async (values: ProductSubmitValues, urunId?: number) => {
      if (!requireRole("SATICI") || !authUser) return;
      setActionStatus("product-save");
      try {
        const savedProduct = await yoremioApi.upsertProduct(authUser.token, values, urunId);
        if (
          values.aktifMi !== undefined &&
          savedProduct.aktifMi !== values.aktifMi
        ) {
          await yoremioApi.updateProductStatus(
            authUser.token,
            savedProduct.id,
            values.aktifMi,
          );
        }
        setProductDraftSource(null);
        showToast("Ürün kaydedildi.", "success");
        await refreshRoleData();
        navigate("seller");
      } catch (error) {
        showToast(apiErrorMessage(error), "error");
      } finally {
        setActionStatus(null);
      }
    },
    [authUser, navigate, refreshRoleData, requireRole, showToast],
  );

  const handleProductDelete = useCallback(
    async (product: ProductDto) => {
      if (!requireRole("SATICI") || !authUser) return;
      if (!window.confirm("Urunu silmek istiyor musun?")) return;

      setActionStatus(`product-delete-${product.id}`);
      try {
        await yoremioApi.deleteProduct(authUser.token, product.id);
        setSellerProducts((current) =>
          current.filter((item) => item.id !== product.id),
        );
        if (activeProductId === product.id) {
          setActiveProductId(null);
          setProductDetail(null);
        }
        showToast("Urun silindi.", "success");
        await refreshRoleData();
      } catch (error) {
        showToast(apiErrorMessage(error), "error");
      } finally {
        setActionStatus(null);
      }
    },
    [activeProductId, authUser, refreshRoleData, requireRole, showToast],
  );

  const toggleProductStatus = useCallback(
    async (product: ProductDto) => {
      if (!requireRole("SATICI") || !authUser) return;

      const nextStatus = product.aktifMi === false;
      setActionStatus(`product-status-${product.id}`);
      try {
        const updatedProduct = await yoremioApi.updateProductStatus(authUser.token, product.id, nextStatus);
        setSellerProducts((current) =>
          current.map((item) => (item.id === product.id ? updatedProduct : item)),
        );
        if (activeProductId === product.id) setProductDetail(updatedProduct);
        showToast(nextStatus ? "Ürün aktif edildi." : "Ürün pasife alındı.", "success");
        await refreshRoleData();
      } catch (error) {
        showToast(apiErrorMessage(error), "error");
      } finally {
        setActionStatus(null);
      }
    },
    [activeProductId, authUser, refreshRoleData, requireRole, showToast],
  );

  const handleProductImageDelete = useCallback(
    async (urunId: number, resimId: number) => {
      if (!requireRole("SATICI") || !authUser) return;
      setActionStatus(`media-delete-image-${resimId}`);
      try {
        await yoremioApi.deleteProductImage(authUser.token, urunId, resimId);
        showToast("Gorsel silindi.", "success");
        await refreshRoleData();
      } catch (error) {
        showToast(apiErrorMessage(error), "error");
      } finally {
        setActionStatus(null);
      }
    },
    [authUser, refreshRoleData, requireRole, showToast],
  );

  const handleProductVideoDelete = useCallback(
    async (urunId: number, videoId: number) => {
      if (!requireRole("SATICI") || !authUser) return;
      setActionStatus(`media-delete-video-${videoId}`);
      try {
        await yoremioApi.deleteProductVideo(authUser.token, urunId, videoId);
        showToast("Video silindi.", "success");
        await refreshRoleData();
      } catch (error) {
        showToast(apiErrorMessage(error), "error");
      } finally {
        setActionStatus(null);
      }
    },
    [authUser, refreshRoleData, requireRole, showToast],
  );

  const acceptOffer = useCallback(
    async (offerId: number) => {
      if (!requireRole("ALICI") || !authUser) return;
      setActionStatus(`offer-${offerId}`);
      try {
        await yoremioApi.acceptOffer(authUser.token, offerId);
        showToast("Teklif kabul edildi.", "success");
        await refreshRoleData();
      } catch (error) {
        showToast(apiErrorMessage(error), "error");
      } finally {
        setActionStatus(null);
      }
    },
    [authUser, refreshRoleData, requireRole, showToast],
  );

  const handleCategorySave = useCallback(
    async (values: Omit<CategoryDto, "id">, id?: number) => {
      if (!requireRole("ADMIN") || !authUser) return;
      setActionStatus("category-save");
      try {
        if (id) await yoremioApi.updateCategory(authUser.token, id, values);
        else await yoremioApi.createCategory(authUser.token, values);
        const nextCategories = await yoremioApi.categories();
        setCategories(nextCategories);
        showToast("Kategori kaydedildi.", "success");
      } catch (error) {
        showToast(apiErrorMessage(error), "error");
      } finally {
        setActionStatus(null);
      }
    },
    [authUser, requireRole, showToast],
  );

  const handleCategoryDelete = useCallback(
    async (id: number) => {
      if (!requireRole("ADMIN") || !authUser) return;
      setActionStatus("category-save");
      try {
        await yoremioApi.deleteCategory(authUser.token, id);
        setCategories((current) => current.filter((category) => category.id !== id));
        showToast("Kategori silindi.", "success");
      } catch (error) {
        showToast(apiErrorMessage(error), "error");
      } finally {
        setActionStatus(null);
      }
    },
    [authUser, requireRole, showToast],
  );

  const appProps = {
    authUser,
    sellerProfile,
    notificationUnreadCount,
    query,
    setQuery,
    onNavigate: navigate,
    onLogout: clearSession,
  };

  let content: ReactNode;

  if (screen === "login") {
    content = (
      <LoginScreen
        bootstrap={bootstrap}
        onNavigate={navigate}
        onAuthenticated={handleAuthenticated}
        showToast={showToast}
      />
    );
  } else if (screen === "buyer-register") {
    content = (
      <BuyerRegisterScreen
        onNavigate={navigate}
        showToast={showToast}
        products={visibleProducts}
      />
    );
  } else if (screen === "seller-register") {
    content = (
      <SellerRegisterScreen
        onNavigate={navigate}
        showToast={showToast}
        products={visibleProducts}
      />
    );
  } else if (screen === "verify") {
    content = (
      <VerificationScreen
        bootstrap={bootstrap}
        onNavigate={navigate}
        showToast={showToast}
      />
    );
  } else if (screen === "discover") {
    content = (
      <DiscoveryScreen
        {...appProps}
        products={visibleProducts}
        productsPage={productsPage}
        categories={visibleCategories}
        selectedProduct={selectedProduct}
        selectedCategory={selectedCategory}
        marketState={marketState}
        marketError={marketError}
        categoryId={categoryId}
        cityFilter={cityFilter}
        minPrice={minPrice}
        maxPrice={maxPrice}
        minRating={minRating}
        inStockOnly={inStockOnly}
        sort={sort}
        page={page}
        productSorts={productSorts}
        favoriteIds={favoriteIds}
        trustScore={trustScore}
        actionStatus={actionStatus}
        onCategoryChange={setCategoryId}
        onCityChange={setCityFilter}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
        onMinRatingChange={setMinRating}
        onStockChange={setInStockOnly}
        onSortChange={setSort}
        onPageChange={setPage}
        onSelectProduct={selectProduct}
        onToggleFavorite={toggleFavorite}
        onCreateDemand={createDemand}
        onStartChat={(product) => {
          if (!requireRole("ALICI")) return;
          setChatTargetId(product.saticiId);
          navigate("buyer");
        }}
      />
    );
  } else if (screen === "buyer") {
    content = !hasRole(authUser, "ALICI") ? (
      <AccessRequiredScreen
        {...appProps}
        title="Alici paneli"
        description="Favoriler, talepler, teklifler ve mesajlar icin alici girisi gerekli."
        actionLabel="Giris yap"
        onAction={() => navigate("login")}
      />
    ) : (
      <BuyerDashboard
        {...appProps}
        products={visibleRecommendedProducts}
        favorites={visibleFavoriteProducts}
        demands={visibleBuyerDemands}
        conversations={visibleConversations}
        messages={visibleMessages}
        chatTargetId={chatTargetId}
        actionStatus={actionStatus}
        dashboardSummary={dashboardSummary}
        onSelectProduct={selectProduct}
        onChatTargetChange={setChatTargetId}
        onSendMessage={sendChatMessage}
        onAcceptOffer={acceptOffer}
      />
    );
  } else if (screen === "seller") {
    content = !hasRole(authUser, "SATICI") ? (
      <AccessRequiredScreen
        {...appProps}
        title="Satici paneli"
        description="Urun, talep ve magaza yonetimi icin satici girisi gerekli."
        actionLabel="Giris yap"
        onAction={() => navigate("login")}
      />
    ) : (
      <SellerDashboard
        {...appProps}
        profile={sellerProfile}
        products={visibleSellerProducts}
        demands={visibleSellerDemands}
        dashboard={sellerDashboard}
        onSelectProduct={selectProduct}
        onNewProduct={startNewProduct}
        onDuplicateProduct={duplicateProduct}
        onDeleteProduct={handleProductDelete}
        onToggleProductStatus={toggleProductStatus}
        actionStatus={actionStatus}
      />
    );
  } else if (screen === "seller-product") {
    content = !hasRole(authUser, "SATICI") ? (
      <AccessRequiredScreen
        {...appProps}
        title="Urun formu"
        description="Urun eklemek veya duzenlemek icin satici girisi gerekli."
        actionLabel="Giris yap"
        onAction={() => navigate("login")}
      />
    ) : (
        <SellerProductScreen
          {...appProps}
          categories={visibleCategories}
          editingProduct={editingSellerProduct}
        draftProduct={productDraftSource}
        actionStatus={actionStatus}
        onSave={handleProductSave}
        onDeleteImage={handleProductImageDelete}
        onDeleteVideo={handleProductVideoDelete}
      />
    );
  } else if (screen === "seller-profile") {
    content = !hasRole(authUser, "SATICI") ? (
      <AccessRequiredScreen
        {...appProps}
        title="Magaza profili"
        description="Magaza profilini yonetmek icin satici girisi gerekli."
        actionLabel="Giris yap"
        onAction={() => navigate("login")}
      />
    ) : (
      <SellerProfileScreen
        {...appProps}
        profile={sellerProfile}
        dashboard={sellerDashboard}
        trustScore={trustScore}
        showToast={showToast}
        refreshRoleData={refreshRoleData}
      />
    );
  } else if (screen === "admin") {
    content = !hasRole(authUser, "ADMIN") ? (
      <AccessRequiredScreen
        {...appProps}
        title="Admin paneli"
        description="Kategori ve sistem ozeti icin admin yetkisi gerekli."
        actionLabel="Giris yap"
        onAction={() => navigate("login")}
      />
    ) : (
      <AdminDashboard
        {...appProps}
        categories={visibleCategories}
        dashboard={adminDashboard}
        actionStatus={actionStatus}
        onCategorySave={handleCategorySave}
        onCategoryDelete={handleCategoryDelete}
      />
    );
  } else if (screen === "reviews") {
    content = (
      <ReviewsScreen
        {...appProps}
        product={selectedProduct ?? null}
        showToast={showToast}
      />
    );
  } else if (screen === "states") {
    content = (
      <GlobalStatesScreen
        {...appProps}
        showToast={showToast}
        refreshRoleData={refreshRoleData}
      />
    );
  } else {
    content = (
      <HomeScreen
        {...appProps}
        products={visibleProducts}
        categories={visibleCategories}
        sellers={visibleSellers}
        categoryId={categoryId}
        selectedCategory={selectedCategory}
        marketError={marketError}
        favoriteIds={favoriteIds}
        actionStatus={actionStatus}
        onCategoryChange={setCategoryId}
        onSelectProduct={selectProduct}
        onSelectProductId={selectProductById}
        onToggleFavorite={toggleFavorite}
      />
    );
  }

  return (
    <>
      {content}
      {toast ? <Toast toast={toast} onClose={() => setToast(null)} /> : null}
    </>
  );
}

function HomeScreen({
  authUser,
  sellerProfile,
  notificationUnreadCount,
  query,
  setQuery,
  onNavigate,
  onLogout,
  products,
  categories,
  sellers,
  categoryId,
  selectedCategory,
  marketError,
  favoriteIds,
  actionStatus,
  onCategoryChange,
  onSelectProduct,
  onSelectProductId,
  onToggleFavorite,
}: {
  authUser: AuthState | null;
  sellerProfile?: SellerProfileDto | null;
  notificationUnreadCount: number;
  query: string;
  setQuery: (value: string) => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  products: ProductDto[];
  categories: CategoryDto[];
  sellers: FeaturedSellerDto[];
  categoryId: number | "all";
  selectedCategory?: CategoryDto;
  marketError: string | null;
  favoriteIds: Set<number>;
  actionStatus: string | null;
  onCategoryChange: (value: number | "all") => void;
  onSelectProduct: (product: ProductDto, screen?: Screen) => void;
  onSelectProductId: (productId: number, screen?: Screen) => void;
  onToggleFavorite: (product: ProductDto) => void;
}) {
  return (
    <main className="min-h-screen bg-[#f7f9f5] text-foreground">
      <PublicHeader
        authUser={authUser}
        sellerProfile={sellerProfile}
        notificationUnreadCount={notificationUnreadCount}
        query={query}
        setQuery={setQuery}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <section className="relative border-b border-border bg-white">
        <div className="relative h-[320px] overflow-hidden sm:h-[390px] lg:h-[420px]">
          <Image
            src="/hero-market-1600.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,25,12,0.18),rgba(8,25,12,0.02)_38%,rgba(8,25,12,0.16))]" />
          <div className="absolute inset-0 grid place-items-center px-4 pb-12 text-center">
            <h1 className="font-serif text-5xl font-black leading-none text-white drop-shadow-[0_5px_20px_rgba(0,0,0,0.42)] sm:text-6xl lg:text-7xl">
              Yerel ürünler
            </h1>
          </div>
        </div>
        <div className="relative z-10 mx-auto -mt-14 max-w-5xl px-4 pb-8">
          <CategoryDock
            categories={categories}
            activeId={categoryId}
            selectedCategory={selectedCategory}
            onSelect={onCategoryChange}
          />
        </div>
      </section>

      <section className="mx-auto max-w-[1520px] px-4 py-7 sm:px-6 lg:px-8">
        {marketError ? (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            {marketError}
          </div>
        ) : null}

        {products.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {products.slice(0, 7).map((product) => (
              <HomeProductCard
                key={product.id}
                product={product}
                isFavorite={favoriteIds.has(product.id)}
                favoritePending={actionStatus === `favorite-${product.id}`}
                onSelect={() => onSelectProduct(product, "discover")}
                onToggleFavorite={() => onToggleFavorite(product)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Inbox}
            title="Urun yok"
            description="API urun dondurmedigi icin burada urun gosterilmiyor."
          />
        )}

        <FeaturedSellerRow sellers={sellers} products={products} onSelectProductId={onSelectProductId} />
        <PromiseBar />
      </section>
    </main>
  );
}

function PublicHeader({
  authUser,
  sellerProfile,
  notificationUnreadCount,
  query,
  setQuery,
  onNavigate,
  onLogout,
}: {
  authUser: AuthState | null;
  sellerProfile?: SellerProfileDto | null;
  notificationUnreadCount: number;
  query: string;
  setQuery: (value: string) => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}) {
  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onNavigate("discover");
  };
  const accountLabel = authUser ? accountName(authUser, sellerProfile) : "Hesap";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/96 backdrop-blur">
      <div className="grid min-h-20 grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={() => onNavigate("home")} className="min-w-0">
          <BrandLogo className="min-w-[170px]" />
        </button>

        <div className="hidden min-w-0 items-center gap-8 lg:flex">
          <nav className="flex shrink-0 items-center gap-8 text-base font-bold">
            <button className="text-red-600" type="button" onClick={() => onNavigate("discover")}>
              Ürünler
            </button>
            <button type="button" onClick={() => onNavigate("discover")}>
              Kategoriler
            </button>
            <button type="button" onClick={() => onNavigate("discover")}>
              Satıcılar
            </button>
          </nav>
          <form className="mx-auto w-full max-w-2xl" onSubmit={handleSearch}>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ara"
                className="h-12 rounded-lg pl-14 text-base"
              />
            </label>
          </form>
        </div>

        <div className="flex items-center justify-end gap-2">
          <IconButton
            label={accountLabel}
            icon={UserRound}
            onClick={() => onNavigate(dashboardScreenFor(authUser))}
          />
          <IconButton label="Favoriler" icon={Heart} onClick={() => onNavigate(buyerScreenFor(authUser))} />
          <IconButton
            label="Bildirimler"
            icon={Bell}
            badge={notificationUnreadCount}
            onClick={() => onNavigate(authUser ? "states" : "login")}
          />
          {authUser ? (
            <Button variant="ghost" size="icon" title="Çıkış yap" onClick={onLogout}>
              <LogOut aria-hidden />
            </Button>
          ) : (
            <Button variant="outline" className="hidden sm:inline-flex" onClick={() => onNavigate("login")}>
              Giriş
            </Button>
          )}
        </div>
      </div>
      <form className="border-t border-border px-4 py-3 lg:hidden" onSubmit={handleSearch}>
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ürün, kategori veya satıcı ara"
            className="pl-11"
          />
        </label>
      </form>
    </header>
  );
}

function CategoryDock({
  categories,
  activeId,
  selectedCategory,
  onSelect,
}: {
  categories: CategoryDto[];
  activeId: number | "all";
  selectedCategory?: CategoryDto;
  onSelect: (value: number | "all") => void;
}) {
  const icons = [Leaf, Package, Tag, Star, ShieldCheck, Store];

  return (
    <div className="rounded-lg border border-border bg-white px-4 py-4 shadow-[0_18px_42px_rgba(16,24,40,0.14)]">
      <div className="scroll-shelf flex gap-4 overflow-x-auto">
        <CategoryPill
          active={activeId === "all"}
          icon={Leaf}
          label="Tümü"
          onClick={() => onSelect("all")}
        />
        {categories.slice(0, 6).map((category, index) => (
          <CategoryPill
            key={category.id}
            active={activeId === category.id}
            icon={icons[index % icons.length]}
            label={category.adi}
            onClick={() => onSelect(category.id)}
          />
        ))}
      </div>
      {selectedCategory?.aciklama ? (
        <p className="mt-3 text-center text-sm font-medium text-muted-foreground">
          {selectedCategory.aciklama}
        </p>
      ) : null}
    </div>
  );
}

function CategoryPill({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-[126px] shrink-0 flex-col items-center gap-2 rounded-lg px-3 py-2 text-center transition hover:bg-secondary"
    >
      <span
        className={cn(
          "grid size-12 place-items-center rounded-full border",
          active
            ? "border-primary bg-secondary text-primary"
            : "border-border bg-[#f5f2eb] text-brand-brown",
        )}
      >
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="line-clamp-2 min-h-9 text-sm font-bold">{label}</span>
    </button>
  );
}

function HomeProductCard({
  product,
  isFavorite,
  favoritePending,
  onSelect,
  onToggleFavorite,
}: {
  product: ProductDto;
  isFavorite: boolean;
  favoritePending: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-border bg-white shadow-[0_8px_18px_rgba(16,24,40,0.08)]">
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="relative aspect-[1.08] overflow-hidden bg-muted">
          <Image
            src={productImage(product)}
            alt={product.adi}
            fill
            sizes="(min-width: 1280px) 14vw, (min-width: 768px) 25vw, 50vw"
            className="object-cover transition duration-300 hover:scale-[1.03]"
          />
        </div>
      </button>
      <div className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-2">
          <button type="button" onClick={onSelect} className="min-w-0 text-left">
            <h3 className="line-clamp-1 text-base font-bold">{product.adi}</h3>
            <p className="mt-1 text-lg font-black text-primary">
              {formatPrice(product.fiyat)}
            </p>
          </button>
          <button
            type="button"
            onClick={onToggleFavorite}
            disabled={favoritePending}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-white text-foreground shadow-sm disabled:cursor-wait disabled:opacity-75"
            title={isFavorite ? "Favoriden çıkar" : "Favoriye ekle"}
            aria-label={isFavorite ? "Favoriden çıkar" : "Favoriye ekle"}
          >
            {favoritePending ? (
              <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
            ) : (
              <Heart className={cn("size-4", isFavorite && "fill-red-600 text-red-600")} aria-hidden />
            )}
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
          <span>{product.ortalamaPuan.toFixed(1)}</span>
          <span className="text-muted-foreground">({product.toplamYorum})</span>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-md bg-secondary px-2 py-2 text-xs font-semibold text-secondary-foreground">
          <span className="truncate">{sellerName(product)}</span>
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{product.saticiSehir ?? "Yerel"}</span>
          </span>
        </div>
      </div>
    </article>
  );
}

function FeaturedSellerRow({
  sellers,
  products,
  onSelectProductId,
}: {
  sellers: FeaturedSellerDto[];
  products: ProductDto[];
  onSelectProductId: (productId: number, screen?: Screen) => void;
}) {
  if (sellers.length === 0) return null;

  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-black text-brand-brown">Öne çıkan satıcılar</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {sellers.slice(0, 4).map((seller) => {
          const product = products.find((item) => item.id === seller.vitrinUrunId)
            ?? products.find((item) => item.saticiId === seller.kullaniciId);
          const productId = seller.vitrinUrunId ?? product?.id;
          return (
            <button
              key={seller.kullaniciId}
              type="button"
              disabled={!productId}
              onClick={() => {
                if (productId) onSelectProductId(productId, "discover");
              }}
              className="relative min-h-[142px] overflow-hidden rounded-lg border border-border bg-ink text-left text-white shadow-[0_8px_22px_rgba(16,24,40,0.1)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Image
                src={sellerCoverImage(seller)}
                alt=""
                fill
                sizes="(min-width: 1280px) 25vw, 50vw"
                className="object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,20,12,0.82),rgba(8,20,12,0.28))]" />
              <div className="relative flex min-h-[142px] items-end gap-4 p-4">
                <span className="grid size-16 shrink-0 place-items-center rounded-full border-2 border-white/80 bg-white/20 text-lg font-black">
                  {seller.magazaAdi.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-lg font-black">{seller.magazaAdi}</p>
                  <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-white/82">
                    <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                    {seller.ortalamaPuan.toFixed(1)} ({seller.toplamYorum})
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-white/82">
                    <MapPin className="size-4" aria-hidden />
                    {[seller.sehir, seller.ilce].filter(Boolean).join(", ") || "Yerel"}
                  </p>
                  {seller.dogrulanmisSatici ? (
                    <Badge className="mt-2" variant="green">
                      <ShieldCheck className="size-3.5" aria-hidden />
                      Doğal üretim
                    </Badge>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PromiseBar() {
  const items = [
    { icon: Leaf, title: "Yerel üreticiden", text: "Ürün kaynağı görünür." },
    { icon: ShieldCheck, title: "Güvenli alışveriş", text: "Doğrulama sinyalleri." },
    { icon: MessageCircle, title: "Doğrudan iletişim", text: "Talep, teklif ve chat." },
    { icon: Heart, title: "Doğaya saygılı", text: "Bölgesel üretime destek." },
  ];

  return (
    <div className="mt-8 grid gap-4 rounded-lg border border-border bg-white px-5 py-4 shadow-[0_8px_20px_rgba(16,24,40,0.06)] sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.title} className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-full border border-emerald-100 bg-emerald-50 text-primary">
              <Icon className="size-6" aria-hidden />
            </span>
            <span>
              <span className="block font-black text-brand-brown">{item.title}</span>
              <span className="text-sm text-muted-foreground">{item.text}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DiscoveryScreen({
  authUser,
  sellerProfile,
  notificationUnreadCount,
  query,
  setQuery,
  onNavigate,
  onLogout,
  products,
  productsPage,
  categories,
  selectedProduct,
  selectedCategory,
  marketState,
  marketError,
  categoryId,
  cityFilter,
  minPrice,
  maxPrice,
  minRating,
  inStockOnly,
  sort,
  page,
  productSorts,
  favoriteIds,
  trustScore,
  actionStatus,
  onCategoryChange,
  onCityChange,
  onMinPriceChange,
  onMaxPriceChange,
  onMinRatingChange,
  onStockChange,
  onSortChange,
  onPageChange,
  onSelectProduct,
  onToggleFavorite,
  onCreateDemand,
  onStartChat,
}: {
  authUser: AuthState | null;
  sellerProfile?: SellerProfileDto | null;
  notificationUnreadCount: number;
  query: string;
  setQuery: (value: string) => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  products: ProductDto[];
  productsPage: Paginated<ProductDto>;
  categories: CategoryDto[];
  selectedProduct: ProductDto | null;
  selectedCategory?: CategoryDto;
  marketState: LoadState;
  marketError: string | null;
  categoryId: number | "all";
  cityFilter: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  inStockOnly: boolean;
  sort: string;
  page: number;
  productSorts: string[];
  favoriteIds: Set<number>;
  trustScore: SellerTrustScoreDto | null;
  actionStatus: string | null;
  onCategoryChange: (value: number | "all") => void;
  onCityChange: (value: string) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onMinRatingChange: (value: string) => void;
  onStockChange: (value: boolean) => void;
  onSortChange: (value: string) => void;
  onPageChange: (value: number) => void;
  onSelectProduct: (product: ProductDto, screen?: Screen) => void;
  onToggleFavorite: (product: ProductDto) => void;
  onCreateDemand: (product: ProductDto, amount?: number) => void;
  onStartChat: (product: ProductDto) => void;
}) {
  const [listMode, setListMode] = useState<ProductListMode>("grid");

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <main className="min-h-screen bg-white text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-white/96 backdrop-blur">
        <div className="grid min-h-[72px] grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6">
          <button type="button" onClick={() => onNavigate("home")}>
            <BrandLogo compact className="min-w-[170px]" />
          </button>
          <div className="hidden min-w-0 items-center gap-5 lg:flex">
            <Button onClick={() => onNavigate("discover")} className="h-12 px-7">
              <Leaf aria-hidden />
              Ürün keşfi
            </Button>
            <form className="w-full max-w-3xl" onSubmit={handleSearch}>
              <label className="relative block">
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ürün, kategori veya satıcı ara..."
                  className="h-12 rounded-lg pl-5 pr-12"
                />
                <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              </label>
            </form>
          </div>
          <div className="flex items-center justify-end gap-2">
            <HeaderTextButton icon={Heart} label="Favoriler" onClick={() => onNavigate(buyerScreenFor(authUser))} />
            <HeaderTextButton icon={MessageCircle} label="Mesajlar" onClick={() => onNavigate(buyerScreenFor(authUser))} />
            <IconButton
              icon={Bell}
              label="Bildirimler"
              badge={notificationUnreadCount}
              onClick={() => onNavigate(authUser ? "states" : "login")}
            />
            <AccountChip
              authUser={authUser}
              sellerProfile={sellerProfile}
              onLogin={() => onNavigate("login")}
              onLogout={onLogout}
            />
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-73px)] lg:grid-cols-[300px_minmax(0,1fr)_minmax(380px,43vw)]">
        <DiscoveryFilters
          categories={categories}
          categoryId={categoryId}
          cityFilter={cityFilter}
          minPrice={minPrice}
          maxPrice={maxPrice}
          minRating={minRating}
          inStockOnly={inStockOnly}
          onCategoryChange={onCategoryChange}
          onCityChange={onCityChange}
          onMinPriceChange={onMinPriceChange}
          onMaxPriceChange={onMaxPriceChange}
          onMinRatingChange={onMinRatingChange}
          onStockChange={onStockChange}
          onClear={() => {
            onCategoryChange("all");
            onCityChange("");
            onMinPriceChange("");
            onMaxPriceChange("");
            onMinRatingChange("");
            onStockChange(false);
          }}
        />

        <section className="min-w-0 border-r border-border bg-[#fbfcfa] p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">
                {productsPage.totalCount || products.length} ürün bulundu
              </p>
              {selectedCategory ? (
                <h1 className="mt-1 text-2xl font-black text-brand-brown">
                  {selectedCategory.adi}
                </h1>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sort}
                onChange={(event) => onSortChange(event.target.value)}
                className="h-10 rounded-md border border-input bg-white px-3 text-sm font-semibold outline-none"
              >
                {productSorts.map((item) => (
                  <option key={item} value={item}>
                    {sortLabels[item] ?? item}
                  </option>
                ))}
              </select>
              <Button
                variant={listMode === "grid" ? "secondary" : "outline"}
                size="icon"
                title="Grid"
                onClick={() => setListMode("grid")}
              >
                <LayoutDashboard aria-hidden />
              </Button>
              <Button
                variant={listMode === "list" ? "secondary" : "outline"}
                size="icon"
                title="Liste"
                onClick={() => setListMode("list")}
              >
                <Menu aria-hidden />
              </Button>
            </div>
          </div>

          {marketError ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              {marketError}
            </div>
          ) : null}

          {marketState === "loading" && productsPage.items.length === 0 ? (
            <div className="grid min-h-[28rem] place-items-center rounded-lg border border-dashed border-border bg-white">
              <div className="text-center text-sm font-semibold text-muted-foreground">
                <Loader2 className="mx-auto mb-3 size-6 animate-spin" aria-hidden />
                Ürünler yükleniyor
              </div>
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Urun bulunamadi"
              description="Filtreleri degistir veya backend urun kaydi ekle."
            />
          ) : (
            <div
              className={cn(
                "grid gap-4",
                listMode === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1",
              )}
            >
              {products.map((product) => (
                <DiscoveryProductCard
                  key={product.id}
                  product={product}
                  active={selectedProduct?.id === product.id}
                  isFavorite={favoriteIds.has(product.id)}
                  favoritePending={actionStatus === `favorite-${product.id}`}
                  onSelect={() => onSelectProduct(product, "discover")}
                  onToggleFavorite={() => onToggleFavorite(product)}
                />
              ))}
            </div>
          )}

          <PaginationBar page={page} totalPages={productsPage.totalPages} onPageChange={onPageChange} />
        </section>

        <aside className="min-w-0 bg-white p-4 sm:p-5">
          {selectedProduct ? (
            <ProductDetailPanel
              product={selectedProduct}
              trustScore={trustScore}
              actionStatus={actionStatus}
              isFavorite={favoriteIds.has(selectedProduct.id)}
              onToggleFavorite={() => onToggleFavorite(selectedProduct)}
              onCreateDemand={() => onCreateDemand(selectedProduct)}
              onStartChat={() => onStartChat(selectedProduct)}
              onReviews={() => onNavigate("reviews")}
            />
          ) : (
            <EmptyState
              icon={Inbox}
              title="Ürün seçilmedi"
              description="Liste içinden bir ürün seçtiğinde detay burada açılır."
            />
          )}
        </aside>
      </div>
    </main>
  );
}

function DiscoveryFilters({
  categories,
  categoryId,
  cityFilter,
  minPrice,
  maxPrice,
  minRating,
  inStockOnly,
  onCategoryChange,
  onCityChange,
  onMinPriceChange,
  onMaxPriceChange,
  onMinRatingChange,
  onStockChange,
  onClear,
}: {
  categories: CategoryDto[];
  categoryId: number | "all";
  cityFilter: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  inStockOnly: boolean;
  onCategoryChange: (value: number | "all") => void;
  onCityChange: (value: string) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onMinRatingChange: (value: string) => void;
  onStockChange: (value: boolean) => void;
  onClear: () => void;
}) {
  const hasActiveFilters =
    categoryId !== "all" ||
    Boolean(cityFilter.trim()) ||
    Boolean(minPrice) ||
    Boolean(maxPrice) ||
    Boolean(minRating) ||
    inStockOnly;

  return (
    <aside className="border-r border-border bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-lg font-black">Filtreler</h2>
        <Filter className="size-5 text-muted-foreground" aria-hidden />
      </div>

      <FilterGroup title="Kategori">
        <FilterButton active={categoryId === "all"} onClick={() => onCategoryChange("all")}>
          Tüm Kategoriler
        </FilterButton>
        {categories.map((category) => (
          <FilterButton
            key={category.id}
            active={categoryId === category.id}
            onClick={() => onCategoryChange(category.id)}
          >
            {category.adi}
          </FilterButton>
        ))}
      </FilterGroup>

      <FilterGroup title="Şehir">
        <Input
          value={cityFilter}
          onChange={(event) => onCityChange(event.target.value)}
          placeholder="Şehir seçin"
        />
      </FilterGroup>

      <FilterGroup title="Fiyat">
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            min={0}
            value={minPrice}
            onChange={(event) => onMinPriceChange(event.target.value)}
            placeholder="Min"
          />
          <Input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(event) => onMaxPriceChange(event.target.value)}
            placeholder="Max"
          />
        </div>
      </FilterGroup>

      <FilterGroup title="Stokta var">
        <button
          type="button"
          onClick={() => onStockChange(!inStockOnly)}
          aria-pressed={inStockOnly}
          className="flex w-full items-center justify-between rounded-md border border-border bg-white px-3 py-2 text-sm font-bold"
        >
          Sadece stokta olanlar
          <span
            className={cn(
              "relative h-6 w-11 rounded-full transition",
              inStockOnly ? "bg-primary" : "bg-slate-300",
            )}
          >
            <span
              className={cn(
                "absolute top-1 size-4 rounded-full bg-white transition",
                inStockOnly ? "left-6" : "left-1",
              )}
            />
          </span>
        </button>
      </FilterGroup>

      <FilterGroup title="Puan">
        {[5, 4, 3, 2].map((rating) => (
          <FilterButton
            key={rating}
            active={minRating === String(rating)}
            onClick={() => onMinRatingChange(minRating === String(rating) ? "" : String(rating))}
          >
            <span className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={cn(
                    "size-4",
                    index < rating ? "fill-amber-400 text-amber-400" : "text-slate-300",
                  )}
                  aria-hidden
                />
              ))}
              ve üzeri
            </span>
          </FilterButton>
        ))}
      </FilterGroup>

      <Button type="button" variant="outline" className="mt-5 w-full" disabled={!hasActiveFilters} onClick={onClear}>
        Filtreleri temizle
      </Button>
    </aside>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-border py-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-black">{title}</h3>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-semibold transition",
        active ? "bg-secondary text-primary" : "hover:bg-muted",
      )}
    >
      <span
        className={cn(
          "size-2.5 rounded-full border",
          active ? "border-primary bg-primary" : "border-slate-300 bg-white",
        )}
      />
      {children}
    </button>
  );
}

function DiscoveryProductCard({
  product,
  active,
  isFavorite,
  favoritePending,
  onSelect,
  onToggleFavorite,
}: {
  product: ProductDto;
  active: boolean;
  isFavorite: boolean;
  favoritePending: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-lg border bg-white shadow-[0_8px_18px_rgba(16,24,40,0.06)] transition",
        active ? "border-primary ring-2 ring-primary/10" : "border-border hover:border-primary/35",
      )}
    >
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="relative aspect-[1.08] overflow-hidden bg-muted">
          <Image
            src={productImage(product)}
            alt={product.adi}
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 33vw, 100vw"
            className="object-cover"
          />
          <Badge className="absolute left-3 top-3" variant="green">
            Yeni
          </Badge>
        </div>
      </button>
      <div className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-2">
          <button type="button" onClick={onSelect} className="min-w-0 text-left">
            <h3 className="line-clamp-1 text-base font-black">{product.adi}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{product.kategoriAdi ?? "Yerel ürün"}</p>
          </button>
          <button
            type="button"
            onClick={onToggleFavorite}
            disabled={favoritePending}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-white shadow-sm disabled:cursor-wait disabled:opacity-75"
            title={isFavorite ? "Favoriden çıkar" : "Favoriye ekle"}
            aria-label={isFavorite ? "Favoriden çıkar" : "Favoriye ekle"}
          >
            {favoritePending ? (
              <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
            ) : (
              <Heart className={cn("size-4", isFavorite && "fill-red-600 text-red-600")} aria-hidden />
            )}
          </button>
        </div>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-4" aria-hidden />
          {productLocation(product)}
        </p>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-xs font-bold">
            <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
            {product.ortalamaPuan.toFixed(1)} ({product.toplamYorum})
          </span>
          <span className="text-lg font-black text-primary">{formatPrice(product.fiyat)}</span>
        </div>
      </div>
    </article>
  );
}

function ProductDetailPanel({
  product,
  trustScore,
  isFavorite,
  actionStatus,
  onToggleFavorite,
  onCreateDemand,
  onStartChat,
  onReviews,
}: {
  product: ProductDto;
  trustScore: SellerTrustScoreDto | null;
  isFavorite: boolean;
  actionStatus: string | null;
  onToggleFavorite: () => void;
  onCreateDemand: () => void;
  onStartChat: () => void;
  onReviews: () => void;
}) {
  const gallery = product.resimler.length > 0 ? product.resimler : [{ id: 0, url: productImage(product) }];
  const [galleryIndex, setGalleryIndex] = useState(0);
  const activeGalleryImage = gallery[galleryIndex] ?? gallery[0];
  const activeGallerySrc = mediaImageSrc(activeGalleryImage.url);
  const favoritePending = actionStatus === `favorite-${product.id}`;

  useEffect(() => {
    setGalleryIndex(0);
  }, [product.id]);

  return (
    <div className="sticky top-[92px] space-y-5">
      <div className="relative aspect-[1.44] overflow-hidden rounded-lg bg-muted">
        <Image
          src={activeGallerySrc}
          alt={product.adi}
          fill
          sizes="(min-width: 1024px) 42vw, 100vw"
          className="object-cover"
        />
        <Badge className="absolute left-4 top-4" variant="green">
          Yeni
        </Badge>
        <button
          type="button"
          onClick={onToggleFavorite}
          disabled={favoritePending}
          className="absolute right-4 top-4 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-black shadow-md disabled:cursor-wait disabled:opacity-80"
          title={isFavorite ? "Favoriden çıkar" : "Favoriye ekle"}
          aria-label={isFavorite ? "Favoriden çıkar" : "Favoriye ekle"}
        >
          {favoritePending ? (
            <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
          ) : (
            <Heart className={cn("size-4", isFavorite && "fill-red-600 text-red-600")} aria-hidden />
          )}
          {isFavorite ? "Favoride" : "Favori"}
        </button>
        <button
          className="absolute left-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white shadow disabled:opacity-45"
          type="button"
          disabled={gallery.length <= 1}
          onClick={() =>
            setGalleryIndex((current) =>
              current === 0 ? gallery.length - 1 : current - 1,
            )
          }
        >
          <ChevronLeft aria-hidden />
        </button>
        <button
          className="absolute right-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white shadow disabled:opacity-45"
          type="button"
          disabled={gallery.length <= 1}
          onClick={() =>
            setGalleryIndex((current) =>
              current === gallery.length - 1 ? 0 : current + 1,
            )
          }
        >
          <ChevronRight aria-hidden />
        </button>
      </div>
      <div className="scroll-shelf flex gap-3 overflow-x-auto">
        {gallery.slice(0, 6).map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setGalleryIndex(index)}
            className={cn(
              "relative size-16 shrink-0 overflow-hidden rounded-md border bg-muted",
              index === galleryIndex ? "border-primary" : "border-border",
            )}
          >
            <Image src={mediaImageSrc(image.url)} alt="" fill sizes="64px" className="object-cover" />
          </button>
        ))}
      </div>

      <div>
        <h1 className="text-3xl font-black tracking-normal">{product.adi}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {product.kategoriAdi ?? "Yerel ürün"} · {product.stokMiktari > 0 ? "Stokta var" : "Stok bekliyor"}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-3xl font-black text-primary">{formatPrice(product.fiyat)}</span>
          <Badge variant="green">{product.stokMiktari > 0 ? "Stokta var" : "Stok bekliyor"}</Badge>
        </div>
        <button type="button" onClick={onReviews} className="mt-3 flex items-center gap-2 text-sm font-bold">
          <Stars value={product.ortalamaPuan} />
          {product.ortalamaPuan.toFixed(1)} ({product.toplamYorum} değerlendirme)
        </button>
        <p className="mt-5 text-sm leading-7 text-muted-foreground">
          {product.aciklama || "Üretici açıklaması ürün detayında gösterilir."}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-white p-4 shadow-[0_8px_20px_rgba(16,24,40,0.06)]">
        <div className="flex items-center gap-4">
          <div className="relative size-16 overflow-hidden rounded-full border border-border bg-muted">
            <Image src={productImage(product)} alt="" fill sizes="64px" className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-black">{sellerName(product)}</p>
            {product.saticiDogrulanmis ? (
              <Badge className="mt-1" variant="green">
                <ShieldCheck className="size-3.5" aria-hidden />
                Doğrulanmış satıcı
              </Badge>
            ) : null}
            <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-4" aria-hidden />
              {productLocation(product)}
            </p>
          </div>
          <TrustDial score={trustScore?.guvenSkoru ?? (product.saticiDogrulanmis ? 88 : 62)} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button size="lg" className="bg-amber-500 text-white hover:bg-amber-600" onClick={onCreateDemand} disabled={actionStatus === `demand-${product.id}`}>
          {actionStatus === `demand-${product.id}` ? <Loader2 className="animate-spin" aria-hidden /> : <ClipboardList aria-hidden />}
          Talep oluştur
        </Button>
        <Button size="lg" className="bg-red-600 text-white hover:bg-red-700" onClick={onStartChat}>
          <MessageCircle aria-hidden />
          Satıcıya yaz
        </Button>
      </div>

      <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
        <MiniTrust icon={ShieldCheck} title="Güvenli alışveriş" text="Talep ve teklif akışı" />
        <MiniTrust icon={Leaf} title="Doğal içerik" text="Satıcı bilgisi görünür" />
        <MiniTrust icon={MessageCircle} title="Hızlı iletişim" text="Doğrudan mesajlaşma" />
      </div>
    </div>
  );
}

function MiniTrust({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full border border-emerald-100 bg-emerald-50 text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-black">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{text}</span>
      </span>
    </div>
  );
}

function LoginScreen({
  bootstrap,
  onNavigate,
  onAuthenticated,
  showToast,
}: {
  bootstrap: AppBootstrapDto | null;
  onNavigate: (screen: Screen) => void;
  onAuthenticated: (user: AuthState, options?: AuthCompleteOptions) => void;
  showToast: (message: string, kind: ToastKind) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    try {
      const login = await yoremioApi.login(email.trim(), password);
      storeSession(login, remember);

      const fullUser: AuthState = {
        token: login.token,
        userId: login.userId,
        email: login.email,
        userName: login.email,
        role: login.role,
        roles: login.roles,
        emailConfirmed: false,
      };

      onAuthenticated(fullUser);

      yoremioApi
        .me(login.token)
        .then((me) => onAuthenticated({ ...me, token: login.token }, { silent: true }))
        .catch(() => {
          // Session bootstrap will retry /me on the next load.
        });
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setStatus("idle");
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      showToast("Doğrulama mesajı için e-posta gir.", "info");
      return;
    }
    setStatus("loading");
    try {
      await yoremioApi.resendVerification(email.trim());
      showToast("Doğrulama mesajı yeniden gönderildi.", "success");
      onNavigate("verify");
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setStatus("idle");
    }
  };

  const devVerificationUrl =
    bootstrap?.features.devVerificationInboxEnabled &&
    bootstrap.verification.devVerificationInboxUrl
      ? `${API_BASE_URL}${bootstrap.verification.devVerificationInboxUrl}`
      : null;

  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-[calc(100vh-120px)] lg:grid-cols-[minmax(480px,48vw)_1fr]">
        <section className="flex items-center justify-center p-5 sm:p-8">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-[720px] rounded-lg border border-border bg-white px-7 py-9 shadow-[0_18px_50px_rgba(16,24,40,0.12)] sm:px-14"
          >
            <Button
              type="button"
              variant="ghost"
              className="mb-5 -ml-2"
              onClick={() => onNavigate("home")}
            >
              <Home aria-hidden />
              Ana sayfaya dön
            </Button>
            <button type="button" onClick={() => onNavigate("home")} className="mx-auto block">
              <BrandLogo className="justify-center" />
            </button>
            <h1 className="mt-8 text-center text-4xl font-black">Giriş yap</h1>

            <div className="mt-8 space-y-5">
              <Field label="E-posta" htmlFor="login-email">
                <InputIcon icon={Mail}>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="ornek@mail.com"
                    className="h-14 pl-14"
                    required
                  />
                </InputIcon>
              </Field>
              <Field label="Şifre" htmlFor="login-password">
                <InputIcon icon={LockKeyhole} rightIcon={Eye}>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="h-14 px-14"
                    required
                  />
                </InputIcon>
              </Field>
              <label className="flex items-center gap-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="size-5 accent-primary"
                />
                Beni hatırla
              </label>
              <Button className="h-14 w-full text-lg" disabled={status === "loading"}>
                {status === "loading" ? <Loader2 className="animate-spin" aria-hidden /> : null}
                Giriş
              </Button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Button type="button" variant="outline" className="h-14 text-base" onClick={() => onNavigate("buyer-register")}>
                <UserRound aria-hidden />
                Alıcı kaydı
              </Button>
              <Button type="button" variant="outline" className="h-14 border-amber-300 text-base text-amber-800" onClick={() => onNavigate("seller-register")}>
                <Store aria-hidden />
                Satıcı kaydı
              </Button>
            </div>
            <button
              type="button"
              onClick={handleResend}
              className="mx-auto mt-7 flex items-center gap-2 text-base font-bold text-primary"
            >
              <Mail className="size-5" aria-hidden />
              Doğrulama mesajını tekrar gönder
            </button>
            {devVerificationUrl ? (
              <a
                href={devVerificationUrl}
                className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-md border border-primary px-4 py-2 text-sm font-bold text-primary"
              >
                <CircleHelp className="size-4" aria-hidden />
                Dev doğrulama kutusu
              </a>
            ) : null}
          </form>
        </section>
        <section className="relative hidden min-h-full overflow-hidden lg:block">
          <Image src="/hero-market.png" alt="" fill priority sizes="52vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.12),rgba(255,255,255,0))]" />
        </section>
      </div>
      <PromiseBar />
    </main>
  );
}

function BuyerRegisterScreen({
  onNavigate,
  showToast,
  products,
}: {
  onNavigate: (screen: Screen) => void;
  showToast: (message: string, kind: ToastKind) => void;
  products: ProductDto[];
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirm) {
      showToast("Şifreler eşleşmiyor.", "error");
      return;
    }
    if (!accepted) {
      showToast("Koşulları kabul etmelisin.", "info");
      return;
    }
    setStatus("loading");
    try {
      await yoremioApi.registerBuyer({ email: email.trim(), password });
      showToast("Alıcı kaydı oluşturuldu. Doğrulama adımına geçebilirsin.", "success");
      onNavigate("verify");
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <AuthLayout
      actionLabel="Giriş yap"
      onAction={() => onNavigate("login")}
      onHome={() => onNavigate("home")}
      side={
        <BuyerPreview products={products} />
      }
    >
      <form onSubmit={handleSubmit} className="w-full max-w-xl rounded-lg border border-border bg-white p-8 shadow-[0_18px_45px_rgba(16,24,40,0.08)]">
        <h1 className="text-center text-4xl font-black text-primary">Alıcı kaydı</h1>
        <p className="mt-2 text-center text-muted-foreground">Yöremio ailesine katıl, yerel lezzetleri keşfet.</p>
        <div className="mt-8 space-y-5">
          <Field label="E-posta" htmlFor="buyer-email">
            <InputIcon icon={Mail}>
              <Input id="buyer-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ornek@email.com" className="h-14 pl-14" required />
            </InputIcon>
          </Field>
          <Field label="Şifre" htmlFor="buyer-password">
            <InputIcon icon={LockKeyhole} rightIcon={Eye}>
              <Input id="buyer-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Şifrenizi girin" className="h-14 px-14" minLength={6} required />
            </InputIcon>
          </Field>
          <Field label="Şifre tekrar" htmlFor="buyer-confirm">
            <InputIcon icon={LockKeyhole} rightIcon={Eye}>
              <Input id="buyer-confirm" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Şifrenizi tekrar girin" className="h-14 px-14" minLength={6} required />
            </InputIcon>
          </Field>
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="size-5 accent-primary" />
            Koşulları kabul ediyorum
          </label>
          <Button className="h-14 w-full text-lg" disabled={status === "loading"}>
            {status === "loading" ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Kayıt ol
          </Button>
          <div className="flex items-center gap-4 text-center text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            Zaten hesabın var mı?
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button type="button" variant="outline" className="h-14 w-full text-lg" onClick={() => onNavigate("login")}>
            Giriş yap
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}

function SellerRegisterScreen({
  onNavigate,
  showToast,
  products,
}: {
  onNavigate: (screen: Screen) => void;
  showToast: (message: string, kind: ToastKind) => void;
  products: ProductDto[];
}) {
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [magazaAdi, setMagazaAdi] = useState("");
  const [vergiNo, setVergiNo] = useState("");
  const [adres, setAdres] = useState("");
  const [sehir, setSehir] = useState("");
  const [ilce, setIlce] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accepted) {
      showToast("Koşulları kabul etmelisin.", "info");
      return;
    }
    setStatus("loading");
    try {
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
      showToast("Satıcı kaydı oluşturuldu. Doğrulama tamamlanınca giriş yapabilirsin.", "success");
      onNavigate("verify");
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <AuthLayout
      actionLabel="Giriş yap"
      onAction={() => onNavigate("login")}
      onHome={() => onNavigate("home")}
      wide
      side={<SellerRegisterPreview products={products} />}
    >
      <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-5">
        <div>
          <h1 className="text-4xl font-black">Satıcı kaydı</h1>
          <p className="mt-2 text-muted-foreground">Yerel ürünlerini binlerce alıcıya ulaştır.</p>
        </div>
        <InputIcon icon={Mail}>
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ornek@mail.com" className="h-12 pl-12" required />
        </InputIcon>
        <InputIcon icon={Phone}>
          <Input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="+90 5XX XXX XX XX" className="h-12 pl-12" required />
        </InputIcon>
        <InputIcon icon={LockKeyhole} rightIcon={Eye}>
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="En az 8 karakter" className="h-12 px-12" minLength={8} required />
        </InputIcon>
        <InputIcon icon={Store}>
          <Input value={magazaAdi} onChange={(event) => setMagazaAdi(event.target.value)} placeholder="Mağaza adınızı girin" className="h-12 pl-12" required />
        </InputIcon>
        <Input value={vergiNo} onChange={(event) => setVergiNo(event.target.value)} placeholder="11 hane vergi numaranızı girin" className="h-12" required />
        <textarea value={adres} onChange={(event) => setAdres(event.target.value)} placeholder="Açık adresinizi girin" className="min-h-20 w-full rounded-md border border-input bg-white px-3 py-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/20" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input value={sehir} onChange={(event) => setSehir(event.target.value)} placeholder="Şehir seçin" className="h-12" />
          <Input value={ilce} onChange={(event) => setIlce(event.target.value)} placeholder="İlçe seçin" className="h-12" />
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5" aria-hidden />
            <div>
              <p className="font-black">Doğrulama gerekli</p>
              <p className="mt-1 text-sm leading-6">
                Kayıt sonrası e-posta ve telefon numaranı doğrulaman gerekir.
              </p>
            </div>
          </div>
        </div>
        <label className="flex items-start gap-3 text-sm font-semibold">
          <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-0.5 size-5 accent-primary" />
          Kayıt olarak kullanım koşulları ve gizlilik politikasını kabul etmiş olursunuz.
        </label>
        <Button className="h-14 w-full text-lg" disabled={status === "loading"}>
          {status === "loading" ? <Loader2 className="animate-spin" aria-hidden /> : null}
          Kayıt ol
        </Button>
      </form>
    </AuthLayout>
  );
}

function AuthLayout({
  children,
  side,
  actionLabel,
  onAction,
  onHome,
  wide = false,
}: {
  children: ReactNode;
  side: ReactNode;
  actionLabel: string;
  onAction: () => void;
  onHome: () => void;
  wide?: boolean;
}) {
  return (
    <main className="min-h-screen bg-white">
      <header className="flex min-h-[88px] items-center justify-between border-b border-border px-5 sm:px-8">
        <button type="button" onClick={onHome}>
          <BrandLogo />
        </button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onHome}>
            <Home aria-hidden />
            Ana sayfa
          </Button>
          <Button variant="outline" onClick={onAction}>
            <UserRound aria-hidden />
            {actionLabel}
          </Button>
        </div>
      </header>
      <div className={cn("grid min-h-[calc(100vh-89px)]", wide ? "lg:grid-cols-[42vw_1fr]" : "lg:grid-cols-[48vw_1fr]")}>
        <section className="relative flex items-center justify-center overflow-hidden p-5 sm:p-8">
          <DecorativeProduce side="left" />
          <div className="relative z-10 w-full">{children}</div>
        </section>
        <section className="relative hidden overflow-hidden border-l border-border bg-[#fbfaf7] p-8 lg:block">
          {side}
          <DecorativeProduce side="right" />
        </section>
      </div>
    </main>
  );
}

function DecorativeProduce({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-y-0 hidden w-44 opacity-90 sm:block",
        side === "left" ? "left-0" : "right-0",
      )}
    >
      <Image
        src={side === "left" ? "/products/photo-tarla-domatesi.jpg" : "/products/photo-kocbasi-nohut.jpg"}
        alt=""
        fill
        sizes="180px"
        className="object-cover opacity-20"
      />
    </div>
  );
}

function BuyerPreview({ products }: { products: ProductDto[] }) {
  return (
    <div className="relative z-10 mx-auto max-w-4xl pt-6">
      <h2 className="max-w-2xl text-3xl font-black leading-tight text-brand-brown">
        Yöremio ile yerel lezzetleri keşfet, üreticilerle doğrudan bağlan.
      </h2>
      <div className="mt-8 flex gap-10 border-b border-border text-lg font-bold">
        {[
          ["Favoriler", Heart],
          ["Talepler", ClipboardList],
          ["Mesajlar", MessageCircle],
          ["Puanla", Star],
        ].map(([label, Icon]) => (
          <span key={String(label)} className="flex items-center gap-2 border-b-2 border-primary pb-3 first:text-primary">
            <Icon className="size-5" aria-hidden />
            {String(label)}
          </span>
        ))}
      </div>
      {products.length > 0 ? (
        <div className="mt-5 grid grid-cols-5 gap-3 rounded-lg border border-border bg-white p-3 shadow-[0_16px_34px_rgba(16,24,40,0.08)]">
          {products.slice(0, 5).map((product) => (
            <MiniProduct key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-border bg-white p-5 text-sm font-semibold text-muted-foreground">
          API ürün döndürmediği için kayıt önizlemesinde ürün gösterilmiyor.
        </div>
      )}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <PreviewPanel title="Talepler">
          <p className="text-sm text-muted-foreground">Canlı talepler girişten sonra alıcı panelinde listelenir.</p>
        </PreviewPanel>
        <PreviewPanel title="Mesajlar">
          <p className="text-sm text-muted-foreground">Canlı mesajlar gerçek konuşma oluşunca görünür.</p>
        </PreviewPanel>
      </div>
    </div>
  );
}

function SellerRegisterPreview({ products }: { products: ProductDto[] }) {
  return (
    <div className="relative z-10 mx-auto max-w-5xl">
      <div className="rounded-lg border border-border bg-white p-5 shadow-[0_16px_38px_rgba(16,24,40,0.08)]">
        <h2 className="text-center text-2xl font-black text-primary">
          Yöremio ile satış yapmanız çok kolay
        </h2>
        <p className="mt-1 text-center text-muted-foreground">
          Mağazanızla neler yapabileceğinizi görün.
        </p>
        <div className="mt-5 grid overflow-hidden rounded-lg border border-border lg:grid-cols-[180px_1fr]">
          <div className="bg-[linear-gradient(160deg,#006b35,#003c2d)] p-5 text-white">
            <BrandLogo compact inverse />
            <div className="mt-7 space-y-2 text-sm font-bold">
              {["Ürünlerim", "Medya yükle", "Gelen talepler", "Teklifler", "Satıcıya yaz"].map((item, index) => (
                <div key={item} className={cn("rounded-md px-3 py-2", index === 0 && "bg-white/12")}>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-black">Ürünlerim</h3>
              <Button size="sm" type="button" disabled title="Kayıt sonrası ürün formu açılır">
                <Plus aria-hidden />
                Yeni ürün
              </Button>
            </div>
            {products.length > 0 ? (
              <div className="grid grid-cols-4 gap-3">
                {products.slice(0, 4).map((product) => (
                  <MiniProduct key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border bg-white p-4 text-sm text-muted-foreground">
                Kayıt sonrası ürünlerin burada görünür.
              </div>
            )}
            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              <PreviewPanel title="Gelen talepler">
                <p className="text-sm text-muted-foreground">Alıcı talepleri canlı veriden gelir.</p>
              </PreviewPanel>
              <PreviewPanel title="Teklifler">
                <p className="text-sm text-muted-foreground">Teklifler talep oluşunca görünür.</p>
              </PreviewPanel>
              <PreviewPanel title="Satıcıya yaz">
                <p className="text-sm text-muted-foreground">Mesajlar gerçek kullanıcılar arasında açılır.</p>
              </PreviewPanel>
            </div>
          </div>
        </div>
      </div>
      <PromiseBar />
    </div>
  );
}

function VerificationScreen({
  bootstrap,
  onNavigate,
  showToast,
}: {
  bootstrap: AppBootstrapDto | null;
  onNavigate: (screen: Screen) => void;
  showToast: (message: string, kind: ToastKind) => void;
}) {
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  const devVerificationUrl =
    bootstrap?.features.devVerificationInboxEnabled &&
    bootstrap.verification.devVerificationInboxUrl
      ? `${API_BASE_URL}${bootstrap.verification.devVerificationInboxUrl}`
      : null;

  const verify = async () => {
    setStatus("loading");
    try {
      await yoremioApi.confirmEmail(email.trim(), emailCode.trim());
      showToast("Doğrulama tamamlandı.", "success");
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setStatus("idle");
    }
  };

  const resend = async () => {
    if (!email.trim()) {
      showToast("Önce e-posta gir.", "info");
      return;
    }
    setStatus("loading");
    try {
      await yoremioApi.resendVerification(email.trim());
      showToast("Kod yeniden gönderildi.", "success");
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <main className="min-h-screen bg-[#fbfaf7]">
      <header className="flex min-h-[80px] items-center justify-between border-b border-border bg-white px-5 sm:px-8">
        <button type="button" onClick={() => onNavigate("home")}>
          <BrandLogo />
        </button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onNavigate("states")}
        >
          <CircleHelp aria-hidden />
          Yardıma ihtiyacın varsa
        </Button>
      </header>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-black">Hesabını doğrula</h1>
          <p className="mt-2 text-muted-foreground">
            Email adresine gönderilen kodu gir.
          </p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="overflow-hidden rounded-lg border border-border bg-white shadow-[0_12px_36px_rgba(16,24,40,0.08)]">
            <div className="border-b border-border">
              <div className="border-b-2 border-primary px-6 py-4 text-center font-black">
                <Mail className="mr-2 inline size-5 text-primary" aria-hidden />
                Email doğrulama
              </div>
            </div>
            <div>
              <VerificationColumn
                icon={Mail}
                title="Email doğrulama"
                description="Email adresine gönderilen 6 haneli kodu gir."
                contactLabel="E-posta"
                contactValue={email}
                onContactChange={setEmail}
                code={emailCode}
                onCodeChange={setEmailCode}
                onSubmit={verify}
                onResend={resend}
                disabled={status === "loading"}
              />
            </div>
          </div>
          <div className="space-y-4">
            <StatusBox kind="warning" title="Bekliyor" text="Email doğrulama kodu girilmeli." />
            <StatusBox kind="success" title="Email" text="Doğrulama tamamlanınca satıcı hesabı aktif olur." />
            <Card className="p-5">
              <ShieldCheck className="size-9 text-primary" aria-hidden />
              <h3 className="mt-4 font-black">Hesabını doğrulamak güvenliği artırır</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Doğrulanmış hesaplarla daha güvenli alışveriş deneyimi yaşarsın.
              </p>
              <Button className="mt-5 w-full" onClick={() => onNavigate("login")}>
                Giriş yap
              </Button>
            </Card>
          </div>
        </div>
        {devVerificationUrl ? (
          <div className="mt-8 flex justify-center">
            <a className="rounded-md border border-primary px-4 py-2 font-bold text-primary" href={devVerificationUrl}>
              Dev doğrulama kutusu
            </a>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function VerificationColumn({
  icon: Icon,
  title,
  description,
  contactLabel,
  contactValue,
  onContactChange,
  code,
  onCodeChange,
  onSubmit,
  onResend,
  disabled,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  contactLabel: string;
  contactValue: string;
  onContactChange: (value: string) => void;
  code: string;
  onCodeChange: (value: string) => void;
  onSubmit: () => void;
  onResend: () => void;
  disabled: boolean;
}) {
  const digits = code.padEnd(6, "-").slice(0, 6).split("");

  return (
    <div className="border-b border-border p-6 md:border-b-0 md:border-r md:last:border-r-0">
      <div className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full border border-emerald-200 bg-emerald-50 text-primary">
          <Icon className="size-8" aria-hidden />
        </span>
        <h2 className="mt-5 text-2xl font-black">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="mt-7 space-y-4">
        <Field label={contactLabel} htmlFor={`${title}-contact`}>
          <Input value={contactValue} onChange={(event) => onContactChange(event.target.value)} />
        </Field>
        <Field label="Kod" htmlFor={`${title}-code`}>
          <Input
            id={`${title}-code`}
            value={code}
            onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
            className="sr-only"
          />
          <label className="grid grid-cols-6 gap-2" htmlFor={`${title}-code`}>
            {digits.map((digit, index) => (
              <span key={index} className="grid h-12 place-items-center rounded-md border border-input bg-white text-xl font-black">
                {digit}
              </span>
            ))}
          </label>
        </Field>
        <p className="text-center text-sm text-muted-foreground">
          Kodun geçerlilik süresi: <span className="font-black text-primary">02:35</span>
        </p>
        <Button type="button" className="h-12 w-full" onClick={onSubmit} disabled={disabled || code.length < 6}>
          {disabled ? <Loader2 className="animate-spin" aria-hidden /> : null}
          Doğrula
        </Button>
        <button type="button" onClick={onResend} className="mx-auto block text-sm font-bold text-primary">
          Kod gelmedi mi? Tekrar gönder
        </button>
      </div>
    </div>
  );
}

function BuyerDashboard({
  authUser,
  sellerProfile,
  notificationUnreadCount,
  onNavigate,
  onLogout,
  products,
  favorites,
  demands,
  conversations,
  messages,
  chatTargetId,
  actionStatus,
  dashboardSummary,
  onSelectProduct,
  onChatTargetChange,
  onSendMessage,
  onAcceptOffer,
}: {
  authUser: AuthState | null;
  sellerProfile?: SellerProfileDto | null;
  notificationUnreadCount: number;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  products: ProductDto[];
  favorites: ProductDto[];
  demands: DemandDto[];
  conversations: ChatConversationDto[];
  messages: ChatMessageDto[];
  chatTargetId: string;
  actionStatus: string | null;
  dashboardSummary: DashboardSummaryDto | null;
  onSelectProduct: (product: ProductDto, screen?: Screen) => void;
  onChatTargetChange: (value: string) => void;
  onSendMessage: (receiverId: string, message: string) => void;
  onAcceptOffer: (offerId: number) => void;
}) {
  const displayName = authUser ? accountName(authUser, sellerProfile) : "Misafir";

  return (
    <DashboardFrame
      variant="light"
      title="Alıcı Paneli"
      subtitle={`Hoş geldiniz, ${displayName}`}
      authUser={authUser}
      sellerProfile={sellerProfile}
      notificationUnreadCount={notificationUnreadCount}
      onNavigate={onNavigate}
      onLogout={onLogout}
      navItems={[
        ["Alıcı Paneli", Home, "buyer"],
        ["Favoriler", Heart, "buyer"],
        ["Taleplerim", ClipboardList, "buyer"],
        ["Teklifler", Tag, "buyer"],
        ["Mesajlar", MessageCircle, "buyer"],
        ["Puanlar", Star, "reviews"],
        ["Hesap Ayarları", Settings, "states"],
      ]}
    >
      <section className="space-y-5">
        <PanelHeader title="Favoriler" action="Tumunu gor" onAction={() => onNavigate("discover")} />
        {favorites.length > 0 ? (
          <div className="scroll-shelf flex gap-3 overflow-x-auto pb-1">
            {favorites.slice(0, 8).map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => onSelectProduct(product, "discover")}
                className="w-40 shrink-0 overflow-hidden rounded-lg border border-border bg-white text-left shadow-sm"
              >
                <div className="relative aspect-square">
                  <Image src={productImage(product)} alt={product.adi} fill sizes="160px" className="object-cover" />
                  <span className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white text-red-600 shadow">
                    <Heart className="size-4 fill-current" aria-hidden />
                  </span>
                </div>
                <div className="space-y-1 p-3">
                  <p className="line-clamp-1 text-sm font-bold">{product.adi}</p>
                  <p className="text-xs text-muted-foreground">{product.kategoriAdi ?? "Yerel ürün"}</p>
                  <p className="text-right font-black text-primary">{formatPrice(product.fiyat)}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState icon={Heart} title="Favori yok" description="Beğendiğin ürünleri favoriye eklediğinde burada görünür." />
        )}

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1.35fr]">
          <Panel title="Taleplerim">
            <DemandTable demands={demands} />
          </Panel>
          <Panel title="Teklifler">
            <OfferCards demands={demands} actionStatus={actionStatus} onAcceptOffer={onAcceptOffer} />
          </Panel>
          <Panel title="Mesajlar" badge={dashboardSummary?.unreadMessages ?? conversations.reduce((sum, item) => sum + item.unreadCount, 0)}>
            <ChatPanel
              conversations={conversations}
              messages={messages}
              targetId={chatTargetId}
              actionStatus={actionStatus}
              onTargetChange={onChatTargetChange}
              onSendMessage={onSendMessage}
            />
          </Panel>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <Panel title="Kabul edilen teklif">
            <AcceptedOffer demands={demands} onNavigate={onNavigate} />
          </Panel>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-950">
            <ShieldCheck className="mb-2 size-5 text-primary" aria-hidden />
            Doğrulanmış satıcılar ve talep/teklif akışı ile güvenli alışveriş yapın.
          </div>
        </div>

        <Panel title="Önerilen ürünler">
          {products.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {products.map((product) => (
                <MiniProductButton key={product.id} product={product} onClick={() => onSelectProduct(product, "discover")} />
              ))}
            </div>
          ) : (
            <EmptyState icon={Package} title="Öneri yok" description="Backend önerilen ürün döndürdüğünde burada listelenir." />
          )}
        </Panel>
      </section>
    </DashboardFrame>
  );
}

function SellerDashboard({
  authUser,
  sellerProfile,
  notificationUnreadCount,
  onNavigate,
  onLogout,
  profile,
  products,
  demands,
  dashboard,
  onSelectProduct,
  onNewProduct,
  onDuplicateProduct,
  onDeleteProduct,
  onToggleProductStatus,
  actionStatus,
}: {
  authUser: AuthState | null;
  sellerProfile?: SellerProfileDto | null;
  notificationUnreadCount: number;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  profile: SellerProfileDto | null;
  products: ProductDto[];
  demands: DemandDto[];
  dashboard: SellerDashboardDto | null;
  onSelectProduct: (product: ProductDto, screen?: Screen) => void;
  onNewProduct: () => void;
  onDuplicateProduct: (product: ProductDto) => void;
  onDeleteProduct: (product: ProductDto) => void;
  onToggleProductStatus: (product: ProductDto) => void;
  actionStatus: string | null;
}) {
  const totalProducts = dashboard?.totalProducts ?? products.length;
  const activeProducts = dashboard?.activeProducts ?? products.filter((product) => product.aktifMi !== false).length;
  const openDemands = dashboard?.openDemands ?? demands.filter((demand) => demand.durum === "ACIK").length;
  const pendingOffers = dashboard?.pendingOffers ?? demands.reduce((sum, demand) => sum + demand.teklifler.filter((offer) => offer.durum === "BEKLEMEDE").length, 0);
  const agreedDemands = dashboard?.agreedDemands ?? demands.filter((demand) => demand.durum === "ANLASILDI").length;

  return (
    <DashboardFrame
      variant="dark"
      title="Satıcı Paneli"
      subtitle={`Mağaza: ${profile?.magazaAdi ?? "Profil bekleniyor"}`}
      authUser={authUser}
      sellerProfile={sellerProfile}
      notificationUnreadCount={notificationUnreadCount}
      onNavigate={onNavigate}
      onLogout={onLogout}
      navItems={[
        ["Satıcı Paneli", Home, "seller"],
        ["Ürünlerim", Package, "seller"],
        ["Yeni ürün", PackagePlus, "seller-product"],
        ["Gelen talepler", ClipboardList, "seller"],
        ["Teklifler", Tag, "seller"],
        ["Mağazam", Store, "seller-profile"],
        ["Raporlar", LayoutDashboard, "seller"],
        ["Ayarlar", Settings, "seller-profile"],
      ]}
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={Package} label="Toplam ürün" value={String(totalProducts)} helper={`${activeProducts} aktif`} />
            <MetricCard icon={ClipboardList} label="Anlaşılan talep" value={String(agreedDemands)} helper="Bu ay" />
            <MetricCard icon={Inbox} label="Gelen talepler" value={String(openDemands)} helper="Bekleyen" tone="amber" />
            <MetricCard icon={Tag} label="Teklifler" value={String(pendingOffers)} helper="Bekleyen" tone="lime" />
          </div>

          <Panel
            title="Ürünlerim"
            action="Yeni ürün"
            onAction={onNewProduct}
          >
            {products.length > 0 ? (
              <SellerProductTable
                products={products}
                actionStatus={actionStatus}
                onSelectProduct={onSelectProduct}
                onDuplicateProduct={onDuplicateProduct}
                onDeleteProduct={onDeleteProduct}
                onToggleProductStatus={onToggleProductStatus}
              />
            ) : (
              <EmptyState icon={PackagePlus} title="Ürün yok" description="İlk ürünü eklemek için Yeni ürün aksiyonunu kullan." />
            )}
          </Panel>

          <Panel title="Medya yükle">
            <div className="grid gap-3 md:grid-cols-[120px_repeat(4,1fr)_220px]">
              <button type="button" onClick={onNewProduct} className="grid min-h-28 place-items-center rounded-lg border border-dashed border-input bg-white text-center text-sm font-bold text-muted-foreground">
                <UploadCloud className="mb-2 size-6 text-primary" aria-hidden />
                Görsel ekle
              </button>
              {products.slice(0, 4).map((product) => (
                <div key={product.id} className="relative min-h-28 overflow-hidden rounded-lg border border-border">
                  <Image src={productImage(product)} alt={product.adi} fill sizes="140px" className="object-cover" />
                </div>
              ))}
              <div className="rounded-lg border border-dashed border-input p-4 text-sm text-muted-foreground">
                <p className="font-black text-foreground">Görsel yükleme ipuçları</p>
                <p className="mt-2">Net, sade arka planlı ve ürün odaklı görseller kullanın.</p>
              </div>
            </div>
          </Panel>
        </div>

        <aside className="space-y-5">
          <SellerProfileCard profile={profile} dashboard={dashboard} onNavigate={onNavigate} />
          <Panel title="Gelen talepler">
            {demands.length > 0 ? (
              <div className="space-y-3">
                {demands.slice(0, 4).map((demand) => (
                  <DemandMediaLine key={demand.id} demand={demand} />
                ))}
              </div>
            ) : (
              <EmptyState icon={Inbox} title="Talep yok" description="Alıcı talepleri geldiğinde burada görünecek." />
            )}
          </Panel>
        </aside>
      </div>
    </DashboardFrame>
  );
}

function SellerProductScreen({
  authUser,
  sellerProfile,
  notificationUnreadCount,
  onNavigate,
  onLogout,
  categories,
  editingProduct,
  draftProduct,
  actionStatus,
  onSave,
  onDeleteImage,
  onDeleteVideo,
}: {
  authUser: AuthState | null;
  sellerProfile?: SellerProfileDto | null;
  notificationUnreadCount: number;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  categories: CategoryDto[];
  editingProduct: ProductDto | null;
  draftProduct: ProductDto | null;
  actionStatus: string | null;
  onSave: (values: ProductSubmitValues, urunId?: number) => void;
  onDeleteImage: (urunId: number, resimId: number) => void;
  onDeleteVideo: (urunId: number, videoId: number) => void;
}) {
  const sourceProduct = editingProduct ?? draftProduct;
  const [adi, setAdi] = useState(sourceProduct?.adi ?? "");
  const [aciklama, setAciklama] = useState(sourceProduct?.aciklama ?? "");
  const [fiyat, setFiyat] = useState(sourceProduct ? String(sourceProduct.fiyat) : "");
  const [stok, setStok] = useState(sourceProduct ? String(sourceProduct.stokMiktari) : "");
  const [kategoriId, setKategoriId] = useState(sourceProduct?.kategoriId ?? categories[0]?.id ?? 0);
  const [active, setActive] = useState(sourceProduct?.aktifMi !== false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);

  useEffect(() => {
    setAdi(sourceProduct?.adi ?? "");
    setAciklama(sourceProduct?.aciklama ?? "");
    setFiyat(sourceProduct ? String(sourceProduct.fiyat) : "");
    setStok(sourceProduct ? String(sourceProduct.stokMiktari) : "");
    setKategoriId(sourceProduct?.kategoriId ?? categories[0]?.id ?? 0);
    setActive(sourceProduct?.aktifMi !== false);
    setImageFiles([]);
    setVideoFiles([]);
  }, [categories, sourceProduct]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!kategoriId) return;
    onSave({
      adi,
      aciklama,
      fiyat: Number(fiyat),
      stokMiktari: Number(stok),
      kategoriId,
      aktifMi: active,
      resimler: imageFiles,
      videolar: videoFiles,
    }, editingProduct?.id);
  };

  const previewProduct: ProductDto = {
    id: sourceProduct?.id ?? 0,
    adi,
    aciklama,
    fiyat: Number(fiyat) || 0,
    stokMiktari: Number(stok) || 0,
    kategoriId,
    kategoriAdi: categories.find((category) => category.id === kategoriId)?.adi ?? sourceProduct?.kategoriAdi,
    saticiId: authUser?.userId ?? sourceProduct?.saticiId ?? "",
    saticiMagazaAdi: sellerProfile?.magazaAdi ?? sourceProduct?.saticiMagazaAdi,
    saticiSehir: sellerProfile?.sehir ?? sourceProduct?.saticiSehir,
    saticiIlce: sellerProfile?.ilce ?? sourceProduct?.saticiIlce,
    saticiDogrulanmis: sellerProfile?.dogrulanmisSatici ?? sourceProduct?.saticiDogrulanmis ?? false,
    ortalamaPuan: sourceProduct?.ortalamaPuan ?? 0,
    toplamPuan: sourceProduct?.toplamPuan ?? 0,
    toplamYorum: sourceProduct?.toplamYorum ?? 0,
    toplamFavori: sourceProduct?.toplamFavori ?? 0,
    yorumlar: sourceProduct?.yorumlar ?? [],
    puanlar: sourceProduct?.puanlar ?? [],
    resimler: sourceProduct?.resimler ?? [],
    videolar: sourceProduct?.videolar ?? [],
    aktifMi: active,
  };

  return (
    <DashboardFrame
      variant="light"
      title="Satıcı Paneli"
      subtitle="Ürün formu ve medya yönetimi"
      authUser={authUser}
      sellerProfile={sellerProfile}
      notificationUnreadCount={notificationUnreadCount}
      onNavigate={onNavigate}
      onLogout={onLogout}
      navItems={[
        ["Ana Sayfa", Home, "seller"],
        ["Ürünlerim", Package, "seller"],
        ["Yeni ürün ekle", Plus, "seller-product"],
        ["Gelen talepler", ClipboardList, "seller"],
        ["Teklifler", Tag, "seller"],
        ["Mağazam", Store, "seller-profile"],
      ]}
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Card className="overflow-hidden">
          <form onSubmit={handleSubmit} className="grid lg:grid-cols-[0.75fr_1fr]">
            <div className="space-y-5 border-b border-border p-5 lg:border-b-0 lg:border-r">
              <h2 className="text-2xl font-black">Ürün formu</h2>
              <Field label="Ürün adı *" htmlFor="product-name">
                <Input id="product-name" value={adi} onChange={(event) => setAdi(event.target.value)} maxLength={50} required />
              </Field>
              <Field label="Açıklama *" htmlFor="product-desc">
                <textarea id="product-desc" value={aciklama} onChange={(event) => setAciklama(event.target.value)} maxLength={1000} className="min-h-36 w-full rounded-md border border-input px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/20" required />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Fiyat *" htmlFor="product-price">
                  <Input id="product-price" type="number" value={fiyat} onChange={(event) => setFiyat(event.target.value)} min={1} required />
                </Field>
                <Field label="Stok *" htmlFor="product-stock">
                  <Input id="product-stock" type="number" value={stok} onChange={(event) => setStok(event.target.value)} min={0} required />
                </Field>
              </div>
              <Field label="Kategori *" htmlFor="product-category">
                <select id="product-category" value={kategoriId} onChange={(event) => setKategoriId(Number(event.target.value))} className="h-11 w-full rounded-md border border-input bg-white px-3 text-sm font-semibold outline-none" disabled={categories.length === 0}>
                  {categories.length === 0 ? <option value={0}>Kategori yok</option> : null}
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.adi}
                    </option>
                  ))}
                </select>
              </Field>
              <div>
                <p className="mb-3 text-sm font-black">Durum *</p>
                <div className="flex gap-5">
                  <label className="flex items-center gap-2 text-sm font-bold">
                    <input type="radio" checked={active} onChange={() => setActive(true)} className="accent-primary" />
                    Aktif
                  </label>
                  <label className="flex items-center gap-2 text-sm font-bold">
                    <input type="radio" checked={!active} onChange={() => setActive(false)} className="accent-primary" />
                    Pasif
                  </label>
                </div>
              </div>
            </div>
            <div className="space-y-6 p-5">
              <MediaGrid
                title="Resimler"
                icon={ImagePlus}
                product={sourceProduct}
                files={imageFiles}
                onFilesChange={setImageFiles}
                onDelete={onDeleteImage}
                actionStatus={actionStatus}
              />
              <MediaGrid
                title="Videolar"
                icon={Video}
                product={sourceProduct}
                files={videoFiles}
                onFilesChange={setVideoFiles}
                onDelete={onDeleteVideo}
                actionStatus={actionStatus}
                video
              />
              <div className="flex gap-3 border-t border-border pt-5">
                <Button disabled={actionStatus === "product-save" || !kategoriId} className="min-w-40">
                  {actionStatus === "product-save" ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
                  Kaydet
                </Button>
                <Button type="button" variant="outline" onClick={() => onNavigate("seller")}>
                  Vazgeç
                </Button>
              </div>
            </div>
          </form>
        </Card>
        <Card className="p-5">
          <h2 className="text-2xl font-black">Önizleme</h2>
          <div className="relative mt-5 aspect-[1.1] overflow-hidden rounded-lg bg-muted">
            <Image src={productImage(previewProduct)} alt={previewProduct.adi} fill sizes="380px" className="object-cover" />
          </div>
          <h3 className="mt-5 text-2xl font-black">{previewProduct.adi}</h3>
          <p className="mt-2 text-3xl font-black text-primary">{formatPrice(previewProduct.fiyat)}</p>
          <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>{previewProduct.kategoriAdi}</span>
            <Badge variant={active ? "green" : "outline"}>{active ? "Aktif" : "Pasif"}</Badge>
          </div>
          <p className="mt-5 text-sm leading-7 text-muted-foreground">{previewProduct.aciklama}</p>
        </Card>
      </div>
    </DashboardFrame>
  );
}

function SellerProfileScreen({
  authUser,
  sellerProfile,
  notificationUnreadCount,
  onNavigate,
  onLogout,
  profile,
  dashboard,
  showToast,
  refreshRoleData,
}: {
  authUser: AuthState | null;
  sellerProfile?: SellerProfileDto | null;
  notificationUnreadCount: number;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  profile: SellerProfileDto | null;
  dashboard: SellerDashboardDto | null;
  trustScore: SellerTrustScoreDto | null;
  showToast: (message: string, kind: ToastKind) => void;
  refreshRoleData: () => Promise<void>;
}) {
  const [magazaAdi, setMagazaAdi] = useState(profile?.magazaAdi ?? "");
  const [adres, setAdres] = useState(profile?.adres ?? "");
  const [sehir, setSehir] = useState(profile?.sehir ?? "");
  const [ilce, setIlce] = useState(profile?.ilce ?? "");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber ?? "");
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  useEffect(() => {
    setMagazaAdi(profile?.magazaAdi ?? "");
    setAdres(profile?.adres ?? "");
    setSehir(profile?.sehir ?? "");
    setIlce(profile?.ilce ?? "");
    setPhoneNumber(profile?.phoneNumber ?? "");
  }, [profile]);

  const profileFieldValues = [
    profile?.magazaAdi,
    profile?.adres,
    profile?.sehir,
    profile?.ilce,
    profile?.phoneNumber,
    profile?.email,
    profile?.vergiNo,
  ];
  const completedProfileFields = profileFieldValues.filter((value) => Boolean(String(value ?? "").trim())).length;
  const profileCompletion = profileFieldValues.length > 0
    ? Math.round((completedProfileFields / profileFieldValues.length) * 100)
    : 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser || !hasRole(authUser, "SATICI")) {
      showToast("Satıcı profili için giriş gerekli.", "info");
      return;
    }
    setStatus("loading");
    try {
      await yoremioApi.updateSellerProfile(authUser.token, {
        magazaAdi,
        adres,
        sehir,
        ilce,
        phoneNumber,
      });
      showToast("Profil kaydedildi.", "success");
      await refreshRoleData();
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <DashboardFrame
      variant="dark"
      title="Satıcı Paneli"
      subtitle="Profil ve güven skoru"
      authUser={authUser}
      sellerProfile={sellerProfile}
      notificationUnreadCount={notificationUnreadCount}
      onNavigate={onNavigate}
      onLogout={onLogout}
      navItems={[
        ["Ana Sayfa", Home, "seller"],
        ["Ürünlerim", Package, "seller"],
        ["Gelen talepler", ClipboardList, "seller"],
        ["Teklifler", Tag, "seller"],
        ["Profil", UserRound, "seller-profile"],
        ["Ayarlar", Settings, "seller-profile"],
      ]}
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_560px]">
        <Card className="p-6">
          <h2 className="text-2xl font-black">Profil</h2>
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <ProfileRow label="Mağaza adı">
              <Input value={magazaAdi} onChange={(event) => setMagazaAdi(event.target.value)} />
            </ProfileRow>
            <ProfileRow label="Vergi no">
              <Input value={profile?.vergiNo ?? ""} disabled />
            </ProfileRow>
            <ProfileRow label="Adres">
              <textarea value={adres} onChange={(event) => setAdres(event.target.value)} className="min-h-28 w-full rounded-md border border-input px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/20" />
            </ProfileRow>
            <ProfileRow label="Şehir">
              <Input value={sehir} onChange={(event) => setSehir(event.target.value)} />
            </ProfileRow>
            <ProfileRow label="İlçe">
              <Input value={ilce} onChange={(event) => setIlce(event.target.value)} />
            </ProfileRow>
            <ProfileRow label="Telefon">
              <Input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
            </ProfileRow>
            <ProfileRow label="E-posta">
              <Input value={profile?.email ?? authUser?.email ?? ""} disabled />
            </ProfileRow>
            <ProfileRow label="Durum">
              <Badge variant={profile?.aktifMi ? "green" : "outline"}>
                {profile ? (profile.aktifMi ? "Aktif" : "Pasif") : "Profil bekleniyor"}
              </Badge>
            </ProfileRow>
            <Button disabled={status === "loading"}>
              {status === "loading" ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Kaydet
            </Button>
          </form>
        </Card>
        <div className="space-y-5">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-full bg-primary text-white">
                <Check aria-hidden />
              </span>
              <div>
                <h2 className="text-xl font-black">
                  {profile?.dogrulanmisSatici ? "Doğrulanmış satıcı" : "Doğrulama bekliyor"}
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Hesap durumu:{" "}
                  <Badge variant={profile?.aktifMi ? "green" : "outline"}>
                    {profile ? (profile.aktifMi ? "Aktif" : "Pasif") : "Profil bekleniyor"}
                  </Badge>
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="text-xl font-black">Güven skoru</h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-[160px_1fr]">
              <TrustDial large score={dashboard?.trustScore ?? 0} />
              <div className="space-y-5">
                <ProgressLine label="Profil tamamlama" value={profileCompletion} />
                <p className="text-sm font-semibold text-muted-foreground">
                  Tamamlanan alanlar {completedProfileFields} / {profileFieldValues.length}
                </p>
              </div>
            </div>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MiniMetric icon={Package} label="Ürün sayısı" value={String(dashboard?.totalProducts ?? 0)} />
            <MiniMetric icon={Check} label="Aktif ürün" value={String(dashboard?.activeProducts ?? 0)} />
            <MiniMetric icon={AlertCircle} label="Stokta yok" value={String(dashboard?.outOfStockProducts ?? 0)} tone="red" />
            <MiniMetric icon={Heart} label="Favori" value={String(dashboard?.totalFavorites ?? 0)} tone="red" />
            <MiniMetric icon={MessageCircle} label="Yorum" value={String(dashboard?.totalReviews ?? 0)} />
            <MiniMetric icon={Star} label="Puan" value={(dashboard?.averageRating ?? 0).toFixed(1)} tone="amber" />
          </div>
        </div>
      </div>
    </DashboardFrame>
  );
}

function AdminDashboard({
  authUser,
  sellerProfile,
  notificationUnreadCount,
  onNavigate,
  onLogout,
  categories,
  dashboard,
  actionStatus,
  onCategorySave,
  onCategoryDelete,
}: {
  authUser: AuthState | null;
  sellerProfile?: SellerProfileDto | null;
  notificationUnreadCount: number;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  categories: CategoryDto[];
  dashboard: AdminDashboardDto | null;
  actionStatus: string | null;
  onCategorySave: (values: Omit<CategoryDto, "id">, id?: number) => void;
  onCategoryDelete: (id: number) => void;
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "new">("new");

  return (
    <DashboardFrame
      variant="dark"
      title="Admin Paneli"
      subtitle="Kategori ve sistem özeti"
      authUser={authUser}
      sellerProfile={sellerProfile}
      notificationUnreadCount={notificationUnreadCount}
      onNavigate={onNavigate}
      onLogout={onLogout}
      navItems={[
        ["Admin Paneli", ShieldCheck, "admin"],
        ["Dashboard", Home, "admin"],
        ["Kategoriler", Package, "admin"],
        ["Durumlar", AlertCircle, "states"],
      ]}
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard icon={Users} label="Toplam kullanıcı" value={String(dashboard?.totalUsers ?? 0)} />
            <MetricCard icon={Store} label="Satıcı" value={String(dashboard?.totalSellers ?? 0)} />
            <MetricCard icon={UserRound} label="Alıcı" value={String(dashboard?.totalBuyers ?? 0)} />
            <MetricCard icon={Package} label="Ürün" value={String(dashboard?.totalProducts ?? 0)} />
            <MetricCard icon={ClipboardList} label="Talep" value={String(dashboard?.totalDemands ?? 0)} tone="amber" />
            <MetricCard icon={Star} label="Yorum" value={String(dashboard?.totalReviews ?? 0)} tone="amber" />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <StatStrip label="Toplam ürün" value={String(dashboard?.totalProducts ?? 0)} />
            <StatStrip label="Aktif ürün" value={String(dashboard?.activeProducts ?? 0)} tone="green" />
            <StatStrip label="Pasif ürün" value={String(dashboard?.inactiveProducts ?? 0)} tone="red" />
            <StatStrip label="Toplam talep" value={String(dashboard?.totalDemands ?? 0)} />
            <StatStrip label="Açık talep" value={String(dashboard?.openDemands ?? 0)} tone="amber" />
            <StatStrip label="Anlaşılan talep" value={String(dashboard?.agreedDemands ?? 0)} tone="green" />
          </div>
          <Panel title="Kategoriler" action="Yeni kategori" onAction={() => setSelectedCategoryId("new")}>
            <CategoryTable
              categories={categories}
              onEdit={setSelectedCategoryId}
              onDelete={onCategoryDelete}
            />
          </Panel>
        </div>
        <CategoryEditor
          categories={categories}
          selectedId={selectedCategoryId}
          onSelectedIdChange={setSelectedCategoryId}
          actionStatus={actionStatus}
          onSave={onCategorySave}
        />
      </div>
    </DashboardFrame>
  );
}

function ReviewsScreen({
  authUser,
  sellerProfile,
  notificationUnreadCount,
  query,
  setQuery,
  onNavigate,
  onLogout,
  product,
  showToast,
}: {
  authUser: AuthState | null;
  sellerProfile?: SellerProfileDto | null;
  notificationUnreadCount: number;
  query: string;
  setQuery: (value: string) => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  product: ProductDto | null;
  showToast: (message: string, kind: ToastKind) => void;
}) {
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const [tab, setTab] = useState<ReviewTab>("comments");
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [ratings, setRatings] = useState<RatingDto[]>([]);
  const [reviewEligibility, setReviewEligibility] = useState<ReviewEligibilityDto | null>(null);
  const [eligibilityStatus, setEligibilityStatus] = useState<"idle" | "loading">("idle");
  const [reviewStatus, setReviewStatus] = useState<"idle" | "loading">("idle");

  useEffect(() => {
    if (!product) {
      setComments([]);
      setRatings([]);
      return;
    }

    let ignore = false;
    setComments(product.yorumlar ?? []);
    setRatings(product.puanlar ?? []);

    Promise.all([
      yoremioApi.comments(product.id),
      yoremioApi.productRatings(product.id),
    ])
      .then(([nextComments, nextRatings]) => {
        if (ignore) return;
        setComments(nextComments);
        setRatings(nextRatings);
      })
      .catch(() => {
        if (!ignore) {
          setComments(product.yorumlar ?? []);
          setRatings(product.puanlar ?? []);
        }
      });

    return () => {
      ignore = true;
    };
  }, [product]);

  useEffect(() => {
    if (!product || !authUser || !hasRole(authUser, "ALICI")) {
      setReviewEligibility(null);
      setEligibilityStatus("idle");
      return;
    }

    let ignore = false;
    setEligibilityStatus("loading");
    yoremioApi
      .reviewEligibility(authUser.token, product.id)
      .then((eligibility) => {
        if (!ignore) setReviewEligibility(eligibility);
      })
      .catch((error) => {
        if (!ignore) {
          setReviewEligibility({
            yorumYapabilir: false,
            sebep: apiErrorMessage(error),
          });
        }
      })
      .finally(() => {
        if (!ignore) setEligibilityStatus("idle");
      });

    return () => {
      ignore = true;
    };
  }, [authUser, product]);

  const reviews: ReviewItem[] = comments.map((comment) => ({
    name: comment.kullaniciAdi ?? "Yöremio kullanıcısı",
    date: shortDate(comment.tarih),
    rating: Math.round(product?.ortalamaPuan ?? 0),
    text: comment.icerik,
    helpful: 0,
  }));
  const canWriteReview = Boolean(authUser && hasRole(authUser, "ALICI") && reviewEligibility?.yorumYapabilir);
  const reviewGateMessage = !authUser
    ? "Yorum yazmak için alıcı girişi gerekli."
    : !hasRole(authUser, "ALICI")
      ? "Yorum yazmak için alıcı rolü gerekli."
      : eligibilityStatus === "loading"
        ? "Yorum yetkisi kontrol ediliyor."
        : reviewEligibility?.yorumYapabilir
          ? "Bu ürün için yorum ve puan gönderebilirsin."
          : reviewEligibility?.sebep ?? "Yorum yazabilmek için bu ürünle ilgili kabul edilmiş bir talebin olmalı.";
  const disableReviewSubmit =
    reviewStatus === "loading" ||
    eligibilityStatus === "loading" ||
    Boolean(authUser && hasRole(authUser, "ALICI") && !canWriteReview);

  const submitReview = async () => {
    if (!authUser || !product) {
      showToast("Yorum için alıcı girişi gerekli.", "info");
      onNavigate("login");
      return;
    }
    if (!hasRole(authUser, "ALICI") || !reviewEligibility?.yorumYapabilir) {
      showToast(reviewGateMessage, "info");
      return;
    }
    if (!reviewText.trim() && rating === 0) {
      showToast("Yorum veya puan gir.", "info");
      return;
    }

    setReviewStatus("loading");
    try {
      if (rating > 0) await yoremioApi.rateProduct(authUser.token, product.id, rating);
      if (reviewText.trim()) {
        await yoremioApi.addComment(authUser.token, product.id, reviewText.trim());
        setReviewText("");
      }
      setRating(0);
      const [nextComments, nextRatings] = await Promise.all([
        yoremioApi.comments(product.id),
        yoremioApi.productRatings(product.id),
      ]);
      setComments(nextComments);
      setRatings(nextRatings);
      showToast("Yorum kaydedildi.", "success");
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setReviewStatus("idle");
    }
  };

  if (!product) {
    return (
      <main className="min-h-screen bg-white">
        <PublicHeader
          authUser={authUser}
          sellerProfile={sellerProfile}
          notificationUnreadCount={notificationUnreadCount}
          query={query}
          setQuery={setQuery}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />
        <section className="mx-auto max-w-3xl px-4 py-10">
          <EmptyState
            icon={Star}
            title="Ürün seçilmedi"
            description="Yorum ve puanları görmek için önce keşif ekranından gerçek bir ürün seç."
          />
          <Button className="mx-auto mt-5 flex" onClick={() => onNavigate("discover")}>
            Ürünlere git
          </Button>
        </section>
      </main>
    );
  }

  const reviewGalleryImages = (product.resimler ?? [])
    .map((image) => mediaImageSrc(image.url))
    .slice(0, 3);
  const displayGalleryImages = reviewGalleryImages.length > 0 ? reviewGalleryImages : [productImage(product)];

  return (
    <main className="min-h-screen bg-white">
      <PublicHeader
        authUser={authUser}
        sellerProfile={sellerProfile}
        notificationUnreadCount={notificationUnreadCount}
        query={query}
        setQuery={setQuery}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
      <section className="mx-auto max-w-[1520px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[480px_1fr_430px]">
            <div className="grid grid-cols-[72px_1fr] gap-3">
              <div className="space-y-3">
              {displayGalleryImages.map((image, index) => (
                <div key={`${image}-${index}`} className="relative aspect-square overflow-hidden rounded-md border border-border">
                  <Image src={image} alt="" fill sizes="72px" className="object-cover" />
                </div>
              ))}
            </div>
            <div className="relative aspect-[1.35] overflow-hidden rounded-lg bg-muted">
              <Image src={productImage(product)} alt={product.adi} fill sizes="430px" className="object-cover" />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black">{product.adi}</h1>
            <p className="text-muted-foreground">{product.kategoriAdi ?? "Yerel ürün"}</p>
            <div className="flex items-center gap-3">
              <div className="relative size-12 overflow-hidden rounded-full">
                <Image src={productImage(product)} alt="" fill sizes="48px" className="object-cover" />
              </div>
              <div>
                <p className="font-black">{sellerName(product)}</p>
                {product.saticiDogrulanmis ? (
                  <Badge variant="green">
                    <ShieldCheck className="size-3.5" aria-hidden />
                    Doğrulanmış satıcı
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-3 font-bold">
              <Stars value={product.ortalamaPuan} />
              {product.ortalamaPuan.toFixed(1)} ({product.toplamYorum})
            </div>
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4" aria-hidden />
              {productLocation(product)}
            </p>
          </div>
          <Card className="overflow-hidden border-amber-200 bg-amber-50/55 p-5">
            <ShieldCheck className="size-8 text-primary" aria-hidden />
            <h2 className="mt-4 text-xl font-black text-primary">Yorum yetkisi backend tarafından doğrulanır</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {reviewGateMessage}
            </p>
          </Card>
        </div>

        <div className="mt-6 border-b border-border">
          <div className="flex gap-8 text-base font-bold">
            <button
              className={cn("px-5 py-4", tab === "comments" && "border-b-2 border-primary text-primary")}
              type="button"
              onClick={() => setTab("comments")}
            >
              Yorumlar
            </button>
            <button
              className={cn("px-5 py-4", tab === "ratings" && "border-b-2 border-primary text-primary")}
              type="button"
              onClick={() => setTab("ratings")}
            >
              Puanlar
            </button>
            <button
              className={cn("px-5 py-4", tab === "description" && "border-b-2 border-primary text-primary")}
              type="button"
              onClick={() => setTab("description")}
            >
              Açıklama
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_430px]">
          <div className="space-y-5">
            <Card className="grid gap-5 p-5 lg:grid-cols-[220px_1fr_180px]">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Ortalama puan</p>
                <p className="mt-1 text-5xl font-black">{product.ortalamaPuan.toFixed(1)}</p>
                <Stars className="mt-2 justify-center" value={product.ortalamaPuan} />
              </div>
              <RatingBreakdown ratings={ratings} />
              <div className="grid place-items-center border-t border-border pt-4 text-center lg:border-l lg:border-t-0 lg:pt-0">
                <div>
                  <p className="text-sm text-muted-foreground">Toplam yorum</p>
                  <p className="text-4xl font-black">{comments.length}</p>
                  <MessageCircle className="mx-auto mt-2 size-8 text-muted-foreground" aria-hidden />
                </div>
              </div>
            </Card>
            {tab === "comments" ? (
              <div className="space-y-3">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <ReviewCard key={`${review.name}-${review.date}-${review.text}`} review={review} product={product} />
                  ))
                ) : (
                  <EmptyState icon={MessageCircle} title="Yorum yok" description="Bu ürün için canlı yorum bulunamadı." />
                )}
              </div>
            ) : null}
            {tab === "ratings" ? (
              <Card className="p-5">
                <RatingBreakdown ratings={ratings} />
              </Card>
            ) : null}
            {tab === "description" ? (
              <Card className="p-5 text-sm leading-7 text-muted-foreground">
                {product.aciklama || "Ürün açıklaması bulunmuyor."}
              </Card>
            ) : null}
          </div>

          <Card className="p-5">
            <h2 className="text-xl font-black">Yorum yaz</h2>
            <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950">
              <p className="font-black">{canWriteReview ? "Yorum hakkı açık" : "Yorum hakkı kapalı"}</p>
              <p className="mt-1">{reviewGateMessage}</p>
            </div>
            <div className="mt-5">
              <p className="font-bold">Puan ver</p>
              <div className="mt-2 flex gap-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    disabled={!canWriteReview || reviewStatus === "loading"}
                    onClick={() => setRating(index + 1)}
                    className="disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Star className={cn("size-7", index < rating ? "fill-amber-400 text-amber-400" : "text-slate-300")} aria-hidden />
                  </button>
                ))}
              </div>
            </div>
            <Field label="Yorumunuz" htmlFor="review-text">
              <textarea
                id="review-text"
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                placeholder="Deneyiminizi paylaşın..."
                disabled={!canWriteReview || reviewStatus === "loading"}
                className="min-h-28 w-full rounded-md border border-input px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
              />
            </Field>
            <Button className="mt-4 w-full" disabled={disableReviewSubmit} onClick={submitReview}>
              {reviewStatus === "loading" ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Gönder
            </Button>
          </Card>
        </div>
      </section>
    </main>
  );
}

function GlobalStatesScreen({
  authUser,
  sellerProfile,
  notificationUnreadCount,
  query,
  setQuery,
  onNavigate,
  onLogout,
  showToast,
  refreshRoleData,
}: {
  authUser: AuthState | null;
  sellerProfile?: SellerProfileDto | null;
  notificationUnreadCount: number;
  query: string;
  setQuery: (value: string) => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  showToast: (message: string, kind: ToastKind) => void;
  refreshRoleData: () => Promise<void>;
}) {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [mutatingId, setMutatingId] = useState<number | "all" | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!authUser) return;
    setStatus("loading");
    try {
      const pageResult = await yoremioApi.notifications(authUser.token, onlyUnread);
      setNotifications(pageResult.items);
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setStatus("idle");
    }
  }, [authUser, onlyUnread, showToast]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markRead = async (id: number) => {
    if (!authUser) return;
    setMutatingId(id);
    try {
      await yoremioApi.markNotificationRead(authUser.token, id);
      await loadNotifications();
      await refreshRoleData();
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setMutatingId(null);
    }
  };

  const markAllRead = async () => {
    if (!authUser) return;
    setMutatingId("all");
    try {
      await yoremioApi.markAllNotificationsRead(authUser.token);
      await loadNotifications();
      await refreshRoleData();
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setMutatingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#fbfcfa]">
      <PublicHeader
        authUser={authUser}
        sellerProfile={sellerProfile}
        notificationUnreadCount={notificationUnreadCount}
        query={query}
        setQuery={setQuery}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
      <section className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black">Bildirimler</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Okunmamış bildirim: {notificationUnreadCount}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={onlyUnread ? "secondary" : "outline"}
              onClick={() => setOnlyUnread((current) => !current)}
            >
              {onlyUnread ? "Tüm bildirimler" : "Sadece okunmamış"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!authUser || mutatingId === "all"}
              onClick={markAllRead}
            >
              {mutatingId === "all" ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
              Tümünü okundu yap
            </Button>
          </div>
        </div>

        {!authUser ? (
          <div className="mt-6">
            <EmptyState icon={LockKeyhole} title="Giriş gerekli" description="Bildirimleri görmek için oturum açmalısın." />
            <Button className="mx-auto mt-5 flex" onClick={() => onNavigate("login")}>
              Giriş yap
            </Button>
          </div>
        ) : status === "loading" ? (
          <div className="mt-6 grid min-h-64 place-items-center rounded-lg border border-dashed border-border bg-white">
            <Loader2 className="size-7 animate-spin text-primary" aria-hidden />
          </div>
        ) : notifications.length === 0 ? (
          <div className="mt-6">
            <EmptyState icon={Bell} title="Bildirim yok" description="Canlı bildirim geldiğinde burada listelenir." />
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {notifications.map((notification) => (
              <Card key={notification.id} className={cn("p-4", !notification.okunduMu && "border-primary/35 bg-secondary/40")}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Badge variant={notification.okunduMu ? "outline" : "green"}>{notification.tur}</Badge>
                    <h2 className="mt-3 text-lg font-black">{notification.baslik}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{notification.mesaj}</p>
                    <p className="mt-2 text-xs font-semibold text-muted-foreground">{shortDate(notification.olusturmaTarihi)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={notification.okunduMu || mutatingId === notification.id}
                    onClick={() => markRead(notification.id)}
                  >
                    {mutatingId === notification.id ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
                    Okundu
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
        <div className="mt-8">
          <SupportRequestPanel authUser={authUser} showToast={showToast} ekran="bildirim-destek" />
        </div>
      </section>
    </main>
  );
}

function SupportRequestPanel({
  authUser,
  showToast,
  ekran,
}: {
  authUser: AuthState | null;
  showToast: (message: string, kind: ToastKind) => void;
  ekran: string;
}) {
  const [konu, setKonu] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [email, setEmail] = useState(authUser?.email ?? "");
  const [telefon, setTelefon] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [talepId, setTalepId] = useState("");

  useEffect(() => {
    if (authUser?.email) setEmail(authUser.email);
  }, [authUser?.email]);

  const submitSupport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!konu.trim() || !mesaj.trim()) {
      showToast("Destek için konu ve mesaj gerekli.", "info");
      return;
    }

    setStatus("loading");
    try {
      const result = await yoremioApi.createSupportRequest({
        konu: konu.trim(),
        mesaj: mesaj.trim(),
        email: email.trim() || undefined,
        telefon: telefon.trim() || undefined,
        ekran,
      });
      setTalepId(result.talepId);
      setMesaj("");
      showToast(`Destek talebi alındı: ${result.talepId}`, "success");
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Yardım / destek</h2>
          <p className="mt-1 text-sm text-muted-foreground">Talebin backend tarafından kayıt altına alınır.</p>
        </div>
        {talepId ? <Badge variant="green">{talepId}</Badge> : null}
      </div>
      <form onSubmit={submitSupport} className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Konu *" htmlFor="support-subject">
          <Input
            id="support-subject"
            value={konu}
            onChange={(event) => setKonu(event.target.value)}
            placeholder="Kısa başlık"
            required
          />
        </Field>
        <Field label="E-posta" htmlFor="support-email">
          <Input
            id="support-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ornek@eposta.com"
          />
        </Field>
        <Field label="Telefon" htmlFor="support-phone">
          <Input
            id="support-phone"
            value={telefon}
            onChange={(event) => setTelefon(event.target.value)}
            placeholder="+90..."
          />
        </Field>
        <Field label="Mesaj *" htmlFor="support-message" className="md:col-span-2">
          <textarea
            id="support-message"
            value={mesaj}
            onChange={(event) => setMesaj(event.target.value)}
            placeholder="Neye takıldığını yaz..."
            required
            className="min-h-28 w-full rounded-md border border-input px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
          />
        </Field>
        <div className="md:col-span-2">
          <Button disabled={status === "loading"}>
            {status === "loading" ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
            Destek talebi gönder
          </Button>
        </div>
      </form>
    </Card>
  );
}

function AccessRequiredScreen({
  authUser,
  sellerProfile,
  notificationUnreadCount,
  query,
  setQuery,
  onNavigate,
  onLogout,
  title,
  description,
  actionLabel,
  onAction,
}: {
  authUser: AuthState | null;
  sellerProfile?: SellerProfileDto | null;
  notificationUnreadCount: number;
  query: string;
  setQuery: (value: string) => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  const primaryLabel = authUser ? "Pazara dön" : actionLabel;
  const primaryAction = authUser ? () => onNavigate("discover") : onAction;

  return (
    <main className="min-h-screen bg-[#fbfcfa]">
      <PublicHeader
        authUser={authUser}
        sellerProfile={sellerProfile}
        notificationUnreadCount={notificationUnreadCount}
        query={query}
        setQuery={setQuery}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
      <section className="mx-auto flex min-h-[calc(100vh-88px)] max-w-3xl items-center px-4 py-10 sm:px-6">
        <Card className="w-full p-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-secondary text-primary">
            <LockKeyhole aria-hidden />
          </span>
          <h1 className="mt-5 text-3xl font-black">{title}</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{description}</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button type="button" onClick={primaryAction}>
              {primaryLabel}
            </Button>
            <Button type="button" variant="outline" onClick={() => onNavigate("home")}>
              Ana sayfa
            </Button>
          </div>
        </Card>
      </section>
    </main>
  );
}

function DashboardFrame({
  variant,
  title,
  subtitle,
  authUser,
  sellerProfile,
  notificationUnreadCount,
  onNavigate,
  onLogout,
  navItems,
  children,
}: {
  variant: "dark" | "light";
  title: string;
  subtitle: string;
  authUser: AuthState | null;
  sellerProfile?: SellerProfileDto | null;
  notificationUnreadCount: number;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  navItems: [string, LucideIcon, Screen][];
  children: ReactNode;
}) {
  const dark = variant === "dark";

  return (
    <main className="min-h-screen bg-[#f7f8f6]">
      <div className={cn("grid min-h-screen", dark ? "lg:grid-cols-[260px_1fr]" : "lg:grid-cols-[288px_1fr]")}>
        <aside
          className={cn(
            "flex min-h-0 flex-col border-b border-border px-4 py-4 lg:min-h-screen lg:border-b-0 lg:border-r lg:py-5",
            dark ? "bg-[linear-gradient(165deg,#006b35,#00382b)] text-white" : "bg-white text-foreground",
          )}
        >
          <button type="button" onClick={() => onNavigate("home")} className="mb-4 self-start lg:mb-8">
            <BrandLogo inverse={dark} />
          </button>
          <nav className="scroll-shelf flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
            {navItems.map(([label, Icon, screen], index) => (
              <button
                key={`${label}-${index}`}
                type="button"
                onClick={() => onNavigate(screen)}
                className={cn(
                  "flex h-11 w-max min-w-max shrink-0 items-center gap-3 rounded-lg px-3 text-left text-sm font-bold transition lg:h-12 lg:w-full lg:min-w-0 lg:text-base",
                  index === 0
                    ? dark
                      ? "bg-white/14 text-white"
                      : "bg-primary text-primary-foreground"
                    : dark
                      ? "text-white/86 hover:bg-white/10 hover:text-white"
                      : "hover:bg-muted",
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-4 flex gap-2 border-t border-current/15 pt-4 lg:mt-auto lg:block lg:space-y-2 lg:pt-5">
            <button
              type="button"
              onClick={() => onNavigate("states")}
              className={cn("flex h-11 min-w-max items-center gap-3 rounded-md px-3 text-left text-sm font-bold lg:w-full", dark ? "text-white/82 hover:bg-white/10" : "hover:bg-muted")}
            >
              <Bell className="size-4" aria-hidden />
              Bildirimler
            </button>
            <button
              type="button"
              onClick={authUser ? onLogout : () => onNavigate("login")}
              className={cn("flex h-11 min-w-max items-center gap-3 rounded-md px-3 text-left text-sm font-bold lg:w-full", dark ? "text-white/82 hover:bg-white/10" : "hover:bg-muted")}
            >
              <LogOut className="size-4" aria-hidden />
              {authUser ? "Çıkış yap" : "Giriş yap"}
            </button>
          </div>
        </aside>
        <section className="min-w-0">
          <header className="flex min-h-[78px] items-center justify-between gap-4 border-b border-border bg-white px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-black tracking-normal">{title}</h1>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IconButton icon={Bell} label="Bildirimler" badge={notificationUnreadCount} onClick={() => onNavigate("states")} />
              <AccountChip
                authUser={authUser}
                sellerProfile={sellerProfile}
                onLogin={() => onNavigate("login")}
                onLogout={onLogout}
              />
            </div>
          </header>
          <div className="p-4 sm:p-6">{children}</div>
        </section>
      </div>
    </main>
  );
}

function AccountChip({
  authUser,
  sellerProfile,
  onLogin,
  onLogout,
}: {
  authUser: AuthState | null;
  sellerProfile?: SellerProfileDto | null;
  onLogin: () => void;
  onLogout: () => void;
}) {
  if (!authUser) {
    return (
      <Button variant="outline" onClick={onLogin}>
        <UserRound aria-hidden />
        Giriş yap
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-right sm:block">
        <span className="block text-sm font-black">{accountName(authUser, sellerProfile)}</span>
        <span className="text-xs text-muted-foreground">{rolesOf(authUser).join(", ")}</span>
      </span>
      <button
        type="button"
        onClick={onLogout}
        title="Çıkış yap"
        aria-label="Çıkış yap"
        className="grid size-11 place-items-center rounded-full bg-primary text-sm font-black text-white"
      >
        {accountName(authUser, sellerProfile).slice(0, 2).toUpperCase()}
      </button>
    </div>
  );
}

function HeaderTextButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="hidden items-center gap-2 text-sm font-bold lg:flex">
      <Icon className="size-5" aria-hidden />
      {label}
    </button>
  );
}

function IconButton({
  icon: Icon,
  label,
  badge,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="relative grid size-11 shrink-0 place-items-center rounded-full text-foreground transition hover:bg-muted"
    >
      <Icon className="size-6" aria-hidden />
      {badge ? (
        <span className="absolute right-1 top-1 grid min-w-5 place-items-center rounded-full bg-red-600 px-1 text-xs font-black text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function Panel({
  title,
  action,
  badge,
  onAction,
  children,
}: {
  title: string;
  action?: string;
  badge?: number;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white shadow-[0_8px_18px_rgba(16,24,40,0.05)]">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 text-lg font-black">
          {title}
          {badge ? <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">{badge}</span> : null}
        </h2>
        {action && onAction ? (
          <button type="button" onClick={onAction} className="text-sm font-bold text-primary">
            {action}
          </button>
        ) : null}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function PanelHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-black text-primary">{title}</h2>
      {action && onAction ? (
        <button className="text-sm font-bold text-primary" type="button" onClick={onAction}>
          {action}
        </button>
      ) : null}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tone = "green",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  helper?: string;
  tone?: "green" | "amber" | "lime";
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-5 shadow-[0_8px_18px_rgba(16,24,40,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{label}</p>
          <p className="mt-3 text-3xl font-black">{value}</p>
        </div>
        <span
          className={cn(
            "grid size-12 place-items-center rounded-full",
            tone === "amber" ? "bg-amber-100 text-amber-700" : tone === "lime" ? "bg-lime-100 text-lime-700" : "bg-emerald-100 text-primary",
          )}
        >
          <Icon className="size-6" aria-hidden />
        </span>
      </div>
      {helper ? <p className="mt-5 text-sm font-semibold text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function SellerProductTable({
  products,
  actionStatus,
  onSelectProduct,
  onDuplicateProduct,
  onDeleteProduct,
  onToggleProductStatus,
}: {
  products: ProductDto[];
  actionStatus: string | null;
  onSelectProduct: (product: ProductDto, screen?: Screen) => void;
  onDuplicateProduct: (product: ProductDto) => void;
  onDeleteProduct: (product: ProductDto) => void;
  onToggleProductStatus: (product: ProductDto) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[780px] text-left text-sm">
        <thead className="bg-muted text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-3">Ürün</th>
            <th className="px-3 py-3">Fiyat</th>
            <th className="px-3 py-3">Stok</th>
            <th className="px-3 py-3">Durum</th>
            <th className="px-3 py-3">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-t border-border">
              <td className="px-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative size-11 overflow-hidden rounded-md border border-border">
                    <Image src={productImage(product)} alt="" fill sizes="44px" className="object-cover" />
                  </div>
                  <div>
                    <p className="font-black">{product.adi}</p>
                    <p className="text-xs text-muted-foreground">SKU: YRM-{Math.abs(product.id)}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-3">{formatPrice(product.fiyat)}</td>
              <td className={cn("px-3 py-3 font-black", product.stokMiktari === 0 ? "text-red-600" : product.stokMiktari < 5 ? "text-amber-600" : "text-primary")}>
                {product.stokMiktari}
              </td>
              <td className="px-3 py-3">
                <Badge variant={product.aktifMi === false ? "outline" : "green"}>
                  {product.aktifMi === false ? "Pasif" : "Aktif"}
                </Badge>
              </td>
              <td className="px-3 py-3">
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" title="Düzenle" onClick={() => onSelectProduct(product, "seller-product")}>
                    <Edit3 aria-hidden />
                  </Button>
                  <Button variant="outline" size="icon" title="Kopyala" onClick={() => onDuplicateProduct(product)}>
                    <Package aria-hidden />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    title={product.aktifMi === false ? "Aktif yap" : "Pasife al"}
                    disabled={actionStatus === `product-status-${product.id}`}
                    onClick={() => onToggleProductStatus(product)}
                  >
                    {actionStatus === `product-status-${product.id}` ? (
                      <Loader2 className="animate-spin" aria-hidden />
                    ) : product.aktifMi === false ? (
                      <Check aria-hidden />
                    ) : (
                      <X aria-hidden />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    title="Sil"
                    className="text-red-600"
                    disabled={actionStatus === `product-delete-${product.id}`}
                    onClick={() => onDeleteProduct(product)}
                  >
                    {actionStatus === `product-delete-${product.id}` ? (
                      <Loader2 className="animate-spin" aria-hidden />
                    ) : (
                      <Trash2 aria-hidden />
                    )}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SellerProfileCard({
  profile,
  dashboard,
  onNavigate,
}: {
  profile: SellerProfileDto | null;
  dashboard: SellerDashboardDto | null;
  onNavigate: (screen: Screen) => void;
}) {
  const score = dashboard?.trustScore ?? 0;
  const checklist = [
    {
      label: "Doğrulama",
      value: profile?.dogrulanmisSatici ? "Tamamlandı" : "Bekliyor",
      done: Boolean(profile?.dogrulanmisSatici),
    },
    {
      label: "Mağaza bilgileri",
      value: profile?.magazaAdi ? "Tamamlandı" : "Eksik",
      done: Boolean(profile?.magazaAdi),
    },
    {
      label: "İletişim bilgileri",
      value: profile?.phoneNumber ? "Tamamlandı" : "Eksik",
      done: Boolean(profile?.phoneNumber),
    },
    {
      label: "Ürün yükleme",
      value: `${dashboard?.totalProducts ?? 0} ürün`,
      done: Boolean((dashboard?.totalProducts ?? 0) > 0),
    },
  ];

  return (
    <Panel title="Profil">
      <div className="flex items-center gap-4">
        <TrustDial score={score} />
        <div>
          <p className="font-black">Profil tamamlama</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile?.magazaAdi ?? "Mağazanızı güçlendirin, daha fazla müşteriye ulaşın."}
          </p>
          <Button className="mt-3" variant="outline" size="sm" onClick={() => onNavigate("seller-profile")}>
            Tamamla
          </Button>
        </div>
      </div>
      <div className="mt-5 space-y-3 border-t border-border pt-5">
        {checklist.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Check className={cn("size-4", item.done ? "text-primary" : "text-amber-600")} aria-hidden />
              {item.label}
            </span>
            <span className="font-semibold text-muted-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function DemandTable({ demands }: { demands: DemandDto[] }) {
  if (demands.length === 0) {
    return <EmptyState icon={ClipboardList} title="Talep yok" description="Oluşturduğun talepler burada görünür." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[440px] text-sm">
        <thead className="text-left text-xs text-muted-foreground">
          <tr>
            <th className="py-2">Talep</th>
            <th>Ürün</th>
            <th>Miktar</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          {demands.map((demand) => (
            <tr key={demand.id} className="border-t border-border">
              <td className="py-3 font-black">#T-{Math.abs(demand.id)}</td>
              <td>{demand.urunAdi}</td>
              <td>{demand.miktar}</td>
              <td>
                <Badge variant={demand.durum === "ANLASILDI" ? "green" : demand.durum === "IPTAL" ? "outline" : "gold"}>
                  {demand.durum === "ACIK" ? "Teklif Bekliyor" : demand.durum}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OfferCards({
  demands,
  actionStatus,
  onAcceptOffer,
}: {
  demands: DemandDto[];
  actionStatus: string | null;
  onAcceptOffer: (offerId: number) => void;
}) {
  const demandsWithOffers = demands.filter((demand) => demand.teklifler.length > 0);

  if (demandsWithOffers.length === 0) {
    return <EmptyState icon={Tag} title="Teklif yok" description="Satıcı teklifleri geldiğinde burada görünür." />;
  }

  return (
    <div className="space-y-3">
      {demandsWithOffers.slice(0, 3).map((demand) => {
        const offer = demand.teklifler[0];
        const canAccept = Boolean(offer?.id && offer.durum === "BEKLEMEDE");
        return (
          <div key={demand.id} className="rounded-lg border border-border bg-white p-3">
            <div className="flex items-center gap-3">
              <div className="relative size-12 overflow-hidden rounded-full border border-border">
                <Image src={demandImage(demand)} alt="" fill sizes="48px" className="object-cover" />
              </div>
              <div>
                <p className="font-black">{offer?.saticiMagazaAdi ?? demand.saticiMagazaAdi ?? "Yöremio satıcısı"}</p>
                <Badge variant="green">Doğrulanmış Satıcı</Badge>
              </div>
            </div>
            <p className="mt-3 font-bold">{demand.urunAdi} {demand.miktar} kg</p>
            <p className="mt-2 text-sm text-muted-foreground">Teklif Tutarı</p>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-2xl font-black text-primary">{formatPrice((offer?.birimFiyat ?? demand.urunFiyat ?? 0) * demand.miktar)}</p>
              <Button
                size="sm"
                disabled={!canAccept || actionStatus === `offer-${offer?.id}`}
                onClick={() => {
                  if (offer?.id) onAcceptOffer(offer.id);
                }}
              >
                {actionStatus === `offer-${offer?.id}` ? <Loader2 className="animate-spin" aria-hidden /> : null}
                {offer?.durum === "KABUL" ? "Kabul edildi" : "Kabul et"}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChatPanel({
  conversations,
  messages,
  targetId,
  actionStatus,
  onTargetChange,
  onSendMessage,
}: {
  conversations: ChatConversationDto[];
  messages: ChatMessageDto[];
  targetId: string;
  actionStatus: string | null;
  onTargetChange: (value: string) => void;
  onSendMessage: (receiverId: string, message: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const activeConversation = conversations.find((conversation) => conversation.userId === targetId) ?? conversations[0];
  const currentTarget = targetId || activeConversation?.userId || "";
  const canSend = Boolean(currentTarget && draft.trim() && actionStatus !== "chat-send");

  if (conversations.length === 0 && !currentTarget) {
    return <EmptyState icon={MessageCircle} title="Mesaj yok" description="Gerçek bir konuşma başladığında mesajlar burada görünür." />;
  }

  return (
    <div className="grid min-h-[560px] grid-rows-[auto_1fr_auto] overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div>
            <p className="font-black">{activeConversation?.userName ?? "Yeni görüşme"}</p>
            <Badge variant="green">{activeConversation ? "Doğrulanmış Satıcı" : "Mesaj yazmaya hazır"}</Badge>
          </div>
        </div>
      </div>
      <div className="space-y-3 overflow-y-auto bg-[#fbfcfa] p-4">
        {conversations.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {conversations.map((conversation) => (
              <button
                key={conversation.userId}
                type="button"
                onClick={() => onTargetChange(conversation.userId)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-bold",
                  currentTarget === conversation.userId ? "border-primary bg-secondary text-primary" : "border-border bg-white",
                )}
              >
                {conversation.userName ?? conversation.email ?? "Kullanıcı"}
              </button>
            ))}
          </div>
        ) : null}
        {messages.length > 0 ? (
          messages.map((message) => (
            <ChatBubble key={message.id} mine={message.isMine}>
              {message.message}
              <span className="mt-1 block text-[11px] opacity-70">{shortDate(message.sentAt)}</span>
            </ChatBubble>
          ))
        ) : (
          <p className="rounded-md border border-dashed border-border bg-white p-4 text-sm text-muted-foreground">
            Bu konuşmada henüz mesaj yok.
          </p>
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
          placeholder={currentTarget ? "Mesajını yaz" : "Satıcıya yaz"}
          disabled={!currentTarget || actionStatus === "chat-send"}
        />
        <Button disabled={!canSend} aria-label="Mesaj gönder" title="Mesaj gönder">
          {actionStatus === "chat-send" ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
        </Button>
      </form>
    </div>
  );
}

function AcceptedOffer({ demands, onNavigate }: { demands: DemandDto[]; onNavigate: (screen: Screen) => void }) {
  const demand = demands.find((item) => item.durum === "ANLASILDI") ?? demands[0];
  const offer = demand?.teklifler[0];

  if (!demand) return <EmptyState icon={Inbox} title="Kabul edilen teklif yok" description="Anlaşılan talep burada görünür." />;

  return (
    <div className="grid gap-4 md:grid-cols-[120px_1fr_auto]">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-border">
        <Image src={demandImage(demand)} alt="" fill sizes="120px" className="object-cover" />
      </div>
      <div>
        <p className="text-lg font-black">{demand.urunAdi}</p>
        <p className="mt-1 text-muted-foreground">{demand.miktar} kg</p>
        <p className="mt-3 font-bold">{offer?.saticiMagazaAdi ?? demand.saticiMagazaAdi}</p>
        <Badge className="mt-2" variant="green">Doğrulanmış Satıcı</Badge>
      </div>
      <div className="min-w-44 border-t border-border pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">
        <p className="text-sm text-muted-foreground">Teklif Tutarı</p>
        <p className="text-2xl font-black text-primary">{formatPrice((offer?.birimFiyat ?? demand.urunFiyat ?? 0) * demand.miktar)}</p>
        <Button className="mt-4 w-full" onClick={() => onNavigate("reviews")}>Puan ver</Button>
      </div>
    </div>
  );
}

function MediaGrid({
  title,
  icon: Icon,
  product,
  files,
  onFilesChange,
  onDelete,
  actionStatus,
  video = false,
}: {
  title: string;
  icon: LucideIcon;
  product: ProductDto | null;
  files: File[];
  onFilesChange: (files: File[]) => void;
  onDelete: (urunId: number, mediaId: number) => void;
  actionStatus: string | null;
  video?: boolean;
}) {
  const mediaItems = product ? (video ? product.videolar : product.resimler) : [];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {video ? "En fazla 3 video yükleyebilirsiniz." : "En fazla 10 görsel yükleyebilirsiniz."}
          </p>
        </div>
        <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-white px-4 text-sm font-bold transition hover:border-primary/55 hover:bg-secondary/55">
          <UploadCloud aria-hidden />
          Medya yükle
          <input
            type="file"
            className="sr-only"
            accept={video ? "video/*" : "image/*"}
            multiple
            onChange={(event) => onFilesChange(Array.from(event.target.files ?? []))}
          />
        </label>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {mediaItems.slice(0, video ? 3 : 10).map((item) => (
          <div key={item.id} className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
            {video ? (
              <span className="absolute inset-0 grid place-items-center bg-black/70 text-white">
                <Video className="size-8" aria-hidden />
              </span>
            ) : (
              <Image src={mediaImageSrc(item.url)} alt="" fill sizes="120px" className="object-cover" />
            )}
            <button
              type="button"
              className="absolute right-1 top-1 grid size-7 place-items-center rounded-md bg-white text-red-600 shadow disabled:opacity-50"
              disabled={!product || actionStatus === `${video ? "media-delete-video" : "media-delete-image"}-${item.id}`}
              onClick={() => {
                if (product) onDelete(product.id, item.id);
              }}
            >
              {actionStatus === `${video ? "media-delete-video" : "media-delete-image"}-${item.id}` ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="size-4" aria-hidden />
              )}
            </button>
          </div>
        ))}
        {files.map((file) => (
          <div key={`${file.name}-${file.lastModified}`} className="grid aspect-square place-items-center rounded-lg border border-dashed border-primary/40 bg-secondary p-2 text-center text-xs font-bold text-primary">
            <span className="line-clamp-3">{file.name}</span>
          </div>
        ))}
        <label className="grid aspect-square cursor-pointer place-items-center rounded-lg border border-dashed border-input text-sm font-bold text-muted-foreground">
          <Icon className="mb-2 size-7 text-muted-foreground" aria-hidden />
          {video ? "Video ekle" : "Görsel ekle"}
          <input
            type="file"
            className="sr-only"
            accept={video ? "video/*" : "image/*"}
            multiple
            onChange={(event) => onFilesChange(Array.from(event.target.files ?? []))}
          />
        </label>
      </div>
    </div>
  );
}

function CategoryEditor({
  categories,
  selectedId,
  onSelectedIdChange,
  actionStatus,
  onSave,
}: {
  categories: CategoryDto[];
  selectedId: number | "new";
  onSelectedIdChange: (id: number | "new") => void;
  actionStatus: string | null;
  onSave: (values: Omit<CategoryDto, "id">, id?: number) => void;
}) {
  const selected = categories.find((category) => category.id === selectedId);
  const [adi, setAdi] = useState("");
  const [aciklama, setAciklama] = useState("");

  useEffect(() => {
    setAdi(selected?.adi ?? "");
    setAciklama(selected?.aciklama ?? "");
  }, [selected]);

  return (
    <Card className="p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-black">{selected ? "Kategori düzenle" : "Yeni kategori"}</h2>
        <Button variant="ghost" size="icon" type="button" onClick={() => onSelectedIdChange("new")}>
          <X aria-hidden />
        </Button>
      </div>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ adi, aciklama }, selectedId === "new" ? undefined : selectedId);
          onSelectedIdChange("new");
        }}
      >
        <select
          value={selectedId}
          onChange={(event) => onSelectedIdChange(event.target.value === "new" ? "new" : Number(event.target.value))}
          className="h-11 w-full rounded-md border border-input bg-white px-3 text-sm font-semibold outline-none"
        >
          <option value="new">Yeni kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.adi}
            </option>
          ))}
        </select>
        <Field label="Kategori adı" htmlFor="category-name">
          <Input id="category-name" value={adi} onChange={(event) => setAdi(event.target.value)} placeholder="Kategori adı giriniz" required />
        </Field>
        <Field label="Açıklama" htmlFor="category-desc">
          <textarea
            id="category-desc"
            value={aciklama}
            onChange={(event) => setAciklama(event.target.value)}
            placeholder="Açıklama giriniz"
            className="min-h-44 w-full rounded-md border border-input px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => onSelectedIdChange("new")}>
            İptal
          </Button>
          <Button disabled={actionStatus === "category-save"}>
            {actionStatus === "category-save" ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Kaydet
          </Button>
        </div>
      </form>
    </Card>
  );
}

function CategoryTable({
  categories,
  onEdit,
  onDelete,
}: {
  categories: CategoryDto[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  if (categories.length === 0) {
    return <EmptyState icon={Package} title="Kategori yok" description="Kategori eklediğinde burada listelenir." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-muted text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-3">ID</th>
            <th className="px-3 py-3">Kategori adı</th>
            <th className="px-3 py-3">Açıklama</th>
            <th className="px-3 py-3">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id} className="border-t border-border">
              <td className="px-3 py-3">{category.id}</td>
              <td className="px-3 py-3 font-black">{category.adi}</td>
              <td className="px-3 py-3 text-muted-foreground">{category.aciklama ?? "-"}</td>
              <td className="px-3 py-3">
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" type="button" onClick={() => onEdit(category.id)}>
                    <PenLine aria-hidden />
                    Düzenle
                  </Button>
                  <Button variant="outline" size="sm" type="button" className="border-red-300 text-red-600" onClick={() => onDelete(category.id)}>
                    <Trash2 aria-hidden />
                    Sil
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-sm text-muted-foreground">{categories.length} kayıt</p>
    </div>
  );
}

function RatingBreakdown({ ratings }: { ratings: RatingDto[] }) {
  const rows = [5, 4, 3, 2, 1].map((rating) => {
    const count = ratings.filter((item) => Math.round(item.puanDegeri) === rating).length;
    return { rating, count };
  });
  const maxCount = Math.max(1, ...rows.map((row) => row.count));

  return (
    <div className="space-y-2">
      {rows.map(({ rating, count }) => (
        <div key={rating} className="grid grid-cols-[32px_1fr_44px] items-center gap-3 text-sm">
          <span className="flex items-center gap-1 font-bold">
            {rating}
            <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
          </span>
          <span className="h-2 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-amber-400" style={{ width: `${(count / maxCount) * 100}%` }} />
          </span>
          <span className="text-right text-muted-foreground">{count}</span>
        </div>
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  product,
}: {
  review: ReviewItem;
  product: ProductDto;
}) {
  return (
    <Card className="grid gap-4 p-4 md:grid-cols-[220px_1fr_auto]">
      <div className="flex items-center gap-3 md:block">
        <span className="grid size-12 place-items-center rounded-full bg-secondary text-lg font-black text-primary">
          {review.name.slice(0, 1)}
        </span>
        <div className="md:mt-3">
          <p className="font-black">{review.name}</p>
          <Badge className="mt-1" variant="green">Doğrulanmış alışveriş</Badge>
          <p className="mt-2 text-xs text-muted-foreground">{review.date}</p>
        </div>
      </div>
      <div>
        <Stars value={review.rating} />
        <p className="mt-3 font-black">{review.text.split(".")[0]}.</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{review.text}</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="relative size-12 overflow-hidden rounded-md border border-border">
            <Image src={productImage(product)} alt="" fill sizes="48px" className="object-cover" />
          </div>
          <span className="text-sm text-muted-foreground">{product.adi}</span>
        </div>
      </div>
      <div className="flex items-start gap-2 text-primary">
        <Check className="size-5" aria-hidden />
        <span className="font-black">{review.helpful}</span>
      </div>
    </Card>
  );
}

function MiniProduct({ product }: { product: ProductDto }) {
  return (
    <div className="min-w-0">
      <div className="relative aspect-square overflow-hidden rounded-md border border-border">
        <Image src={productImage(product)} alt={product.adi} fill sizes="120px" className="object-cover" />
      </div>
      <p className="mt-2 line-clamp-1 text-sm font-bold">{product.adi}</p>
      <p className="text-xs text-muted-foreground">{product.kategoriAdi ?? "Yerel"}</p>
      <p className="mt-1 text-right font-black text-primary">{formatPrice(product.fiyat)}</p>
    </div>
  );
}

function MiniProductButton({ product, onClick }: { product: ProductDto; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-lg border border-border bg-white p-2 text-left transition hover:border-primary/40">
      <MiniProduct product={product} />
    </button>
  );
}

function PreviewPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-[0_10px_22px_rgba(16,24,40,0.06)]">
      <h3 className="mb-3 font-black">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function DemandMediaLine({ demand }: { demand: DemandDto }) {
  return (
    <div className="grid grid-cols-[52px_1fr_auto] items-center gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <div className="relative size-12 overflow-hidden rounded-md">
        <Image src={demandImage(demand)} alt="" fill sizes="52px" className="object-cover" />
      </div>
      <div>
        <p className="font-black">{demand.urunAdi}</p>
        <p className="text-sm text-muted-foreground">Miktar: {demand.miktar} kg</p>
        <p className="text-xs text-muted-foreground">{shortDate(demand.olusturmaTarihi)}</p>
      </div>
      <Badge variant={demand.durum === "ACIK" ? "gold" : "outline"}>{demand.durum === "ACIK" ? "Yeni" : demand.durum}</Badge>
    </div>
  );
}

function StatStrip({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "green" | "red" | "amber";
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-2xl font-black", tone === "green" && "text-primary", tone === "red" && "text-red-600", tone === "amber" && "text-amber-600")}>
        {value}
      </p>
    </div>
  );
}

function MiniMetric({
  icon: Icon,
  label,
  value,
  tone = "green",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "green" | "red" | "amber";
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <Icon className={cn("size-7", tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-500" : "text-primary")} aria-hidden />
      <p className="mt-4 text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function ProgressLine({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-bold">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ProfileRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-3 md:grid-cols-[160px_1fr] md:items-center">
      <span className="font-bold">{label}</span>
      {children}
    </div>
  );
}

function TrustDial({ score, large = false }: { score: number; large?: boolean }) {
  const roundedScore = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div
      className={cn("grid shrink-0 place-items-center rounded-full", large ? "size-36" : "size-20")}
      style={{
        background: `conic-gradient(var(--primary) ${roundedScore * 3.6}deg, #e4e8df 0)`,
      }}
    >
      <div className={cn("grid place-items-center rounded-full bg-white", large ? "size-28" : "size-16")}>
        <span className={cn("font-black text-primary", large ? "text-4xl" : "text-xl")}>{roundedScore}</span>
      </div>
    </div>
  );
}

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("flex items-center gap-1 text-amber-400", className)}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn("size-5", index < Math.round(value) ? "fill-current" : "text-slate-300")}
          aria-hidden
        />
      ))}
    </span>
  );
}

function ChatBubble({ mine, children }: { mine?: boolean; children: ReactNode }) {
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6 shadow-sm",
          mine ? "bg-secondary text-secondary-foreground" : "border border-border bg-white",
        )}
      >
        {children}
      </div>
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
    <div className="mt-5 flex items-center justify-between rounded-lg border border-border bg-white p-3">
      <Button variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Önceki
      </Button>
      <p className="text-sm font-bold text-muted-foreground">{page} / {totalPages}</p>
      <Button variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Sonraki
      </Button>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block space-y-2 text-sm font-semibold", className)} htmlFor={htmlFor}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function InputIcon({
  icon: Icon,
  rightIcon: RightIcon,
  children,
}: {
  icon: LucideIcon;
  rightIcon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <span className="relative block">
      <Icon className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
      {children}
      {RightIcon ? (
        <RightIcon className="pointer-events-none absolute right-4 top-1/2 z-10 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
      ) : null}
    </span>
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
    <div className="rounded-lg border border-dashed border-border bg-white p-8 text-center">
      <Icon className="mx-auto size-9 text-muted-foreground" aria-hidden />
      <h3 className="mt-3 text-lg font-black">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function StatusBox({
  kind,
  title,
  text,
}: {
  kind: "warning" | "success";
  title: string;
  text: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-5",
        kind === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-emerald-200 bg-emerald-50 text-emerald-950",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid size-11 place-items-center rounded-full text-white",
            kind === "warning" ? "bg-amber-500" : "bg-primary",
          )}
        >
          {kind === "warning" ? <RefreshCw aria-hidden /> : <Check aria-hidden />}
        </span>
        <div>
          <p className="font-black">{title}</p>
          <p className="text-sm">{text}</p>
        </div>
      </div>
    </div>
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
            <AlertCircle className="size-4" aria-hidden />
          ) : (
            <RefreshCw className="size-4" aria-hidden />
          )}
        </div>
        <p className="min-w-0 flex-1 text-sm font-semibold leading-6">{toast.message}</p>
        <Button variant="ghost" size="icon" onClick={onClose} title="Kapat">
          <X aria-hidden />
        </Button>
      </div>
    </div>
  );
}
