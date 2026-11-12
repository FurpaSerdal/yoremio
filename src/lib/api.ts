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
  sehir?: string | null;
  ilce?: string | null;
  magazaAdi?: string | null;
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
  devVerificationInboxUrl?: string | null;
};

export type AppUploadsConfig = {
  maxImageBytes: number;
  maxVideoBytes: number;
  maxMultipartBodyBytes: number;
  imageContentTypePrefixes: string[];
  videoContentTypePrefixes: string[];
};

export type BootstrapLocationDto = {
  sehir: string;
  ilceler: string[];
};

export type AppBootstrapDto = {
  environment: string;
  roles: UserRole[];
  categories: CategoryDto[];
  cities?: string[];
  locations?: BootstrapLocationDto[];
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

export type TopRequestedProductDto = {
  urunId: number;
  urunAdi: string;
  talepSayisi: number;
  goruntulenmeSayisi: number;
  stokMiktari: number;
};

export type SellerDashboardDto = {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  outOfStockProducts: number;
  lowStockProducts?: number;
  totalProductViews?: number;
  totalFavorites: number;
  followerCount?: number;
  totalReviews: number;
  totalRatings: number;
  averageRating: number;
  trustScore: number;
  openDemands: number;
  unansweredDemands?: number;
  matchedOpenMarketDemands?: number;
  agreedDemands: number;
  verifiedCompletedDeals?: number;
  pendingOffers: number;
  acceptedOffers: number;
  rejectedOffers: number;
  averageResponseMinutes?: number;
  unreadMessages: number;
  topRequestedProducts?: TopRequestedProductDto[];
  actionSuggestions?: string[];
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
  openMarketDemands?: number;
  agreedDemands: number;
  verifiedCompletedDeals?: number;
  offerConversionRatePercent?: number;
  dealAgreementRatePercent?: number;
  averageSellerResponseMinutes?: number;
  repeatBuyers60Days?: number;
  repeatBuyerRatePercent?: number;
  activePriceAlerts?: number;
  totalSellerFollows?: number;
  totalReviews: number;
  totalMessages: number;
  unreadMessages: number;
};

export type CategoryDto = {
  id: number;
  adi: string;
  aciklama?: string | null;
  urunSayisi?: number;
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
  kullaniciAdi?: string | null;
  puanDegeri: number;
  puanTarihi: string;
};

export type ProductDto = {
  id: number;
  adi: string;
  aciklama?: string | null;
  fiyat: number;
  stokMiktari: number;
  birimMiktar?: string | null;
  teslimatSecenekleri?: string | null;
  yeniHasatMi?: boolean;
  uretimSehir?: string | null;
  uretimIlce?: string | null;
  eldenTeslimVarMi?: boolean;
  kargoVarMi?: boolean;
  gonderimSehirleri?: string | null;
  goruntulenmeSayisi?: number;
  slug?: string | null;
  olusturmaTarihi?: string | null;
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
  teslimatSehir?: string;
  uretimSehir?: string;
  sadeceStoktaOlanlar?: boolean;
  sadeceAktif?: boolean;
  sadeceDogrulanmisSatici?: boolean;
  sadeceYeniHasat?: boolean;
  sadeceEldenTeslim?: boolean;
  sadeceKargolu?: boolean;
  minOrtalamaPuan?: number;
  sort?: string;
};

export type ProductFormValues = {
  adi?: string;
  aciklama?: string;
  fiyat?: number;
  stokMiktari?: number;
  birimMiktar?: string;
  teslimatSecenekleri?: string;
  yeniHasatMi?: boolean;
  uretimSehir?: string;
  uretimIlce?: string;
  eldenTeslimVarMi?: boolean;
  kargoVarMi?: boolean;
  gonderimSehirleri?: string;
  kategoriId?: number;
  resimler?: File[];
  videolar?: File[];
};

export type BulkStockItemValues = {
  urunId: number;
  stokMiktari: number;
  fiyat?: number;
  yeniHasatMi?: boolean;
};

export type PriceAlertDto = {
  id: number;
  urunId: number;
  urunAdi: string;
  urunResimUrl?: string | null;
  urunFiyat: number;
  hedefFiyat: number;
  aktifMi: boolean;
  tetiklendiMi: boolean;
  sonTetiklenenFiyat?: number | null;
  sonTetiklemeTarihi?: string | null;
  olusturmaTarihi: string;
};

export type StockAlertDto = {
  id: number;
  urunId: number;
  urunAdi: string;
  urunResimUrl?: string | null;
  urunFiyat: number;
  stokMiktari: number;
  aktifMi: boolean;
  sonTetiklemeTarihi?: string | null;
  olusturmaTarihi: string;
};

export type PlanliGonderimDto = {
  id: number;
  saticiId: string;
  saticiMagazaAdi?: string | null;
  saticiDogrulanmis: boolean;
  baslik: string;
  aciklama?: string | null;
  menseiSehir: string;
  hedefSehir: string;
  tahminiUrunNotu?: string | null;
  gonderimTarihi: string;
  sonTalepTarihi: string;
  sogukZincirVarMi: boolean;
  aktifMi: boolean;
  olusturmaTarihi: string;
};

export type PlanliGonderimCreateValues = {
  baslik: string;
  aciklama?: string;
  menseiSehir: string;
  hedefSehir: string;
  tahminiUrunNotu?: string;
  gonderimTarihi: string;
  sonTalepTarihi: string;
  sogukZincirVarMi: boolean;
};

export type OrtakAlimDto = {
  id: number;
  saticiId: string;
  saticiMagazaAdi?: string | null;
  saticiDogrulanmis: boolean;
  olusturanKullaniciId?: string | null;
  urunId?: number | null;
  urunAdi?: string | null;
  urunResimUrl?: string | null;
  kategoriId?: number | null;
  kategoriAdi?: string | null;
  baslik: string;
  aciklama?: string | null;
  menseiSehir: string;
  hedefSehir: string;
  birimFiyat: number;
  birim: string;
  minimumKatilimci: number;
  mevcutKatilimci: number;
  toplamTalepMiktari: number;
  sogukZincirGerekliMi: boolean;
  teslimatKosullari?: string | null;
  iptalKosullari?: string | null;
  durum: string;
  sonKatilimTarihi: string;
  olusturmaTarihi: string;
};

export type OrtakAlimCreateValues = {
  saticiId?: string;
  urunId?: number;
  kategoriId?: number;
  baslik: string;
  aciklama?: string;
  menseiSehir: string;
  hedefSehir: string;
  birimFiyat: number;
  birim?: string;
  minimumKatilimci: number;
  sogukZincirGerekliMi: boolean;
  teslimatKosullari?: string;
  iptalKosullari?: string;
  sonKatilimTarihi: string;
};

export type OrtakAlimJoinValues = {
  katilimMiktari: number;
  not?: string;
};

export type BenimIcinBulOneriDto = {
  urunBulunamadi: boolean;
  arananUrunAdi?: string | null;
  teslimatSehir?: string | null;
  kategoriId?: number | null;
  acikTalepEndpoint?: string | null;
};

export type SmartAlternativesDto = {
  ayniYoredenUrunler: ProductDto[];
  sehreGonderimYapanlar: ProductDto[];
  stoguTukenenUrunler: ProductDto[];
  aktifOrtakAlimlar: OrtakAlimDto[];
  planliGonderimler: PlanliGonderimDto[];
  benimIcinBulOnerisi: BenimIcinBulOneriDto;
};

export type SmartDiscoverResultDto = {
  sonuclar: Paginated<ProductDto>;
  alternatifler?: SmartAlternativesDto | null;
};

export type SellerProfileDto = {
  kullaniciId: string;
  magazaAdi: string;
  vergiNo?: string | null;
  adres?: string | null;
  sehir?: string | null;
  ilce?: string | null;
  aciklama?: string | null;
  kapakResimUrl?: string | null;
  kayitTarihi?: string | null;
  aktifMi: boolean;
  paketTuru?: string | null;
  dogrulanmisSatici: boolean;
  epostaDogrulandi?: boolean;
  isletmeDogrulandi?: boolean;
  ureticiDogrulandi?: boolean;
  adminDogrulamaDurumu?: boolean | null;
  email: string;
  userName?: string | null;
  phoneNumber?: string | null;
};

export type BuyerProfileDto = {
  kullaniciId: string;
  userName?: string | null;
  email: string;
  phoneNumber?: string | null;
  sehir?: string | null;
  ilce?: string | null;
  adres?: string | null;
  favoriKategori?: string | null;
};

export type BuyerProfileUpdateValues = {
  userName?: string;
  phoneNumber?: string;
  sehir?: string;
  ilce?: string;
  adres?: string;
  favoriKategori?: string;
};

export type SellerTrustScoreDto = {
  kullaniciId: string;
  magazaAdi: string;
  dogrulanmisSatici: boolean;
  epostaDogrulandi?: boolean;
  isletmeDogrulandi?: boolean;
  ureticiDogrulandi?: boolean;
  urunSayisi: number;
  ortalamaPuan: number;
  toplamPuan: number;
  toplamYorum: number;
  toplamFavori: number;
  guvenSkoru: number;
};

export type FeaturedSellerDto = SellerTrustScoreDto & {
  aciklama?: string | null;
  sehir?: string | null;
  ilce?: string | null;
  takipciSayisi?: number;
  kapakResimUrl?: string | null;
  vitrinUrunId?: number | null;
};

export type PublicSellerSummaryDto = FeaturedSellerDto;

export type DevVerificationMessageDto = {
  id: string;
  channel: string;
  to: string;
  subject: string;
  body: string;
  createdAtUtc: string;
};

export type ReviewEligibilityDto = {
  yorumYapabilir: boolean;
  puanlayabilir?: boolean;
  mevcutPuan?: number | null;
  sebep?: string | null;
};

export type OfferDto = {
  id: number;
  talepId: number;
  saticiId: string;
  saticiMagazaAdi?: string | null;
  saticiSehir?: string | null;
  saticiDogrulanmis?: boolean;
  birimFiyat?: number | null;
  mesaj: string;
  teslimatSuresiGun?: number | null;
  kargoDahilMi?: boolean;
  gonderimSehir?: string | null;
  durum: "BEKLEMEDE" | "KABUL" | "RED" | string;
  olusturmaTarihi: string;
  guncellemeTarihi?: string | null;
};

export type OfferSubmitValues = {
  birimFiyat?: number;
  mesaj: string;
  teslimatSuresiGun?: number;
  kargoDahilMi?: boolean;
  gonderimSehir?: string;
};

export type OpenMarketDemandValues = {
  arananUrunAdi: string;
  kategoriId?: number;
  miktar: number;
  birim?: string;
  teslimatSehir: string;
  tercihEdilenSehirler?: string;
  hedefBirimFiyat?: number;
  sonTeklifTarihi?: string;
  talepTipi?: string;
  not?: string;
};

export type DemandDto = {
  id: number;
  aliciId: string;
  aliciAdi?: string | null;
  talepTuru?: "URUN" | "ACIK_PAZAR" | string;
  talepTipi?: "BIREYSEL" | "TOPLU_TALEP" | string;
  urunId?: number | null;
  urunAdi?: string | null;
  urunResimUrl?: string | null;
  urunFiyat?: number | null;
  kategoriId?: number | null;
  kategoriAdi?: string | null;
  arananUrunAdi?: string | null;
  birim?: string | null;
  teslimatSehir?: string | null;
  tercihEdilenSehirler?: string | null;
  hedefBirimFiyat?: number | null;
  sonTeklifTarihi?: string | null;
  saticiId?: string | null;
  saticiMagazaAdi?: string | null;
  saticiSehir?: string | null;
  saticiIlce?: string | null;
  miktar: number;
  not?: string | null;
  durum: "ACIK" | "ANLASILDI" | "IPTAL" | string;
  aliciGerceklestiOnayi?: boolean | null;
  saticiGerceklestiOnayi?: boolean | null;
  eslesmeSkoru?: number | null;
  eslesmeSebebi?: string | null;
  eslesenSaticiSayisi?: number;
  olusturmaTarihi: string;
  guncellemeTarihi?: string | null;
  teklifler: OfferDto[];
};

export type ChatConversationDto = {
  userId: string;
  userName?: string | null;
  email?: string | null;
  magazaAdi?: string | null;
  lastMessage?: string | null;
  lastSenderId?: string | null;
  lastMessageAt?: string | null;
  lastUrunId?: number | null;
  lastUrunAdi?: string | null;
  lastTalepId?: number | null;
  unreadCount: number;
};

export type ChatMessageDto = {
  id: number;
  senderId: string;
  receiverId: string;
  urunId?: number | null;
  urunAdi?: string | null;
  talepId?: number | null;
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
  tur: "MESAJ" | "TALEP" | "TEKLIF" | "DESTEK" | "SISTEM" | string;
  baslik: string;
  mesaj: string;
  ilgiliVarlikTuru?: string | null;
  ilgiliVarlikId?: string | null;
  aksiyonUrl?: string | null;
  olusturmaTarihi: string;
  okunmaTarihi?: string | null;
  okunduMu: boolean;
  okunmamisSayisi?: number | null;
};

export type AdminUserDto = {
  id: string;
  email?: string | null;
  userName?: string | null;
  phoneNumber?: string | null;
  emailConfirmed: boolean;
  kilitliMi: boolean;
  roles: string[];
  magazaAdi?: string | null;
  vergiNo?: string | null;
  sehir?: string | null;
  ilce?: string | null;
  saticiAktifMi?: boolean | null;
  dogrulanmisSatici: boolean;
  isletmeDogrulandi: boolean;
  ureticiDogrulandi: boolean;
  adminDogrulamaDurumu?: boolean | null;
  urunSayisi: number;
  kayitTarihi?: string | null;
};

export type DemandGapDto = {
  teslimatSehir: string;
  arananUrunAdi: string;
  kategoriAdi?: string | null;
  talepSayisi: number;
  acikTalepSayisi: number;
  anlasilanTalepSayisi: number;
  ortalamaEslesenSaticiSayisi: number;
  yeterliSaticiYokMu: boolean;
};

export type AdminCommentDto = {
  id: number;
  urunId: number;
  urunAdi?: string | null;
  kullaniciId: string;
  kullaniciAdi?: string | null;
  kullaniciEmail?: string | null;
  icerik: string;
  tarih: string;
  aktifMi: boolean;
};

export type AdminUsersQuery = {
  q?: string;
  rol?: string;
  sadeceBekleyenSaticilar?: boolean;
  page?: number;
  pageSize?: number;
};

export type AdminProductsQuery = {
  q?: string;
  kategoriId?: number;
  saticiId?: string;
  aktifMi?: boolean;
  page?: number;
  pageSize?: number;
};

export type AdminCommentsQuery = {
  urunId?: number;
  q?: string;
  aktifMi?: boolean;
  page?: number;
  pageSize?: number;
};

export type NotificationsPageDto = Paginated<NotificationDto> & {
  okunmamisSayisi: number;
};

export type SupportRequestValues = {
  konu: string;
  mesaj: string;
  email?: string;
  telefon?: string;
  ekran?: string;
  ilgiliVarlikTuru?: string;
  ilgiliVarlikId?: string;
};

export type SupportRequestResultDto = {
  talepId: string;
  alinmaTarihi: string;
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
  userName?: string;
  sehir?: string;
  ilce?: string;
  adres?: string;
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
  aciklama?: string;
  phoneNumber?: string;
  kapakResim?: File | null;
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
  if (values.birimMiktar !== undefined) {
    form.append("BirimMiktar", values.birimMiktar);
  }
  if (values.teslimatSecenekleri !== undefined) {
    form.append("TeslimatSecenekleri", values.teslimatSecenekleri);
  }
  if (values.yeniHasatMi !== undefined) {
    form.append("YeniHasatMi", String(values.yeniHasatMi));
  }
  if (values.uretimSehir !== undefined) {
    form.append("UretimSehir", values.uretimSehir);
  }
  if (values.uretimIlce !== undefined) {
    form.append("UretimIlce", values.uretimIlce);
  }
  if (values.eldenTeslimVarMi !== undefined) {
    form.append("EldenTeslimVarMi", String(values.eldenTeslimVarMi));
  }
  if (values.kargoVarMi !== undefined) {
    form.append("KargoVarMi", String(values.kargoVarMi));
  }
  if (values.gonderimSehirleri !== undefined) {
    form.append("GonderimSehirleri", values.gonderimSehirleri);
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
  confirmEmailLink: (userId: string, token: string) =>
    request<null>(
      `/api/Auth/confirm-email?${queryString({ userId, token })}`,
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
      method: "PUT",
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
        teslimatSehir: query.teslimatSehir,
        uretimSehir: query.uretimSehir,
        sadeceStoktaOlanlar: query.sadeceStoktaOlanlar,
        sadeceAktif: query.sadeceAktif,
        sadeceDogrulanmisSatici: query.sadeceDogrulanmisSatici,
        sadeceYeniHasat: query.sadeceYeniHasat,
        sadeceEldenTeslim: query.sadeceEldenTeslim,
        sadeceKargolu: query.sadeceKargolu,
        minOrtalamaPuan: query.minOrtalamaPuan,
        sort: query.sort ?? "newest",
      })}`,
    ),
  discoverProducts: (query: ProductQuery = {}) =>
    request<SmartDiscoverResultDto>(
      `/api/Urun/kesfet?${queryString({
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 12,
        q: query.q,
        kategoriId: query.kategoriId,
        minFiyat: query.minFiyat,
        maxFiyat: query.maxFiyat,
        saticiId: query.saticiId,
        sehir: query.sehir,
        ilce: query.ilce,
        teslimatSehir: query.teslimatSehir,
        uretimSehir: query.uretimSehir,
        sadeceStoktaOlanlar: query.sadeceStoktaOlanlar,
        sadeceAktif: query.sadeceAktif,
        sadeceDogrulanmisSatici: query.sadeceDogrulanmisSatici,
        sadeceYeniHasat: query.sadeceYeniHasat,
        sadeceEldenTeslim: query.sadeceEldenTeslim,
        sadeceKargolu: query.sadeceKargolu,
        minOrtalamaPuan: query.minOrtalamaPuan,
        sort: query.sort ?? "newest",
      })}`,
    ),
  bulkUpdateStock: (token: string, kalemler: BulkStockItemValues[]) =>
    request<ProductDto[]>("/api/Urun/toplu-stok", {
      method: "PATCH",
      token,
      body: JSON.stringify({ kalemler }),
    }),
  priceAlerts: (token: string) =>
    request<PriceAlertDto[]>("/api/Urun/fiyat-alarmlarim", { token }),
  savePriceAlert: (token: string, urunId: number, hedefFiyat: number) =>
    request<PriceAlertDto>(`/api/Urun/${urunId}/fiyat-alarmi`, {
      method: "POST",
      token,
      body: JSON.stringify({ hedefFiyat }),
    }),
  deletePriceAlert: (token: string, urunId: number) =>
    request<null>(`/api/Urun/${urunId}/fiyat-alarmi`, {
      method: "DELETE",
      token,
    }),
  stockAlerts: (token: string) =>
    request<StockAlertDto[]>("/api/Urun/stok-alarmlarim", { token }),
  saveStockAlert: (token: string, urunId: number) =>
    request<StockAlertDto>(`/api/Urun/${urunId}/stok-alarmi`, {
      method: "POST",
      token,
    }),
  deleteStockAlert: (token: string, urunId: number) =>
    request<null>(`/api/Urun/${urunId}/stok-alarmi`, {
      method: "DELETE",
      token,
    }),
  followedSellers: (token: string) =>
    request<FeaturedSellerDto[]>("/api/Profil/takip-edilenler", { token }),
  followSeller: (token: string, saticiId: string, bildirimAcikMi = true) =>
    request<null>(`/api/Profil/satici/${saticiId}/takip`, {
      method: "POST",
      token,
      body: JSON.stringify({ bildirimAcikMi }),
    }),
  unfollowSeller: (token: string, saticiId: string) =>
    request<null>(`/api/Profil/satici/${saticiId}/takip`, {
      method: "DELETE",
      token,
    }),
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
  updateSellerProfile: (token: string, values: SellerProfileUpdateValues) => {
    if (values.kapakResim) {
      const formData = new FormData();
      if (values.magazaAdi !== undefined) formData.append("magazaAdi", values.magazaAdi);
      if (values.adres !== undefined) formData.append("adres", values.adres);
      if (values.sehir !== undefined) formData.append("sehir", values.sehir);
      if (values.ilce !== undefined) formData.append("ilce", values.ilce);
      if (values.aciklama !== undefined) formData.append("aciklama", values.aciklama);
      if (values.phoneNumber !== undefined) formData.append("phoneNumber", values.phoneNumber);
      formData.append("kapakResim", values.kapakResim);
      return request<SellerProfileDto>("/api/Profil/satici", {
        method: "PUT",
        token,
        body: formData,
      });
    }
    const payload = { ...values };
    delete payload.kapakResim;
    return request<SellerProfileDto>("/api/Profil/satici", {
      method: "PUT",
      token,
      body: JSON.stringify(payload),
    });
  },
  buyerProfile: (token: string) =>
    request<BuyerProfileDto>("/api/Profil/alici", {
      token,
    }),
  updateBuyerProfile: (token: string, values: BuyerProfileUpdateValues) =>
    request<BuyerProfileDto>("/api/Profil/alici", {
      method: "PUT",
      token,
      body: JSON.stringify(values),
    }),
  sellerTrustScore: (saticiId: string) =>
    request<SellerTrustScoreDto>(`/api/Profil/satici/${saticiId}/guven-skoru`),
  publicSellerProfile: (saticiId: string) =>
    request<PublicSellerSummaryDto>(`/api/Profil/satici/${saticiId}`),
  featuredSellers: (take = 6) =>
    request<FeaturedSellerDto[]>(
      `/api/Profil/saticilar/one-cikan?${queryString({ take })}`,
    ),

  rateProduct: (token: string, urunId: number, puanDegeri: number) =>
    request<{ ortalama: number; urunOrtalama?: number }>("/api/Puan/puan-ekle", {
      method: "POST",
      token,
      body: JSON.stringify({ urunId, puanDegeri }),
    }),
  productRatings: (urunId: number) =>
    request<RatingDto[]>(`/api/Puan/urun/${urunId}`),
  averageRating: (urunId: number) =>
    request<{ ortalama: number }>(`/api/Puan/ortalama/${urunId}`),
  reviewEligibility: (token: string, urunId: number) =>
    request<ReviewEligibilityDto>(`/api/Urun/${urunId}/yorum-yetkisi`, {
      token,
    }),

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
  createOpenMarketDemand: (token: string, values: OpenMarketDemandValues) =>
    request<DemandDto>("/api/Talep/pazar", {
      method: "POST",
      token,
      body: JSON.stringify(values),
    }),
  openMarketDemands: (token: string, durum?: string, page = 1, pageSize = 12) =>
    request<Paginated<DemandDto>>(
      `/api/Talep/pazar?${queryString({ durum, page, pageSize })}`,
      { token },
    ),
  repeatDemand: (
    token: string,
    talepId: number,
    values?: { miktar?: number; not?: string },
  ) =>
    request<DemandDto>(`/api/Talep/${talepId}/tekrarla`, {
      method: "POST",
      token,
      body: JSON.stringify(values ?? {}),
    }),
  confirmAgreement: (token: string, talepId: number, gerceklestiMi: boolean) =>
    request<DemandDto>(`/api/Talep/${talepId}/anlasma-onayi`, {
      method: "POST",
      token,
      body: JSON.stringify({ gerceklestiMi }),
    }),
  buyerDemands: (token: string, durum?: string) =>
    request<DemandDto[]>(
      durum ? `/api/Talep/benim?${queryString({ durum })}` : "/api/Talep/benim",
      { token },
    ),
  sellerDemands: (token: string, durum?: string) =>
    request<DemandDto[]>(
      durum ? `/api/Talep/satici?${queryString({ durum })}` : "/api/Talep/satici",
      { token },
    ),
  upsertOffer: (
    token: string,
    talepId: number,
    values: OfferSubmitValues,
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
  rejectOffer: (token: string, teklifId: number) =>
    request<DemandDto>(`/api/Talep/teklif/${teklifId}/red`, {
      method: "POST",
      token,
    }),
  cancelDemand: (token: string, talepId: number) =>
    request<DemandDto>(`/api/Talep/${talepId}/iptal`, {
      method: "POST",
      token,
    }),
  demandDetail: (token: string, talepId: number) =>
    request<DemandDto>(`/api/Talep/${talepId}`, {
      token,
    }),
  devVerificationMessages: () =>
    request<DevVerificationMessageDto[]>("/dev/verification/messages"),
  clearDevVerificationMessages: () =>
    request<null>("/dev/verification/messages", {
      method: "DELETE",
    }),

  ortakAlimlar: (
    query: {
      hedefSehir?: string;
      menseiSehir?: string;
      q?: string;
      durum?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) =>
    request<Paginated<OrtakAlimDto>>(
      `/api/OrtakAlim?${queryString({
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 12,
        hedefSehir: query.hedefSehir,
        menseiSehir: query.menseiSehir,
        q: query.q,
        durum: query.durum,
      })}`,
    ),
  ortakAlimDetail: (id: number) => request<OrtakAlimDto>(`/api/OrtakAlim/${id}`),
  createOrtakAlim: (token: string, values: OrtakAlimCreateValues) =>
    request<OrtakAlimDto>("/api/OrtakAlim", {
      method: "POST",
      token,
      body: JSON.stringify(values),
    }),
  approveOrtakAlim: (token: string, id: number) =>
    request<OrtakAlimDto>(`/api/OrtakAlim/${id}/onayla`, {
      method: "POST",
      token,
    }),
  joinOrtakAlim: (token: string, id: number, values: OrtakAlimJoinValues = { katilimMiktari: 1 }) =>
    request<OrtakAlimDto>(`/api/OrtakAlim/${id}/katil`, {
      method: "POST",
      token,
      body: JSON.stringify(values),
    }),
  leaveOrtakAlim: (token: string, id: number) =>
    request<OrtakAlimDto>(`/api/OrtakAlim/${id}/katil`, {
      method: "DELETE",
      token,
    }),
  updateOrtakAlimStatus: (token: string, id: number, durum: string) =>
    request<OrtakAlimDto>(`/api/OrtakAlim/${id}/durum`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ durum }),
    }),

  planliGonderimler: (
    query: {
      hedefSehir?: string;
      menseiSehir?: string;
      saticiId?: string;
      take?: number;
    } = {},
  ) =>
    request<PlanliGonderimDto[]>(
      `/api/PlanliGonderim?${queryString({
        hedefSehir: query.hedefSehir,
        menseiSehir: query.menseiSehir,
        saticiId: query.saticiId,
        take: query.take ?? 20,
      })}`,
    ),
  createPlanliGonderim: (token: string, values: PlanliGonderimCreateValues) =>
    request<PlanliGonderimDto>("/api/PlanliGonderim", {
      method: "POST",
      token,
      body: JSON.stringify(values),
    }),
  cancelPlanliGonderim: (token: string, id: number) =>
    request<{ id: number; iptalEdildi: boolean }>(`/api/PlanliGonderim/${id}`, {
      method: "DELETE",
      token,
    }),

  conversations: (token: string) =>
    request<ChatConversationDto[]>("/api/Chat/conversations", {
      token,
    }),
  messages: (
    token: string,
    otherUserId: string,
    page = 1,
    pageSize = 50,
    urunId?: number,
    talepId?: number,
  ) =>
    request<ChatConversationMessagesDto>(
      `/api/Chat/messages/${otherUserId}?${queryString({ page, pageSize, urunId, talepId })}`,
      { token },
    ),
  sendMessage: (
    token: string,
    receiverId: string,
    message: string,
    urunId?: number,
    talepId?: number,
  ) =>
    request<ChatMessageDto>(`/api/Chat/messages/${receiverId}`, {
      method: "POST",
      token,
      body: JSON.stringify({ message, urunId, talepId }),
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
  createSupportRequest: (values: SupportRequestValues) =>
    request<SupportRequestResultDto>("/api/Destek/talep", {
      method: "POST",
      body: JSON.stringify(values),
    }),

  adminUsers: (token: string, query: AdminUsersQuery = {}) =>
    request<Paginated<AdminUserDto>>(
      `/api/Admin/kullanicilar?${queryString(query)}`,
      { token },
    ),
  adminSetSellerVerification: (
    token: string,
    saticiId: string,
    payload: {
      dogrulandiMi?: boolean | null;
      isletmeDogrulandiMi?: boolean | null;
      ureticiDogrulandiMi?: boolean | null;
      not?: string;
    },
  ) =>
    request<AdminUserDto>(`/api/Admin/saticilar/${saticiId}/dogrulama`, {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    }),
  adminDemandGaps: (token: string, top = 20) =>
    request<DemandGapDto[]>(`/api/Admin/talep-bosluklari?${queryString({ top })}`, {
      token,
    }),
  adminSetSellerStatus: (
    token: string,
    saticiId: string,
    payload: { aktifMi: boolean; sebep?: string },
  ) =>
    request<AdminUserDto>(`/api/Admin/saticilar/${saticiId}/durum`, {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    }),
  adminProducts: (token: string, query: AdminProductsQuery = {}) =>
    request<Paginated<ProductDto>>(
      `/api/Admin/urunler?${queryString(query)}`,
      { token },
    ),
  adminSetProductStatus: (
    token: string,
    urunId: number,
    payload: { aktifMi: boolean; sebep?: string },
  ) =>
    request<ProductDto>(`/api/Admin/urunler/${urunId}/durum`, {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    }),
  adminComments: (token: string, query: AdminCommentsQuery = {}) =>
    request<Paginated<AdminCommentDto>>(
      `/api/Admin/yorumlar?${queryString(query)}`,
      { token },
    ),
  adminSetCommentStatus: (
    token: string,
    yorumId: number,
    payload: { aktifMi: boolean; sebep?: string },
  ) =>
    request<AdminCommentDto>(`/api/Admin/yorumlar/${yorumId}/durum`, {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    }),
};
