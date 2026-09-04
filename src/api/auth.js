import { api } from "./client";

export async function login(phone, password) {
  const data = await api.post(
    "/auth/login",
    { phone, password },
    { auth: false },
  );
  saveTokens(data);
  return data;
}

export async function register({ phone, password, name, date_of_birth }) {
  const data = await api.post(
    "/auth/register",
    { phone, password, name, date_of_birth },
    { auth: false },
  );
  saveTokens(data);
  return data;
}

export function saveTokens({ access_token, refresh_token }) {
  localStorage.setItem("access_token", access_token);
  localStorage.setItem("refresh_token", refresh_token);
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function isAuthed() {
  return !!localStorage.getItem("access_token");
}

export function onAuthLogout(callback) {
  window.addEventListener("auth:logout", callback);
  return () => window.removeEventListener("auth:logout", callback);
}
export function getJoinRequests(meetupId) {
  return api.get(`/meetups/${meetupId}/requests`);
}

export function acceptJoinRequest(meetupId, requestId) {
  return api.post(`/meetups/${meetupId}/requests/${requestId}/accept`);
}

export function declineJoinRequest(meetupId, requestId) {
  return api.post(`/meetups/${meetupId}/requests/${requestId}/decline`);
}
export function getMyJoinRequest(meetupId) {
  return api.get(`/meetups/${meetupId}/my-request`);
}
