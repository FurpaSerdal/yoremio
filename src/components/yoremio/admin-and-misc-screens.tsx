"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  ClipboardList,
  Eye,
  EyeOff,
  FolderKanban,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  MessageCircle,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  ShieldX,
  Star,
  Store,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DashboardFrame,
  EmptyState,
  Field,
  MetricCard,
  MobileBottomNav,
  PaginationBar,
  Panel,
  ProgressLine,
  PublicHeader,
  Stars,
  SupportRequestPanel,
  type DashboardNavItem,
} from "@/components/yoremio/ui-kit";
import {
  apiErrorInfo,
  productImage,
  productLocation,
  sellerName,
  shortDate,
  type AdminTab,
  type AuthState,
  type ReviewTab,
  type Screen,
  type ToastKind,
} from "@/components/yoremio/types";
import {
  yoremioApi,
  type AdminCommentDto,
  type AdminDashboardDto,
  type AdminUserDto,
  type CategoryDto,
  type CommentDto,
  type DemandGapDto,
  type NotificationDto,
  type Paginated,
  type ProductDto,
  type RatingDto,
  type ReviewEligibilityDto,
  type SellerProfileDto,
} from "@/lib/api";

type CategoryFormValues = Omit<CategoryDto, "id">;
import { cn, formatPrice, limitText } from "@/lib/utils";

export function AdminDashboard({
  authUser,
  activeTab,
  onTabChange,
  adminStats,
  categories,
  totalProducts,
  featuredSellerCount,
  unreadNotifications,
  actionStatus,
  showToast,
  onModerationUpdated,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onNavigate,
  onLogout,
}: {
  authUser: AuthState | null;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  adminStats?: AdminDashboardDto | null;
  categories: CategoryDto[];
  totalProducts: number;
  featuredSellerCount: number;
  unreadNotifications: number;
  actionStatus: string | null;
  showToast?: (message: string, kind: ToastKind, traceId?: string | null) => void;
  onModerationUpdated?: () => void;
  onCreateCategory: (values: CategoryFormValues) => Promise<boolean>;
  onUpdateCategory: (id: number, values: CategoryFormValues) => Promise<boolean>;
  onDeleteCategory: (category: CategoryDto) => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  const navItems: DashboardNavItem[] = [
    {
      id: "overview",
      label: "Platform Özeti",
      icon: LayoutDashboard,
      active: activeTab === "overview",
      onClick: () => onTabChange("overview"),
    },
    {
      id: "users",
      label: "Kullanıcı & Doğrulama",
      icon: Users,
      badge: adminStats?.totalUsers || undefined,
      active: activeTab === "users",
      onClick: () => onTabChange("users"),
    },
    {
      id: "products",
      label: "Ürün Moderasyonu",
      icon: Package,
      badge: adminStats?.totalProducts || undefined,
      active: activeTab === "products",
      onClick: () => onTabChange("products"),
    },
    {
      id: "comments",
      label: "Yorum Moderasyonu",
      icon: MessageSquare,
      badge: adminStats?.totalReviews || undefined,
      active: activeTab === "comments",
      onClick: () => onTabChange("comments"),
    },
    {
      id: "demands",
      label: "Talep & İletişim",
      icon: ClipboardList,
      badge: adminStats?.openDemands || undefined,
      active: activeTab === "demands",
      onClick: () => onTabChange("demands"),
    },
    {
      id: "demand-gaps",
      label: "Arz Boşlukları",
      icon: TrendingUp,
      active: activeTab === "demand-gaps",
      onClick: () => onTabChange("demand-gaps"),
    },
    {
      id: "categories",
      label: "Kategori Yönetimi",
      icon: FolderKanban,
      badge: categories.length || undefined,
      active: activeTab === "categories",
      onClick: () => onTabChange("categories"),
    },
  ];

  const sellerRatio = adminStats?.totalSellers
    ? Math.round((adminStats.activeSellers / adminStats.totalSellers) * 100)
    : 0;
  const activeProductRatio = adminStats?.totalProducts
    ? Math.round((adminStats.activeProducts / adminStats.totalProducts) * 100)
    : 0;
  const demandAgreeRatio = adminStats?.totalDemands
    ? Math.round((adminStats.agreedDemands / adminStats.totalDemands) * 100)
    : 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleaned = name.trim();
    if (cleaned.length < 2) return;
    const payload = { adi: cleaned, aciklama: description.trim() || undefined };
    const ok = editingCategoryId
      ? await onUpdateCategory(editingCategoryId, payload)
      : await onCreateCategory(payload);
    if (ok) {
      setName("");
      setDescription("");
      setEditingCategoryId(null);
    }
  };

  const showOverview = activeTab === "overview";

  return (
    <>
      <DashboardFrame
        variant="dark"
        title="Platform Yönetim Merkezi"
        subtitle="Yöremio kategori yapısını yönet, kullanıcı, ürün ve talep metriklerini canlı takip et."
        authUser={authUser}
        notificationUnreadCount={unreadNotifications}
        onNavigate={onNavigate}
        onLogout={onLogout}
        navItems={navItems}
      >
        <div className="space-y-6">
          {showOverview ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                <MetricCard
                  icon={Users}
                  label="Toplam Kullanıcı"
                  value={String(adminStats?.totalUsers ?? 0)}
                  helper={`${adminStats?.totalSellers ?? 0} satıcı · ${adminStats?.totalBuyers ?? 0} alıcı`}
                  tone="green"
                />
                <MetricCard
                  icon={Store}
                  label="Aktif Ürünler"
                  value={String(adminStats?.activeProducts ?? totalProducts)}
                  helper={`Toplam ${adminStats?.totalProducts ?? totalProducts} ürün (${adminStats?.inactiveProducts ?? 0} pasif)`}
                  tone="amber"
                />
                <MetricCard
                  icon={ClipboardList}
                  label="Toplam Talepler"
                  value={String(adminStats?.totalDemands ?? 0)}
                  helper={`${adminStats?.agreedDemands ?? 0} anlaşıldı · ${adminStats?.openDemands ?? 0} açık`}
                  tone="lime"
                />
                <MetricCard
                  icon={FolderKanban}
                  label="Kategoriler"
                  value={String(categories.length)}
                  helper={`${featuredSellerCount} vitrin üreticisi`}
                  tone="green"
                />
              </div>

              <Panel title="Platform Performans & Büyüme Analitiği">
                <div className="grid gap-4 md:grid-cols-3">
                  <ProgressLine label="Aktif Satıcı Oranı" value={sellerRatio} />
                  <ProgressLine label="Yayındaki Ürün Oranı" value={activeProductRatio} />
                  <ProgressLine label="Talep Anlaşma Oranı" value={demandAgreeRatio} />
                </div>
                {adminStats ? (
                  <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="rounded-xl border-border p-3.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Teklif & Anlaşma Dönüşümü
                      </p>
                      <p className="mt-1.5 text-lg font-black text-primary tabular-nums">
                        %{(adminStats.offerConversionRatePercent ?? 0).toFixed(1)} / %
                        {(adminStats.dealAgreementRatePercent ?? 0).toFixed(1)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {adminStats.verifiedCompletedDeals ?? 0} çift onaylı işlem
                      </p>
                    </Card>
                    <Card className="rounded-xl border-border p-3.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Tekrar Alıcı (60 Gün)
                      </p>
                      <p className="mt-1.5 text-lg font-black text-brand-brown tabular-nums">
                        {adminStats.repeatBuyers60Days ?? 0} (%
                        {(adminStats.repeatBuyerRatePercent ?? 0).toFixed(1)})
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Açık pazar talebi: {adminStats.openMarketDemands ?? 0}
                      </p>
                    </Card>
                    <Card className="rounded-xl border-border p-3.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Ortalama Satıcı Yanıtı
                      </p>
                      <p className="mt-1.5 text-lg font-black text-amber-700 tabular-nums">
                        {adminStats.averageSellerResponseMinutes != null
                          ? `${Math.round(adminStats.averageSellerResponseMinutes)} dk`
                          : "—"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        İlk teklif dönüş hızı
                      </p>
                    </Card>
                    <Card className="rounded-xl border-border p-3.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Alarm & Üretici Takipleri
                      </p>
                      <p className="mt-1.5 text-lg font-black text-primary tabular-nums">
                        {adminStats.activePriceAlerts ?? 0} alarm · {adminStats.totalSellerFollows ?? 0} takip
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Alıcı etkileşim sinyalleri
                      </p>
                    </Card>
                  </div>
                ) : null}
              </Panel>
            </>
          ) : null}

          {(showOverview || activeTab === "users") ? (
            <Panel title="Üretici & Alıcı Dağılımı">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-xl border-border p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Kayıtlı Satıcı
                  </p>
                  <p className="mt-2 text-2xl font-black text-brand-brown tabular-nums">
                    {adminStats?.totalSellers ?? featuredSellerCount}
                  </p>
                  <p className="mt-1 text-xs text-primary font-semibold">
                    {adminStats?.activeSellers ?? featuredSellerCount} aktif mağaza
                  </p>
                </Card>
                <Card className="rounded-xl border-border p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Kayıtlı Alıcı
                  </p>
                  <p className="mt-2 text-2xl font-black text-brand-brown tabular-nums">
                    {adminStats?.totalBuyers ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Doğrulanmış tüketici hesabı</p>
                </Card>
                <Card className="rounded-xl border-border p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Vitrin Üreticisi
                  </p>
                  <p className="mt-2 text-2xl font-black text-amber-600 tabular-nums">
                    {featuredSellerCount}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Ana sayfada sergilenenler</p>
                </Card>
                <Card className="rounded-xl border-border p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Toplam Yorum
                  </p>
                  <p className="mt-2 text-2xl font-black text-primary tabular-nums">
                    {adminStats?.totalReviews ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Ürün geri bildirimleri</p>
                </Card>
              </div>
            </Panel>
          ) : null}

          {activeTab === "users" && authUser?.token ? (
            <AdminUsersModerationPanel
              token={authUser.token}
              showToast={showToast}
              onChanged={onModerationUpdated}
            />
          ) : null}

          {activeTab === "products" && authUser?.token ? (
            <AdminProductsModerationPanel
              token={authUser.token}
              showToast={showToast}
              onChanged={onModerationUpdated}
            />
          ) : null}

          {activeTab === "comments" && authUser?.token ? (
            <AdminCommentsModerationPanel
              token={authUser.token}
              showToast={showToast}
              onChanged={onModerationUpdated}
            />
          ) : null}

          {(showOverview || activeTab === "demands") ? (
            <Panel title="Talep & Mesajlaşma Trafiği">
              <div className="grid gap-3 sm:grid-cols-3">
                <Card className="rounded-xl border-border p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Açık Talepler
                  </p>
                  <p className="mt-2 text-2xl font-black text-amber-600 tabular-nums">
                    {adminStats?.openDemands ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Teklif ve görüşme sürecinde</p>
                </Card>
                <Card className="rounded-xl border-border p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Anlaşılan Talepler
                  </p>
                  <p className="mt-2 text-2xl font-black text-primary tabular-nums">
                    {adminStats?.agreedDemands ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Başarıyla sonuçlananlar</p>
                </Card>
                <Card className="rounded-xl border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Platform Mesajları
                    </p>
                    <MessageCircle className="size-4 text-primary" aria-hidden />
                  </div>
                  <p className="mt-2 text-2xl font-black text-brand-brown tabular-nums">
                    {adminStats?.totalMessages ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {adminStats?.unreadMessages ?? 0} okunmamış ileti
                  </p>
                </Card>
              </div>
            </Panel>
          ) : null}

          {activeTab === "demand-gaps" && authUser?.token ? (
            <AdminDemandGapsPanel token={authUser.token} showToast={showToast} />
          ) : null}

          {(showOverview || activeTab === "categories") ? (
            <Panel
              title={
                editingCategoryId
                  ? `Kategori Düzenle (#${editingCategoryId})`
                  : "Kategori Yönetimi (Sadece Admin)"
              }
              badge={categories.length || undefined}
            >
            <form
              onSubmit={handleSubmit}
              className="mb-6 grid gap-3 rounded-2xl border border-emerald-200/80 bg-[#f6fbf6] p-4 md:grid-cols-[1fr_1.3fr_auto]"
            >
              <Field label="Kategori Adı *" htmlFor="admin-cat-name">
                <Input
                  id="admin-cat-name"
                  required
                  minLength={2}
                  value={name}
                  onChange={(event) => setName(limitText(event.target.value, 60))}
                  placeholder="Ör: Yöresel Peynirler"
                  className="bg-white"
                />
              </Field>
              <Field label="Kısa Açıklama" htmlFor="admin-cat-desc">
                <Input
                  id="admin-cat-desc"
                  value={description}
                  onChange={(event) => setDescription(limitText(event.target.value, 180))}
                  placeholder="Köy üretimi süt ve peynir çeşitleri"
                  className="bg-white"
                />
              </Field>
              <div className="flex items-end gap-2">
                {editingCategoryId ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingCategoryId(null);
                      setName("");
                      setDescription("");
                    }}
                  >
                    Vazgeç
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  disabled={actionStatus === "category-save"}
                  className="w-full md:w-auto"
                >
                  <Plus className="size-4" aria-hidden />
                  {editingCategoryId ? "Güncelle" : "Kategori Ekle"}
                </Button>
              </div>
            </form>

            {categories.length === 0 ? (
              <EmptyState
                icon={FolderKanban}
                title="Henüz kategori bulunmuyor"
                description="Yukarıdaki form ile pazaryeri kategorisi oluşturabilirsin."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((cat) => (
                  <Card
                    key={cat.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border-border p-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-black text-brand-brown">{cat.adi}</h3>
                        <Badge variant="outline" className="text-[10px]">
                          #{cat.id}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {cat.aciklama || "Açıklama girilmedi."}
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 border-t border-border/60 pt-2.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs font-bold"
                        onClick={() => {
                          setEditingCategoryId(cat.id);
                          setName(cat.adi);
                          setDescription(cat.aciklama ?? "");
                        }}
                      >
                        <Pencil className="size-3.5" aria-hidden />
                        Düzenle
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs font-bold text-red-600 hover:bg-red-50"
                        disabled={actionStatus === `category-delete-${cat.id}`}
                        onClick={() => onDeleteCategory(cat)}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        Sil
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            </Panel>
          ) : null}
        </div>
      </DashboardFrame>

      <MobileBottomNav
        activeScreen="admin"
        authUser={authUser}
        onNavigate={onNavigate}
      />
    </>
  );
}

function AdminUsersModerationPanel({
  token,
  showToast,
  onChanged,
}: {
  token: string;
  showToast?: (message: string, kind: ToastKind, traceId?: string | null) => void;
  onChanged?: () => void;
}) {
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [note, setNote] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [data, setData] = useState<Paginated<AdminUserDto>>({
    items: [],
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
  });

  const load = useCallback(async () => {
    try {
      const res = await yoremioApi.adminUsers(token, {
        q: search.trim() || undefined,
        rol: roleFilter || undefined,
        sadeceBekleyenSaticilar: pendingOnly || undefined,
        page,
        pageSize: 10,
      });
      setData(res);
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast?.(info.message, "error", info.traceId);
    }
  }, [page, pendingOnly, roleFilter, search, showToast, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [load]);

  const setVerification = async (
    user: AdminUserDto,
    dogrulandiMi: boolean | null,
    subFlags?: { isletmeDogrulandiMi?: boolean; ureticiDogrulandiMi?: boolean },
  ) => {
    setBusyKey(`verify-${user.id}`);
    try {
      const updated = await yoremioApi.adminSetSellerVerification(token, user.id, {
        dogrulandiMi,
        isletmeDogrulandiMi: subFlags?.isletmeDogrulandiMi,
        ureticiDogrulandiMi: subFlags?.ureticiDogrulandiMi,
        not: note.trim() || undefined,
      });
      setData((prev) => ({
        ...prev,
        items: prev.items.map((item) => (item.id === user.id ? updated : item)),
      }));
      showToast?.(
        subFlags
          ? `${user.magazaAdi || user.email} alt doğrulama statüsü güncellendi.`
          : dogrulandiMi === true
            ? `${user.magazaAdi || user.email} satıcısı doğrulandı.`
            : dogrulandiMi === false
              ? `${user.magazaAdi || user.email} doğrulaması reddedildi.`
              : `${user.magazaAdi || user.email} otomatik doğrulama kuralına döndürüldü.`,
        "success",
      );
      onChanged?.();
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast?.(info.message, "error", info.traceId);
    } finally {
      setBusyKey(null);
    }
  };

  const toggleStatus = async (user: AdminUserDto) => {
    const nextActive = !(user.saticiAktifMi ?? true);
    setBusyKey(`status-${user.id}`);
    try {
      const updated = await yoremioApi.adminSetSellerStatus(token, user.id, {
        aktifMi: nextActive,
        sebep: note.trim() || undefined,
      });
      setData((prev) => ({
        ...prev,
        items: prev.items.map((item) => (item.id === user.id ? updated : item)),
      }));
      showToast?.(
        nextActive
          ? "Satıcı hesabı aktif hale getirildi ve bildirim iletildi."
          : "Satıcı hesabı pasife alındı ve bildirim iletildi.",
        "success",
      );
      onChanged?.();
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast?.(info.message, "error", info.traceId);
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <Panel title="Kullanıcı Listesi & Satıcı Doğrulama Yönetimi" badge={data.totalCount || undefined}>
      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "", label: "Tümü" },
              { id: "SATICI", label: "Satıcılar" },
              { id: "ALICI", label: "Alıcılar" },
              { id: "ADMIN", label: "Admin" },
            ] as const
          ).map((chip) => (
            <button
              key={chip.id || "all"}
              type="button"
              onClick={() => {
                setRoleFilter(chip.id);
                setPage(1);
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-extrabold transition",
                roleFilter === chip.id
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-white text-muted-foreground hover:border-primary/40",
              )}
            >
              {chip.label}
            </button>
          ))}

          <label className="ml-1 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">
            <input
              type="checkbox"
              checked={pendingOnly}
              onChange={(event) => {
                setPendingOnly(event.target.checked);
                setPage(1);
              }}
              className="accent-primary"
            />
            Bekleyen Satıcılar
          </label>
        </div>

        <div className="relative w-full lg:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="E-posta, kullanıcı adı veya mağaza..."
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      <div className="mb-4">
        <Input
          value={note}
          onChange={(event) => setNote(limitText(event.target.value, 500))}
          placeholder="Opsiyonel moderasyon notu / sebebi (karar öncesi yazılabilir, satıcıya bildirimde gider)..."
          className="h-9 text-xs"
        />
      </div>

      {data.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Eşleşen kullanıcı bulunamadı"
          description="Arama veya rol filtresini değiştirerek tekrar deneyebilirsin."
        />
      ) : (
        <div className="space-y-2.5">
          {data.items.map((user) => {
            const isSeller = user.roles.includes("SATICI");
            const sellerActive = user.saticiAktifMi ?? true;
            return (
              <div
                key={user.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-[#fcfdfb] p-3.5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-brand-brown">
                      {user.magazaAdi || user.userName || user.email || user.id}
                    </span>
                    {user.roles.map((r) => (
                      <Badge key={r} variant={r === "ADMIN" ? "gold" : r === "SATICI" ? "green" : "outline"}>
                        {r}
                      </Badge>
                    ))}
                    {isSeller ? (
                      <>
                        <Badge variant={user.dogrulanmisSatici ? "green" : "outline"}>
                          {user.dogrulanmisSatici ? "Doğrulanmış" : "Doğrulama Yok"}
                        </Badge>
                        {user.adminDogrulamaDurumu !== null && user.adminDogrulamaDurumu !== undefined ? (
                          <Badge variant={user.adminDogrulamaDurumu ? "secondary" : "plum"}>
                            {user.adminDogrulamaDurumu ? "Manuel Onaylı" : "Manuel Red"}
                          </Badge>
                        ) : null}
                        {!sellerActive ? <Badge variant="plum">Pasif</Badge> : null}
                      </>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {user.email}
                    {user.userName && user.userName !== user.email ? ` · @${user.userName}` : ""}
                    {user.sehir ? ` · ${[user.sehir, user.ilce].filter(Boolean).join("/")}` : ""}
                    {isSeller ? ` · ${user.urunSayisi} ürün` : ""}
                  </p>
                  {isSeller ? (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      <Badge variant={user.emailConfirmed ? "green" : "outline"} className="text-[10px]">
                        E-posta: {user.emailConfirmed ? "OK" : "Eksik"}
                      </Badge>
                      <button
                        type="button"
                        disabled={busyKey === `verify-${user.id}`}
                        onClick={() =>
                          void setVerification(user, user.adminDogrulamaDurumu ?? null, {
                            isletmeDogrulandiMi: !(user.isletmeDogrulandi ?? false),
                          })
                        }
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-bold transition",
                          user.isletmeDogrulandi
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "border-border bg-white text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        İşletme: {user.isletmeDogrulandi ? "Onaylı ✓" : "Onayla"}
                      </button>
                      <button
                        type="button"
                        disabled={busyKey === `verify-${user.id}`}
                        onClick={() =>
                          void setVerification(user, user.adminDogrulamaDurumu ?? null, {
                            ureticiDogrulandiMi: !(user.ureticiDogrulandi ?? false),
                          })
                        }
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-bold transition",
                          user.ureticiDogrulandi
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "border-border bg-white text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        Üretici: {user.ureticiDogrulandi ? "Onaylı ✓" : "Onayla"}
                      </button>
                    </div>
                  ) : null}
                </div>

                {isSeller ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant={user.adminDogrulamaDurumu === true ? "default" : "outline"}
                      className="h-8 text-xs font-bold"
                      disabled={busyKey === `verify-${user.id}`}
                      onClick={() => void setVerification(user, true)}
                    >
                      <ShieldCheck className="size-3.5" aria-hidden />
                      Doğrula
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className={cn(
                        "h-8 text-xs font-bold",
                        user.adminDogrulamaDurumu === false
                          ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                          : "hover:border-red-200 hover:text-red-700",
                      )}
                      disabled={busyKey === `verify-${user.id}`}
                      onClick={() => void setVerification(user, false)}
                    >
                      <ShieldX className="size-3.5" aria-hidden />
                      Reddet
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs font-bold"
                      disabled={busyKey === `verify-${user.id}`}
                      onClick={() => void setVerification(user, null)}
                    >
                      Otomatik
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={sellerActive ? "outline" : "secondary"}
                      className="h-8 text-xs font-bold"
                      disabled={busyKey === `status-${user.id}`}
                      onClick={() => void toggleStatus(user)}
                    >
                      {busyKey === `status-${user.id}` ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      ) : null}
                      {sellerActive ? "Pasife Al" : "Aktif Et"}
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })}

          <PaginationBar page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}
    </Panel>
  );
}

function AdminDemandGapsPanel({
  token,
  showToast,
}: {
  token: string;
  showToast?: (message: string, kind: ToastKind, traceId?: string | null) => void;
}) {
  const [gaps, setGaps] = useState<DemandGapDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    yoremioApi
      .adminDemandGaps(token)
      .then((res) => {
        if (active) setGaps(res);
      })
      .catch((err) => {
        const info = apiErrorInfo(err);
        showToast?.(info.message, "error", info.traceId);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [showToast, token]);

  return (
    <Panel title="Arz Boşlukları Analitiği (Şehir & Kategori Bazlı Açık Talepler)" badge={gaps.length || undefined}>
      {loading ? (
        <div className="flex items-center justify-center py-8 text-xs font-bold text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Arz boşlukları analiz ediliyor...
        </div>
      ) : gaps.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Arz boşluğu tespit edilmedi"
          description="Alıcıların açık pazar talepleri arttıkça burada öncelikli ürün-şehir boşlukları listelenecek."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {gaps.map((gap, idx) => (
            <Card key={idx} className="rounded-xl border-amber-200/80 bg-amber-50/30 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="gold">{gap.acikTalepSayisi} açık talep</Badge>
                {gap.teslimatSehir ? (
                  <span className="text-xs font-bold text-muted-foreground">{gap.teslimatSehir}</span>
                ) : null}
              </div>
              <p className="mt-2 text-sm font-black text-brand-brown">
                {gap.arananUrunAdi || gap.kategoriAdi || "Belirtilmemiş Ürün"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Kategori: {gap.kategoriAdi || "Genel"} · Ort. satıcı:{" "}
                <strong>{gap.ortalamaEslesenSaticiSayisi.toFixed(1)}</strong>
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Toplam: {gap.talepSayisi} · Anlaşılan: {gap.anlasilanTalepSayisi}
                {gap.yeterliSaticiYokMu ? " · Yeterli satıcı yok" : ""}
              </p>
            </Card>
          ))}
        </div>
      )}
    </Panel>
  );
}

function AdminProductsModerationPanel({
  token,
  showToast,
  onChanged,
}: {
  token: string;
  showToast?: (message: string, kind: ToastKind, traceId?: string | null) => void;
  onChanged?: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "passive">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [data, setData] = useState<Paginated<ProductDto>>({
    items: [],
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
  });

  const load = useCallback(async () => {
    try {
      const res = await yoremioApi.adminProducts(token, {
        q: search.trim() || undefined,
        aktifMi: statusFilter === "all" ? undefined : statusFilter === "active",
        page,
        pageSize: 10,
      });
      setData(res);
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast?.(info.message, "error", info.traceId);
    }
  }, [page, search, showToast, statusFilter, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [load]);

  const toggleProduct = async (product: ProductDto) => {
    const nextActive = !(product.aktifMi ?? true);
    setBusyId(product.id);
    try {
      const updated = await yoremioApi.adminSetProductStatus(token, product.id, {
        aktifMi: nextActive,
        sebep: reason.trim() || undefined,
      });
      setData((prev) => ({
        ...prev,
        items: prev.items.map((item) => (item.id === product.id ? updated : item)),
      }));
      showToast?.(
        nextActive ? `${product.adi} yayına alındı.` : `${product.adi} pasife alındı ve satıcı bilgilendirildi.`,
        "success",
      );
      onChanged?.();
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast?.(info.message, "error", info.traceId);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Panel title="Ürün Moderasyonu" badge={data.totalCount || undefined}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: "all", label: "Tümü" },
              { id: "active", label: "Yayında (Aktif)" },
              { id: "passive", label: "Pasif / Kaldırılmış" },
            ] as const
          ).map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => {
                setStatusFilter(chip.id);
                setPage(1);
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-extrabold transition",
                statusFilter === chip.id
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-white text-muted-foreground hover:border-primary/40",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Ürün adı veya açıklama ara..."
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      <div className="mb-4">
        <Input
          value={reason}
          onChange={(event) => setReason(limitText(event.target.value, 500))}
          placeholder="Opsiyonel moderasyon sebebi (satıcı bildirimine eklenir)..."
          className="h-9 text-xs"
        />
      </div>

      {data.items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Listelenecek ürün bulunamadı"
          description="Arama veya durum filtresini değiştirebilirsin."
        />
      ) : (
        <div className="space-y-2.5">
          {data.items.map((product) => {
            const active = product.aktifMi ?? true;
            return (
              <div
                key={product.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-[#fcfdfb] p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                    <Image
                      src={productImage(product)}
                      alt={product.adi}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-black text-brand-brown">{product.adi}</p>
                      <Badge variant={active ? "green" : "plum"}>
                        {active ? "Aktif" : "Pasif"}
                      </Badge>
                      {product.kategoriAdi ? (
                        <Badge variant="outline" className="text-[10px]">
                          {product.kategoriAdi}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {sellerName(product)} · {productLocation(product)} ·{" "}
                      <span className="font-bold text-primary">{formatPrice(product.fiyat)}</span> ·{" "}
                      Stok: {product.stokMiktari}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant={active ? "outline" : "default"}
                  className="h-8 shrink-0 text-xs font-extrabold"
                  disabled={busyId === product.id}
                  onClick={() => void toggleProduct(product)}
                >
                  {busyId === product.id ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
                  {active ? "Pasife Al" : "Yayına Al"}
                </Button>
              </div>
            );
          })}

          <PaginationBar page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}
    </Panel>
  );
}

function AdminCommentsModerationPanel({
  token,
  showToast,
  onChanged,
}: {
  token: string;
  showToast?: (message: string, kind: ToastKind, traceId?: string | null) => void;
  onChanged?: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [data, setData] = useState<Paginated<AdminCommentDto>>({
    items: [],
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
  });

  const load = useCallback(async () => {
    try {
      const res = await yoremioApi.adminComments(token, {
        q: search.trim() || undefined,
        aktifMi: statusFilter === "all" ? undefined : statusFilter === "active",
        page,
        pageSize: 10,
      });
      setData(res);
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast?.(info.message, "error", info.traceId);
    }
  }, [page, search, showToast, statusFilter, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [load]);

  const toggleComment = async (comment: AdminCommentDto) => {
    const nextActive = !comment.aktifMi;
    setBusyId(comment.id);
    try {
      const updated = await yoremioApi.adminSetCommentStatus(token, comment.id, {
        aktifMi: nextActive,
        sebep: reason.trim() || undefined,
      });
      setData((prev) => ({
        ...prev,
        items: prev.items.map((item) => (item.id === comment.id ? updated : item)),
      }));
      showToast?.(
        nextActive ? "Yorum yeniden yayınlandı." : "Yorum gizlendi ve sahibine bildirim gönderildi.",
        "success",
      );
      onChanged?.();
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast?.(info.message, "error", info.traceId);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Panel title="Yorum Moderasyonu" badge={data.totalCount || undefined}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: "all", label: "Tümü" },
              { id: "active", label: "Görünür Yorumlar" },
              { id: "hidden", label: "Gizlenenler" },
            ] as const
          ).map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => {
                setStatusFilter(chip.id);
                setPage(1);
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-extrabold transition",
                statusFilter === chip.id
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-white text-muted-foreground hover:border-primary/40",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Yorum metni veya kullanıcı ara..."
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      <div className="mb-4">
        <Input
          value={reason}
          onChange={(event) => setReason(limitText(event.target.value, 500))}
          placeholder="Opsiyonel gizleme / moderasyon sebebi..."
          className="h-9 text-xs"
        />
      </div>

      {data.items.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Listelenecek yorum bulunamadı"
          description="Arama veya durum filtresini değiştirebilirsin."
        />
      ) : (
        <div className="space-y-2.5">
          {data.items.map((comment) => (
            <div
              key={comment.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-[#fcfdfb] p-3.5 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-black text-brand-brown">
                    {comment.kullaniciAdi || comment.kullaniciEmail || `Kullanıcı #${comment.kullaniciId.slice(0, 8)}`}
                  </span>
                  <span className="text-muted-foreground">· {shortDate(comment.tarih)}</span>
                  <Badge variant={comment.aktifMi ? "green" : "plum"}>
                    {comment.aktifMi ? "Yayında" : "Gizli"}
                  </Badge>
                  {comment.urunAdi ? (
                    <Badge variant="outline" className="text-[10px]">
                      {comment.urunAdi}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-foreground">{comment.icerik}</p>
              </div>

              <Button
                type="button"
                size="sm"
                variant={comment.aktifMi ? "outline" : "default"}
                className="h-8 shrink-0 text-xs font-extrabold"
                disabled={busyId === comment.id}
                onClick={() => void toggleComment(comment)}
              >
                {busyId === comment.id ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : comment.aktifMi ? (
                  <EyeOff className="size-3.5" aria-hidden />
                ) : (
                  <Eye className="size-3.5" aria-hidden />
                )}
                {comment.aktifMi ? "Gizle" : "Yayınla"}
              </Button>
            </div>
          ))}

          <PaginationBar page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}
    </Panel>
  );
}

export function ReviewsScreen({
  authUser,
  sellerProfile,
  notificationUnreadCount,
  unreadMessageCount,
  product,
  comments,
  ratings,
  eligibility,
  averageScore,
  actionStatus,
  ratingsEnabled = true,
  reviewsEnabled = true,
  onBack,
  onRate,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onOpenStorefront,
  onNavigate,
  onLogout,
}: {
  authUser: AuthState | null;
  sellerProfile?: SellerProfileDto | null;
  notificationUnreadCount: number;
  unreadMessageCount?: number;
  product: ProductDto | null;
  comments: CommentDto[];
  ratings: RatingDto[];
  eligibility: ReviewEligibilityDto | null;
  averageScore: number | null;
  actionStatus: string | null;
  ratingsEnabled?: boolean;
  reviewsEnabled?: boolean;
  onBack: () => void;
  onRate: (score: number) => void;
  onAddComment: (text: string) => Promise<boolean>;
  onUpdateComment: (yorumId: number, text: string) => Promise<boolean>;
  onDeleteComment: (yorumId: number) => void;
  onOpenStorefront: (saticiId: string) => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<ReviewTab>("comments");
  const [commentText, setCommentText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [hoverScore, setHoverScore] = useState(0);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f6f8f5]">
        <PublicHeader
          authUser={authUser}
          sellerProfile={sellerProfile}
          notificationUnreadCount={notificationUnreadCount}
          unreadMessageCount={unreadMessageCount}
          query=""
          setQuery={() => {}}
          activeScreen="reviews"
          onNavigate={onNavigate}
          onLogout={onLogout}
        />
        <main className="mx-auto max-w-[960px] px-4 py-10">
          <EmptyState
            icon={MessageSquare}
            title="Değerlendirme için ürün seçilmedi"
            description="Keşfet ekranından bir ürün seçerek alıcı yorumlarını ve puan dağılımını inceleyebilirsin."
            action={<Button onClick={onBack}>Keşfe Dön</Button>}
          />
        </main>
      </div>
    );
  }

  const displayAvg = averageScore ?? product.ortalamaPuan ?? 0;

  const submitNewComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!commentText.trim()) return;
    const ok = await onAddComment(commentText.trim());
    if (ok) setCommentText("");
  };

  return (
    <div className="min-h-screen bg-[#f6f8f5] pb-20 lg:pb-0">
      <PublicHeader
        authUser={authUser}
        sellerProfile={sellerProfile}
        notificationUnreadCount={notificationUnreadCount}
        unreadMessageCount={unreadMessageCount}
        query=""
        setQuery={() => {}}
        activeScreen="reviews"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="mx-auto max-w-[1120px] space-y-6 px-4 py-6 sm:px-6">
        <Button type="button" variant="outline" size="sm" onClick={onBack} className="bg-white">
          <ArrowLeft className="size-4" aria-hidden />
          Keşfe Dön
        </Button>

        {/* Product Summary Banner */}
        <Card className="grid gap-5 rounded-2xl p-4 sm:grid-cols-[180px_1fr_auto] sm:items-center sm:p-6">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
            <Image
              src={productImage(product)}
              alt={product.adi}
              fill
              sizes="180px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <Badge variant="green">{product.kategoriAdi}</Badge>
            <h1 className="mt-2 font-serif text-xl font-bold text-[#14271c] sm:text-2xl">
              {product.adi}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {product.saticiId ? (
                <button
                  type="button"
                  onClick={() => onOpenStorefront(product.saticiId!)}
                  className="font-bold text-primary hover:underline"
                >
                  {sellerName(product)}
                </button>
              ) : (
                <span>{sellerName(product)}</span>
              )}
              <span>·</span>
              <span>{productLocation(product)}</span>
              <span>·</span>
              <span className="font-black text-primary">{formatPrice(product.fiyat)}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-5 py-3 text-center">
            <p className="text-3xl font-black text-primary tabular-nums">
              {displayAvg.toFixed(1)}
            </p>
            <Stars value={displayAvg} className="mt-1 justify-center" />
            <p className="mt-1 text-xs font-bold text-muted-foreground">
              {ratings.length || product.toplamYorum || 0} değerlendirme
            </p>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "comments", label: `Yorumlar (${comments.length})` },
              { id: "ratings", label: `Puanlama (${ratings.length})` },
              { id: "description", label: "Ürün Açıklaması" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-extrabold transition sm:text-sm",
                tab === item.id
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-white text-muted-foreground hover:border-primary/40",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "description" ? (
          <Card className="rounded-2xl p-5 sm:p-6">
            <h2 className="text-base font-black text-brand-brown">Üretici Ürün Bilgisi</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
              {product.aciklama || "Bu ürün için ek açıklama girilmedi."}
            </p>
          </Card>
        ) : null}

        {tab === "ratings" ? (
          <Card className="space-y-5 rounded-2xl p-5 sm:p-6">
            {/* Star Distribution Breakdown */}
            <div className="grid gap-4 rounded-xl border border-border bg-[#f9fbf8] p-4 sm:grid-cols-[160px_1fr] sm:items-center">
              <div className="text-center">
                <p className="text-4xl font-black text-primary tabular-nums">
                  {displayAvg.toFixed(1)}
                </p>
                <Stars value={displayAvg} className="mt-1 justify-center" />
                <p className="mt-1 text-xs font-bold text-muted-foreground">
                  {ratings.length} değerlendirme
                </p>
              </div>
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratings.filter((r) => Math.round(r.puanDegeri) === star).length;
                  const pct = ratings.length > 0 ? Math.round((count / ratings.length) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs font-bold">
                      <span className="w-8 text-right tabular-nums">{star} ★</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-muted-foreground tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {ratingsEnabled ? (
              <div className="rounded-xl border border-emerald-200 bg-[#f6fbf6] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-black text-brand-brown">
                    Bu ürüne puan ver (1 - 5 yıldız)
                  </p>
                  {eligibility?.mevcutPuan ? (
                    <Badge variant="gold">
                      Mevcut Puanın: {eligibility.mevcutPuan} / 5 ★
                    </Badge>
                  ) : null}
                </div>
                {!authUser ? (
                  <p className="mt-1 text-xs font-semibold text-amber-800">
                    Puan vermek için alıcı hesabıyla giriş yapmalısın.
                  </p>
                ) : eligibility && eligibility.puanlayabilir === false ? (
                  <p className="mt-1 text-xs font-semibold text-amber-800">
                    {eligibility.sebep || "Bu ürünü yalnızca geçerli talebi/anlaşması olan alıcılar puanlayabilir."}
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {[1, 2, 3, 4, 5].map((score) => {
                      const activeScore = hoverScore || eligibility?.mevcutPuan || 0;
                      const isMine = eligibility?.mevcutPuan === score;
                      return (
                        <button
                          key={score}
                          type="button"
                          onMouseEnter={() => setHoverScore(score)}
                          onMouseLeave={() => setHoverScore(0)}
                          disabled={actionStatus === "rate"}
                          onClick={() => onRate(score)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-black transition",
                            activeScore >= score
                              ? "border-amber-400 bg-amber-100 text-amber-900"
                              : "border-border bg-white text-foreground hover:border-amber-300",
                            isMine && "ring-2 ring-amber-400/50",
                          )}
                        >
                          <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                          {score}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}

            <div className="space-y-2.5">
              {ratings.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz bireysel puan kaydı bulunmuyor.</p>
              ) : (
                ratings.map((rate) => (
                  <div
                    key={rate.id}
                    className="flex items-center justify-between rounded-xl border border-border px-4 py-2.5 text-xs"
                  >
                    <div>
                      <span className="font-black text-brand-brown">
                        {rate.kullaniciAdi || `Alıcı #${rate.kullaniciId.slice(0, 8)}`}
                      </span>
                      <span className="ml-2 text-muted-foreground">
                        {shortDate(rate.puanTarihi)}
                      </span>
                    </div>
                    <Stars value={rate.puanDegeri} />
                  </div>
                ))
              )}
            </div>
          </Card>
        ) : null}

        {tab === "comments" ? (
          <Card className="space-y-5 rounded-2xl p-5 sm:p-6">
            {reviewsEnabled ? (
              <form onSubmit={submitNewComment} className="space-y-3 rounded-xl border border-border bg-[#f9fbf8] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-black text-brand-brown">Yorum Yaz</span>
                  {eligibility ? (
                    <Badge variant={eligibility.yorumYapabilir ? "green" : "outline"}>
                      {eligibility.yorumYapabilir
                        ? "Doğrulanmış Alıcı Onaylı"
                        : eligibility.sebep || "Yalnızca yetkili alıcılar"}
                    </Badge>
                  ) : null}
                </div>
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(event) => setCommentText(limitText(event.target.value, 600))}
                  placeholder={
                    authUser
                      ? "Ürün kalitesi, ambalaj ve üretici iletişimi hakkındaki deneyimini yaz..."
                      : "Yorum yapabilmek için giriş yapmalısın."
                  }
                  disabled={eligibility?.yorumYapabilir === false}
                  className="w-full rounded-xl border border-input bg-white p-3 text-sm outline-none focus:border-primary disabled:opacity-60"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={
                      !commentText.trim() ||
                      actionStatus === "comment-add" ||
                      eligibility?.yorumYapabilir === false
                    }
                  >
                    Yorumu Paylaş
                  </Button>
                </div>
              </form>
            ) : null}

            {comments.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="Henüz yorum yapılmamış"
                description="Bu ürünle ilgili ilk değerlendirmeyi yapan alıcı olabilirsin."
              />
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => {
                  const isOwn = Boolean(
                    authUser?.userId && comment.kullaniciId === authUser.userId,
                  );
                  const isEditing = editingId === comment.id;

                  return (
                    <div
                      key={comment.id}
                      className="rounded-xl border border-border bg-white p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-sm font-black text-brand-brown">
                            {comment.kullaniciAdi ?? "Alıcı"}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {shortDate(comment.tarih)}
                          </span>
                        </div>

                        {isOwn ? (
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => {
                                setEditingId(comment.id);
                                setEditText(comment.icerik);
                              }}
                            >
                              <Pencil className="size-3.5" aria-hidden />
                              Düzenle
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-red-600 hover:bg-red-50"
                              onClick={() => onDeleteComment(comment.id)}
                            >
                              <Trash2 className="size-3.5" aria-hidden />
                              Sil
                            </Button>
                          </div>
                        ) : null}
                      </div>

                      {isEditing ? (
                        <div className="mt-3 space-y-2">
                          <textarea
                            rows={2}
                            value={editText}
                            onChange={(event) => setEditText(limitText(event.target.value, 600))}
                            className="w-full rounded-xl border border-input p-2.5 text-sm outline-none focus:border-primary"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                            >
                              İptal
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={!editText.trim() || actionStatus === `comment-edit-${comment.id}`}
                              onClick={async () => {
                                const ok = await onUpdateComment(comment.id, editText.trim());
                                if (ok) setEditingId(null);
                              }}
                            >
                              Kaydet
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm leading-6 text-foreground">{comment.icerik}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        ) : null}
      </main>

      <MobileBottomNav
        activeScreen="reviews"
        authUser={authUser}
        unreadMessages={unreadMessageCount}
        onNavigate={onNavigate}
      />
    </div>
  );
}

export function GlobalStatesScreen({
  authUser,
  sellerProfile,
  notifications,
  unreadCount,
  unreadMessageCount,
  lastErrorTraceId,
  actionStatus,
  onMarkRead,
  onMarkAllRead,
  onInspectNotification,
  onNavigate,
  onLogout,
  showToast,
}: {
  authUser: AuthState | null;
  sellerProfile?: SellerProfileDto | null;
  notifications: NotificationDto[];
  unreadCount: number;
  unreadMessageCount?: number;
  lastErrorTraceId?: string | null;
  actionStatus: string | null;
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
  onInspectNotification: (notification: NotificationDto) => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  showToast: (message: string, kind: ToastKind) => void;
}) {
  const [notifFilter, setNotifFilter] = useState<"ALL" | "UNREAD" | "DEMAND" | "CHAT">("ALL");

  const filteredNotifications = notifications.filter((item) => {
    if (notifFilter === "UNREAD") return !item.okunduMu;
    if (notifFilter === "DEMAND") return item.tur === "TALEP" || item.tur === "TEKLIF";
    if (notifFilter === "CHAT") return item.tur === "MESAJ";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f6f8f5] pb-20 lg:pb-0">
      <PublicHeader
        authUser={authUser}
        sellerProfile={sellerProfile}
        notificationUnreadCount={unreadCount}
        unreadMessageCount={unreadMessageCount}
        query=""
        setQuery={() => {}}
        activeScreen="states"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="mx-auto max-w-[1060px] space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <Panel
          title="Bildirimler"
          badge={unreadCount || undefined}
          action={unreadCount > 0 ? "Tümünü Okundu İşaretle" : undefined}
          onAction={onMarkAllRead}
        >
          {authUser && notifications.length > 0 ? (
            <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto pb-1">
              {(
                [
                  { id: "ALL", label: `Tümü (${notifications.length})` },
                  { id: "UNREAD", label: `Okunmamış (${unreadCount})` },
                  {
                    id: "DEMAND",
                    label: `Talep & Teklif (${notifications.filter((n) => n.tur === "TALEP" || n.tur === "TEKLIF").length})`,
                  },
                  {
                    id: "CHAT",
                    label: `Mesajlar (${notifications.filter((n) => n.tur === "MESAJ").length})`,
                  },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setNotifFilter(chip.id)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-xs font-extrabold transition",
                    notifFilter === chip.id
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-white text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          ) : null}

          {!authUser ? (
            <EmptyState
              icon={Bell}
              title="Bildirimleri görmek için giriş yap"
              description="Yeni teklif, talep güncellemeleri ve mesaj bildirimlerini oturum açtıktan sonra takip edebilirsin."
              action={<Button onClick={() => onNavigate("login")}>Giriş Yap</Button>}
            />
          ) : filteredNotifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="Bildirim bulunamadı"
              description={
                notifications.length === 0
                  ? "Şu an için yeni bir talep, teklif veya sohbet bildirimi bulunmuyor."
                  : "Seçili filtrede gösterilecek bildirim bulunmuyor."
              }
            />
          ) : (
            <div className="space-y-2.5">
              {filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex flex-col gap-3 rounded-xl border p-3.5 transition sm:flex-row sm:items-center sm:justify-between",
                    item.okunduMu
                      ? "border-border bg-white"
                      : "border-emerald-200 bg-emerald-50/50",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onInspectNotification(item)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-brand-brown">
                        {item.baslik}
                      </span>
                      {!item.okunduMu ? <Badge variant="green">Yeni</Badge> : null}
                      {item.tur ? (
                        <Badge variant="outline" className="text-[10px]">
                          {item.tur}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
                      {item.mesaj}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                      {shortDate(item.olusturmaTarihi)}
                    </p>
                  </button>

                  {!item.okunduMu ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="shrink-0 self-start rounded-xl bg-white text-xs sm:self-center"
                      disabled={actionStatus === `notif-${item.id}`}
                      onClick={() => onMarkRead(item.id)}
                    >
                      {actionStatus === `notif-${item.id}` ? (
                        <Check className="size-3.5" />
                      ) : (
                        <CheckCheck className="size-3.5 text-primary" />
                      )}
                      Okundu Say
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Panel>

        <SupportRequestPanel
          authUser={authUser}
          showToast={showToast}
          ekran="states"
          initialTraceId={lastErrorTraceId}
        />
      </main>

      <MobileBottomNav
        activeScreen="states"
        authUser={authUser}
        unreadMessages={unreadMessageCount}
        onNavigate={onNavigate}
      />
    </div>
  );
}

export function AccessRequiredScreen({
  title,
  text,
  onLogin,
  onHome,
}: {
  title: string;
  text: string;
  onLogin: () => void;
  onHome: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8f5] px-4 py-10">
      <Card className="w-full max-w-md rounded-2xl p-6 text-center shadow-lg">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-100 text-amber-700">
          <LockKeyhole className="size-7" aria-hidden />
        </span>
        <h1 className="mt-4 font-serif text-2xl font-bold text-[#14271c]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={onLogin}>Giriş Ekranına Git</Button>
          <Button variant="outline" onClick={onHome}>
            Ana Sayfa
          </Button>
        </div>
      </Card>
    </main>
  );
}
