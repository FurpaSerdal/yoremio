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
      <span className="grid shrink-0 place-items-center rounded-md bg-white p-1 ring-1 ring-border/70">
        <Image
          src="/yoremio-mark.svg"
          alt="Yöremio logosu"
          width={compact ? 34 : 42}
          height={compact ? 34 : 42}
          priority
        />
      </span>
      <div className="min-w-0">
        <p
          className={cn(
            "truncate text-xl font-black leading-5 tracking-normal",
            inverse ? "text-white" : "text-brand-brown",
          )}
        >
          Yöremio
        </p>
        <p
          className={cn(
            "truncate text-xs font-bold leading-4",
            inverse ? "text-white/72" : "text-muted-foreground",
          )}
        >
          Yerel Pazar
        </p>
      </div>
    </div>
  );
}
