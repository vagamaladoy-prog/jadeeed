"use server";
import { placePreorder, type PlacePreorderResult, type PreorderInput } from "@/lib/preorders";

export async function placePreorderAction(input: PreorderInput): Promise<PlacePreorderResult> {
  return placePreorder(input);
}
