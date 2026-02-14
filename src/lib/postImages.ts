const IMAGE_URL_PATTERN = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)|<img[^>]+src=["']([^"']+)["']/g

const POST_IMAGE_BUCKET = 'post-images'

function normalizePath(path: string): string {
  return decodeURIComponent(path).replace(/^\/+/, '')
}

export function extractStoragePathFromPublicUrl(urlValue: string, bucket: string): string | null {
  try {
    const url = new URL(urlValue)
    const marker = `/storage/v1/object/public/${bucket}/`
    const markerIndex = url.pathname.indexOf(marker)
    if (markerIndex === -1) return null

    const rawPath = url.pathname.slice(markerIndex + marker.length)
    if (!rawPath) return null

    return normalizePath(rawPath)
  } catch {
    return null
  }
}

export function extractPostImageStoragePaths(content: string): string[] {
  const found = new Set<string>()

  for (const match of content.matchAll(IMAGE_URL_PATTERN)) {
    const rawUrl = match[1] || match[2]
    if (!rawUrl) continue

    const path = extractStoragePathFromPublicUrl(rawUrl, POST_IMAGE_BUCKET)
    if (path) {
      found.add(path)
    }
  }

  return Array.from(found)
}

export async function syncPostImageReferences(
  supabase: {
    from: (table: string) => any
  },
  postId: string,
  content: string
) {
  const paths = extractPostImageStoragePaths(content)

  const { data: currentRefs } = await supabase
    .from('post_image_references')
    .select('image_id')
    .eq('post_id', postId)

  const currentIds = (currentRefs || []).map((ref: { image_id: string }) => ref.image_id)

  if (paths.length === 0) {
    if (currentIds.length > 0) {
      await supabase
        .from('post_image_references')
        .delete()
        .eq('post_id', postId)
    }
    return
  }

  const { data: images } = await supabase
    .from('stored_images')
    .select('id, storage_path')
    .eq('bucket', POST_IMAGE_BUCKET)
    .in('storage_path', paths)

  const imageIds = (images || []).map((img: { id: string }) => img.id)
  if (imageIds.length === 0) {
    if (currentIds.length > 0) {
      await supabase
        .from('post_image_references')
        .delete()
        .eq('post_id', postId)
    }
    return
  }

  const toAdd = imageIds.filter((id) => !currentIds.includes(id))
  const toRemove = currentIds.filter((id) => !imageIds.includes(id))

  if (toAdd.length > 0) {
    await supabase
      .from('post_image_references')
      .insert(toAdd.map((imageId) => ({ post_id: postId, image_id: imageId })))
  }

  if (toRemove.length > 0) {
    await supabase
      .from('post_image_references')
      .delete()
      .eq('post_id', postId)
      .in('image_id', toRemove)
  }

  await supabase
    .from('stored_images')
    .update({
      status: 'used',
      last_referenced_at: new Date().toISOString(),
    })
    .in('id', imageIds)
}
