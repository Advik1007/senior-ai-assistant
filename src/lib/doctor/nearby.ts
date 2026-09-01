import "server-only";

export type NearbyDoctor = {
  name: string;
  address: string;
  distanceKm: number | null;
  mapsUrl: string;
  lat: number;
  lon: number;
};

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type NominatimRow = {
  display_name?: string;
  lat?: string;
  lon?: string;
};

export async function findNearbyDoctors(
  lat: number,
  lon: number,
): Promise<NearbyDoctor[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", "doctor clinic hospital");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "12");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "UNK-AI/1.0 (senior accessibility assistant)" },
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];

  const rows = (await res.json()) as NominatimRow[];
  const mapped: NearbyDoctor[] = [];

  for (const row of rows) {
    const placeLat = Number(row.lat);
    const placeLon = Number(row.lon);
    if (!row.display_name || Number.isNaN(placeLat) || Number.isNaN(placeLon)) {
      continue;
    }
    const name = row.display_name.split(",")[0]?.trim() || row.display_name;
    mapped.push({
      name,
      address: row.display_name,
      distanceKm: haversineKm(lat, lon, placeLat, placeLon),
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${placeLat},${placeLon}`)}`,
      lat: placeLat,
      lon: placeLon,
    });
  }

  return mapped
    .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99))
    .slice(0, 8);
}
