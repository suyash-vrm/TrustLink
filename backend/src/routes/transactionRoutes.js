import { writeDb } from "../data/database.js";
import { sanitizeBusiness, sendJson } from "../utils/http.js";

export function listTransactions(res, db, business) {
  const transactions = db.transactions
    .filter((item) => item.fromId === business.id || item.toId === business.id)
    .map((item) => decorateTransaction(db, item));

  sendJson(res, 200, { transactions });
}

export async function createTransaction(res, db, business, body) {
  const fromId = String(body.fromId || "");
  const toId = String(body.toId || "");

  if (![fromId, toId].includes(business.id)) {
    sendJson(res, 403, { message: "Logged-in account must be part of the transaction" });
    return;
  }

  if (fromId === toId) {
    sendJson(res, 400, { message: "Choose two different businesses" });
    return;
  }

  const status = body.status === "Paid" ? "Paid" : "Unpaid";
  const transaction = {
    id: `t${Date.now()}`,
    fromId,
    toId,
    product: String(body.product || "").trim(),
    amount: Number(body.amount || 0),
    invoiceDate: body.invoiceDate,
    dueDate: body.dueDate,
    paidDate: status === "Paid" ? new Date().toISOString().slice(0, 10) : "",
    status,
    confirmedBy: status === "Paid" ? [fromId, toId] : [business.id],
    notes: String(body.notes || "").trim()
  };

  db.transactions.unshift(transaction);
  await writeDb(db);
  sendJson(res, 201, { transaction: decorateTransaction(db, transaction) });
}

export async function confirmTransaction(res, db, business, id) {
  const transaction = db.transactions.find((item) => item.id === id);
  if (!transaction) {
    sendJson(res, 404, { message: "Transaction not found" });
    return;
  }

  if (![transaction.fromId, transaction.toId].includes(business.id)) {
    sendJson(res, 403, { message: "Only linked businesses can confirm this transaction" });
    return;
  }

  transaction.confirmedBy = Array.from(new Set([...transaction.confirmedBy, business.id]));
  await writeDb(db);
  sendJson(res, 200, { transaction: decorateTransaction(db, transaction) });
}

export async function markPaid(res, db, business, id) {
  const transaction = db.transactions.find((item) => item.id === id);
  if (!transaction) {
    sendJson(res, 404, { message: "Transaction not found" });
    return;
  }

  if (![transaction.fromId, transaction.toId].includes(business.id)) {
    sendJson(res, 403, { message: "Only linked businesses can mark this transaction paid" });
    return;
  }

  transaction.status = "Paid";
  transaction.paidDate = transaction.paidDate || new Date().toISOString().slice(0, 10);
  transaction.confirmedBy = Array.from(new Set([...transaction.confirmedBy, transaction.fromId, transaction.toId]));
  await writeDb(db);
  sendJson(res, 200, { transaction: decorateTransaction(db, transaction) });
}

function decorateTransaction(db, transaction) {
  return {
    ...transaction,
    from: sanitizeBusiness(db.businesses.find((item) => item.id === transaction.fromId)),
    to: sanitizeBusiness(db.businesses.find((item) => item.id === transaction.toId))
  };
}
