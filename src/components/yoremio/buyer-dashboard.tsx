"use client";

import Image from "next/image";
import {
  CheckCircle2,
  ClipboardList,
  Compass,
  Heart,
  LayoutDashboard,
  MessageCircle,
  Sparkles,
  Tag,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChatPanel,
  DashboardFrame,
  EmptyState,
  MetricCard,
  MiniProductButton,
  MobileBottomNav,
  Panel,
  type DashboardNavItem,
} from "@/components/yoremio/ui-kit";
import {
  demandImage,
  productImage,
  productLocation,
  shortDate,
  type AuthState,
  type BuyerTab,
  type Screen,
} from "@/components/yoremio/types";
import type {
  ChatConversationDto,
  ChatMessageDto,
  DemandDto,
  ProductDto,
} from "@/lib/api";
import { formatPrice } from "@/lib/utils";

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
  conversations,
  messages,
  chatTargetId,
  actionStatus,
  signalrConnected,
  typingFromUserId,
  chatEnabled = true,
  favoritesEnabled = true,
  onSelectChatTarget,
  onSendMessage,
  onTyping,
  onAcceptOffer,
  onRejectOffer,
  onCancelDemand,
  onInspectDemand,
  onOpenProduct,
  onOpenStorefront,
  onToggleFavorite,
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
  conversations: ChatConversationDto[];
  messages: ChatMessageDto[];
  chatTargetId: string;
  actionStatus: string | null;
  signalrConnected: boolean;
  typingFromUserId: string | null;
  chatEnabled?: boolean;
  favoritesEnabled?: boolean;
  onSelectChatTarget: (userId: string) => void;
  onSendMessage: (receiverId: string, message: string) => void;
  onTyping: (receiverId: string) => void;
  onAcceptOffer: (offerId: number) => void;
  onRejectOffer: (offerId: number) => void;
  onCancelDemand: (talepId: number) => void;
  onInspectDemand: (demandId: number) => void;
  onOpenProduct: (product: ProductDto) => void;
  onOpenStorefront: (saticiId: string) => void;
  onToggleFavorite: (productId: number) => void;
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
                            alt={demand.urunAdi}
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
                            {demand.urunAdi}
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
              {demands.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="Henüz talebin yok"
                  description="Keşfet sayfasından bir ürün seçerek miktar ve not ekleyip ilk talebini oluşturabilirsin."
                  action={
                    <Button size="sm" onClick={() => onNavigate("discover")}>
                      Ürünleri İncele
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {demands.map((demand) => {
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
                              alt={demand.urunAdi}
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
                                {demand.urunAdi}
                              </button>
                              <Badge variant={st.variant}>{st.label}</Badge>
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Miktar: <strong>{demand.miktar}</strong> · Liste:{" "}
                              {demand.urunFiyat ? formatPrice(demand.urunFiyat) : "—"} ·{" "}
                              {shortDate(demand.olusturmaTarihi)}
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
                                onSelectChatTarget(demand.saticiId);
                                onTabChange("chat");
                              }}
                            >
                              <MessageCircle className="size-3.5 text-primary" aria-hidden />
                              Mesaj
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
              action="Keşifte Gör"
              onAction={() => onNavigate("discover")}
            >
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

          {/* Live SignalR Chat */}
          {(showOverview || activeTab === "chat") && chatEnabled ? (
            <Panel title="Üreticilerle Canlı Sohbet" badge={unreadMessageCount || undefined}>
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
        activeScreen="buyer"
        authUser={authUser}
        unreadMessages={unreadMessageCount}
        onNavigate={onNavigate}
      />
    </>
  );
}
