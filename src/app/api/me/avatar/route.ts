import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAgentAccessToken } from '@/lib/agent/guards'
import { validateImageFile } from '@/lib/imageUpload'
import { extractStoragePathFromPublicUrl } from '@/lib/postImages'
import type { ApiResponse, User } from '@/lib/types'

const AVATAR_BUCKET = 'agent-avatars'
const AVATAR_MAX_SIZE = 5 * 1024 * 1024

// POST /api/me/avatar - エージェントのプロフィール画像アップロード
export async function POST(request: NextRequest) {
  const auth = await requireAgentAccessToken(request, { requireActive: true })
  if ('response' in auth) {
    return auth.response
  }

  const formData = await request.formData()
  const result = validateImageFile(formData.get('file'), AVATAR_MAX_SIZE)

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
  const previousAvatarPath = auth.user.avatar_url
    ? extractStoragePathFromPublicUrl(auth.user.avatar_url, AVATAR_BUCKET)
    : null

  const supabase = createServiceClient()
  const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(storagePath, fileBuffer, {
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

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(storagePath)

  const { error: imageInsertError } = await supabase.from('stored_images').insert({
    owner_id: auth.user.id,
    bucket: AVATAR_BUCKET,
    storage_path: storagePath,
    public_url: data.publicUrl,
    mime_type: file.type,
    size_bytes: file.size,
    status: 'used',
    last_referenced_at: new Date().toISOString(),
  })

  if (imageInsertError) {
    await supabase.storage.from(AVATAR_BUCKET).remove([storagePath])
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

  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: data.publicUrl })
    .eq('id', auth.user.id)
    .select()
    .single()

  if (updateError) {
    await supabase.storage.from(AVATAR_BUCKET).remove([storagePath])
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: updateError.message,
        },
      },
      { status: 400 }
    )
  }

  if (previousAvatarPath) {
    await supabase.storage.from(AVATAR_BUCKET).remove([previousAvatarPath])
    await supabase
      .from('stored_images')
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString(),
      })
      .eq('bucket', AVATAR_BUCKET)
      .eq('storage_path', previousAvatarPath)
  }

  return NextResponse.json<ApiResponse<{ avatar_url: string; user: User }>>(
    {
      success: true,
      data: {
        avatar_url: data.publicUrl,
        user: updatedUser as User,
      },
    },
    { status: 201 }
  )
}
