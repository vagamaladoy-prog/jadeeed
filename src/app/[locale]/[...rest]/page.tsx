import { notFound } from "next/navigation";

// Any unknown path inside a locale renders the localized 404 (with header, footer, tab bar).
export default function CatchAll() {
  notFound();
}
