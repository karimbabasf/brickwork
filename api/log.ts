import { BlobPreconditionFailedError, get, put } from '@vercel/blob'
import { createHash, timingSafeEqual } from 'node:crypto'
import { emptyDoc, mergeDocs, sanitizeDoc, type LogDoc } from '../src/lib/merge.js'

// One private log per deployment. The browser sends its whole log; this merges it with
// the stored one under a conditional write, stores the result and returns it.

const PATH = 'brickwork/log.json'
const MAX_BODY = 4_000_000

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })

function authorized(req: Request): boolean {
  const want = process.env.BRICKWORK_TOKEN ?? ''
  if (want.length < 32) return false
  const got = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  // Hash both sides so the comparison is constant-time whatever the lengths.
  const a = createHash('sha256').update(got).digest()
  const b = createHash('sha256').update(want).digest()
  return timingSafeEqual(a, b)
}

async function read(): Promise<{ doc: LogDoc; etag: string | null }> {
  const r = await get(PATH, { access: 'private', useCache: false })
  if (!r || r.statusCode !== 200 || !r.stream) return { doc: emptyDoc(), etag: null }
  const doc = sanitizeDoc(JSON.parse(await new Response(r.stream).text())) ?? emptyDoc()
  return { doc, etag: r.blob.etag }
}

export async function GET(req: Request) {
  if (!authorized(req)) return json({ error: 'unauthorized' }, 401)
  return json((await read()).doc)
}

export async function PUT(req: Request) {
  if (!authorized(req)) return json({ error: 'unauthorized' }, 401)
  const raw = await req.text()
  if (raw.length > MAX_BODY) return json({ error: 'too large' }, 413)
  let incoming: LogDoc | null = null
  try {
    incoming = sanitizeDoc(JSON.parse(raw))
  } catch {
    incoming = null
  }
  if (!incoming) return json({ error: 'not a log' }, 400)

  for (let attempt = 0; attempt < 4; attempt++) {
    const { doc, etag } = await read()
    const merged = mergeDocs(doc, incoming)
    try {
      await put(PATH, JSON.stringify(merged), {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        cacheControlMaxAge: 60,
        ...(etag ? { ifMatch: etag } : { allowOverwrite: false }),
      })
      return json(merged)
    } catch (e) {
      // Another device wrote in between: read again and merge on top of it.
      if (e instanceof BlobPreconditionFailedError || (e instanceof Error && /exists|precondition/i.test(e.message))) continue
      throw e
    }
  }
  return json({ error: 'busy, try again' }, 409)
}
