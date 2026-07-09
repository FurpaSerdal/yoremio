"use client";

import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Heart,
  Leaf,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  mediaUrl,
  type CategoryDto,
  type FeaturedSellerDto,
  type ProductDto,
} from "@/lib/api";
import { cn, formatPrice } from "@/lib/utils";

const productPlaceholderImage = "/products/product-placeholder.svg";

const categoryImages = [
  "/products/photo-tulum-peyniri.jpg",
  "/products/photo-yayla-bali.jpg",
  "/products/photo-koy-yumurtasi.jpg",
  "/products/photo-tarla-domatesi.jpg",
  "/products/photo-kocbasi-nohut.jpg",
  "/products/photo-amasya-elmasi.jpg",
];

function mediaImageSrc(path?: string | null) {
  const image = path?.trim();
  if (!image) return productPlaceholderImage;
  if (image.startsWith("/products/")) return image;
  return mediaUrl(image) || productPlaceholderImage;
}

function productImage(product: ProductDto) {
  return mediaImageSrc(product.resimler?.[0]?.url);
}

function sellerName(product: ProductDto) {
  return product.saticiMagazaAdi ?? "Yöremio satıcısı";
}

function sellerCoverImage(seller: FeaturedSellerDto) {
  return mediaImageSrc(seller.kapakResimUrl);
}

function featuredSellerLocation(seller: FeaturedSellerDto) {
  const parts = [seller.sehir, seller.ilce].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "Konum belirtilmedi";
}

export function PublicHomeHero({
  categories,
  activeId,
  selectedCategory,
  onSelectCategory,
}: {
  categories: CategoryDto[];
  activeId: number | "all";
  selectedCategory?: CategoryDto;
  onSelectCategory: (value: number | "all") => void;
}) {
  return (
    <section className="relative border-b border-border bg-[linear-gradient(180deg,#ffffff_0%,#fbfbf8_100%)] pb-8">
      <div className="relative min-h-[310px] overflow-hidden sm:min-h-[360px] lg:min-h-[400px]">
        <Image
          src="/hero-market-1600.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(9,18,11,0.08)_42%,rgba(7,12,9,0.18)_100%)]" />
        <div className="absolute inset-0 flex items-center justify-center px-4 pb-12 text-center">
          <div className="max-w-4xl">
            <p className="mb-4 text-sm font-black uppercase tracking-[0.28em] text-white/84 sm:text-base">
              Yöremio pazarı
            </p>
            <h1 className="font-serif text-4xl font-black leading-none text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.42)] sm:text-6xl lg:text-7xl">
              Yerel ürünler
            </h1>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-16 max-w-[920px] px-4 sm:-mt-[72px] lg:max-w-[980px]">
        <CategoryShelf
          categories={categories}
          activeId={activeId}
          selectedCategory={selectedCategory}
          onSelect={onSelectCategory}
          elevated
        />
      </div>
    </section>
  );
}

export function HomePromiseBar() {
  return (
    <div className="grid gap-3 rounded-[20px] border border-border/70 bg-white px-3 py-3 shadow-[0_10px_24px_rgba(16,24,40,0.06)] sm:grid-cols-2 lg:grid-cols-4">
      <HeroPromise icon={Leaf} title="Yerel üreticiden" text="Taze ve doğal ürünleri keşfet." />
      <HeroPromise icon={ShieldCheck} title="Güvenli alışveriş" text="Doğrulanmış satıcı sinyalleri." />
      <HeroPromise icon={MessageCircle} title="Satıcıyla konuş" text="Talep, teklif ve chat akışı." />
      <HeroPromise icon={Heart} title="Doğaya saygılı" text="Bölgesel üretime destek." />
    </div>
  );
}

function HeroPromise({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="flex min-w-0 items-center justify-center gap-4 rounded-[18px] bg-white p-3">
      <span className="grid size-12 shrink-0 place-items-center rounded-full border border-emerald-100 bg-emerald-50 text-primary shadow-[0_4px_12px_rgba(16,24,40,0.05)]">
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-base font-bold text-brand-brown">{title}</span>
        <span className="line-clamp-2 text-sm leading-5 text-muted-foreground">{text}</span>
      </span>
    </div>
  );
}

export function CategoryShelf({
  categories,
  activeId,
  onSelect,
  selectedCategory,
  elevated = false,
}: {
  categories: CategoryDto[];
  activeId: number | "all";
  onSelect: (value: number | "all") => void;
  selectedCategory?: CategoryDto;
  elevated?: boolean;
}) {
  return (
    <div
      className={cn(
        "px-3 py-3",
        elevated
          ? "rounded-[24px] border border-border bg-white/96 shadow-[0_16px_36px_rgba(16,24,18,0.12)]"
          : "y-card",
      )}
    >
      {!elevated ? (
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black tracking-normal text-brand-brown">
              Popüler Kategoriler
            </h2>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {selectedCategory?.aciklama ??
                "Sebze, meyve, süt ürünleri, bakliyat ve kahvaltılık"}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onSelect("all")}>
            <ArrowRight aria-hidden />
            Tüm Kategoriler
          </Button>
        </div>
      ) : null}
      <div
        className={cn(
          "scroll-shelf flex gap-3 overflow-x-auto pb-1",
          elevated ? "justify-start sm:justify-center" : "mt-3",
        )}
      >
        <CategoryChip
          active={activeId === "all"}
          imageSrc="/hero-market.png"
          label="Tümü"
          onClick={() => onSelect("all")}
        />
        {categories.map((category, index) => {
          const imageSrc = categoryImages[(category.id + index) % categoryImages.length];
          return (
            <CategoryChip
              key={category.id}
              active={activeId === category.id}
              imageSrc={imageSrc}
              label={category.adi}
              onClick={() => onSelect(category.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function CategoryChip({
  active,
  imageSrc,
  label,
  onClick,
}: {
  active: boolean;
  imageSrc: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-[116px] shrink-0 snap-start flex-col items-center gap-2 rounded-[18px] border p-2.5 text-center outline-none transition-colors",
        active
          ? "border-primary/25 bg-secondary text-primary shadow-sm"
          : "border-border/70 bg-white text-foreground hover:border-primary/30 hover:text-primary",
      )}
    >
      <span
        className={cn(
          "relative size-12 overflow-hidden rounded-full border bg-secondary transition-colors",
          active
            ? "border-primary ring-4 ring-primary/10"
            : "border-border group-hover:border-primary/50",
        )}
      >
        <Image src={imageSrc} alt="" fill sizes="80px" className="object-cover" />
      </span>
      <span className="line-clamp-2 min-h-8 text-xs font-semibold leading-4">
        {label}
      </span>
    </button>
  );
}

export function FeaturedSellerStrip({
  sellers,
  products,
  onSelectProduct,
}: {
  sellers: FeaturedSellerDto[];
  products: ProductDto[];
  onSelectProduct: (id: number) => void;
}) {
  const visibleSellers = sellers.slice(0, 4);

  if (visibleSellers.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-brand-brown">Öne çıkan satıcılar</h2>
          <p className="text-sm text-muted-foreground">
            Doğrulama, konum, puan ve favori sinyallerine göre.
          </p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {visibleSellers.map((seller) => {
          const productId = seller.vitrinUrunId
            ?? products.find((product) => product.saticiId === seller.kullaniciId)?.id;
          const title = seller.magazaAdi;
          const image = sellerCoverImage(seller);
          const location = featuredSellerLocation(seller);
          const verified = seller.dogrulanmisSatici;
          const rating = seller.ortalamaPuan;
          const favoriteCount = seller.toplamFavori;
          const reviewCount = seller.toplamYorum;

          return (
            <button
              key={seller.kullaniciId}
              type="button"
              disabled={!productId}
              onClick={() => {
                if (productId) onSelectProduct(productId);
              }}
              className="group relative min-h-[148px] overflow-hidden rounded-[22px] border border-border bg-ink text-left shadow-[0_10px_22px_rgba(16,24,40,0.08)] outline-none transition hover:-translate-y-0.5 hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              <Image
                src={image}
                alt=""
                fill
                sizes="(min-width: 1280px) 320px, 50vw"
                className="object-cover opacity-72 transition group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,20,16,0.78),rgba(14,20,16,0.28))]" />
              <div className="relative flex h-full min-h-[148px] flex-col justify-end p-4 text-white">
                <div className="flex items-center gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full border border-white/45 bg-white/18 text-sm font-black">
                    {title.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-black">{title}</span>
                    <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-white/82">
                      <MapPin className="size-3.5" aria-hidden />
                      {location}
                    </span>
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {verified ? (
                    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-900" variant="green">
                      <ShieldCheck className="size-3.5" aria-hidden />
                      Doğrulanmış
                    </Badge>
                  ) : null}
                  <Badge className="border-white/35 bg-white/88 text-brand-brown" variant="outline">
                    <Star className="size-3.5 fill-accent text-accent" aria-hidden />
                    {rating.toFixed(1)} ({reviewCount})
                  </Badge>
                  <Badge className="border-white/35 bg-white/88 text-brand-brown" variant="outline">
                    {favoriteCount} favori
                  </Badge>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function ProductCard({
  product,
  active,
  isFavorite,
  onSelect,
}: {
  product: ProductDto;
  category?: CategoryDto;
  active: boolean;
  isFavorite: boolean;
  onSelect: () => void;
}) {
  return (
    <article
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      tabIndex={0}
      className={cn(
        "group min-w-0 cursor-pointer overflow-hidden rounded-[20px] border bg-white text-left shadow-[0_10px_22px_rgba(16,24,40,0.08)] outline-none transition duration-150 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(16,24,40,0.12)] focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary ring-2 ring-primary/[0.14]"
          : "border-border hover:border-primary/[0.35]",
      )}
    >
      <div className="relative aspect-[1.17] overflow-hidden bg-muted">
        <Image
          src={productImage(product)}
          alt={product.adi}
          fill
          sizes="(min-width: 1536px) 210px, (min-width: 1280px) 20vw, (min-width: 768px) 33vw, 50vw"
          className="object-cover"
        />
        <span
          className={cn(
            "absolute right-2 top-2 grid size-9 shrink-0 place-items-center rounded-full bg-white/96 shadow-[0_4px_12px_rgba(16,24,40,0.16)]",
            isFavorite ? "text-red-600" : "text-foreground",
          )}
        >
          <Heart className={cn("size-4", isFavorite && "fill-current")} aria-hidden />
        </span>
        {product.stokMiktari === 0 ? (
          <Badge className="absolute bottom-2 left-2" variant="gold">
            Stok bekliyor
          </Badge>
        ) : null}
      </div>

      <div className="min-w-0 p-3">
        <div>
          <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
            {product.adi}
          </h3>
          <p className="mt-2 text-lg font-black leading-none text-primary">
            {formatPrice(product.fiyat)}
          </p>
        </div>

        <div className="mt-3 flex items-center gap-1 text-xs">
          <Star className="size-3.5 fill-accent text-accent" aria-hidden />
          <span className="font-bold text-foreground">{product.ortalamaPuan.toFixed(1)}</span>
          <span className="text-muted-foreground">({product.toplamYorum})</span>
        </div>

        <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-2 rounded-md bg-secondary px-2 py-2 text-xs font-semibold text-secondary-foreground">
          <span className="truncate">{sellerName(product)}</span>
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{product.saticiSehir ?? "Yerel"}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
