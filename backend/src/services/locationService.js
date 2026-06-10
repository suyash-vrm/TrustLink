export function oppositeRole(role) {
  return role === "Retailer" ? "Distributor" : "Retailer";
}

export function distanceKm(a, b) {
  if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) return null;
  const toRad = (value) => (Number(value) * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const hav = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(earthKm * 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav)));
}

export function mapsSearchUrl(business) {
  const query = encodeURIComponent(`${business.name}, ${business.address}, ${business.city}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function mapsDirectionsUrl(from, to) {
  const origin = encodeURIComponent(`${from.address}, ${from.city}`);
  const destination = encodeURIComponent(`${to.address}, ${to.city}`);
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
}
