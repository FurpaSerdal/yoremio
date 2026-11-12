import {
  ApiClientError,
  mediaUrl,
  type CategoryDto,
  type DemandDto,
  type FeaturedSellerDto,
  type LoginResponse,
  type Paginated,
  type ProductDto,
  type ProductFormValues,
  type SellerProfileDto,
  type SessionUser,
  type UserRole,
} from "@/lib/api";
import { formatShortDate } from "@/lib/utils";

export const PAGE_SIZE = 12;
export const productPlaceholderImage = "/products/product-placeholder.svg";

export const sessionKeys = {
  token: "yoremio-token",
  user: "yoremio-user",
} as const;

export type Screen =
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

export type BuyerTab =
  | "overview"
  | "favorites"
  | "recommended"
  | "demands"
  | "offers"
  | "alarms"
  | "community"
  | "profile"
  | "chat";
export type SellerTab = "overview" | "products" | "demands" | "logistics" | "chat";
export type AdminTab =
  | "overview"
  | "users"
  | "products"
  | "comments"
  | "demands"
  | "demand-gaps"
  | "categories";

export type AuthState = SessionUser & Pick<LoginResponse, "token">;
export type AuthCompleteOptions = {
  silent?: boolean;
};

export type ToastKind = "success" | "error" | "info";
export type ToastState = {
  kind: ToastKind;
  message: string;
  traceId?: string | null;
} | null;

export type LoadState = "idle" | "loading" | "error";
export type SortKey = string;
export type ProductSubmitValues = ProductFormValues & {
  aktifMi?: boolean;
};

export type ProductListMode = "grid" | "list";
export type ReviewTab = "comments" | "ratings" | "description";

export const defaultProductSorts = [
  "newest",
  "relevance",
  "price_asc",
  "price_desc",
  "top_rated",
  "most_viewed",
  "most_favorited",
];

export const sortLabels: Record<string, string> = {
  newest: "En yeniler",
  relevance: "En ilgili",
  oldest: "En eskiler",
  price_asc: "Fiyat artan",
  price_desc: "Fiyat azalan",
  name_asc: "İsim A-Z",
  name_desc: "İsim Z-A",
  top_rated: "En yüksek puan",
  most_viewed: "En çok görüntülenen",
  most_reviewed: "En çok yorum",
  most_favorited: "En çok favori",
};

export const categoryImages = [
  "/products/photo-tulum-peyniri.jpg",
  "/products/photo-yayla-bali.jpg",
  "/products/photo-koy-yumurtasi.jpg",
  "/products/photo-tarla-domatesi.jpg",
  "/products/photo-kocbasi-nohut.jpg",
  "/products/photo-amasya-elmasi.jpg",
];

export function getCategoryImage(category: CategoryDto, index = 0) {
  const lower = category.adi.toLowerCase();
  if (lower.includes("bal") || lower.includes("kahvalt")) return "/products/photo-yayla-bali.jpg";
  if (lower.includes("süt") || lower.includes("sut") || lower.includes("peynir")) return "/products/photo-tulum-peyniri.jpg";
  if (lower.includes("yumurta")) return "/products/photo-koy-yumurtasi.jpg";
  if (lower.includes("sebze") || lower.includes("domates")) return "/products/photo-tarla-domatesi.jpg";
  if (lower.includes("bakliyat") || lower.includes("nohut")) return "/products/photo-kocbasi-nohut.jpg";
  if (lower.includes("meyve") || lower.includes("elma")) return "/products/photo-amasya-elmasi.jpg";
  return categoryImages[(category.id + index) % categoryImages.length];
}

export function rolesOf(authUser: AuthState | null) {
  if (!authUser) return [];
  return authUser.roles?.length ? authUser.roles : [authUser.role];
}

export function hasRole(authUser: AuthState | null, role: UserRole) {
  return rolesOf(authUser).includes(role);
}

export function apiErrorInfo(error: unknown): {
  message: string;
  traceId?: string | null;
  fieldErrors?: Record<string, string[]> | null;
  status?: number;
} {
  if (error instanceof ApiClientError) {
    return {
      message: error.message,
      traceId: error.traceId,
      fieldErrors: error.errors,
      status: error.status,
    };
  }
  return { message: "Beklenmeyen bir hata oluştu." };
}

export function apiErrorMessage(error: unknown) {
  return apiErrorInfo(error).message;
}

export function emptyProductsResult(page = 1): Paginated<ProductDto> {
  return {
    items: [],
    page,
    pageSize: PAGE_SIZE,
    totalCount: 0,
    totalPages: 1,
  };
}

export function readStoredSessionToken() {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem(sessionKeys.token) ??
    window.sessionStorage.getItem(sessionKeys.token)
  );
}

export function storeSession(login: LoginResponse, persistent: boolean) {
  const primary = persistent ? window.localStorage : window.sessionStorage;
  const secondary = persistent ? window.sessionStorage : window.localStorage;

  primary.setItem(sessionKeys.token, login.token);
  primary.setItem(sessionKeys.user, JSON.stringify(login));
  secondary.removeItem(sessionKeys.token);
  secondary.removeItem(sessionKeys.user);
}

export function clearStoredSession() {
  [window.localStorage, window.sessionStorage].forEach((storage) => {
    storage.removeItem(sessionKeys.token);
    storage.removeItem(sessionKeys.user);
  });
}

export function mediaImageSrc(path?: string | null) {
  const image = path?.trim();
  if (!image) return productPlaceholderImage;
  if (image.startsWith("/products/")) return image;
  return mediaUrl(image) || productPlaceholderImage;
}

export function mediaVideoSrc(path?: string | null) {
  const video = path?.trim();
  if (!video) return "";
  return mediaUrl(video);
}

export function productImage(product: ProductDto) {
  return mediaImageSrc(product.resimler?.[0]?.url);
}

export function demandImage(demand: DemandDto) {
  return mediaImageSrc(demand.urunResimUrl);
}

export function demandTitle(demand: DemandDto) {
  return demand.urunAdi || demand.arananUrunAdi || `Talep #${demand.id}`;
}

export function ortakAlimStatusMeta(durum: string): {
  label: string;
  variant: "green" | "gold" | "outline" | "secondary" | "plum";
} {
  if (durum === "ONAYLANDI" || durum === "AKTIF") {
    return { label: "Aktif Kampanya", variant: "green" };
  }
  if (durum === "TAMAMLANDI") {
    return { label: "Tamamlandı", variant: "secondary" };
  }
  if (durum === "IPTAL") {
    return { label: "İptal", variant: "plum" };
  }
  return { label: "Alıcı Önerisi", variant: "gold" };
}

export function sellerCoverImage(seller: FeaturedSellerDto) {
  return mediaImageSrc(seller.kapakResimUrl);
}

export function sellerName(product: ProductDto) {
  return product.saticiMagazaAdi ?? "Yöremio satıcısı";
}

export function productLocation(product: ProductDto) {
  const sehir = product.uretimSehir || product.saticiSehir;
  const ilce = product.uretimIlce || product.saticiIlce;
  const parts = [sehir, ilce].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Konum belirtilmedi";
}

export function accountName(authUser: AuthState | null, profile?: SellerProfileDto | null) {
  if (!authUser) return "Misafir";
  if (hasRole(authUser, "SATICI") && profile?.magazaAdi) return profile.magazaAdi;
  return authUser.userName && !authUser.userName.includes("@")
    ? authUser.userName
    : authUser.email;
}

export function dashboardScreenFor(authUser: AuthState | null): Screen {
  if (!authUser) return "login";
  if (hasRole(authUser, "ADMIN")) return "admin";
  if (hasRole(authUser, "SATICI")) return "seller";
  return "buyer";
}

export function buyerScreenFor(authUser: AuthState | null): Screen {
  if (hasRole(authUser, "ALICI")) return "buyer";
  return authUser ? dashboardScreenFor(authUser) : "login";
}

export function shortDate(value?: string | null) {
  if (!value) return "";
  try {
    return formatShortDate(value);
  } catch {
    return value;
  }
}

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  }
  return `${Math.round(bytes / 1024)} KB`;
}
