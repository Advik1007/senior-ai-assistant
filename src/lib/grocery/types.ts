export type PlatformId = "blinkit" | "instamart";

/** One product on one store. */
export type GroceryOffer = {
  id: string;
  platform: PlatformId;
  name: string;
  brand: string | null;
  quantity: string;
  price: number;
  mrp: number | null;
  image: string | null;
  /** e.g. "8 mins" */
  eta: string | null;
  /** Product page on the store; falls back to a store search when missing. */
  productUrl: string | null;
};

/** One thing the user asked for ("milk") with every offer found, cheapest first. */
export type GroceryLine = {
  query: string;
  offers: GroceryOffer[];
};

export type GrocerySource = "live" | "sample";

export type GrocerySearchResult = {
  lines: GroceryLine[];
  source: GrocerySource;
  /** Why sample data is shown, for a friendly banner. */
  notice?: "no-key" | "no-location" | "offline";
};
