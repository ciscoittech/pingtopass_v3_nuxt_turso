import { nanoid } from 'nanoid'

// Generate a unique ID for database records
export function generateId(prefix?: string): string {
  const id = nanoid(12) // 12 character ID
  return prefix ? `${prefix}_${id}` : id
}

// Generate IDs with specific prefixes for different entities
export const generateUserId = () => generateId('usr')
export const generateExamId = () => generateId('exm')
export const generateQuestionId = () => generateId('qst')
export const generateSessionId = () => generateId('ses')
export const generateVendorId = () => generateId('vnd')
export const generateObjectiveId = () => generateId('obj')