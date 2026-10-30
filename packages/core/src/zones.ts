/** Delivery zones in Doha and their fee in QAR. Fees are PLACEHOLDERS. */
import type { Localized } from "./types";

export interface Zone {
  id: string;
  name: Localized;
  feeQar: number;
}

const zone = (en: string, ar: string, feeQar: number): Zone => ({
  id: en.toLowerCase().replace(/[^a-z]+/g, "-"),
  name: { en, ar },
  feeQar,
});

export const ZONES: readonly Zone[] = [
  zone("West Bay", "الخليج الغربي", 10),
  zone("Al Sadd", "السد", 10),
  zone("Bin Mahmoud", "بن محمود", 10),
  zone("Al Mansoura", "المنصورة", 10),
  zone("Najma", "النجمة", 10),
  zone("Fereej Bin Omran", "فريج بن عمران", 10),
  zone("Msheireb", "مشيرب", 10),
  zone("Old Airport", "المطار القديم", 10),
  zone("Al Hilal", "الهلال", 10),
  zone("Al Waab", "الوعب", 10),
  zone("Madinat Khalifa", "مدينة خليفة", 10),
  zone("Duhail", "الدحيل", 12),
  zone("Al Gharafa", "الغرافة", 12),
  zone("The Pearl", "اللؤلؤة", 12),
  zone("Lusail", "لوسيل", 15),
  zone("Al Rayyan", "الريان", 15),
  zone("Ain Khaled", "عين خالد", 12),
  zone("Al Wakrah", "الوكرة", 18),
];

export function findZone(id: string): Zone | undefined {
  return ZONES.find((z) => z.id === id);
}
