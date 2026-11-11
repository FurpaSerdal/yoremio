"use client";

import Image from "next/image";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Check,
  Inbox,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/yoremio/brand-logo";
import {
  Field,
  InputIcon,
  LocationFields,
  PasswordInput,
  StatusBox,
} from "@/components/yoremio/ui-kit";
import { apiErrorInfo, type AuthCompleteOptions, type Screen, type ToastKind } from "@/components/yoremio/types";
import {
  yoremioApi,
  type BootstrapLocationDto,
  type DevVerificationMessageDto,
  type LoginResponse,
} from "@/lib/api";
import { cn, digitsOnly, limitText, phoneInput } from "@/lib/utils";

const demoAccounts = [
  {
    role: "Alıcı",
    name: "Elif Demir",
    email: "elif@demo.yoremio.local",
    tone: "bg-emerald-50 text-primary border-emerald-200",
  },
  {
    role: "Üretici / Satıcı",
    name: "Ayşe'nin Köy Sepeti",
    email: "ayse@demo.yoremio.local",
    tone: "bg-amber-50 text-amber-800 border-amber-200",
  },
  {
    role: "Yönetici (Admin)",
    name: "Platform Admin",
    email: "admin@demo.yoremio.local",
    tone: "bg-slate-100 text-slate-800 border-slate-200",
  },
] as const;

function AuthErrorBanner({
  error,
  traceId,
}: {
  error: string | null;
  traceId?: string | null;
}) {
  if (!error) return null;
  return (
    <div
      className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700"
      role="alert"
    >
      <p>{error}</p>
      {traceId ? (
        <p className="mt-1 font-mono text-[11px] text-red-600/90">traceId: {traceId}</p>
      ) : null}
    </div>
  );
}

function firstFieldError(
  fieldErrors: Record<string, string[]> | null | undefined,
  keys: string[],
) {
  if (!fieldErrors) return undefined;
  for (const key of keys) {
    const match = Object.keys(fieldErrors).find(
      (k) => k.toLowerCase() === key.toLowerCase(),
    );
    if (match && fieldErrors[match]?.[0]) return fieldErrors[match][0];
  }
  return undefined;
}

export function LoginScreen({
  onBack,
  onNavigate,
  onAuthComplete,
  onNeedsVerification,
  showToast,
}: {
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
  onAuthComplete: (
    login: LoginResponse,
    persistent: boolean,
    options?: AuthCompleteOptions,
  ) => Promise<void> | void;
  onNeedsVerification: (email: string) => void;
  showToast: (message: string, kind: ToastKind, traceId?: string | null) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [traceId, setTraceId] = useState<string | null>(null);
  const [demoExpanded, setDemoExpanded] = useState(false);

  const performLogin = async (targetEmail: string, targetPassword: string) => {
    setError(null);
    setTraceId(null);
    setLoading(true);
    try {
      const login = await yoremioApi.login(targetEmail.trim(), targetPassword);
      await onAuthComplete(login, remember);
    } catch (err) {
      const info = apiErrorInfo(err);
      setError(info.message);
      setTraceId(info.traceId ?? null);
      if (info.status === 403 && targetEmail.trim()) {
        onNeedsVerification(targetEmail.trim());
      } else {
        showToast(info.message, "error", info.traceId);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void performLogin(email, password);
  };

  return (
    <AuthShell
      title="Yöremio hesabına giriş yap"
      subtitle="Üreticilerden doğrudan teklif almak, taleplerini yönetmek ve canlı sohbete bağlanmak için oturum aç."
      imageAlt="Yöresel üretici pazarı"
      onBack={onBack}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthErrorBanner error={error} traceId={traceId} />

        <Field label="E-posta Adresi" htmlFor="login-email">
          <InputIcon icon={Mail}>
            <Input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ornek@yoremio.com"
              className="pl-11"
            />
          </InputIcon>
        </Field>

        <Field label="Şifre" htmlFor="login-password">
          <PasswordInput
            id="login-password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Şifreni gir"
          />
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
          <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="size-4 accent-primary"
            />
            Oturumu bu cihazda açık tut
          </label>
          <button
            type="button"
            onClick={() => onNavigate("verify")}
            className="text-primary hover:underline"
          >
            E-posta doğrulama kodu gir
          </button>
        </div>

        <Button type="submit" size="lg" className="w-full rounded-xl font-extrabold" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </Button>

        {/* Demo Accounts Quick Helper */}
        <div className="rounded-2xl border border-emerald-200/80 bg-[#f6fbf6] p-3.5">
          <button
            type="button"
            onClick={() => setDemoExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between text-left text-xs font-black text-primary"
          >
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-4" aria-hidden />
              Demo Hesaplar ile Hızlı Sunum Girişi
            </span>
            <span>{demoExpanded ? "Gizle" : "Göster"}</span>
          </button>

          {demoExpanded ? (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] text-muted-foreground">
                Tüm demo hesap şifresi: <code className="font-bold text-foreground">Test123!</code>
              </p>
              <div className="grid gap-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setEmail(acc.email);
                      setPassword("Test123!");
                      void performLogin(acc.email, "Test123!");
                    }}
                    className="flex items-center justify-between rounded-xl border border-border bg-white px-3 py-2 text-left transition hover:border-primary/40 hover:bg-emerald-50/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-brand-brown">{acc.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{acc.email}</p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black",
                        acc.tone,
                      )}
                    >
                      {acc.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-2 border-t border-border pt-4 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl text-xs font-extrabold"
            onClick={() => onNavigate("buyer-register")}
          >
            Alıcı Olarak Kayıt Ol
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="rounded-xl text-xs font-extrabold"
            onClick={() => onNavigate("seller-register")}
          >
            Üretici / Mağaza Aç
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}

export function BuyerRegisterScreen({
  locations = [],
  cities = [],
  onBack,
  onNavigate,
  onRegistered,
  showToast,
}: {
  locations?: BootstrapLocationDto[];
  cities?: string[];
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
  onRegistered: (email: string) => void;
  showToast: (message: string, kind: ToastKind, traceId?: string | null) => void;
}) {
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [adres, setAdres] = useState("");
  const [showProfileFields, setShowProfileFields] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [traceId, setTraceId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setTraceId(null);
    setFieldErrors(null);
    setLoading(true);

    try {
      await yoremioApi.registerBuyer({
        email: email.trim(),
        password,
        userName: userName.trim() || undefined,
        sehir: city.trim() || undefined,
        ilce: district.trim() || undefined,
        adres: adres.trim() || undefined,
      });
      showToast("Kayıt başarılı! E-posta doğrulama adımına yönlendirildin.", "success");
      onRegistered(email.trim());
    } catch (err) {
      const info = apiErrorInfo(err);
      setError(info.message);
      setTraceId(info.traceId ?? null);
      setFieldErrors(info.fieldErrors ?? null);
      showToast(info.message, "error", info.traceId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Alıcı Hesabı Oluştur"
      subtitle="Doğal ürünlere talep aç, üreticilerle canlı sohbet et ve favorilerini kaydet."
      imageAlt="Taze köy ürünleri"
      onBack={onBack}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthErrorBanner error={error} traceId={traceId} />

        <Field
          label="E-posta *"
          htmlFor="buyer-email"
          error={firstFieldError(fieldErrors, ["Email"])}
        >
          <InputIcon icon={Mail}>
            <Input
              id="buyer-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="alici@ornek.com"
              className="pl-11"
            />
          </InputIcon>
        </Field>

        <Field
          label="Kullanıcı Adı (İsteğe Bağlı)"
          htmlFor="buyer-username"
          error={firstFieldError(fieldErrors, ["UserName"])}
        >
          <InputIcon icon={UserRound}>
            <Input
              id="buyer-username"
              minLength={3}
              value={userName}
              onChange={(event) => setUserName(limitText(event.target.value, 50))}
              placeholder="Ör: alici_ayse (yorumlarda görünür)"
              className="pl-11"
            />
          </InputIcon>
        </Field>

        <Field
          label="Şifre *"
          htmlFor="buyer-password"
          error={firstFieldError(fieldErrors, ["Password"])}
        >
          <PasswordInput
            id="buyer-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="En az 8 karakter, büyük/küçük harf, rakam ve sembol"
          />
        </Field>

        <div className="rounded-xl border border-border bg-[#f8fbf7] p-3">
          <button
            type="button"
            onClick={() => setShowProfileFields((prev) => !prev)}
            className="flex w-full items-center justify-between text-left text-xs font-extrabold text-primary"
          >
            <span>Konum & Teslimat Bölgesi Ekle (Kişiselleştirilmiş Öneriler)</span>
            <span>{showProfileFields ? "Gizle" : "Göster"}</span>
          </button>

          {showProfileFields ? (
            <div className="mt-3 space-y-3 border-t border-border/70 pt-3">
              <LocationFields
                compact
                city={city}
                district={district}
                onCityChange={setCity}
                onDistrictChange={setDistrict}
                locations={locations}
                cities={cities}
                cityPlaceholder="Ör: İstanbul"
                districtPlaceholder="Ör: Kadıköy"
                cityId="buyer-reg-city"
                districtId="buyer-reg-district"
              />
              <Field
                label="Adres"
                htmlFor="buyer-adres"
                error={firstFieldError(fieldErrors, ["Adres"])}
              >
                <Input
                  id="buyer-adres"
                  value={adres}
                  onChange={(event) => setAdres(limitText(event.target.value, 200))}
                  placeholder="Mahalle, cadde bilgisi (opsiyonel)"
                />
              </Field>
            </div>
          ) : null}
        </div>

        <Button type="submit" size="lg" className="w-full rounded-xl font-extrabold" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {loading ? "Hesap oluşturuluyor..." : "Alıcı Kaydını Tamamla"}
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs font-bold">
          <button
            type="button"
            onClick={() => onNavigate("login")}
            className="text-primary hover:underline"
          >
            Zaten hesabın var mı? Giriş yap
          </button>
          <button
            type="button"
            onClick={() => onNavigate("seller-register")}
            className="text-brand-brown hover:underline"
          >
            Üretici / Satıcı Kaydı
          </button>
        </div>
      </form>
    </AuthShell>
  );
}

export function SellerRegisterScreen({
  locations = [],
  cities = [],
  onBack,
  onNavigate,
  onRegistered,
  showToast,
}: {
  locations?: BootstrapLocationDto[];
  cities?: string[];
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
  onRegistered: (email: string) => void;
  showToast: (message: string, kind: ToastKind, traceId?: string | null) => void;
}) {
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [magazaAdi, setMagazaAdi] = useState("");
  const [vergiNo, setVergiNo] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [traceId, setTraceId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setTraceId(null);
    setFieldErrors(null);

    const cleanedTax = digitsOnly(vergiNo);
    if (cleanedTax.length !== 11) {
      setError("Vergi / T.C. kimlik numarası 11 haneli olmalıdır.");
      return;
    }

    setLoading(true);
    try {
      await yoremioApi.registerSeller({
        email: email.trim(),
        password,
        phoneNumber: phoneNumber.trim(),
        magazaAdi: magazaAdi.trim(),
        vergiNo: cleanedTax,
        sehir: city.trim() || undefined,
        ilce: district.trim() || undefined,
      });
      showToast("Mağaza kaydın oluşturuldu! E-posta doğrulamasına geçiliyor.", "success");
      onRegistered(email.trim());
    } catch (err) {
      const info = apiErrorInfo(err);
      setError(info.message);
      setTraceId(info.traceId ?? null);
      setFieldErrors(info.fieldErrors ?? null);
      showToast(info.message, "error", info.traceId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Üretici / Satıcı Mağazası Aç"
      subtitle="Ürünlerini doğrudan sergile, alıcı taleplerine fiyat teklifi ver ve güven puanı kazan."
      imageAlt="Yöresel üretici mağazası"
      onBack={onBack}
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <AuthErrorBanner error={error} traceId={traceId} />

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Mağaza Adı *"
            htmlFor="seller-store"
            error={firstFieldError(fieldErrors, ["MagazaAdi"])}
          >
            <InputIcon icon={Store}>
              <Input
                id="seller-store"
                required
                minLength={3}
                value={magazaAdi}
                onChange={(event) => setMagazaAdi(limitText(event.target.value, 80))}
                placeholder="Karadeniz Yayla Evi"
                className="pl-11"
              />
            </InputIcon>
          </Field>

          <Field
            label="Vergi / Kimlik No (11 hane) *"
            htmlFor="seller-tax"
            error={firstFieldError(fieldErrors, ["VergiNo"])}
          >
            <InputIcon icon={Building2}>
              <Input
                id="seller-tax"
                required
                inputMode="numeric"
                value={vergiNo}
                onChange={(event) => setVergiNo(digitsOnly(event.target.value).slice(0, 11))}
                placeholder="11 haneli numara"
                className="pl-11 tabular-nums"
              />
            </InputIcon>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="E-posta *"
            htmlFor="seller-email"
            error={firstFieldError(fieldErrors, ["Email"])}
          >
            <InputIcon icon={Mail}>
              <Input
                id="seller-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="uretici@ornek.com"
                className="pl-11"
              />
            </InputIcon>
          </Field>

          <Field
            label="Telefon *"
            htmlFor="seller-phone"
            error={firstFieldError(fieldErrors, ["PhoneNumber"])}
          >
            <InputIcon icon={Phone}>
              <Input
                id="seller-phone"
                required
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(phoneInput(event.target.value))}
                placeholder="0555 123 45 67"
                className="pl-11 tabular-nums"
              />
            </InputIcon>
          </Field>
        </div>

        <LocationFields
          city={city}
          district={district}
          onCityChange={setCity}
          onDistrictChange={setDistrict}
          locations={locations}
          cities={cities}
          cityPlaceholder="Trabzon"
          districtPlaceholder="Maçka"
          cityId="seller-city"
          districtId="seller-district"
        />

        <Field
          label="Şifre *"
          htmlFor="seller-password"
          error={firstFieldError(fieldErrors, ["Password"])}
        >
          <PasswordInput
            id="seller-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="En az 8 karakter, büyük/küçük harf, rakam ve sembol"
          />
        </Field>

        <Button type="submit" size="lg" className="w-full rounded-xl font-extrabold" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {loading ? "Mağaza kaydediliyor..." : "Üretici Kaydını Tamamla"}
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs font-bold">
          <button
            type="button"
            onClick={() => onNavigate("login")}
            className="text-primary hover:underline"
          >
            Giriş ekranına dön
          </button>
          <button
            type="button"
            onClick={() => onNavigate("buyer-register")}
            className="text-brand-brown hover:underline"
          >
            Alıcı hesabı aç
          </button>
        </div>
      </form>
    </AuthShell>
  );
}

export function VerificationScreen({
  initialEmail,
  devVerificationInboxEnabled = false,
  onBack,
  onNavigate,
  showToast,
}: {
  initialEmail: string;
  devVerificationInboxEnabled?: boolean;
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
  showToast: (message: string, kind: ToastKind, traceId?: string | null) => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxMessages, setInboxMessages] = useState<DevVerificationMessageDto[]>([]);

  const handleConfirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await yoremioApi.confirmEmail(email.trim(), digitsOnly(code));
      setVerified(true);
      showToast("E-posta doğrulandı! Artık giriş yapabilirsin.", "success");
    } catch (err) {
      const info = apiErrorInfo(err);
      setError(info.message);
      showToast(info.message, "error", info.traceId);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      showToast("Önce e-posta adresini yazmalısın.", "info");
      return;
    }
    setLoading(true);
    try {
      await yoremioApi.resendVerification(email.trim());
      showToast("Yeni doğrulama kodu gönderildi.", "success");
      if (devVerificationInboxEnabled) {
        void loadDevInbox();
      }
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
    } finally {
      setLoading(false);
    }
  };

  const loadDevInbox = async () => {
    setInboxLoading(true);
    try {
      const items = await yoremioApi.devVerificationMessages();
      setInboxMessages(items);
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
    } finally {
      setInboxLoading(false);
    }
  };

  const clearDevInbox = async () => {
    try {
      await yoremioApi.clearDevVerificationMessages();
      setInboxMessages([]);
      showToast("Dev doğrulama kutusu temizlendi.", "info");
    } catch (err) {
      const info = apiErrorInfo(err);
      showToast(info.message, "error", info.traceId);
    }
  };

  return (
    <AuthShell
      title="E-posta Doğrulama"
      subtitle="Hesabını aktifleştirmek için e-postana gelen 6 haneli doğrulama kodunu gir veya linke tıkla."
      imageAlt="Yöremio e-posta doğrulama"
      onBack={onBack}
    >
      <div className="space-y-4">
        {verified ? (
          <>
            <StatusBox
              kind="success"
              title="Hesabın Doğrulandı!"
              text="E-posta doğrulaman başarıyla tamamlandı. Şimdi giriş yaparak platformu kullanabilirsin."
            />
            <Button
              type="button"
              size="lg"
              className="w-full rounded-xl font-extrabold"
              onClick={() => onNavigate("login")}
            >
              Giriş Ekranına Geç
            </Button>
          </>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-4">
            <AuthErrorBanner error={error} />

            <Field label="E-posta Adresi" htmlFor="verify-email">
              <InputIcon icon={Mail}>
                <Input
                  id="verify-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ornek@yoremio.com"
                  className="pl-11"
                />
              </InputIcon>
            </Field>

            <Field label="6 Haneli Doğrulama Kodu" htmlFor="verify-code">
              <InputIcon icon={KeyRound}>
                <Input
                  id="verify-code"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(digitsOnly(event.target.value).slice(0, 6))}
                  placeholder="123456"
                  className="pl-11 font-mono text-lg tracking-widest"
                />
              </InputIcon>
            </Field>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="submit"
                size="lg"
                className="flex-1 rounded-xl font-extrabold"
                disabled={loading}
              >
                <BadgeCheck className="size-4" aria-hidden />
                {loading ? "Doğrulanıyor..." : "Kodu Onayla"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="rounded-xl font-bold"
                disabled={loading}
                onClick={handleResend}
              >
                <RefreshCw className="size-4" aria-hidden />
                Tekrar Gönder
              </Button>
            </div>
          </form>
        )}

        {/* Dev Verification Inbox Panel (when enabled on backend) */}
        {devVerificationInboxEnabled ? (
          <Card className="border-emerald-200 bg-[#f6fbf6] p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-primary">
                <Inbox className="size-4" aria-hidden />
                Geliştirici Doğrulama Kutusu (Dev Inbox)
              </span>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={loadDevInbox} disabled={inboxLoading}>
                  <RefreshCw className={cn("size-3.5", inboxLoading && "animate-spin")} />
                  Yenile
                </Button>
                {inboxMessages.length > 0 ? (
                  <Button type="button" variant="ghost" size="sm" onClick={clearDevInbox}>
                    <Trash2 className="size-3.5 text-red-600" />
                  </Button>
                ) : null}
              </div>
            </div>

            {inboxMessages.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Son gönderilen kodları görmek için &quot;Yenile&quot; butonuna bas.
              </p>
            ) : (
              <div className="mt-2.5 max-h-44 space-y-2 overflow-y-auto">
                {inboxMessages.map((msg) => {
                  const codeMatch = msg.body.match(/\b(\d{6})\b/);
                  const extractedCode = codeMatch?.[1];
                  return (
                    <div key={msg.id} className="rounded-xl border border-border bg-white p-2.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-black text-brand-brown">{msg.to}</span>
                        {extractedCode ? (
                          <button
                            type="button"
                            onClick={() => {
                              setEmail(msg.to);
                              setCode(extractedCode);
                            }}
                            className="rounded bg-emerald-100 px-2 py-0.5 font-mono font-black text-primary hover:bg-emerald-200"
                          >
                            Kodu Kullan: {extractedCode}
                          </button>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">{msg.subject}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        ) : null}
      </div>
    </AuthShell>
  );
}

function AuthShell({
  title,
  subtitle,
  imageAlt,
  onBack,
  children,
}: {
  title: string;
  subtitle: string;
  imageAlt: string;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f4f7f3] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-5 flex items-center justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={onBack} className="font-bold">
            <ArrowLeft className="size-4" aria-hidden />
            Ana Sayfaya Dön
          </Button>
          <BrandLogo compact />
        </div>

        <Card className="grid overflow-hidden rounded-3xl border-border bg-white shadow-[0_24px_60px_rgba(16,24,40,0.08)] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0e3f27] p-8 text-white lg:flex">
            <Image
              src="/hero-market-1600.jpg"
              alt={imageAlt}
              fill
              sizes="500px"
              className="object-cover opacity-25"
            />
            <div className="relative z-10 space-y-4">
              <Badge variant="green" className="border-white/20 bg-white/15 text-white">
                <ShieldCheck className="mr-1 size-3.5" aria-hidden />
                Doğrulanmış Üretici Ağı
              </Badge>
              <h2 className="font-serif text-3xl leading-tight font-bold">
                Köyden Sofraya Aracısız Bağlantı
              </h2>
              <p className="text-sm leading-6 text-emerald-50/90">
                Yöremio&apos;da tüm süreç şeffaftır: üreticiyi seç, ihtiyacına göre talep oluştur, teklifi onayla ve anlık sohbetle anlaş.
              </p>
            </div>

            <ul className="relative z-10 space-y-2.5 text-xs font-bold text-emerald-50/90">
              <li className="flex items-center gap-2">
                <Check className="size-4 text-emerald-300" aria-hidden />
                Sepet karmaşası olmadan doğrudan talep & teklif
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4 text-emerald-300" aria-hidden />
                Gerçek zamanlı SignalR mesajlaşma ve bildirimler
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4 text-emerald-300" aria-hidden />
                Güven puanlı ve onaylı yerel satıcı profilleri
              </li>
            </ul>
          </div>

          <div className="p-5 sm:p-8 lg:p-10">
            <h1 className="font-serif text-2xl font-bold text-[#14271c] sm:text-3xl">{title}</h1>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </Card>
      </div>
    </main>
  );
}
