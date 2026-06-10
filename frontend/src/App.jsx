import { useEffect, useMemo, useState } from "react";
import { apiRequest, clearToken, getToken, setToken } from "./api/client.js";

const roles = ["Retailer", "Distributor"];

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function dateLabel(value) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function oppositeRole(role) {
  return role === "Retailer" ? "Distributor" : "Retailer";
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [authMode, setAuthMode] = useState("login");
  const [transactions, setTransactions] = useState([]);
  const [partners, setPartners] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!getToken()) return;
    bootstrap().catch(() => {
      clearToken();
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  async function bootstrap() {
    setLoading(true);
    const [{ user: me }, tx, discovery, requestData] = await Promise.all([
      apiRequest("/me"),
      apiRequest("/transactions"),
      apiRequest("/businesses/discover"),
      apiRequest("/requests")
    ]);
    setUser(me);
    setTransactions(tx.transactions);
    setPartners(discovery.partners);
    setRequests(requestData);
    setLoading(false);
  }

  async function handleLogin(payload) {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setToken(data.token);
    setUser(data.user);
    await bootstrap();
    setToast(`Welcome, ${data.user.owner}.`);
  }

  async function handleSignup(payload) {
    const data = await apiRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setToken(data.token);
    setUser(data.user);
    setView("discover");
    await bootstrap();
    setToast("Account created.");
  }

  function logout() {
    clearToken();
    setUser(null);
    setTransactions([]);
    setPartners([]);
    setRequests({ incoming: [], outgoing: [] });
    setView("dashboard");
  }

  async function refreshData() {
    const [tx, discovery, requestData, me] = await Promise.all([
      apiRequest("/transactions"),
      apiRequest("/businesses/discover"),
      apiRequest("/requests"),
      apiRequest("/me")
    ]);
    setTransactions(tx.transactions);
    setPartners(discovery.partners);
    setRequests(requestData);
    setUser(me.user);
  }

  async function createTransaction(payload) {
    await apiRequest("/transactions", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    await refreshData();
    setView("transactions");
    setToast("Transaction saved.");
  }

  async function confirmTransaction(id) {
    await apiRequest(`/transactions/${id}/confirm`, { method: "PATCH" });
    await refreshData();
    setToast("Transaction confirmed.");
  }

  async function markPaid(id) {
    await apiRequest(`/transactions/${id}/pay`, { method: "PATCH" });
    await refreshData();
    setToast("Payment marked paid.");
  }

  async function sendRequest(partnerId) {
    await apiRequest("/requests", {
      method: "POST",
      body: JSON.stringify({ toId: partnerId })
    });
    await refreshData();
    setToast("Partner request sent.");
  }

  async function updateRequest(id, status) {
    await apiRequest(`/requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    await refreshData();
    setToast(`Request ${status.toLowerCase()}.`);
  }

  if (loading) return <div className="loading">Loading TrustLink...</div>;

  if (!user) {
    return (
      <AuthPage
        mode={authMode}
        setMode={setAuthMode}
        onLogin={handleLogin}
        onSignup={handleSignup}
        toast={toast}
        setToast={setToast}
      />
    );
  }

  return (
    <div className="app-shell">
      <Topbar user={user} view={view} setView={setView} logout={logout} />
      <main className="main">
        {view === "dashboard" && <Dashboard user={user} transactions={transactions} partners={partners} setView={setView} />}
        {view === "transactions" && (
          <Transactions transactions={transactions} onConfirm={confirmTransaction} onPaid={markPaid} />
        )}
        {view === "discover" && (
          <Discover user={user} partners={partners} requests={requests} onRequest={sendRequest} />
        )}
        {view === "requests" && (
          <Requests requests={requests} onUpdate={updateRequest} />
        )}
        {view === "new" && (
          <TransactionForm user={user} partners={partners} onSubmit={createTransaction} setView={setView} />
        )}
      </main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function AuthPage({ mode, setMode, onLogin, onSignup, toast, setToast }) {
  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div>
          <div className="brand auth-brand">
            <span className="brand-mark">TL</span>
            <span>TrustLink</span>
          </div>
          <h1>{mode === "signup" ? "Create your trade identity." : "Log in to your trust ledger."}</h1>
          <p>Retailers discover verified distributors. Distributors discover reliable retailers. Every deal improves the trust score.</p>
        </div>
        <div className="auth-demo">
          <span className="badge green">Demo login</span>
          <p><strong>Distributor:</strong> ramesh@trustlink.demo / demo123</p>
          <p><strong>Retailer:</strong> suresh@trustlink.demo / demo123</p>
        </div>
      </section>
      <section className="panel auth-card">
        <div className="panel-head">
          <div>
            <h2>{mode === "signup" ? "Sign up" : "Login"}</h2>
            <p>{mode === "signup" ? "Choose whether you are a retailer or distributor." : "Use phone or email with your password."}</p>
          </div>
        </div>
        {mode === "signup" ? <SignupForm onSubmit={onSignup} onError={setToast} /> : <LoginForm onSubmit={onLogin} onError={setToast} />}
        <button className="ghost-btn auth-toggle" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>
          {mode === "signup" ? "Already have an account? Login" : "New business? Create account"}
        </button>
      </section>
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

function LoginForm({ onSubmit, onError }) {
  const [form, setForm] = useState({ loginId: "ramesh@trustlink.demo", password: "demo123" });
  return (
    <form className="form-grid" onSubmit={(event) => submitForm(event, onSubmit, form, onError)}>
      <Field label="Email or phone" value={form.loginId} onChange={(loginId) => setForm({ ...form, loginId })} />
      <Field label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
      <button className="primary-btn field full" type="submit">Login</button>
    </form>
  );
}

function SignupForm({ onSubmit, onError }) {
  const [form, setForm] = useState({
    role: "Retailer",
    name: "",
    owner: "",
    category: "",
    phone: "",
    email: "",
    address: "",
    city: "Aligarh",
    pincode: "",
    password: "",
    creditLimit: 25000
  });

  return (
    <form className="form-grid" onSubmit={(event) => submitForm(event, onSubmit, form, onError)}>
      <label className="field">
        <span>I am a</span>
        <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
          {roles.map((role) => <option key={role}>{role}</option>)}
        </select>
      </label>
      <Field label="Business name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
      <Field label="Owner name" value={form.owner} onChange={(owner) => setForm({ ...form, owner })} />
      <Field label="Category" value={form.category} onChange={(category) => setForm({ ...form, category })} />
      <Field label="Phone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
      <Field label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
      <Field className="full" label="Shop or office address" value={form.address} onChange={(address) => setForm({ ...form, address })} />
      <Field label="City" value={form.city} onChange={(city) => setForm({ ...form, city })} />
      <Field label="Pincode" value={form.pincode} onChange={(pincode) => setForm({ ...form, pincode })} />
      <Field label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
      <Field label="Normal credit limit" type="number" value={form.creditLimit} onChange={(creditLimit) => setForm({ ...form, creditLimit })} />
      <button className="primary-btn field full" type="submit">Create account</button>
    </form>
  );
}

function submitForm(event, action, form, onError) {
  event.preventDefault();
  action(form).catch((error) => onError(error.message));
}

function Field({ label, value, onChange, type = "text", className = "" }) {
  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      <input required type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Topbar({ user, view, setView, logout }) {
  const nav = [
    ["dashboard", "Dashboard"],
    ["transactions", "Ledger"],
    ["discover", `${oppositeRole(user.role)}s`],
    ["requests", "Requests"],
    ["new", "Log entry"]
  ];

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">TL</span>
        <span>TrustLink</span>
      </div>
      <nav className="nav" aria-label="Primary">
        {nav.map(([id, label]) => (
          <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}>{label}</button>
        ))}
        <button onClick={logout}>Logout</button>
      </nav>
    </header>
  );
}

function Dashboard({ user, transactions, partners, setView }) {
  const receivable = transactions.filter((item) => item.fromId === user.id && item.status !== "Paid").reduce((sum, item) => sum + item.amount, 0);
  const payable = transactions.filter((item) => item.toId === user.id && item.status !== "Paid").reduce((sum, item) => sum + item.amount, 0);

  return (
    <>
      <section className="hero-band">
        <div className="hero-copy">
          <p className="eyebrow">{user.role} account</p>
          <h1>Find trusted {oppositeRole(user.role).toLowerCase()}s before your next deal.</h1>
          <p>Track trade credit, payment behavior, delivery accountability, and location fit from one practical ledger.</p>
          <div className="hero-actions">
            <button className="secondary-btn" onClick={() => setView("discover")}>Discover partners</button>
            <button className="ghost-btn" onClick={() => setView("new")}>Log transaction</button>
          </div>
        </div>
        <div className="metric-board">
          <Metric label="Logged in as" value={user.name} helper={`${user.owner} in ${user.city}`} />
          <Metric label={`Available ${oppositeRole(user.role)}s`} value={partners.length} />
          <Metric label="Your entries" value={transactions.length} />
          <Metric label="Trust score" value={`${user.score.score}/100`} />
        </div>
      </section>
      <section className="stat-grid">
        <Stat label="Trust badge" value={user.score.badge} />
        <Stat label="Suggested limit" value={money(user.suggestedCreditLimit)} />
        <Stat label="Receivable" value={money(receivable)} />
        <Stat label="Payable" value={money(payable)} />
      </section>
      <section className="grid">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Recent ledger</h2>
              <p>Confirmed entries strengthen both parties' trust history.</p>
            </div>
          </div>
          <TransactionTable transactions={transactions.slice(0, 5)} />
        </div>
        <ScoreCard business={user} />
      </section>
      <section className="grid map-grid">
        <LocationPanel business={user} />
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Next best actions</h2>
              <p>Useful product features for the real market.</p>
            </div>
          </div>
          <div className="action-list">
            <div><strong>Collect KYC docs</strong><span>GST, shop photo, trade license, and owner ID improve profile trust.</span></div>
            <div><strong>Set credit limits</strong><span>Use score, payment delays, and ledger size to recommend safe exposure.</span></div>
            <div><strong>Route-aware matching</strong><span>Prioritize partners inside a delivery or pickup radius.</span></div>
          </div>
        </div>
      </section>
    </>
  );
}

function Metric({ label, value, helper }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong>{helper && <p className="muted">{helper}</p>}</div>;
}

function Stat({ label, value }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong></div>;
}

function ScoreCard({ business }) {
  const score = business.score;
  return (
    <div className="panel score-card">
      <div className="panel-head">
        <div>
          <h2>{business.name}</h2>
          <p>{business.role} scorecard</p>
        </div>
        <span className={`badge ${score.tone}`}>{score.badge}</span>
      </div>
      <div className="score-ring" style={{ "--angle": `${score.score * 3.6}deg` }}>
        <div className="score-ring-inner"><strong>{score.score}</strong></div>
      </div>
      <div className="score-factors">
        <Factor label="Paid on time" value={score.paidOnTime} />
        <Factor label="Mutual confirmation" value={score.confirmation} />
        <Factor label="Clean dispute record" value={score.dispute} />
        <Factor label="Transaction depth" value={score.consistency} />
      </div>
    </div>
  );
}

function Factor({ label, value }) {
  return (
    <div className="factor">
      <span>{label}</span>
      <div className="bar"><i style={{ "--value": `${value}%` }} /></div>
      <span>{value}%</span>
    </div>
  );
}

function LocationPanel({ business }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h2>Business location</h2>
          <p>{business.address}, {business.city} {business.pincode}</p>
        </div>
        <a className="primary-btn link-btn" href={business.mapsUrl} target="_blank" rel="noreferrer">Maps</a>
      </div>
      <div className="map-card">
        <div className="map-pin">⌖</div>
        <strong>{business.name}</strong>
        <span>{business.lat}, {business.lng}</span>
      </div>
    </div>
  );
}

function Transactions({ transactions, onConfirm, onPaid }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const filtered = transactions.filter((item) => {
    const isOverdue = item.status !== "Paid" && new Date(item.dueDate) < new Date();
    const matchesStatus = status === "All" || item.status === status || (status === "Overdue" && isOverdue);
    const text = `${item.product} ${item.notes} ${item.from.name} ${item.to.name}`.toLowerCase();
    return matchesStatus && text.includes(query.toLowerCase());
  });

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Transaction ledger</h2>
          <p>Search, confirm, or mark payments from your linked entries.</p>
        </div>
      </div>
      <div className="filters">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product or partner" />
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option>All</option>
          <option>Paid</option>
          <option>Unpaid</option>
          <option>Overdue</option>
        </select>
      </div>
      <TransactionTable transactions={filtered} onConfirm={onConfirm} onPaid={onPaid} />
    </section>
  );
}

function TransactionTable({ transactions, onConfirm, onPaid }) {
  if (!transactions.length) return <div className="empty">No transactions match this view.</div>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>Product</th>
            <th>Amount</th>
            <th>Due</th>
            <th>Status</th>
            <th>Verified</th>
            {(onConfirm || onPaid) && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {transactions.map((item) => {
            const verified = item.confirmedBy.includes(item.fromId) && item.confirmedBy.includes(item.toId);
            return (
              <tr key={item.id}>
                <td>{item.from.name}</td>
                <td>{item.to.name}</td>
                <td>{item.product}</td>
                <td>{money(item.amount)}</td>
                <td>{dateLabel(item.dueDate)}</td>
                <td><span className={`badge ${item.status === "Paid" ? "green" : "yellow"}`}>{item.status}</span></td>
                <td><span className={`badge ${verified ? "green" : "blue"}`}>{verified ? "Both" : `${item.confirmedBy.length}/2`}</span></td>
                {(onConfirm || onPaid) && (
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" title="Confirm" onClick={() => onConfirm(item.id)}>✓</button>
                      <button className="icon-btn" title="Paid" onClick={() => onPaid(item.id)}>₹</button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Discover({ user, partners, requests, onRequest }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("distance");
  const requestedIds = new Set(requests.outgoing.filter((item) => item.status !== "Rejected").map((item) => item.toId));
  const sorted = useMemo(() => {
    const items = partners.filter((partner) => `${partner.name} ${partner.city} ${partner.category}`.toLowerCase().includes(query.toLowerCase()));
    return [...items].sort((a, b) => {
      if (sort === "score") return b.score.score - a.score.score;
      if (sort === "limit") return b.suggestedCreditLimit - a.suggestedCreditLimit;
      return (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999);
    });
  }, [partners, query, sort]);

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Available {oppositeRole(user.role)}s</h2>
          <p>Use score, distance, verification, and safe limit before starting credit.</p>
        </div>
      </div>
      <div className="filters">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, city, category" />
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="distance">Nearest first</option>
          <option value="score">Highest score</option>
          <option value="limit">Highest safe limit</option>
        </select>
      </div>
      <div className="cards">
        {sorted.map((partner) => (
          <article className="card partner-card" key={partner.id}>
            <div className="card-top">
              <div className="avatar">{partner.name.slice(0, 2).toUpperCase()}</div>
              <span className={`badge ${partner.score.tone}`}>{partner.score.score}</span>
            </div>
            <h3>{partner.name}</h3>
            <p>{partner.role} | {partner.city} | {partner.category}</p>
            <p>{partner.owner} | {partner.phone}</p>
            <div className="mini-stats">
              <span>{partner.distanceKm === null ? "Distance unknown" : `${partner.distanceKm} km away`}</span>
              <span>{partner.verification}</span>
              <span>Safe limit {money(partner.suggestedCreditLimit)}</span>
            </div>
            <div className="row-actions">
              <button className="primary-btn" disabled={requestedIds.has(partner.id)} onClick={() => onRequest(partner.id)}>
                {requestedIds.has(partner.id) ? "Requested" : "Connect"}
              </button>
              <a className="ghost-btn link-btn" href={partner.routeUrl} target="_blank" rel="noreferrer">Route</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Requests({ requests, onUpdate }) {
  return (
    <section className="grid">
      <RequestList title="Incoming requests" items={requests.incoming} incoming onUpdate={onUpdate} />
      <RequestList title="Sent requests" items={requests.outgoing} />
    </section>
  );
}

function RequestList({ title, items, incoming, onUpdate }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          <p>{incoming ? "Accept a partner before regular trade credit." : "Track who you have contacted."}</p>
        </div>
      </div>
      {!items.length && <div className="empty">No requests here.</div>}
      <div className="request-list">
        {items.map((item) => {
          const other = incoming ? item.from : item.to;
          return (
            <article className="request-item" key={item.id}>
              <div>
                <h3>{other.name}</h3>
                <p>{other.role} | {other.city}</p>
                <p className="muted">{item.message}</p>
              </div>
              <div className="row-actions">
                <span className={`badge ${item.status === "Accepted" ? "green" : item.status === "Rejected" ? "red" : "yellow"}`}>{item.status}</span>
                {incoming && item.status === "Pending" && (
                  <>
                    <button className="primary-btn" onClick={() => onUpdate(item.id, "Accepted")}>Accept</button>
                    <button className="ghost-btn" onClick={() => onUpdate(item.id, "Rejected")}>Reject</button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function TransactionForm({ user, partners, onSubmit, setView }) {
  const distributors = user.role === "Distributor" ? [user] : partners;
  const retailers = user.role === "Retailer" ? [user] : partners;
  const [form, setForm] = useState({
    fromId: distributors[0]?.id || "",
    toId: retailers[0]?.id || "",
    product: "",
    amount: "",
    invoiceDate: todayIso(),
    dueDate: "",
    status: "Unpaid",
    notes: ""
  });

  return (
    <section className="grid">
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Log transaction</h2>
            <p>Record the trade details both parties will verify.</p>
          </div>
        </div>
        <form className="form-grid" onSubmit={(event) => submitForm(event, onSubmit, form, console.error)}>
          <label className="field">
            <span>Seller or distributor</span>
            <select value={form.fromId} onChange={(event) => setForm({ ...form, fromId: event.target.value })}>
              {distributors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Buyer or retailer</span>
            <select value={form.toId} onChange={(event) => setForm({ ...form, toId: event.target.value })}>
              {retailers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <Field className="full" label="Products supplied" value={form.product} onChange={(product) => setForm({ ...form, product })} />
          <Field label="Invoice amount" type="number" value={form.amount} onChange={(amount) => setForm({ ...form, amount })} />
          <Field label="Invoice date" type="date" value={form.invoiceDate} onChange={(invoiceDate) => setForm({ ...form, invoiceDate })} />
          <Field label="Payment due date" type="date" value={form.dueDate} onChange={(dueDate) => setForm({ ...form, dueDate })} />
          <label className="field">
            <span>Payment status</span>
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option>Unpaid</option>
              <option>Paid</option>
            </select>
          </label>
          <label className="field full">
            <span>Notes</span>
            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </label>
          <div className="form-actions field full">
            <button className="primary-btn" type="submit">Save transaction</button>
            <button className="ghost-btn" type="button" onClick={() => setView("dashboard")}>Cancel</button>
          </div>
        </form>
      </div>
      <ScoreCard business={user} />
    </section>
  );
}
