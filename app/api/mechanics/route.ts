import { NextRequest, NextResponse } from "next/server";

const SEARCH_RADIUS_METERS = 5000;
const MAX_RESULTS = 3;

function calcDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = R * c;
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function getMockMechanics(lat: number, lng: number) {
  return [
    {
      id: "mock-1",
      name: "Garage Auto Express Sousse",
      address: "12 Rue de la Mécanique, Sousse",
      rating: 4.8,
      reviewCount: 234,
      distance: "0.8 km",
      phone: "+216 73 000 001",
      openNow: true,
      specialty: "Carrosserie & Peinture",
      priceLevel: 2,
    },
    {
      id: "mock-2",
      name: "Centre Auto Premium",
      address: "47 Avenue Léopold Senghor, Sousse",
      rating: 4.5,
      reviewCount: 118,
      distance: "1.4 km",
      phone: "+216 73 000 002",
      openNow: true,
      specialty: "Réparations toutes marques",
      priceLevel: 3,
    },
    {
      id: "mock-3",
      name: "Atelier Mecauto",
      address: "Zone Industrielle Sidi Abdelhamid, Sousse",
      rating: 4.2,
      reviewCount: 87,
      distance: "2.1 km",
      phone: "+216 73 000 003",
      openNow: false,
      specialty: "Carrosserie spécialisée",
      priceLevel: 1,
    },
  ];
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "Paramètres lat/lng manquants ou invalides." }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ mechanics: getMockMechanics(lat, lng) });
  }

  try {
    const placesUrl = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
    placesUrl.searchParams.set("location", `${lat},${lng}`);
    placesUrl.searchParams.set("radius", String(SEARCH_RADIUS_METERS));
    placesUrl.searchParams.set("type", "car_repair");
    placesUrl.searchParams.set("key", apiKey);

    const placesRes = await fetch(placesUrl.toString());
    const placesData = await placesRes.json();

    if (placesData.status !== "OK" && placesData.status !== "ZERO_RESULTS") {
      return NextResponse.json({ mechanics: getMockMechanics(lat, lng) });
    }

    const results = (placesData.results ?? []).slice(0, MAX_RESULTS);

    const mechanics = await Promise.all(
      results.map(async (place: any) => {
        return {
          id: place.place_id,
          name: place.name,
          address: place.vicinity,
          rating: place.rating ?? 4.0,
          reviewCount: place.user_ratings_total ?? 0,
          distance: calcDistanceKm(lat, lng, place.geometry.location.lat, place.geometry.location.lng),
          openNow: place.opening_hours?.open_now,
          specialty: "Réparation automobile",
          priceLevel: place.price_level,
        };
      })
    );

    return NextResponse.json({ mechanics });
  } catch (err) {
    return NextResponse.json({ mechanics: getMockMechanics(lat, lng) });
  }
}