// Uzbek Latin → the new alphabet (law of 21.10.2026, in force 22.04.2027): Oʻ→Ö, Gʻ→Ğ, Sh→Ş, Ch→Ç.
// Brand phrases stay exactly as printed on the clothes. `node scripts/uz-new-alphabet.mjs --write` rewrites
// messages/uz.json; the same rules live in SQL in prisma/migrations/20261116000000_uz_new_alphabet.
import { readFileSync, writeFileSync } from "node:fs";

export const BRAND = ["Men o'sha", "Siz o'shami", "Aylanib ketay", "Ko'z tegmasin", "Qodiriy | Qish", "Jadeeed"];
const AP = "['ʻ‘’`]";

export function toNewAlphabet(s) {
  const kept = [];
  // protect brand phrases (any apostrophe variant, any case)
  for (const b of BRAND) {
    const re = new RegExp(b.replace(/[|?]/g, (c) => "\\" + c).replace(/'/g, AP), "gi");
    s = s.replace(re, (m) => `\u0000${kept.push(m) - 1}\u0000`);
  }
  s = s
    .replace(new RegExp(`O${AP}`, "g"), "Ö")
    .replace(new RegExp(`o${AP}`, "g"), "ö")
    .replace(new RegExp(`G${AP}`, "g"), "Ğ")
    .replace(new RegExp(`g${AP}`, "g"), "ğ")
    .replace(/SH/g, "Ş")
    .replace(/Sh/g, "Ş")
    .replace(/sh/g, "ş")
    .replace(/CH/g, "Ç")
    .replace(/Ch/g, "Ç")
    .replace(/ch/g, "ç");
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => kept[+i]);
}

const walk = (v) =>
  typeof v === "string" ? toNewAlphabet(v) : Array.isArray(v) ? v.map(walk) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)])) : v;

if (process.argv.includes("--write")) {
  const f = "messages/uz.json";
  writeFileSync(f, JSON.stringify(walk(JSON.parse(readFileSync(f, "utf8"))), null, 2) + "\n");
  console.log("uz.json converted");
}
