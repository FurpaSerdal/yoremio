"use client";

import Image from "next/image";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Bell,
  Check,
  CheckCheck,
  ClipboardList,
  Compass,
  Copy,
  Eye,
  EyeOff,
  Heart,
  Home,
  LayoutDashboard,
  Leaf,
  Loader2,
  LockKeyhole,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  UserRound,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/yoremio/brand-logo";
import {
  yoremioApi,
  type BootstrapLocationDto,
  type CategoryDto,
  type ChatConversationDto,
  type ChatMessageDto,
  type DemandDto,
  type OfferSubmitValues,
  type OpenMarketDemandValues,
  type ProductDto,
  type PublicSellerSummaryDto,
  type SellerProfileDto,
} from "@/lib/api";
import { cn, formatPrice, limitText, phoneInput } from "@/lib/utils";
import {
  accountName,
  apiErrorInfo,
  buyerScreenFor,
  dashboardScreenFor,
  demandImage,
  demandTitle,
  hasRole,
  mediaImageSrc,
  productImage,
  productLocation,
  rolesOf,
  sellerName,
  shortDate,
  type AuthState,
  type Screen,
  type ToastKind,
  type ToastState,
} from "@/components/yoremio/types";

export function PublicHeader({
  authUser,
  sellerProfile,
  notificationUnreadCount,
  unreadMessageCount = 0,
  query,
  setQuery,
  activeScreen = "home",
  onNavigate,
  onLogout,
  onOpenStorefront: _onOpenStorefront,
}: {
  authUser: AuthState | null;
  sellerProfile?: SellerProfileDto | null;
  notificationUnreadCount: number;
  unreadMessageCount?: number;
  query: string;
  setQuery: (value: string) => void;
  activeScreen?: Screen;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  onOpenStorefront?: (saticiId: string) => void;
}) {
  void _onOpenStorefront;
  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onNavigate("discover");
  };
  const accountLabel = authUser ? accountName(authUser, sellerProfile) : "Hesap";

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-white/94 backdrop-blur-md">
      <div className="mx-auto grid min-h-16 max-w-[1560px] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 sm:min-h-[76px] sm:gap-4 sm:px-6 lg:grid-cols-[auto_1fr_auto] lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="min-w-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          >
            <BrandLogo className="max-w-[155px] sm:max-w-none sm:min-w-[170px]" />
          </button>
        </div>

        <div className="hidden min-w-0 items-center gap-6 lg:flex">
          <nav className="flex shrink-0 items-center gap-6 text-sm font-extrabold">
            <button
              className={cn(
                "transition-colors hover:text-primary",
                activeScreen === "discover" ? "text-primary" : "text-foreground",
              )}
              type="button"
              onClick={() => onNavigate("discover")}
            >
              Ürünler
            </button>
            <button
              className="text-foreground transition-colors hover:text-primary"
              type="button"
              onClick={() => onNavigate("discover")}
            >
              Kategoriler
            </button>
            <button
              className="text-foreground transition-colors hover:text-primary"
              type="button"
              onClick={() => {
                if (activeScreen === "home") {
                  document
                    .getElementById("featured-sellers-section")
                    ?.scrollIntoView({ behavior: "smooth" });
                } else {
                  onNavigate("home");
                }
              }}
            >
              Satıcılar
            </button>
          </nav>
          <form className="mx-auto w-full max-w-xl" onSubmit={handleSearch}>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ürün, kategori, şehir veya üretici ara..."
                className="h-11 rounded-full border-border/90 bg-[#f8faf7] pl-11 pr-20 text-sm shadow-inner focus-visible:bg-white"
              />
              {query.trim() ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-12 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Aramayı temizle"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 grid h-8 -translate-y-1/2 place-items-center rounded-full bg-primary px-3 text-xs font-bold text-white transition-[transform,background-color] duration-150 hover:bg-[#00592d] active:scale-95"
              >
                Ara
              </button>
            </label>
          </form>
        </div>

        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
          {authUser ? (
            <Button
              variant="secondary"
              size="sm"
              className="hidden xl:inline-flex"
              onClick={() => onNavigate(dashboardScreenFor(authUser))}
            >
              <LayoutDashboard className="size-4" aria-hidden />
              {hasRole(authUser, "ADMIN")
                ? "Admin Paneli"
                : hasRole(authUser, "SATICI")
                  ? "Satıcı Paneli"
                  : "Alıcı Paneli"}
            </Button>
          ) : null}
          <IconButton
            label={accountLabel}
            icon={UserRound}
            onClick={() => onNavigate(dashboardScreenFor(authUser))}
            className="hidden sm:grid"
          />
          <IconButton
            className="hidden min-[400px]:grid"
            label="Favoriler"
            icon={Heart}
            onClick={() => onNavigate(buyerScreenFor(authUser))}
          />
          {authUser ? (
            <IconButton
              className="hidden sm:grid"
              label="Mesajlar"
              icon={MessageCircle}
              badge={unreadMessageCount}
              onClick={() => onNavigate(hasRole(authUser, "SATICI") ? "seller" : "buyer")}
            />
          ) : null}
          <IconButton
            label="Bildirimler"
            icon={Bell}
            badge={notificationUnreadCount}
            onClick={() => onNavigate(authUser ? "states" : "login")}
          />
          {authUser ? (
            <Button
              variant="ghost"
              size="icon"
              title="Çıkış yap"
              aria-label="Çıkış yap"
              className="hidden sm:inline-flex"
              onClick={onLogout}
            >
              <LogOut aria-hidden />
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="rounded-full px-4"
              onClick={() => onNavigate("login")}
            >
              Giriş yap
            </Button>
          )}
        </div>
      </div>

      <form className="border-t border-border/70 px-3 py-2.5 sm:px-6 lg:hidden" onSubmit={handleSearch}>
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ürün, kategori veya satıcı ara..."
            className="h-10 rounded-full bg-[#f8faf7] pl-10 pr-16 text-sm"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 h-7 -translate-y-1/2 rounded-full bg-primary px-3 text-xs font-bold text-white transition-[transform,background-color] duration-150 hover:bg-[#00592d] active:scale-95"
          >
            Ara
          </button>
        </label>
      </form>
    </header>
  );
}

export function MobileBottomNav({
  activeScreen,
  authUser,
  unreadMessages = 0,
  onNavigate,
}: {
  activeScreen: Screen;
  authUser: AuthState | null;
  unreadMessages?: number;
  onNavigate: (screen: Screen) => void;
}) {
  const panelScreen = dashboardScreenFor(authUser);
  const items: {
    key: string;
    label: string;
    icon: LucideIcon;
    active: boolean;
    badge?: number;
    onClick: () => void;
  }[] = [
    {
      key: "home",
      label: "Ana Sayfa",
      icon: Home,
      active: activeScreen === "home",
      onClick: () => onNavigate("home"),
    },
    {
      key: "discover",
      label: "Keşfet",
      icon: Compass,
      active: activeScreen === "discover" || activeScreen === "reviews",
      onClick: () => onNavigate("discover"),
    },
    {
      key: "panel",
      label: authUser ? (hasRole(authUser, "SATICI") ? "Mağaza" : "Talepler") : "Favoriler",
      icon: authUser && hasRole(authUser, "SATICI") ? Store : ClipboardList,
      active:
        activeScreen === "buyer" ||
        activeScreen === "seller" ||
        activeScreen === "seller-product" ||
        activeScreen === "seller-profile" ||
        activeScreen === "admin",
      onClick: () => onNavigate(panelScreen),
    },
    {
      key: "messages",
      label: "Mesajlar",
      icon: MessageCircle,
      active: false,
      badge: unreadMessages,
      onClick: () =>
        onNavigate(
          !authUser ? "login" : hasRole(authUser, "SATICI") ? "seller" : "buyer",
        ),
    },
    {
      key: "account",
      label: authUser ? "Bildirim" : "Giriş",
      icon: authUser ? Bell : UserRound,
      active: activeScreen === "states" || activeScreen === "login",
      onClick: () => onNavigate(authUser ? "states" : "login"),
    },
  ];

  return (
    <nav
      aria-label="Mobil alt menü"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/96 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_28px_rgba(16,24,40,0.08)] backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-bold transition-[transform,color] duration-150 active:scale-95",
                item.active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="relative">
                <Icon className={cn("size-5", item.active && "stroke-[2.4]")} aria-hidden />
                {item.badge ? (
                  <span className="absolute -right-2 -top-1 grid min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                ) : null}
              </span>
              <span className="truncate">{item.label}</span>
              {item.active ? (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function PromiseBar() {
  const items = [
    { icon: Leaf, title: "Yerel üreticiden", text: "Ürün kaynağı ve üretici profili şeffaf." },
    { icon: ShieldCheck, title: "Doğrulanmış satıcı", text: "Güven skoru ve gerçek alıcı yorumları." },
    { icon: MessageCircle, title: "Talep & teklif", text: "Canlı sohbet ile doğrudan anlaşma." },
    { icon: Heart, title: "Bölgesel destek", text: "Aracısız, taze ve yerel üretime katkı." },
  ];

  return (
    <div className="mt-8 grid gap-4 rounded-2xl border border-border/80 bg-white px-5 py-5 shadow-[0_8px_24px_rgba(16,24,40,0.05)] sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.title} className="flex items-center gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-emerald-100 bg-emerald-50 text-primary">
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black text-brand-brown">{item.title}</span>
              <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{item.text}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function SiteFooter({
  onNavigate,
  authUser,
}: {
  onNavigate: (screen: Screen) => void;
  authUser: AuthState | null;
}) {
  return (
    <footer className="mt-12 border-t border-border bg-white pb-20 lg:pb-10">
      <div className="mx-auto grid max-w-[1520px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="space-y-3 md:col-span-2">
          <BrandLogo />
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Yöremio, yerel üretici ve satıcıları alıcılarla doğrudan buluşturan güven odaklı
            talep-teklif pazaryeridir. Ödeme ve kargo adımı olmadan şeffaf anlaşma ve canlı iletişim sunar.
          </p>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
            Keşfet
          </p>
          <ul className="mt-3 space-y-2 text-sm font-semibold">
            <li>
              <button type="button" onClick={() => onNavigate("home")} className="hover:text-primary">
                Ana sayfa
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate("discover")} className="hover:text-primary">
                Ürün keşfi ve filtreleme
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate("seller-register")} className="hover:text-primary">
                Üretici olarak katıl
              </button>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
            Hesap & Destek
          </p>
          <ul className="mt-3 space-y-2 text-sm font-semibold">
            <li>
              <button
                type="button"
                onClick={() => onNavigate(authUser ? dashboardScreenFor(authUser) : "login")}
                className="hover:text-primary"
              >
                {authUser ? "Panelime git" : "Giriş yap"}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate("verify")} className="hover:text-primary">
                Email doğrulama
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate("states")} className="hover:text-primary">
                Bildirimler ve yardım talebi
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/70 px-4 py-4 text-center text-xs font-medium text-muted-foreground">
        © {new Date().getFullYear()} Yöremio Yerel Üretici Pazaryeri · Talep, Teklif & Canlı İletişim Platformu
      </div>
    </footer>
  );
}

export type DashboardNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  active?: boolean;
  onClick: () => void;
};

export function DashboardFrame({
  variant,
  title,
  subtitle,
  authUser,
  sellerProfile,
  notificationUnreadCount,
  onNavigate,
  onLogout,
  navItems,
  children,
}: {
  variant: "dark" | "light";
  title: string;
  subtitle: string;
  authUser: AuthState | null;
  sellerProfile?: SellerProfileDto | null;
  notificationUnreadCount: number;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  navItems: DashboardNavItem[];
  children: ReactNode;
}) {
  const dark = variant === "dark";

  return (
    <main className="min-h-screen bg-[#f6f8f5] pb-20 lg:pb-0">
      <div className={cn("grid min-h-screen", dark ? "lg:grid-cols-[264px_1fr]" : "lg:grid-cols-[280px_1fr]")}>
        <aside
          className={cn(
            "thin-scrollbar overscroll-contain flex min-h-0 flex-col border-b border-border px-3 py-3 sm:px-4 sm:py-4 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r lg:py-5",
            dark
              ? "bg-[linear-gradient(170deg,#006b35,#00382b)] text-white"
              : "bg-white text-foreground",
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-2 lg:mb-7">
            <button type="button" onClick={() => onNavigate("home")} className="min-w-0 text-left">
              <BrandLogo inverse={dark} compact className="max-w-[140px] sm:max-w-none" />
            </button>
            <Button
              type="button"
              variant={dark ? "ghost" : "outline"}
              size="sm"
              className={cn("lg:hidden", dark && "text-white hover:bg-white/10")}
              onClick={() => onNavigate("discover")}
            >
              <Compass className="size-4" aria-hidden />
              Pazar
            </Button>
          </div>

          <nav className="scroll-shelf flex gap-1.5 overflow-x-auto pb-1 lg:block lg:space-y-1.5 lg:overflow-visible lg:pb-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  onClick={item.onClick}
                  className={cn(
                    "flex h-10 shrink-0 snap-start items-center justify-center gap-2 rounded-xl px-3 text-left text-xs font-bold transition-[transform,background-color,color,box-shadow] duration-150 active:scale-[0.97] sm:h-11 sm:text-sm lg:w-full lg:justify-start lg:gap-3",
                    item.active
                      ? dark
                        ? "bg-white/18 text-white shadow-sm"
                        : "bg-primary text-primary-foreground shadow-sm"
                      : dark
                        ? "text-white/84 hover:bg-white/10 hover:text-white"
                        : "text-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="size-4 shrink-0 sm:size-5" aria-hidden />
                  <span className="truncate">{item.label}</span>
                  {item.badge ? (
                    <span
                      className={cn(
                        "ml-auto grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 text-[11px] font-black",
                        item.active
                          ? "bg-white text-primary"
                          : "bg-red-600 text-white",
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="mt-2 hidden gap-2 border-t border-current/15 pt-4 lg:mt-auto lg:block lg:space-y-1.5">
            <button
              type="button"
              onClick={() => onNavigate("discover")}
              className={cn(
                "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition",
                dark ? "text-white/82 hover:bg-white/10" : "hover:bg-muted",
              )}
            >
              <Compass className="size-4" aria-hidden />
              Ürün keşfine dön
            </button>
            <button
              type="button"
              onClick={() => onNavigate("states")}
              className={cn(
                "flex h-10 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm font-bold transition",
                dark ? "text-white/82 hover:bg-white/10" : "hover:bg-muted",
              )}
            >
              <span className="flex items-center gap-3">
                <Bell className="size-4" aria-hidden />
                Bildirimler & Destek
              </span>
              {notificationUnreadCount > 0 ? (
                <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-black text-white">
                  {notificationUnreadCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={authUser ? onLogout : () => onNavigate("login")}
              className={cn(
                "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition",
                dark ? "text-white/82 hover:bg-white/10" : "hover:bg-muted",
              )}
            >
              <LogOut className="size-4" aria-hidden />
              {authUser ? "Çıkış yap" : "Giriş yap"}
            </button>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-30 flex min-h-[68px] flex-wrap items-center justify-between gap-3 border-b border-border bg-white/95 px-3 py-2.5 backdrop-blur sm:min-h-[76px] sm:px-6">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-black tracking-normal text-brand-brown sm:text-2xl">
                {title}
              </h1>
              <p className="line-clamp-1 text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <IconButton
                icon={Bell}
                label="Bildirimler"
                badge={notificationUnreadCount}
                onClick={() => onNavigate("states")}
              />
              <AccountChip
                authUser={authUser}
                sellerProfile={sellerProfile}
                onLogin={() => onNavigate("login")}
                onLogout={onLogout}
              />
            </div>
          </header>
          <div className="p-3 sm:p-6">{children}</div>
        </section>
      </div>
    </main>
  );
}

export type ChatContextSelection = {
  urunId?: number | null;
  talepId?: number | null;
  label?: string | null;
};

export function ChatPanel({
  compact = false,
  conversations,
  messages,
  targetId,
  actionStatus,
  signalrConnected = false,
  typingFromUserId = null,
  chatContext = null,
  onClearContext,
  onTargetChange,
  onSendMessage,
  onTyping,
}: {
  compact?: boolean;
  conversations: ChatConversationDto[];
  messages: ChatMessageDto[];
  targetId: string;
  actionStatus: string | null;
  signalrConnected?: boolean;
  typingFromUserId?: string | null;
  chatContext?: ChatContextSelection | null;
  onClearContext?: () => void;
  onTargetChange: (value: string) => void;
  onSendMessage: (receiverId: string, message: string) => void;
  onTyping?: (receiverId: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const lastTypingSentRef = useRef(0);

  const activeConversation =
    conversations.find((conversation) => conversation.userId === targetId) ??
    conversations[0];
  const currentTarget = targetId || activeConversation?.userId || "";
  const canSend = Boolean(currentTarget && draft.trim() && actionStatus !== "chat-send");
  const isTyping = Boolean(typingFromUserId && typingFromUserId === currentTarget);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, currentTarget, isTyping]);

  if (conversations.length === 0 && !currentTarget) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Henüz mesaj yok"
        description="Bir ürün detayından satıcıya yazdığında veya alıcıdan mesaj geldiğinde canlı sohbet burada açılır."
      />
    );
  }

  const targetTitle =
    activeConversation?.magazaAdi ??
    activeConversation?.userName ??
    activeConversation?.email ??
    "Yeni görüşme";

  return (
    <div
      className={cn(
        "grid grid-rows-[auto_1fr_auto] overflow-hidden rounded-xl border border-border bg-white shadow-sm",
        compact
          ? "h-[440px] sm:h-[500px] xl:h-[540px]"
          : "h-[500px] sm:h-[580px]",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-[#fbfcfa] px-3 py-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/12 text-sm font-black text-primary">
            {targetTitle.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-black text-foreground">{targetTitle}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className={cn(
                  "inline-block size-2 rounded-full",
                  signalrConnected ? "bg-emerald-500" : "bg-amber-400",
                )}
              />
              <span>
                {isTyping
                  ? "Yazıyor..."
                  : signalrConnected
                    ? "Canlı bağlantı aktif"
                    : "REST senkron"}
              </span>
            </div>
          </div>
        </div>
        {activeConversation?.magazaAdi ? (
          <Badge variant="green">Doğrulanmış Mağaza</Badge>
        ) : null}
      </div>

      <div ref={scrollContainerRef} className="thin-scrollbar overscroll-contain space-y-3 overflow-y-auto scroll-smooth bg-[#f9faf8] p-3 sm:p-4">
        {conversations.length > 0 ? (
          <div className="scroll-shelf mb-2 flex gap-2 overflow-x-auto pb-1.5">
            {conversations.map((conversation) => {
              const label =
                conversation.magazaAdi ??
                conversation.userName ??
                conversation.email ??
                "Kullanıcı";
              const isActive = currentTarget === conversation.userId;
              return (
                <button
                  key={conversation.userId}
                  type="button"
                  onClick={() => onTargetChange(conversation.userId)}
                  className={cn(
                    "inline-flex max-w-[200px] shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-[transform,background-color,border-color,color,box-shadow] duration-150 active:scale-95",
                    isActive
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-border bg-white text-foreground hover:border-primary/40",
                  )}
                >
                  <span className="truncate">{label}</span>
                  {conversation.unreadCount > 0 ? (
                    <span
                      className={cn(
                        "grid min-w-4 place-items-center rounded-full px-1 text-[10px] font-black",
                        isActive ? "bg-white text-primary" : "bg-red-600 text-white",
                      )}
                    >
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}

        {messages.length > 0 ? (
          <div className="space-y-2.5">
            {messages.map((message) => {
              const ctxParts = [
                message.urunAdi ? `Ürün: ${message.urunAdi}` : message.urunId ? `Ürün #${message.urunId}` : null,
                message.talepId ? `Talep #${message.talepId}` : null,
              ].filter(Boolean);
              return (
                <ChatBubble
                  key={message.id}
                  mine={message.isMine}
                  read={Boolean(message.readAt)}
                  time={shortDate(message.sentAt)}
                  contextBadge={ctxParts.length > 0 ? ctxParts.join(" · ") : undefined}
                >
                  {message.message}
                </ChatBubble>
              );
            })}
          </div>
        ) : (
          <div className="grid h-40 place-items-center rounded-lg border border-dashed border-border bg-white p-4 text-center text-sm text-muted-foreground">
            Bu konuşmada henüz mesaj yok. İlk mesajı aşağıdan gönderebilirsin.
          </div>
        )}

        {isTyping ? (
          <div className="flex justify-start">
            <span className="rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-muted-foreground">
              {targetTitle} yazıyor...
            </span>
          </div>
        ) : null}
      </div>

      <div className="border-t border-border bg-white">
        {chatContext && (chatContext.urunId || chatContext.talepId) ? (
          <div className="flex items-center justify-between gap-2 border-b border-emerald-200/70 bg-emerald-50/70 px-3 py-1.5 text-xs">
            <span className="truncate font-bold text-primary">
              Bağlam: {chatContext.label || ""}
              {chatContext.urunId ? ` (Ürün #${chatContext.urunId})` : ""}
              {chatContext.talepId ? ` (Talep #${chatContext.talepId})` : ""}
            </span>
            {onClearContext ? (
              <button
                type="button"
                onClick={onClearContext}
                className="shrink-0 font-extrabold text-muted-foreground hover:text-foreground"
              >
                Temizle
              </button>
            ) : null}
          </div>
        ) : null}

        <form
          className="grid grid-cols-[1fr_auto] gap-2 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.trim() || !currentTarget) return;
            onSendMessage(currentTarget, draft.trim());
            setDraft("");
          }}
        >
          <Input
            value={draft}
            onChange={(event) => {
              const val = limitText(event.target.value, 1000);
              setDraft(val);
              if (currentTarget && onTyping && Date.now() - lastTypingSentRef.current > 2000) {
                lastTypingSentRef.current = Date.now();
                onTyping(currentTarget);
              }
            }}
            maxLength={1000}
            placeholder={currentTarget ? "Mesajını yaz (maks 1000 karakter)..." : "Konuşma seç"}
            disabled={!currentTarget || actionStatus === "chat-send"}
          />
          <Button disabled={!canSend} aria-label="Mesaj gönder" title="Mesaj gönder">
            {actionStatus === "chat-send" ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <Send aria-hidden />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export function ChatBubble({
  mine,
  read,
  time,
  contextBadge,
  children,
}: {
  mine?: boolean;
  read?: boolean;
  time?: string;
  contextBadge?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[84%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 shadow-sm",
          mine
            ? "rounded-br-sm bg-primary text-white"
            : "rounded-bl-sm border border-border bg-white text-foreground",
        )}
      >
        {contextBadge ? (
          <p
            className={cn(
              "mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold",
              mine ? "bg-white/20 text-white" : "bg-emerald-50 text-primary",
            )}
          >
            {contextBadge}
          </p>
        ) : null}
        <p className="break-words">{children}</p>
        <div
          className={cn(
            "mt-1 flex items-center justify-end gap-1 text-[10px] font-semibold",
            mine ? "text-white/80" : "text-muted-foreground",
          )}
        >
          <span>{time}</span>
          {mine ? (
            read ? (
              <CheckCheck className="size-3.5 text-emerald-200" aria-label="Okundu" />
            ) : (
              <Check className="size-3.5 opacity-75" aria-label="Gönderildi" />
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Onayla",
  danger = false,
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) onCancel();
      }}
    >
      <Card className="overscroll-contain w-full max-w-md animate-soft-reveal p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-black text-brand-brown">{title}</h3>
          <Button type="button" variant="ghost" size="icon" onClick={onCancel} aria-label="Kapat">
            <X className="size-4" />
          </Button>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            Vazgeç
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className={cn(danger && "bg-red-600 text-white hover:bg-red-700")}
          >
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function SellerStorefrontModal({
  saticiId,
  canFollow = false,
  isFollowing = false,
  onToggleFollow,
  onClose,
  onSelectProduct,
  onStartChat,
}: {
  saticiId: string | null;
  canFollow?: boolean;
  isFollowing?: boolean;
  onToggleFollow?: (saticiId: string) => void;
  onClose: () => void;
  onSelectProduct: (product: ProductDto) => void;
  onStartChat: (saticiId: string) => void;
}) {
  const [seller, setSeller] = useState<PublicSellerSummaryDto | null>(null);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loadedSellerId, setLoadedSellerId] = useState<string | null>(null);
  const loading = Boolean(saticiId && loadedSellerId !== saticiId);

  useEffect(() => {
    if (!saticiId) return;
    let ignore = false;

    Promise.all([
      yoremioApi.publicSellerProfile(saticiId),
      yoremioApi.products({ saticiId, page: 1, pageSize: 6 }),
    ])
      .then(([summary, pageRes]) => {
        if (ignore) return;
        setSeller(summary);
        setProducts(pageRes.items);
      })
      .catch(() => {
        if (!ignore) {
          setSeller(null);
          setProducts([]);
        }
      })
      .finally(() => {
        if (!ignore) setLoadedSellerId(saticiId);
      });

    return () => {
      ignore = true;
    };
  }, [saticiId]);

  if (!saticiId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <Card className="animate-soft-reveal thin-scrollbar overscroll-contain max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl p-0 pb-[env(safe-area-inset-bottom)] shadow-2xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <Store className="size-5 text-primary" aria-hidden />
            <h2 className="text-lg font-black text-brand-brown">Satıcı Vitrini</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Kapat">
            <X className="size-5" />
          </Button>
        </div>

        {loading ? (
          <div className="grid min-h-64 place-items-center p-8">
            <Loader2 className="size-7 animate-spin text-primary" aria-hidden />
          </div>
        ) : !seller ? (
          <div className="p-6">
            <EmptyState
              icon={Store}
              title="Satıcı vitrini yüklenemedi"
              description="Satıcı bilgileri şu anda alınamıyor."
            />
          </div>
        ) : (
          <div className="space-y-5 p-4 sm:p-6">
            {seller.kapakResimUrl ? (
              <div className="relative h-36 w-full overflow-hidden rounded-2xl border border-border bg-muted sm:h-44">
                <Image
                  src={mediaImageSrc(seller.kapakResimUrl)}
                  alt={`${seller.magazaAdi} mağaza kapağı`}
                  fill
                  sizes="(max-width: 768px) 100vw, 720px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
              </div>
            ) : null}

            <div className="flex flex-col gap-4 rounded-xl border border-border bg-[#f9fbf8] p-4 sm:flex-row sm:items-center">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted">
                <Image
                  src={mediaImageSrc(seller.kapakResimUrl)}
                  alt={seller.magazaAdi}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-black text-brand-brown">{seller.magazaAdi}</h3>
                  {seller.dogrulanmisSatici ? (
                    <Badge variant="green">
                      <ShieldCheck className="size-3.5" aria-hidden />
                      Doğrulanmış Satıcı
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-4" aria-hidden />
                  {[seller.sehir, seller.ilce].filter(Boolean).join(", ") || "Konum belirtilmedi"}
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs font-bold text-foreground">
                  <span>{seller.urunSayisi} Ürün</span>
                  <span>★ {seller.ortalamaPuan.toFixed(1)} ({seller.toplamYorum} yorum)</span>
                  <span>{seller.toplamFavori} Favori</span>
                  {typeof seller.takipciSayisi === "number" ? (
                    <span>{seller.takipciSayisi} Takipçi</span>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-bold">
                  {seller.epostaDogrulandi ? (
                    <Badge variant="outline">E-posta Onaylı</Badge>
                  ) : null}
                  {seller.isletmeDogrulandi ? (
                    <Badge variant="outline">İşletme Doğrulandı</Badge>
                  ) : null}
                  {seller.ureticiDogrulandi ? (
                    <Badge variant="outline">Üretici Doğrulandı</Badge>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 sm:flex-col sm:items-end">
                <TrustDial score={seller.guvenSkoru} />
                <div className="flex flex-wrap gap-2">
                  {canFollow && onToggleFollow ? (
                    <Button
                      size="sm"
                      variant={isFollowing ? "secondary" : "outline"}
                      onClick={() => onToggleFollow(seller.kullaniciId)}
                    >
                      {isFollowing ? "Takip Ediliyor" : "Takip Et"}
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    onClick={() => {
                      onClose();
                      onStartChat(seller.kullaniciId);
                    }}
                  >
                    <MessageCircle className="size-4" aria-hidden />
                    Satıcıya yaz
                  </Button>
                </div>
              </div>
            </div>

            {seller.aciklama ? (
              <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-primary">
                  Üretici Hikayesi
                </h4>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-foreground">
                  {seller.aciklama}
                </p>
              </div>
            ) : null}

            <div>
              <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-muted-foreground">
                Mağaza Ürünleri
              </h4>
              {products.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {products.map((product) => (
                    <MiniProductButton
                      key={product.id}
                      product={product}
                      onClick={() => {
                        onClose();
                        onSelectProduct(product);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Package}
                  title="Aktif ürün yok"
                  description="Bu satıcının şu an listelenen aktif ürünü bulunmuyor."
                />
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export function DemandDetailModal({
  demandId,
  token,
  mode,
  actionStatus,
  onClose,
  onAcceptOffer,
  onRejectOffer,
  onCancelDemand,
  onConfirmAgreement,
  onSubmitOffer,
  onStartChat,
  onGoReviews,
}: {
  demandId: number | null;
  token?: string;
  mode: "buyer" | "seller";
  actionStatus: string | null;
  onClose: () => void;
  onAcceptOffer?: (offerId: number) => Promise<void> | void;
  onRejectOffer?: (offerId: number) => Promise<void> | void;
  onCancelDemand?: (talepId: number) => Promise<void> | void;
  onConfirmAgreement?: (talepId: number, gerceklestiMi: boolean) => Promise<void> | void;
  onSubmitOffer?: (talepId: number, values: OfferSubmitValues) => Promise<void> | void;
  onStartChat?: (otherUserId: string, context?: ChatContextSelection) => void;
  onGoReviews?: (urunId: number) => void;
}) {
  const [demand, setDemand] = useState<DemandDto | null>(null);
  const [loadedDemandId, setLoadedDemandId] = useState<number | null>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMsg, setOfferMsg] = useState("");
  const [offerDays, setOfferDays] = useState("");
  const [offerCargo, setOfferCargo] = useState(true);
  const [offerCity, setOfferCity] = useState("");
  const [offerExpired, setOfferExpired] = useState(false);
  const loading = Boolean(demandId && token && loadedDemandId !== demandId);

  useEffect(() => {
    if (!demandId || !token) return;
    let ignore = false;
    yoremioApi
      .demandDetail(token, demandId)
      .then((res) => {
        if (ignore) return;
        setDemand(res);
        setOfferExpired(
          Boolean(res.sonTeklifTarihi && new Date(res.sonTeklifTarihi).getTime() <= Date.now()),
        );
        const existing = res.teklifler?.[0];
        if (existing) {
          setOfferPrice(existing.birimFiyat ? String(existing.birimFiyat) : "");
          setOfferMsg(existing.mesaj ?? "");
          setOfferDays(existing.teslimatSuresiGun ? String(existing.teslimatSuresiGun) : "");
          setOfferCargo(existing.kargoDahilMi ?? true);
          setOfferCity(existing.gonderimSehir ?? "");
        } else {
          setOfferPrice(res.urunFiyat ? String(res.urunFiyat) : res.hedefBirimFiyat ? String(res.hedefBirimFiyat) : "");
          setOfferMsg("");
          setOfferDays("");
          setOfferCargo(true);
          setOfferCity("");
        }
      })
      .catch(() => {
        if (!ignore) setDemand(null);
      })
      .finally(() => {
        if (!ignore) setLoadedDemandId(demandId);
      });
    return () => {
      ignore = true;
    };
  }, [demandId, token]);

  if (!demandId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <Card className="animate-soft-reveal thin-scrollbar overscroll-contain max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl p-0 pb-[env(safe-area-inset-bottom)] shadow-2xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <ClipboardList className="size-5 text-primary" aria-hidden />
            <h2 className="text-lg font-black text-brand-brown">Talep Detayı #{demandId}</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Kapat">
            <X className="size-5" />
          </Button>
        </div>

        {loading ? (
          <div className="grid min-h-60 place-items-center p-8">
            <Loader2 className="size-7 animate-spin text-primary" aria-hidden />
          </div>
        ) : !demand ? (
          <div className="p-6">
            <EmptyState
              icon={ClipboardList}
              title="Talep bulunamadı"
              description="Bu talep detayı yüklenemedi."
            />
          </div>
        ) : (
          <div className="space-y-5 p-4 sm:p-6">
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-[#f9fbf8] p-4 sm:flex-row sm:items-center">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                <Image
                  src={demandImage(demand)}
                  alt={demandTitle(demand)}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black">{demandTitle(demand)}</h3>
                  <Badge
                    variant={
                      demand.durum === "ANLASILDI"
                        ? "green"
                        : demand.durum === "IPTAL"
                          ? "outline"
                          : "gold"
                    }
                  >
                    {demand.durum === "ACIK"
                      ? "Açık · Teklif Bekliyor"
                      : demand.durum === "ANLASILDI"
                        ? "Anlaşıldı"
                        : "İptal"}
                  </Badge>
                  {demand.talepTuru === "ACIK_PAZAR" ? (
                    <Badge variant="plum">Açık Pazar · Benim İçin Bul</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">
                  Miktar: <span className="text-foreground">{demand.miktar} {demand.birim || "adet"}</span>
                  {demand.urunFiyat ? (
                    <>
                      {" "}· Liste fiyatı:{" "}
                      <span className="text-primary">{formatPrice(demand.urunFiyat)}</span>
                    </>
                  ) : demand.hedefBirimFiyat ? (
                    <>
                      {" "}· Hedef fiyat:{" "}
                      <span className="text-primary">{formatPrice(demand.hedefBirimFiyat)}</span>
                    </>
                  ) : null}
                </p>
                {demand.teslimatSehir ? (
                  <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                    Teslimat Şehri: <span className="text-foreground">{demand.teslimatSehir}</span>
                    {demand.tercihEdilenSehirler ? ` · Tercih yöre: ${demand.tercihEdilenSehirler}` : ""}
                  </p>
                ) : null}
                {demand.saticiMagazaAdi ? (
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">
                    Satıcı: {demand.saticiMagazaAdi}{" "}
                    {demand.saticiSehir ? `(${demand.saticiSehir})` : ""}
                  </p>
                ) : null}
                {demand.aliciAdi ? (
                  <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                    Alıcı: <span className="text-foreground">{demand.aliciAdi}</span>
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  Oluşturma: {shortDate(demand.olusturmaTarihi)}
                  {demand.guncellemeTarihi
                    ? ` · Son Güncelleme: ${shortDate(demand.guncellemeTarihi)}`
                    : ""}
                  {demand.sonTeklifTarihi
                    ? ` · Son Teklif: ${shortDate(demand.sonTeklifTarihi)}`
                    : ""}
                </p>
              </div>
            </div>

            {demand.not ? (
              <div className="rounded-xl border border-border bg-white p-3.5 text-sm">
                <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Alıcı Notu
                </p>
                <p className="mt-1 leading-6 text-foreground">{demand.not}</p>
              </div>
            ) : null}

            <div className="space-y-3">
              <h4 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                Teklifler ({demand.teklifler.length})
              </h4>
              {demand.teklifler.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Henüz bu talep için satıcı teklifi verilmemiş.
                </p>
              ) : (
                demand.teklifler.map((offer) => (
                  <div key={offer.id} className="rounded-xl border border-border bg-white p-4 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-black text-brand-brown">
                          {offer.saticiMagazaAdi ?? demand.saticiMagazaAdi ?? "Satıcı teklifi"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {shortDate(offer.olusturmaTarihi)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          offer.durum === "KABUL"
                            ? "green"
                            : offer.durum === "RED"
                              ? "outline"
                              : "gold"
                        }
                      >
                        {offer.durum}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-foreground">{offer.mesaj}</p>
                    {(offer.teslimatSuresiGun || offer.gonderimSehir || offer.kargoDahilMi !== undefined) ? (
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-bold text-muted-foreground">
                        {offer.teslimatSuresiGun ? (
                          <span className="rounded-full border border-border bg-[#f8fbf7] px-2.5 py-0.5">
                            Teslimat: {offer.teslimatSuresiGun} gün
                          </span>
                        ) : null}
                        {offer.gonderimSehir ? (
                          <span className="rounded-full border border-border bg-[#f8fbf7] px-2.5 py-0.5">
                            Gönderim: {offer.gonderimSehir}
                          </span>
                        ) : null}
                        <span className="rounded-full border border-border bg-[#f8fbf7] px-2.5 py-0.5">
                          {offer.kargoDahilMi === false ? "Kargo Hariç" : "Kargo Dahil"}
                        </span>
                      </div>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
                      <div>
                        <span className="block text-xs text-muted-foreground">
                          Birim: {formatPrice(offer.birimFiyat ?? demand.urunFiyat ?? 0)}
                        </span>
                        <span className="text-lg font-black text-primary">
                          Toplam: {formatPrice((offer.birimFiyat ?? demand.urunFiyat ?? 0) * demand.miktar)}
                        </span>
                      </div>
                      {mode === "buyer" && demand.durum === "ACIK" && offer.durum === "BEKLEMEDE" ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            disabled={actionStatus === `offer-reject-${offer.id}`}
                            onClick={async () => {
                              await onRejectOffer?.(offer.id);
                              onClose();
                            }}
                          >
                            {actionStatus === `offer-reject-${offer.id}` ? (
                              <Loader2 className="animate-spin" aria-hidden />
                            ) : (
                              <X className="size-4" aria-hidden />
                            )}
                            Reddet
                          </Button>
                          <Button
                            size="sm"
                            disabled={actionStatus === `offer-${offer.id}`}
                            onClick={async () => {
                              await onAcceptOffer?.(offer.id);
                              onClose();
                            }}
                          >
                            {actionStatus === `offer-${offer.id}` ? (
                              <Loader2 className="animate-spin" aria-hidden />
                            ) : (
                              <Check className="size-4" aria-hidden />
                            )}
                            Teklifi Kabul Et
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>

            {mode === "seller" && demand.durum === "ACIK" && onSubmitOffer ? (
              offerExpired ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-900">
                  Bu talebin son teklif süresi ({shortDate(demand.sonTeklifTarihi)}) dolduğu için yeni teklif gönderilemiyor.
                </div>
              ) : (
                <form
                  className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!offerMsg.trim()) return;
                    await onSubmitOffer(demand.id, {
                      birimFiyat: offerPrice ? Number(offerPrice) : undefined,
                      mesaj: offerMsg.trim(),
                      teslimatSuresiGun: offerDays ? Number(offerDays) : undefined,
                      kargoDahilMi: offerCargo,
                      gonderimSehir: offerCity.trim() || undefined,
                    });
                    onClose();
                  }}
                >
                  <h4 className="font-black text-brand-brown">
                    {demand.teklifler.length > 0 ? "Teklifi Güncelle" : "Teklif Ver"}
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Birim Fiyat (TL)" htmlFor="modal-offer-price">
                      <Input
                        id="modal-offer-price"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                        placeholder="Opsiyonel"
                      />
                    </Field>
                    <div className="flex items-end pb-2 text-sm font-bold text-primary">
                      {offerPrice
                        ? `Toplam (${demand.miktar}): ${formatPrice(Number(offerPrice) * demand.miktar)}`
                        : ""}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Teslimat Süresi (Gün)" htmlFor="modal-offer-days">
                      <Input
                        id="modal-offer-days"
                        type="number"
                        min="1"
                        max="90"
                        value={offerDays}
                        onChange={(e) => setOfferDays(e.target.value)}
                        placeholder="Ör: 2"
                      />
                    </Field>
                    <Field label="Gönderim Şehri" htmlFor="modal-offer-city">
                      <Input
                        id="modal-offer-city"
                        value={offerCity}
                        onChange={(e) => setOfferCity(limitText(e.target.value, 60))}
                        placeholder="Ör: Ardahan"
                      />
                    </Field>
                    <div className="flex items-end pb-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-brand-brown">
                        <input
                          type="checkbox"
                          checked={offerCargo}
                          onChange={(e) => setOfferCargo(e.target.checked)}
                          className="accent-primary"
                        />
                        Kargo Dahil
                      </label>
                    </div>
                  </div>
                  <Field label="Teklif Mesajı *" htmlFor="modal-offer-msg">
                    <textarea
                      id="modal-offer-msg"
                      value={offerMsg}
                      onChange={(e) => setOfferMsg(limitText(e.target.value, 1000))}
                      maxLength={1000}
                      required
                      placeholder="Örn: Toplu alımda birim fiyatımız budur, taze hasat hazır..."
                      className="min-h-24 w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
                    />
                  </Field>
                  <Button type="submit" disabled={actionStatus === `seller-offer-${demand.id}`}>
                    {actionStatus === `seller-offer-${demand.id}` ? (
                      <Loader2 className="animate-spin" aria-hidden />
                    ) : (
                      <Send className="size-4" aria-hidden />
                    )}
                    {demand.teklifler.length > 0 ? "Teklifi Güncelle" : "Teklif Gönder"}
                  </Button>
                </form>
              )
            ) : null}

            {demand.durum === "ANLASILDI" && onConfirmAgreement ? (
              <div className="rounded-xl border border-emerald-200 bg-[#f6fbf6] p-4">
                <p className="text-sm font-black text-brand-brown">
                  Dış Anlaşma Gerçekleşme Teyidi
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Alıcı onayı:{" "}
                  <strong className="text-foreground">
                    {demand.aliciGerceklestiOnayi === true
                      ? "Gerçekleşti"
                      : demand.aliciGerceklestiOnayi === false
                        ? "Gerçekleşmedi"
                        : "Bekleniyor"}
                  </strong>{" "}
                  · Satıcı onayı:{" "}
                  <strong className="text-foreground">
                    {demand.saticiGerceklestiOnayi === true
                      ? "Gerçekleşti"
                      : demand.saticiGerceklestiOnayi === false
                        ? "Gerçekleşmedi"
                        : "Bekleniyor"}
                  </strong>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={actionStatus === `agreement-${demand.id}`}
                    onClick={async () => {
                      await onConfirmAgreement(demand.id, true);
                      onClose();
                    }}
                  >
                    <Check className="size-4" aria-hidden />
                    Alışveriş Gerçekleşti
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={actionStatus === `agreement-${demand.id}`}
                    onClick={async () => {
                      await onConfirmAgreement(demand.id, false);
                      onClose();
                    }}
                  >
                    Gerçekleşmedi
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
              <div className="flex flex-wrap gap-2">
                {onStartChat && (mode === "buyer" ? demand.saticiId : demand.aliciId) ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const target = mode === "buyer" ? demand.saticiId! : demand.aliciId;
                      onClose();
                      onStartChat(target, {
                        urunId: demand.urunId ?? undefined,
                        talepId: demand.id,
                        label: demandTitle(demand),
                      });
                    }}
                  >
                    <MessageCircle className="size-4" aria-hidden />
                    {mode === "buyer" ? "Satıcıyla sohbet et" : "Alıcıya mesaj at"}
                  </Button>
                ) : null}
                {mode === "buyer" && demand.durum === "ANLASILDI" && demand.urunId && onGoReviews ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      onClose();
                      onGoReviews(demand.urunId!);
                    }}
                  >
                    <Star className="size-4" aria-hidden />
                    Puan & Yorum Ver
                  </Button>
                ) : null}
              </div>

              {mode === "buyer" && demand.durum === "ACIK" && onCancelDemand ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  disabled={actionStatus === `demand-cancel-${demand.id}`}
                  onClick={async () => {
                    await onCancelDemand(demand.id);
                    onClose();
                  }}
                >
                  {actionStatus === `demand-cancel-${demand.id}` ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : (
                    <X className="size-4" aria-hidden />
                  )}
                  Talebi İptal Et
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export function SupportRequestPanel({
  authUser,
  showToast,
  ekran,
  initialTraceId,
}: {
  authUser: AuthState | null;
  showToast: (message: string, kind: ToastKind) => void;
  ekran: string;
  initialTraceId?: string | null;
}) {
  const [konu, setKonu] = useState("");
  const [mesaj, setMesaj] = useState(
    initialTraceId ? `Hata izleme kodu (traceId): ${initialTraceId}\n` : "",
  );
  const [email, setEmail] = useState(authUser?.email ?? "");
  const [trackedAuthEmail, setTrackedAuthEmail] = useState(authUser?.email ?? "");
  if (authUser?.email && authUser.email !== trackedAuthEmail) {
    setTrackedAuthEmail(authUser.email);
    setEmail(authUser.email);
  }
  const [telefon, setTelefon] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [talepId, setTalepId] = useState("");

  const submitSupport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!konu.trim() || !mesaj.trim()) {
      showToast("Destek için konu ve mesaj gerekli.", "info");
      return;
    }

    setStatus("loading");
    try {
      const result = await yoremioApi.createSupportRequest({
        konu: konu.trim(),
        mesaj: mesaj.trim(),
        email: email.trim() || undefined,
        telefon: telefon.trim() || undefined,
        ekran,
      });
      setTalepId(result.talepId);
      setMesaj("");
      setKonu("");
      showToast(`Destek talebi alındı: ${result.talepId}`, "success");
    } catch (error) {
      const info = apiErrorInfo(error);
      showToast(info.message, "error");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-brand-brown">Yardım / Destek Talebi</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Karşılaştığın bir sorunu veya teknik `traceId` kodunu doğrudan destek ekibine ilet.
          </p>
        </div>
        {talepId ? <Badge variant="green">Takip No: {talepId}</Badge> : null}
      </div>
      <form onSubmit={submitSupport} className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Konu *" htmlFor="support-subject">
          <Input
            id="support-subject"
            value={konu}
            onChange={(event) => setKonu(event.target.value)}
            placeholder="Kısa başlık"
            required
          />
        </Field>
        <Field label="E-posta" htmlFor="support-email">
          <Input
            id="support-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(limitText(event.target.value, 254))}
            placeholder="ornek@eposta.com"
            maxLength={254}
          />
        </Field>
        <Field label="Telefon" htmlFor="support-phone">
          <Input
            id="support-phone"
            value={telefon}
            onChange={(event) => setTelefon(phoneInput(event.target.value))}
            placeholder="+90..."
            maxLength={18}
          />
        </Field>
        <Field label="Mesaj *" htmlFor="support-message" className="md:col-span-2">
          <textarea
            id="support-message"
            value={mesaj}
            onChange={(event) => setMesaj(event.target.value)}
            placeholder="Detaylı bilgi veya hata mesajını yaz..."
            required
            className="min-h-28 w-full rounded-md border border-input px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
          />
        </Field>
        <div className="md:col-span-2">
          <Button className="w-full sm:w-auto" disabled={status === "loading"}>
            {status === "loading" ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
            Destek talebi gönder
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function AccountChip({
  authUser,
  sellerProfile,
  onLogin,
  onLogout,
}: {
  authUser: AuthState | null;
  sellerProfile?: SellerProfileDto | null;
  onLogin: () => void;
  onLogout: () => void;
}) {
  if (!authUser) {
    return (
      <Button variant="outline" title="Giriş yap" aria-label="Giriş yap" className="px-3" onClick={onLogin}>
        <UserRound aria-hidden />
        <span className="hidden sm:inline">Giriş yap</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-right sm:block">
        <span className="block text-sm font-black">{accountName(authUser, sellerProfile)}</span>
        <span className="text-xs text-muted-foreground">{rolesOf(authUser).join(", ")}</span>
      </span>
      <button
        type="button"
        onClick={onLogout}
        title="Çıkış yap"
        aria-label="Çıkış yap"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-black text-white shadow-sm sm:size-11"
      >
        {accountName(authUser, sellerProfile).slice(0, 2).toUpperCase()}
      </button>
    </div>
  );
}

export function HeaderTextButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="hidden items-center gap-2 text-sm font-bold lg:flex hover:text-primary transition-colors">
      <Icon className="size-5" aria-hidden />
      {label}
    </button>
  );
}

export function IconButton({
  icon: Icon,
  label,
  badge,
  className,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  badge?: number;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "relative grid size-10 shrink-0 place-items-center rounded-full text-foreground transition-[transform,background-color,color] duration-150 hover:bg-muted active:scale-90 sm:size-11",
        className,
      )}
    >
      <Icon className="size-5" aria-hidden />
      {badge ? (
        <span className="absolute right-1 top-1 grid min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-black text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </button>
  );
}

export function Panel({
  title,
  action,
  badge,
  className,
  onAction,
  children,
}: {
  title: string;
  action?: string;
  badge?: number;
  className?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-white shadow-[0_6px_18px_rgba(16,24,40,0.04)]", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
        <h2 className="flex min-w-0 items-center gap-2 text-base font-black text-brand-brown sm:text-lg">
          {title}
          {badge ? (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-black text-white">
              {badge}
            </span>
          ) : null}
        </h2>
        {action && onAction ? (
          <button type="button" onClick={onAction} className="shrink-0 text-sm font-bold text-primary hover:underline">
            {action}
          </button>
        ) : null}
      </div>
      <div className="p-3 sm:p-5">{children}</div>
    </div>
  );
}

export function PanelHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-black text-brand-brown sm:text-xl">{title}</h2>
      {action && onAction ? (
        <button className="shrink-0 text-sm font-bold text-primary hover:underline" type="button" onClick={onAction}>
          {action}
        </button>
      ) : null}
    </div>
  );
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tone = "green",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  helper?: string;
  tone?: "green" | "amber" | "lime";
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-[0_6px_18px_rgba(16,24,40,0.04)] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-black tabular-nums sm:mt-3 sm:text-3xl">{value}</p>
        </div>
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-2xl sm:size-12",
            tone === "amber"
              ? "bg-amber-100 text-amber-700"
              : tone === "lime"
                ? "bg-lime-100 text-lime-700"
                : "bg-emerald-100 text-primary",
          )}
        >
          <Icon className="size-5 sm:size-6" aria-hidden />
        </span>
      </div>
      {helper ? <p className="mt-3 text-xs font-semibold text-muted-foreground sm:mt-4">{helper}</p> : null}
    </div>
  );
}

export function MiniProduct({ product }: { product: ProductDto }) {
  return (
    <div className="min-w-0">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
        <Image src={productImage(product)} alt={product.adi} fill sizes="140px" className="object-cover" />
      </div>
      <p className="mt-2 line-clamp-1 text-sm font-bold">{product.adi}</p>
      <p className="text-xs text-muted-foreground">{product.kategoriAdi ?? "Yerel"}</p>
      <p className="mt-1 text-right font-black text-primary">{formatPrice(product.fiyat)}</p>
    </div>
  );
}

export function MiniProductButton({ product, onClick }: { product: ProductDto; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-border bg-white p-2.5 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <MiniProduct product={product} />
    </button>
  );
}

export function PreviewPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-[0_10px_22px_rgba(16,24,40,0.06)]">
      <h3 className="mb-3 font-black">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function DemandMediaLine({
  demand,
  onClick,
}: {
  demand: DemandDto;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid w-full grid-cols-[48px_1fr_auto] items-center gap-3 rounded-lg border border-transparent p-2 text-left transition hover:border-border hover:bg-[#f9fbf8]"
    >
      <div className="relative size-12 overflow-hidden rounded-lg border border-border bg-muted">
        <Image src={demandImage(demand)} alt="" fill sizes="52px" className="object-cover" />
      </div>
      <div className="min-w-0">
        <p className="truncate font-black">{demandTitle(demand)}</p>
        <p className="text-xs font-semibold text-muted-foreground">
          Miktar: {demand.miktar} {demand.birim || "adet"} · {shortDate(demand.olusturmaTarihi)}
        </p>
      </div>
      <Badge variant={demand.durum === "ACIK" ? "gold" : demand.durum === "ANLASILDI" ? "green" : "outline"}>
        {demand.durum === "ACIK" ? "Yeni" : demand.durum}
      </Badge>
    </button>
  );
}

export function StatStrip({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "green" | "red" | "amber";
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-black tabular-nums",
          tone === "green" && "text-primary",
          tone === "red" && "text-red-600",
          tone === "amber" && "text-amber-600",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function MiniMetric({
  icon: Icon,
  label,
  value,
  tone = "green",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "green" | "red" | "amber";
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 sm:p-5">
      <Icon
        className={cn(
          "size-6",
          tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-500" : "text-primary",
        )}
        aria-hidden
      />
      <p className="mt-3 text-2xl font-black tabular-nums sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}

export function ProgressLine({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-bold">
        <span>{label}</span>
        <span>{clamped}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

export function ProfileRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 rounded-lg border border-border/70 bg-white/70 p-3 md:grid-cols-[160px_1fr] md:items-center md:border-0 md:bg-transparent md:p-0">
      <span className="text-sm font-black md:text-base">{label}</span>
      {children}
    </div>
  );
}

export function TrustDial({ score, large = false }: { score: number; large?: boolean }) {
  const roundedScore = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div
      className={cn("grid shrink-0 place-items-center rounded-full", large ? "size-36" : "size-20")}
      style={{
        background: `conic-gradient(var(--primary) ${roundedScore * 3.6}deg, #e4e8df 0)`,
      }}
    >
      <div className={cn("grid place-items-center rounded-full bg-white", large ? "size-28" : "size-16")}>
        <span className={cn("font-black text-primary tabular-nums", large ? "text-4xl" : "text-xl")}>
          {roundedScore}
        </span>
      </div>
    </div>
  );
}

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("flex items-center gap-1 text-amber-400", className)}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn("size-4 sm:size-5", index < Math.round(value) ? "fill-current" : "text-slate-300")}
          aria-hidden
        />
      ))}
    </span>
  );
}

export function PaginationBar({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-white p-3 shadow-xs">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Önceki
      </Button>
      <p className="text-sm font-bold text-muted-foreground tabular-nums">
        Sayfa {page} / {totalPages}
      </p>
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Sonraki
      </Button>
    </div>
  );
}

export function LocationFields({
  city,
  district,
  onCityChange,
  onDistrictChange,
  locations = [],
  cities = [],
  cityPlaceholder = "Ör: Ardahan",
  districtPlaceholder = "Ör: Posof",
  cityId,
  districtId,
  compact = false,
  stacked = false,
}: {
  city: string;
  district: string;
  onCityChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  locations?: BootstrapLocationDto[];
  cities?: string[];
  cityPlaceholder?: string;
  districtPlaceholder?: string;
  cityId?: string;
  districtId?: string;
  compact?: boolean;
  stacked?: boolean;
}) {
  const uid = useId();
  const cityListId = `yoremio-cities-${uid}`;
  const districtListId = `yoremio-districts-${uid}`;

  const cityOptions =
    cities.length > 0
      ? cities
      : locations.map((loc) => loc.sehir);

  const normalizedCity = city.trim().toLocaleLowerCase("tr-TR");
  const matchedLocation = normalizedCity
    ? locations.find(
        (loc) => loc.sehir.trim().toLocaleLowerCase("tr-TR") === normalizedCity,
      )
    : undefined;

  const districtOptions = matchedLocation
    ? matchedLocation.ilceler
    : Array.from(new Set(locations.flatMap((loc) => loc.ilceler))).sort((a, b) =>
        a.localeCompare(b, "tr-TR"),
      );

  return (
    <div
      className={cn(
        "grid",
        stacked ? "grid-cols-1" : "grid-cols-2",
        compact ? "gap-2.5" : "gap-3",
      )}
    >
      <Field label="Şehir" htmlFor={cityId ?? `${uid}-city`}>
        <Input
          id={cityId ?? `${uid}-city`}
          list={cityOptions.length > 0 ? cityListId : undefined}
          value={city}
          onChange={(event) => onCityChange(limitText(event.target.value, 40))}
          placeholder={cityPlaceholder}
        />
        {cityOptions.length > 0 ? (
          <datalist id={cityListId}>
            {cityOptions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        ) : null}
      </Field>

      <Field label="İlçe" htmlFor={districtId ?? `${uid}-district`}>
        <Input
          id={districtId ?? `${uid}-district`}
          list={districtOptions.length > 0 ? districtListId : undefined}
          value={district}
          onChange={(event) => onDistrictChange(limitText(event.target.value, 40))}
          placeholder={districtPlaceholder}
        />
        {districtOptions.length > 0 ? (
          <datalist id={districtListId}>
            {districtOptions.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        ) : null}
      </Field>
    </div>
  );
}

export function OpenMarketDemandModal({
  open,
  categories,
  locations = [],
  cities = [],
  initialProductName = "",
  initialCategoryId = null,
  initialCity = "",
  pending = false,
  onClose,
  onSubmit,
}: {
  open: boolean;
  categories: CategoryDto[];
  locations?: BootstrapLocationDto[];
  cities?: string[];
  initialProductName?: string;
  initialCategoryId?: number | null;
  initialCity?: string;
  pending?: boolean;
  onClose: () => void;
  onSubmit: (values: OpenMarketDemandValues) => Promise<boolean>;
}) {
  const [arananUrunAdi, setArananUrunAdi] = useState(initialProductName);
  const [kategoriId, setKategoriId] = useState(initialCategoryId ? String(initialCategoryId) : "");
  const [miktar, setMiktar] = useState("5");
  const [birim, setBirim] = useState("kg");
  const [teslimatSehir, setTeslimatSehir] = useState(initialCity);
  const [tercihEdilenSehirler, setTercihEdilenSehirler] = useState("");
  const [hedefBirimFiyat, setHedefBirimFiyat] = useState("");
  const [sonTeklifTarihi, setSonTeklifTarihi] = useState("");
  const [not, setNot] = useState("");

  if (!open) return null;

  const cityOptions =
    cities.length > 0 ? cities : locations.map((loc) => loc.sehir);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <Card className="animate-soft-reveal thin-scrollbar overscroll-contain max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-2xl p-0 pb-[env(safe-area-inset-bottom)] shadow-2xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" aria-hidden />
            <h2 className="text-lg font-black text-brand-brown">
              Benim İçin Bul · Açık Pazar Talebi
            </h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Kapat">
            <X className="size-5" />
          </Button>
        </div>

        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!arananUrunAdi.trim() || !teslimatSehir.trim()) return;
            const ok = await onSubmit({
              arananUrunAdi: arananUrunAdi.trim(),
              kategoriId: kategoriId ? Number(kategoriId) : undefined,
              miktar: Math.max(1, Number(miktar) || 1),
              birim: birim.trim() || "kg",
              teslimatSehir: teslimatSehir.trim(),
              tercihEdilenSehirler: tercihEdilenSehirler.trim() || undefined,
              hedefBirimFiyat: hedefBirimFiyat ? Number(hedefBirimFiyat) : undefined,
              sonTeklifTarihi: sonTeklifTarihi
                ? new Date(sonTeklifTarihi).toISOString()
                : undefined,
              not: not.trim() || undefined,
            });
            if (ok) onClose();
          }}
          className="space-y-4 p-4 sm:p-6"
        >
          <p className="rounded-xl border border-emerald-200/70 bg-[#f6fbf6] p-3 text-xs text-muted-foreground">
            Aradığın yöresel ürünü bulamadıysan açık talep oluştur; eşleşen şehir ve kategorideki doğrulanmış üreticiler sana doğrudan teklif göndersin.
          </p>

          <Field label="Aradığın Ürün *" htmlFor="omd-name">
            <Input
              id="omd-name"
              required
              minLength={2}
              value={arananUrunAdi}
              onChange={(e) => setArananUrunAdi(limitText(e.target.value, 150))}
              placeholder="Ör: Posof Göğermiş Peynir, Siirt Pervari Balı..."
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Kategori" htmlFor="omd-cat">
              <select
                id="omd-cat"
                value={kategoriId}
                onChange={(e) => setKategoriId(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-white px-3 text-sm outline-none focus:border-primary"
              >
                <option value="">Otomatik / Tümü</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.adi}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Teslimat Şehri *" htmlFor="omd-city">
              <Input
                id="omd-city"
                required
                list="omd-city-list"
                value={teslimatSehir}
                onChange={(e) => setTeslimatSehir(limitText(e.target.value, 60))}
                placeholder="Ör: İstanbul"
              />
              {cityOptions.length > 0 ? (
                <datalist id="omd-city-list">
                  {cityOptions.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              ) : null}
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Miktar *" htmlFor="omd-qty">
              <Input
                id="omd-qty"
                type="number"
                min="1"
                required
                value={miktar}
                onChange={(e) => setMiktar(e.target.value)}
              />
            </Field>
            <Field label="Birim" htmlFor="omd-unit">
              <Input
                id="omd-unit"
                value={birim}
                onChange={(e) => setBirim(limitText(e.target.value, 30))}
                placeholder="kg / kavanoz"
              />
            </Field>
            <Field label="Hedef Fiyat (₺)" htmlFor="omd-price">
              <Input
                id="omd-price"
                type="number"
                step="0.01"
                min="0.01"
                value={hedefBirimFiyat}
                onChange={(e) => setHedefBirimFiyat(e.target.value)}
                placeholder="Opsiyonel"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tercih Edilen Üretim Yöreleri" htmlFor="omd-pref">
              <Input
                id="omd-pref"
                value={tercihEdilenSehirler}
                onChange={(e) => setTercihEdilenSehirler(limitText(e.target.value, 200))}
                placeholder="Ör: Ardahan, Kars, Artvin"
              />
            </Field>
            <Field label="Son Teklif Tarihi (Opsiyonel)" htmlFor="omd-deadline">
              <Input
                id="omd-deadline"
                type="datetime-local"
                value={sonTeklifTarihi}
                onChange={(e) => setSonTeklifTarihi(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Üreticilere Notun" htmlFor="omd-note">
            <textarea
              id="omd-note"
              rows={3}
              value={not}
              onChange={(e) => setNot(limitText(e.target.value, 1000))}
              placeholder="Paketleme, olgunlaşma veya teslimat tercihinizi belirtin..."
              className="w-full rounded-xl border border-input bg-white p-3 text-sm outline-none focus:border-primary"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
              {pending ? "Eşleştiriliyor..." : "Açık Talep Yayınla"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  className,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block space-y-1.5 text-sm font-semibold", className)} htmlFor={htmlFor}>
      <span>{label}</span>
      {children}
      {error ? <span className="block text-xs font-bold text-red-600">{error}</span> : null}
    </label>
  );
}

export function InputIcon({
  icon: Icon,
  rightIcon: RightIcon,
  children,
}: {
  icon: LucideIcon;
  rightIcon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <span className="relative block">
      <Icon className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
      {children}
      {RightIcon ? (
        <RightIcon className="pointer-events-none absolute right-4 top-1/2 z-10 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
      ) : null}
    </span>
  );
}

export function PasswordInput({ className, disabled, ...props }: ComponentProps<"input">) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <InputIcon icon={LockKeyhole}>
      <Input
        {...props}
        disabled={disabled}
        type={visible ? "text" : "password"}
        className={cn("pr-12", className)}
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 z-20 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => setVisible((current) => !current)}
        disabled={disabled}
        aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"}
        title={visible ? "Şifreyi gizle" : "Şifreyi göster"}
      >
        <Icon className="size-5" aria-hidden />
      </button>
    </InputIcon>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-white p-6 text-center sm:p-10">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-secondary text-primary">
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="mt-3 text-lg font-black text-brand-brown">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function StatusBox({
  kind,
  title,
  text,
}: {
  kind: "warning" | "success";
  title: string;
  text: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 sm:p-5",
        kind === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-emerald-200 bg-emerald-50 text-emerald-950",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-full text-white",
            kind === "warning" ? "bg-amber-500" : "bg-primary",
          )}
        >
          {kind === "warning" ? <RefreshCw aria-hidden /> : <Check aria-hidden />}
        </span>
        <div>
          <p className="font-black">{title}</p>
          <p className="text-sm">{text}</p>
        </div>
      </div>
    </div>
  );
}

export function Toast({
  toast,
  onClose,
}: {
  toast: NonNullable<ToastState>;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="fixed inset-x-3 bottom-20 z-50 rounded-xl border border-border bg-white p-3.5 shadow-[0_24px_70px_rgba(0,0,0,0.22)] lg:inset-x-auto lg:bottom-5 lg:right-5 lg:w-[min(430px,calc(100vw-32px))]">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg",
            toast.kind === "success" && "bg-emerald-100 text-emerald-700",
            toast.kind === "error" && "bg-red-100 text-red-700",
            toast.kind === "info" && "bg-sky-100 text-sky-700",
          )}
        >
          {toast.kind === "success" ? (
            <Check className="size-4" aria-hidden />
          ) : toast.kind === "error" ? (
            <AlertCircle className="size-4" aria-hidden />
          ) : (
            <Sparkles className="size-4" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-5">{toast.message}</p>
          {toast.traceId ? (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(toast.traceId ?? "");
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1800);
              }}
              className="mt-1.5 inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground hover:text-foreground"
            >
              <Copy className="size-3" aria-hidden />
              {copied ? "Kopyalandı" : `traceId: ${toast.traceId.slice(0, 14)}...`}
            </button>
          ) : null}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} title="Kapat" aria-label="Kapat">
          <X aria-hidden />
        </Button>
      </div>
    </div>
  );
}

export { productLocation, sellerName };
