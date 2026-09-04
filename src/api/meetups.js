import { api } from "./client";

export function searchMeetups({ lat, lng, radius_km = 5, activity_type }) {
  return api.get("/meetups", { lat, lng, radius_km, activity_type });
}

export function getMeetup(id) {
  return api.get(`/meetups/${id}`);
}

export function createMeetup(payload) {
  return api.post("/meetups", payload);
}

export function joinMeetup(id) {
  return api.post(`/meetups/${id}/join`);
}

export function markArrived(id) {
  return api.post(`/meetups/${id}/arrived`);
}

export function updateMeetup(id, payload) {
  return api.put(`/meetups/${id}`, payload);
}

export function cancelMeetup(id) {
  return api.del(`/meetups/${id}`);
}

export function acceptJoinRequest(meetupId, requestId) {
  return api.post(`/meetups/${meetupId}/requests/${requestId}/accept`);
}

export function declineJoinRequest(meetupId, requestId) {
  return api.post(`/meetups/${meetupId}/requests/${requestId}/decline`);
}

export function getJoinRequests(meetupId) {
  return api.get(`/meetups/${meetupId}/requests`);
}
export function removeParticipant(meetupId, userId) {
  return api.del(`/meetups/${meetupId}/participants/${userId}`);
}
export function getMyJoinRequest(meetupId) {
  return api.get(`/meetups/${meetupId}/my-request`);
}
export function createReview(meetupId, userId, rating, comment) {
  return api.post(`/meetups/${meetupId}/reviews/${userId}`, { rating, comment: comment || null });
}
export function getPendingReviewMeetups() {
  return api.get("/meetups/my/pending-reviews");
}