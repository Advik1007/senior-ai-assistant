export type TravelMode = "walking" | "driving" | "transit" | "bicycling";

export function doctorsNearMeUrl(): string {
  return "https://www.google.com/maps/search/?api=1&query=doctors+near+me";
}

export function directionsUrl(destination: string, mode: TravelMode): string {
  const params = new URLSearchParams({
    api: "1",
    destination,
    travelmode: mode,
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function shoppingSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
