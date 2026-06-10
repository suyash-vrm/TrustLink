function daysBetween(start, end) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end || new Date().toISOString().slice(0, 10)}T00:00:00`);
  return Math.round((endDate - startDate) / 86400000);
}

export function transactionsForBusiness(db, businessId) {
  return db.transactions.filter((transaction) => transaction.fromId === businessId || transaction.toId === businessId);
}

export function scoreForBusiness(db, businessId) {
  const related = transactionsForBusiness(db, businessId);
  if (!related.length) {
    return { score: 50, badge: "New", tone: "yellow", paidOnTime: 50, confirmation: 0, dispute: 100, consistency: 40 };
  }

  const paid = related.filter((transaction) => transaction.status === "Paid");
  const overdue = related.filter((transaction) => transaction.status !== "Paid" && daysBetween(transaction.dueDate) > 0);
  const onTime = paid.filter((transaction) => daysBetween(transaction.dueDate, transaction.paidDate) <= 0);
  const confirmed = related.filter((transaction) => transaction.confirmedBy.includes(transaction.fromId) && transaction.confirmedBy.includes(transaction.toId));
  const disputes = related.filter((transaction) => /damage|wrong|dispute|fake|short/i.test(transaction.notes || ""));

  const paidOnTime = paid.length ? Math.round((onTime.length / paid.length) * 100) : 45;
  const confirmation = Math.round((confirmed.length / related.length) * 100);
  const dispute = Math.max(0, 100 - Math.round((disputes.length / related.length) * 100));
  const consistency = Math.min(100, Math.round((related.length / 6) * 100));
  const overduePenalty = Math.min(28, overdue.length * 9);
  const score = Math.max(5, Math.min(100, Math.round(paidOnTime * 0.42 + confirmation * 0.28 + dispute * 0.18 + consistency * 0.12 - overduePenalty)));

  return {
    score,
    badge: score >= 75 ? "Trusted" : score >= 50 ? "Watchlist" : "Risky",
    tone: score >= 75 ? "green" : score >= 50 ? "yellow" : "red",
    paidOnTime,
    confirmation,
    dispute,
    consistency
  };
}

export function suggestedCreditLimit(db, business) {
  const score = scoreForBusiness(db, business.id).score;
  const base = Number(business.creditLimit || 25000);
  const multiplier = score >= 80 ? 1.25 : score >= 65 ? 1 : score >= 50 ? 0.65 : 0.35;
  return Math.round((base * multiplier) / 1000) * 1000;
}
