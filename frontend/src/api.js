const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

let token = localStorage.getItem("token") || null;

function setToken(t) {
  token = t;
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
}

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    setToken(null);
  }
  if (!res.ok) {
    throw new Error(data.error || `Error ${res.status}`);
  }
  return data;
}

export const api = {
  getToken: () => token,
  setToken,
  logout: () => setToken(null),

  // --- autenticación ---
  login: (correo, password) => request("/auth/login", { method: "POST", body: { correo, password } }).then((d) => {
    setToken(d.token);
    return d.user;
  }),
  me: () => request("/auth/me").then((d) => d.user),
  changeMyPassword: (passwordActual, passwordNueva) =>
    request("/auth/change-password", { method: "POST", body: { passwordActual, passwordNueva } }),

  // --- usuarios (admin) ---
  listUsers: () => request("/users").then((d) => d.users),
  createUser: (payload) => request("/users", { method: "POST", body: payload }).then((d) => d.user),
  updateUser: (id, payload) => request(`/users/${id}`, { method: "PUT", body: payload }).then((d) => d.user),
  deleteUser: (id) => request(`/users/${id}`, { method: "DELETE" }),
  resetPassword: (id, password) => request(`/users/${id}/reset-password`, { method: "POST", body: { password } }).then((d) => d.password),

  // --- especificaciones ---
  getSpecs: () => request("/specs").then((d) => d.specs),
  saveSpec: (area, payload) => request(`/specs/${area}`, { method: "PUT", body: payload }).then((d) => d.spec),

  // --- ítems ---
  listItems: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/items${qs ? `?${qs}` : ""}`).then((d) => d.items);
  },
  createItem: (payload) => request("/items", { method: "POST", body: payload }).then((d) => d.item),
  updateItem: (id, payload) => request(`/items/${id}`, { method: "PUT", body: payload }).then((d) => d.item),
  submitItem: (id) => request(`/items/${id}/submit`, { method: "POST" }).then((d) => d.item),
  reviewItem: (id, aprobar, comentario) =>
    request(`/items/${id}/review`, { method: "POST", body: { aprobar, comentario } }).then((d) => d.item),
  deleteItem: (id) => request(`/items/${id}`, { method: "DELETE" }),
  importItems: (items, nombreArchivo) =>
    request("/items/import", { method: "POST", body: { items, nombreArchivo } }),
  uploadImagen: async (archivo) => {
    const fd = new FormData();
    fd.append("archivo", archivo);
    const res = await fetch(`${API_BASE}/items/upload-imagen`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    return data.url;
  },

  // --- pruebas armadas ---
  listTests: () => request("/tests").then((d) => d.tests),
  createTest: (payload) => request("/tests", { method: "POST", body: payload }).then((d) => d.test),
  deleteTest: (id) => request(`/tests/${id}`, { method: "DELETE" }),
};
