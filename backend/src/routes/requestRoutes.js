import { writeDb } from "../data/database.js";
import { sanitizeBusiness, sendJson } from "../utils/http.js";

export function listRequests(res, db, business) {
  const incoming = db.partnerRequests.filter((request) => request.toId === business.id).map((request) => decorateRequest(db, request));
  const outgoing = db.partnerRequests.filter((request) => request.fromId === business.id).map((request) => decorateRequest(db, request));
  sendJson(res, 200, { incoming, outgoing });
}

export async function createRequest(res, db, business, body) {
  const partner = db.businesses.find((item) => item.id === body.toId);
  if (!partner) {
    sendJson(res, 404, { message: "Partner not found" });
    return;
  }

  if (partner.role === business.role) {
    sendJson(res, 400, { message: "Requests must be sent to the opposite role" });
    return;
  }

  const exists = db.partnerRequests.some((request) => request.fromId === business.id && request.toId === partner.id && request.status !== "Rejected");
  if (exists) {
    sendJson(res, 409, { message: "Request already exists" });
    return;
  }

  const request = {
    id: `req${Date.now()}`,
    fromId: business.id,
    toId: partner.id,
    status: "Pending",
    message: String(body.message || `${business.name} wants to start verified trade with ${partner.name}.`),
    createdAt: new Date().toISOString().slice(0, 10)
  };

  db.partnerRequests.unshift(request);
  await writeDb(db);
  sendJson(res, 201, { request: decorateRequest(db, request) });
}

export async function updateRequest(res, db, business, id, body) {
  const request = db.partnerRequests.find((item) => item.id === id);
  if (!request) {
    sendJson(res, 404, { message: "Request not found" });
    return;
  }

  if (request.toId !== business.id) {
    sendJson(res, 403, { message: "Only the receiver can update this request" });
    return;
  }

  if (!["Accepted", "Rejected"].includes(body.status)) {
    sendJson(res, 400, { message: "Status must be Accepted or Rejected" });
    return;
  }

  request.status = body.status;
  await writeDb(db);
  sendJson(res, 200, { request: decorateRequest(db, request) });
}

function decorateRequest(db, request) {
  return {
    ...request,
    from: sanitizeBusiness(db.businesses.find((item) => item.id === request.fromId)),
    to: sanitizeBusiness(db.businesses.find((item) => item.id === request.toId))
  };
}
