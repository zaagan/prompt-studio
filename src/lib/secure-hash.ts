// Generate secure hash for MCP endpoints
export const generateSecureHash = (promptId: number, promptTitle: string): string => {
  // Create a secure hash using prompt ID, title, and timestamp
  const timestamp = Date.now()
  const randomSalt = Math.random().toString(36).substring(2, 15)
  const baseString = `${promptId}-${promptTitle}-${timestamp}-${randomSalt}`
  
  // Simple hash function for client-side use (in production, consider using crypto.subtle.digest)
  let hash = 0
  for (let i = 0; i < baseString.length; i++) {
    const char = baseString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Convert to positive hex string with additional entropy
  const hexHash = Math.abs(hash).toString(16)
  const additionalEntropy = Math.random().toString(36).substring(2, 10)
  
  return `${hexHash}${additionalEntropy}`.substring(0, 16)
}