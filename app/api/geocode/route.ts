import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ city: "votre zone" });
  }

  const googleKey = process.env.GOOGLE_PLACES_API_KEY;
  if (googleKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleKey}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "OK" && data.results?.length > 0) {
        const components = data.results[0].address_components ?? [];
        const city = components.find((c: any) => c.types.includes("locality"))?.long_name ??
                     components.find((c: any) => c.types.includes("administrative_area_level_2"))?.long_name;
        return NextResponse.json({ city: city ?? "votre zone" });
      }
    } catch {
      // Fallback
    }
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(nominatimUrl, { headers: { "User-Agent": "InsureVisionApp/1.0" } });
    const data = await res.json();
    const city = data.address?.city ?? data.address?.town ?? data.address?.village ?? "votre zone";
    return NextResponse.json({ city });
  } catch {
    return NextResponse.json({ city: "votre zone" });
  }
}