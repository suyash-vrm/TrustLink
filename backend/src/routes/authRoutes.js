import { readDb, writeDb } from "../data/database.js";
import { createToken, hashPassword, verifyPassword } from "../utils/crypto.js";
import { sanitizeBusiness, sendJson } from "../utils/http.js";

export async function login(req, res, body) {
  const db = await readDb();
  const loginId = String(body.loginId || "").trim().toLowerCase();
  const password = String(body.password || "");
  const business = db.businesses.find((item) => [item.email?.toLowerCase(), item.phone].includes(loginId));

  if (!business || !verifyPassword(password, business.passwordHash)) {
    sendJson(res, 401, { message: "Invalid email/phone or password" });
    return;
  }

  sendJson(res, 200, {
    token: createToken({ businessId: business.id }),
    user: sanitizeBusiness(business)
  });
}

export async function signup(req, res, body) {
  const db = await readDb();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").trim();

  if (!["Retailer", "Distributor"].includes(body.role)) {
    sendJson(res, 400, { message: "Role must be Retailer or Distributor" });
    return;
  }

  if (db.businesses.some((item) => item.email?.toLowerCase() === email || item.phone === phone)) {
    sendJson(res, 409, { message: "Account already exists with this email or phone" });
    return;
  }

  const business = {
    id: `b${Date.now()}`,
    name: String(body.name || "").trim(),
    role: body.role,
    city: String(body.city || "").trim(),
    owner: String(body.owner || "").trim(),
    phone,
    email,
    passwordHash: hashPassword(String(body.password || "")),
    category: String(body.category || "").trim(),
    address: String(body.address || "").trim(),
    pincode: String(body.pincode || "").trim(),
    lat: Number(body.lat) || 27.8974 + (Math.random() - 0.5) * 0.2,
    lng: Number(body.lng) || 78.088 + (Math.random() - 0.5) * 0.2,
    serviceAreaKm: body.role === "Distributor" ? 25 : 5,
    verification: "Documents pending",
    creditLimit: Number(body.creditLimit || 25000)
  };

  db.businesses.unshift(business);
  await writeDb(db);

  sendJson(res, 201, {
    token: createToken({ businessId: business.id }),
    user: sanitizeBusiness(business)
  });
}
