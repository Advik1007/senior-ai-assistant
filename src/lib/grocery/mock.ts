import type { GroceryLine, GroceryOffer, PlatformId } from "@/lib/grocery/types";

type Sample = {
  name: string;
  brand: string;
  quantity: string;
  blinkit: number;
  instamart: number;
  mrp: number;
};

const CATALOG: Record<string, Sample> = {
  milk: { name: "Amul Taaza Toned Milk", brand: "Amul", quantity: "500 ml", blinkit: 28, instamart: 29, mrp: 29 },
  bread: { name: "Harvest Gold White Bread", brand: "Harvest Gold", quantity: "400 g", blinkit: 45, instamart: 42, mrp: 50 },
  eggs: { name: "Farm Fresh White Eggs", brand: "Eggoz", quantity: "6 pcs", blinkit: 66, instamart: 69, mrp: 72 },
  curd: { name: "Mother Dairy Classic Curd", brand: "Mother Dairy", quantity: "400 g", blinkit: 40, instamart: 38, mrp: 42 },
  atta: { name: "Aashirvaad Whole Wheat Atta", brand: "Aashirvaad", quantity: "5 kg", blinkit: 265, instamart: 270, mrp: 280 },
  rice: { name: "India Gate Basmati Rice", brand: "India Gate", quantity: "1 kg", blinkit: 145, instamart: 139, mrp: 160 },
  banana: { name: "Robusta Banana", brand: "Fresh", quantity: "6 pcs", blinkit: 48, instamart: 45, mrp: 55 },
  tea: { name: "Tata Tea Premium", brand: "Tata", quantity: "250 g", blinkit: 140, instamart: 145, mrp: 150 },
  sugar: { name: "Madhur Pure Sugar", brand: "Madhur", quantity: "1 kg", blinkit: 58, instamart: 55, mrp: 62 },
  butter: { name: "Amul Butter", brand: "Amul", quantity: "100 g", blinkit: 58, instamart: 58, mrp: 60 },
};

const ETA: Record<PlatformId, string> = { blinkit: "9 mins", instamart: "14 mins" };

function sampleFor(query: string): Sample {
  const q = query.toLowerCase();
  const hit = Object.entries(CATALOG).find(([key]) => q.includes(key));
  if (hit) return hit[1];
  const title = query.replace(/\b\w/g, (c) => c.toUpperCase());
  return { name: title, brand: "Local", quantity: "1 pack", blinkit: 60, instamart: 62, mrp: 65 };
}

/** Realistic-looking offline data so the screen can be demoed without the API. */
export function sampleLines(items: string[]): GroceryLine[] {
  return items.map((query) => {
    const s = sampleFor(query);
    const offers: GroceryOffer[] = (["blinkit", "instamart"] as const).map((platform) => ({
      id: `sample-${platform}-${query}`,
      platform,
      name: s.name,
      brand: s.brand,
      quantity: s.quantity,
      price: s[platform],
      mrp: s.mrp,
      image: null,
      eta: ETA[platform],
      productUrl: null,
    }));
    offers.sort((a, b) => a.price - b.price);
    return { query, offers };
  });
}
