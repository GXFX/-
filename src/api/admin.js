import { api } from "./client";

export function getReports(statusFilter) {
  return api.get("/admin/reports", statusFilter ? { status_filter: statusFilter } : undefined);
}

export function updateReportStatus(reportId, status) {
  return api.put(`/admin/reports/${reportId}/status`, { status });
}

export function getAdminUsers() {
  return api.get("/admin/users");
}

export function banUser(userId) {
  return api.post(`/admin/users/${userId}/ban`);
}

export function unbanUser(userId) {
  return api.post(`/admin/users/${userId}/unban`);
}

export function getPendingVerifications() {
  return api.get("/admin/verifications");
}

export function reviewVerification(userId, approve) {
  return api.post(`/admin/users/${userId}/verification`, { approve });
}
export function updateUserBirthDate(userId, dateOfBirth) {
  return api.put(`/admin/users/${userId}/birth-date`, { date_of_birth: dateOfBirth });
}