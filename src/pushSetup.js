import { getVapidPublicKey, subscribePush, unsubscribePush } from "./api_push";

// Web Push требует VAPID-ключ в формате Uint8Array, а бэк отдаёт его
// как base64url-строку — это стандартная функция-конвертер для этого.
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function isPushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window;
}

export async function getPushSubscriptionStatus() {
  if (!(await isPushSupported())) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return sub ? "subscribed" : "not-subscribed";
}

export async function enablePushNotifications() {
  if (!(await isPushSupported())) {
    throw new Error("Уведомления не поддерживаются этим браузером");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Разрешение на уведомления не дано");
  }

  const { public_key } = await getVapidPublicKey();
  const reg = await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(public_key),
    });
  }

  await subscribePush(sub.toJSON());
  return sub;
}

export async function disablePushNotifications() {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    await unsubscribePush(sub.endpoint);
    await sub.unsubscribe();
  }
}
