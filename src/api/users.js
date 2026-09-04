import { api } from "./client";

export function getMe() {
  return api.get("/users/me");
}

export function updateMe(payload) {
  return api.put("/users/me", payload);
}

export function getUser(id) {
  return api.get(`/users/${id}`);
}
export function getUserReviews(userId) {
  return api.get(`/users/${userId}/reviews`);
}
export function searchUsers(query) {
  return api.get(`/users/search?q=${encodeURIComponent(query)}`);
}
export function sendFriendRequest(userId) {
  return api.post(`/users/${userId}/friend-requests`);
}
export function getIncomingFriendRequests() {
  return api.get("/friend-requests/incoming");
}
export function acceptFriendRequest(requestId) {
  return api.post(`/friend-requests/${requestId}/accept`);
}
export function declineFriendRequest(requestId) {
  return api.post(`/friend-requests/${requestId}/decline`);
}
export function getMyFriends() {
  return api.get("/users/me/friends");
}
// Добавь эти функции в конец файла meetup-frontend/src/api/users.js

/**
// Замени существующую функцию uploadAvatar в meetup-frontend/src/api/users.js на эту:

/**
 * Upload avatar file to Cloudinary via backend
 * @param {File} file - Image file (jpg, png, gif, webp, max 5MB)
 * @returns {Promise<Object>} Updated user object with new photo_url
 */
export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append("file", file);

  // Don't set Content-Type manually — the browser sets it
  // automatically with the correct multipart boundary.
  return api.post("/users/me/avatar", formData);
}

/**
 * Get list of default avatar templates
 * @returns {Promise<Object>} {avatars: [{id, name, url}, ...]}
 */
export async function getDefaultAvatars() {
  return api.get("/users/avatars/default");
}

/**
 * Set one of the default avatars for current user
 * @param {string} avatarId - ID of the default avatar (e.g., "avatar_1")
 * @returns {Promise<Object>} Updated user object with new photo_url
 */
export async function setDefaultAvatar(avatarId) {
  return api.post(`/users/me/avatar/default/${avatarId}`);
}
export function sendSupportMessage(reason) {
  return api.post("/users/support/message", { reason });
}
export function requestVerification(contact) {
  return api.post("/users/me/request-verification", { contact });
}
export function deactivateMe() {
  return api.post('/users/me/deactivate');
}