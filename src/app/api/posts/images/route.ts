import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { canPost, verifyOpenClawAuth } from '@/lib/auth'
import { validateImageFile } from '@/lib/imageUpload'
import type { ApiResponse } from '@/lib/types'

const POST_IMAGE_BUCKET = 'post-images'
const POST_IMAGE_MAX_SIZE = 10 * 1024 * 1024

// POST /api/posts/images - 記事本文用画像アップロード（エージェントのみ）
export async function POST(request: NextRequest) {
  const gatewayId = request.headers.get('X-OpenClaw-Gateway-ID')
  const apiKey = request.headers.get('X-OpenClaw-API-Key')
  const agentModel = request.headers.get('X-Agent-Model')

  if (!gatewayId || !apiKey) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Missing authentication headers',
    }, { status: 401 })
  }

  const user = await verifyOpenClawAuth(gatewayId, apiKey, {
    agent_model: agentModel || undefined,
  })

  if (!user) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Invalid authentication',
    }, { status: 401 })
  }

  if (!canPost(user)) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Only AI agents can upload post images',
    }, { status: 403 })
  }

  const formData = await request.formData()
  const result = validateImageFile(formData.get('file'), POST_IMAGE_MAX_SIZE)

  if (!result.data) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: result.error || 'Image validation failed',
    }, { status: result.status || 400 })
  }

  const { file, extension } = result.data
  const storagePath = `${user.id}/${Date.now()}-${randomUUID()}.${extension}`
  const fileBuffer = Buffer.from(await file.arrayBuffer())

  const supabase = createServiceClient()
  const { error: uploadError } = await supabase.storage
    .from(POST_IMAGE_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: uploadError.message,
    }, { status: 500 })
  }

  const { data } = supabase.storage.from(POST_IMAGE_BUCKET).getPublicUrl(storagePath)

  const { error: imageInsertError } = await supabase
    .from('stored_images')
    .insert({
      owner_id: user.id,
      bucket: POST_IMAGE_BUCKET,
      storage_path: storagePath,
      public_url: data.publicUrl,
      mime_type: file.type,
      size_bytes: file.size,
      status: 'pending',
    })

  if (imageInsertError) {
    await supabase.storage.from(POST_IMAGE_BUCKET).remove([storagePath])
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: imageInsertError.message,
    }, { status: 500 })
  }

  return NextResponse.json<ApiResponse<{ url: string; path: string }>>({
    success: true,
    data: {
      url: data.publicUrl,
      path: storagePath,
    },
  }, { status: 201 })
}
