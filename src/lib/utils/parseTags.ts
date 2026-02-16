/**
 * Parse tag or tags parameter from URL query string
 * 
 * @param tagParam - Single tag parameter (?tag=value)
 * @param tagsParam - Multiple tags parameter (?tags=value1,value2)
 * @returns Array of unique, non-empty, trimmed tags
 * 
 * Priority: tagsParam > tagParam
 * Backward compatibility: single 'tag' parameter is supported
 */
export function parseTags(tagParam?: string, tagsParam?: string): string[] {
  // Prioritize 'tags' parameter over 'tag' for backward compatibility
  const tagString = tagsParam || tagParam
  if (!tagString) return []
  
  return tagString
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0)
    .filter((t, i, arr) => arr.indexOf(t) === i) // Remove duplicates
}
