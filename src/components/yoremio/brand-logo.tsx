import Image from "next/image";

import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  compact = false,
  inverse = false,
}: {
  className?: string;
  compact?: boolean;
  inverse?: boolean;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-md p-0.5",
          inverse ? "bg-white/10" : "bg-transparent",
        )}
      >
        <Image
          src="/yoremio-mark.svg"
          alt="Yöremio logosu"
          width={compact ? 38 : 46}
          height={compact ? 38 : 46}
          priority
        />
      </span>
      <div className="min-w-0">
        <p
          className={cn(
            "truncate text-2xl font-black leading-6 tracking-normal",
            inverse ? "text-white" : "text-brand-brown",
          )}
        >
          Yöremio
        </p>
        <p
          className={cn(
            "truncate text-xs font-bold leading-4",
            compact && "hidden",
            inverse ? "text-white/72" : "text-muted-foreground",
          )}
        >
          Yerel Pazar
        </p>
      </div>
    </div>
  );
}
