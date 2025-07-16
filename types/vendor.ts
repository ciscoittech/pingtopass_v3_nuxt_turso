export interface Vendor {
  id: string
  name: string
  description: string | null
  website: string | null
  logoUrl: string | null
  isActive: boolean
  examCount?: number
  createdAt: number | string
  updatedAt: number | string
}

export interface VendorFormData {
  id?: string
  name: string
  description: string
  website: string
  logoUrl: string
  isActive: boolean
}

export interface VendorFilters {
  search: string
  status: 'all' | 'active' | 'inactive'
  hasExams: boolean | null
}

export interface VendorStats {
  total: number
  active: number
  inactive: number
  withExams: number
}