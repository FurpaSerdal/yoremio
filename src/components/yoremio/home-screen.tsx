"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ClipboardList,
  Compass,
  Film,
  Heart,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MobileBottomNav,
  PanelHeader,
  PromiseBar,
  PublicHeader,
  SiteFooter,
} from "@/components/yoremio/ui-kit";
import {
  accountName,
  getCategoryImage,
  hasRole,
  productImage,
  productLocation,
  sellerCoverImage,
  sellerName,
  type AuthState,
  type LoadState,
  type Screen,
  type SortKey,
} from "@/components/yoremio/types";
import type {
  CategoryDto,
  FeaturedSellerDto,
  ProductDto,
  SellerProfileDto,
} from "@/lib/api";
import { cn, formatPrice } from "@/lib/utils";

const workflowSteps = [
  {
    step: "01",
    icon: Compass,
    title: "Yöresel Ürünü Keşfet",
    description: "Şehir, ilçe, kategori ve doğrulanmış üretici filtreleriyle gerçek ürünleri incele.",
    tone: "bg-emerald-50 text-primary border-emerald-200/80",
  },
  {
    step: "02",
    icon: ClipboardList,
    title: "İhtiyacına Göre Talep Aç",
    description: "Sepet veya ödeme adımı olmadan istediğin miktarı ve notunu üreticiye ilet.",
    tone: "bg-amber-50 text-amber-700 border-amber-200/80",
  },
  {
    step: "03",
    icon: Sparkles,
    title: "Fiyat Teklifi Al",
    description: "Üreticiden gelen güncel birim fiyat tekliflerini değerlendir, kabul ya da reddet.",
    tone: "bg-lime-50 text-lime-700 border-lime-200/80",
  },
  {
    step: "04",
    icon: MessageCircle,
    title: "Canlı Sohbet ile Anlaş",
    description: "Anlık sohbet üzerinden detayları netleştir, güven puanlı üreticiyle doğrudan anlaş.",
    tone: "bg-sky-50 text-sky-700 border-sky-200/80",
  },
] as const;

export function HomeScreen({
  authUser,
  sellerProfile,
  notificationUnreadCount,
  unreadMessageCount,
  categories,
  products,
  featuredSellers,
  productsState,
  favoriteIds,
  selectedCategoryId,
  verifiedOnly,
  sort,
  query,
  favoritesEnabled = true,
  onSelectCategory,
  onToggleVerifiedOnly,
  onSelectSort,
  onQueryChange,
  onOpenProduct,
  onOpenStorefront,
  onToggleFavorite,
  onNavigate,
  onLogout,
  onRetry,
}: {
  authUser: AuthState | null;
  sellerProfile?: SellerProfileDto | null;
  notificationUnreadCount: number;
  unreadMessageCount?: number;
  categories: CategoryDto[];
  products: ProductDto[];
  featuredSellers: FeaturedSellerDto[];
  productsState: LoadState;
  favoriteIds: Set<number>;
  selectedCategoryId: number | null;
  verifiedOnly: boolean;
  sort: SortKey;
  query: string;
  favoritesEnabled?: boolean;
  onSelectCategory: (categoryId: number | null) => void;
  onToggleVerifiedOnly: (value: boolean) => void;
  onSelectSort: (value: SortKey) => void;
  onQueryChange: (value: string) => void;
  onOpenProduct: (product: ProductDto) => void;
  onOpenStorefront: (saticiId: string) => void;
  onToggleFavorite: (productId: number) => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  onRetry: () => void;
}) {
  const [heroSearch, setHeroSearch] = useState(query);

  const visibleProducts = useMemo(() => {
    const filtered = verifiedOnly ? products.filter((p) => p.saticiDogrulanmis) : products;
    return filtered.slice(0, 10);
  }, [products, verifiedOnly]);

  const handleHeroSearch = (event: React.FormEvent) => {
    event.preventDefault();
    onQueryChange(heroSearch.trim());
    onNavigate("discover");
  };

  return (
    <div className="min-h-screen bg-[#f9fbf8] pb-20 text-foreground lg:pb-0">
      <PublicHeader
        authUser={authUser}
        sellerProfile={sellerProfile}
        notificationUnreadCount={notificationUnreadCount}
        unreadMessageCount={unreadMessageCount}
        query={query}
        setQuery={onQueryChange}
        activeScreen="home"
        onNavigate={onNavigate}
        onLogout={onLogout}
        onOpenStorefront={onOpenStorefront}
      />

      {/* Editorial Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-[#eef5ea]">
        <div className="absolute inset-0">
          <Image
            src="/hero-market-1600.jpg"
            alt="Yöresel üreticilerden taze doğal ürünler"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-90 sm:object-right"
          />
          <div className="absolute inset-0 bg-[linear-gradient(108deg,rgba(255,255,255,0.97)_0%,rgba(255,255,255,0.92)_46%,rgba(255,255,255,0.28)_100%)]" />
        </div>

        <div className="relative mx-auto max-w-[1360px] px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
          <div className="max-w-2xl animate-fade-up">
            <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-xs font-extrabold text-primary shadow-xs backdrop-blur-xs">
              <ShieldCheck className="size-3.5 text-primary" aria-hidden />
              <span>Aracısız Üretici Pazaryeri</span>
              {authUser ? (
                <span className="border-l border-border pl-2 text-brand-brown">
                  Hoş geldin, {accountName(authUser, sellerProfile)}
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 font-serif text-3xl leading-[1.08] font-bold tracking-tight text-[#11241a] sm:text-5xl lg:text-[3.35rem]">
              Doğal lezzetler,{" "}
              <span className="text-primary">aracısız doğallık</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-[#36443d] sm:text-base sm:leading-7">
              Türkiye&apos;nin dört bir yanındaki köy üreticilerini ve coğrafi lezzetleri doğrudan keşfet.
              Ürünü beğen, miktarını belirtip talep oluştur; üreticiyle teklif ve canlı sohbet üzerinden anlaş.
            </p>

            {/* Quick Hero Search */}
            <form
              onSubmit={handleHeroSearch}
              className="mt-6 flex flex-col gap-2 rounded-2xl border border-border/90 bg-white/95 p-2 shadow-[0_18px_40px_rgba(16,24,40,0.08)] backdrop-blur-sm sm:flex-row sm:items-center"
            >
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  value={heroSearch}
                  onChange={(event) => {
                    setHeroSearch(event.target.value);
                    onQueryChange(event.target.value);
                  }}
                  placeholder="Ne arıyorsun? (ör. tulum peyniri, yayla balı, Amasya...)"
                  className="h-11 border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0"
                />
              </div>
              <Button type="submit" size="lg" className="h-11 rounded-xl px-6 font-extrabold">
                Ürünleri Keşfet
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </form>

            {/* Quick Action Pills */}
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full bg-white/90 font-bold"
                onClick={() => onNavigate("discover")}
              >
                <Compass className="size-4 text-primary" aria-hidden />
                Tüm Ürün Vitrini
              </Button>
              {!authUser ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-full font-bold"
                    onClick={() => onNavigate("seller-register")}
                  >
                    <Store className="size-4" aria-hidden />
                    Üretici Ol & Mağaza Aç
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full bg-white/75 font-bold hover:bg-white"
                    onClick={() => onNavigate("login")}
                  >
                    Demo ile Giriş Yap
                  </Button>
                </>
              ) : hasRole(authUser, "SATICI") ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full font-bold"
                  onClick={() => onNavigate("seller-product")}
                >
                  + Yeni Ürün Ekle
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full font-bold"
                  onClick={() => onNavigate("buyer")}
                >
                  Taleplerim & Mesajlar
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Floating Category Shelf */}
      <section className="relative z-10 mx-auto -mt-6 max-w-[1360px] px-4 sm:px-6">
        <div className="rounded-2xl border border-border bg-white p-3.5 shadow-[0_14px_34px_rgba(16,24,40,0.06)] sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-black text-brand-brown sm:text-lg">
                Kategorilere Göre Keşfet
              </h2>
              <p className="text-xs text-muted-foreground">
                Yöresel ürün grubunu seç, üreticilerin güncel vitrinini filtrele.
              </p>
            </div>
            {selectedCategoryId !== null ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs font-bold text-primary"
                onClick={() => onSelectCategory(null)}
              >
                Tümünü Göster
              </Button>
            ) : null}
          </div>

          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className={cn(
                "group flex w-20 shrink-0 flex-col items-center gap-2 rounded-xl border p-2.5 text-center transition sm:w-auto",
                selectedCategoryId === null
                  ? "border-primary bg-emerald-50/80 shadow-xs"
                  : "border-transparent bg-[#f7faf6] hover:border-border hover:bg-white",
              )}
            >
              <div className="grid size-12 place-items-center rounded-full border border-emerald-200 bg-white text-primary shadow-xs transition group-hover:scale-105 sm:size-14">
                <Sparkles className="size-5" aria-hidden />
              </div>
              <span className="line-clamp-2 text-xs font-extrabold text-brand-brown">
                Tümü
              </span>
            </button>

            {categories.map((category, index) => {
              const active = selectedCategoryId === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onSelectCategory(active ? null : category.id)}
                  className={cn(
                    "group flex w-20 shrink-0 flex-col items-center gap-2 rounded-xl border p-2.5 text-center transition sm:w-auto",
                    active
                      ? "border-primary bg-emerald-50/80 shadow-xs"
                      : "border-transparent bg-[#f7faf6] hover:border-border hover:bg-white",
                  )}
                >
                  <div className="relative size-12 overflow-hidden rounded-full border border-border bg-white shadow-xs transition group-hover:scale-105 sm:size-14">
                    <Image
                      src={getCategoryImage(category, index)}
                      alt={category.adi}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <span className="line-clamp-2 text-xs font-extrabold leading-tight text-brand-brown">
                    {category.adi}
                  </span>
                  {typeof category.urunSayisi === "number" ? (
                    <span className="rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-bold text-primary tabular-nums">
                      {category.urunSayisi} ürün
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="mx-auto max-w-[1360px] space-y-10 px-4 py-8 sm:px-6 sm:py-10">
        {/* Quick Filter Chips & Product Grid */}
        <section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#14271c] sm:text-3xl">
                Öne Çıkan Doğal Ürünler
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Gerçek üretici stokları, doğrulanmış değerlendirmeler ve doğrudan talep imkânı.
              </p>
            </div>
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => {
                  onToggleVerifiedOnly(false);
                  onSelectSort("newest");
                }}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-extrabold transition",
                  !verifiedOnly && sort === "newest"
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-muted-foreground hover:border-primary/40",
                )}
              >
                Yeni Hasat
              </button>
              <button
                type="button"
                onClick={() => onToggleVerifiedOnly(!verifiedOnly)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-extrabold transition",
                  verifiedOnly
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-muted-foreground hover:border-primary/40",
                )}
              >
                <ShieldCheck className="size-3.5" aria-hidden />
                Doğrulanmış Üretici
              </button>
              <button
                type="button"
                onClick={() => onSelectSort("top_rated")}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-extrabold transition",
                  sort === "top_rated"
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-muted-foreground hover:border-primary/40",
                )}
              >
                En Yüksek Puan
              </button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 font-bold text-primary"
                onClick={() => onNavigate("discover")}
              >
                Tümünü Gör
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>

          <div className="mt-5">
            {productsState === "loading" && products.length === 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-72 animate-pulse rounded-2xl border border-border bg-white/80"
                  />
                ))}
              </div>
            ) : productsState === "error" && products.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="font-bold text-brand-brown">Ürünler şu an yüklenemedi.</p>
                <Button className="mt-3" size="sm" onClick={onRetry}>
                  Tekrar Dene
                </Button>
              </Card>
            ) : visibleProducts.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="font-black text-brand-brown">Bu filtrede ürün bulunamadı.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Filtreleri sıfırlayarak tüm yöresel ürünleri listeleyebilirsin.
                </p>
                <Button
                  className="mt-4"
                  size="sm"
                  onClick={() => {
                    onSelectCategory(null);
                    onToggleVerifiedOnly(false);
                    onQueryChange("");
                  }}
                >
                  Filtreleri Sıfırla
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                {visibleProducts.map((product) => (
                  <HomeProductCard
                    key={product.id}
                    product={product}
                    favorite={favoriteIds.has(product.id)}
                    favoritesEnabled={favoritesEnabled}
                    onOpen={() => onOpenProduct(product)}
                    onOpenStorefront={
                      product.saticiId
                        ? () => onOpenStorefront(product.saticiId!)
                        : undefined
                    }
                    onFavorite={() => onToggleFavorite(product.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Featured Sellers Trust Showcase */}
        {featuredSellers.length > 0 ? (
          <section>
            <PanelHeader
              title="Öne Çıkan Üreticiler & Güven Vitrini"
              action="Tüm Mağazaları Keşfet"
              onAction={() => onNavigate("discover")}
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featuredSellers.map((seller) => (
                <Card
                  key={seller.kullaniciId}
                  className="group overflow-hidden rounded-2xl border-border/90 bg-white transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(16,24,40,0.08)]"
                >
                  <div className="relative h-28 bg-[#eef5ea]">
                    <Image
                      src={sellerCoverImage(seller)}
                      alt={seller.magazaAdi}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                    <div className="absolute left-3 top-3 flex items-center gap-1.5">
                      {seller.dogrulanmisSatici ? (
                        <Badge variant="green" className="shadow-xs">
                          <CheckCircle2 className="mr-1 size-3" aria-hidden />
                          Doğrulanmış
                        </Badge>
                      ) : null}
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-black text-primary shadow-xs tabular-nums">
                      Güven {Math.round(seller.guvenSkoru ?? 0)}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="truncate text-base font-black text-brand-brown">
                      {seller.magazaAdi}
                    </h3>
                    <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                      <MapPin className="size-3.5 text-primary" aria-hidden />
                      {[seller.sehir, seller.ilce].filter(Boolean).join(", ") || "Türkiye"}
                    </p>
                    <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-3">
                      <span className="text-xs font-bold text-muted-foreground">
                        {seller.urunSayisi ?? 0} aktif ürün
                      </span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 rounded-lg px-3 text-xs font-extrabold"
                        onClick={() => onOpenStorefront(seller.kullaniciId)}
                      >
                        Vitrini Aç
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        {/* How It Works Presentation Strip */}
        <section className="rounded-3xl border border-emerald-200/70 bg-[linear-gradient(135deg,#f4faf2_0%,#ffffff_55%,#fffaf0_100%)] p-5 shadow-[0_14px_34px_rgba(0,107,53,0.05)] sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-primary">
                <Award className="size-3.5" aria-hidden />
                Yöremio Nasıl Çalışır?
              </span>
              <h2 className="mt-2 font-serif text-2xl font-bold text-[#14271c] sm:text-3xl">
                Sepet Yok, Aracı Yok — 4 Adımda Doğrudan Anlaşma
              </h2>
            </div>
            <Button
              type="button"
              variant="outline"
              className="self-start rounded-xl bg-white font-bold"
              onClick={() => onNavigate("discover")}
            >
              Hemen Talep Oluştur
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
            {workflowSteps.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="rounded-2xl border border-border/80 bg-white/95 p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "grid size-10 place-items-center rounded-xl border",
                        item.tone,
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="font-serif text-2xl font-black text-muted-foreground/30 tabular-nums">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-black text-brand-brown">{item.title}</h3>
                  <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Dual Role Presentation Showcase */}
        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="relative overflow-hidden rounded-3xl border-emerald-200/80 bg-white p-5 shadow-xs sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-primary">
                <UserRound className="size-3.5" aria-hidden />
                Alıcılar İçin Şeffaf Deneyim
              </span>
              <span className="text-xs font-extrabold text-muted-foreground">Doğrudan Erişim</span>
            </div>
            <h3 className="mt-3 font-serif text-xl font-bold text-[#14271c] sm:text-2xl">
              Aradığın Ürünü Özelleştirerek Talep Et
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              İstediğin miktarı ve ambalaj/teslim notunu doğrudan üreticiye ilet; gelen fiyat tekliflerini tek panelden kabul veya reddet.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                className="rounded-xl font-extrabold"
                onClick={() => onNavigate("discover")}
              >
                Ürünlere Göz At
              </Button>
              {!authUser ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl font-bold"
                  onClick={() => onNavigate("buyer-register")}
                >
                  Alıcı Hesabı Aç
                </Button>
              ) : null}
            </div>
          </Card>

          <Card className="relative overflow-hidden rounded-3xl border-amber-200/80 bg-[linear-gradient(135deg,#fffef9_0%,#f7fbf6_100%)] p-5 shadow-xs sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                <Store className="size-3.5" aria-hidden />
                Yerel Üreticiler İçin Vitrin
              </span>
              <span className="text-xs font-extrabold text-muted-foreground">Güven Puanlı Mağaza</span>
            </div>
            <h3 className="mt-3 font-serif text-xl font-bold text-[#14271c] sm:text-2xl">
              Fotoğraf, Video ve Tekliflerle Satışını Yönet
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Üretim hikayeni paylaş, gelen taleplere anlık birim fiyat teklifi gönder, doğrulanmış satıcı rozeti ve yüksek güven puanı ile öne çık.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {hasRole(authUser, "SATICI") ? (
                <Button
                  type="button"
                  size="sm"
                  className="rounded-xl font-extrabold"
                  onClick={() => onNavigate("seller")}
                >
                  Satıcı Paneline Git
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="rounded-xl font-extrabold"
                  onClick={() => onNavigate("seller-register")}
                >
                  Mağazanı Hemen Aç
                </Button>
              )}
            </div>
          </Card>
        </section>
      </div>

      <PromiseBar />
      <SiteFooter onNavigate={onNavigate} authUser={authUser} />
      <MobileBottomNav
        activeScreen="home"
        authUser={authUser}
        unreadMessages={unreadMessageCount}
        onNavigate={onNavigate}
      />
    </div>
  );
}

function HomeProductCard({
  product,
  favorite,
  favoritesEnabled,
  onOpen,
  onOpenStorefront,
  onFavorite,
}: {
  product: ProductDto;
  favorite: boolean;
  favoritesEnabled: boolean;
  onOpen: () => void;
  onOpenStorefront?: () => void;
  onFavorite: () => void;
}) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-2xl border-border/90 bg-white transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(16,24,40,0.08)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f2f5f0]">
        <button type="button" onClick={onOpen} className="block size-full text-left">
          <Image
            src={productImage(product)}
            alt={product.adi}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        </button>

        <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1">
          {product.saticiDogrulanmis ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-black text-primary shadow-xs">
              <ShieldCheck className="size-3" aria-hidden />
              Doğrulanmış
            </span>
          ) : null}
          {(product.videolar?.length ?? 0) > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
              <Film className="size-3" aria-hidden />
              Video
            </span>
          ) : null}
          {product.stokMiktari > 0 && product.stokMiktari <= 5 ? (
            <span className="inline-flex items-center rounded-full bg-amber-500/95 px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
              Son {product.stokMiktari}
            </span>
          ) : null}
        </div>

        {favoritesEnabled ? (
          <button
            type="button"
            onClick={onFavorite}
            aria-label={favorite ? "Favorilerden çıkar" : "Favorilere ekle"}
            className={cn(
              "absolute right-2 top-2 grid size-8 place-items-center rounded-full border border-white/70 bg-white/90 shadow-xs backdrop-blur-xs transition hover:scale-105",
              favorite ? "text-red-500" : "text-muted-foreground hover:text-red-500",
            )}
          >
            <Heart className={cn("size-4", favorite && "fill-current")} aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        <button type="button" onClick={onOpen} className="text-left">
          <h3 className="line-clamp-2 text-sm font-black leading-snug text-brand-brown group-hover:text-primary sm:text-[15px]">
            {product.adi}
          </h3>
        </button>

        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
          {onOpenStorefront ? (
            <button
              type="button"
              onClick={onOpenStorefront}
              className="truncate text-left font-bold text-primary hover:underline"
            >
              {sellerName(product)}
            </button>
          ) : (
            <span className="truncate">{sellerName(product)}</span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {productLocation(product)}
        </p>

        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-base font-black text-primary tabular-nums sm:text-lg">
              {formatPrice(product.fiyat)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-extrabold text-amber-800 tabular-nums">
              <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
              {(product.ortalamaPuan ?? 0).toFixed(1)}
            </span>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onOpen}
            className="mt-2.5 h-8 w-full rounded-xl text-xs font-extrabold"
          >
            İncele & Talep Aç
          </Button>
        </div>
      </div>
    </Card>
  );
}
