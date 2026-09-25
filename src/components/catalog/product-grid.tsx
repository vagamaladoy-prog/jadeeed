"use client";
import { ProductCard } from "@/components/product/product-card";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import type { ProductCardDTO } from "@/lib/types";

export function ProductGrid({ products, badgePhrase }: { products: ProductCardDTO[]; badgePhrase: string }) {
  return (
    <Stagger className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-5 xl:grid-cols-4">
      {products.map((p) => (
        <StaggerItem key={p.id}>
          <ProductCard product={p} badgePhrase={badgePhrase} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}
