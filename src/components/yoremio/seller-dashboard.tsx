"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
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
  Store,
  Trash2,
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
  MetricCard,
  MobileBottomNav,
  Panel,
  ProfileRow,
  TrustDial,
  type DashboardNavItem,
} from "@/components/yoremio/ui-kit";
import {
  formatBytes,
  mediaImageSrc,
  mediaVideoSrc,
  productImage,
  type AuthState,
  type ProductSubmitValues,
  type Screen,
  type SellerTab,
  type ToastKind,
} from "@/components/yoremio/types";
import type {
  AppBootstrapDto,
  CategoryDto,
  ChatConversationDto,
  ChatMessageDto,
  DemandDto,
  ProductDto,
  SellerProfileDto,
  SellerProfileUpdateValues,
} from "@/lib/api";
import { cn, formatPrice, limitText, phoneInput } from "@/lib/utils";

type InventoryFilter = "all" | "active" | "passive" | "out_of_stock";

export function SellerDashboard({
  authUser,
  activeTab,
  onTabChange,
  profile,
  trustScore: trustScoreProp,
  products,
  demands,
  conversations,
  messages,
  chatTargetId,
  notificationUnreadCount,
  unreadMessageCount,
  actionStatus,
  signalrConnected,
  typingFromUserId,
  chatEnabled = true,
  onSelectChatTarget,
  onSendMessage,
  onTyping,
  onCreateProduct,
  onEditProduct,
  onDuplicateProduct,
  onToggleProductStatus,
  onDeleteProduct,
  onInspectDemand,
  onOpenStorefront,
  onNavigate,
  onLogout,
}: {
  authUser: AuthState | null;
  activeTab: SellerTab;
  onTabChange: (tab: SellerTab) => void;
  profile: SellerProfileDto | null;
  trustScore?: number;
  products: ProductDto[];
  demands: DemandDto[];
  conversations: ChatConversationDto[];
  messages: ChatMessageDto[];
  chatTargetId: string;
  notificationUnreadCount: number;
  unreadMessageCount: number;
  actionStatus: string | null;
  signalrConnected: boolean;
  typingFromUserId: string | null;
  chatEnabled?: boolean;
  onSelectChatTarget: (userId: string) => void;
  onSendMessage: (receiverId: string, message: string) => void;
  onTyping: (receiverId: string) => void;
  onCreateProduct: () => void;
  onEditProduct: (product: ProductDto) => void;
  onDuplicateProduct: (product: ProductDto) => void;
  onToggleProductStatus: (product: ProductDto) => void;
  onDeleteProduct: (product: ProductDto) => void;
  onInspectDemand: (demandId: number) => void;
  onOpenStorefront?: (saticiId: string) => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}) {
  const [inventoryFilter, setInventoryFilter] = useState<InventoryFilter>("all");
  const [inventoryQuery, setInventoryQuery] = useState("");

  const activeProductsCount = products.filter((p) => p.aktifMi !== false).length;
  const openDemandsCount = demands.filter((d) => d.durum !== "IPTAL").length;
  const pendingDemandsCount = demands.filter((d) => d.durum === "ACIK").length;
  const trustScore = Math.round(trustScoreProp ?? 0);

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
      badge: pendingDemandsCount || undefined,
      active: activeTab === "demands",
      onClick: () => onTabChange("demands"),
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
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <MetricCard
                icon={Package}
                label="Aktif Ürün"
                value={String(activeProductsCount)}
                helper={`Toplam ${products.length} ürün kaydı`}
                tone="green"
              />
              <MetricCard
                icon={ClipboardList}
                label="Gelen Talepler"
                value={String(openDemandsCount)}
                helper={`${pendingDemandsCount} yeni yanıt bekleyen`}
                tone="amber"
              />
              <MetricCard
                icon={CheckCircle2}
                label="Anlaşılan Talep"
                value={String(demands.filter((d) => d.durum === "ANLASILDI").length)}
                helper="Alıcı onayı tamamlananlar"
                tone="lime"
              />
              <MetricCard
                icon={MessageCircle}
                label="Canlı Sohbet"
                value={String(conversations.length)}
                helper={unreadMessageCount ? `${unreadMessageCount} okunmamış mesaj` : "Tüm mesajlar okundu"}
                tone="green"
              />
            </div>
          ) : null}

          {/* Incoming Demands (Interactive -> opens DemandDetailModal for Offer submission!) */}
          {(showOverview || activeTab === "demands") ? (
            <Panel
              title="Alıcılardan Gelen Talepler"
              badge={pendingDemandsCount || undefined}
              action={activeTab !== "demands" ? "Tümünü Gör" : undefined}
              onAction={() => onTabChange("demands")}
            >
              {demands.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="Henüz gelen talep yok"
                  description="Alıcılar ürünlerine talep oluşturduğunda buradan birim fiyat ve mesaj teklifi verebilirsin."
                />
              ) : (
                <div className="space-y-2.5">
                  {demands.map((demand) => (
                    <div
                      key={demand.id}
                      className="flex flex-col gap-3 rounded-xl border border-border bg-[#fcfdfb] p-3 transition sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <DemandMediaLine
                          demand={demand}
                          onClick={() => onInspectDemand(demand.id)}
                        />
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
                              onSelectChatTarget(demand.aliciId);
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

          {/* Live SignalR Chat */}
          {(showOverview || activeTab === "chat") && chatEnabled ? (
            <Panel title="Alıcılarla Canlı Sohbet" badge={unreadMessageCount || undefined}>
              <ChatPanel
                compact={showOverview}
                conversations={conversations}
                messages={messages}
                targetId={chatTargetId}
                actionStatus={actionStatus}
                signalrConnected={signalrConnected}
                typingFromUserId={typingFromUserId}
                onTargetChange={onSelectChatTarget}
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
  actionStatus,
  onBack,
  onSave,
  onOpenStorefront,
}: {
  profile: SellerProfileDto | null;
  trustScore?: number;
  actionStatus: string | null;
  onBack: () => void;
  onSave: (values: SellerProfileUpdateValues) => Promise<void>;
  onOpenStorefront?: (saticiId: string) => void;
}) {
  const [magazaAdi, setMagazaAdi] = useState(profile?.magazaAdi ?? "");
  const [adres, setAdres] = useState(profile?.adres ?? "");
  const [sehir, setSehir] = useState(profile?.sehir ?? "");
  const [ilce, setIlce] = useState(profile?.ilce ?? "");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber ?? "");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave({
      magazaAdi: magazaAdi.trim(),
      adres: adres.trim() || undefined,
      sehir: sehir.trim() || undefined,
      ilce: ilce.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined,
    });
  };

  const saving = actionStatus === "seller-profile";

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
              <ProfileRow label="Durum">
                <Badge variant={profile?.dogrulanmisSatici ? "green" : "outline"}>
                  {profile?.dogrulanmisSatici ? "Onaylı" : "İncelemede"}
                </Badge>
              </ProfileRow>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <h1 className="font-serif text-2xl font-bold text-[#14271c]">
              Mağaza Bilgilerini Güncelle
            </h1>

            <Field label="Mağaza Adı *" htmlFor="sp-store">
              <Input
                id="sp-store"
                required
                minLength={3}
                value={magazaAdi}
                onChange={(event) => setMagazaAdi(limitText(event.target.value, 80))}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Şehir" htmlFor="sp-city">
                <Input
                  id="sp-city"
                  value={sehir}
                  onChange={(event) => setSehir(limitText(event.target.value, 40))}
                  placeholder="Ör: Artvin"
                />
              </Field>
              <Field label="İlçe" htmlFor="sp-district">
                <Input
                  id="sp-district"
                  value={ilce}
                  onChange={(event) => setIlce(limitText(event.target.value, 40))}
                  placeholder="Ör: Borçka"
                />
              </Field>
            </div>

            <Field label="İletişim Telefonu" htmlFor="sp-phone">
              <Input
                id="sp-phone"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(phoneInput(event.target.value))}
                placeholder="0555 123 45 67"
              />
            </Field>

            <Field label="Adres / Yöre Tarifi" htmlFor="sp-desc">
              <textarea
                id="sp-desc"
                rows={4}
                value={adres}
                onChange={(event) => setAdres(limitText(event.target.value, 1000))}
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
