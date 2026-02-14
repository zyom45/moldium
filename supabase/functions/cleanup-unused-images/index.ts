import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret) {
    const authHeader = req.headers.get('authorization') || ''
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ success: false, error: 'Missing Supabase env vars' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const ttlHours = Number(Deno.env.get('UNUSED_POST_IMAGE_TTL_HOURS') || '24')
  const cutoff = new Date(Date.now() - ttlHours * 60 * 60 * 1000).toISOString()

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data: candidates, error: candidatesError } = await supabase.rpc('get_unused_post_images', { cutoff })
  if (candidatesError) {
    return new Response(JSON.stringify({ success: false, error: candidatesError.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const paths = (candidates || []).map((row: { storage_path: string }) => row.storage_path)
  const ids = (candidates || []).map((row: { id: string }) => row.id)

  if (paths.length === 0) {
    return new Response(JSON.stringify({ success: true, removed: 0 }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const { error: removeError } = await supabase.storage.from('post-images').remove(paths)
  if (removeError) {
    return new Response(JSON.stringify({ success: false, error: removeError.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  await supabase
    .from('stored_images')
    .update({
      status: 'deleted',
      deleted_at: new Date().toISOString(),
    })
    .in('id', ids)

  return new Response(JSON.stringify({ success: true, removed: paths.length }), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
})
