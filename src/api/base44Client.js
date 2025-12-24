// Lightweight client used by the React app to talk to the backend API.
// It is intentionally simple and defensive so the UI does not crash
// even if the backend is down or misconfigured during local development.

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4001/api";
const TOKEN_KEY = "cm_auth_token";

function getToken() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token) {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors in development.
  }
}

function dispatchAuthChanged() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event("cm-auth-changed"));
  } catch {
    // Best-effort only.
  }
}

async function apiRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      (data && (data.error || data.message)) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

function buildQuery(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, value);
    }
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const base44 = {
  auth: {
    async login({ email, password }) {
      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (result?.token) {
        setToken(result.token);
        dispatchAuthChanged();
      }

      return result;
    },

    logout() {
      setToken(null);
      dispatchAuthChanged();
    },

    async isAuthenticated() {
      // For now we just check for a token; the hook that uses this
      // will also call `me()` which will fail if the token is invalid.
      return !!getToken();
    },

    async me() {
      return apiRequest("/auth/me", {
        method: "GET",
      });
    },

    redirectToLogin(nextUrl) {
      if (typeof window === "undefined") return;
      const next =
        nextUrl || window.location.href || window.location.pathname || "/";
      const search = new URLSearchParams({ next }).toString();
      window.location.href = `/login?${search}`;
    },
  },

  entities: {
    Listing: {
      async filter(filters = {}, sort) {
        const query = buildQuery(filters);
        const items = await apiRequest(`/listings${query}`, {
          method: "GET",
        });

        if (Array.isArray(items) && sort === "-created_date") {
          items.sort(
            (a, b) =>
              new Date(b.created_date || 0).getTime() -
              new Date(a.created_date || 0).getTime()
          );
        }

        return items || [];
      },

      async create(data) {
        return apiRequest("/listings", {
          method: "POST",
          body: JSON.stringify(data),
        });
      },

      async update(id, data) {
        return apiRequest(`/listings/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
      },

      async delete(id) {
        return apiRequest(`/listings/${id}`, {
          method: "DELETE",
        });
      },
    },

    Message: {
      async filter(filters = {}, sort) {
        const query = buildQuery(filters);
        const items = await apiRequest(`/messages${query}`, {
          method: "GET",
        });

        if (Array.isArray(items) && sort === "-created_date") {
          items.sort(
            (a, b) =>
              new Date(b.created_date || 0).getTime() -
              new Date(a.created_date || 0).getTime()
          );
        }

        return items || [];
      },

      async create(data) {
        return apiRequest("/messages", {
          method: "POST",
          body: JSON.stringify(data),
        });
      },
    },

    Report: {
      async create(data) {
        return apiRequest("/reports", {
          method: "POST",
          body: JSON.stringify(data),
        });
      },
    },
  },

  integrations: {
    Core: {
      // There is no real upload API in this backend; for now we just
      // return a local object URL so images can be previewed in the UI.
      // In a real deployment you would swap this out for cloud storage.
      async UploadFile({ file }) {
        if (typeof window === "undefined" || !file) {
          return { file_url: "" };
        }
        const url = URL.createObjectURL(file);
        return { file_url: url };
      },
    },
  },
};


