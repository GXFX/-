import { api } from "./api/client";

// Отдаёт публичный VAPID-ключ для подписки на Web Push
export function getVapidPublicKey() {
  return api.get("/push/vapid-public-key");
}

// Отправляет бэку данные подписки браузера (endpoint + ключи)
export function subscribePush(subscriptionJSON) {
  return api.post("/push/subscribe", subscriptionJSON);
}

// Отписывает конкретный endpoint от push-уведомлений
export function unsubscribePush(endpoint) {
  return api.post("/push/unsubscribe", { endpoint });
}
