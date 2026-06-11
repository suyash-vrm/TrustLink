# TrustLink: B2B Trust Ledger & Credit Scoring Platform

![TrustLink](https://img.shields.io/badge/Status-Active-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue)

TrustLink is a full-stack, role-based platform designed to bridge the gap of trust between Distributors and Retailers in the B2B supply chain. By maintaining a transparent ledger of transactions and automatically calculating a dynamic "Trust Score," TrustLink empowers businesses to make informed, data-driven credit decisions.

---

## 🛑 The Problem We Are Solving

In the traditional B2B supply chain, business is heavily dependent on **trade credit**—retailers take goods upfront and pay the distributors later. However, this creates a massive risk management problem:
- **Distributors** face high default risks when extending credit to new or unknown retailers because there is no unified credit history.
- **Retailers** who consistently pay on time struggle to objectively prove their reliability to new distributors, limiting their ability to negotiate higher credit limits or better terms.
- **Information Asymmetry**: Disputes over payments, damaged goods, or delivery timelines often turn into "he-said-she-said" scenarios with no central, mutually agreed-upon ledger.

## 💡 How We Are Solving It

TrustLink serves as a centralized trust ledger and business discovery platform:

1. **Role-Based Network**: Businesses sign up as either a *Distributor* or a *Retailer*. The platform allows them to discover potential partners and send connection requests.
2. **Transparent Ledger**: Every exchange of goods or funds is logged as a transaction on the platform.
3. **Mutual Confirmation**: To prevent fraudulent ledger entries, transactions must be confirmed by both the sender and the receiver.
4. **Dynamic Trust Scoring**: As businesses interact on the platform, their behavior actively shapes their algorithmic **Trust Score**.
5. **Smart Credit Limits**: Based on the Trust Score, TrustLink algorithmically suggests safe, objective credit limits for retailers, protecting distributors from over-extending credit.

---

## 📈 How We Obtain the Trust Score

The core of TrustLink is our proprietary scoring algorithm. The score is calculated on a scale of **0 to 100** based on a business's historical transaction behavior. 

The algorithm weighs four primary positive factors, alongside a severe penalty for bad behavior:

### 1. Payment Timeliness (42% Weight)
We calculate the ratio of invoices paid on or before their due date. Consistently paying on time is the strongest indicator of a reliable partner.

### 2. Mutual Confirmation (28% Weight)
We measure the percentage of transactions that have been confirmed by both the buyer and the seller. High mutual confirmation indicates clear communication and agreement on terms.

### 3. Clean Dispute Record (18% Weight)
We scan transaction notes for keywords indicating disputes (e.g., *damage, wrong, dispute, fake, short*). The fewer disputes associated with a business, the higher this metric.

### 4. Transaction Consistency (12% Weight)
We look at the depth and frequency of transactions. A business with a history of consistent, repeated transactions is more trustworthy than an inactive account.

### 🚨 Overdue Penalties
Any unpaid transactions that have passed their due date apply a compounding penalty to the final score. A severe history of overdue payments will drag the score down, regardless of past performance.

### Badges & Tiers
Based on the final calculation, businesses are categorized into tiers:
- 🟢 **Trusted (75 - 100):** Highly reliable, eligible for maximum suggested credit limits.
- 🟡 **Watchlist (50 - 74):** Average reliability or a brand-new account with no history.
- 🔴 **Risky (0 - 49):** Poor history of late payments or disputes. Credit should be restricted.

---

## 🛠️ How We Made This (Tech Stack)

TrustLink is built as a lightweight, high-performance monorepo, split into a modern frontend and a native backend.

### Frontend
- **React.js & Vite**: Provides a lightning-fast, modern single-page application (SPA) experience.
- **Vanilla CSS**: Custom styling ensures a responsive, clean, and tailored dashboard experience without the bloat of heavy CSS frameworks.
- **Google Maps Integration**: Allows businesses to search for and route to physical partner locations seamlessly.

### Backend
- **Node.js (Native HTTP)**: Instead of relying on heavy web frameworks, the backend is built using Node.js native `http` module for incredibly fast, lightweight API responses.
- **Local JSON Database (`db.json`)**: Eliminates the need for external database dependencies (like PostgreSQL or MongoDB) during development and testing, allowing the project to run out-of-the-box instantly.
- **Security**: Features robust authentication routes with PBKDF2 password hashing and secure token generation.

---

## 🚀 Running the Project Locally

To run the project on your local machine, you will need Node.js installed. Open two separate terminals in the project root directory.

**Terminal 1 (Start Backend):**
```bash
npm run dev:backend
```
*(The backend runs on http://127.0.0.1:5000)*

**Terminal 2 (Start Frontend):**
```bash
npm run dev:frontend
```
*(The frontend runs on http://127.0.0.1:5173)*

### Demo Accounts
You can test the platform using the built-in demo accounts:
- **Distributor:** `ramesh@trustlink.demo` / Password: `demo123`
- **Retailer:** `suresh@trustlink.demo` / Password: `demo123`
