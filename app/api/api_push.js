import { api } from "./client";

export function getVapidPublicKey() {
  return api.get("/push/vapid-public-key");
}

export function subscribePush(subscriptionJson) {
  return api.post("/push/subscribe", subscriptionJson);
}

export function unsubscribePush(endpoint) {
  return api.post("/push/unsubscribe", { endpoint });
}

export function sendTestPush() {
  return api.post("/push/test");
}
