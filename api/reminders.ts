// Sends due reminders. The database calls this every 15 minutes with its
// private password, and the database decides who is due.
import { createClient } from '@supabase/supabase-js'
import { sendNotification, setVapidDetails } from 'web-push'

const MESSAGES = [
  'Your squad is moving. Are you?',
  'Riot break! One quick set.',
  'A minute now beats a streak lost later.',
  'Your squad can see who moved today.',
  'Boring workouts are cancelled. This one is fun.',
]

type Due = { endpoint: string; p256dh: string; auth: string; sets_left: number }

export async function POST(request: Request): Promise<Response> {
  const secret = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  const url = process.env.VITE_SUPABASE_URL
  const anon = process.env.VITE_SUPABASE_ANON_KEY
  const publicKey = process.env.VITE_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!secret) return new Response('missing password', { status: 401 })
  if (!url || !anon || !publicKey || !privateKey) return new Response('server keys missing', { status: 500 })

  const db = createClient(url, anon, { auth: { persistSession: false } })
  const { data, error } = await db.rpc('due_reminders', { p_secret: secret })
  if (error) return new Response(error.message, { status: error.code === '42501' ? 401 : 500 })

  setVapidDetails(`https://${request.headers.get('host') ?? 'reprascal.vercel.app'}`, publicKey, privateKey)
  const due = (data ?? []) as Due[]
  let sent = 0
  let dropped = 0
  await Promise.all(
    due.map(async (d) => {
      const title = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
      const body = `${d.sets_left} set${d.sets_left === 1 ? '' : 's'} left today. About ${Math.max(1, d.sets_left)} minute${d.sets_left === 1 ? '' : 's'}.`
      try {
        await sendNotification(
          { endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } },
          JSON.stringify({ title, body, url: '/' }),
          { TTL: 60 * 60, urgency: 'normal' },
        )
        sent++
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode
        // 404/410: the phone turned notifications off or the app was removed.
        if (status === 404 || status === 410) {
          await db.rpc('drop_push_subscription', { p_secret: secret, p_endpoint: d.endpoint })
          dropped++
        }
      }
    }),
  )
  return Response.json({ due: due.length, sent, dropped })
}
