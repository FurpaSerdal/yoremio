"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Check,
  Heart,
  Inbox,
  Loader2,
  LogOut,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Store,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/yoremio/brand-logo";
import {
  ApiClientError,
  yoremioApi,
  type ChatConversationDto,
  type DemandDto,
  type LoginResponse,
  type ProductDto,
  type SellerProfileDto,
  type SessionUser,
} from "@/lib/api";
import { formatShortDate } from "@/lib/utils";

type AuthState = SessionUser & Pick<LoginResponse, "token">;
type PageState = "loading" | "ready" | "guest" | "error";

function roleLabel(role?: AuthState["role"]) {
  if (role === "ADMIN") return "Admin";
  return role === "SATICI" ? "Satıcı" : "Alıcı";
}

function hasRole(user: AuthState | SessionUser | null, role: AuthState["role"]) {
  if (!user) return false;
  return (user.roles?.length ? user.roles : [user.role]).includes(role);
}

function displayName(user: AuthState | null, sellerProfile: SellerProfileDto | null) {
  if (!user) return "Profil";
  if (hasRole(user, "SATICI")) {
    return sellerProfile?.magazaAdi?.trim() || "Satıcı hesabı";
  }

  return user.userName && !user.userName.includes("@")
    ? user.userName
    : "Alıcı hesabı";
}

function apiErrorMessage(error: unknown) {
  return error instanceof ApiClientError
    ? error.message
    : "Beklenmeyen bir hata oluştu.";
}

export function YoremioProfilePage() {
  const [state, setState] = useState<PageState>("loading");
  const [authUser, setAuthUser] = useState<AuthState | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfileDto | null>(null);
  const [sellerProducts, setSellerProducts] = useState<ProductDto[]>([]);
  const [sellerDemands, setSellerDemands] = useState<DemandDto[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<ProductDto[]>([]);
  const [buyerDemands, setBuyerDemands] = useState<DemandDto[]>([]);
  const [conversations, setConversations] = useState<ChatConversationDto[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [magazaAdi, setMagazaAdi] = useState("");
  const [adres, setAdres] = useState("");
  const [sehir, setSehir] = useState("");
  const [ilce, setIlce] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    let ignore = false;
    const token = window.localStorage.getItem("yoremio-token");

    if (!token) {
      setState("guest");
      return;
    }

    const sessionToken = token;

    async function loadProfile() {
      try {
        const user = await yoremioApi.me(sessionToken);
        if (ignore) return;

        const session = { ...user, token: sessionToken };
        setAuthUser(session);

        const nextConversations = await yoremioApi.conversations(sessionToken);
        if (!ignore) setConversations(nextConversations);

        if (hasRole(user, "SATICI")) {
          const [profile, products, demands] = await Promise.all([
            yoremioApi.sellerProfile(sessionToken),
            yoremioApi.sellerProducts(sessionToken),
            yoremioApi.sellerDemands(sessionToken),
          ]);

          if (ignore) return;
          setSellerProfile(profile);
          setSellerProducts(products);
          setSellerDemands(demands);
          setMagazaAdi(profile.magazaAdi ?? "");
          setAdres(profile.adres ?? "");
          setSehir(profile.sehir ?? "");
          setIlce(profile.ilce ?? "");
          setPhoneNumber(profile.phoneNumber ?? "");
        }

        if (hasRole(user, "ALICI")) {
          const [favorites, demands] = await Promise.all([
            yoremioApi.favoriteProducts(sessionToken),
            yoremioApi.buyerDemands(sessionToken),
          ]);

          if (ignore) return;
          setFavoriteProducts(favorites);
          setBuyerDemands(demands);
        }

        setState("ready");
      } catch (caught) {
        if (ignore) return;
        if (caught instanceof ApiClientError && caught.status === 401) {
          window.localStorage.removeItem("yoremio-token");
          window.localStorage.removeItem("yoremio-user");
          setState("guest");
          return;
        }

        setError(apiErrorMessage(caught));
        setState("error");
      }
    }

    void loadProfile();

    return () => {
      ignore = true;
    };
  }, []);

  const logout = () => {
    window.localStorage.removeItem("yoremio-token");
    window.localStorage.removeItem("yoremio-user");
    window.location.href = "/";
  };

  const saveSellerProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser || !hasRole(authUser, "SATICI")) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const profile = await yoremioApi.updateSellerProfile(authUser.token, {
        magazaAdi,
        adres,
        sehir,
        ilce,
        phoneNumber,
      });
      setSellerProfile(profile);
      setMessage("Profil bilgileri güncellendi.");
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const name = displayName(authUser, sellerProfile);

  if (state === "loading") {
    return (
      <ProfileShell>
        <div className="grid min-h-[60vh] place-items-center">
          <div className="text-center text-sm font-semibold text-muted-foreground">
            <Loader2 className="mx-auto mb-3 size-6 animate-spin text-primary" aria-hidden />
            Profil yükleniyor
          </div>
        </div>
      </ProfileShell>
    );
  }

  if (state === "guest") {
    return (
      <ProfileShell>
        <div className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-4 text-center">
          <Card className="p-6">
            <UserRound className="mx-auto size-9 text-primary" aria-hidden />
            <h1 className="mt-4 text-2xl font-black text-brand-brown">
              Profil için giriş gerekli
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Profil, mağaza bilgileri ve kullanıcı paneli güvenli oturumla açılır.
            </p>
            <Button className="mt-5" asChild>
              <Link href="/">Ana sayfaya dön</Link>
            </Button>
          </Card>
        </div>
      </ProfileShell>
    );
  }

  if (state === "error") {
    return (
      <ProfileShell>
        <div className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-4 text-center">
          <Card className="p-6">
            <ShieldCheck className="mx-auto size-9 text-primary" aria-hidden />
            <h1 className="mt-4 text-2xl font-black text-brand-brown">
              Profil yüklenemedi
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {error ?? "Profil verileri şu anda alınamadı."}
            </p>
            <Button className="mt-5" asChild>
              <Link href="/">Ana sayfaya dön</Link>
            </Button>
          </Card>
        </div>
      </ProfileShell>
    );
  }

  return (
    <ProfileShell onLogout={logout}>
      <main className="mx-auto max-w-[1360px] px-3 py-8 sm:px-5">
        <Card className="overflow-hidden border-white/70 bg-white/94">
          <div className="bg-[linear-gradient(135deg,rgba(10,106,68,0.1),rgba(231,163,33,0.12),rgba(255,255,255,0.98))] px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-5 border-b border-border/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={hasRole(authUser, "SATICI") ? "green" : "plum"}>
                    <ShieldCheck className="size-3.5" aria-hidden />
                    {roleLabel(authUser?.role)} profili
                  </Badge>
                  <Badge variant="outline">Canlı oturum yönetimi</Badge>
                </div>
                <h1 className="mt-3 text-4xl font-black tracking-normal text-brand-brown sm:text-5xl">
                  {name}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Hesap bilgileri, mağaza düzeni, talepler ve favoriler tek alanda.
                  Yayın sırasında kullanıcıya net, sakin ve güven veren bir kontrol merkezi sunar.
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground/70">
                  {authUser?.email}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <ProfilePill
                  label="Durum"
                  value={
                    authUser
                      ? (authUser.roles?.length ? authUser.roles : [authUser.role])
                          .map(roleLabel)
                          .join(" + ")
                      : "Oturum"
                  }
                />
                <ProfilePill label="Chat" value={String(conversations.length)} />
                <Button variant="outline" asChild className="bg-white/85">
                  <Link href="/">
                    <ArrowLeft aria-hidden />
                    Pazara dön
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {error ? (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            {message}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ProfileStat icon={ShieldCheck} label="Email" value={authUser?.emailConfirmed ? "Doğrulandı" : "Bekliyor"} />
          <ProfileStat icon={UserRound} label="Telefon" value={phoneNumber ? "Kayıtlı" : "Eksik"} />
          <ProfileStat icon={MessageCircle} label="Görüşme" value={String(conversations.length)} />
          {hasRole(authUser, "SATICI") ? (
            <ProfileStat icon={PackageCheck} label="Ürün" value={String(sellerProducts.length)} />
          ) : (
            <ProfileStat icon={Heart} label="Favori" value={String(favoriteProducts.length)} />
          )}
        </div>

        {hasRole(authUser, "SATICI") ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-[430px_minmax(0,1fr)]">
            <Card className="p-5 lg:sticky lg:top-24 lg:self-start">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-brand-brown">Mağaza profili</h2>
                  <p className="text-sm text-muted-foreground">
                    Header ve profil ekranında bu mağaza adı görünür.
                  </p>
                </div>
                <Store className="size-5 text-primary" aria-hidden />
              </div>
              <form className="mt-5 space-y-3" onSubmit={saveSellerProfile}>
                <Field label="Mağaza adı" htmlFor="profile-store">
                  <Input
                    id="profile-store"
                    value={magazaAdi}
                    onChange={(event) => setMagazaAdi(event.target.value)}
                    required
                  />
                </Field>
                <Field label="Telefon" htmlFor="profile-phone">
                  <Input
                    id="profile-phone"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                  />
                </Field>
                <Field label="Adres" htmlFor="profile-address">
                  <Input
                    id="profile-address"
                    value={adres}
                    onChange={(event) => setAdres(event.target.value)}
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Şehir" htmlFor="profile-city">
                    <Input
                      id="profile-city"
                      value={sehir}
                      onChange={(event) => setSehir(event.target.value)}
                    />
                  </Field>
                  <Field label="İlçe" htmlFor="profile-district">
                    <Input
                      id="profile-district"
                      value={ilce}
                      onChange={(event) => setIlce(event.target.value)}
                    />
                  </Field>
                </div>
                <Button className="w-full" variant="premium" disabled={saving}>
                  {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
                  Kaydet
                </Button>
              </form>
            </Card>

            <ProfileActivity
              title="Satıcı özeti"
              emptyTitle="Henüz satıcı hareketi yok."
              rows={[
                `${sellerProducts.length} ürün yayında`,
                `${sellerDemands.filter((demand) => demand.durum === "ACIK").length} açık talep`,
                sellerProfile?.dogrulanmisSatici
                  ? "Satıcı doğrulandı"
                  : "Satıcı doğrulaması bekliyor",
              ]}
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <ProfileActivity
              title="Alıcı talepleri"
              emptyTitle="Henüz talep yok."
              rows={buyerDemands.slice(0, 4).map((demand) =>
                `${demand.urunAdi} · ${demand.durum} · ${formatShortDate(demand.olusturmaTarihi)}`,
              )}
            />
            <ProfileActivity
              title="Favoriler"
              emptyTitle="Henüz favori yok."
              rows={favoriteProducts.slice(0, 4).map((product) => product.adi)}
            />
          </div>
        )}
      </main>
    </ProfileShell>
  );
}

function ProfileShell({
  children,
  onLogout,
}: {
  children: React.ReactNode;
  onLogout?: () => void;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-[#fbfaf7]/96 shadow-[0_8px_24px_rgba(32,39,52,0.06)]">
        <div className="mx-auto flex h-[76px] max-w-[1360px] items-center justify-between gap-3 px-3 sm:px-5">
          <Link href="/">
            <BrandLogo compact />
          </Link>
          {onLogout ? (
            <Button variant="outline" onClick={onLogout} className="bg-white/90">
              <LogOut aria-hidden />
              Çıkış yap
            </Button>
          ) : null}
        </div>
      </header>
      {children}
    </div>
  );
}

function ProfileStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4">
      <Icon className="size-5 text-primary" aria-hidden />
      <p className="mt-3 text-2xl font-black text-brand-brown">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </Card>
  );
}

function ProfilePill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-white/85 px-4 py-3 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-brand-brown">{value}</p>
    </div>
  );
}

function ProfileActivity({
  title,
  emptyTitle,
  rows,
}: {
  title: string;
  emptyTitle: string;
  rows: string[];
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-[#fbfaf7] px-5 py-4">
        <h2 className="font-black text-brand-brown">{title}</h2>
        <Users className="size-5 text-primary" aria-hidden />
      </div>
      {rows.length > 0 ? (
        <div className="divide-y divide-border">
          {rows.map((row) => (
            <p key={row} className="px-5 py-4 text-sm font-semibold">
              {row}
            </p>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center">
          <Inbox className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <p className="mt-3 font-bold">{emptyTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Oturum ilerledikçe burası canlı verilerle dolacak.
          </p>
        </div>
      )}
    </Card>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2 text-sm font-semibold" htmlFor={htmlFor}>
      <span>{label}</span>
      {children}
    </label>
  );
}
