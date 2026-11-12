"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Compass,
  Heart,
  LayoutDashboard,
  Loader2,
  MapPin,
  MessageCircle,
  RefreshCw,
  Snowflake,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ChatPanel,
  DashboardFrame,
  EmptyState,
  Field,
  LocationFields,
  MetricCard,
  MiniProductButton,
  MobileBottomNav,
  Panel,
  type ChatContextSelection,
  type DashboardNavItem,
} from "@/components/yoremio/ui-kit";
import {
  demandImage,
  demandTitle,
  ortakAlimStatusMeta,
  productImage,
  productLocation,
  shortDate,
  type AuthState,
  type BuyerTab,
  type Screen,
} from "@/components/yoremio/types";
import type {
  BootstrapLocationDto,
  BuyerProfileDto,
  BuyerProfileUpdateValues,
  CategoryDto,
  ChatConversationDto,
  ChatMessageDto,
  DemandDto,
  OrtakAlimCreateValues,
  OrtakAlimDto,
  PlanliGonderimDto,
  PriceAlertDto,
  ProductDto,
  FeaturedSellerDto,
  StockAlertDto,
} from "@/lib/api";
import { cn, formatPrice, formatShortDate, limitText, phoneInput } from "@/lib/utils";

type BuyerDemandFilter = "ALL" | "ACIK" | "ANLASILDI" | "IPTAL";

function statusBadge(durum: string) {
  if (durum === "ANLASILDI") return { label: "Anlaşıldı", variant: "green" as const };
  if (durum === "TEKLIF_VAR") return { label: "Teklif Var", variant: "gold" as const };
  if (durum === "IPTAL") return { label: "İptal", variant: "outline" as const };
  return { label: "Açık", variant: "secondary" as const };
}

export function BuyerDashboard({
  authUser,
  activeTab,
  onTabChange,
  notificationUnreadCount,
  unreadMessageCount,
  favorites,
  recommended,
  demands,
  priceAlerts = [],
  stockAlerts = [],
  followedSellers = [],
  ortakAlimlar = [],
  planliGonderimler = [],
  buyerProfile = null,
  categories = [],
  locations = [],
  cities = [],
  conversations,
  messages,
  chatTargetId,
  chatContext = null,
  actionStatus,
  signalrConnected,
  typingFromUserId,
  chatEnabled = true,
  favoritesEnabled = true,
  onSelectChatTarget,
  onClearChatContext,
  onSendMessage,
  onTyping,
  onAcceptOffer,
  onRejectOffer,
  onCancelDemand,
  onRepeatDemand,
  onOpenOpenMarketModal,
  onDeletePriceAlert,
  onDeleteStockAlarm,
  onUnfollowSeller,
  onJoinOrtakAlim,
  onLeaveOrtakAlim,
  onSuggestOrtakAlim,
  onInspectDemand,
  onOpenProduct,
  onOpenStorefront,
  onToggleFavorite,
  onSaveProfile,
  onNavigate,
  onLogout,
}: {
  authUser: AuthState | null;
  activeTab: BuyerTab;
  onTabChange: (tab: BuyerTab) => void;
  notificationUnreadCount: number;
  unreadMessageCount: number;
  favorites: ProductDto[];
  recommended: ProductDto[];
  demands: DemandDto[];
  priceAlerts?: PriceAlertDto[];
  stockAlerts?: StockAlertDto[];
  followedSellers?: FeaturedSellerDto[];
  ortakAlimlar?: OrtakAlimDto[];
  planliGonderimler?: PlanliGonderimDto[];
  buyerProfile?: BuyerProfileDto | null;
  categories?: CategoryDto[];
  locations?: BootstrapLocationDto[];
  cities?: string[];
  conversations: ChatConversationDto[];
  messages: ChatMessageDto[];
  chatTargetId: string;
  chatContext?: ChatContextSelection | null;
  actionStatus: string | null;
  signalrConnected: boolean;
  typingFromUserId: string | null;
  chatEnabled?: boolean;
  favoritesEnabled?: boolean;
  onSelectChatTarget: (userId: string, context?: ChatContextSelection) => void;
  onClearChatContext?: () => void;
  onSendMessage: (receiverId: string, message: string) => void;
  onTyping: (receiverId: string) => void;
  onAcceptOffer: (offerId: number) => void;
  onRejectOffer: (offerId: number) => void;
  onCancelDemand: (talepId: number) => void;
  onRepeatDemand?: (talepId: number) => void;
  onOpenOpenMarketModal?: () => void;
  onDeletePriceAlert?: (productId: number) => void;
  onDeleteStockAlarm?: (productId: number) => void;
  onUnfollowSeller?: (sellerId: string) => void;
  onJoinOrtakAlim?: (campaign: OrtakAlimDto) => void;
  onLeaveOrtakAlim?: (campaignId: number) => void;
  onSuggestOrtakAlim?: (values: OrtakAlimCreateValues) => Promise<boolean>;
  onInspectDemand: (demandId: number) => void;
  onOpenProduct: (product: ProductDto) => void;
  onOpenStorefront: (saticiId: string) => void;
  onToggleFavorite: (productId: number) => void;
  onSaveProfile?: (values: BuyerProfileUpdateValues) => Promise<boolean>;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}) {
  const offerCount = demands.reduce(
    (sum, demand) => sum + (demand.teklifler?.length ?? 0),
    0,
  );
  const agreedCount = demands.filter((d) => d.durum === "ANLASILDI").length;
  const pendingOffers = demands.flatMap((demand) =>
    (demand.teklifler ?? [])
      .filter((t) => t.durum === "BEKLEMEDE" || t.durum === "BEKLIYOR")
      .map((offer) => ({ demand, offer })),
  );

  const navItems: DashboardNavItem[] = [
    {
      id: "overview",
      label: "Genel Bakış",
      icon: LayoutDashboard,
      active: activeTab === "overview",
      onClick: () => onTabChange("overview"),
    },
    {
      id: "demands",
      label: "Taleplerim",
      icon: ClipboardList,
      badge: demands.length || undefined,
      active: activeTab === "demands",
      onClick: () => onTabChange("demands"),
    },
    {
      id: "offers",
      label: "Gelen Teklifler",
      icon: Tag,
      badge: pendingOffers.length || undefined,
      active: activeTab === "offers",
      onClick: () => onTabChange("offers"),
    },
    ...(favoritesEnabled
      ? [
          {
            id: "favorites",
            label: "Favorilerim",
            icon: Heart,
            badge: favorites.length || undefined,
            active: activeTab === "favorites",
            onClick: () => onTabChange("favorites"),
          },
        ]
      : []),
    {
      id: "recommended",
      label: "Sana Özel",
      icon: Sparkles,
      active: activeTab === "recommended",
      onClick: () => onTabChange("recommended"),
    },
    {
      id: "alarms",
      label: "Alarmlar & Takip",
      icon: Bell,
      badge: priceAlerts.length + stockAlerts.length + followedSellers.length || undefined,
      active: activeTab === "alarms",
      onClick: () => onTabChange("alarms"),
    },
    {
      id: "community",
      label: "Ortak Alım & Sevkiyat",
      icon: Users,
      badge: ortakAlimlar.length || undefined,
      active: activeTab === "community",
      onClick: () => onTabChange("community"),
    },
    {
      id: "profile",
      label: "Profil & Konum",
      icon: UserRound,
      active: activeTab === "profile",
      onClick: () => onTabChange("profile"),
    },
    ...(chatEnabled
      ? [
          {
            id: "chat",
            label: "Mesajlar",
            icon: MessageCircle,
            badge: unreadMessageCount || undefined,
            active: activeTab === "chat",
            onClick: () => onTabChange("chat"),
          },
        ]
      : []),
  ];

  const [demandFilter, setDemandFilter] = useState<BuyerDemandFilter>("ALL");

  const filteredDemands = useMemo(() => {
    if (demandFilter === "ALL") return demands;
    return demands.filter((d) => d.durum === demandFilter);
  }, [demands, demandFilter]);

  const showOverview = activeTab === "overview";

  return (
    <>
      <DashboardFrame
        variant="light"
        title="Alıcı Kontrol Paneli"
        subtitle="Açtığın ürün taleplerini, üretici tekliflerini ve canlı sohbetlerini buradan yönet."
        authUser={authUser}
        notificationUnreadCount={notificationUnreadCount}
        onNavigate={onNavigate}
        onLogout={onLogout}
        navItems={navItems}
      >
        <div className="space-y-6">
          {/* Quick Top Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200/80 bg-[linear-gradient(120deg,#f5fbf5,#ffffff)] p-4">
            <div>
              <p className="text-sm font-black text-brand-brown">
                Yeni bir yöresel ürün mü arıyorsun?
              </p>
              <p className="text-xs text-muted-foreground">
                Keşif ekranından doğrudan miktar belirtip üreticiye talep iletebilirsin.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              className="rounded-xl font-extrabold"
              onClick={() => onNavigate("discover")}
            >
              <Compass className="size-4" aria-hidden />
              Ürünleri Keşfet
            </Button>
          </div>

          {/* KPI Strip */}
          {showOverview ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <MetricCard
                icon={ClipboardList}
                label="Aktif Talepler"
                value={String(demands.filter((d) => d.durum !== "IPTAL").length)}
                helper={`Toplam ${demands.length} talep kaydı`}
                tone="green"
              />
              <MetricCard
                icon={Tag}
                label="Gelen Teklifler"
                value={String(offerCount)}
                helper={`${pendingOffers.length} yanıt bekleyen teklif`}
                tone="amber"
              />
              <MetricCard
                icon={CheckCircle2}
                label="Anlaşılan"
                value={String(agreedCount)}
                helper="Üretici ile el sıkışılanlar"
                tone="lime"
              />
              <MetricCard
                icon={Heart}
                label="Favori Ürün"
                value={String(favorites.length)}
                helper="Takipteki üretici ürünleri"
                tone="green"
              />
            </div>
          ) : null}

          {/* Pending Offers Spotlight */}
          {(showOverview || activeTab === "offers") ? (
            <Panel
              title="Yanıt Bekleyen Üretici Teklifleri"
              badge={pendingOffers.length || undefined}
              action={showOverview ? "Tüm Talepler" : undefined}
              onAction={() => onTabChange("demands")}
            >
              {pendingOffers.length === 0 ? (
                <EmptyState
                  icon={Tag}
                  title="Bekleyen teklif yok"
                  description="Üreticiler taleplerine yeni fiyat veya mesaj teklifi gönderdiğinde burada hemen görebilirsin."
                />
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {pendingOffers.map(({ demand, offer }) => (
                    <Card
                      key={offer.id}
                      className="flex flex-col justify-between gap-3 rounded-xl border-amber-200 bg-amber-50/40 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-border bg-white">
                          <Image
                            src={demandImage(demand)}
                            alt={demandTitle(demand)}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => onInspectDemand(demand.id)}
                            className="truncate text-left text-sm font-black text-brand-brown hover:text-primary hover:underline"
                          >
                            {demandTitle(demand)}
                          </button>
                          <p className="text-xs font-semibold text-muted-foreground">
                            Miktar: {demand.miktar} · Teklif:{" "}
                            <span className="font-black text-primary">
                              {offer.birimFiyat ? formatPrice(offer.birimFiyat) : "Mesaj Teklifi"}
                            </span>
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-foreground">
                            &ldquo;{offer.mesaj}&rdquo;
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 border-t border-amber-200/70 pt-3">
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 rounded-lg text-xs font-extrabold"
                          disabled={actionStatus === `offer-accept-${offer.id}`}
                          onClick={() => onAcceptOffer(offer.id)}
                        >
                          Anlaş / Kabul Et
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-lg bg-white text-xs font-bold text-red-600 hover:bg-red-50"
                          disabled={actionStatus === `offer-reject-${offer.id}`}
                          onClick={() => onRejectOffer(offer.id)}
                        >
                          Reddet
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="ml-auto h-8 text-xs font-bold"
                          onClick={() => onInspectDemand(demand.id)}
                        >
                          Detay
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Panel>
          ) : null}

          {/* Demands Table / Cards */}
          {(showOverview || activeTab === "demands") ? (
            <Panel
              title="Taleplerim"
              badge={demands.length || undefined}
              action="Yeni Talep Aç"
              onAction={() => onNavigate("discover")}
            >
              {onOpenOpenMarketModal ? (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-xs">
                  <div className="font-semibold text-amber-950">
                    Aradığın ürünü katalogda bulamadın mı? Tüm uygun üreticilere açık talep gönderebilirsin.
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 rounded-lg text-xs font-extrabold"
                    onClick={onOpenOpenMarketModal}
                  >
                    <Sparkles className="size-3.5" aria-hidden />
                    Benim İçin Bul
                  </Button>
                </div>
              ) : null}
              {demands.length > 0 ? (
                <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto pb-1">
                  {(
                    [
                      { id: "ALL", label: `Tümü (${demands.length})` },
                      {
                        id: "ACIK",
                        label: `Açık (${demands.filter((d) => d.durum === "ACIK").length})`,
                      },
                      {
                        id: "ANLASILDI",
                        label: `Anlaşılan (${agreedCount})`,
                      },
                      {
                        id: "IPTAL",
                        label: `İptal (${demands.filter((d) => d.durum === "IPTAL").length})`,
                      },
                    ] as const
                  ).map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setDemandFilter(chip.id)}
                      className={cn(
                        "shrink-0 rounded-full border px-3 py-1 text-xs font-extrabold transition",
                        demandFilter === chip.id
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-white text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              ) : null}

              {filteredDemands.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title={demands.length === 0 ? "Henüz talebin yok" : "Bu durumda talep bulunamadı"}
                  description={
                    demands.length === 0
                      ? "Keşfet sayfasından bir ürün seçerek miktar ve not ekleyip ilk talebini oluşturabilirsin."
                      : "Diğer durum sekmelerini seçerek tüm taleplerini görüntüleyebilirsin."
                  }
                  action={
                    demands.length === 0 ? (
                      <Button size="sm" onClick={() => onNavigate("discover")}>
                        Ürünleri İncele
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setDemandFilter("ALL")}>
                        Tümünü Göster
                      </Button>
                    )
                  }
                />
              ) : (
                <div className="space-y-3">
                  {filteredDemands.map((demand) => {
                    const st = statusBadge(demand.durum);
                    const latestOffer = demand.teklifler?.[0];
                    return (
                      <div
                        key={demand.id}
                        className="flex flex-col gap-3 rounded-xl border border-border bg-[#fcfdfb] p-3.5 transition hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                            <Image
                              src={demandImage(demand)}
                              alt={demandTitle(demand)}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onInspectDemand(demand.id)}
                                className="truncate text-left text-sm font-black text-brand-brown hover:text-primary hover:underline"
                              >
                                {demandTitle(demand)}
                              </button>
                              <Badge variant={st.variant}>{st.label}</Badge>
                              {demand.talepTuru === "ACIK_PAZAR" ? (
                                <Badge variant="secondary">Açık Pazar</Badge>
                              ) : null}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Miktar: <strong>{demand.miktar} {demand.birim || "adet"}</strong> · Liste:{" "}
                              {demand.urunFiyat ? formatPrice(demand.urunFiyat) : demand.hedefBirimFiyat ? `Hedef ${formatPrice(demand.hedefBirimFiyat)}` : "—"} ·{" "}
                              {shortDate(demand.olusturmaTarihi)}
                              {demand.teslimatSehir ? ` · ${demand.teslimatSehir}` : ""}
                            </p>
                            {demand.saticiMagazaAdi && demand.saticiId ? (
                              <button
                                type="button"
                                onClick={() => onOpenStorefront(demand.saticiId!)}
                                className="mt-0.5 text-xs font-bold text-primary hover:underline"
                              >
                                Üretici: {demand.saticiMagazaAdi}
                              </button>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {latestOffer &&
                          (latestOffer.durum === "BEKLEMEDE" || latestOffer.durum === "BEKLIYOR") ? (
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 rounded-lg text-xs font-extrabold"
                              disabled={actionStatus === `offer-accept-${latestOffer.id}`}
                              onClick={() => onAcceptOffer(latestOffer.id)}
                            >
                              Teklifi Kabul Et
                            </Button>
                          ) : null}

                          {chatEnabled && demand.saticiId ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg text-xs font-bold"
                              onClick={() => {
                                if (!demand.saticiId) return;
                                onSelectChatTarget(demand.saticiId, {
                                  urunId: demand.urunId,
                                  label: demandTitle(demand),
                                  talepId: demand.id,
                                });
                                onTabChange("chat");
                              }}
                            >
                              <MessageCircle className="size-3.5 text-primary" aria-hidden />
                              Mesaj
                            </Button>
                          ) : null}

                          {onRepeatDemand ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg text-xs font-bold"
                              disabled={actionStatus === `demand-repeat-${demand.id}`}
                              onClick={() => onRepeatDemand(demand.id)}
                            >
                              <RefreshCw className="size-3.5 text-primary" aria-hidden />
                              Tekrarla
                            </Button>
                          ) : null}

                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-8 rounded-lg text-xs font-extrabold"
                            onClick={() => onInspectDemand(demand.id)}
                          >
                            Detay ({demand.teklifler?.length ?? 0})
                          </Button>

                          {demand.durum !== "ANLASILDI" && demand.durum !== "IPTAL" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 rounded-lg px-2 text-xs font-bold text-red-600 hover:bg-red-50"
                              disabled={actionStatus === `demand-cancel-${demand.id}`}
                              onClick={() => onCancelDemand(demand.id)}
                            >
                              <XCircle className="size-3.5" aria-hidden />
                              İptal
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          ) : null}

          {/* Favorites */}
          {(showOverview || activeTab === "favorites") && favoritesEnabled ? (
            <Panel
              title="Favori Ürünlerim"
              badge={favorites.length || undefined}
              action="Keşfe Git"
              onAction={() => onNavigate("discover")}
            >
              {favorites.length === 0 ? (
                <EmptyState
                  icon={Heart}
                  title="Favori listen henüz boş"
                  description="Beğendiğin yöresel ürünlerdeki kalp ikonuna dokunarak burada toplayabilirsin."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {favorites.map((product) => (
                    <Card
                      key={product.id}
                      className="flex items-center gap-3 rounded-xl border-border p-3"
                    >
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                        <Image
                          src={productImage(product)}
                          alt={product.adi}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => onOpenProduct(product)}
                          className="truncate text-left text-sm font-black text-brand-brown hover:text-primary"
                        >
                          {product.adi}
                        </button>
                        <p className="truncate text-xs text-muted-foreground">
                          {productLocation(product)}
                        </p>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-sm font-black text-primary tabular-nums">
                            {formatPrice(product.fiyat)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onToggleFavorite(product.id)}
                            className="text-xs font-bold text-red-600 hover:underline"
                          >
                            Çıkar
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Panel>
          ) : null}

          {/* Personalized Recommendations */}
          {(showOverview || activeTab === "recommended") ? (
            <Panel
              title="Sana Özel Öneriler"
              action={buyerProfile?.sehir ? `${buyerProfile.sehir} Öncelikli · Keşifte Gör` : "Keşifte Gör"}
              onAction={() => onNavigate("discover")}
            >
              {!buyerProfile?.sehir && onSaveProfile ? (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-amber-900">
                    <MapPin className="size-4 shrink-0 text-amber-700" aria-hidden />
                    <span>
                      Şehir ve favori kategorini ekleyerek bölgendeki üreticilerden sana özel öneriler alabilirsin.
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 bg-white text-xs font-extrabold"
                    onClick={() => onTabChange("profile")}
                  >
                    Profili Tamamla
                  </Button>
                </div>
              ) : null}
              {recommended.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="Öneriler hazırlanıyor"
                  description="Daha fazla ürün inceledikçe ve favori ekledikçe sana uygun ürünler burada listelenecek."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {recommended.map((product) => (
                    <MiniProductButton
                      key={product.id}
                      product={product}
                      onClick={() => onOpenProduct(product)}
                    />
                  ))}
                </div>
              )}
            </Panel>
          ) : null}

          {/* Alarms & Followed Producers */}
          {activeTab === "alarms" ? (
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Fiyat Alarmlarım" badge={priceAlerts.length || undefined}>
                  {priceAlerts.length === 0 ? (
                    <EmptyState
                      icon={Bell}
                      title="Aktif fiyat alarmın yok"
                      description="Ürün detayından 'Fiyat Düşerse Haber Ver' alarmı kurabilirsin."
                    />
                  ) : (
                    <div className="space-y-2.5">
                      {priceAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-brand-brown">
                              {alert.urunAdi}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Mevcut: <strong>{formatPrice(alert.urunFiyat)}</strong> · Hedef:{" "}
                              <strong className="text-primary">{formatPrice(alert.hedefFiyat)}</strong>
                            </p>
                          </div>
                          {onDeletePriceAlert ? (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="size-8 shrink-0 text-red-600 hover:bg-red-50"
                              onClick={() => onDeletePriceAlert(alert.urunId)}
                              aria-label="Fiyat alarmını kaldır"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>

                <Panel title="Stok Alarmlarım" badge={stockAlerts.length || undefined}>
                  {stockAlerts.length === 0 ? (
                    <EmptyState
                      icon={Bell}
                      title="Aktif stok alarmın yok"
                      description="Stoğu tükenen ürünler için yeniden stoka girince bildirim alabilirsin."
                    />
                  ) : (
                    <div className="space-y-2.5">
                      {stockAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-brand-brown">
                              {alert.urunAdi}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Stok: <strong>{alert.stokMiktari}</strong> · Fiyat: {formatPrice(alert.urunFiyat)}
                            </p>
                          </div>
                          {onDeleteStockAlarm ? (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="size-8 shrink-0 text-red-600 hover:bg-red-50"
                              onClick={() => onDeleteStockAlarm(alert.urunId)}
                              aria-label="Stok alarmını kaldır"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              </div>

              <Panel title="Takip Ettiğim Üreticiler" badge={followedSellers.length || undefined}>
                {followedSellers.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="Henüz takip ettiğin üretici yok"
                    description="Mağaza vitrinlerinden veya ürün detayından üreticileri takip edebilirsin."
                  />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {followedSellers.map((seller) => (
                      <Card key={seller.kullaniciId} className="rounded-xl border-border p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => onOpenStorefront(seller.kullaniciId)}
                              className="truncate text-left text-sm font-black text-brand-brown hover:text-primary hover:underline"
                            >
                              {seller.magazaAdi}
                            </button>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {[seller.sehir, seller.ilce].filter(Boolean).join(", ") || "Türkiye"} ·{" "}
                              {seller.urunSayisi ?? 0} ürün
                            </p>
                          </div>
                          {seller.dogrulanmisSatici ? <Badge variant="green">Doğrulanmış</Badge> : null}
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 rounded-lg text-xs font-bold"
                            onClick={() => onOpenStorefront(seller.kullaniciId)}
                          >
                            Vitrini Aç
                          </Button>
                          {onUnfollowSeller ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50"
                              onClick={() => onUnfollowSeller(seller.kullaniciId)}
                            >
                              Takibi Bırak
                            </Button>
                          ) : null}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          ) : null}

          {/* Community: Ortak Alım & Şehrime Gelen Sevkiyatlar */}
          {activeTab === "community" ? (
            <div className="space-y-4">
              <Panel title="Yöremio Ortak Alım Kampanyaları" badge={ortakAlimlar.length || undefined}>
                {ortakAlimlar.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="Aktif ortak alım kampanyası yok"
                    description="Aşağıdaki formdan bulunduğun şehir için yeni bir ortak alım önerisi oluşturabilirsin."
                  />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {ortakAlimlar.map((camp) => {
                      const meta = ortakAlimStatusMeta(camp.durum);
                      const progress =
                        camp.minimumKatilimci > 0
                          ? Math.min(100, Math.round((camp.mevcutKatilimci / camp.minimumKatilimci) * 100))
                          : 0;
                      const routeText = [camp.menseiSehir, camp.hedefSehir].filter(Boolean).join(" → ");
                      const canJoin = camp.durum !== "IPTAL" && camp.durum !== "TAMAMLANDI";
                      return (
                        <Card key={camp.id} className="space-y-2.5 rounded-xl border-border p-4">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant={meta.variant}>{meta.label}</Badge>
                            <span className="text-[11px] font-bold text-muted-foreground">
                              {routeText || "Türkiye"} · {formatShortDate(camp.sonKatilimTarihi)}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-brand-brown">{camp.baslik}</h3>
                            {camp.aciklama ? (
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{camp.aciklama}</p>
                            ) : null}
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span>
                                {camp.mevcutKatilimci} / {camp.minimumKatilimci} Katılımcı
                              </span>
                              <span className="text-primary tabular-nums">
                                {camp.toplamTalepMiktari} {camp.birim || "adet"}
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <span className="text-xs font-black text-primary">
                              {camp.birimFiyat > 0
                                ? `${formatPrice(camp.birimFiyat)} / ${camp.birim || "adet"}`
                                : "Üretici Onayı Bekleniyor"}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {onLeaveOrtakAlim && canJoin ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-7 rounded-lg text-xs font-bold text-red-600"
                                  onClick={() => onLeaveOrtakAlim(camp.id)}
                                >
                                  Ayrıl
                                </Button>
                              ) : null}
                              {onJoinOrtakAlim && canJoin ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-7 rounded-lg text-xs font-extrabold"
                                  onClick={() => onJoinOrtakAlim(camp)}
                                >
                                  Katıl
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {onSuggestOrtakAlim ? (
                  <BuyerOrtakAlimSuggestForm
                    defaultCity={buyerProfile?.sehir ?? authUser?.sehir ?? ""}
                    saving={actionStatus === "ortak-alim-create"}
                    onSuggest={onSuggestOrtakAlim}
                  />
                ) : null}
              </Panel>

              <Panel title="Şehrime Gelen Planlı Sevkiyatlar" badge={planliGonderimler.length || undefined}>
                {planliGonderimler.length === 0 ? (
                  <EmptyState
                    icon={Truck}
                    title="Planlı sevkiyat bulunmuyor"
                    description="Üreticiler şehrine planlı sevkiyat eklediğinde burada tarih ve soğuk zincir bilgisiyle görünecek."
                  />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {planliGonderimler.map((ship) => (
                      <Card key={ship.id} className="space-y-2 rounded-xl border-sky-200 bg-sky-50/30 p-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="secondary">
                            {ship.menseiSehir || "Yöre"} → {ship.hedefSehir}
                          </Badge>
                          {ship.sogukZincirVarMi ? (
                            <Badge variant="green">
                              <Snowflake className="mr-1 size-3" aria-hidden />
                              Soğuk Zincir
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-sm font-black text-brand-brown">{ship.baslik}</p>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                            <CalendarClock className="size-3.5 text-primary" aria-hidden />
                            Sevk: {formatShortDate(ship.gonderimTarihi)}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 rounded-lg bg-white text-xs font-bold"
                            onClick={() => onOpenStorefront(ship.saticiId)}
                          >
                            {ship.saticiMagazaAdi || "Yöremio Üreticisi"}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          ) : null}

          {/* Buyer Profile & Location Preferences */}
          {activeTab === "profile" && onSaveProfile ? (
            <BuyerProfilePanel
              key={`${buyerProfile?.kullaniciId ?? "anon"}-${buyerProfile?.userName ?? ""}-${buyerProfile?.sehir ?? ""}-${buyerProfile?.ilce ?? ""}-${buyerProfile?.favoriKategori ?? ""}`}
              authUser={authUser}
              profile={buyerProfile}
              categories={categories}
              locations={locations}
              cities={cities}
              saving={actionStatus === "buyer-profile"}
              onSave={onSaveProfile}
            />
          ) : null}

          {/* Live SignalR Chat */}
          {(showOverview || activeTab === "chat") && chatEnabled ? (
            <Panel title="Üreticilerle Canlı Sohbet" badge={unreadMessageCount || undefined}>
              <ChatPanel
                compact={showOverview}
                conversations={conversations}
                messages={messages}
                targetId={chatTargetId}
                chatContext={chatContext}
                onClearContext={onClearChatContext}
                actionStatus={actionStatus}
                signalrConnected={signalrConnected}
                typingFromUserId={typingFromUserId}
                onTargetChange={(id) => onSelectChatTarget(id)}
                onSendMessage={onSendMessage}
                onTyping={onTyping}
              />
            </Panel>
          ) : null}
        </div>
      </DashboardFrame>

      <MobileBottomNav
        activeScreen="buyer"
        authUser={authUser}
        unreadMessages={unreadMessageCount}
        onNavigate={onNavigate}
      />
    </>
  );
}

function BuyerProfilePanel({
  authUser,
  profile,
  categories,
  locations,
  cities,
  saving,
  onSave,
}: {
  authUser: AuthState | null;
  profile: BuyerProfileDto | null;
  categories: CategoryDto[];
  locations: BootstrapLocationDto[];
  cities: string[];
  saving: boolean;
  onSave: (values: BuyerProfileUpdateValues) => Promise<boolean>;
}) {
  const [userName, setUserName] = useState(profile?.userName ?? authUser?.userName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber ?? authUser?.phoneNumber ?? "");
  const [sehir, setSehir] = useState(profile?.sehir ?? authUser?.sehir ?? "");
  const [ilce, setIlce] = useState(profile?.ilce ?? authUser?.ilce ?? "");
  const [adres, setAdres] = useState(profile?.adres ?? "");
  const [favoriKategori, setFavoriKategori] = useState(profile?.favoriKategori ?? "");

  return (
    <Panel title="Alıcı Profilim & Kişiselleştirme">
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          await onSave({
            userName: userName.trim() || undefined,
            phoneNumber: phoneNumber.trim() || undefined,
            sehir: sehir.trim() || undefined,
            ilce: ilce.trim() || undefined,
            adres: adres.trim() || undefined,
            favoriKategori: favoriKategori.trim() || undefined,
          });
        }}
        className="space-y-4"
      >
        <div className="rounded-xl border border-emerald-200/70 bg-[#f6fbf6] p-3.5 text-xs text-muted-foreground">
          Kullanıcı adın yorumlarda, puan listelerinde ve satıcıya giden taleplerde görünür. Şehir, ilçe ve favori kategori bilgilerin ise{" "}
          <span className="font-bold text-primary">Sana Özel Öneriler</span> sıralamasını doğrudan kişiselleştirir.
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Görünen Kullanıcı Adı" htmlFor="bp-username">
            <Input
              id="bp-username"
              minLength={3}
              value={userName}
              onChange={(event) => setUserName(limitText(event.target.value, 50))}
              placeholder="Ör: alici_ayse"
            />
          </Field>

          <Field label="İletişim Telefonu" htmlFor="bp-phone">
            <Input
              id="bp-phone"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(phoneInput(event.target.value))}
              placeholder="0555 123 45 67"
            />
          </Field>
        </div>

        <LocationFields
          city={sehir}
          district={ilce}
          onCityChange={setSehir}
          onDistrictChange={setIlce}
          locations={locations}
          cities={cities}
          cityPlaceholder="Ör: İstanbul"
          districtPlaceholder="Ör: Kadıköy"
          cityId="bp-city"
          districtId="bp-district"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Favori Ürün Kategorisi" htmlFor="bp-fav-cat">
            <select
              id="bp-fav-cat"
              value={favoriKategori}
              onChange={(event) => setFavoriKategori(event.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-white px-3 text-sm outline-none focus:border-primary"
            >
              <option value="">Seçilmedi</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.adi}>
                  {cat.adi}
                </option>
              ))}
            </select>
          </Field>

          <Field label="E-posta Hesabı" htmlFor="bp-email">
            <Input
              id="bp-email"
              value={profile?.email ?? authUser?.email ?? ""}
              disabled
              className="bg-muted/60 text-muted-foreground"
            />
          </Field>
        </div>

        <Field label="Teslimat / Bölge Adresi" htmlFor="bp-adres">
          <textarea
            id="bp-adres"
            rows={3}
            value={adres}
            onChange={(event) => setAdres(limitText(event.target.value, 200))}
            placeholder="Mahalle, sokak veya teslimat tercihlerin..."
            className="w-full rounded-xl border border-input bg-white p-3 text-sm outline-none focus:border-primary"
          />
        </Field>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {saving ? "Kaydediliyor..." : "Profil Bilgilerini Kaydet"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function BuyerOrtakAlimSuggestForm({
  defaultCity,
  saving,
  onSuggest,
}: {
  defaultCity: string;
  saving: boolean;
  onSuggest: (values: OrtakAlimCreateValues) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [baslik, setBaslik] = useState("");
  const [menseiSehir, setMenseiSehir] = useState("");
  const [hedefSehir, setHedefSehir] = useState(defaultCity || "");
  const [birim, setBirim] = useState("kg");
  const [birimFiyat, setBirimFiyat] = useState("350");
  const [minimumKatilimci, setMinimumKatilimci] = useState("5");
  const [sogukZincirGerekliMi, setSogukZincirGerekliMi] = useState(false);
  const [sonKatilimTarihi, setSonKatilimTarihi] = useState(() =>
    new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
  );
  const [aciklama, setAciklama] = useState("");

  if (!open) {
    return (
      <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 p-3 text-xs">
        <span className="font-semibold text-emerald-950">
          Belirli bir yöresel ürün için ortak alım önerisi başlatmak ister misin?
        </span>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
          Öneri Başlat
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!baslik.trim() || !menseiSehir.trim() || !hedefSehir.trim()) return;
        const ok = await onSuggest({
          baslik: baslik.trim(),
          menseiSehir: menseiSehir.trim(),
          hedefSehir: hedefSehir.trim(),
          birim: birim.trim() || "kg",
          birimFiyat: Math.max(1, Number(birimFiyat) || 100),
          minimumKatilimci: Math.max(2, Number(minimumKatilimci) || 5),
          sogukZincirGerekliMi,
          sonKatilimTarihi: new Date(sonKatilimTarihi).toISOString(),
          aciklama: aciklama.trim() || undefined,
        });
        if (ok) {
          setBaslik("");
          setAciklama("");
          setOpen(false);
        }
      }}
      className="mt-4 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-wider text-primary">
          Yeni Ortak Alım Önerisi
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-bold text-muted-foreground hover:underline"
        >
          Vazgeç
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Kampanya Başlığı *" htmlFor="oa-suggest-title">
          <Input
            id="oa-suggest-title"
            value={baslik}
            onChange={(e) => setBaslik(e.target.value)}
            placeholder="Ör: Ankara İçi Kars Kaşarı Ortak Alımı"
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Menşei Şehir *" htmlFor="oa-suggest-origin">
            <Input
              id="oa-suggest-origin"
              value={menseiSehir}
              onChange={(e) => setMenseiSehir(e.target.value)}
              placeholder="Ör: Kars"
              required
            />
          </Field>
          <Field label="Hedef Şehir *" htmlFor="oa-suggest-city">
            <Input
              id="oa-suggest-city"
              value={hedefSehir}
              onChange={(e) => setHedefSehir(e.target.value)}
              placeholder="Ör: Ankara"
              required
            />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Min Katılımcı" htmlFor="oa-suggest-target">
            <Input
              id="oa-suggest-target"
              type="number"
              min={2}
              value={minimumKatilimci}
              onChange={(e) => setMinimumKatilimci(e.target.value)}
            />
          </Field>
          <Field label="Hedef Fiyat (₺)" htmlFor="oa-suggest-price">
            <Input
              id="oa-suggest-price"
              type="number"
              min={1}
              value={birimFiyat}
              onChange={(e) => setBirimFiyat(e.target.value)}
            />
          </Field>
          <Field label="Birim" htmlFor="oa-suggest-unit">
            <Input
              id="oa-suggest-unit"
              value={birim}
              onChange={(e) => setBirim(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Son Katılım Tarihi *" htmlFor="oa-suggest-date">
          <Input
            id="oa-suggest-date"
            type="date"
            value={sonKatilimTarihi}
            onChange={(e) => setSonKatilimTarihi(e.target.value)}
            required
          />
        </Field>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-xs font-bold">
          <input
            type="checkbox"
            checked={sogukZincirGerekliMi}
            onChange={(e) => setSogukZincirGerekliMi(e.target.checked)}
            className="size-4 accent-primary"
          />
          Soğuk zincir teslimat gerekir
        </label>
        <div className="flex-1 sm:max-w-xs">
          <Input
            value={aciklama}
            onChange={(e) => setAciklama(e.target.value)}
            placeholder="Üretici notu / teslimat tercihi..."
            className="bg-white"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Oluşturuluyor..." : "Ortak Alım Önerisini Paylaş"}
        </Button>
      </div>
    </form>
  );
}
