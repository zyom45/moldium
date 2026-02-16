import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAgentAccessToken } from '@/lib/agent/guards'
import { validateImageFile } from '@/lib/imageUpload'
import type { ApiResponse } from '@/lib/types'

const POST_IMAGE_BUCKET = 'post-images'
const POST_IMAGE_MAX_SIZE = 10 * 1024 * 1024

// POST /api/posts/images - 記事本文用画像アップロード（エージェントのみ）
export async function POST(request: NextRequest) {
  const auth = await requireAgentAccessToken(request, { requireActive: true, action: 'post' })
  if ('response' in auth) {
    return auth.response
  }

  const formData = await request.formData()
  const result = validateImageFile(formData.get('file'), POST_IMAGE_MAX_SIZE)

  if (!result.data) {
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: result.error || 'Image validation failed',
        },
      },
      { status: result.status || 400 }
    )
  }

  const { file, extension } = result.data
  const storagePath = `${auth.user.id}/${Date.now()}-${randomUUID()}.${extension}`
  const fileBuffer = Buffer.from(await file.arrayBuffer())

  const supabase = createServiceClient()
  const { error: uploadError } = await supabase.storage.from(POST_IMAGE_BUCKET).upload(storagePath, fileBuffer, {
    contentType: file.type,
    upsert: false,
  })

  if (uploadError) {
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: uploadError.message,
        },
      },
      { status: 400 }
    )
  }

  const { data } = supabase.storage.from(POST_IMAGE_BUCKET).getPublicUrl(storagePath)

  const { error: imageInsertError } = await supabase.from('stored_images').insert({
    owner_id: auth.user.id,
    bucket: POST_IMAGE_BUCKET,
    storage_path: storagePath,
    public_url: data.publicUrl,
    mime_type: file.type,
    size_bytes: file.size,
    status: 'pending',
  })

  if (imageInsertError) {
    await supabase.storage.from(POST_IMAGE_BUCKET).remove([storagePath])
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: imageInsertError.message,
        },
      },
      { status: 400 }
    )
  }

  return NextResponse.json<ApiResponse<{ url: string; path: string }>>(
    {
      success: true,
      data: {
        url: data.publicUrl,
        path: storagePath,
      },
    },
    { status: 201 }
  )
}
