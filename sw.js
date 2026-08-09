// دارك — Service Worker للتطبيق (PWA)
const CACHE = "darak-v3";
const CORE = ["./", "./index.html", "./manifest.json", "./assets/logo.png", "./assets/icon-192.png", "./assets/icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});

// 🔔 استقبال إشعارات Push والتطبيق مغلق (من Firebase Cloud Messaging)
self.addEventListener("push", e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) {}
  const n = data.notification || {};
  const title = n.title || "دارك";
  e.waitUntil(self.registration.showNotification(title, {
    body: n.body || "",
    icon: "./assets/icon-192.png",
    badge: "./assets/icon-192.png",
    dir: "rtl",
    lang: "ar",
    data: { url: (data.fcmOptions && data.fcmOptions.link) || "./index.html" }
  }));
});

// الضغط على الإشعار — يفتح التطبيق أو يركز عليه إذا كان مفتوحًا
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./index.html";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const c of list) { if ("focus" in c) return c.focus(); }
      return clients.openWindow(url);
    })
  );
});
