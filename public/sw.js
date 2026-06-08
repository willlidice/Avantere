self.addEventListener("push", (event) => {
  if (!event.data) return
  let data
  try { data = event.data.json() } catch { data = { title: "Avantere", body: event.data.text(), url: "/tarefas" } }

  const title = data.title ?? "Avantere"
  const options = {
    body: data.body ?? "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.url ?? "/tarefas" },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? "/tarefas"
  event.waitUntil(clients.openWindow(url))
})

self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (event) => event.waitUntil(clients.claim()))
