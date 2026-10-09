'use client';

import { useSiteSettings } from "@/hooks/usePublicData";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";

/**
 * Brand mark from the site settings. "dark" = artwork for light surfaces (logo_url), "light" = artwork for
 * navy/dark surfaces (logo_dark_url), "auto" switches with the theme. Renders an empty box of the same width while loading.
 */
export function BrandLogo({
  variant = "auto",
  width,
  className,
}: {
  variant?: "dark" | "light" | "auto";
  width: number;
  className?: string;
}) {
  const { data } = useSiteSettings();
  const onLight = mediaUrl(data?.logo_url);
  const onDark = mediaUrl(data?.logo_dark_url) ?? onLight;
  const alt = data?.site_name ?? "";

  const render = (src: string | null, extra?: string) =>
    src ? (
      // eslint-disable-next-line @next/next/no-img-element -- logo comes from the backend, any size/format
      <img src={src} alt={alt} width={width} className={cn("object-contain", className, extra)} />
    ) : (
      <span aria-hidden className={cn("block aspect-[278/243]", className, extra)} style={{ width }} />
    );

  if (variant === "dark") return render(onLight);
  if (variant === "light") return render(onDark);
  return (
    <>
      {render(onLight, "dark:hidden")}
      {render(onDark, "hidden dark:block")}
    </>
  );
}
