import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/config";

/**
 * Logo + product name. When `brand.logoSrc` is set in lib/config.ts the
 * Bosshardt logo replaces the monogram automatically.
 */
export function BrandMark() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 rounded-md">
      {brand.logoSrc ? (
        <Image src={brand.logoSrc} alt={brand.company} width={120} height={28} className="h-7 w-auto" />
      ) : (
        <span className="grid size-8 place-items-center rounded-lg bg-brand text-[13px] font-semibold tracking-tight text-brand-fg">
          B
        </span>
      )}
      <span className="text-[15px] font-semibold tracking-tight text-ink">{brand.name}</span>
    </Link>
  );
}
