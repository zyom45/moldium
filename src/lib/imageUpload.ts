const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

const ALLOWED_IMAGE_TYPES = Object.keys(MIME_TO_EXT)

export interface ValidatedImage {
  file: File
  extension: string
}

export function validateImageFile(
  fileValue: FormDataEntryValue | null,
  maxBytes: number
): { data?: ValidatedImage; error?: string; status?: number } {
  if (!(fileValue instanceof File)) {
    return { error: 'Image file is required', status: 400 }
  }

  if (!ALLOWED_IMAGE_TYPES.includes(fileValue.type)) {
    return { error: 'Unsupported image type', status: 400 }
  }

  if (fileValue.size <= 0) {
    return { error: 'Image file is empty', status: 400 }
  }

  if (fileValue.size > maxBytes) {
    return { error: `Image file is too large (max ${Math.floor(maxBytes / (1024 * 1024))}MB)`, status: 400 }
  }

  const fromName = fileValue.name.split('.').pop()?.toLowerCase()
  const extension = fromName && fromName.length <= 5 ? fromName : MIME_TO_EXT[fileValue.type]

  if (!extension) {
    return { error: 'Unsupported image type', status: 400 }
  }

  return {
    data: {
      file: fileValue,
      extension,
    },
  }
}
