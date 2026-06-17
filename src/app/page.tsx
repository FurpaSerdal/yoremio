import { YoremioMarketplace } from "@/components/yoremio/marketplace";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Store, Truck } from "lucide-react";

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Yöremio",
    url: "https://yoremio.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://yoremio.com/?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main>
        <section className="mx-auto max-w-[1680px] px-4 pt-5 sm:px-6">
          <Card className="relative overflow-hidden border-white/60 bg-white/75 px-5 py-5 shadow-[0_24px_80px_rgba(39,32,17,0.08)] backdrop-blur-xl sm:px-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,138,46,0.15),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(23,90,56,0.11),transparent_30%)]" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="green">
                    <Sparkles className="size-3.5" aria-hidden />
                    Yayın hazır vitrin
                  </Badge>
                  <Badge variant="outline">
                    <ShieldCheck className="size-3.5" aria-hidden />
                    Güven skoru ve canlı chat
                  </Badge>
                </div>
                <h1 className="mt-4 font-serif text-3xl font-black tracking-tight text-brand-brown sm:text-5xl">
                  Yerel üreticiyi, satıcıyı ve alıcıyı tek premium pazarda buluşturur.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-foreground/70 sm:text-base">
                  Yöremio, ürün keşfinden talep ve teklif akışına, güven skoru ve
                  canlı mesajlaşmaya kadar üretim ortamına uygun bütünleşik bir deneyim sunar.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:max-w-2xl lg:flex-1">
                <LaunchCard icon={Store} title="Satıcı paneli" text="Ürün, medya ve kategori yönetimi" />
                <LaunchCard icon={Truck} title="Talep akışı" text="Alıcıdan satıcıya kontrollü mutabakat" />
                <LaunchCard icon={CheckCircle2} title="Canlı operasyon" text="SignalR chat ve okunma bilgileri" />
              </div>
            </div>
            <div className="relative mt-5 flex flex-wrap items-center gap-3 border-t border-border/70 pt-4 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Prod-ready kurgu:</span>
              <span>JWT oturumu</span>
              <ArrowRight className="size-4 text-accent" aria-hidden />
              <span>API response envelope</span>
              <ArrowRight className="size-4 text-accent" aria-hidden />
              <span>Gerçek medya URL desteği</span>
              <ArrowRight className="size-4 text-accent" aria-hidden />
              <span>Yayın öncesi güvenli kullanıcı akışı</span>
            </div>
          </Card>
        </section>

        <YoremioMarketplace />
      </main>
    </>
  );
}

function LaunchCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-background/90 p-4 shadow-sm">
      <Icon className="size-5 text-primary" aria-hidden />
      <p className="mt-3 text-sm font-black text-brand-brown">{title}</p>
      <p className="mt-1 text-xs leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}
