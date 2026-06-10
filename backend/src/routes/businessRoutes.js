import { distanceKm, mapsDirectionsUrl, mapsSearchUrl, oppositeRole } from "../services/locationService.js";
import { scoreForBusiness, suggestedCreditLimit } from "../services/scoringService.js";
import { sanitizeBusiness, sendJson } from "../utils/http.js";

export function me(res, db, business) {
  sendJson(res, 200, { user: decorateBusiness(db, business, business) });
}

export function discover(res, db, business) {
  const partners = db.businesses
    .filter((item) => item.role === oppositeRole(business.role))
    .map((partner) => decorateBusiness(db, partner, business))
    .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));

  sendJson(res, 200, { partners });
}

function decorateBusiness(db, business, currentBusiness) {
  const safe = sanitizeBusiness(business);
  return {
    ...safe,
    score: scoreForBusiness(db, business.id),
    suggestedCreditLimit: suggestedCreditLimit(db, business),
    distanceKm: currentBusiness.id === business.id ? 0 : distanceKm(currentBusiness, business),
    mapsUrl: mapsSearchUrl(business),
    routeUrl: currentBusiness.id === business.id ? mapsSearchUrl(business) : mapsDirectionsUrl(currentBusiness, business)
  };
}
