const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api"

// Types
export type ServiceCategory = {
  id: string
  code: string
  name: string
  description?: string | null
}

export type ServiceCategoryDetail = {
  id: string
  code: string
  name: string
  description?: string | null
  services: Service[]
  packages: Package[]
}

export type Specialty = {
  id: string
  specialtyCode: string
  name: string
}

export type Service = {
  id: string
  serviceCode: string
  name: string
  price: number | null
  description: string | null
  durationMinutes: number | null
  isActive: boolean
  unit: string | null
  currency: string | null
  requiresDoctor: boolean
  category: ServiceCategory | null
  specialty: Specialty | null
  packageItems?: Array<{
    package: { id: string; code: string; name: string; isActive: boolean }
    quantity: number
    required: boolean
  }>
}

export type PackageItem = {
  id?: string
  serviceId: string
  quantity: number
  priceOverride: number | null
  required: boolean
  sortOrder: number | null
  notes: string | null
  service?: {
    id: string
    serviceCode: string
    name: string
    price: number | null
    requiresDoctor: boolean
    isActive: boolean
  }
}

export type Package = {
  id: string
  code: string
  name: string
  description: string | null
  price: number | null
  isActive: boolean
  requiresDoctor: boolean
  category: ServiceCategory | null
  specialty: Specialty | null
  items: PackageItem[]
}

export type ListResponse<T> = {
  success: boolean
  message: string
  data: {
    services?: T[]
    packages?: T[]
    categories?: T[]
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }
}

export type DetailResponse<T> = {
  success: boolean
  message: string
  data: T
}

export type ServiceFilters = {
  limit?: number
  offset?: number
  isActive?: string
  categoryId?: string
  specialtyId?: string
  requiresDoctor?: string
  search?: string
}

export type ServiceSearchResponse = {
  success: boolean
  message: string
  data: {
    services: Service[]
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }
}

export type PackageFilters = {
  limit?: number
  offset?: number
  isActive?: string
  categoryId?: string
  specialtyId?: string
  requiresDoctor?: string
}

export type CreateServiceDto = {
  name: string
  price: number
  description?: string | null
  durationMinutes?: number | null
  isActive?: boolean
  unit?: string | null
  currency?: string | null
  categoryId?: string
  specialtyId?: string
  requiresDoctor?: boolean
}

export type UpdateServiceDto = Partial<CreateServiceDto>

export type CreatePackageDto = {
  name: string
  price: number
  description?: string | null
  isActive?: boolean
  requiresDoctor?: boolean
  categoryId?: string
  specialtyId?: string
  items: Array<{
    serviceId: string
    quantity?: number
    priceOverride?: number | null
    required?: boolean
    sortOrder?: number | null
    notes?: string | null
  }>
}

export type UpdatePackageDto = Partial<CreatePackageDto>

// Helper function
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  })
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json()
      message = body?.message || JSON.stringify(body)
    } catch (error) {
      console.error('Error fetching services:', error)
    }
    throw new Error(message)
  }
  return (await response.json()) as T
}

// Service Management API
export const servicesService = {
  // List services with filters
  async listServices(filters?: ServiceFilters): Promise<ListResponse<Service>> {
    const params = new URLSearchParams()
    if (filters?.limit) params.set("limit", String(filters.limit))
    if (filters?.offset) params.set("offset", String(filters.offset))
    if (filters?.isActive) params.set("isActive", filters.isActive)
    if (filters?.categoryId) params.set("categoryId", filters.categoryId)
    if (filters?.specialtyId) params.set("specialtyId", filters.specialtyId)
    if (filters?.requiresDoctor) params.set("requiresDoctor", filters.requiresDoctor)
    if (filters?.search) params.set("search", filters.search)
    
    return apiFetch<ListResponse<Service>>(`/services/management/services?${params.toString()}`)
  },

  // Get service detail
  async getService(id: string): Promise<DetailResponse<Service>> {
    return apiFetch<DetailResponse<Service>>(`/services/management/services/${id}`)
  },

  // Create service
  async createService(data: CreateServiceDto): Promise<DetailResponse<Service>> {
    return apiFetch<DetailResponse<Service>>(`/services/management/services`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // Update service
  async updateService(id: string, data: UpdateServiceDto): Promise<DetailResponse<Service>> {
    return apiFetch<DetailResponse<Service>>(`/services/management/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  // Delete service
  async deleteService(id: string): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>(`/services/management/services/${id}`, {
      method: "DELETE",
    })
  },
}

export const serviceSearchApi = {
  async searchServices(query: string, limit = 20, offset = 0): Promise<ServiceSearchResponse> {
    const params = new URLSearchParams({
      query,
      limit: String(limit),
      offset: String(offset),
    })
    return apiFetch<ServiceSearchResponse>(`/services/search?${params.toString()}`)
  },
}

// Package Management API
export const packagesService = {
  // List packages with filters
  async listPackages(filters?: PackageFilters): Promise<ListResponse<Package>> {
    const params = new URLSearchParams()
    if (filters?.limit) params.set("limit", String(filters.limit))
    if (filters?.offset) params.set("offset", String(filters.offset))
    if (filters?.isActive) params.set("isActive", filters.isActive)
    if (filters?.categoryId) params.set("categoryId", filters.categoryId)
    if (filters?.specialtyId) params.set("specialtyId", filters.specialtyId)
    if (filters?.requiresDoctor) params.set("requiresDoctor", filters.requiresDoctor)
    
    return apiFetch<ListResponse<Package>>(`/services/management/packages?${params.toString()}`)
  },

  // Get package detail
  async getPackage(id: string): Promise<DetailResponse<Package>> {
    return apiFetch<DetailResponse<Package>>(`/services/management/packages/${id}`)
  },

  // Create package
  async createPackage(data: CreatePackageDto): Promise<DetailResponse<Package>> {
    return apiFetch<DetailResponse<Package>>(`/services/management/packages`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // Update package
  async updatePackage(id: string, data: UpdatePackageDto): Promise<DetailResponse<Package>> {
    return apiFetch<DetailResponse<Package>>(`/services/management/packages/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  // Delete package
  async deletePackage(id: string): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>(`/services/management/packages/${id}`, {
      method: "DELETE",
    })
  },
}

// Service Categories API
export const serviceCategoriesService = {
  async listCategories(limit = 100, offset = 0, search?: string): Promise<ListResponse<ServiceCategory>> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    if (search) params.set("search", search)
    return apiFetch<ListResponse<ServiceCategory>>(`/service-categories?${params.toString()}`)
  },

  async getCategory(id: string): Promise<DetailResponse<ServiceCategory>> {
    return apiFetch<DetailResponse<ServiceCategory>>(`/service-categories/${id}`)
  },

  async createCategory(data: { code: string; name: string; description?: string }): Promise<DetailResponse<ServiceCategory>> {
    return apiFetch<DetailResponse<ServiceCategory>>(`/service-categories`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async updateCategory(id: string, data: { code?: string; name?: string; description?: string | null }): Promise<DetailResponse<ServiceCategory>> {
    return apiFetch<DetailResponse<ServiceCategory>>(`/service-categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>(`/service-categories/${id}`, {
      method: "DELETE",
    })
  },

  async getCategoryDetail(id: string): Promise<DetailResponse<ServiceCategoryDetail>> {
    return apiFetch<DetailResponse<ServiceCategoryDetail>>(`/service-categories/${id}`)
  },

  async addServiceToCategory(categoryId: string, serviceId: string): Promise<DetailResponse<Service>> {
    return apiFetch<DetailResponse<Service>>(`/service-categories/${categoryId}/services/${serviceId}`, {
      method: "POST",
    })
  },

  async removeServiceFromCategory(categoryId: string, serviceId: string): Promise<DetailResponse<Service>> {
    return apiFetch<DetailResponse<Service>>(`/service-categories/${categoryId}/services/${serviceId}`, {
      method: "DELETE",
    })
  },
}

export const specialtiesService = {
  async listSpecialties(page = 1, limit = 100): Promise<{ data: Specialty[] }> {
    return apiFetch<{ data: Specialty[] }>(`/specialties?page=${page}&limit=${limit}`)
  },
}

