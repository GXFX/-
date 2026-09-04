import { api } from "./client";

export function getChats() {
  return api.get("/chats");
}

export function getChatMessages(chatId) {
  return api.get(`/chats/${chatId}/messages`);
}

export function sendMessage(chatId, content) {
  return api.post(`/chats/${chatId}/messages`, { content });
}

export function getOrCreateDirectChat(userId) {
  return api.post(`/chats/direct/${userId}`);
}
export function markChatRead(chatId) {
  return api.post(`/chats/${chatId}/read`);
}
export function hideChat(chatId) {
  return api.del(`/chats/${chatId}`);
}
