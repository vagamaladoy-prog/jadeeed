"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useCartUi } from "@/lib/cart-store";
import { useUi } from "@/lib/ui-store";
import type { CategoryDTO, SettingsDTO } from "@/lib/types";

// Sheets (vaul + their content) are not needed for first paint: load each on first open.
const CartSheet = dynamic(() => import("@/components/cart/cart-sheet").then((m) => m.CartSheet), { ssr: false });
const SearchSheet = dynamic(() => import("@/components/search/search-sheet").then((m) => m.SearchSheet), { ssr: false });
const ContactSheet = dynamic(() => import("./contact-sheet").then((m) => m.ContactSheet), { ssr: false });

function useOnceTrue(v: boolean) {
  const [once, setOnce] = useState(false);
  if (v && !once) setOnce(true);
  return once || v;
}

export function LazyOverlays({
  waitingPhrase,
  categories,
  settings,
}: {
  waitingPhrase: string;
  categories: CategoryDTO[];
  settings: SettingsDTO;
}) {
  const cartOpen = useOnceTrue(useCartUi().open);
  const searchOpen = useOnceTrue(useUi((s) => s.search));
  const contactOpen = useOnceTrue(useUi((s) => s.contact));
  return (
    <>
      {cartOpen && <CartSheet waitingPhrase={waitingPhrase} />}
      {searchOpen && <SearchSheet categories={categories} />}
      {contactOpen && <ContactSheet settings={settings} />}
    </>
  );
}
