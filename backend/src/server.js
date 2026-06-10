import http from "node:http";
import { config } from "./config.js";
import { requireAuth } from "./middleware/auth.js";
import { login, signup } from "./routes/authRoutes.js";
import { discover, me } from "./routes/businessRoutes.js";
import { createRequest, listRequests, updateRequest } from "./routes/requestRoutes.js";
import { confirmTransaction, createTransaction, listTransactions, markPaid } from "./routes/transactionRoutes.js";
import { notFound, readJson, sendJson } from "./utils/http.js";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", config.frontendOrigin);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
}

const server = http.createServer(async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const body = ["POST", "PATCH", "PUT"].includes(req.method) ? await readJson(req) : {};

    if (req.method === "POST" && url.pathname === "/api/auth/login") return login(req, res, body);
    if (req.method === "POST" && url.pathname === "/api/auth/signup") return signup(req, res, body);

    const context = await requireAuth(req);
    if (!context) return sendJson(res, 401, { message: "Authentication required" });
    const { db, business } = context;

    if (req.method === "GET" && url.pathname === "/api/me") return me(res, db, business);
    if (req.method === "GET" && url.pathname === "/api/businesses/discover") return discover(res, db, business);
    if (req.method === "GET" && url.pathname === "/api/transactions") return listTransactions(res, db, business);
    if (req.method === "POST" && url.pathname === "/api/transactions") return createTransaction(res, db, business, body);
    if (req.method === "GET" && url.pathname === "/api/requests") return listRequests(res, db, business);
    if (req.method === "POST" && url.pathname === "/api/requests") return createRequest(res, db, business, body);

    const confirmMatch = url.pathname.match(/^\/api\/transactions\/([^/]+)\/confirm$/);
    if (req.method === "PATCH" && confirmMatch) return confirmTransaction(res, db, business, confirmMatch[1]);

    const paidMatch = url.pathname.match(/^\/api\/transactions\/([^/]+)\/pay$/);
    if (req.method === "PATCH" && paidMatch) return markPaid(res, db, business, paidMatch[1]);

    const requestMatch = url.pathname.match(/^\/api\/requests\/([^/]+)$/);
    if (req.method === "PATCH" && requestMatch) return updateRequest(res, db, business, requestMatch[1], body);

    return notFound(res);
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { message: "Internal server error" });
  }
});

server.listen(config.port, "0.0.0.0", () => {
  console.log(`TrustLink API running on http://0.0.0.0:${config.port}`);
});
