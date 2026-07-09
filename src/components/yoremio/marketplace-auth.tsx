"use client";

import Image from "next/image";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  Check,
  CircleDollarSign,
  ClipboardList,
  Heart,
  ImagePlus,
  Loader2,
  MessageCircle,
  PackagePlus,
  RefreshCw,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/yoremio/brand-logo";
import {
  API_BASE_URL,
  ApiClientError,
  yoremioApi,
  type AppBootstrapDto,
  type LoginResponse,
  type SessionUser,
  type UserRole,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type AuthState = SessionUser & Pick<LoginResponse, "token">;
type AuthMode = "login" | "buyer" | "seller" | "verify";

function apiErrorMessage(error: unknown) {
  return error instanceof ApiClientError
    ? error.message
    : "Beklenmeyen bir hata oluştu.";
}

export function AuthDialog({
  open,
  initialRole,
  bootstrap,
  onClose,
  onAuthenticated,
}: {
  open: boolean;
  initialRole: UserRole;
  bootstrap: AppBootstrapDto | null;
  onClose: () => void;
  onAuthenticated: (user: AuthState) => void;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [magazaAdi, setMagazaAdi] = useState("");
  const [vergiNo, setVergiNo] = useState("");
  const [adres, setAdres] = useState("");
  const [sehir, setSehir] = useState("");
  const [ilce, setIlce] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const devVerificationUrl =
    bootstrap?.features.devVerificationInboxEnabled &&
    bootstrap.verification.devVerificationInboxUrl
      ? `${API_BASE_URL}${bootstrap.verification.devVerificationInboxUrl}`
      : null;

  const chooseLoginRole = (nextRole: UserRole) => {
    setRole(nextRole);
    setMode("login");
    setError(null);
    setMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    setMessage(null);

    try {
      if (mode === "login") {
        const login = await yoremioApi.login(email.trim(), password);
        window.localStorage.setItem("yoremio-token", login.token);
        window.localStorage.setItem("yoremio-user", JSON.stringify(login));

        let fullUser: AuthState = {
          token: login.token,
          userId: login.userId,
          email: login.email,
          userName: login.email,
          role: login.role,
          roles: login.roles,
          emailConfirmed: false,
        };

        try {
          const me = await yoremioApi.me(login.token);
          fullUser = { ...me, token: login.token };
        } catch {
          // Session bootstrap will retry /me after login.
        }

        setStatus("success");
        onAuthenticated(fullUser);
        return;
      }

      if (mode === "buyer") {
        await yoremioApi.registerBuyer({ email: email.trim(), password });
        setMessage("Alıcı kaydı oluşturuldu. Giriş yapabilirsin.");
        setMode("login");
        setPassword("");
      }

      if (mode === "seller") {
        await yoremioApi.registerSeller({
          email: email.trim(),
          password,
          phoneNumber,
          magazaAdi,
          vergiNo,
          adres,
          sehir,
          ilce,
        });
        setMessage(
          "Satıcı kaydı oluşturuldu. Email doğrulaması tamamlanınca giriş yapabilirsin.",
        );
        setMode("login");
        setPassword("");
      }

      if (mode === "verify") {
        await yoremioApi.confirmEmail(email.trim(), verifyCode.trim());
        setMessage("Doğrulama tamamlandı.");
      }

      setStatus("success");
    } catch (caught) {
      setError(apiErrorMessage(caught));
      setStatus("idle");
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setError("Doğrulama mesajı için e-posta gir.");
      return;
    }

    setStatus("loading");
    setError(null);
    setMessage(null);

    try {
      await yoremioApi.resendVerification(email.trim());
      setMessage("Doğrulama mesajı varsa yeniden gönderildi.");
      setStatus("success");
    } catch (caught) {
      setError(apiErrorMessage(caught));
      setStatus("idle");
    }
  };

  const modeTitle =
    mode === "login"
      ? "Giriş yap"
      : mode === "buyer"
        ? "Alıcı kaydı"
        : mode === "seller"
          ? "Satıcı kaydı"
          : "Hesabını doğrula";

  const modeDescription =
    mode === "login"
      ? "Talep, teklif, favori ve chat akışlarına güvenli oturumla devam et."
      : mode === "buyer"
        ? "E-posta ve şifre ile alıcı hesabını oluştur."
        : mode === "seller"
          ? "Mağaza, vergi, adres ve iletişim bilgilerini gir."
          : "E-posta doğrulama kodunu gir.";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-white">
      <div
        className="grid h-[100svh] w-full overflow-hidden border border-border bg-white lg:grid-cols-[minmax(430px,620px)_minmax(0,1fr)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <div className="min-h-0 overflow-y-auto">
          <div className="flex items-start justify-between gap-3 border-b border-border bg-white px-5 py-5 sm:px-7">
            <div className="max-w-xl">
              <BrandLogo compact />
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Güvenli oturum
              </p>
              <h2 id="auth-title" className="mt-1 text-3xl font-black text-brand-brown">
                {modeTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {modeDescription}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} title="Kapat" className="shrink-0">
              <X aria-hidden />
            </Button>
          </div>

          <form className="mx-auto max-w-[560px] space-y-4 p-5 sm:p-7" onSubmit={handleSubmit}>
            <AuthModeTabs
              mode={mode}
              role={role}
              onBuyerLogin={() => chooseLoginRole("ALICI")}
              onSellerLogin={() => chooseLoginRole("SATICI")}
              onBuyerRegister={() => {
                setRole("ALICI");
                setMode("buyer");
              }}
              onSellerRegister={() => {
                setRole("SATICI");
                setMode("seller");
              }}
            />

            {mode === "verify" ? (
              <VerificationFields
                email={email}
                verifyCode={verifyCode}
                onEmailChange={setEmail}
                onCodeChange={setVerifyCode}
              />
            ) : (
              <AccountFields
                mode={mode}
                email={email}
                password={password}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
              />
            )}

            {mode === "seller" ? (
              <SellerRegisterFields
                phoneNumber={phoneNumber}
                magazaAdi={magazaAdi}
                vergiNo={vergiNo}
                adres={adres}
                sehir={sehir}
                ilce={ilce}
                onPhoneNumberChange={setPhoneNumber}
                onMagazaAdiChange={setMagazaAdi}
                onVergiNoChange={setVergiNo}
                onAdresChange={setAdres}
                onSehirChange={setSehir}
                onIlceChange={setIlce}
              />
            ) : null}

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                {message}
              </div>
            ) : null}

            {mode === "login" || mode === "seller" ? (
              <div className="flex flex-col gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground">
                  Satıcı doğrulaması gelmediyse e-postanı yazıp tekrar iste.
                </p>
                <div className="flex flex-wrap gap-2">
                  {devVerificationUrl ? (
                    <a
                      href={devVerificationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center rounded-md px-2 text-xs font-black text-primary underline-offset-4 hover:underline"
                    >
                      Dev kutusu
                    </a>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleResendVerification}
                    disabled={status === "loading"}
                  >
                    <RefreshCw aria-hidden />
                    Tekrar gönder
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setMode(mode === "verify" ? "login" : "verify")}
              >
                <ShieldCheck aria-hidden />
                {mode === "verify" ? "Girişe dön" : "Doğrulama ekranı"}
              </Button>
              <Button type="submit" disabled={status === "loading"}>
                {status === "loading" ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden />
                    İşleniyor
                  </>
                ) : (
                  <>
                    <Check aria-hidden />
                    {mode === "login" ? "Giriş yap" : "Gönder"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        <AuthMockupPanel mode={mode} />
      </div>
    </div>
  );
}

function AuthModeTabs({
  mode,
  role,
  onBuyerLogin,
  onSellerLogin,
  onBuyerRegister,
  onSellerRegister,
}: {
  mode: AuthMode;
  role: UserRole;
  onBuyerLogin: () => void;
  onSellerLogin: () => void;
  onBuyerRegister: () => void;
  onSellerRegister: () => void;
}) {
  const tabs = [
    { label: "Alıcı", active: mode === "login" && role === "ALICI", onClick: onBuyerLogin },
    { label: "Satıcı", active: mode === "login" && role === "SATICI", onClick: onSellerLogin },
    { label: "Alıcı kayıt", active: mode === "buyer", onClick: onBuyerRegister },
    { label: "Satıcı kayıt", active: mode === "seller", onClick: onSellerRegister },
  ];

  return (
    <div className="grid rounded-md border border-border bg-muted/60 p-1 sm:grid-cols-4">
      {tabs.map((tab) => (
        <button
          key={tab.label}
          type="button"
          onClick={tab.onClick}
          className={cn(
            "h-9 rounded-sm px-3 text-sm font-black transition-colors",
            tab.active
              ? "bg-white text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function AccountFields({
  mode,
  email,
  password,
  onEmailChange,
  onPasswordChange,
}: {
  mode: AuthMode;
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="E-posta" htmlFor="login-email">
        <Input
          id="login-email"
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          autoComplete="email"
          placeholder="ornek@mail.com"
          required
        />
      </Field>
      <Field label="Şifre" htmlFor="login-password">
        <Input
          id="login-password"
          type="password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder="En az 8 karakter"
          required
        />
      </Field>
    </div>
  );
}

function VerificationFields({
  email,
  verifyCode,
  onEmailChange,
  onCodeChange,
}: {
  email: string;
  verifyCode: string;
  onEmailChange: (value: string) => void;
  onCodeChange: (value: string) => void;
}) {
  return (
    <div className="mx-auto grid w-full max-w-md gap-3">
      <div className="grid place-items-center rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-5 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-white text-primary shadow-sm">
          <ShieldCheck className="size-7" aria-hidden />
        </span>
        <p className="mt-3 text-sm font-semibold text-muted-foreground">
          E-posta adresine gelen 6 haneli kodu gir.
        </p>
      </div>
      <Field label="E-posta" htmlFor="verify-email">
        <Input
          id="verify-email"
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          autoComplete="email"
          placeholder="ornek@mail.com"
          required
        />
      </Field>
      <Field label="Kod" htmlFor="verify-code">
        <Input
          id="verify-code"
          value={verifyCode}
          onChange={(event) => onCodeChange(event.target.value)}
          placeholder="123456"
          inputMode="numeric"
          required
        />
      </Field>
    </div>
  );
}

function SellerRegisterFields({
  phoneNumber,
  magazaAdi,
  vergiNo,
  adres,
  sehir,
  ilce,
  onPhoneNumberChange,
  onMagazaAdiChange,
  onVergiNoChange,
  onAdresChange,
  onSehirChange,
  onIlceChange,
}: {
  phoneNumber: string;
  magazaAdi: string;
  vergiNo: string;
  adres: string;
  sehir: string;
  ilce: string;
  onPhoneNumberChange: (value: string) => void;
  onMagazaAdiChange: (value: string) => void;
  onVergiNoChange: (value: string) => void;
  onAdresChange: (value: string) => void;
  onSehirChange: (value: string) => void;
  onIlceChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Telefon" htmlFor="seller-phone">
        <Input id="seller-phone" value={phoneNumber} onChange={(event) => onPhoneNumberChange(event.target.value)} required />
      </Field>
      <Field label="Mağaza adı" htmlFor="seller-store">
        <Input id="seller-store" value={magazaAdi} onChange={(event) => onMagazaAdiChange(event.target.value)} required />
      </Field>
      <Field label="Vergi no" htmlFor="seller-tax">
        <Input id="seller-tax" value={vergiNo} onChange={(event) => onVergiNoChange(event.target.value)} required />
      </Field>
      <Field label="Adres" htmlFor="seller-address">
        <Input id="seller-address" value={adres} onChange={(event) => onAdresChange(event.target.value)} />
      </Field>
      <Field label="Şehir" htmlFor="seller-city">
        <Input id="seller-city" value={sehir} onChange={(event) => onSehirChange(event.target.value)} />
      </Field>
      <Field label="İlçe" htmlFor="seller-district">
        <Input id="seller-district" value={ilce} onChange={(event) => onIlceChange(event.target.value)} />
      </Field>
    </div>
  );
}

function AuthMockupPanel({ mode }: { mode: AuthMode }) {
  const features =
    mode === "seller"
      ? [
          { icon: PackagePlus, label: "Ürünlerini ekle" },
          { icon: ImagePlus, label: "Medya yükle" },
          { icon: ClipboardList, label: "Talepleri al" },
          { icon: CircleDollarSign, label: "Teklifleri yönet" },
          { icon: MessageCircle, label: "Satıcıya yaz" },
        ]
      : [
          { icon: Heart, label: "Favoriler" },
          { icon: ClipboardList, label: "Talepler" },
          { icon: MessageCircle, label: "Mesajlar" },
          { icon: Star, label: "Puanla" },
        ];

  return (
    <div className="relative hidden min-h-[100svh] overflow-hidden border-l border-border bg-white lg:block">
      <Image src="/hero-market-1600.jpg" alt="" fill sizes="680px" className="object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.10)_48%,rgba(0,0,0,0.28))]" />
      <div className="relative flex h-full flex-col justify-between p-8">
        <div className="max-w-xl rounded-lg border border-white/60 bg-white/86 p-5 shadow-[0_14px_36px_rgba(16,24,18,0.16)] backdrop-blur">
          <BrandLogo compact />
          <h3 className="mt-5 max-w-xl text-3xl font-black leading-tight text-brand-brown">
            {mode === "seller"
              ? "Yöremio ile satıcı paneli talep, teklif ve chat merkezli çalışır."
              : mode === "verify"
                ? "Doğrulama tamamlanınca güvenli oturum akışları açılır."
                : "Yerel ürünleri keşfet, üreticilerle doğrudan bağlan."}
          </h3>
          <div className="mt-6 flex flex-wrap gap-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <span
                  key={feature.label}
                  className="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-white/95 px-3 text-sm font-black text-brand-brown shadow-sm"
                >
                  <Icon className="size-4 text-primary" aria-hidden />
                  {feature.label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              "/products/photo-yayla-bali.jpg",
              "/products/photo-tulum-peyniri.jpg",
              "/products/photo-koy-yumurtasi.jpg",
            ].map((src, index) => (
              <div key={src} className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
                <div className="relative aspect-[4/3]">
                  <Image src={src} alt="" fill sizes="180px" className="object-cover" />
                  <Heart className="absolute right-2 top-2 size-5 rounded-full bg-white/90 p-1 text-red-600" aria-hidden />
                </div>
                <div className="p-3">
                  <p className="line-clamp-1 text-sm font-black text-brand-brown">
                    {index === 0 ? "Süzme Çiçek Balı" : index === 1 ? "Ezine Peyniri" : "Köy Yumurtası"}
                  </p>
                  <p className="mt-1 text-sm font-black text-primary">
                    {index === 0 ? "250 TL" : index === 1 ? "210 TL" : "70 TL"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-3 rounded-lg border border-white/60 bg-white/92 p-4 shadow-[0_14px_36px_rgba(16,24,18,0.16)] backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black text-brand-brown">
                  {mode === "verify" ? "Doğrulama durumu" : "Canlı API akışları"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {mode === "verify"
                    ? "Kod, tekrar gönderme ve dev kutusu desteklenir."
                    : "Talep, teklif, yorum, puan ve chat aynı modelde ilerler."}
                </p>
              </div>
              <Badge variant={mode === "verify" ? "gold" : "green"}>
                {mode === "verify" ? "Bekliyor" : "Aktif"}
              </Badge>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <MiniMockStat icon={ShieldCheck} label="Güven" value="92" />
              <MiniMockStat icon={ClipboardList} label="Talep" value="12" />
              <MiniMockStat icon={MessageCircle} label="Mesaj" value="2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniMockStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <Icon className="size-4 text-primary" aria-hidden />
      <p className="mt-2 text-xl font-black text-brand-brown">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2 text-sm font-semibold" htmlFor={htmlFor}>
      <span>{label}</span>
      {children}
    </label>
  );
}
