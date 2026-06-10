import { readDb } from "../data/database.js";
import { verifyToken } from "../utils/crypto.js";

export async function requireAuth(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const payload = verifyToken(token);
  if (!payload?.businessId) return null;

  const db = await readDb();
  const business = db.businesses.find((item) => item.id === payload.businessId);
  if (!business) return null;

  return { db, business };
}
