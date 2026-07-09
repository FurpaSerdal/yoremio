export const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://yoremio.onrender.com").replace(
    /\/$/,
    "",
  );

export type UserRole = "ADMIN" | "ALICI" | "SATICI";

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]> | null;
  traceId?: string | null;
};

export type SessionUser = {
  userId: string;
  email: string;
  userName?: string;
  phoneNumber?: string;
  role: UserRole;
  roles?: UserRole[];
  emailConfirmed: boolean;
  phoneNumberConfirmed: boolean;
};

export type LoginResponse = {
  token: string;
  userId: string;
  email: string;
  role: UserRole;
  roles?: UserRole[];
};

export type AppFeatureFlags = {
  chatEnabled: boolean;
  demandFlowEnabled: boolean;
  favoritesEnabled: boolean;
  ratingsEnabled: boolean;
  reviewsEnabled: boolean;
  devVerificationInboxEnabled: boolean;
  cloudinaryEnabled: boolean;
};

export type AppVerificationConfig = {
  requireConfirmedEmailForSellerLogin: boolean;
  requireConfirmedPhoneForSellerLogin: boolean;
  devVerificationInboxUrl?: string | null;
};

export type AppUploadsConfig = {
  maxImageBytes: number;
  maxVideoBytes: number;
  maxMultipartBodyBytes: number;
  imageContentTypePrefixes: string[];
  videoContentTypePrefixes: string[];
};

export type AppBootstrapDto = {
  environment: string;
  roles: UserRole[];
  categories: CategoryDto[];
  productSorts: string[];
  features: AppFeatureFlags;
  verification: AppVerificationConfig;
  uploads: AppUploadsConfig;
};

export type DashboardSummaryDto = {
  roles: UserRole[];
  unreadMessages: number;
  favoriteProducts: number;
  myProducts: number;
  openDemands: number;
  buyerOpenDemands: number;
  sellerOpenDemands: number;
  pendingOffers: number;
  buyerPendingOffers: number;
  sellerPendingOffers: number;
};

export type SellerDashboardDto = {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  outOfStockProducts: number;
  totalFavorites: number;
  totalReviews: number;
  totalRatings: number;
  averageRating: number;
  trustScore: number;
  openDemands: number;
  agreedDemands: number;
  pendingOffers: number;
  acceptedOffers: number;
  rejectedOffers: number;
  unreadMessages: number;
};

export type AdminDashboardDto = {
  totalUsers: number;
  totalSellers: number;
  activeSellers: number;
  totalBuyers: number;
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  totalDemands: number;
  openDemands: number;
  agreedDemands: number;
  totalReviews: number;
  totalMessages: number;
  unreadMessages: number;
};

export type CategoryDto = {
  id: number;
  adi: string;
  aciklama?: string | null;
};

export type MediaDto = {
  id: number;
  url: string;
};

export type CommentDto = {
  id: number;
  urunId: number;
  icerik: string;
  tarih: string;
  kullaniciId: string;
  kullaniciAdi?: string | null;
};

export type RatingDto = {
  id: number;
  urunId: number;
  kullaniciId: string;
  puanDegeri: number;
  puanTarihi: string;
};

export type ProductDto = {
  id: number;
  adi: string;
  aciklama?: string | null;
  fiyat: number;
  stokMiktari: number;
  aktifMi?: boolean;
  kategoriId: number;
  kategoriAdi?: string | null;
  saticiId: string;
  saticiMagazaAdi?: string | null;
  saticiSehir?: string | null;
  saticiIlce?: string | null;
  saticiDogrulanmis: boolean;
  ortalamaPuan: number;
  toplamPuan: number;
  toplamYorum: number;
  toplamFavori: number;
  yorumlar: CommentDto[];
  puanlar: RatingDto[];
  resimler: MediaDto[];
  videolar: MediaDto[];
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type ProductQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  kategoriId?: number;
  minFiyat?: number;
  maxFiyat?: number;
  saticiId?: string;
  sehir?: string;
  ilce?: string;
  sadeceStoktaOlanlar?: boolean;
  sadeceAktif?: boolean;
  minOrtalamaPuan?: number;
  sort?: string;
};

export type ProductFormValues = {
  adi?: string;
  aciklama?: string;
  fiyat?: number;
  stokMiktari?: number;
  kategoriId?: number;
  resimler?: File[];
  videolar?: File[];
};

export type SellerProfileDto = {
  kullaniciId: string;
  magazaAdi: string;
  vergiNo?: string | null;
  adres?: string | null;
  sehir?: string | null;
  ilce?: string | null;
  kayitTarihi?: string | null;
  aktifMi: boolean;
  dogrulanmisSatici: boolean;
  email: string;
  userName?: string | null;
  phoneNumber?: string | null;
};

export type SellerTrustScoreDto = {
  kullaniciId: string;
  magazaAdi: string;
  dogrulanmisSatici: boolean;
  urunSayisi: number;
  ortalamaPuan: number;
  toplamPuan: number;
  toplamYorum: number;
  toplamFavori: number;
  guvenSkoru: number;
};

export type FeaturedSellerDto = SellerTrustScoreDto & {
  sehir?: string | null;
  ilce?: string | null;
  kapakResimUrl?: string | null;
};

export type OfferDto = {
  id: number;
  talepId: number;
  saticiId: string;
  saticiMagazaAdi?: string | null;
  birimFiyat?: number | null;
  mesaj: string;
  durum: "BEKLEMEDE" | "KABUL" | "RED" | string;
  olusturmaTarihi: string;
};

export type DemandDto = {
  id: number;
  aliciId: string;
  urunId: number;
  urunAdi: string;
  urunResimUrl?: string | null;
  urunFiyat?: number | null;
  saticiId?: string | null;
  saticiMagazaAdi?: string | null;
  saticiSehir?: string | null;
  saticiIlce?: string | null;
  miktar: number;
  not?: string | null;
  durum: "ACIK" | "ANLASILDI" | "IPTAL" | string;
  olusturmaTarihi: string;
  teklifler: OfferDto[];
};

export type ChatConversationDto = {
  userId: string;
  userName?: string | null;
  email?: string | null;
  lastMessage?: string | null;
  lastSenderId?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
};

export type ChatMessageDto = {
  id: number;
  senderId: string;
  receiverId: string;
  message: string;
  sentAt: string;
  readAt: string | null;
  isMine: boolean;
};

export type ChatConversationMessagesDto = {
  otherUserId: string;
  items: ChatMessageDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type NotificationDto = {
  id: number;
  tur: "MESAJ" | "TALEP" | "TEKLIF" | string;
  baslik: string;
  mesaj: string;
  ilgiliVarlikTuru?: string | null;
  ilgiliVarlikId?: string | null;
  aksiyonUrl?: string | null;
  olusturmaTarihi: string;
  okunmaTarihi?: string | null;
  okunduMu: boolean;
};

export type NotificationsPageDto = Paginated<NotificationDto> & {
  okunmamisSayisi: number;
};

type UnreadNotificationCountResponse =
  | number
  | {
      okunmamisSayisi?: number;
    };

function normalizeUnreadNotificationCount(value: UnreadNotificationCountResponse) {
  if (typeof value === "number") return value;
  return value.okunmamisSayisi ?? 0;
}

export type RegisterBuyerValues = {
  email: string;
  password: string;
};

export type RegisterSellerValues = RegisterBuyerValues & {
  phoneNumber: string;
  magazaAdi: string;
  vergiNo: string;
  adres?: string;
  sehir?: string;
  ilce?: string;
};

export type SellerProfileUpdateValues = {
  magazaAdi?: string;
  adres?: string;
  sehir?: string;
  ilce?: string;
  phoneNumber?: string;
};

type ApiRequestInit = RequestInit & {
  token?: string;
};

type ProblemDetails = {
  title?: string;
  status?: number;
  errors?: Record<string, string[]>;
  traceId?: string;
};

function isApiResponse<T>(
  payload: ApiResponse<T> | ProblemDetails | null,
): payload is ApiResponse<T> {
  return Boolean(payload && "success" in payload);
}

export class ApiClientError extends Error {
  status: number;
  traceId?: string | null;
  errors?: Record<string, string[]> | null;

  constructor(
    message: string,
    status: number,
    traceId?: string | null,
    errors?: Record<string, string[]> | null,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.traceId = traceId;
    this.errors = errors;
  }
}

function problemMessage(payload: ProblemDetails) {
  if (payload.title) return payload.title;

  const firstError = payload.errors
    ? Object.values(payload.errors).flat().find(Boolean)
    : undefined;

  return firstError ?? "Beklenmeyen bir hata olustu.";
}

async function request<T>(path: string, init: ApiRequestInit = {}) {
  const headers = new Headers(init.headers);

  if (init.token) {
    headers.set("Authorization", `Bearer ${init.token}`);
  }

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });
  } catch {
    throw new ApiClientError(
      "API'ye ulasilamadi. Sunucu uyaniyor olabilir, birkac saniye sonra tekrar deneyin.",
      0,
    );
  }

  const text = await response.text();
  let payload: ApiResponse<T> | ProblemDetails | null = null;

  if (text) {
    try {
      payload = JSON.parse(text) as ApiResponse<T> | ProblemDetails;
    } catch {
      throw new ApiClientError(
        "API beklenmeyen bir cevap dondurdu.",
        response.status,
      );
    }
  }

  if (!response.ok || (isApiResponse(payload) && payload.success === false)) {
    if (isApiResponse(payload)) {
      throw new ApiClientError(
        payload.message ?? "Beklenmeyen bir hata olustu.",
        response.status,
        payload.traceId,
        payload.errors,
      );
    }

    const problem = payload as ProblemDetails | null;

    throw new ApiClientError(
      problem ? problemMessage(problem) : "Beklenmeyen bir hata olustu.",
      response.status,
      problem?.traceId,
      problem?.errors,
    );
  }

  if (!payload) return undefined as T;
  return (isApiResponse(payload) ? payload.data : payload) as T;
}

export function mediaUrl(path?: string | null) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path}`;
}

export function queryString(values: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === "" || value === false) return;
    params.set(key, String(value));
  });

  return params.toString();
}

export function createProductFormData(values: ProductFormValues) {
  const form = new FormData();

  if (values.adi !== undefined) form.append("Adi", values.adi);
  if (values.aciklama !== undefined) form.append("Aciklama", values.aciklama);
  if (values.fiyat !== undefined) form.append("Fiyat", String(values.fiyat));
  if (values.stokMiktari !== undefined) {
    form.append("StokMiktari", String(values.stokMiktari));
  }
  if (values.kategoriId !== undefined) {
    form.append("KategoriId", String(values.kategoriId));
  }

  values.resimler?.forEach((file) => form.append("Resimler", file));
  values.videolar?.forEach((file) => form.append("Videolar", file));

  return form;
}

export const yoremioApi = {
  bootstrap: () => request<AppBootstrapDto>("/api/App/bootstrap"),
  registerBuyer: (values: RegisterBuyerValues) =>
    request<null>("/api/Auth/register/alici", {
      method: "POST",
      body: JSON.stringify(values),
    }),
  registerSeller: (values: RegisterSellerValues) =>
    request<null>("/api/Auth/register/satici", {
      method: "POST",
      body: JSON.stringify(values),
    }),
  login: (email: string, password: string) =>
    request<LoginResponse>("/api/Auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: (token: string) =>
    request<SessionUser>("/api/Auth/me", {
      token,
    }),
  confirmEmail: (email: string, code: string) =>
    request<null>("/api/Auth/confirm-email", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    }),
  confirmPhone: (email: string, code: string) =>
    request<null>("/api/Auth/confirm-phone", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    }),
  confirmEmailLink: (userId: string, token: string) =>
    request<null>(
      `/api/Auth/confirm-email?${queryString({ userId, token })}`,
    ),
  confirmPhoneLink: (userId: string, token: string) =>
    request<null>(
      `/api/Auth/confirm-phone?${queryString({ userId, token })}`,
    ),
  resendVerification: (email: string) =>
    request<null>("/api/Auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  categories: () => request<CategoryDto[]>("/api/Kategori"),
  dashboardSummary: (token: string) =>
    request<DashboardSummaryDto>("/api/Dashboard/summary", {
      token,
    }),
  sellerDashboard: (token: string) =>
    request<SellerDashboardDto>("/api/Dashboard/satici", {
      token,
    }),
  adminDashboard: (token: string) =>
    request<AdminDashboardDto>("/api/Dashboard/admin", {
      token,
    }),
  updateProductStatus: (token: string, urunId: number, aktifMi: boolean) =>
    request<ProductDto>(`/api/Urun/${urunId}/status`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ aktifMi }),
    }),
  category: (id: number) => request<CategoryDto>(`/api/Kategori/${id}`),
  createCategory: (token: string, values: Omit<CategoryDto, "id">) =>
    request<CategoryDto>("/api/Kategori", {
      method: "POST",
      token,
      body: JSON.stringify(values),
    }),
  updateCategory: (token: string, id: number, values: Omit<CategoryDto, "id">) =>
    request<CategoryDto>(`/api/Kategori/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(values),
    }),
  deleteCategory: (token: string, id: number) =>
    request<null>(`/api/Kategori/${id}`, {
      method: "DELETE",
      token,
    }),

  products: (query: ProductQuery = {}) =>
    request<Paginated<ProductDto>>(
      `/api/Urun?${queryString({
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 12,
        q: query.q,
        kategoriId: query.kategoriId,
        minFiyat: query.minFiyat,
        maxFiyat: query.maxFiyat,
        saticiId: query.saticiId,
        sehir: query.sehir,
        ilce: query.ilce,
        sadeceStoktaOlanlar: query.sadeceStoktaOlanlar,
        sadeceAktif: query.sadeceAktif,
        minOrtalamaPuan: query.minOrtalamaPuan,
        sort: query.sort ?? "newest",
      })}`,
    ),
  product: (id: number) => request<ProductDto>(`/api/Urun/${id}`),
  recommendedProducts: (token: string) =>
    request<ProductDto[]>("/api/Urun/onerilen", {
      token,
    }),
  favoriteProducts: (token: string) =>
    request<ProductDto[]>("/api/Urun/favorilerim", {
      token,
    }),
  addFavorite: (token: string, urunId: number) =>
    request<null>(`/api/Urun/${urunId}/favori`, {
      method: "POST",
      token,
    }),
  removeFavorite: (token: string, urunId: number) =>
    request<null>(`/api/Urun/${urunId}/favori`, {
      method: "DELETE",
      token,
    }),
  sellerProducts: (token: string) =>
    request<ProductDto[]>("/api/Urun/urunlerim", {
      token,
    }),
  upsertProduct: (token: string, values: ProductFormValues, urunId?: number) =>
    request<ProductDto>(urunId ? `/api/Urun/${urunId}` : "/api/Urun/urun-ekle", {
      method: urunId ? "PUT" : "POST",
      token,
      body: createProductFormData(values),
    }),
  deleteProduct: (token: string, urunId: number) =>
    request<null>(`/api/Urun/${urunId}`, {
      method: "DELETE",
      token,
    }),
  deleteProductImage: (token: string, urunId: number, resimId: number) =>
    request<null>(`/api/Urun/${urunId}/resimler/${resimId}`, {
      method: "DELETE",
      token,
    }),
  deleteProductVideo: (token: string, urunId: number, videoId: number) =>
    request<null>(`/api/Urun/${urunId}/videolar/${videoId}`, {
      method: "DELETE",
      token,
    }),

  sellerProfile: (token: string) =>
    request<SellerProfileDto>("/api/Profil/satici", {
      token,
    }),
  updateSellerProfile: (token: string, values: SellerProfileUpdateValues) =>
    request<SellerProfileDto>("/api/Profil/satici", {
      method: "PUT",
      token,
      body: JSON.stringify(values),
    }),
  sellerTrustScore: (saticiId: string) =>
    request<SellerTrustScoreDto>(`/api/Profil/satici/${saticiId}/guven-skoru`),
  featuredSellers: (take = 6) =>
    request<FeaturedSellerDto[]>(
      `/api/Profil/saticilar/one-cikan?${queryString({ take })}`,
    ),

  rateProduct: (token: string, urunId: number, puanDegeri: number) =>
    request<{ ortalama: number }>("/api/Puan/puan-ekle", {
      method: "POST",
      token,
      body: JSON.stringify({ urunId, puanDegeri }),
    }),
  productRatings: (urunId: number) =>
    request<RatingDto[]>(`/api/Puan/urun/${urunId}`),
  averageRating: (urunId: number) =>
    request<{ ortalama: number }>(`/api/Puan/ortalama/${urunId}`),

  comments: (urunId: number) => request<CommentDto[]>(`/api/Yorum/${urunId}`),
  addComment: (token: string, urunId: number, icerik: string) =>
    request<CommentDto>("/api/Yorum", {
      method: "POST",
      token,
      body: JSON.stringify({ urunId, icerik }),
    }),
  updateComment: (token: string, yorumId: number, urunId: number, icerik: string) =>
    request<CommentDto>(`/api/Yorum/${yorumId}`, {
      method: "PUT",
      token,
      body: JSON.stringify({ urunId, icerik }),
    }),
  deleteComment: (token: string, yorumId: number) =>
    request<null>(`/api/Yorum/${yorumId}`, {
      method: "DELETE",
      token,
    }),

  createDemand: (token: string, urunId: number, miktar: number, not?: string) =>
    request<DemandDto>("/api/Talep", {
      method: "POST",
      token,
      body: JSON.stringify({ urunId, miktar, not }),
    }),
  buyerDemands: (token: string) =>
    request<DemandDto[]>("/api/Talep/benim", {
      token,
    }),
  sellerDemands: (token: string) =>
    request<DemandDto[]>("/api/Talep/satici", {
      token,
    }),
  upsertOffer: (
    token: string,
    talepId: number,
    values: { birimFiyat?: number; mesaj: string },
  ) =>
    request<OfferDto>(`/api/Talep/${talepId}/teklif`, {
      method: "POST",
      token,
      body: JSON.stringify(values),
    }),
  acceptOffer: (token: string, teklifId: number) =>
    request<DemandDto>(`/api/Talep/teklif/${teklifId}/kabul`, {
      method: "POST",
      token,
    }),

  conversations: (token: string) =>
    request<ChatConversationDto[]>("/api/Chat/conversations", {
      token,
    }),
  messages: (token: string, otherUserId: string, page = 1, pageSize = 50) =>
    request<ChatConversationMessagesDto>(
      `/api/Chat/messages/${otherUserId}?${queryString({ page, pageSize })}`,
      { token },
    ),
  sendMessage: (token: string, receiverId: string, message: string) =>
    request<ChatMessageDto>(`/api/Chat/messages/${receiverId}`, {
      method: "POST",
      token,
      body: JSON.stringify({ message }),
    }),
  markConversationRead: (token: string, otherUserId: string) =>
    request<{ markedCount: number; readAt: string }>(
      `/api/Chat/messages/${otherUserId}/read`,
      {
        method: "POST",
        token,
      },
    ),

  notifications: (token: string, sadeceOkunmamis = false, page = 1, pageSize = 20) =>
    request<NotificationsPageDto>(
      `/api/Bildirim?${queryString({ sadeceOkunmamis, page, pageSize })}`,
      { token },
    ),
  unreadNotificationCount: async (token: string) =>
    normalizeUnreadNotificationCount(
      await request<UnreadNotificationCountResponse>("/api/Bildirim/okunmamis-sayisi", {
        token,
      }),
    ),
  markNotificationRead: (token: string, bildirimId: number) =>
    request<null>(`/api/Bildirim/${bildirimId}/okundu`, {
      method: "POST",
      token,
    }),
  markAllNotificationsRead: (token: string) =>
    request<null>("/api/Bildirim/tumunu-okundu", {
      method: "POST",
      token,
    }),
};
