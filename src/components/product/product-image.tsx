"use client";
import Image from "next/image";
import { useState } from "react";
import { AtlasPattern } from "@/components/atlas/atlas-pattern";
import { cn } from "@/lib/cn";

/**
 * Product photo that fills its (relative, sized) parent. While loading, the image well shows
 * a faint flowing atlas instead of a grey skeleton; the photo fades in on top.
 */
export function ProductImage({
  src,
  alt,
  sizes,
  priority,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const svg = src.endsWith(".svg");
  return (
    <>
      {!loaded && <AtlasPattern variant="loading" scale={0.5} />}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={svg}
        onLoad={() => setLoaded(true)}
        className={cn(
          "object-cover transition-opacity duration-[var(--dur-in)]",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
      />
    </>
  );
}
