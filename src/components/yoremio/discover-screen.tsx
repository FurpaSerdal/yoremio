"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Bell,
  BellRing,
  Check,
  Eye,
  Film,
  Heart,
  LayoutGrid,
  Leaf,
  List,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Snowflake,
  Sparkles,
  Star,
  Store,
  Truck,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  EmptyState,
  Field,
  LocationFields,
  MobileBottomNav,
  PaginationBar,
  PublicHeader,
  SiteFooter,
  Stars,
} from "@/components/yoremio/ui-kit";
import {
  mediaImageSrc,
  mediaVideoSrc,
  ortakAlimStatusMeta,
  productImage,
  productLocation,
  sellerName,
  sortLabels,
  type AuthState,
  type LoadState,
  type ProductListMode,
  type Screen,
  type SortKey,
} from "@/components/yoremio/types";
import type {
  BootstrapLocationDto,
  CategoryDto,
  OrtakAlimDto,
  Paginated,
  ProductDto,
  SellerProfileDto,
  SmartAlternativesDto,
} from "@/lib/api";
import { cn, formatPrice, formatShortDate } from "@/lib/utils";

export function DiscoveryScreen({
  authUser,
  sellerProfile,
  notificationUnreadCount,
  unreadMessageCount,
  categories,
  locations = [],
  cities = [],
  productsPage,
  productsState,
  selectedProduct,
  favoriteIds,
  query,
  categoryId,
  city,
  district,
  teslimatSehir = "",
  uretimSehir = "",
  minPrice,
  maxPrice,
  onlyInStock,
  verifiedOnly,
  sadeceYeniHasat = false,
  sadeceEldenTeslim = false,
  sadeceKargolu = false,
  minRating,
  sort,
  sortOptions,
  smartAlternatives = null,
  priceAlarmProductIds,
  stockAlarmProductIds,
  followedSellerIds,
  actionStatus,
  demandFlowEnabled = true,
  favoritesEnabled = true,
  chatEnabled = true,
  onQueryChange,
  onCategoryChange,
  onCityChange,
  onDistrictChange,
  onTeslimatSehirChange,
  onUretimSehirChange,
  onMinPriceChange,
  onMaxPriceChange,
  onOnlyInStockChange,
  onVerifiedOnlyChange,
  onSadeceYeniHasatChange,
  onSadeceEldenTeslimChange,
  onSadeceKargoluChange,
  onMinRatingChange,
  onSortChange,
  onPageChange,
  onSelectProduct,
  onOpenStorefront,
  onCreateDemand,
  onOpenOpenMarketModal,
  onSavePriceAlert,
  onToggleStockAlarm,
  onToggleFollowSeller,
  onJoinOrtakAlim,
  onToggleFavorite,
  onStartChat,
  onGoReviews,
  onClearFilters,
  onRetry,
  onNavigate,
  onLogout,
}: {
  authUser: AuthState | null;
  sellerProfile?: SellerProfileDto | null;
  notificationUnreadCount: number;
  unreadMessageCount?: number;
  categories: CategoryDto[];
  locations?: BootstrapLocationDto[];
  cities?: string[];
  productsPage: Paginated<ProductDto>;
  productsState: LoadState;
  selectedProduct: ProductDto | null;
  favoriteIds: Set<number>;
  query: string;
  categoryId: number | null;
  city: string;
  district: string;
  teslimatSehir?: string;
  uretimSehir?: string;
  minPrice: string;
  maxPrice: string;
  onlyInStock: boolean;
  verifiedOnly: boolean;
  sadeceYeniHasat?: boolean;
  sadeceEldenTeslim?: boolean;
  sadeceKargolu?: boolean;
  minRating: number | null;
  sort: SortKey;
  sortOptions: string[];
  smartAlternatives?: SmartAlternativesDto | null;
  priceAlarmProductIds?: Set<number>;
  stockAlarmProductIds?: Set<number>;
  followedSellerIds?: Set<string>;
  actionStatus: string | null;
  demandFlowEnabled?: boolean;
  favoritesEnabled?: boolean;
  chatEnabled?: boolean;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: number | null) => void;
  onCityChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  onTeslimatSehirChange?: (value: string) => void;
  onUretimSehirChange?: (value: string) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onOnlyInStockChange: (value: boolean) => void;
  onVerifiedOnlyChange: (value: boolean) => void;
  onSadeceYeniHasatChange?: (value: boolean) => void;
  onSadeceEldenTeslimChange?: (value: boolean) => void;
  onSadeceKargoluChange?: (value: boolean) => void;
  onMinRatingChange: (value: number | null) => void;
  onSortChange: (value: SortKey) => void;
  onPageChange: (page: number) => void;
  onSelectProduct: (product: ProductDto) => void;
  onOpenStorefront: (saticiId: string) => void;
  onCreateDemand: (product: ProductDto, miktar: number, note?: string) => Promise<void> | void;
  onOpenOpenMarketModal?: () => void;
  onSavePriceAlert?: (product: ProductDto, hedefFiyat: number) => Promise<void> | void;
  onToggleStockAlarm?: (product: ProductDto) => Promise<void> | void;
  onToggleFollowSeller?: (saticiId: string) => Promise<void> | void;
  onJoinOrtakAlim?: (campaign: OrtakAlimDto) => void;
  onToggleFavorite: (productId: number) => void;
  onStartChat: (product: ProductDto) => void;
  onGoReviews: (product: ProductDto) => void;
  onClearFilters: () => void;
  onRetry: () => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}) {
  const [viewMode, setViewMode] = useState<ProductListMode>("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const activeFilterCount = [
    Boolean(query.trim()),
    categoryId !== null,
    Boolean(city.trim()),
    Boolean(district.trim()),
    Boolean(teslimatSehir.trim()),
    Boolean(uretimSehir.trim()),
    Boolean(minPrice.trim()),
    Boolean(maxPrice.trim()),
    onlyInStock,
    verifiedOnly,
    sadeceYeniHasat,
    sadeceEldenTeslim,
    sadeceKargolu,
    minRating !== null,
  ].filter(Boolean).length;

  const activeCategoryName =
    categories.find((c) => c.id === categoryId)?.adi ?? "Tüm Yöresel Ürünler";

  const activeChips: { key: string; label: string; onClear: () => void }[] = [
    ...(query.trim()
      ? [{ key: "q", label: `Arama: "${query.trim()}"`, onClear: () => onQueryChange("") }]
      : []),
    ...(categoryId !== null
      ? [{ key: "cat", label: `Kategori: ${activeCategoryName}`, onClear: () => onCategoryChange(null) }]
      : []),
    ...(city.trim()
      ? [{ key: "city", label: `Şehir: ${city.trim()}`, onClear: () => onCityChange("") }]
      : []),
    ...(district.trim()
      ? [{ key: "dist", label: `İlçe: ${district.trim()}`, onClear: () => onDistrictChange("") }]
      : []),
    ...(teslimatSehir.trim() && onTeslimatSehirChange
      ? [{ key: "delcity", label: `Teslimat: ${teslimatSehir.trim()}`, onClear: () => onTeslimatSehirChange("") }]
      : []),
    ...(uretimSehir.trim() && onUretimSehirChange
      ? [{ key: "origcity", label: `Üretim: ${uretimSehir.trim()}`, onClear: () => onUretimSehirChange("") }]
      : []),
    ...(minPrice.trim() || maxPrice.trim()
      ? [
          {
            key: "price",
            label: `Fiyat: ${minPrice || "0"} - ${maxPrice || "∞"} ₺`,
            onClear: () => {
              onMinPriceChange("");
              onMaxPriceChange("");
            },
          },
        ]
      : []),
    ...(minRating !== null
      ? [{ key: "rate", label: `Min ${minRating}★`, onClear: () => onMinRatingChange(null) }]
      : []),
    ...(onlyInStock
      ? [{ key: "stock", label: "Sadece Stokta", onClear: () => onOnlyInStockChange(false) }]
      : []),
    ...(verifiedOnly
      ? [{ key: "verified", label: "Doğrulanmış Üretici", onClear: () => onVerifiedOnlyChange(false) }]
      : []),
    ...(sadeceYeniHasat && onSadeceYeniHasatChange
      ? [{ key: "newharvest", label: "Yeni Hasat", onClear: () => onSadeceYeniHasatChange(false) }]
      : []),
    ...(sadeceEldenTeslim && onSadeceEldenTeslimChange
      ? [{ key: "hand", label: "Elden Teslim", onClear: () => onSadeceEldenTeslimChange(false) }]
      : []),
    ...(sadeceKargolu && onSadeceKargoluChange
      ? [{ key: "cargo", label: "Kargo Gönderim", onClear: () => onSadeceKargoluChange(false) }]
      : []),
  ];

  const handleSelectProduct = (product: ProductDto) => {
    onSelectProduct(product);
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setMobileDetailOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8f5] pb-20 lg:pb-0">
      <PublicHeader
        authUser={authUser}
        sellerProfile={sellerProfile}
        notificationUnreadCount={notificationUnreadCount}
        unreadMessageCount={unreadMessageCount}
        query={query}
        setQuery={onQueryChange}
        activeScreen="discover"
        onNavigate={onNavigate}
        onLogout={onLogout}
        onOpenStorefront={onOpenStorefront}
      />

      <main className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7">
        {/* Editorial Discovery Header & Controls */}
        <section className="relative mb-5 overflow-hidden rounded-3xl border border-emerald-200/75 bg-[linear-gradient(125deg,#eef7ef_0%,#ffffff_55%,#fffaf0_100%)] p-5 shadow-[0_12px_34px_rgba(0,107,53,0.06)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-primary">
                  <Sparkles className="size-3" aria-hidden />
                  Yerel Üretici Pazarı
                </span>
                <Badge variant="secondary" className="bg-white/90 font-extrabold text-primary shadow-2xs tabular-nums">
                  {productsPage.totalCount} ürün listeleniyor
                </Badge>
              </div>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-[#14271c] sm:text-3xl">
                {activeCategoryName}
              </h1>
              <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Üreticiden doğrudan taze ürünler — kart seçip sağdaki inceleme panelinden anında talep aç veya üreticiyle sohbet başlat.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onOpenOpenMarketModal ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1.5 rounded-xl border-emerald-300/80 bg-white/95 text-xs font-extrabold text-primary shadow-2xs hover:bg-emerald-50"
                  onClick={onOpenOpenMarketModal}
                >
                  <Sparkles className="size-3.5" aria-hidden />
                  Aradığın Yoksa Talep Aç
                </Button>
              ) : null}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-xl bg-white lg:hidden"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <SlidersHorizontal className="size-4" aria-hidden />
                Filtrele
                {activeFilterCount > 0 ? (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-black text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
              </Button>

              <select
                aria-label="Sıralama"
                value={sort}
                onChange={(event) => onSortChange(event.target.value)}
                className="h-9 rounded-xl border border-border bg-white px-3 text-xs font-bold text-foreground shadow-2xs outline-none transition-[border-color,box-shadow] hover:border-primary/45 focus:border-primary focus:ring-2 focus:ring-primary/15 sm:text-sm"
              >
                {sortOptions.map((key) => (
                  <option key={key} value={key}>
                    {sortLabels[key] ?? key}
                  </option>
                ))}
              </select>

              <div className="hidden items-center rounded-xl border border-border bg-white/90 p-1 shadow-2xs sm:flex">
                <button
                  type="button"
                  aria-label="Izgara görünümü"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "rounded-lg p-1.5 transition-[transform,background-color,color] duration-150 active:scale-95",
                    viewMode === "grid"
                      ? "bg-secondary text-primary shadow-2xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <LayoutGrid className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Liste görünümü"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "rounded-lg p-1.5 transition-[transform,background-color,color] duration-150 active:scale-95",
                    viewMode === "list"
                      ? "bg-secondary text-primary shadow-2xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <List className="size-4" aria-hidden />
                </button>
              </div>
            </div>
          </div>

          {/* 1-Click Horizontal Category Ribbon */}
          {categories.length > 0 ? (
            <div className="scroll-shelf mt-4 flex items-center gap-2 overflow-x-auto border-t border-emerald-200/60 pt-3.5 pb-1">
              <button
                type="button"
                onClick={() => onCategoryChange(null)}
                className={cn(
                  "inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-extrabold transition-[transform,background-color,border-color,color,box-shadow] duration-150 active:scale-95",
                  categoryId === null
                    ? "border-primary bg-primary text-white shadow-xs"
                    : "border-border/90 bg-white text-foreground hover:border-primary/45 hover:text-primary",
                )}
              >
                <span>Tümü</span>
              </button>
              {categories.map((cat) => {
                const isSelectedCat = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onCategoryChange(isSelectedCat ? null : cat.id)}
                    className={cn(
                      "inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-[transform,background-color,border-color,color,box-shadow] duration-150 active:scale-95",
                      isSelectedCat
                        ? "border-primary bg-primary text-white shadow-xs"
                        : "border-border/90 bg-white text-foreground hover:border-primary/45 hover:text-primary",
                    )}
                  >
                    <span>{cat.adi}</span>
                    {typeof cat.urunSayisi === "number" ? (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-black tabular-nums",
                          isSelectedCat
                            ? "bg-white/20 text-white"
                            : "bg-secondary text-primary",
                        )}
                      >
                        {cat.urunSayisi}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* Quick Attribute Pills */}
          <div className="scroll-shelf mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {onSadeceYeniHasatChange ? (
              <button
                type="button"
                onClick={() => onSadeceYeniHasatChange(!sadeceYeniHasat)}
                className={cn(
                  "inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold transition-[transform,background-color,border-color,color] duration-150 active:scale-95",
                  sadeceYeniHasat
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-2xs"
                    : "border-border/80 bg-white/90 text-muted-foreground hover:border-emerald-300 hover:text-emerald-800",
                )}
              >
                <Leaf className="size-3" aria-hidden />
                Yeni Hasat
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onVerifiedOnlyChange(!verifiedOnly)}
              className={cn(
                "inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold transition-[transform,background-color,border-color,color] duration-150 active:scale-95",
                verifiedOnly
                  ? "border-primary bg-primary text-white shadow-2xs"
                  : "border-border/80 bg-white/90 text-muted-foreground hover:border-primary/45 hover:text-primary",
              )}
            >
              <ShieldCheck className="size-3" aria-hidden />
              Doğrulanmış Üretici
            </button>
            {onSadeceEldenTeslimChange ? (
              <button
                type="button"
                onClick={() => onSadeceEldenTeslimChange(!sadeceEldenTeslim)}
                className={cn(
                  "inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold transition-[transform,background-color,border-color,color] duration-150 active:scale-95",
                  sadeceEldenTeslim
                    ? "border-primary bg-secondary text-primary"
                    : "border-border/80 bg-white/90 text-muted-foreground hover:border-primary/45 hover:text-primary",
                )}
              >
                <MapPin className="size-3" aria-hidden />
                Elden Teslim
              </button>
            ) : null}
            {onSadeceKargoluChange ? (
              <button
                type="button"
                onClick={() => onSadeceKargoluChange(!sadeceKargolu)}
                className={cn(
                  "inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold transition-[transform,background-color,border-color,color] duration-150 active:scale-95",
                  sadeceKargolu
                    ? "border-sky-600 bg-sky-50 text-sky-900"
                    : "border-border/80 bg-white/90 text-muted-foreground hover:border-sky-300 hover:text-sky-800",
                )}
              >
                <Truck className="size-3" aria-hidden />
                Kargolu
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onOnlyInStockChange(!onlyInStock)}
              className={cn(
                "inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold transition-[transform,background-color,border-color,color] duration-150 active:scale-95",
                onlyInStock
                  ? "border-primary bg-secondary text-primary"
                  : "border-border/80 bg-white/90 text-muted-foreground hover:border-primary/45 hover:text-primary",
              )}
            >
              Stokta Olanlar
            </button>
          </div>
        </section>

        {/* Active Filter Chips Bar */}
        {activeChips.length > 0 ? (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border/80 bg-white px-3.5 py-2.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              Aktif Filtreler:
            </span>
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.onClear}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-primary transition hover:bg-emerald-100"
              >
                <span>{chip.label}</span>
                <X className="size-3" aria-hidden />
              </button>
            ))}
            <button
              type="button"
              onClick={onClearFilters}
              className="ml-auto text-xs font-extrabold text-red-600 hover:underline"
            >
              Tümünü Temizle
            </button>
          </div>
        ) : null}

        {/* Desktop 3-column layout */}
        <div className="grid gap-6 lg:grid-cols-[268px_minmax(0,1fr)] xl:grid-cols-[268px_minmax(0,1fr)_400px]">
          <aside className="hidden lg:block">
            <div className="thin-scrollbar overscroll-contain sticky top-24 max-h-[calc(100vh-6.75rem)] overflow-y-auto pr-1">
              <DiscoveryFilters
                categories={categories}
                locations={locations}
                cities={cities}
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
                onQueryChange={onQueryChange}
                onCategoryChange={onCategoryChange}
                onCityChange={onCityChange}
                onDistrictChange={onDistrictChange}
                onTeslimatSehirChange={onTeslimatSehirChange}
                onUretimSehirChange={onUretimSehirChange}
                onMinPriceChange={onMinPriceChange}
                onMaxPriceChange={onMaxPriceChange}
                onOnlyInStockChange={onOnlyInStockChange}
                onVerifiedOnlyChange={onVerifiedOnlyChange}
                onSadeceYeniHasatChange={onSadeceYeniHasatChange}
                onSadeceEldenTeslimChange={onSadeceEldenTeslimChange}
                onSadeceKargoluChange={onSadeceKargoluChange}
                onMinRatingChange={onMinRatingChange}
                onClear={onClearFilters}
              />
            </div>
          </aside>

          {/* Product Results */}
          <section className="min-w-0">
            {productsState === "loading" && productsPage.items.length === 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-72 animate-pulse rounded-2xl border border-border bg-white"
                  />
                ))}
              </div>
            ) : productsState === "error" && productsPage.items.length === 0 ? (
              <EmptyState
                icon={Search}
                title="Ürünler yüklenemedi"
                description="Bağlantı geçici olarak yanıt vermedi. Lütfen tekrar dene."
                action={<Button onClick={onRetry}>Yeniden Dene</Button>}
              />
            ) : productsPage.items.length === 0 ? (
              <div className="space-y-4">
                <EmptyState
                  icon={Search}
                  title="Eşleşen ürün bulunamadı"
                  description="Arama kelimesini esnetebilir veya üreticilere açık 'Benim İçin Bul' talebi gönderebilirsin."
                  action={
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button variant="outline" onClick={onClearFilters}>
                        Filtreleri Temizle
                      </Button>
                      {onOpenOpenMarketModal ? (
                        <Button onClick={onOpenOpenMarketModal}>
                          <Sparkles className="size-4" aria-hidden />
                          Benim İçin Bul (Açık Talep Aç)
                        </Button>
                      ) : null}
                    </div>
                  }
                />
                {smartAlternatives ? (
                  <SmartAlternativesSection
                    alternatives={smartAlternatives}
                    onSelectProduct={handleSelectProduct}
                    onOpenStorefront={onOpenStorefront}
                    onOpenOpenMarketModal={onOpenOpenMarketModal}
                    onJoinOrtakAlim={onJoinOrtakAlim}
                  />
                ) : null}
              </div>
            ) : (
              <>
                <div
                  className={cn(
                    viewMode === "grid"
                      ? "grid gap-4 sm:grid-cols-2"
                      : "space-y-3",
                  )}
                >
                  {productsPage.items.map((product) => {
                    const selected = selectedProduct?.id === product.id;
                    const fav = favoriteIds.has(product.id);
                    return (
                      <Card
                        key={product.id}
                        className={cn(
                          "group flex flex-col overflow-hidden rounded-2xl border bg-white transition-[transform,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.988]",
                          selected
                            ? "border-primary ring-2 ring-primary/18 shadow-[0_14px_30px_rgba(0,107,53,0.1)]"
                            : "border-border/90 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[0_14px_28px_rgba(16,24,40,0.08)]",
                          viewMode === "list" && "sm:grid sm:grid-cols-[190px_1fr]",
                        )}
                      >
                        <div
                          className={cn(
                            "relative overflow-hidden bg-[#f2f5f0]",
                            viewMode === "grid" ? "aspect-[4/3]" : "h-44 sm:h-full",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectProduct(product)}
                            className="block size-full text-left"
                          >
                            <Image
                              src={productImage(product)}
                              alt={product.adi}
                              fill
                              sizes="(max-width: 640px) 100vw, 340px"
                              className="object-cover transition duration-300 group-hover:scale-105"
                            />
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                          </button>

                          <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-wrap items-start gap-1">
                            {product.saticiDogrulanmis ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-black text-primary shadow-xs">
                                <ShieldCheck className="size-3" aria-hidden />
                                Doğrulanmış
                              </span>
                            ) : null}
                            {product.yeniHasatMi ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/95 px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
                                <Leaf className="size-2.5" aria-hidden />
                                Yeni Hasat
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

                          {/* Location Overlay on Bottom Image Edge */}
                          <div className="pointer-events-none absolute bottom-2 left-2.5 right-10 flex items-center justify-between gap-2 text-[11px] font-bold text-white/95 drop-shadow-xs">
                            <span className="inline-flex items-center gap-1 truncate">
                              <MapPin className="size-3 shrink-0 text-emerald-300" aria-hidden />
                              <span className="truncate">{productLocation(product)}</span>
                            </span>
                            {selected ? (
                              <span className="hidden shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-white xl:inline-flex">
                                Seçili
                              </span>
                            ) : null}
                          </div>

                          {favoritesEnabled ? (
                            <button
                              type="button"
                              aria-label={fav ? "Favoriden çıkar" : "Favorilere ekle"}
                              onClick={() => onToggleFavorite(product.id)}
                              className={cn(
                                "absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-full bg-white/92 shadow-xs backdrop-blur-xs transition-[transform,color] duration-150 hover:scale-105 active:scale-90",
                                fav ? "text-red-500" : "text-muted-foreground hover:text-red-500",
                              )}
                            >
                              <Heart className={cn("size-4", fav && "fill-current")} aria-hidden />
                            </button>
                          ) : null}
                        </div>

                        <div className="flex flex-1 flex-col p-4">
                          <div className="flex items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleSelectProduct(product)}
                              className="text-left"
                            >
                              <h3 className="line-clamp-2 text-[15px] font-black leading-snug text-brand-brown transition-colors group-hover:text-primary sm:text-base">
                                {product.adi}
                              </h3>
                            </button>
                            {product.kategoriAdi ? (
                              <Badge variant="outline" className="shrink-0 bg-[#f9fbf8] text-[10px]">
                                {product.kategoriAdi}
                              </Badge>
                            ) : null}
                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            {product.saticiId ? (
                              <button
                                type="button"
                                onClick={() => onOpenStorefront(product.saticiId!)}
                                className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
                              >
                                <Store className="size-3.5" aria-hidden />
                                {sellerName(product)}
                              </button>
                            ) : (
                              <span>{sellerName(product)}</span>
                            )}
                            {typeof product.goruntulenmeSayisi === "number" && product.goruntulenmeSayisi > 0 ? (
                              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-muted-foreground/85">
                                · <Eye className="ml-0.5 size-3" aria-hidden />
                                {product.goruntulenmeSayisi}
                              </span>
                            ) : null}
                          </div>

                          {product.aciklama ? (
                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                              {product.aciklama}
                            </p>
                          ) : null}

                          <div className="mt-2.5 flex flex-wrap gap-1">
                            {product.birimMiktar ? (
                              <span className="rounded-md border border-border/70 bg-[#f8faf7] px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                {product.birimMiktar}
                              </span>
                            ) : null}
                            {product.eldenTeslimVarMi ? (
                              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-primary">
                                Elden Teslim
                              </span>
                            ) : null}
                            {product.kargoVarMi ? (
                              <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                                Kargo
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-3 mt-3">
                            <div>
                              <span className="text-lg font-black text-primary tabular-nums">
                                {formatPrice(product.fiyat)}
                              </span>
                              <div className="mt-0.5 flex items-center gap-1 text-xs font-bold text-amber-700">
                                <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
                                {(product.ortalamaPuan ?? 0).toFixed(1)}
                                <span className="font-normal text-muted-foreground">
                                  ({product.toplamYorum ?? 0})
                                </span>
                              </div>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant={selected ? "default" : "secondary"}
                              className="rounded-xl px-3.5 font-extrabold"
                              onClick={() => handleSelectProduct(product)}
                            >
                              {selected ? "İnceleniyor" : "İncele"}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                <PaginationBar
                  page={productsPage.page}
                  totalPages={productsPage.totalPages}
                  onPageChange={(nextPage) => {
                    onPageChange(nextPage);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />

                {smartAlternatives ? (
                  <div className="mt-6">
                    <SmartAlternativesSection
                      alternatives={smartAlternatives}
                      onSelectProduct={handleSelectProduct}
                      onOpenStorefront={onOpenStorefront}
                      onOpenOpenMarketModal={onOpenOpenMarketModal}
                      onJoinOrtakAlim={onJoinOrtakAlim}
                    />
                  </div>
                ) : null}
              </>
            )}
          </section>

          {/* Desktop Product Detail Inspector */}
          <aside className="hidden xl:block">
            <div className="thin-scrollbar overscroll-contain sticky top-24 max-h-[calc(100vh-6.75rem)] overflow-y-auto pr-1">
              {selectedProduct ? (
                <ProductDetailPanel
                  product={selectedProduct}
                  favorite={favoriteIds.has(selectedProduct.id)}
                  hasPriceAlarm={priceAlarmProductIds?.has(selectedProduct.id) ?? false}
                  hasStockAlarm={stockAlarmProductIds?.has(selectedProduct.id) ?? false}
                  isFollowingSeller={
                    Boolean(selectedProduct.saticiId && followedSellerIds?.has(selectedProduct.saticiId))
                  }
                  actionStatus={actionStatus}
                  demandFlowEnabled={demandFlowEnabled}
                  favoritesEnabled={favoritesEnabled}
                  chatEnabled={chatEnabled}
                  onOpenStorefront={onOpenStorefront}
                  onCreateDemand={onCreateDemand}
                  onToggleFavorite={() => onToggleFavorite(selectedProduct.id)}
                  onSavePriceAlert={onSavePriceAlert}
                  onToggleStockAlarm={onToggleStockAlarm}
                  onToggleFollowSeller={onToggleFollowSeller}
                  onStartChat={() => onStartChat(selectedProduct)}
                  onGoReviews={() => onGoReviews(selectedProduct)}
                />
              ) : (
                <Card className="p-6 text-center">
                  <p className="font-black text-brand-brown">Ürün Detayı Seç</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sol taraftan bir ürüne tıkla; galeri, üretici güven puanı ve talep oluşturma alanını burada gör.
                  </p>
                </Card>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile Slide-Over Filters Drawer */}
      {mobileFiltersOpen ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs lg:hidden"
          role="dialog"
          aria-modal="true"
          onClick={(event) => {
            if (event.target === event.currentTarget) setMobileFiltersOpen(false);
          }}
        >
          <div className="animate-soft-reveal flex h-full w-full max-w-sm flex-col bg-[#f6f8f5] shadow-2xl">
            <div className="flex items-center justify-between border-b border-border bg-white px-4 py-3.5">
              <h2 className="text-base font-black text-brand-brown">Filtreler</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Kapat"
              >
                <X className="size-5" />
              </Button>
            </div>
            <div className="thin-scrollbar overscroll-contain flex-1 overflow-y-auto p-4">
              <DiscoveryFilters
                categories={categories}
                locations={locations}
                cities={cities}
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
                onQueryChange={onQueryChange}
                onCategoryChange={onCategoryChange}
                onCityChange={onCityChange}
                onDistrictChange={onDistrictChange}
                onTeslimatSehirChange={onTeslimatSehirChange}
                onUretimSehirChange={onUretimSehirChange}
                onMinPriceChange={onMinPriceChange}
                onMaxPriceChange={onMaxPriceChange}
                onOnlyInStockChange={onOnlyInStockChange}
                onVerifiedOnlyChange={onVerifiedOnlyChange}
                onSadeceYeniHasatChange={onSadeceYeniHasatChange}
                onSadeceEldenTeslimChange={onSadeceEldenTeslimChange}
                onSadeceKargoluChange={onSadeceKargoluChange}
                onMinRatingChange={onMinRatingChange}
                onClear={onClearFilters}
              />
            </div>
            <div className="border-t border-border bg-white p-4">
              <Button
                type="button"
                className="w-full"
                onClick={() => setMobileFiltersOpen(false)}
              >
                Sonuçları Göster ({productsPage.totalCount})
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Mobile / Tablet Product Detail Bottom Sheet Modal */}
      {mobileDetailOpen && selectedProduct ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-xs xl:hidden"
          role="dialog"
          aria-modal="true"
          onClick={(event) => {
            if (event.target === event.currentTarget) setMobileDetailOpen(false);
          }}
        >
          <div className="animate-soft-reveal thin-scrollbar overscroll-contain max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-[#f6f8f5] p-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-border/90" aria-hidden />
            <div className="mb-2 flex items-center justify-between px-2 pt-1">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Ürün İnceleme & Talep
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMobileDetailOpen(false)}
                aria-label="Detayı kapat"
              >
                <X className="size-5" />
              </Button>
            </div>
            <ProductDetailPanel
              product={selectedProduct}
              favorite={favoriteIds.has(selectedProduct.id)}
              hasPriceAlarm={priceAlarmProductIds?.has(selectedProduct.id) ?? false}
              hasStockAlarm={stockAlarmProductIds?.has(selectedProduct.id) ?? false}
              isFollowingSeller={
                Boolean(selectedProduct.saticiId && followedSellerIds?.has(selectedProduct.saticiId))
              }
              actionStatus={actionStatus}
              demandFlowEnabled={demandFlowEnabled}
              favoritesEnabled={favoritesEnabled}
              chatEnabled={chatEnabled}
              onOpenStorefront={onOpenStorefront}
              onCreateDemand={onCreateDemand}
              onToggleFavorite={() => onToggleFavorite(selectedProduct.id)}
              onSavePriceAlert={onSavePriceAlert}
              onToggleStockAlarm={onToggleStockAlarm}
              onToggleFollowSeller={onToggleFollowSeller}
              onStartChat={() => {
                setMobileDetailOpen(false);
                onStartChat(selectedProduct);
              }}
              onGoReviews={() => {
                setMobileDetailOpen(false);
                onGoReviews(selectedProduct);
              }}
            />
          </div>
        </div>
      ) : null}

      <SiteFooter onNavigate={onNavigate} authUser={authUser} />
      <MobileBottomNav
        activeScreen="discover"
        authUser={authUser}
        unreadMessages={unreadMessageCount}
        onNavigate={onNavigate}
      />
    </div>
  );
}

function DiscoveryFilters({
  categories,
  locations = [],
  cities = [],
  query,
  categoryId,
  city,
  district,
  teslimatSehir = "",
  uretimSehir = "",
  minPrice,
  maxPrice,
  onlyInStock,
  verifiedOnly,
  sadeceYeniHasat = false,
  sadeceEldenTeslim = false,
  sadeceKargolu = false,
  minRating,
  onQueryChange,
  onCategoryChange,
  onCityChange,
  onDistrictChange,
  onTeslimatSehirChange,
  onUretimSehirChange,
  onMinPriceChange,
  onMaxPriceChange,
  onOnlyInStockChange,
  onVerifiedOnlyChange,
  onSadeceYeniHasatChange,
  onSadeceEldenTeslimChange,
  onSadeceKargoluChange,
  onMinRatingChange,
  onClear,
}: {
  categories: CategoryDto[];
  locations?: BootstrapLocationDto[];
  cities?: string[];
  query: string;
  categoryId: number | null;
  city: string;
  district: string;
  teslimatSehir?: string;
  uretimSehir?: string;
  minPrice: string;
  maxPrice: string;
  onlyInStock: boolean;
  verifiedOnly: boolean;
  sadeceYeniHasat?: boolean;
  sadeceEldenTeslim?: boolean;
  sadeceKargolu?: boolean;
  minRating: number | null;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: number | null) => void;
  onCityChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  onTeslimatSehirChange?: (value: string) => void;
  onUretimSehirChange?: (value: string) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onOnlyInStockChange: (value: boolean) => void;
  onVerifiedOnlyChange: (value: boolean) => void;
  onSadeceYeniHasatChange?: (value: boolean) => void;
  onSadeceEldenTeslimChange?: (value: boolean) => void;
  onSadeceKargoluChange?: (value: boolean) => void;
  onMinRatingChange: (value: number | null) => void;
  onClear: () => void;
}) {
  return (
    <Card className="space-y-5 rounded-2xl border-border/90 bg-white p-4 shadow-[0_10px_28px_rgba(16,24,40,0.04)]">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-black text-brand-brown">
          <SlidersHorizontal className="size-4 text-primary" aria-hidden />
          Detaylı Filtreler
        </span>
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg px-2 py-0.5 text-xs font-bold text-primary transition hover:bg-secondary hover:underline"
        >
          Sıfırla
        </button>
      </div>

      <Field label="Ürün / Açıklama Ara" htmlFor="filter-q">
        <Input
          id="filter-q"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Ör: yayla balı, nohut..."
        />
      </Field>

      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
          Kategori
        </p>
        <div className="thin-scrollbar max-h-48 space-y-1 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => onCategoryChange(null)}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-bold transition",
              categoryId === null
                ? "bg-emerald-50 text-primary"
                : "text-foreground hover:bg-muted",
            )}
          >
            <span>Tüm Kategoriler</span>
            {categoryId === null ? <Check className="size-3.5" aria-hidden /> : null}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(categoryId === cat.id ? null : cat.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-bold transition",
                categoryId === cat.id
                  ? "bg-emerald-50 text-primary"
                  : "text-foreground hover:bg-muted",
              )}
            >
              <span className="truncate">{cat.adi}</span>
              <span className="flex shrink-0 items-center gap-1.5">
                {typeof cat.urunSayisi === "number" ? (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-extrabold text-muted-foreground tabular-nums">
                    {cat.urunSayisi}
                  </span>
                ) : null}
                {categoryId === cat.id ? <Check className="size-3.5 shrink-0" aria-hidden /> : null}
              </span>
            </button>
          ))}
        </div>
      </div>

      <LocationFields
        compact
        city={city}
        district={district}
        onCityChange={onCityChange}
        onDistrictChange={onDistrictChange}
        locations={locations}
        cities={cities}
        cityPlaceholder="İl seç / ara"
        districtPlaceholder="İlçe seç / ara"
        cityId="filter-city"
        districtId="filter-district"
      />

      {onTeslimatSehirChange || onUretimSehirChange ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {onTeslimatSehirChange ? (
            <Field label="Teslimat Hedef Şehri" htmlFor="filter-del-city">
              <Input
                id="filter-del-city"
                value={teslimatSehir}
                onChange={(e) => onTeslimatSehirChange(e.target.value)}
                placeholder="Ör: Ankara, İstanbul..."
              />
            </Field>
          ) : null}
          {onUretimSehirChange ? (
            <Field label="Üretim (Yöre) Şehri" htmlFor="filter-orig-city">
              <Input
                id="filter-orig-city"
                value={uretimSehir}
                onChange={(e) => onUretimSehirChange(e.target.value)}
                placeholder="Ör: Kars, Hatay..."
              />
            </Field>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Field label="En Az (₺)" htmlFor="filter-min">
            <Input
              id="filter-min"
              type="number"
              min="0"
              value={minPrice}
              onChange={(event) => onMinPriceChange(event.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="En Çok (₺)" htmlFor="filter-max">
            <Input
              id="filter-max"
              type="number"
              min="0"
              value={maxPrice}
              onChange={(event) => onMaxPriceChange(event.target.value)}
              placeholder="2000"
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "0-250 ₺", min: "0", max: "250" },
            { label: "250-500 ₺", min: "250", max: "500" },
            { label: "500+ ₺", min: "500", max: "" },
          ].map((preset) => {
            const active = minPrice === preset.min && maxPrice === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  if (active) {
                    onMinPriceChange("");
                    onMaxPriceChange("");
                  } else {
                    onMinPriceChange(preset.min);
                    onMaxPriceChange(preset.max);
                  }
                }}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition",
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-muted-foreground hover:border-primary/40",
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
          Minimum Puan
        </p>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "Tümü", value: null },
            { label: "3★+", value: 3 },
            { label: "4★+", value: 4 },
            { label: "4.5★+", value: 4.5 },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => onMinRatingChange(opt.value)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-extrabold transition",
                minRating === opt.value
                  ? "border-amber-500 bg-amber-50 text-amber-900"
                  : "border-border bg-white text-muted-foreground hover:border-amber-300",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5 border-t border-border pt-3">
        <label className="flex cursor-pointer items-center gap-2.5 text-xs font-bold">
          <input
            type="checkbox"
            checked={onlyInStock}
            onChange={(event) => onOnlyInStockChange(event.target.checked)}
            className="size-4 accent-primary"
          />
          <span>Sadece stokta olanlar</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 text-xs font-bold">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(event) => onVerifiedOnlyChange(event.target.checked)}
            className="size-4 accent-primary"
          />
          <span>Sadece doğrulanmış üreticiler</span>
        </label>
        {onSadeceYeniHasatChange ? (
          <label className="flex cursor-pointer items-center gap-2.5 text-xs font-bold">
            <input
              type="checkbox"
              checked={sadeceYeniHasat}
              onChange={(event) => onSadeceYeniHasatChange(event.target.checked)}
              className="size-4 accent-primary"
            />
            <span>Sadece yeni hasat ürünler</span>
          </label>
        ) : null}
        {onSadeceEldenTeslimChange ? (
          <label className="flex cursor-pointer items-center gap-2.5 text-xs font-bold">
            <input
              type="checkbox"
              checked={sadeceEldenTeslim}
              onChange={(event) => onSadeceEldenTeslimChange(event.target.checked)}
              className="size-4 accent-primary"
            />
            <span>Sadece elden teslim uygun</span>
          </label>
        ) : null}
        {onSadeceKargoluChange ? (
          <label className="flex cursor-pointer items-center gap-2.5 text-xs font-bold">
            <input
              type="checkbox"
              checked={sadeceKargolu}
              onChange={(event) => onSadeceKargoluChange(event.target.checked)}
              className="size-4 accent-primary"
            />
            <span>Sadece kargo ile gönderim</span>
          </label>
        ) : null}
      </div>
    </Card>
  );
}

export function ProductDetailPanel({
  product,
  favorite,
  hasPriceAlarm = false,
  hasStockAlarm = false,
  isFollowingSeller = false,
  actionStatus,
  demandFlowEnabled = true,
  favoritesEnabled = true,
  chatEnabled = true,
  onOpenStorefront,
  onCreateDemand,
  onToggleFavorite,
  onSavePriceAlert,
  onToggleStockAlarm,
  onToggleFollowSeller,
  onStartChat,
  onGoReviews,
}: {
  product: ProductDto;
  favorite: boolean;
  hasPriceAlarm?: boolean;
  hasStockAlarm?: boolean;
  isFollowingSeller?: boolean;
  actionStatus: string | null;
  demandFlowEnabled?: boolean;
  favoritesEnabled?: boolean;
  chatEnabled?: boolean;
  onOpenStorefront: (saticiId: string) => void;
  onCreateDemand: (product: ProductDto, miktar: number, note?: string) => Promise<void> | void;
  onToggleFavorite: () => void;
  onSavePriceAlert?: (product: ProductDto, hedefFiyat: number) => Promise<void> | void;
  onToggleStockAlarm?: (product: ProductDto) => Promise<void> | void;
  onToggleFollowSeller?: (saticiId: string) => Promise<void> | void;
  onStartChat: () => void;
  onGoReviews: () => void;
}) {
  const images = product.resimler ?? [];
  const videos = product.videolar ?? [];

  type MediaChoice =
    | { kind: "image"; id: number; src: string }
    | { kind: "video"; id: number; src: string };

  const mediaItems: MediaChoice[] = [
    ...images.map((img) => ({
      kind: "image" as const,
      id: img.id,
      src: mediaImageSrc(img.url),
    })),
    ...videos
      .filter((vid) => Boolean(mediaVideoSrc(vid.url)))
      .map((vid) => ({
        kind: "video" as const,
        id: vid.id,
        src: mediaVideoSrc(vid.url),
      })),
  ];

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [amount, setAmount] = useState(1);
  const [note, setNote] = useState("");
  const [priceAlarmOpen, setPriceAlarmOpen] = useState(false);
  const [priceAlarmTarget, setPriceAlarmTarget] = useState(() =>
    String(Math.max(1, Math.round(product.fiyat * 0.9))),
  );
  const [trackedProductId, setTrackedProductId] = useState(product.id);

  if (trackedProductId !== product.id) {
    setTrackedProductId(product.id);
    setSelectedIdx(0);
    setAmount(1);
    setNote("");
    setPriceAlarmOpen(false);
    setPriceAlarmTarget(String(Math.max(1, Math.round(product.fiyat * 0.9))));
  }

  const activeMedia = mediaItems[selectedIdx] ?? {
    kind: "image" as const,
    id: 0,
    src: productImage(product),
  };

  const outOfStock = (product.stokMiktari ?? 0) <= 0;
  const maxSelectable = Math.max(1, product.stokMiktari ?? 99);
  const estimatedTotal = product.fiyat * amount;

  return (
    <Card id="product-detail-panel" className="overflow-hidden rounded-2xl border-border bg-white shadow-sm">
      {/* Main Media Stage */}
      <div className="relative aspect-[4/3] bg-[#eff4ec]">
        {activeMedia.kind === "video" ? (
          <video
            key={activeMedia.src}
            src={activeMedia.src}
            controls
            playsInline
            preload="metadata"
            className="size-full bg-black object-contain"
          />
        ) : (
          <Image
            src={activeMedia.src}
            alt={product.adi}
            fill
            sizes="(max-width: 1280px) 100vw, 400px"
            className="object-cover"
          />
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge variant="green">{product.kategoriAdi}</Badge>
          {outOfStock ? <Badge variant="outline">Stok Tükendi</Badge> : null}
        </div>

        {favoritesEnabled ? (
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={favorite ? "Favoriden çıkar" : "Favorilere ekle"}
            className={cn(
              "absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/95 shadow-sm transition-[transform,color] duration-150 hover:scale-105 active:scale-90",
              favorite ? "text-red-500" : "text-muted-foreground hover:text-red-500",
            )}
          >
            <Heart className={cn("size-4", favorite && "fill-current")} aria-hidden />
          </button>
        ) : null}
      </div>

      {/* Media Thumbnails (Images + Videos) */}
      {mediaItems.length > 1 ? (
        <div className="scroll-shelf flex gap-2 overflow-x-auto border-b border-border bg-[#f9fbf8] px-3 py-2.5">
          {mediaItems.map((item, idx) => (
            <button
              key={`${item.kind}-${item.id}`}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={cn(
                "relative size-12 shrink-0 snap-start overflow-hidden rounded-lg border-2 transition-[transform,border-color,opacity,box-shadow] duration-150 active:scale-95",
                selectedIdx === idx
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent opacity-80 hover:opacity-100",
              )}
            >
              {item.kind === "video" ? (
                <div className="grid size-full place-items-center bg-slate-900 text-white">
                  <Film className="size-5" aria-hidden />
                </div>
              ) : (
                <Image src={item.src} alt="" fill sizes="48px" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      ) : null}

        <div className="space-y-4 p-4 sm:p-5">
        <div className="rounded-2xl border border-emerald-100/90 bg-[#f6fbf6] p-3.5">
          <h2 className="font-serif text-xl font-bold leading-snug text-[#14271c]">
            {product.adi}
          </h2>
          <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-primary tabular-nums">
                {formatPrice(product.fiyat)}
              </span>
              {product.birimMiktar ? (
                <span className="text-xs font-bold text-muted-foreground">
                  / {product.birimMiktar}
                </span>
              ) : null}
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-extrabold tabular-nums",
                outOfStock
                  ? "bg-muted text-muted-foreground"
                  : (product.stokMiktari ?? 0) <= 5
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-primary",
              )}
            >
              {outOfStock ? "Stok Tükendi" : `Stokta: ${product.stokMiktari ?? 0} adet`}
            </span>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {product.yeniHasatMi ? <Badge variant="green">Yeni Hasat</Badge> : null}
            {product.eldenTeslimVarMi ? <Badge variant="outline">Elden Teslim</Badge> : null}
            {product.kargoVarMi ? <Badge variant="secondary">Kargo Gönderim</Badge> : null}
            {product.teslimatSecenekleri ? (
              <Badge variant="outline">{product.teslimatSecenekleri}</Badge>
            ) : null}
          </div>
          {product.gonderimSehirleri ? (
            <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
              <Truck className="mr-1 inline size-3.5 text-primary" aria-hidden />
              Gönderim: {product.gonderimSehirleri}
            </p>
          ) : null}
        </div>

        {/* Producer Card */}
        <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-[#f8faf7] p-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Store className="size-4 shrink-0 text-primary" aria-hidden />
              <span className="truncate text-sm font-black text-brand-brown">
                {sellerName(product)}
              </span>
              {product.saticiDogrulanmis ? (
                <ShieldCheck className="size-4 shrink-0 text-primary" aria-label="Doğrulanmış satıcı" />
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {productLocation(product)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {product.saticiId && onToggleFollowSeller ? (
              <Button
                type="button"
                variant={isFollowingSeller ? "secondary" : "outline"}
                size="sm"
                className="rounded-xl bg-white text-xs font-bold"
                onClick={() => onToggleFollowSeller(product.saticiId!)}
                aria-label={isFollowingSeller ? "Takibi Bırak" : "Üreticiyi Takip Et"}
              >
                {isFollowingSeller ? (
                  <>
                    <UserCheck className="size-3.5 text-primary" aria-hidden />
                    Takip
                  </>
                ) : (
                  <>
                    <UserPlus className="size-3.5" aria-hidden />
                    Takip Et
                  </>
                )}
              </Button>
            ) : null}
            {product.saticiId ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl bg-white text-xs font-bold"
                onClick={() => onOpenStorefront(product.saticiId!)}
              >
                Mağaza
              </Button>
            ) : null}
          </div>
        </div>

        {/* Rating & Comments Trigger */}
        <button
          type="button"
          onClick={onGoReviews}
          className="flex w-full items-center justify-between rounded-xl border border-border px-3.5 py-2.5 text-left transition hover:bg-secondary/60"
        >
          <div className="flex items-center gap-2">
            <Stars value={product.ortalamaPuan ?? 0} />
            <span className="text-sm font-black tabular-nums">
              {(product.ortalamaPuan ?? 0).toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({product.toplamYorum ?? 0} yorum)
            </span>
          </div>
          <span className="text-xs font-extrabold text-primary">Yorumları Gör</span>
        </button>

        {product.aciklama ? (
          <p className="text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
            {product.aciklama}
          </p>
        ) : null}

        {/* Demand Creation Box */}
        {demandFlowEnabled ? (
          <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-primary">
                Doğrudan Talep Oluştur
              </span>
              <span className="text-xs font-black text-brand-brown tabular-nums">
                Tahmini: {formatPrice(estimatedTotal)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-foreground">Miktar</span>
              <div className="inline-flex items-center rounded-xl border border-border bg-white shadow-2xs">
                <button
                  type="button"
                  aria-label="Miktarı azalt"
                  disabled={amount <= 1}
                  onClick={() => setAmount((prev) => Math.max(1, prev - 1))}
                  className="grid size-9 place-items-center text-muted-foreground transition-[transform,color] duration-150 hover:text-foreground active:scale-90 disabled:opacity-40"
                >
                  <Minus className="size-4" />
                </button>
                <span className="min-w-10 text-center text-sm font-black tabular-nums">
                  {amount}
                </span>
                <button
                  type="button"
                  aria-label="Miktarı artır"
                  disabled={amount >= maxSelectable}
                  onClick={() => setAmount((prev) => Math.min(maxSelectable, prev + 1))}
                  className="grid size-9 place-items-center text-muted-foreground transition-[transform,color] duration-150 hover:text-foreground active:scale-90 disabled:opacity-40"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            <Input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Üreticiye notun (ör. paketleme / teslim zamanı)..."
              className="bg-white text-xs"
            />

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="flex-1 rounded-xl font-extrabold"
                disabled={outOfStock || actionStatus === `demand-${product.id}`}
                onClick={() => onCreateDemand(product, amount, note.trim() || undefined)}
              >
                <Send className="size-4" aria-hidden />
                {actionStatus === `demand-${product.id}`
                  ? "Gönderiliyor..."
                  : outOfStock
                    ? "Stok Yok"
                    : "Talep Oluştur"}
              </Button>
              {chatEnabled ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl bg-white font-bold"
                  onClick={onStartChat}
                >
                  <MessageCircle className="size-4 text-primary" aria-hidden />
                  Sor
                </Button>
              ) : null}
            </div>
          </div>
        ) : chatEnabled ? (
          <Button type="button" className="w-full rounded-xl" onClick={onStartChat}>
            <MessageCircle className="size-4" aria-hidden />
            Üreticiyle Mesajlaş
          </Button>
        ) : null}

        {onSavePriceAlert || onToggleStockAlarm ? (
          <div className="space-y-2 rounded-xl border border-border/80 bg-[#f9fbf8] p-3">
            <div className="flex flex-wrap gap-2">
              {onSavePriceAlert ? (
                <Button
                  type="button"
                  size="sm"
                  variant={hasPriceAlarm ? "secondary" : "outline"}
                  className="flex-1 rounded-xl text-xs font-bold"
                  onClick={() => setPriceAlarmOpen((v) => !v)}
                >
                  {hasPriceAlarm ? (
                    <BellRing className="size-3.5 text-primary" aria-hidden />
                  ) : (
                    <Bell className="size-3.5" aria-hidden />
                  )}
                  {hasPriceAlarm ? "Fiyat Alarmı Aktif" : "Fiyat Düşerse Haber Ver"}
                </Button>
              ) : null}
              {onToggleStockAlarm ? (
                <Button
                  type="button"
                  size="sm"
                  variant={hasStockAlarm ? "secondary" : "outline"}
                  className="flex-1 rounded-xl text-xs font-bold"
                  onClick={() => onToggleStockAlarm(product)}
                >
                  {hasStockAlarm ? (
                    <BellRing className="size-3.5 text-primary" aria-hidden />
                  ) : (
                    <Bell className="size-3.5" aria-hidden />
                  )}
                  {hasStockAlarm ? "Stok Alarmı Açık" : "Stok Gelince Bildir"}
                </Button>
              ) : null}
            </div>

            {priceAlarmOpen && onSavePriceAlert ? (
              <div className="flex items-center gap-2 pt-1">
                <Input
                  type="number"
                  min={1}
                  value={priceAlarmTarget}
                  onChange={(e) => setPriceAlarmTarget(e.target.value)}
                  className="h-8 bg-white text-xs"
                  placeholder="Hedef fiyat (₺)"
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-8 rounded-lg px-3 text-xs font-extrabold"
                  onClick={() => {
                    const num = Number(priceAlarmTarget);
                    if (Number.isFinite(num) && num > 0) {
                      onSavePriceAlert(product, num);
                      setPriceAlarmOpen(false);
                    }
                  }}
                >
                  Kaydet
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function SmartAlternativesSection({
  alternatives,
  onSelectProduct,
  onOpenStorefront,
  onOpenOpenMarketModal,
  onJoinOrtakAlim,
}: {
  alternatives: SmartAlternativesDto;
  onSelectProduct: (product: ProductDto) => void;
  onOpenStorefront: (saticiId: string) => void;
  onOpenOpenMarketModal?: () => void;
  onJoinOrtakAlim?: (campaign: OrtakAlimDto) => void;
}) {
  const hasAny =
    (alternatives.ayniYoredenUrunler?.length ?? 0) > 0 ||
    (alternatives.sehreGonderimYapanlar?.length ?? 0) > 0 ||
    (alternatives.stoguTukenenUrunler?.length ?? 0) > 0 ||
    (alternatives.aktifOrtakAlimlar?.length ?? 0) > 0 ||
    (alternatives.planliGonderimler?.length ?? 0) > 0 ||
    Boolean(alternatives.benimIcinBulOnerisi?.urunBulunamadi);

  if (!hasAny) {
    return null;
  }

  return (
    <Card className="space-y-4 rounded-2xl border-emerald-200/80 bg-[linear-gradient(135deg,#f6fbf4_0%,#ffffff_100%)] p-4 shadow-xs sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-black text-primary">
            <Sparkles className="size-3.5" aria-hidden />
            Akıllı Alternatifler & Öneriler
          </span>
          <h3 className="mt-1 text-base font-black text-brand-brown">
            Bölgesel Seçenekler ve Yaklaşan Sevkiyatlar
          </h3>
        </div>
        {alternatives.benimIcinBulOnerisi?.urunBulunamadi && onOpenOpenMarketModal ? (
          <Button
            type="button"
            size="sm"
            onClick={onOpenOpenMarketModal}
            className="rounded-xl text-xs font-extrabold"
          >
            <Sparkles className="size-3.5" aria-hidden />
            Benim İçin Bul Aç
          </Button>
        ) : null}
      </div>

      {alternatives.benimIcinBulOnerisi?.urunBulunamadi ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs font-semibold text-amber-950">
          {alternatives.benimIcinBulOnerisi.arananUrunAdi
            ? `"${alternatives.benimIcinBulOnerisi.arananUrunAdi}" için`
            : "Aramanız için"}{" "}
          {alternatives.benimIcinBulOnerisi.teslimatSehir
            ? `${alternatives.benimIcinBulOnerisi.teslimatSehir} teslimatlı `
            : ""}
          uygun üreticilere açık talep gönderebilirsiniz.
        </p>
      ) : null}

      {[
        { title: "Aynı Yöreden Benzer Ürünler", list: alternatives.ayniYoredenUrunler },
        { title: "Şehrine Gönderim Yapan Üreticiler", list: alternatives.sehreGonderimYapanlar },
        { title: "Stoğu Tükenen / Alarm Kurabileceğin Ürünler", list: alternatives.stoguTukenenUrunler },
      ]
        .filter((group) => group.list.length > 0)
        .map((group) => (
          <div key={group.title} className="space-y-2">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              {group.title}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {group.list.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectProduct(item)}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-2.5 text-left transition hover:border-primary/40 hover:bg-emerald-50/30"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-brand-brown">{item.adi}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {sellerName(item)} · {productLocation(item)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-black text-primary tabular-nums">
                    {formatPrice(item.fiyat)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}

      {alternatives.planliGonderimler.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Şehrine Planlanan Üretici Sevkiyatları
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {alternatives.planliGonderimler.slice(0, 4).map((ship) => (
              <div
                key={ship.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50/40 p-2.5 text-xs"
              >
                <div className="min-w-0">
                  <p className="truncate font-black text-brand-brown">{ship.baslik}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {ship.menseiSehir} → {ship.hedefSehir} · Sevk: {formatShortDate(ship.gonderimTarihi)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {ship.sogukZincirVarMi ? (
                    <Snowflake className="size-3.5 text-sky-700" aria-label="Soğuk zincir" />
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-lg bg-white px-2 text-[11px] font-bold"
                    onClick={() => onOpenStorefront(ship.saticiId)}
                  >
                    Mağaza
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {alternatives.aktifOrtakAlimlar.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Katılabileceğin Ortak Alımlar
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {alternatives.aktifOrtakAlimlar.slice(0, 4).map((camp) => {
              const meta = ortakAlimStatusMeta(camp.durum);
              return (
                <div
                  key={camp.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-white p-2.5 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Badge variant={meta.variant} className="text-[10px]">
                        {meta.label}
                      </Badge>
                      <span className="truncate font-black text-brand-brown">{camp.baslik}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {camp.mevcutKatilimci}/{camp.minimumKatilimci} katılımcı · {camp.toplamTalepMiktari} {camp.birim}
                    </p>
                  </div>
                  {onJoinOrtakAlim ? (
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 shrink-0 rounded-lg px-2.5 text-[11px] font-extrabold"
                      onClick={() => onJoinOrtakAlim(camp)}
                    >
                      Katıl
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
