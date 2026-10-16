'use client';

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

/**
 * next/image that swaps to a fallback when the API-provided source is missing or broken.
 * With no fallback it renders nothing, letting the container's background show through.
 */
export function SmartImage({
  src,
  fallback,
  alt,
  ...props
}: Omit<ImageProps, "src"> & { src?: string | null; fallback: string | null }) {
  const [failed, setFailed] = useState<string | null>(null);
  const resolved = src && failed !== src ? src : fallback;
  if (!resolved) return null;
  return (
    <Image
      {...props}
      src={resolved}
      alt={alt}
      unoptimized={/^https?:\/\//.test(resolved)}
      onError={() => setFailed(src ?? null)}
    />
  );
}
