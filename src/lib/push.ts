import webpush from "web-push"

const publicKey = process.env.VAPID_PUBLIC_KEY ?? ""
const privateKey = process.env.VAPID_PRIVATE_KEY ?? ""
const email = process.env.VAPID_EMAIL ?? "mailto:admin@avantere.com"

if (publicKey && privateKey) {
  webpush.setVapidDetails(email, publicKey, privateKey)
}

export async function enviarPushPara(userId: number, payload: object) {
  const { prisma } = await import("@/lib/prisma")
  const sub = await prisma.pushSubscription.findUnique({ where: { userId } })
  if (!sub) return

  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    )
  } catch (err: unknown) {
    // Subscription expirada — limpar
    if ((err as { statusCode?: number }).statusCode === 410) {
      await prisma.pushSubscription.delete({ where: { userId } })
    }
  }
}

export { publicKey as VAPID_PUBLIC_KEY }
