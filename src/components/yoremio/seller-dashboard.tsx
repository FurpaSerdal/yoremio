"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  CopyPlus,
  Film,
  ImagePlus,
  LayoutDashboard,
  Loader2,
  MessageCircle,
  Package,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Store,
  Trash2,
  Truck,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ChatPanel,
  DashboardFrame,
  DemandMediaLine,
  EmptyState,
  Field,
  LocationFields,
  MetricCard,
  MobileBottomNav,
  Panel,
  ProfileRow,
  TrustDial,
  type ChatContextSelection,
  type DashboardNavItem,
} from "@/components/yoremio/ui-kit";
import {
  demandTitle,
  formatBytes,
  mediaImageSrc,
  mediaVideoSrc,
  ortakAlimStatusMeta,
  productImage,
  shortDate,
  type AuthState,
  type ProductSubmitValues,
  type Screen,
  type SellerTab,
  type ToastKind,
} from "@/components/yoremio/types";
import type {
  AppBootstrapDto,
  BootstrapLocationDto,
  BulkStockItemValues,
  CategoryDto,
  ChatConversationDto,
  ChatMessageDto,
  DemandDto,
  OrtakAlimCreateValues,
  OrtakAlimDto,
  PlanliGonderimCreateValues,
  PlanliGonderimDto,
  ProductDto,
  SellerDashboardDto,
  SellerProfileDto,
  SellerProfileUpdateValues,
} from "@/lib/api";
import { cn, formatPrice, formatShortDate, limitText, phoneInput } from "@/lib/utils";

type InventoryFilter = "all" | "active" | "passive" | "out_of_stock";
type DemandStatusFilter = "ALL" | "ACIK" | "ANLASILDI" | "IPTAL";

export function SellerDashboard({
  authUser,
  activeTab,
  onTabChange,
  profile,
  sellerStats,
  trustScore: trustScoreProp,
  products,
  demands,
  marketDemands = [],
  sellerShipments = [],
  ortakAlimlar = [],
  conversations,
  messages,
  chatTargetId,
  chatContext = null,
  notificationUnreadCount,
  unreadMessageCount,
  actionStatus,
  signalrConnected,
  typingFromUserId,
  chatEnabled = true,
  onSelectChatTarget,
  onClearChatContext,
  onSendMessage,
  onTyping,
  onCreateProduct,
  onEditProduct,
  onDuplicateProduct,
  onToggleProductStatus,
  onDeleteProduct,
  onBulkUpdateStock,
  onCreateShipment,
  onCancelShipment,
  onCreateOrtakAlim,
  onApproveOrtakAlim,
  onUpdateOrtakAlimStatus,
  onInspectDemand,
  onOpenStorefront,
  onNavigate,
  onLogout,
}: {
  authUser: AuthState | null;
  activeTab: SellerTab;
  onTabChange: (tab: SellerTab) => void;
  profile: SellerProfileDto | null;
  sellerStats?: SellerDashboardDto | null;
  trustScore?: number;
  products: ProductDto[];
  demands: DemandDto[];
  marketDemands?: DemandDto[];
  sellerShipments?: PlanliGonderimDto[];
  ortakAlimlar?: OrtakAlimDto[];
  conversations: ChatConversationDto[];
  messages: ChatMessageDto[];
  chatTargetId: string;
  chatContext?: ChatContextSelection | null;
  notificationUnreadCount: number;
  unreadMessageCount: number;
  actionStatus: string | null;
  signalrConnected: boolean;
  typingFromUserId: string | null;
  chatEnabled?: boolean;
  onSelectChatTarget: (userId: string, context?: ChatContextSelection) => void;
  onClearChatContext?: () => void;
  onSendMessage: (receiverId: string, message: string) => void;
  onTyping: (receiverId: string) => void;
  onCreateProduct: () => void;
  onEditProduct: (product: ProductDto) => void;
  onDuplicateProduct: (product: ProductDto) => void;
  onToggleProductStatus: (product: ProductDto) => void;
  onDeleteProduct: (product: ProductDto) => void;
  onBulkUpdateStock?: (items: BulkStockItemValues[]) => Promise<boolean>;
  onCreateShipment?: (values: PlanliGonderimCreateValues) => Promise<boolean>;
  onCancelShipment?: (id: number) => Promise<void>;
  onCreateOrtakAlim?: (values: OrtakAlimCreateValues) => Promise<boolean>;
  onApproveOrtakAlim?: (id: number) => Promise<void>;
  onUpdateOrtakAlimStatus?: (id: number, durum: string) => Promise<void>;
  onInspectDemand: (demandId: number) => void;
  onOpenStorefront?: (saticiId: string) => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}) {
  const [inventoryFilter, setInventoryFilter] = useState<InventoryFilter>("all");
  const [inventoryQuery, setInventoryQuery] = useState("");
  const [demandStatusFilter, setDemandStatusFilter] = useState<DemandStatusFilter>("ALL");
  const [bulkMode, setBulkMode] = useState(false);

  const activeProductsCount =
    sellerStats?.activeProducts ?? products.filter((p) => p.aktifMi !== false).length;
  const openDemandsCount =
    sellerStats?.openDemands ?? demands.filter((d) => d.durum !== "IPTAL").length;
  const pendingDemandsCount = demands.filter((d) => d.durum === "ACIK").length;
  const agreedDemandsCount =
    sellerStats?.agreedDemands ?? demands.filter((d) => d.durum === "ANLASILDI").length;
  const trustScore = Math.round(sellerStats?.trustScore ?? trustScoreProp ?? 0);

  const filteredDemands = useMemo(() => {
    if (demandStatusFilter === "ALL") return demands;
    return demands.filter((d) => d.durum === demandStatusFilter);
  }, [demands, demandStatusFilter]);

  const filteredProducts = useMemo(() => {
    const q = inventoryQuery.trim().toLowerCase();
    return products.filter((item) => {
      if (inventoryFilter === "active" && item.aktifMi === false) return false;
      if (inventoryFilter === "passive" && item.aktifMi !== false) return false;
      if (inventoryFilter === "out_of_stock" && (item.stokMiktari ?? 0) > 0) return false;
      if (
        q &&
        !item.adi.toLowerCase().includes(q) &&
        !(item.kategoriAdi ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [products, inventoryFilter, inventoryQuery]);

  const navItems: DashboardNavItem[] = [
    {
      id: "overview",
      label: "Genel Bakış",
      icon: LayoutDashboard,
      active: activeTab === "overview",
      onClick: () => onTabChange("overview"),
    },
    {
      id: "products",
      label: "Ürünlerim",
      icon: Package,
      badge: products.length || undefined,
      active: activeTab === "products",
      onClick: () => onTabChange("products"),
    },
    {
      id: "demands",
      label: "Gelen Talepler",
      icon: ClipboardList,
      badge: pendingDemandsCount + marketDemands.length || undefined,
      active: activeTab === "demands",
      onClick: () => onTabChange("demands"),
    },
    {
      id: "logistics",
      label: "Sevkiyat & Ortak Alım",
      icon: Truck,
      badge: sellerShipments.length + ortakAlimlar.length || undefined,
      active: activeTab === "logistics",
      onClick: () => onTabChange("logistics"),
    },
    ...(chatEnabled
      ? [
          {
            id: "chat",
            label: "Alıcı Mesajları",
            icon: MessageCircle,
            badge: unreadMessageCount || undefined,
            active: activeTab === "chat",
            onClick: () => onTabChange("chat"),
          },
        ]
      : []),
    {
      id: "seller-profile",
      label: "Mağaza Profili",
      icon: Store,
      active: false,
      onClick: () => onNavigate("seller-profile"),
    },
  ];

  const showOverview = activeTab === "overview";

  return (
    <>
      <DashboardFrame
        variant="dark"
        title={profile?.magazaAdi ?? "Satıcı Yönetim Paneli"}
        subtitle="Ürünlerini yönet, alıcı taleplerine fiyat teklifi gönder ve canlı sohbet üzerinden anlaş."
        authUser={authUser}
        sellerProfile={profile}
        notificationUnreadCount={notificationUnreadCount}
        onNavigate={onNavigate}
        onLogout={onLogout}
        navItems={navItems}
      >
        <div className="space-y-6">
          {/* Store Banner & Primary Actions */}
          <Card className="flex flex-col gap-4 rounded-2xl border-emerald-200/80 bg-[linear-gradient(125deg,#ffffff_0%,#f2f9f2_100%)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-center gap-4">
              <TrustDial score={trustScore} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-black text-brand-brown sm:text-xl">
                    {profile?.magazaAdi ?? "Mağazan"}
                  </h2>
                  {profile?.dogrulanmisSatici ? (
                    <Badge variant="green">
                      <ShieldCheck className="mr-1 size-3" aria-hidden />
                      Doğrulanmış Üretici
                    </Badge>
                  ) : (
                    <Badge variant="outline">Doğrulama Bekleniyor</Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {[profile?.sehir, profile?.ilce].filter(Boolean).join(", ") || "Konum bilgisi profilinden düzenlenebilir"} ·{" "}
                  Güven Puanı: <strong className="text-primary">{trustScore}/100</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile?.kullaniciId && onOpenStorefront ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl bg-white font-bold"
                  onClick={() => onOpenStorefront(profile.kullaniciId)}
                >
                  Vitrini Önizle
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl bg-white font-bold"
                onClick={() => onNavigate("seller-profile")}
              >
                Profili Düzenle
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-xl font-extrabold"
                onClick={onCreateProduct}
              >
                <Plus className="size-4" aria-hidden />
                Yeni Ürün Ekle
              </Button>
            </div>
          </Card>

          {/* KPI Grid */}
          {showOverview ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                <MetricCard
                  icon={Package}
                  label="Aktif Ürün"
                  value={String(activeProductsCount)}
                  helper={`Toplam ${sellerStats?.totalProducts ?? products.length} ürün · ${sellerStats?.outOfStockProducts ?? 0} stoksuz`}
                  tone="green"
                />
                <MetricCard
                  icon={ClipboardList}
                  label="Açık Talepler"
                  value={String(openDemandsCount)}
                  helper={`${sellerStats?.pendingOffers ?? pendingDemandsCount} bekleyen teklif`}
                  tone="amber"
                />
                <MetricCard
                  icon={CheckCircle2}
                  label="Anlaşılan"
                  value={String(agreedDemandsCount)}
                  helper={`${sellerStats?.acceptedOffers ?? agreedDemandsCount} kabul edilen teklif`}
                  tone="lime"
                />
                <MetricCard
                  icon={MessageCircle}
                  label="Canlı Sohbet"
                  value={String(conversations.length)}
                  helper={
                    (sellerStats?.unreadMessages ?? unreadMessageCount) > 0
                      ? `${sellerStats?.unreadMessages ?? unreadMessageCount} okunmamış mesaj`
                      : "Tüm mesajlar okundu"
                  }
                  tone="green"
                />
              </div>

              {sellerStats ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="rounded-xl border-border bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Mağaza Ortalama Puanı
                      </p>
                      <p className="mt-2 text-2xl font-black text-amber-600 tabular-nums">
                        {sellerStats.averageRating.toFixed(1)} ★
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {sellerStats.totalRatings} puan · {sellerStats.totalReviews} alıcı yorumu
                      </p>
                    </Card>
                    <Card className="rounded-xl border-border bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Takipçi & Favori
                      </p>
                      <p className="mt-2 text-2xl font-black text-primary tabular-nums">
                        {sellerStats.followerCount ?? 0} takipçi
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {sellerStats.totalFavorites} favorilenme · {sellerStats.lowStockProducts ?? 0} azalan stok
                      </p>
                    </Card>
                    <Card className="rounded-xl border-border bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Yanıt Hızı & Eşleşmeler
                      </p>
                      <p className="mt-2 text-2xl font-black text-brand-brown tabular-nums">
                        {sellerStats.averageResponseMinutes != null
                          ? `${Math.round(sellerStats.averageResponseMinutes)} dk`
                          : "—"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {sellerStats.unansweredDemands ?? 0} yanıtsız ·{" "}
                        {sellerStats.matchedOpenMarketDemands ?? marketDemands.length} açık pazar
                      </p>
                    </Card>
                    <Card className="rounded-xl border-border bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Teklif Dönüşüm Özeti
                      </p>
                      <p className="mt-2 text-2xl font-black text-brand-brown tabular-nums">
                        {sellerStats.acceptedOffers} Kabul / {sellerStats.rejectedOffers} Red
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Yanıt bekleyen: {sellerStats.pendingOffers} teklif
                      </p>
                    </Card>
                  </div>

                  {(sellerStats.actionSuggestions?.length ?? 0) > 0 ? (
                    <Card className="rounded-xl border-amber-200 bg-amber-50/60 p-4">
                      <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-900">
                        <Sparkles className="size-3.5" aria-hidden />
                        Önerilen Aksiyonlar
                      </p>
                      <ul className="mt-2 grid gap-1.5 text-xs font-semibold text-amber-950 sm:grid-cols-2">
                        {sellerStats.actionSuggestions!.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-600" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}

          {/* Incoming Demands (Interactive -> opens DemandDetailModal for Offer submission!) */}
          {(showOverview || activeTab === "demands") ? (
            <Panel
              title="Alıcılardan Gelen Talepler"
              badge={pendingDemandsCount || undefined}
              action={activeTab !== "demands" ? "Tümünü Gör" : undefined}
              onAction={() => onTabChange("demands")}
            >
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
                        label: `Anlaşılan (${demands.filter((d) => d.durum === "ANLASILDI").length})`,
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
                      onClick={() => setDemandStatusFilter(chip.id)}
                      className={cn(
                        "shrink-0 rounded-full border px-3 py-1 text-xs font-extrabold transition",
                        demandStatusFilter === chip.id
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
                  title={demands.length === 0 ? "Henüz gelen talep yok" : "Bu durumda talep yok"}
                  description={
                    demands.length === 0
                      ? "Alıcılar ürünlerine talep oluşturduğunda buradan birim fiyat ve mesaj teklifi verebilirsin."
                      : "Diğer durum sekmelerinden gelen talepleri görebilirsin."
                  }
                />
              ) : (
                <div className="space-y-2.5">
                  {filteredDemands.map((demand) => (
                    <div
                      key={demand.id}
                      className="flex flex-col gap-3 rounded-xl border border-border bg-[#fcfdfb] p-3 transition sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <DemandMediaLine
                          demand={demand}
                          onClick={() => onInspectDemand(demand.id)}
                        />
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 px-2 text-xs text-muted-foreground">
                          {demand.aliciAdi ? (
                            <span>
                              Alıcı: <strong className="text-foreground">{demand.aliciAdi}</strong>
                            </span>
                          ) : null}
                          {demand.sonTeklifTarihi ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                              <Clock className="size-3" aria-hidden />
                              Son teklif: {formatShortDate(demand.sonTeklifTarihi)}
                            </span>
                          ) : null}
                          {demand.guncellemeTarihi ? (
                            <span>Son güncelleme: {shortDate(demand.guncellemeTarihi)}</span>
                          ) : null}
                        </div>
                        {demand.not ? (
                          <p className="mt-1 px-2 text-xs text-muted-foreground">
                            Alıcı notu: &ldquo;{demand.not}&rdquo;
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 px-2 sm:px-0">
                        {chatEnabled && demand.aliciId ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg text-xs font-bold"
                            onClick={() => {
                              onSelectChatTarget(demand.aliciId, {
                                urunId: demand.urunId,
                                label: demandTitle(demand),
                                talepId: demand.id,
                              });
                              onTabChange("chat");
                            }}
                          >
                            <MessageCircle className="size-3.5 text-primary" aria-hidden />
                            Mesajlaş
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 rounded-lg text-xs font-extrabold"
                          onClick={() => onInspectDemand(demand.id)}
                        >
                          {demand.teklifler?.length ? "Teklifi Gör / Güncelle" : "Teklif Ver"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          ) : null}

          {/* Open Market ("Benim İçin Bul") Opportunities */}
          {(showOverview || activeTab === "demands") && marketDemands.length > 0 ? (
            <Panel
              title="Açık Pazar Fırsatları (Benim İçin Bul Eşleşmeleri)"
              badge={marketDemands.length}
            >
              <div className="grid gap-3 md:grid-cols-2">
                {marketDemands.map((demand) => (
                  <Card
                    key={demand.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border-emerald-200/80 bg-[#f6fbf5] p-3.5"
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge variant="secondary">Açık Pazar</Badge>
                        {typeof demand.eslesmeSkoru === "number" ? (
                          <Badge variant="green">Eşleşme %{demand.eslesmeSkoru}</Badge>
                        ) : null}
                      </div>
                      <h3 className="mt-2 text-sm font-black text-brand-brown">
                        {demandTitle(demand)}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Miktar: <strong>{demand.miktar} {demand.birim || "adet"}</strong>
                        {demand.teslimatSehir ? ` · Teslimat: ${demand.teslimatSehir}` : ""}
                        {demand.hedefBirimFiyat ? ` · Hedef: ${formatPrice(demand.hedefBirimFiyat)}` : ""}
                      </p>
                      {demand.eslesmeSebebi ? (
                        <p className="mt-1 text-[11px] font-semibold text-primary">
                          {demand.eslesmeSebebi}
                        </p>
                      ) : null}
                      {demand.not ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          &ldquo;{demand.not}&rdquo;
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t border-emerald-200/70 pt-2.5">
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {demand.sonTeklifTarihi
                          ? `Son teklif: ${formatShortDate(demand.sonTeklifTarihi)}`
                          : shortDate(demand.olusturmaTarihi)}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 rounded-lg text-xs font-extrabold"
                        onClick={() => onInspectDemand(demand.id)}
                      >
                        Teklif Gönder
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Panel>
          ) : null}

          {/* Product Inventory */}
          {(showOverview || activeTab === "products") ? (
            <Panel
              title="Ürün Envanterim"
              badge={products.length || undefined}
              action="+ Yeni Ürün Ekle"
              onAction={onCreateProduct}
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
                  {(
                    [
                      { id: "all", label: `Tümü (${products.length})` },
                      { id: "active", label: "Aktif" },
                      { id: "passive", label: "Pasif" },
                      { id: "out_of_stock", label: "Stok Yok" },
                    ] as const
                  ).map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setInventoryFilter(chip.id)}
                      className={cn(
                        "shrink-0 rounded-full border px-3 py-1 text-xs font-extrabold transition",
                        inventoryFilter === chip.id
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-white text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {onBulkUpdateStock && products.length > 0 ? (
                    <Button
                      type="button"
                      size="sm"
                      variant={bulkMode ? "secondary" : "outline"}
                      className="h-9 rounded-xl text-xs font-bold"
                      onClick={() => setBulkMode((v) => !v)}
                    >
                      {bulkMode ? "Toplu Düzenlemeyi Kapat" : "Toplu Stok & Fiyat"}
                    </Button>
                  ) : null}
                  <div className="relative w-full sm:w-64">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      value={inventoryQuery}
                      onChange={(event) => setInventoryQuery(event.target.value)}
                      placeholder="Ürün veya kategori ara..."
                      className="h-9 pl-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              {bulkMode && onBulkUpdateStock && products.length > 0 ? (
                <SellerBulkStockPanel
                  products={products}
                  saving={actionStatus === "bulk-stock"}
                  onSave={async (items) => {
                    const ok = await onBulkUpdateStock(items);
                    if (ok) setBulkMode(false);
                    return ok;
                  }}
                />
              ) : null}

              {filteredProducts.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="Listelenecek ürün yok"
                  description="İlk yöresel ürününü ekleyerek alıcıların seni keşfetmesini sağla."
                  action={
                    <Button size="sm" onClick={onCreateProduct}>
                      <Plus className="size-4" aria-hidden />
                      Ürün Ekle
                    </Button>
                  }
                />
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredProducts.map((product) => {
                    const active = product.aktifMi !== false;
                    return (
                      <div
                        key={product.id}
                        className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-[#fcfdfb] p-3.5"
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                            <Image
                              src={productImage(product)}
                              alt={product.adi}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h3 className="truncate text-sm font-black text-brand-brown">
                                {product.adi}
                              </h3>
                              <Badge variant={active ? "green" : "outline"} className="text-[10px]">
                                {active ? "Aktif" : "Pasif"}
                              </Badge>
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {product.kategoriAdi} · Stok:{" "}
                              <strong className={(product.stokMiktari ?? 0) <= 0 ? "text-red-600" : ""}>
                                {product.stokMiktari ?? 0}
                              </strong>
                            </p>
                            <p className="mt-1 text-base font-black text-primary tabular-nums">
                              {formatPrice(product.fiyat)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-2.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg px-2.5 text-xs font-bold"
                            disabled={actionStatus === `status-${product.id}`}
                            onClick={() => onToggleProductStatus(product)}
                          >
                            {active ? "Pasife Al" : "Aktifleştir"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-8 rounded-lg px-2.5 text-xs font-bold"
                            onClick={() => onEditProduct(product)}
                          >
                            <Pencil className="size-3.5" aria-hidden />
                            Düzenle
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-lg px-2 text-xs font-bold"
                            title="Bilgileri kopyalayarak yeni ürün oluştur"
                            onClick={() => onDuplicateProduct(product)}
                          >
                            <CopyPlus className="size-3.5" aria-hidden />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="ml-auto h-8 rounded-lg px-2 text-xs font-bold text-red-600 hover:bg-red-50"
                            disabled={actionStatus === `delete-${product.id}`}
                            onClick={() => onDeleteProduct(product)}
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          ) : null}

          {/* Logistics: Planned Shipments & Ortak Alım */}
          {activeTab === "logistics" ? (
            <SellerLogisticsSection
              profile={profile}
              products={products}
              shipments={sellerShipments}
              ortakAlimlar={ortakAlimlar}
              actionStatus={actionStatus}
              onCreateShipment={onCreateShipment}
              onCancelShipment={onCancelShipment}
              onCreateOrtakAlim={onCreateOrtakAlim}
              onApproveOrtakAlim={onApproveOrtakAlim}
              onUpdateOrtakAlimStatus={onUpdateOrtakAlimStatus}
            />
          ) : null}

          {/* Live SignalR Chat */}
          {(showOverview || activeTab === "chat") && chatEnabled ? (
            <Panel title="Alıcılarla Canlı Sohbet" badge={unreadMessageCount || undefined}>
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
        activeScreen="seller"
        authUser={authUser}
        unreadMessages={unreadMessageCount}
        onNavigate={onNavigate}
      />
    </>
  );
}

export function SellerProductScreen({
  categories,
  editingProduct,
  prefillSource,
  bootstrapUploads,
  actionStatus,
  onBack,
  onSubmit,
  onDeleteImage,
  onDeleteVideo,
  showToast,
}: {
  categories: CategoryDto[];
  editingProduct: ProductDto | null;
  prefillSource: ProductDto | null;
  bootstrapUploads?: AppBootstrapDto["uploads"];
  actionStatus: string | null;
  onBack: () => void;
  onSubmit: (values: ProductSubmitValues, urunId?: number) => Promise<void>;
  onDeleteImage: (urunId: number, resimId: number) => Promise<void>;
  onDeleteVideo: (urunId: number, videoId: number) => Promise<void>;
  showToast: (message: string, kind: ToastKind) => void;
}) {
  const source = editingProduct ?? prefillSource;
  const [adi, setAdi] = useState(source?.adi ?? "");
  const [aciklama, setAciklama] = useState(source?.aciklama ?? "");
  const [fiyat, setFiyat] = useState(source ? String(source.fiyat) : "");
  const [stokMiktari, setStokMiktari] = useState(
    source ? String(source.stokMiktari ?? 1) : "10",
  );
  const [kategoriId, setKategoriId] = useState(
    source?.kategoriId ?? categories[0]?.id ?? 1,
  );
  const [aktifMi, setAktifMi] = useState(source?.aktifMi ?? true);
  const [birimMiktar, setBirimMiktar] = useState(source?.birimMiktar ?? "");
  const [teslimatSecenekleri, setTeslimatSecenekleri] = useState(source?.teslimatSecenekleri ?? "");
  const [yeniHasatMi, setYeniHasatMi] = useState(source?.yeniHasatMi ?? false);
  const [uretimSehir, setUretimSehir] = useState(source?.uretimSehir ?? "");
  const [uretimIlce, setUretimIlce] = useState(source?.uretimIlce ?? "");
  const [eldenTeslimVarMi, setEldenTeslimVarMi] = useState(source?.eldenTeslimVarMi ?? false);
  const [kargoVarMi, setKargoVarMi] = useState(source?.kargoVarMi ?? true);
  const [gonderimSehirleri, setGonderimSehirleri] = useState(source?.gonderimSehirleri ?? "");
  const [resimler, setResimler] = useState<File[]>([]);
  const [videolar, setVideolar] = useState<File[]>([]);

  const maxImageBytes = bootstrapUploads?.maxImageBytes ?? 5 * 1024 * 1024;
  const maxVideoBytes = bootstrapUploads?.maxVideoBytes ?? 50 * 1024 * 1024;
  const maxTotalBytes = bootstrapUploads?.maxMultipartBodyBytes ?? 100 * 1024 * 1024;

  const previewUrls = useMemo(
    () => resimler.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
    [resimler],
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previewUrls]);

  const handleImagePick = (fileList: FileList | null) => {
    if (!fileList) return;
    const accepted: File[] = [];
    for (const file of Array.from(fileList)) {
      if (file.size > maxImageBytes) {
        showToast(
          `${file.name} görsel limitini (${formatBytes(maxImageBytes)}) aşıyor.`,
          "error",
        );
        continue;
      }
      accepted.push(file);
    }
    setResimler(accepted);
  };

  const handleVideoPick = (fileList: FileList | null) => {
    if (!fileList) return;
    const accepted: File[] = [];
    for (const file of Array.from(fileList)) {
      if (file.size > maxVideoBytes) {
        showToast(
          `${file.name} video limitini (${formatBytes(maxVideoBytes)}) aşıyor.`,
          "error",
        );
        continue;
      }
      accepted.push(file);
    }
    setVideolar(accepted);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanedName = adi.trim();
    const numericPrice = Number(fiyat);
    const numericStock = Number(stokMiktari);

    if (cleanedName.length < 5) {
      showToast("Ürün adı en az 5 karakter olmalıdır.", "error");
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      showToast("Geçerli ve sıfırdan büyük bir fiyat girmelisin.", "error");
      return;
    }
    if (!Number.isFinite(numericStock) || numericStock < 0) {
      showToast("Stok miktarı 0 veya daha büyük olmalıdır.", "error");
      return;
    }

    const totalSize = [...resimler, ...videolar].reduce((acc, f) => acc + f.size, 0);
    if (totalSize > maxTotalBytes) {
      showToast(
        `Toplam medya boyutu (${formatBytes(maxTotalBytes)}) sınırını aşıyor.`,
        "error",
      );
      return;
    }

    await onSubmit(
      {
        adi: cleanedName,
        aciklama: aciklama.trim(),
        fiyat: numericPrice,
        stokMiktari: Math.round(numericStock),
        kategoriId: Number(kategoriId),
        aktifMi,
        birimMiktar: birimMiktar.trim() || undefined,
        teslimatSecenekleri: teslimatSecenekleri.trim() || undefined,
        yeniHasatMi,
        uretimSehir: uretimSehir.trim() || undefined,
        uretimIlce: uretimIlce.trim() || undefined,
        eldenTeslimVarMi,
        kargoVarMi,
        gonderimSehirleri: gonderimSehirleri.trim() || undefined,
        resimler,
        videolar,
      },
      editingProduct?.id,
    );
  };

  const saving = actionStatus === "product-save";
  const categoryName =
    categories.find((c) => c.id === Number(kategoriId))?.adi ?? "Kategori";

  return (
    <main className="min-h-screen bg-[#f6f8f5] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-[1160px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onBack} className="bg-white">
            <ArrowLeft className="size-4" aria-hidden />
            Satıcı Paneline Dön
          </Button>
          <Badge variant="green">
            {editingProduct ? `Ürün #${editingProduct.id} Düzenleniyor` : "Yeni Ürün Oluştur"}
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-2xl p-5 sm:p-6">
            <h1 className="font-serif text-2xl font-bold text-[#14271c]">
              {editingProduct ? "Ürünü Güncelle" : "Yeni Yöresel Ürün Ekle"}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              En az 5 karakter ürün adı ve pozitif fiyat zorunludur. Güncellemede eklediğin medya mevcutların üzerine eklenir.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Field label="Ürün Adı *" htmlFor="prod-name">
                <Input
                  id="prod-name"
                  required
                  minLength={5}
                  value={adi}
                  onChange={(event) => setAdi(limitText(event.target.value, 120))}
                  placeholder="Ör: Taş Baskı Soğuk Sıkım Zeytinyağı (2 Lt)"
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Kategori *" htmlFor="prod-cat">
                  <select
                    id="prod-cat"
                    value={kategoriId}
                    onChange={(event) => setKategoriId(Number(event.target.value))}
                    className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm font-semibold outline-none focus:border-primary"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.adi}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Birim Fiyat (₺) *" htmlFor="prod-price">
                  <Input
                    id="prod-price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={fiyat}
                    onChange={(event) => setFiyat(event.target.value)}
                    placeholder="350"
                  />
                </Field>

                <Field label="Stok Miktarı *" htmlFor="prod-stock">
                  <Input
                    id="prod-stock"
                    type="number"
                    min="0"
                    required
                    value={stokMiktari}
                    onChange={(event) => setStokMiktari(event.target.value)}
                  />
                </Field>
              </div>

              <Field label="Ürün Açıklaması" htmlFor="prod-desc">
                <textarea
                  id="prod-desc"
                  rows={4}
                  value={aciklama}
                  onChange={(event) => setAciklama(limitText(event.target.value, 1200))}
                  placeholder="Ürünün hasat dönemi, üretim şekli, ambalaj ve yöre bilgilerini paylaş..."
                  className="w-full rounded-xl border border-input bg-white p-3 text-sm outline-none focus:border-primary"
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Birim / Paket Miktarı" htmlFor="prod-unit">
                  <Input
                    id="prod-unit"
                    value={birimMiktar}
                    onChange={(e) => setBirimMiktar(limitText(e.target.value, 60))}
                    placeholder="Ör: 1 kg, 2 Lt cam şişe"
                  />
                </Field>
                <Field label="Teslimat Seçenekleri Notu" htmlFor="prod-del-note">
                  <Input
                    id="prod-del-note"
                    value={teslimatSecenekleri}
                    onChange={(e) => setTeslimatSecenekleri(limitText(e.target.value, 160))}
                    placeholder="Ör: Soğuk zincir, haftalık toplu kargo"
                  />
                </Field>
                <Field label="Üretim İli (Yöre)" htmlFor="prod-orig-city">
                  <Input
                    id="prod-orig-city"
                    value={uretimSehir}
                    onChange={(e) => setUretimSehir(limitText(e.target.value, 60))}
                    placeholder="Ör: Kars, Artvin, Hatay"
                  />
                </Field>
                <Field label="Üretim İlçesi" htmlFor="prod-orig-dist">
                  <Input
                    id="prod-orig-dist"
                    value={uretimIlce}
                    onChange={(e) => setUretimIlce(limitText(e.target.value, 60))}
                    placeholder="Ör: Boğatepe, Şavşat"
                  />
                </Field>
              </div>

              <Field label="Gönderim Yapılan Şehirler (virgülle)" htmlFor="prod-ship-cities">
                <Input
                  id="prod-ship-cities"
                  value={gonderimSehirleri}
                  onChange={(e) => setGonderimSehirleri(limitText(e.target.value, 240))}
                  placeholder="Ör: Ankara, İstanbul, İzmir veya Tüm Türkiye"
                />
              </Field>

              <div className="grid gap-2 sm:grid-cols-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-[#f8faf7] p-3 text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={yeniHasatMi}
                    onChange={(e) => setYeniHasatMi(e.target.checked)}
                    className="size-4 accent-primary"
                  />
                  <span>Yeni Hasat Ürün</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-[#f8faf7] p-3 text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={eldenTeslimVarMi}
                    onChange={(e) => setEldenTeslimVarMi(e.target.checked)}
                    className="size-4 accent-primary"
                  />
                  <span>Elden Teslim Uygun</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-[#f8faf7] p-3 text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={kargoVarMi}
                    onChange={(e) => setKargoVarMi(e.target.checked)}
                    className="size-4 accent-primary"
                  />
                  <span>Kargo ile Gönderim</span>
                </label>
              </div>

              {editingProduct ? (
                <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-[#f8faf7] p-3 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={aktifMi}
                    onChange={(event) => setAktifMi(event.target.checked)}
                    className="size-4 accent-primary"
                  />
                  <span>Ürün vitrinde aktif olarak listelensin</span>
                </label>
              ) : null}

              {/* Upload Controls */}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-primary/40 bg-emerald-50/40 p-4 text-center transition hover:bg-emerald-50">
                  <ImagePlus className="size-6 text-primary" aria-hidden />
                  <span className="mt-1.5 text-xs font-black text-brand-brown">
                    Ürün Görselleri Seç
                  </span>
                  <span className="mt-0.5 text-[11px] text-muted-foreground">
                    Maks. {formatBytes(maxImageBytes)} / görsel
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(event) => handleImagePick(event.target.files)}
                  />
                </label>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-[#f9fbf8] p-4 text-center transition hover:bg-muted/60">
                  <Film className="size-6 text-primary" aria-hidden />
                  <span className="mt-1.5 text-xs font-black text-brand-brown">
                    Tanıtım Videosu Ekle
                  </span>
                  <span className="mt-0.5 text-[11px] text-muted-foreground">
                    Maks. {formatBytes(maxVideoBytes)} / video
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    className="sr-only"
                    onChange={(event) => handleVideoPick(event.target.files)}
                  />
                </label>
              </div>

              {/* Pending File Previews */}
              {(previewUrls.length > 0 || videolar.length > 0) ? (
                <div className="space-y-2 rounded-xl border border-border bg-[#f9fbf8] p-3">
                  <p className="text-xs font-black text-brand-brown">
                    Yüklenecek Medyalar ({previewUrls.length} görsel, {videolar.length} video)
                  </p>
                  {previewUrls.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {previewUrls.map((item) => (
                        <div
                          key={item.url}
                          className="relative size-16 overflow-hidden rounded-lg border border-border"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.url} alt={item.name} className="size-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {videolar.map((vid) => (
                    <p key={vid.name} className="text-xs text-muted-foreground">
                      Video: {vid.name} ({formatBytes(vid.size)})
                    </p>
                  ))}
                </div>
              ) : null}

              {/* Existing Uploaded Media (when editing) */}
              {editingProduct &&
              ((editingProduct.resimler?.length ?? 0) > 0 ||
                (editingProduct.videolar?.length ?? 0) > 0) ? (
                <div className="space-y-3 rounded-xl border border-border p-3.5">
                  <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Mevcut Yüklü Medyalar
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {(editingProduct.resimler ?? []).map((img) => (
                      <div key={img.id} className="group relative size-20 overflow-hidden rounded-xl border border-border">
                        <Image
                          src={mediaImageSrc(img.url)}
                          alt=""
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => void onDeleteImage(editingProduct.id, img.id)}
                          aria-label="Görseli sil"
                          className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white shadow-xs transition hover:bg-red-700"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                    {(editingProduct.videolar ?? []).map((vid) => (
                      <div
                        key={vid.id}
                        className="relative flex h-20 w-32 items-center justify-center overflow-hidden rounded-xl border border-border bg-slate-900 text-white"
                      >
                        <video
                          src={mediaVideoSrc(vid.url)}
                          className="size-full object-cover opacity-80"
                          muted
                        />
                        <button
                          type="button"
                          onClick={() => void onDeleteVideo(editingProduct.id, vid.id)}
                          aria-label="Videoyu sil"
                          className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white shadow-xs hover:bg-red-700"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onBack}>
                  Vazgeç
                </Button>
                <Button type="submit" size="lg" className="rounded-xl font-extrabold" disabled={saving}>
                  {saving ? <Loader2 className="animate-spin" aria-hidden /> : null}
                  {saving ? "Kaydediliyor..." : editingProduct ? "Değişiklikleri Kaydet" : "Ürünü Yayınla"}
                </Button>
              </div>
            </form>
          </Card>

          {/* Live Vitrin Card Preview */}
          <div className="space-y-4">
            <Card className="overflow-hidden rounded-2xl border-border bg-white p-4">
              <p className="mb-3 text-xs font-black uppercase tracking-wider text-muted-foreground">
                Canlı Vitrin Önizlemesi
              </p>
              <div className="overflow-hidden rounded-2xl border border-border">
                <div className="relative aspect-[4/3] bg-[#eff4ec]">
                  {previewUrls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrls[0].url}
                      alt="Önizleme"
                      className="size-full object-cover"
                    />
                  ) : (
                    <Image
                      src={editingProduct ? productImage(editingProduct) : "/products/product-placeholder.svg"}
                      alt="Önizleme"
                      fill
                      sizes="360px"
                      className="object-cover"
                    />
                  )}
                  <Badge variant="green" className="absolute left-3 top-3">
                    {categoryName}
                  </Badge>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-black text-brand-brown">
                    {adi.trim() || "Ürün Başlığı"}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {aciklama.trim() || "Ürün açıklaman burada görünecek."}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-3">
                    <span className="text-lg font-black text-primary tabular-nums">
                      {formatPrice(Number(fiyat) || 0)}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      Stok: {stokMiktari || 0}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

export function SellerProfileScreen({
  profile,
  trustScore,
  locations = [],
  cities = [],
  maxImageBytes = 5 * 1024 * 1024,
  actionStatus,
  onBack,
  onSave,
  onOpenStorefront,
}: {
  profile: SellerProfileDto | null;
  sellerStats?: SellerDashboardDto | null;
  trustScore?: number;
  locations?: BootstrapLocationDto[];
  cities?: string[];
  maxImageBytes?: number;
  actionStatus: string | null;
  onBack: () => void;
  onSave: (values: SellerProfileUpdateValues) => Promise<void>;
  onOpenStorefront?: (saticiId: string) => void;
}) {
  const [magazaAdi, setMagazaAdi] = useState(profile?.magazaAdi ?? "");
  const [adres, setAdres] = useState(profile?.adres ?? "");
  const [sehir, setSehir] = useState(profile?.sehir ?? "");
  const [ilce, setIlce] = useState(profile?.ilce ?? "");
  const [aciklama, setAciklama] = useState(profile?.aciklama ?? "");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber ?? "");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);

  const handleCoverPick = (file: File | null) => {
    setCoverError(null);
    if (!file) {
      setCoverFile(null);
      setCoverPreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setCoverError("Kapak görseli için lütfen geçerli bir resim dosyası (JPG, PNG, WebP) seç.");
      return;
    }
    if (file.size > maxImageBytes) {
      setCoverError(`Görsel boyutu en fazla ${formatBytes(maxImageBytes)} olabilir.`);
      return;
    }
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setCoverPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave({
      magazaAdi: magazaAdi.trim(),
      adres: adres.trim() || undefined,
      sehir: sehir.trim() || undefined,
      ilce: ilce.trim() || undefined,
      aciklama: aciklama.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined,
      kapakResim: coverFile,
    });
  };

  const saving = actionStatus === "seller-profile";
  const activeCoverSrc = coverPreview || (profile?.kapakResimUrl ? mediaImageSrc(profile.kapakResimUrl) : null);

  return (
    <main className="min-h-screen bg-[#f6f8f5] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-[980px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onBack} className="bg-white">
            <ArrowLeft className="size-4" aria-hidden />
            Satıcı Paneline Dön
          </Button>
          {profile?.kullaniciId && onOpenStorefront ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onOpenStorefront(profile.kullaniciId)}
            >
              Herkese Açık Mağaza Vitrinini Gör
            </Button>
          ) : null}
        </div>

        <Card className="grid gap-6 rounded-2xl p-5 sm:p-7 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200/80 bg-[#f4faf3] p-6 text-center">
            {activeCoverSrc ? (
              <div className="relative mb-4 h-28 w-full overflow-hidden rounded-xl border border-emerald-200 bg-white">
                <Image
                  src={activeCoverSrc}
                  alt="Mağaza kapak önizleme"
                  fill
                  sizes="320px"
                  className="object-cover"
                  unoptimized={Boolean(coverPreview)}
                />
              </div>
            ) : null}
            <TrustDial score={trustScore ?? 0} large />
            <h2 className="mt-4 text-lg font-black text-brand-brown">
              {profile?.magazaAdi ?? "Üretici Mağazası"}
            </h2>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              {profile?.dogrulanmisSatici ? "Doğrulanmış Üretici Rozeti Aktif" : "Doğrulama Beklemede"}
            </p>
            <div className="mt-5 w-full space-y-2 border-t border-emerald-200/70 pt-4 text-left text-xs">
              <ProfileRow label="Vergi No">
                <span className="font-mono font-bold">{profile?.vergiNo || "—"}</span>
              </ProfileRow>
              <ProfileRow label="Mağaza Paketi">
                <Badge variant="outline">{profile?.paketTuru || "STANDART"}</Badge>
              </ProfileRow>
              <ProfileRow label="Durum">
                <Badge variant={profile?.dogrulanmisSatici ? "green" : "outline"}>
                  {profile?.dogrulanmisSatici ? "Tam Doğrulamalı" : "Eksik Doğrulama"}
                </Badge>
              </ProfileRow>
              <ProfileRow label="Alt Doğrulama">
                <div className="flex flex-wrap justify-end gap-1">
                  <Badge variant={profile?.epostaDogrulandi ? "green" : "outline"} className="text-[10px]">
                    E-posta
                  </Badge>
                  <Badge variant={profile?.isletmeDogrulandi ? "green" : "outline"} className="text-[10px]">
                    İşletme
                  </Badge>
                  <Badge variant={profile?.ureticiDogrulandi ? "green" : "outline"} className="text-[10px]">
                    Üretici
                  </Badge>
                </div>
              </ProfileRow>
              <ProfileRow label="Admin Kararı">
                <span className="font-semibold text-foreground">
                  {profile?.adminDogrulamaDurumu === true
                    ? "Manuel Onaylı"
                    : profile?.adminDogrulamaDurumu === false
                      ? "Manuel Kısıtlı"
                      : "Otomatik Profil"}
                </span>
              </ProfileRow>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <h1 className="font-serif text-2xl font-bold text-[#14271c]">
              Mağaza Vitrini & Profil Bilgileri
            </h1>

            <Field label="Mağaza Kapak Fotoğrafı (Vitrin Görseli)" htmlFor="sp-cover">
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-border bg-[#f9fbf8] p-3">
                <label
                  htmlFor="sp-cover"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-xs font-extrabold text-brand-brown shadow-xs transition hover:border-primary/40 hover:text-primary"
                >
                  <ImagePlus className="size-4 text-primary" aria-hidden />
                  {coverFile ? "Başka Kapak Seç" : "Kapak Fotoğrafı Yükle"}
                </label>
                <input
                  id="sp-cover"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => handleCoverPick(event.target.files?.[0] ?? null)}
                />
                <span className="text-xs text-muted-foreground">
                  {coverFile
                    ? `${coverFile.name} (${formatBytes(coverFile.size)})`
                    : `Maks. ${formatBytes(maxImageBytes)} · JPG/PNG/WebP`}
                </span>
                {coverFile ? (
                  <button
                    type="button"
                    onClick={() => handleCoverPick(null)}
                    className="ml-auto text-xs font-bold text-red-600 hover:underline"
                  >
                    Kaldır
                  </button>
                ) : null}
              </div>
              {coverError ? <p className="mt-1 text-xs font-semibold text-red-600">{coverError}</p> : null}
            </Field>

            <Field label="Mağaza Adı *" htmlFor="sp-store">
              <Input
                id="sp-store"
                required
                minLength={3}
                value={magazaAdi}
                onChange={(event) => setMagazaAdi(limitText(event.target.value, 80))}
              />
            </Field>

            <LocationFields
              city={sehir}
              district={ilce}
              onCityChange={setSehir}
              onDistrictChange={setIlce}
              locations={locations}
              cities={cities}
              cityPlaceholder="Ör: Artvin"
              districtPlaceholder="Ör: Borçka"
              cityId="sp-city"
              districtId="sp-district"
            />

            <Field label="İletişim Telefonu" htmlFor="sp-phone">
              <Input
                id="sp-phone"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(phoneInput(event.target.value))}
                placeholder="0555 123 45 67"
              />
            </Field>

            <Field label="Mağaza Hikayesi & Üretim Hakkında (Vitrinde Görünür)" htmlFor="sp-story">
              <textarea
                id="sp-story"
                rows={4}
                value={aciklama}
                onChange={(event) => setAciklama(limitText(event.target.value, 1000))}
                placeholder="Ailenizin üretim geleneğini, yöresel yöntemlerinizi ve ürünlerinizin doğallığını anlatın (maks. 1000 karakter)..."
                className="w-full rounded-xl border border-input bg-white p-3 text-sm outline-none focus:border-primary"
              />
            </Field>

            <Field label="Açık Adres" htmlFor="sp-desc">
              <textarea
                id="sp-desc"
                rows={2}
                value={adres}
                onChange={(event) => setAdres(limitText(event.target.value, 500))}
                placeholder="Mağaza veya üretim adres bilgin..."
                className="w-full rounded-xl border border-input bg-white p-3 text-sm outline-none focus:border-primary"
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onBack}>
                İptal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="animate-spin" aria-hidden /> : null}
                {saving ? "Kaydediliyor..." : "Profili Kaydet"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}

function SellerBulkStockPanel({
  products,
  saving,
  onSave,
}: {
  products: ProductDto[];
  saving: boolean;
  onSave: (items: BulkStockItemValues[]) => Promise<boolean>;
}) {
  const [drafts, setDrafts] = useState<
    Record<number, { fiyat: string; stok: string; yeniHasatMi: boolean }>
  >(() =>
    Object.fromEntries(
      products.map((p) => [
        p.id,
        {
          fiyat: String(p.fiyat),
          stok: String(p.stokMiktari ?? 0),
          yeniHasatMi: Boolean(p.yeniHasatMi),
        },
      ]),
    ),
  );

  return (
    <div className="mb-4 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-wider text-primary">
          Toplu Stok, Fiyat & Yeni Hasat Güncelleme
        </p>
        <Button
          type="button"
          size="sm"
          disabled={saving}
          onClick={() => {
            const items: BulkStockItemValues[] = [];
            for (const p of products) {
              const d = drafts[p.id];
              if (!d) continue;
              items.push({
                urunId: p.id,
                fiyat: Math.max(0.01, Number(d.fiyat) || p.fiyat),
                stokMiktari: Math.max(0, Math.round(Number(d.stok) || 0)),
                yeniHasatMi: d.yeniHasatMi,
              });
            }
            onSave(items);
          }}
        >
          {saving ? "Kaydediliyor..." : "Değişiklikleri Toplu Kaydet"}
        </Button>
      </div>

      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {products.map((p) => {
          const d = drafts[p.id] ?? {
            fiyat: String(p.fiyat),
            stok: String(p.stokMiktari ?? 0),
            yeniHasatMi: Boolean(p.yeniHasatMi),
          };
          return (
            <div
              key={p.id}
              className="grid grid-cols-1 items-center gap-2 rounded-lg border border-border bg-white p-2.5 text-xs sm:grid-cols-[1.5fr_90px_80px_auto]"
            >
              <span className="truncate font-bold text-brand-brown">{p.adi}</span>
              <Input
                type="number"
                step="0.01"
                min={0.01}
                value={d.fiyat}
                onChange={(e) =>
                  setDrafts((prev) => ({ ...prev, [p.id]: { ...d, fiyat: e.target.value } }))
                }
                className="h-8 text-xs"
                aria-label={`${p.adi} fiyat`}
              />
              <Input
                type="number"
                min={0}
                value={d.stok}
                onChange={(e) =>
                  setDrafts((prev) => ({ ...prev, [p.id]: { ...d, stok: e.target.value } }))
                }
                className="h-8 text-xs"
                aria-label={`${p.adi} stok`}
              />
              <label className="flex cursor-pointer items-center gap-1.5 font-semibold">
                <input
                  type="checkbox"
                  checked={d.yeniHasatMi}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [p.id]: { ...d, yeniHasatMi: e.target.checked },
                    }))
                  }
                  className="size-3.5 accent-primary"
                />
                Hasat
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SellerLogisticsSection({
  profile,
  products,
  shipments,
  ortakAlimlar,
  actionStatus,
  onCreateShipment,
  onCancelShipment,
  onCreateOrtakAlim,
  onApproveOrtakAlim,
  onUpdateOrtakAlimStatus,
}: {
  profile: SellerProfileDto | null;
  products: ProductDto[];
  shipments: PlanliGonderimDto[];
  ortakAlimlar: OrtakAlimDto[];
  actionStatus: string | null;
  onCreateShipment?: (values: PlanliGonderimCreateValues) => Promise<boolean>;
  onCancelShipment?: (id: number) => Promise<void>;
  onCreateOrtakAlim?: (values: OrtakAlimCreateValues) => Promise<boolean>;
  onApproveOrtakAlim?: (id: number) => Promise<void>;
  onUpdateOrtakAlimStatus?: (id: number, durum: string) => Promise<void>;
}) {
  const [baslik, setBaslik] = useState("");
  const [hedefSehir, setHedefSehir] = useState("");
  const [menseiSehir, setMenseiSehir] = useState(profile?.sehir ?? "");
  const [gonderimTarihi, setGonderimTarihi] = useState(() =>
    new Date(Date.now() + 5 * 86400_000).toISOString().slice(0, 10),
  );
  const [sonTalepTarihi, setSonTalepTarihi] = useState(() =>
    new Date(Date.now() + 3 * 86400_000).toISOString().slice(0, 10),
  );
  const [tahminiUrunNotu, setTahminiUrunNotu] = useState("");
  const [sogukZincirVarMi, setSogukZincirVarMi] = useState(true);
  const [aciklama, setAciklama] = useState("");

  const [oaBaslik, setOaBaslik] = useState("");
  const [oaProductId, setOaProductId] = useState<string>(products[0] ? String(products[0].id) : "");
  const [oaMenseiSehir, setOaMenseiSehir] = useState(profile?.sehir ?? "");
  const [oaHedefSehir, setOaHedefSehir] = useState("");
  const [oaMinimumKatilimci, setOaMinimumKatilimci] = useState("5");
  const [oaBirim, setOaBirim] = useState("kg");
  const [oaBirimFiyat, setOaBirimFiyat] = useState("290");
  const [oaSogukZincir, setOaSogukZincir] = useState(false);
  const [oaSonKatilimTarihi, setOaSonKatilimTarihi] = useState(() =>
    new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
  );

  return (
    <div className="space-y-6">
      {/* Planlı Sevkiyat ("Şehrime Gelen Ürünler") */}
      <Panel title="Planlı Sevkiyatlar (Şehrime Gelen Ürünler)" badge={shipments.length || undefined}>
        {onCreateShipment ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!baslik.trim() || !hedefSehir.trim()) return;
              const ok = await onCreateShipment({
                baslik: baslik.trim(),
                hedefSehir: hedefSehir.trim(),
                menseiSehir: menseiSehir.trim() || profile?.sehir || "Türkiye",
                gonderimTarihi: new Date(gonderimTarihi).toISOString(),
                sonTalepTarihi: new Date(sonTalepTarihi).toISOString(),
                tahminiUrunNotu: tahminiUrunNotu.trim() || undefined,
                sogukZincirVarMi,
                aciklama: aciklama.trim() || undefined,
              });
              if (ok) {
                setBaslik("");
                setAciklama("");
                setTahminiUrunNotu("");
              }
            }}
            className="mb-4 space-y-3 rounded-xl border border-sky-200 bg-sky-50/40 p-4"
          >
            <p className="text-xs font-black uppercase tracking-wider text-sky-900">
              Yeni Planlı Sevkiyat Duyur (Takipçilere Bildirim Gider)
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Sevkiyat Başlığı *" htmlFor="ship-title">
                <Input
                  id="ship-title"
                  required
                  value={baslik}
                  onChange={(e) => setBaslik(e.target.value)}
                  placeholder="Ör: Ankara Cuma Taze Kars Kaşarı Sevkiyatı"
                />
              </Field>
              <Field label="Hedef Teslimat Şehri *" htmlFor="ship-target">
                <Input
                  id="ship-target"
                  required
                  value={hedefSehir}
                  onChange={(e) => setHedefSehir(e.target.value)}
                  placeholder="Ör: Ankara"
                />
              </Field>
              <Field label="Menşei / Üretim Şehri" htmlFor="ship-origin">
                <Input
                  id="ship-origin"
                  value={menseiSehir}
                  onChange={(e) => setMenseiSehir(e.target.value)}
                  placeholder="Ör: Kars"
                />
              </Field>
              <Field label="Planlanan Sevk Tarihi *" htmlFor="ship-date">
                <Input
                  id="ship-date"
                  type="date"
                  required
                  value={gonderimTarihi}
                  onChange={(e) => setGonderimTarihi(e.target.value)}
                />
              </Field>
              <Field label="Son Talep Tarihi *" htmlFor="ship-last-date">
                <Input
                  id="ship-last-date"
                  type="date"
                  required
                  value={sonTalepTarihi}
                  onChange={(e) => setSonTalepTarihi(e.target.value)}
                />
              </Field>
              <Field label="Tahmini Ürün & Fiyat Notu" htmlFor="ship-note">
                <Input
                  id="ship-note"
                  value={tahminiUrunNotu}
                  onChange={(e) => setTahminiUrunNotu(e.target.value)}
                  placeholder="Ör: Eski kaşar ~380 ₺/kg, tereyağı"
                />
              </Field>
            </div>
            <Field label="Sevkiyat Açıklaması / Dağıtım Noktası" htmlFor="ship-desc">
              <Input
                id="ship-desc"
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                placeholder="Ör: Cuma akşamı teslim, soğutuculu araçla Çankaya dağıtım..."
                className="bg-white"
              />
            </Field>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-bold">
                <input
                  type="checkbox"
                  checked={sogukZincirVarMi}
                  onChange={(e) => setSogukZincirVarMi(e.target.checked)}
                  className="size-4 accent-primary"
                />
                <Snowflake className="size-3.5 text-sky-700" aria-hidden />
                Soğuk zincir sevkiyat
              </label>
              <Button type="submit" size="sm" disabled={actionStatus === "shipment-create"}>
                {actionStatus === "shipment-create" ? "Yayınlanıyor..." : "Sevkiyat Duyurusu Yayınla"}
              </Button>
            </div>
          </form>
        ) : null}

        {shipments.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Planlı sevkiyat yok"
            description="Hedef şehirlere yapacağın toplu sevkiyatları buradan duyurabilirsin."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {shipments.map((s) => (
              <Card key={s.id} className="flex items-start justify-between gap-3 rounded-xl border-border p-3.5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary">
                      {s.menseiSehir} → {s.hedefSehir}
                    </Badge>
                    {s.sogukZincirVarMi ? <Badge variant="green">Soğuk Zincir</Badge> : null}
                  </div>
                  <p className="mt-1.5 text-sm font-black text-brand-brown">{s.baslik}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <CalendarClock className="mr-1 inline size-3.5" aria-hidden />
                    Sevk: {formatShortDate(s.gonderimTarihi)} · Son Talep: {formatShortDate(s.sonTalepTarihi)}
                  </p>
                </div>
                {onCancelShipment ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 shrink-0 text-xs font-bold text-red-600 hover:bg-red-50"
                    onClick={() => onCancelShipment(s.id)}
                  >
                    İptal Et
                  </Button>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </Panel>

      {/* Yöremio Ortak Alım Kampanyaları Yönetimi */}
      <Panel title="Yöremio Ortak Alım Yönetimi" badge={ortakAlimlar.length || undefined}>
        {onCreateOrtakAlim ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!oaBaslik.trim()) return;
              const ok = await onCreateOrtakAlim({
                urunId: oaProductId ? Number(oaProductId) : undefined,
                baslik: oaBaslik.trim(),
                menseiSehir: oaMenseiSehir.trim() || profile?.sehir || "Türkiye",
                hedefSehir: oaHedefSehir.trim() || profile?.sehir || "Türkiye",
                birim: oaBirim.trim() || "kg",
                birimFiyat: Math.max(1, Number(oaBirimFiyat) || 100),
                minimumKatilimci: Math.max(2, Number(oaMinimumKatilimci) || 5),
                sogukZincirGerekliMi: oaSogukZincir,
                sonKatilimTarihi: new Date(oaSonKatilimTarihi).toISOString(),
              });
              if (ok) setOaBaslik("");
            }}
            className="mb-4 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4"
          >
            <p className="text-xs font-black uppercase tracking-wider text-primary">
              Yeni Ortak Alım Kampanyası Başlat
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Kampanya Başlığı *" htmlFor="soa-title">
                <Input
                  id="soa-title"
                  required
                  value={oaBaslik}
                  onChange={(e) => setOaBaslik(e.target.value)}
                  placeholder="Ör: 25 Kg Taş Baskı Zeytinyağı Ortak Alımı"
                />
              </Field>
              <Field label="İlgili Ürün" htmlFor="soa-prod">
                <select
                  id="soa-prod"
                  value={oaProductId}
                  onChange={(e) => setOaProductId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm font-semibold"
                >
                  <option value="">Ürün Seçiniz (Opsiyonel)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.adi}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Menşei Şehir" htmlFor="soa-origin">
                  <Input
                    id="soa-origin"
                    value={oaMenseiSehir}
                    onChange={(e) => setOaMenseiSehir(e.target.value)}
                    placeholder="Ör: Ayvalık"
                  />
                </Field>
                <Field label="Hedef Şehir" htmlFor="soa-city">
                  <Input
                    id="soa-city"
                    value={oaHedefSehir}
                    onChange={(e) => setOaHedefSehir(e.target.value)}
                    placeholder="Ör: İstanbul"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Min Katılımcı" htmlFor="soa-target">
                  <Input
                    id="soa-target"
                    type="number"
                    min={2}
                    value={oaMinimumKatilimci}
                    onChange={(e) => setOaMinimumKatilimci(e.target.value)}
                  />
                </Field>
                <Field label="Birim" htmlFor="soa-unit">
                  <Input id="soa-unit" value={oaBirim} onChange={(e) => setOaBirim(e.target.value)} />
                </Field>
              </div>
              <Field label="Ortak Alım Birim Fiyatı (₺) *" htmlFor="soa-price">
                <Input
                  id="soa-price"
                  type="number"
                  min={1}
                  required
                  value={oaBirimFiyat}
                  onChange={(e) => setOaBirimFiyat(e.target.value)}
                  placeholder="290"
                />
              </Field>
              <Field label="Son Katılım Tarihi *" htmlFor="soa-end">
                <Input
                  id="soa-end"
                  type="date"
                  required
                  value={oaSonKatilimTarihi}
                  onChange={(e) => setOaSonKatilimTarihi(e.target.value)}
                />
              </Field>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-bold">
                <input
                  type="checkbox"
                  checked={oaSogukZincir}
                  onChange={(e) => setOaSogukZincir(e.target.checked)}
                  className="size-4 accent-primary"
                />
                Soğuk zincir gerekli
              </label>
              <Button type="submit" size="sm" disabled={actionStatus === "ortak-alim-create"}>
                <Users className="size-3.5" aria-hidden />
                {actionStatus === "ortak-alim-create" ? "Başlatılıyor..." : "Kampanya Aç"}
              </Button>
            </div>
          </form>
        ) : null}

        {ortakAlimlar.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {ortakAlimlar.map((camp) => {
              const meta = ortakAlimStatusMeta(camp.durum);
              return (
                <Card key={camp.id} className="space-y-2 rounded-xl border-border p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                    <span className="text-xs font-bold text-primary tabular-nums">
                      {camp.toplamTalepMiktari} {camp.birim || "adet"} ({camp.mevcutKatilimci}/{camp.minimumKatilimci} kişi)
                    </span>
                  </div>
                  <p className="text-sm font-black text-brand-brown">{camp.baslik}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {camp.durum === "ONERI" && onApproveOrtakAlim ? (
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 rounded-lg text-xs font-extrabold"
                        onClick={() => onApproveOrtakAlim(camp.id)}
                      >
                        Üretici Olarak Onayla
                      </Button>
                    ) : null}
                    {onUpdateOrtakAlimStatus && camp.durum !== "TAMAMLANDI" && camp.durum !== "IPTAL" ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 rounded-lg text-xs font-bold"
                          onClick={() => onUpdateOrtakAlimStatus(camp.id, "TAMAMLANDI")}
                        >
                          Tamamla
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 rounded-lg text-xs font-bold text-red-600"
                          onClick={() => onUpdateOrtakAlimStatus(camp.id, "IPTAL")}
                        >
                          İptal
                        </Button>
                      </>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
