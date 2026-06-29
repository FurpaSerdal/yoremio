import Image from "next/image";

import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <span className="grid shrink-0 place-items-center rounded-lg bg-white p-1.5 shadow-[0_10px_30px_rgba(10,106,68,0.16)] ring-1 ring-border/70">
        <Image
          src="/yoremio-mark.svg"
          alt="Yöremio logosu"
          width={compact ? 34 : 42}
          height={compact ? 34 : 42}
          priority
        />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xl font-black leading-5 tracking-normal text-brand-brown">
          Yöremio
        </p>
        <p className="truncate text-xs font-bold leading-4 text-primary">
          Yerel Pazar
        </p>
      </div>
    </div>
  );
}
