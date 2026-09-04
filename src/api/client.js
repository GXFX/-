const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

function getAccessToken() {
  return localStorage.getItem("access_token");
}

function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

let refreshPromise = null;

async function tryRefreshToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return false;
        const data = await res.json();
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// Extract a readable string from FastAPI error response.
// data.detail can be: a string, OR an array of validation errors
// like [{loc: [...], msg: "...", type: "..."}] — in that case
// we join all `msg` fields into one readable string.
function extractErrorMessage(data, fallbackStatus) {
  if (!data) return `Request failed: ${fallbackStatus}`;
  const detail = data.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg || JSON.stringify(d)).join("; ");
  }
  if (detail && typeof detail === "object") {
    return detail.msg || JSON.stringify(detail);
  }
  return `Request failed: ${fallbackStatus}`;
}

async function request(
  path,
  { method = "GET", body, auth = true, params, _retried = false } = {},
) {
  let url = `${BASE_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null),
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const headers = {};
  if (!isFormData) {
    // Only set JSON content-type for plain JSON bodies.
    // For FormData, the browser sets the correct
    // multipart/form-data boundary header automatically —
    // setting it manually breaks the upload.
    headers["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    if (res.status === 401 && auth && !_retried) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        return request(path, { method, body, auth, params, _retried: true });
      }
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.dispatchEvent(new Event("auth:logout"));
    }
    const message = extractErrorMessage(data, res.status);
    throw new ApiError(message, res.status, data);
  }

  return data;
}

export const api = {
  get: (path, params) => request(path, { params }),
  post: (path, body, opts) => request(path, { method: "POST", body, ...opts }),
  put: (path, body) => request(path, { method: "PUT", body }),
  del: (path) => request(path, { method: "DELETE" }),
};