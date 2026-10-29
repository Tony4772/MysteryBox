const API_BASE = "/api";

class ApiClient {
  constructor() {
    this.token = localStorage.getItem("mb_token") || null;
  }

  get token() { return this._token; }
  set token(v) {
    this._token = v;
    if (v) localStorage.setItem("mb_token", v);
    else localStorage.removeItem("mb_token");
  }

  async request(method, path, body = null) {
    const headers = { "Content-Type": "application/json" };
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error desconocido");
    return data;
  }

  get(path) { return this.request("GET", path); }
  post(path, body) { return this.request("POST", path, body); }
  put(path, body) { return this.request("PUT", path, body); }

  auth = {
    register: (d) => this.post("/auth/register", d),
    login: (d) => this.post("/auth/login", d),
    me: () => this.get("/auth/me"),
  };

  wallet = {
    balance: () => this.get("/wallet/balance"),
    transactions: () => this.get("/wallet/transactions"),
  };

  boxes = {
    list: () => this.get("/boxes/types"),
    detail: (id) => this.get(`/boxes/types/${id}`),
    open: (id) => this.post(`/boxes/open/${id}`),
  };

  inventory = {
    list: () => this.get("/inventory"),
    stats: () => this.get("/inventory/stats"),
  };

  payments = {
    plans: () => this.get("/payments/plans"),
    createOrder: (planId) => this.post("/payments/checkout/culqi", { planId }),
    confirmCulqi: (transactionId, token) => this.post("/payments/confirm/culqi", { transactionId, token }),
  };

  admin = {
    stats: () => this.get("/admin/stats"),
    users: () => this.get("/admin/users"),
    updateUser: (id, data) => this.put(`/admin/users/${id}`, data),
    probabilities: () => this.get("/admin/probabilities"),
    updateProbability: (tierId, probability) => this.put(`/admin/probabilities/${tierId}`, { probability }),
    boxes: () => this.get("/admin/boxes"),
    updateBox: (id, data) => this.put(`/admin/boxes/${id}`, data),
  };
}

const api = new ApiClient();
