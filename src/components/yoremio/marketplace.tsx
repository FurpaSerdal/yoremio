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
  type DashboardSummaryDto,
  type DemandDto,
  type FeaturedSellerDto,
  type LoginResponse,
  type Paginated,
  type ProductDto,
  type ProductFormValues,
  type SellerDashboardDto,
  type SellerProfileDto,
  type SellerTrustScoreDto,
  type SessionUser,
  type UserRole,
} from "@/lib/api";
import { cn, formatPrice, formatShortDate } from "@/lib/utils";

const PAGE_SIZE = 12;
const productPlaceholderImage = "/products/product-placeholder.svg";

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
type ToastKind = "success" | "error" | "info";
type ToastState = {
  kind: ToastKind;
  message: string;
} | null;
type LoadState = "idle" | "loading" | "error";
type SortKey = string;

const fallbackProductSorts = [
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

const demoCategories: CategoryDto[] = [
  { id: 1, adi: "Bal ve Arı Ürünleri", aciklama: "Bal, polen ve arıcılık ürünleri" },
  { id: 2, adi: "Süt Ürünleri", aciklama: "Peynir, yoğurt ve tereyağı" },
  { id: 3, adi: "Yumurta", aciklama: "Köy yumurtası ve doğal üretim" },
  { id: 4, adi: "Meyve ve Sebze", aciklama: "Mevsimlik taze ürünler" },
  { id: 5, adi: "Bakliyat", aciklama: "Mercimek, nohut ve fasulye" },
  { id: 6, adi: "Reçel ve Marmelat", aciklama: "Ev yapımı reçel ve marmelatlar" },
];

const demoProducts: ProductDto[] = [
  {
    id: -101,
    adi: "Süzme Çiçek Balı",
    aciklama:
      "Kazdağı eteklerinde, doğal çiçeklerden elde edilen katkısız süzme bal.",
    fiyat: 350,
    stokMiktari: 48,
    aktifMi: true,
    kategoriId: 1,
    kategoriAdi: "Bal ve Arı Ürünleri",
    saticiId: "demo-ari-vadi",
    saticiMagazaAdi: "Arı Vadi",
    saticiSehir: "Muğla",
    saticiIlce: "Köyceğiz",
    saticiDogrulanmis: true,
    ortalamaPuan: 4.9,
    toplamPuan: 628,
    toplamYorum: 128,
    toplamFavori: 210,
    yorumlar: [],
    puanlar: [],
    resimler: [{ id: 1, url: "/products/photo-yayla-bali.jpg" }],
    videolar: [],
  },
  {
    id: -102,
    adi: "Ezine Klasik Peynir",
    aciklama: "Tam yağlı beyaz peynir, serin zincirde günlük hazırlanır.",
    fiyat: 290,
    stokMiktari: 18,
    aktifMi: true,
    kategoriId: 2,
    kategoriAdi: "Süt Ürünleri",
    saticiId: "demo-kazdagi",
    saticiMagazaAdi: "Kazdağı Çiftliği",
    saticiSehir: "Çanakkale",
    saticiIlce: "Ezine",
    saticiDogrulanmis: true,
    ortalamaPuan: 4.8,
    toplamPuan: 460,
    toplamYorum: 96,
    toplamFavori: 162,
    yorumlar: [],
    puanlar: [],
    resimler: [{ id: 2, url: "/products/photo-tulum-peyniri.jpg" }],
    videolar: [],
  },
  {
    id: -103,
    adi: "Doğal Köy Yumurtası",
    aciklama: "Serbest gezen tavuklardan günlük toplanan 10'lu yumurta.",
    fiyat: 120,
    stokMiktari: 64,
    aktifMi: true,
    kategoriId: 3,
    kategoriAdi: "Yumurta",
    saticiId: "demo-gunesli",
    saticiMagazaAdi: "Güneşli Köy",
    saticiSehir: "Aydın",
    saticiIlce: "Söke",
    saticiDogrulanmis: true,
    ortalamaPuan: 4.9,
    toplamPuan: 810,
    toplamYorum: 210,
    toplamFavori: 240,
    yorumlar: [],
    puanlar: [],
    resimler: [{ id: 3, url: "/products/photo-koy-yumurtasi.jpg" }],
    videolar: [],
  },
  {
    id: -104,
    adi: "Pembe Domates",
    aciklama: "Seferihisar bahçelerinden günlük hasat edilen pembe domates.",
    fiyat: 45,
    stokMiktari: 30,
    aktifMi: true,
    kategoriId: 4,
    kategoriAdi: "Meyve ve Sebze",
    saticiId: "demo-seferihisar",
    saticiMagazaAdi: "Seferihisar Bahçesi",
    saticiSehir: "İzmir",
    saticiIlce: "Seferihisar",
    saticiDogrulanmis: true,
    ortalamaPuan: 4.7,
    toplamPuan: 350,
    toplamYorum: 75,
    toplamFavori: 132,
    yorumlar: [],
    puanlar: [],
    resimler: [{ id: 4, url: "/products/photo-tarla-domatesi.jpg" }],
    videolar: [],
  },
  {
    id: -105,
    adi: "Ahududu Reçeli",
    aciklama: "Dağ meyveleriyle düşük şekerli ev yapımı ahududu reçeli.",
    fiyat: 150,
    stokMiktari: 14,
    aktifMi: true,
    kategoriId: 6,
    kategoriAdi: "Reçel ve Marmelat",
    saticiId: "demo-dag-evi",
    saticiMagazaAdi: "Dağ Evi",
    saticiSehir: "Bolu",
    saticiIlce: "Mengen",
    saticiDogrulanmis: true,
    ortalamaPuan: 4.8,
    toplamPuan: 280,
    toplamYorum: 60,
    toplamFavori: 126,
    yorumlar: [],
    puanlar: [],
    resimler: [{ id: 5, url: "/products/photo-yayla-bali.jpg" }],
    videolar: [],
  },
  {
    id: -106,
    adi: "Kırmızı Mercimek",
    aciklama: "Konya ovasından yeni sezon kırmızı mercimek.",
    fiyat: 70,
    stokMiktari: 90,
    aktifMi: true,
    kategoriId: 5,
    kategoriAdi: "Bakliyat",
    saticiId: "demo-anadolu",
    saticiMagazaAdi: "Anadolu Tarlası",
    saticiSehir: "Konya",
    saticiIlce: "Karatay",
    saticiDogrulanmis: true,
    ortalamaPuan: 4.9,
    toplamPuan: 610,
    toplamYorum: 142,
    toplamFavori: 180,
    yorumlar: [],
    puanlar: [],
    resimler: [{ id: 6, url: "/products/photo-kocbasi-nohut.jpg" }],
    videolar: [],
  },
  {
    id: -107,
    adi: "Taze Ispanak",
    aciklama: "Sakarya üreticisinden sabah hasadı taze ıspanak.",
    fiyat: 30,
    stokMiktari: 24,
    aktifMi: true,
    kategoriId: 4,
    kategoriAdi: "Meyve ve Sebze",
    saticiId: "demo-yesil-bahce",
    saticiMagazaAdi: "Yeşil Bahçe",
    saticiSehir: "Sakarya",
    saticiIlce: "Serdivan",
    saticiDogrulanmis: true,
    ortalamaPuan: 4.6,
    toplamPuan: 175,
    toplamYorum: 38,
    toplamFavori: 92,
    yorumlar: [],
    puanlar: [],
    resimler: [{ id: 7, url: "/products/photo-tarla-domatesi.jpg" }],
    videolar: [],
  },
  {
    id: -108,
    adi: "Natürel Sızma Zeytinyağı",
    aciklama:
      "Erken hasat zeytinlerden soğuk sıkım yöntemiyle elde edilmiş zeytinyağı.",
    fiyat: 450,
    stokMiktari: 22,
    aktifMi: true,
    kategoriId: 4,
    kategoriAdi: "Doğal Ürünler",
    saticiId: "demo-ege",
    saticiMagazaAdi: "Ege Yöresi Çiftliği",
    saticiSehir: "Balıkesir",
    saticiIlce: "Ayvalık",
    saticiDogrulanmis: true,
    ortalamaPuan: 4.9,
    toplamPuan: 620,
    toplamYorum: 128,
    toplamFavori: 257,
    yorumlar: [],
    puanlar: [],
    resimler: [{ id: 8, url: "/products/photo-yayla-bali.jpg" }],
    videolar: [],
  },
];

const demoDemands: DemandDto[] = [
  {
    id: -201,
    aliciId: "demo-buyer",
    urunId: -103,
    urunAdi: "Köy Yumurtası",
    urunResimUrl: "/products/photo-koy-yumurtasi.jpg",
    urunFiyat: 120,
    saticiId: "demo-gunesli",
    saticiMagazaAdi: "Güneşli Köy",
    saticiSehir: "Aydın",
    saticiIlce: "Söke",
    miktar: 10,
    not: "Haftalık teslim için teklif bekleniyor.",
    durum: "ACIK",
    olusturmaTarihi: "2026-07-08T09:25:00Z",
    teklifler: [
      {
        id: -301,
        talepId: -201,
        saticiId: "demo-gunesli",
        saticiMagazaAdi: "Güneşli Köy",
        birimFiyat: 70,
        mesaj: "Günlük üretimden hazırlayabiliriz.",
        durum: "BEKLEMEDE",
        olusturmaTarihi: "2026-07-08T10:24:00Z",
      },
    ],
  },
  {
    id: -202,
    aliciId: "demo-buyer",
    urunId: -102,
    urunAdi: "Ezine Peyniri",
    urunResimUrl: "/products/photo-tulum-peyniri.jpg",
    urunFiyat: 290,
    saticiId: "demo-kazdagi",
    saticiMagazaAdi: "Kazdağı Çiftliği",
    saticiSehir: "Çanakkale",
    saticiIlce: "Ezine",
    miktar: 2,
    not: "Soğuk zincir bilgisi istendi.",
    durum: "ANLASILDI",
    olusturmaTarihi: "2026-07-07T13:10:00Z",
    teklifler: [
      {
        id: -302,
        talepId: -202,
        saticiId: "demo-kazdagi",
        saticiMagazaAdi: "Kazdağı Çiftliği",
        birimFiyat: 420,
        mesaj: "Vakumlu ve günlük üretim gönderebiliriz.",
        durum: "KABUL",
        olusturmaTarihi: "2026-07-07T14:04:00Z",
      },
    ],
  },
];

const demoConversations: ChatConversationDto[] = [
  {
    userId: "demo-kazdagi",
    userName: "Kazdağı Çiftliği",
    email: "info@kazdagi.local",
    lastMessage: "Tahmini teslimat tarihini paylaştık.",
    lastSenderId: "demo-kazdagi",
    lastMessageAt: "2026-07-08T10:29:00Z",
    unreadCount: 2,
  },
  {
    userId: "demo-ege",
    userName: "Ege Yöresi Çiftliği",
    email: "ege@local",
    lastMessage: "Zeytinyağı için yeni teklif hazır.",
    lastSenderId: "demo-ege",
    lastMessageAt: "2026-07-08T09:15:00Z",
    unreadCount: 0,
  },
];

const demoMessages: ChatMessageDto[] = [
  {
    id: -401,
    senderId: "demo-kazdagi",
    receiverId: "demo-buyer",
    message: "Merhaba, talebiniz için teşekkürler. Ezine peynirimiz günlük üretiliyor.",
    sentAt: "2026-07-08T10:25:00Z",
    readAt: null,
    isMine: false,
  },
  {
    id: -402,
    senderId: "demo-buyer",
    receiverId: "demo-kazdagi",
    message: "Merhaba, peyniri vakumlu gönderebiliyor musunuz?",
    sentAt: "2026-07-08T10:26:00Z",
    readAt: "2026-07-08T10:26:30Z",
    isMine: true,
  },
  {
    id: -403,
    senderId: "demo-kazdagi",
    receiverId: "demo-buyer",
    message: "Evet, vakumlu ve soğuk zincir ile gönderiyoruz.",
    sentAt: "2026-07-08T10:27:00Z",
    readAt: null,
    isMine: false,
  },
];

const demoReviews = [
  {
    name: "Zeynep A.",
    date: "14 Mayıs 2026",
    rating: 5,
    text: "Gerçekten harika bir bal. Kokusu ve tadı çok doğal.",
    helpful: 12,
  },
  {
    name: "Mehmet T.",
    date: "11 Mayıs 2026",
    rating: 5,
    text: "Kıvamı ve aroması mükemmel. Sabahları tüketmek için birebir.",
    helpful: 8,
  },
  {
    name: "Elif K.",
    date: "08 Mayıs 2026",
    rating: 4,
    text: "Lezzeti çok iyi, biraz daha yoğun kıvamlı olmasını isterdim.",
    helpful: 4,
  },
];

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

function productImage(product: ProductDto) {
  const firstImage = product.resimler?.[0]?.url?.trim();
  if (!firstImage) return productPlaceholderImage;
  if (firstImage.startsWith("/products/")) return firstImage;
  return mediaUrl(firstImage) || productPlaceholderImage;
}

function demandImage(demand: DemandDto) {
  const image = demand.urunResimUrl?.trim();
  if (!image) return productPlaceholderImage;
  if (image.startsWith("/products/")) return image;
  return mediaUrl(image) || productPlaceholderImage;
}

function sellerCoverImage(seller: FeaturedSellerDto) {
  const image = seller.kapakResimUrl?.trim();
  if (!image) return productPlaceholderImage;
  if (image.startsWith("/products/")) return image;
  return mediaUrl(image) || productPlaceholderImage;
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

function shortDate(value?: string | null) {
  if (!value) return "";
  try {
    return formatShortDate(value);
  } catch {
    return value;
  }
}

function demoFeaturedSellers(products: ProductDto[]): FeaturedSellerDto[] {
  const seen = new Set<string>();
  return products
    .filter((product) => {
      if (seen.has(product.saticiId)) return false;
      seen.add(product.saticiId);
      return true;
    })
    .slice(0, 4)
    .map((product, index) => ({
      kullaniciId: product.saticiId,
      magazaAdi: product.saticiMagazaAdi ?? "Yöremio satıcısı",
      dogrulanmisSatici: product.saticiDogrulanmis,
      urunSayisi: 24 + index * 7,
      ortalamaPuan: product.ortalamaPuan,
      toplamPuan: product.toplamPuan,
      toplamYorum: product.toplamYorum,
      toplamFavori: product.toplamFavori,
      guvenSkoru: 88 + index,
      sehir: product.saticiSehir,
      ilce: product.saticiIlce,
      kapakResimUrl: productImage(product),
    }));
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
  const [categories, setCategories] = useState<CategoryDto[]>(demoCategories);
  const [productsPage, setProductsPage] = useState<Paginated<ProductDto>>(
    emptyProductsResult(),
  );
  const [marketState, setMarketState] = useState<LoadState>("idle");
  const [marketError, setMarketError] = useState<string | null>(null);
  const [activeProductId, setActiveProductId] = useState<number | null>(null);
  const [productDetail, setProductDetail] = useState<ProductDto | null>(null);
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
    : fallbackProductSorts;

  const visibleProducts = productsPage.items.length > 0 ? productsPage.items : demoProducts;
  const visibleCategories = categories.length > 0 ? categories : demoCategories;
  const visibleSellers =
    featuredSellers.length > 0 ? featuredSellers : demoFeaturedSellers(visibleProducts);
  const visibleFavoriteProducts =
    favoriteProducts.length > 0 ? favoriteProducts : visibleProducts.slice(0, 8);
  const visibleRecommendedProducts =
    recommendedProducts.length > 0 ? recommendedProducts : visibleProducts.slice(0, 5);
  const visibleBuyerDemands = buyerDemands.length > 0 ? buyerDemands : demoDemands;
  const visibleSellerProducts =
    sellerProducts.length > 0 ? sellerProducts : visibleProducts.slice(0, 6);
  const visibleSellerDemands = sellerDemands.length > 0 ? sellerDemands : demoDemands;
  const visibleConversations =
    conversations.length > 0 ? conversations : demoConversations;
  const visibleMessages = chatMessages.length > 0 ? chatMessages : demoMessages;

  const selectedProduct =
    productDetail ??
    visibleProducts.find((product) => product.id === activeProductId) ??
    visibleProducts[0] ??
    null;

  const selectedCategory =
    categoryId === "all"
      ? undefined
      : visibleCategories.find((category) => category.id === categoryId);

  const navigate = useCallback((nextScreen: Screen) => {
    setScreen(nextScreen);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 10);
  }, []);

  const showToast = useCallback((message: string, kind: ToastKind) => {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 4200);
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
    setNotificationUnreadCount(0);
    setChatTargetId("");
    showToast("Oturum kapatıldı.", "info");
    navigate("home");
  }, [navigate, showToast]);

  const handleAuthenticated = useCallback(
    (user: AuthState) => {
      setAuthUser(user);
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
    const token = window.localStorage.getItem("yoremio-token");
    if (!token) return;

    let ignore = false;

    yoremioApi
      .me(token)
      .then((user) => {
        if (!ignore) setAuthUser({ ...user, token });
      })
      .catch(() => {
        if (!ignore) {
          window.localStorage.removeItem("yoremio-token");
          window.localStorage.removeItem("yoremio-user");
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
          if (!ignore) setCategories(demoCategories);
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
        setActiveProductId((current) => current ?? demoProducts[0].id);
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

    if (activeProductId === null || activeProductId < 0) return;

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
    if (!selectedProduct?.saticiId || selectedProduct.id < 0) {
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
    if (!authUser || !chatTargetId || chatTargetId.startsWith("demo")) {
      setChatMessages([]);
      return;
    }

    let ignore = false;
    yoremioApi
      .messages(authUser.token, chatTargetId)
      .then((pageResult) => {
        if (!ignore) setChatMessages(pageResult.items);
      })
      .catch((error) => {
        if (!ignore) showToast(apiErrorMessage(error), "error");
      });

    return () => {
      ignore = true;
    };
  }, [authUser, chatTargetId, showToast]);

  const selectProduct = useCallback(
    (product: ProductDto, nextScreen: Screen = "discover") => {
      setActiveProductId(product.id);
      setProductDetail(product.id < 0 ? product : null);
      navigate(nextScreen);
    },
    [navigate],
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
      if (!requireRole("ALICI") || product.id < 0 || !authUser) return;

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
      if (!requireRole("ALICI") || product.id < 0 || !authUser) return;
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

  const sendChatMessage = useCallback(
    async (receiverId: string, message: string) => {
      if (!authUser) {
        navigate("login");
        return;
      }
      if (!receiverId || receiverId.startsWith("demo")) {
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
    async (values: ProductFormValues, urunId?: number) => {
      if (!requireRole("SATICI") || !authUser) return;
      setActionStatus("product-save");
      try {
        await yoremioApi.upsertProduct(authUser.token, values, urunId);
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
          setChatTargetId(product.saticiId);
          navigate("buyer");
        }}
      />
    );
  } else if (screen === "buyer") {
    content = (
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
      />
    );
  } else if (screen === "seller") {
    content = (
      <SellerDashboard
        {...appProps}
        profile={sellerProfile}
        products={visibleSellerProducts}
        demands={visibleSellerDemands}
        dashboard={sellerDashboard}
        onSelectProduct={selectProduct}
      />
    );
  } else if (screen === "seller-product") {
    content = (
      <SellerProductScreen
        {...appProps}
        categories={visibleCategories}
        products={visibleSellerProducts}
        actionStatus={actionStatus}
        onSave={handleProductSave}
      />
    );
  } else if (screen === "seller-profile") {
    content = (
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
    content = (
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
        product={selectedProduct ?? visibleProducts[0]}
        actionStatus={actionStatus}
        showToast={showToast}
      />
    );
  } else if (screen === "states") {
    content = <GlobalStatesScreen {...appProps} />;
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
        onCategoryChange={setCategoryId}
        onSelectProduct={selectProduct}
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
  onCategoryChange,
  onSelectProduct,
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
  onCategoryChange: (value: number | "all") => void;
  onSelectProduct: (product: ProductDto, screen?: Screen) => void;
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {products.slice(0, 7).map((product) => (
            <HomeProductCard
              key={product.id}
              product={product}
              isFavorite={favoriteIds.has(product.id)}
              onSelect={() => onSelectProduct(product, "discover")}
              onToggleFavorite={() => onToggleFavorite(product)}
            />
          ))}
        </div>

        <FeaturedSellerRow sellers={sellers} products={products} onSelectProduct={onSelectProduct} />
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
            onClick={() => onNavigate(authUser ? "buyer" : "login")}
          />
          <IconButton label="Favoriler" icon={Heart} onClick={() => onNavigate("buyer")} />
          <IconButton
            label="Bildirimler"
            icon={Bell}
            badge={notificationUnreadCount}
            onClick={() => onNavigate("states")}
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
  onSelect,
  onToggleFavorite,
}: {
  product: ProductDto;
  isFavorite: boolean;
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
            className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-white text-foreground shadow-sm"
            title="Favori"
          >
            <Heart className={cn("size-4", isFavorite && "fill-red-600 text-red-600")} aria-hidden />
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
  onSelectProduct,
}: {
  sellers: FeaturedSellerDto[];
  products: ProductDto[];
  onSelectProduct: (product: ProductDto, screen?: Screen) => void;
}) {
  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-black text-brand-brown">Öne çıkan satıcılar</h2>
        <Button variant="ghost" size="sm" type="button">
          Tümünü gör
          <ChevronRight aria-hidden />
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {sellers.slice(0, 4).map((seller) => {
          const product = products.find((item) => item.saticiId === seller.kullaniciId);
          return (
            <button
              key={seller.kullaniciId}
              type="button"
              onClick={() => {
                if (product) onSelectProduct(product, "discover");
              }}
              className="relative min-h-[142px] overflow-hidden rounded-lg border border-border bg-ink text-left text-white shadow-[0_8px_22px_rgba(16,24,40,0.1)]"
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
            <HeaderTextButton icon={Heart} label="Favoriler" onClick={() => onNavigate("buyer")} />
            <HeaderTextButton icon={MessageCircle} label="Mesajlar" onClick={() => onNavigate("buyer")} />
            <IconButton
              icon={Bell}
              label="Bildirimler"
              badge={notificationUnreadCount}
              onClick={() => onNavigate("states")}
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
              <Button variant="outline" size="icon" title="Grid">
                <LayoutDashboard aria-hidden />
              </Button>
              <Button variant="outline" size="icon" title="Liste">
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
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <DiscoveryProductCard
                  key={product.id}
                  product={product}
                  active={selectedProduct?.id === product.id}
                  isFavorite={favoriteIds.has(product.id)}
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

      <Button className="mt-5 w-full" onClick={onClear}>
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
  onSelect,
  onToggleFavorite,
}: {
  product: ProductDto;
  active: boolean;
  isFavorite: boolean;
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
            className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-white shadow-sm"
            title="Favori"
          >
            <Heart className={cn("size-4", isFavorite && "fill-red-600 text-red-600")} aria-hidden />
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

  return (
    <div className="sticky top-[92px] space-y-5">
      <div className="relative aspect-[1.44] overflow-hidden rounded-lg bg-muted">
        <Image
          src={productImage(product)}
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
          className="absolute right-4 top-4 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-black shadow-md"
        >
          <Heart className={cn("size-4", isFavorite && "fill-red-600 text-red-600")} aria-hidden />
          Favori
        </button>
        <button className="absolute left-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white shadow" type="button">
          <ChevronLeft aria-hidden />
        </button>
        <button className="absolute right-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white shadow" type="button">
          <ChevronRight aria-hidden />
        </button>
      </div>
      <div className="scroll-shelf flex gap-3 overflow-x-auto">
        {gallery.slice(0, 6).map((image) => (
          <div key={image.id} className="relative size-16 shrink-0 overflow-hidden rounded-md border border-primary bg-muted">
            <Image src={image.url.startsWith("/products/") ? image.url : mediaUrl(image.url)} alt="" fill sizes="64px" className="object-cover" />
          </div>
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
  onAuthenticated: (user: AuthState) => void;
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
        // Session bootstrap will retry /me on the next load.
      }

      onAuthenticated(fullUser);
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
  wide = false,
}: {
  children: ReactNode;
  side: ReactNode;
  actionLabel: string;
  onAction: () => void;
  wide?: boolean;
}) {
  return (
    <main className="min-h-screen bg-white">
      <header className="flex min-h-[88px] items-center justify-between border-b border-border px-5 sm:px-8">
        <button type="button" onClick={onAction}>
          <BrandLogo />
        </button>
        <Button variant="outline" onClick={onAction}>
          <UserRound aria-hidden />
          {actionLabel}
        </Button>
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
      <div className="mt-5 grid grid-cols-5 gap-3 rounded-lg border border-border bg-white p-3 shadow-[0_16px_34px_rgba(16,24,40,0.08)]">
        {products.slice(0, 5).map((product) => (
          <MiniProduct key={product.id} product={product} />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <PreviewPanel title="Talepler">
          {demoDemands.map((demand) => (
            <DemandLine key={demand.id} demand={demand} />
          ))}
        </PreviewPanel>
        <PreviewPanel title="Mesajlar">
          {demoConversations.map((conversation) => (
            <ConversationLine key={conversation.userId} conversation={conversation} />
          ))}
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
              <Button size="sm">
                <Plus aria-hidden />
                Yeni ürün
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {products.slice(0, 4).map((product) => (
                <MiniProduct key={product.id} product={product} />
              ))}
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              <PreviewPanel title="Gelen talepler">
                {demoDemands.map((demand) => <DemandLine key={demand.id} demand={demand} />)}
              </PreviewPanel>
              <PreviewPanel title="Teklifler">
                {demoDemands.map((demand) => <DemandLine key={demand.id} demand={demand} />)}
              </PreviewPanel>
              <PreviewPanel title="Satıcıya yaz">
                <div className="space-y-2 text-sm">
                  <div className="rounded-md border border-border bg-white p-3">
                    Merhaba, ürün teslim tarihi nedir?
                  </div>
                  <div className="ml-auto rounded-md bg-secondary p-3 text-secondary-foreground">
                    Yarın kargoya verebilirim.
                  </div>
                </div>
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
  const [phone, setPhone] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  const devVerificationUrl =
    bootstrap?.features.devVerificationInboxEnabled &&
    bootstrap.verification.devVerificationInboxUrl
      ? `${API_BASE_URL}${bootstrap.verification.devVerificationInboxUrl}`
      : null;

  const verify = async (kind: "email" | "phone") => {
    setStatus("loading");
    try {
      if (kind === "email") await yoremioApi.confirmEmail(email.trim(), emailCode.trim());
      else await yoremioApi.confirmPhone(email.trim(), phoneCode.trim());
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
        <Button variant="ghost">
          <CircleHelp aria-hidden />
          Yardıma ihtiyacın varsa
        </Button>
      </header>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-black">Hesabını doğrula</h1>
          <p className="mt-2 text-muted-foreground">
            Email veya telefonuna gönderilen kodu gir.
          </p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="overflow-hidden rounded-lg border border-border bg-white shadow-[0_12px_36px_rgba(16,24,40,0.08)]">
            <div className="grid border-b border-border md:grid-cols-2">
              <div className="border-b-2 border-primary px-6 py-4 text-center font-black">
                <Mail className="mr-2 inline size-5 text-primary" aria-hidden />
                Email doğrulama
              </div>
              <div className="px-6 py-4 text-center font-black text-muted-foreground">
                <Phone className="mr-2 inline size-5" aria-hidden />
                Telefon doğrulama
              </div>
            </div>
            <div className="grid gap-0 md:grid-cols-2">
              <VerificationColumn
                icon={Mail}
                title="Email doğrulama"
                description="Email adresine gönderilen 6 haneli kodu gir."
                contactLabel="E-posta"
                contactValue={email}
                onContactChange={setEmail}
                code={emailCode}
                onCodeChange={setEmailCode}
                onSubmit={() => verify("email")}
                onResend={resend}
                disabled={status === "loading"}
              />
              <VerificationColumn
                icon={Phone}
                title="Telefon doğrulama"
                description="Telefonuna gönderilen 6 haneli kodu gir."
                contactLabel="Telefon numarası"
                contactValue={phone}
                onContactChange={setPhone}
                code={phoneCode}
                onCodeChange={setPhoneCode}
                onSubmit={() => verify("phone")}
                onResend={resend}
                disabled={status === "loading"}
              />
            </div>
          </div>
          <div className="space-y-4">
            <StatusBox kind="warning" title="Bekliyor" text="Email doğrulama kodu girilmeli." />
            <StatusBox kind="success" title="Doğrulandı" text="Telefon doğrulaması tamamlandı." />
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
}) {
  const displayName = authUser ? accountName(authUser, sellerProfile) : "Ayşe Yılmaz";

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
        <PanelHeader title="Favoriler" action="Tümünü gör" />
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

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1.35fr]">
          <Panel title="Taleplerim" action="Tümünü gör">
            <DemandTable demands={demands} />
          </Panel>
          <Panel title="Teklifler" action="Tümünü gör">
            <OfferCards demands={demands} />
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {products.map((product) => (
              <MiniProductButton key={product.id} product={product} onClick={() => onSelectProduct(product, "discover")} />
            ))}
          </div>
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
}) {
  const totalProducts = dashboard?.totalProducts ?? products.length;
  const activeProducts = dashboard?.activeProducts ?? products.filter((product) => product.aktifMi !== false).length;
  const openDemands = dashboard?.openDemands ?? demands.filter((demand) => demand.durum === "ACIK").length;
  const pendingOffers = dashboard?.pendingOffers ?? demands.reduce((sum, demand) => sum + demand.teklifler.filter((offer) => offer.durum === "BEKLEMEDE").length, 0);

  return (
    <DashboardFrame
      variant="dark"
      title="Satıcı Paneli"
      subtitle={`Mağaza: ${profile?.magazaAdi ?? "Ahmetin Bahçesi"}`}
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
            <MetricCard icon={ClipboardList} label="Anlaşılan talep" value={String(dashboard?.agreedDemands ?? 8)} helper="Bu ay" />
            <MetricCard icon={Inbox} label="Gelen talepler" value={String(openDemands)} helper="Bekleyen" tone="amber" />
            <MetricCard icon={Tag} label="Teklifler" value={String(pendingOffers)} helper="Bekleyen" tone="lime" />
          </div>

          <Panel
            title="Ürünlerim"
            action="Yeni ürün"
            onAction={() => onNavigate("seller-product")}
          >
            <SellerProductTable products={products} onSelectProduct={onSelectProduct} />
          </Panel>

          <Panel title="Medya yükle">
            <div className="grid gap-3 md:grid-cols-[120px_repeat(4,1fr)_220px]">
              <button type="button" onClick={() => onNavigate("seller-product")} className="grid min-h-28 place-items-center rounded-lg border border-dashed border-input bg-white text-center text-sm font-bold text-muted-foreground">
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
          <Panel title="Gelen talepler" action="Tümünü gör">
            <div className="space-y-3">
              {demands.slice(0, 4).map((demand) => (
                <DemandMediaLine key={demand.id} demand={demand} />
              ))}
            </div>
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
  products,
  actionStatus,
  onSave,
}: {
  authUser: AuthState | null;
  sellerProfile?: SellerProfileDto | null;
  notificationUnreadCount: number;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  categories: CategoryDto[];
  products: ProductDto[];
  actionStatus: string | null;
  onSave: (values: ProductFormValues, urunId?: number) => void;
}) {
  const first = products[0] ?? demoProducts[0];
  const [adi, setAdi] = useState(first.adi);
  const [aciklama, setAciklama] = useState(first.aciklama ?? "");
  const [fiyat, setFiyat] = useState(String(first.fiyat));
  const [stok, setStok] = useState(String(first.stokMiktari));
  const [kategoriId, setKategoriId] = useState(first.kategoriId);
  const [active, setActive] = useState(first.aktifMi !== false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({
      adi,
      aciklama,
      fiyat: Number(fiyat),
      stokMiktari: Number(stok),
      kategoriId,
    });
  };

  const previewProduct: ProductDto = {
    ...first,
    adi,
    aciklama,
    fiyat: Number(fiyat) || first.fiyat,
    stokMiktari: Number(stok) || first.stokMiktari,
    kategoriId,
    kategoriAdi: categories.find((category) => category.id === kategoriId)?.adi ?? first.kategoriAdi,
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
                <select id="product-category" value={kategoriId} onChange={(event) => setKategoriId(Number(event.target.value))} className="h-11 w-full rounded-md border border-input bg-white px-3 text-sm font-semibold outline-none">
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
              <MediaGrid title="Resimler" icon={ImagePlus} products={products} />
              <MediaGrid title="Videolar" icon={Video} products={products.slice(0, 1)} video />
              <div className="flex gap-3 border-t border-border pt-5">
                <Button disabled={actionStatus === "product-save"} className="min-w-40">
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
  const [magazaAdi, setMagazaAdi] = useState(profile?.magazaAdi ?? "Yeşil Vadi Çiftliği");
  const [adres, setAdres] = useState(profile?.adres ?? "Yeşil Vadi Mah. Tarım Sok. No: 12");
  const [sehir, setSehir] = useState(profile?.sehir ?? "Bursa");
  const [ilce, setIlce] = useState(profile?.ilce ?? "Yenişehir");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber ?? "0532 123 45 67");
  const [status, setStatus] = useState<"idle" | "loading">("idle");

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
        ["Mesajlar", MessageCircle, "buyer"],
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
              <Input value={profile?.vergiNo ?? "1234567890"} disabled />
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
              <Input value={profile?.email ?? authUser?.email ?? "info@yesilvadi.com"} disabled />
            </ProfileRow>
            <ProfileRow label="Durum">
              <Badge variant={profile?.aktifMi === false ? "outline" : "green"}>{profile?.aktifMi === false ? "Pasif" : "Aktif"}</Badge>
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
                <p className="mt-1 text-muted-foreground">Hesap durumu: <Badge variant="green">Aktif</Badge></p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="text-xl font-black">Güven skoru</h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-[160px_1fr]">
              <TrustDial large score={dashboard?.trustScore ?? 92} />
              <div className="space-y-5">
                <ProgressLine label="Profil tamamlama" value={85} />
                <p className="text-sm font-semibold text-muted-foreground">Tamamlanan alanlar 11 / 13</p>
              </div>
            </div>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MiniMetric icon={Package} label="Ürün sayısı" value={String(dashboard?.totalProducts ?? 48)} />
            <MiniMetric icon={Check} label="Aktif ürün" value={String(dashboard?.activeProducts ?? 41)} />
            <MiniMetric icon={AlertCircle} label="Stokta yok" value={String(dashboard?.outOfStockProducts ?? 3)} tone="red" />
            <MiniMetric icon={Heart} label="Favori" value={String(dashboard?.totalFavorites ?? 138)} tone="red" />
            <MiniMetric icon={MessageCircle} label="Yorum" value={String(dashboard?.totalReviews ?? 27)} />
            <MiniMetric icon={Star} label="Puan" value={(dashboard?.averageRating ?? 4.7).toFixed(1)} tone="amber" />
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
            <MetricCard icon={Users} label="Toplam kullanıcı" value={String(dashboard?.totalUsers ?? "12.458")} />
            <MetricCard icon={Store} label="Satıcı" value={String(dashboard?.totalSellers ?? "2.146")} />
            <MetricCard icon={UserRound} label="Alıcı" value={String(dashboard?.totalBuyers ?? "10.312")} />
            <MetricCard icon={Package} label="Ürün" value={String(dashboard?.totalProducts ?? "8.765")} />
            <MetricCard icon={ClipboardList} label="Talep" value={String(dashboard?.totalDemands ?? "1.243")} tone="amber" />
            <MetricCard icon={Star} label="Yorum" value={String(dashboard?.totalReviews ?? "2.876")} tone="amber" />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <StatStrip label="Toplam ürün" value={String(dashboard?.totalProducts ?? "8.765")} />
            <StatStrip label="Aktif ürün" value={String(dashboard?.activeProducts ?? "6.892")} tone="green" />
            <StatStrip label="Pasif ürün" value={String(dashboard?.inactiveProducts ?? "1.873")} tone="red" />
            <StatStrip label="Toplam talep" value={String(dashboard?.totalDemands ?? "1.243")} />
            <StatStrip label="Açık talep" value={String(dashboard?.openDemands ?? "476")} tone="amber" />
            <StatStrip label="Anlaşılan talep" value={String(dashboard?.agreedDemands ?? "767")} tone="green" />
          </div>
          <Panel title="Kategoriler" action="Yeni kategori">
            <CategoryTable categories={categories} onDelete={onCategoryDelete} />
          </Panel>
        </div>
        <CategoryEditor
          categories={categories}
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
  actionStatus,
  showToast,
}: {
  authUser: AuthState | null;
  sellerProfile?: SellerProfileDto | null;
  notificationUnreadCount: number;
  query: string;
  setQuery: (value: string) => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  product: ProductDto;
  actionStatus: string | null;
  showToast: (message: string, kind: ToastKind) => void;
}) {
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const reviews = product.yorumlar.length
    ? product.yorumlar.map((comment) => ({
        name: comment.kullaniciAdi ?? "Yöremio kullanıcısı",
        date: shortDate(comment.tarih),
        rating: Math.round(product.ortalamaPuan),
        text: comment.icerik,
        helpful: 0,
      }))
    : demoReviews;

  const submitReview = () => {
    if (!authUser) {
      showToast("Yorum için alıcı girişi gerekli.", "info");
      onNavigate("login");
      return;
    }
    showToast("Yorum akışı anlaşılmış talep sonrası aktiftir.", "info");
  };

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
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="relative aspect-square overflow-hidden rounded-md border border-border">
                  <Image src={productImage(product)} alt="" fill sizes="72px" className="object-cover" />
                </div>
              ))}
            </div>
            <div className="relative aspect-[1.35] overflow-hidden rounded-lg bg-muted">
              <Image src={productImage(product)} alt={product.adi} fill sizes="430px" className="object-cover" />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black">{product.adi}</h1>
            <p className="text-muted-foreground">{product.kategoriAdi ?? "Yerel ürün"} · Soğuk saklama</p>
            <div className="flex items-center gap-3">
              <div className="relative size-12 overflow-hidden rounded-full">
                <Image src={productImage(product)} alt="" fill sizes="48px" className="object-cover" />
              </div>
              <div>
                <p className="font-black">{sellerName(product)}</p>
                <Badge variant="green">
                  <ShieldCheck className="size-3.5" aria-hidden />
                  Doğrulanmış satıcı
                </Badge>
              </div>
            </div>
            <button type="button" className="flex items-center gap-3 font-bold">
              <Stars value={product.ortalamaPuan} />
              {product.ortalamaPuan.toFixed(1)} ({product.toplamYorum})
            </button>
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4" aria-hidden />
              {productLocation(product)}
            </p>
          </div>
          <Card className="overflow-hidden border-amber-200 bg-amber-50/55 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black text-primary">
                  <Check aria-hidden />
                  Talep anlaşıldı
                </h2>
                <p className="mt-4 text-sm leading-7">
                  Talep: #T-1254<br />
                  Ürün: {product.adi}<br />
                  Miktar: 2 kg<br />
                  Anlaşma tarihi: 12 Mayıs 2026
                </p>
              </div>
              <div className="relative size-28 shrink-0 overflow-hidden rounded-md">
                <Image src={productImage(product)} alt="" fill sizes="112px" className="object-cover" />
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-6 border-b border-border">
          <div className="flex gap-8 text-base font-bold">
            <button className="border-b-2 border-primary px-5 py-4 text-primary" type="button">
              Yorumlar
            </button>
            <button className="px-5 py-4" type="button">Puanlar</button>
            <button className="px-5 py-4" type="button">Açıklama</button>
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
              <RatingBreakdown />
              <div className="grid place-items-center border-t border-border pt-4 text-center lg:border-l lg:border-t-0 lg:pt-0">
                <div>
                  <p className="text-sm text-muted-foreground">Toplam yorum</p>
                  <p className="text-4xl font-black">{product.toplamYorum || 128}</p>
                  <MessageCircle className="mx-auto mt-2 size-8 text-muted-foreground" aria-hidden />
                </div>
              </div>
            </Card>
            <div className="space-y-3">
              {reviews.map((review) => (
                <ReviewCard key={`${review.name}-${review.date}`} review={review} product={product} />
              ))}
            </div>
          </div>

          <Card className="p-5">
            <h2 className="text-xl font-black">Yorum yaz</h2>
            <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950">
              <p className="font-black">Anlaşılmış talep gerekli</p>
              <p className="mt-1">Yorum yazabilmek için bu ürün için satıcı ile anlaşılmış talebin olmalı.</p>
            </div>
            <div className="mt-5">
              <p className="font-bold">Puan ver</p>
              <div className="mt-2 flex gap-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <button key={index} type="button" onClick={() => setRating(index + 1)}>
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
                className="min-h-28 w-full rounded-md border border-input px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
              />
            </Field>
            <Button className="mt-4 w-full" disabled={actionStatus === "review"} onClick={submitReview}>
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
}: {
  authUser: AuthState | null;
  sellerProfile?: SellerProfileDto | null;
  notificationUnreadCount: number;
  query: string;
  setQuery: (value: string) => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}) {
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
      <section className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-black">Boş durum</h1>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <StateCard
            image="/products/photo-yayla-bali.jpg"
            title="Favori ürün yok"
            text="Hoşuna giden ürünleri favorilere ekleyebilirsin."
            action="Ürünlere git"
            onAction={() => onNavigate("discover")}
          />
          <StateCard
            image="/hero-market-1600.jpg"
            title="İlk ürününü ekle"
            text="Satıcı profilini tamamla ve ilk ürününü alıcılarla buluştur."
            action="Ürün ekle"
            onAction={() => onNavigate("seller-product")}
          />
        </div>
        <h2 className="mt-6 text-2xl font-black">Hata durumu</h2>
        <div className="mt-4 grid gap-5 lg:grid-cols-3">
          <ErrorState icon={LockKeyhole} title="Yetkin yok" text="Bu sayfaya erişim için yetkin bulunmuyor." traceId="9f8a7b6c-3d21-4e2a-a1d7-7b8e9c0f1234" />
          <ErrorState icon={RefreshCw} title="Çok fazla istek" text="Kısa süre içinde çok fazla istek gönderdin." traceId="b2c3d4e5-f678-4a1b-b2c3-6d7e8f9a0b12" tone="amber" />
          <Card className="p-5">
            <h3 className="text-lg font-black">Form - Doğrulama hatası</h3>
            <div className="mt-4 space-y-4">
              <InvalidField label="E-posta" value="ornekaposta" message="Geçerli bir e-posta adresi giriniz." />
              <InvalidField label="Telefon" value="53212345" message="Telefon numarası en az 10 haneli olmalıdır." />
              <InvalidField label="Satıcı adı" value="" message="Satıcı adı boş geçilemez." />
              <div className="rounded-md border border-dashed border-input bg-muted p-3 font-mono text-sm">
                Doğrulama hatası<br />
                traceId: 3e7f2a1d-9b4c-4d8e-9a1b-c2d3e4f5a6b7
              </div>
            </div>
          </Card>
        </div>
        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
          <p className="font-black">Boş durumlar kullanıcıya yol gösterir; hatalar ise traceId ile destek akışına bağlanır.</p>
        </div>
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
            "flex min-h-screen flex-col border-r border-border px-4 py-5",
            dark ? "bg-[linear-gradient(165deg,#006b35,#00382b)] text-white" : "bg-white text-foreground",
          )}
        >
          <button type="button" onClick={() => onNavigate("home")} className="mb-8">
            <BrandLogo inverse={dark} />
          </button>
          <nav className="space-y-2">
            {navItems.map(([label, Icon, screen], index) => (
              <button
                key={`${label}-${index}`}
                type="button"
                onClick={() => onNavigate(screen)}
                className={cn(
                  "flex h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-base font-bold transition",
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
                {label.includes("talep") || label.includes("Teklif") || label.includes("Mesaj") ? (
                  <span className={cn("rounded-full px-2 py-0.5 text-xs", dark ? "bg-white/16" : "bg-secondary text-primary")}>
                    {label.includes("Mesaj") ? 2 : label.includes("Teklif") ? 5 : 12}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
          <div className="mt-auto space-y-2 border-t border-current/15 pt-5">
            <button
              type="button"
              onClick={() => onNavigate("states")}
              className={cn("flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-bold", dark ? "text-white/82 hover:bg-white/10" : "hover:bg-muted")}
            >
              <CircleHelp className="size-4" aria-hidden />
              Yardım
            </button>
            <button
              type="button"
              onClick={authUser ? onLogout : () => onNavigate("login")}
              className={cn("flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-bold", dark ? "text-white/82 hover:bg-white/10" : "hover:bg-muted")}
            >
              <LogOut className="size-4" aria-hidden />
              {authUser ? "Çıkış yap" : "Giriş yap"}
            </button>
          </div>
        </aside>
        <section className="min-w-0">
          <header className="flex min-h-[78px] items-center justify-between gap-4 border-b border-border bg-white px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Menu aria-hidden />
              </Button>
              <div>
                <h1 className="text-2xl font-black tracking-normal">{title}</h1>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IconButton icon={Bell} label="Bildirimler" badge={notificationUnreadCount || 3} onClick={() => onNavigate("states")} />
              <IconButton icon={MessageCircle} label="Mesajlar" badge={2} onClick={() => onNavigate("buyer")} />
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
      <button type="button" onClick={onLogout} className="grid size-11 place-items-center rounded-full bg-primary text-sm font-black text-white">
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
    <button type="button" onClick={onClick} className="hidden items-center gap-2 text-sm font-bold lg:flex">
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
        {action ? (
          <button type="button" onClick={onAction} className="text-sm font-bold text-primary">
            {action}
          </button>
        ) : null}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function PanelHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-black text-primary">{title}</h2>
      {action ? <button className="text-sm font-bold text-primary" type="button">{action}</button> : null}
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
  onSelectProduct,
}: {
  products: ProductDto[];
  onSelectProduct: (product: ProductDto, screen?: Screen) => void;
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
            <th className="px-3 py-3">Görüntülenme</th>
            <th className="px-3 py-3">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
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
              <td className="px-3 py-3">{(1245 + index * 263).toLocaleString("tr-TR")}</td>
              <td className="px-3 py-3">
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" title="Düzenle" onClick={() => onSelectProduct(product, "seller-product")}>
                    <Edit3 aria-hidden />
                  </Button>
                  <Button variant="outline" size="icon" title="Kopyala">
                    <Package aria-hidden />
                  </Button>
                  <Button variant="outline" size="icon" title="Sil" className="text-red-600">
                    <Trash2 aria-hidden />
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
  const score = dashboard?.trustScore ?? 72;

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
        {["Doğrulama", "Mağaza bilgileri", "İletişim bilgileri", "Ürün yükleme"].map((item, index) => (
          <div key={item} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Check className={cn("size-4", index < 3 ? "text-primary" : "text-amber-600")} aria-hidden />
              {item}
            </span>
            <span className="font-semibold text-muted-foreground">{index < 3 ? "Tamamlandı" : "6 / 10"}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function DemandTable({ demands }: { demands: DemandDto[] }) {
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

function OfferCards({ demands }: { demands: DemandDto[] }) {
  return (
    <div className="space-y-3">
      {demands.slice(0, 3).map((demand) => {
        const offer = demand.teklifler[0];
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
              <Button size="sm">Kabul et</Button>
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

  return (
    <div className="grid min-h-[560px] grid-rows-[auto_1fr_auto] overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button type="button" className="grid size-9 place-items-center rounded-full hover:bg-muted">
            <ChevronLeft aria-hidden />
          </button>
          <div>
            <p className="font-black">{activeConversation?.userName ?? "Satıcı"}</p>
            <Badge variant="green">Doğrulanmış Satıcı</Badge>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <Menu aria-hidden />
        </Button>
      </div>
      <div className="space-y-3 overflow-y-auto bg-[#fbfcfa] p-4">
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
        {messages.map((message) => (
          <ChatBubble key={message.id} mine={message.isMine}>
            {message.message}
            <span className="mt-1 block text-[11px] opacity-70">{shortDate(message.sentAt)}</span>
          </ChatBubble>
        ))}
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
        <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Satıcıya yaz" />
        <Button disabled={actionStatus === "chat-send" || !currentTarget}>
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
  products,
  video = false,
}: {
  title: string;
  icon: LucideIcon;
  products: ProductDto[];
  video?: boolean;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {video ? "En fazla 3 video yükleyebilirsiniz." : "En fazla 10 görsel yükleyebilirsiniz."}
          </p>
        </div>
        <Button type="button" variant="outline">
          <UploadCloud aria-hidden />
          Medya yükle
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {products.slice(0, video ? 1 : 10).map((product) => (
          <div key={product.id} className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
            <Image src={productImage(product)} alt="" fill sizes="120px" className="object-cover" />
            {video ? (
              <span className="absolute inset-0 grid place-items-center bg-black/20 text-white">
                <Video className="size-8" aria-hidden />
              </span>
            ) : null}
            <button type="button" className="absolute right-1 top-1 grid size-7 place-items-center rounded-md bg-white text-red-600 shadow">
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
        ))}
        <button type="button" className="grid aspect-square place-items-center rounded-lg border border-dashed border-input text-sm font-bold text-muted-foreground">
          <Icon className="mb-2 size-7 text-muted-foreground" aria-hidden />
          {video ? "Video ekle" : "Görsel ekle"}
        </button>
      </div>
    </div>
  );
}

function CategoryEditor({
  categories,
  actionStatus,
  onSave,
}: {
  categories: CategoryDto[];
  actionStatus: string | null;
  onSave: (values: Omit<CategoryDto, "id">, id?: number) => void;
}) {
  const [selectedId, setSelectedId] = useState<number | "new">("new");
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
        <h2 className="text-2xl font-black">Yeni kategori</h2>
        <Button variant="ghost" size="icon">
          <X aria-hidden />
        </Button>
      </div>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ adi, aciklama }, selectedId === "new" ? undefined : selectedId);
        }}
      >
        <select
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value === "new" ? "new" : Number(event.target.value))}
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
          <Button type="button" variant="outline" onClick={() => setSelectedId("new")}>
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
  onDelete,
}: {
  categories: CategoryDto[];
  onDelete: (id: number) => void;
}) {
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
                  <Button variant="outline" size="sm" type="button">
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

function RatingBreakdown() {
  const rows = [
    [5, 104, 86],
    [4, 16, 28],
    [3, 6, 12],
    [2, 1, 3],
    [1, 1, 2],
  ];
  return (
    <div className="space-y-2">
      {rows.map(([rating, count, width]) => (
        <div key={rating} className="grid grid-cols-[32px_1fr_44px] items-center gap-3 text-sm">
          <span className="flex items-center gap-1 font-bold">
            {rating}
            <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
          </span>
          <span className="h-2 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-amber-400" style={{ width: `${width}%` }} />
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
  review: (typeof demoReviews)[number];
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

function StateCard({
  image,
  title,
  text,
  action,
  onAction,
}: {
  image: string;
  title: string;
  text: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <Card className="grid min-h-[360px] place-items-center p-8 text-center">
      <div>
        <div className="relative mx-auto size-44 overflow-hidden rounded-lg">
          <Image src={image} alt="" fill sizes="176px" className="object-cover" />
        </div>
        <h2 className="mt-6 text-2xl font-black">{title}</h2>
        <p className="mt-2 text-muted-foreground">{text}</p>
        <Button className="mt-6" onClick={onAction}>{action}</Button>
      </div>
    </Card>
  );
}

function ErrorState({
  icon: Icon,
  title,
  text,
  traceId,
  tone = "red",
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  traceId: string;
  tone?: "red" | "amber";
}) {
  return (
    <Card className="grid min-h-[340px] place-items-center p-7 text-center">
      <div>
        <span className={cn("mx-auto grid size-20 place-items-center rounded-full", tone === "red" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600")}>
          <Icon className="size-10" aria-hidden />
        </span>
        <h2 className="mt-5 text-2xl font-black">{title}</h2>
        <p className="mt-2 text-muted-foreground">{text}</p>
        <Button className="mt-6">Tekrar dene</Button>
        <p className="mt-6 rounded-md border border-border bg-muted px-3 py-2 font-mono text-xs">
          traceId: {traceId}
        </p>
      </div>
    </Card>
  );
}

function InvalidField({ label, value, message }: { label: string; value: string; message: string }) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <input value={value} readOnly className="mt-2 h-10 w-full rounded-md border border-red-500 bg-red-50 px-3 text-sm outline-none" />
      <span className="mt-1 flex items-center gap-1 text-xs text-red-600">
        <AlertCircle className="size-3.5" aria-hidden />
        {message}
      </span>
    </label>
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

function DemandLine({ demand }: { demand: DemandDto }) {
  return (
    <div className="grid grid-cols-[42px_1fr_auto] items-center gap-3 text-sm">
      <div className="relative size-10 overflow-hidden rounded-md">
        <Image src={demandImage(demand)} alt="" fill sizes="40px" className="object-cover" />
      </div>
      <span>
        <span className="block font-bold">{demand.urunAdi}</span>
        <span className="text-xs text-muted-foreground">{demand.miktar} kg</span>
      </span>
      <Badge variant={demand.durum === "ANLASILDI" ? "green" : "gold"}>{demand.durum === "ACIK" ? "Yeni" : demand.durum}</Badge>
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

function ConversationLine({ conversation }: { conversation: ChatConversationDto }) {
  return (
    <div className="grid grid-cols-[42px_1fr_auto] items-center gap-3 text-sm">
      <span className="grid size-10 place-items-center rounded-full bg-secondary font-black text-primary">
        {(conversation.userName ?? "YK").slice(0, 2).toUpperCase()}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-bold">{conversation.userName ?? conversation.email}</span>
        <span className="block truncate text-xs text-muted-foreground">{conversation.lastMessage}</span>
      </span>
      {conversation.unreadCount > 0 ? (
        <span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-black text-white">
          {conversation.unreadCount}
        </span>
      ) : null}
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
