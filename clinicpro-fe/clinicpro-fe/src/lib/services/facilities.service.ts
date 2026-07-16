import api from '../config'

// Types
export type Specialty = {
  id: string
  specialtyCode: string
  name: string
  createdAt: string
  updatedAt: string
}

export type ClinicRoom = {
  id: string
  roomCode: string
  roomName: string
  specialtyId: string
  specialty?: { id: string; name: string; specialtyCode: string }
  description: string | null
  address: string | null
  createdAt: string
  updatedAt: string
  services?: Array<{
    id: string
    serviceCode: string
    name: string
    price: number
  }>
  booths?: Booth[]
}

export type Booth = {
  id: string
  boothCode: string
  name: string
  roomId: string
  room?: { id: string; roomCode: string; roomName: string; specialty?: { id: string; name: string; specialtyCode: string } }
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  services?: Array<{
    id: string
    serviceCode: string
    name: string
    price: number
  }>
}

export type ListResponse<T> = {
  data: T[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export type CreateSpecialtyDto = {
  specialtyCode: string
  name: string
}

export type UpdateSpecialtyDto = Partial<CreateSpecialtyDto>

export type CreateClinicRoomDto = {
  roomName: string
  specialtyId: string
  description?: string | null
  address?: string | null
  booths?: Array<{
    name: string
    description?: string | null
    isActive?: boolean
    serviceIds?: string[]
  }>
}

export type UpdateClinicRoomDto = {
  roomName?: string
  specialtyId?: string
  description?: string | null
  address?: string | null
  booths?: Array<{
    id?: string // Nếu có id => cập nhật, nếu không => tạo mới
    name: string
    description?: string | null
    isActive?: boolean
    serviceIds?: string[]
  }>
}

export type CreateBoothDto = {
  name: string
  roomId: string
  description?: string | null
  isActive?: boolean
  serviceIds?: string[]
}

export type UpdateBoothDto = {
  name?: string
  roomId?: string
  description?: string | null
  isActive?: boolean
  serviceIds?: string[]
}

export type CommonServicesResponse = {
  services: Array<{
    id: string
    serviceCode: string
    name: string
    price: number
  }>
}

export type BoothServicesResponse = {
  services: Array<{
    id: string
    serviceCode: string
    name: string
    price: number
  }>
}

export type UpdateCommonServicesDto = {
  serviceIds: string[]
}

export type UpdateBoothServicesDto = {
  serviceIds: string[]
}

// Helper function to unwrap response data
function unwrapResponse<T>(response: { data: T | { data?: T } }): T {
  if (!response || !response.data) {
    throw new Error('Invalid API response: missing data')
  }
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    const nestedData = (response.data as { data?: T }).data
    if (nestedData === undefined) {
      throw new Error('Invalid API response: nested data is undefined')
    }
    return nestedData
  }
  return response.data as T
}

// Specialties API
export const specialtiesService = {
  async listSpecialties(page = 1, limit?: number): Promise<ListResponse<Specialty>> {
    const params: Record<string, string> = { page: String(page) }
    if (limit !== undefined) params.limit = String(limit)
    const response = await api.get<ListResponse<Specialty>>('/specialties', { params })
    // For ListResponse, axios wraps it as { data: { data: [...], meta: {...} } }
    // So we need to return response.data directly, not unwrap it
    if (response.data && typeof response.data === 'object' && 'data' in response.data && 'meta' in response.data) {
      return response.data as ListResponse<Specialty>
    }
    // Fallback: if response structure is different (e.g., just an array)
    const unwrapped = unwrapResponse(response)
    if (Array.isArray(unwrapped)) {
      // If it's an array, wrap it in ListResponse format
      return {
        data: unwrapped,
        meta: {
          page,
          limit: limit || unwrapped.length,
          total: unwrapped.length,
          totalPages: 1
        }
      }
    }
    // If it's already a ListResponse structure, return it
    return unwrapped as unknown as ListResponse<Specialty>
  },

  async getSpecialty(id: string): Promise<Specialty> {
    const response = await api.get<Specialty>(`/specialties/${id}`)
    return unwrapResponse(response)
  },

  async createSpecialty(data: CreateSpecialtyDto): Promise<Specialty> {
    const response = await api.post<Specialty>('/specialties', data)
    return unwrapResponse(response)
  },

  async updateSpecialty(id: string, data: UpdateSpecialtyDto): Promise<Specialty> {
    const response = await api.put<Specialty>(`/specialties/${id}`, data)
    return unwrapResponse(response)
  },

  async deleteSpecialty(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/specialties/${id}`)
    return unwrapResponse(response)
  },
}

// Clinic Rooms API
export const clinicRoomsService = {
  async listClinicRooms(page = 1, limit?: number, specialtyId?: string): Promise<ListResponse<ClinicRoom>> {
    const params: Record<string, string> = { page: String(page) }
    if (limit !== undefined) params.limit = String(limit)
    if (specialtyId) params.specialtyId = specialtyId
    const response = await api.get<ListResponse<ClinicRoom>>('/clinic-rooms', { params })
    // For ListResponse, axios wraps it as { data: { data: [...], meta: {...} } }
    // So we need to return response.data directly, not unwrap it
    if (response.data && typeof response.data === 'object' && 'data' in response.data && 'meta' in response.data) {
      return response.data as ListResponse<ClinicRoom>
    }
    // Fallback: if response structure is different (e.g., just an array)
    const unwrapped = unwrapResponse(response)
    if (Array.isArray(unwrapped)) {
      // If it's an array, wrap it in ListResponse format
      return {
        data: unwrapped,
        meta: {
          page,
          limit: limit || unwrapped.length,
          total: unwrapped.length,
          totalPages: 1
        }
      }
    }
    // If it's already a ListResponse structure, return it
    return unwrapped as unknown as ListResponse<ClinicRoom>
  },

  async getClinicRoom(id: string): Promise<ClinicRoom> {
    const response = await api.get<ClinicRoom>(`/clinic-rooms/${id}`)
    return unwrapResponse(response)
  },

  async createClinicRoom(data: CreateClinicRoomDto): Promise<ClinicRoom> {
    const response = await api.post<ClinicRoom>('/clinic-rooms', data)
    return unwrapResponse(response)
  },

  async updateClinicRoom(id: string, data: UpdateClinicRoomDto): Promise<ClinicRoom> {
    const response = await api.put<ClinicRoom>(`/clinic-rooms/${id}`, data)
    return unwrapResponse(response)
  },

  async deleteClinicRoom(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/clinic-rooms/${id}`)
    return unwrapResponse(response)
  },

  async getCommonServices(roomId: string): Promise<CommonServicesResponse> {
    const response = await api.get<CommonServicesResponse>(`/clinic-rooms/${roomId}/common-services`)
    return unwrapResponse(response)
  },

  async updateCommonServices(roomId: string, data: UpdateCommonServicesDto): Promise<{ message: string; updatedBooths: number }> {
    const response = await api.put<{ message: string; updatedBooths: number }>(`/clinic-rooms/${roomId}/common-services`, data)
    return unwrapResponse(response)
  },
}

// Booths API
export const boothsService = {
  async listBooths(page = 1, limit?: number, roomId?: string, isActive?: boolean): Promise<ListResponse<Booth>> {
    const params: Record<string, string> = { page: String(page) }
    if (limit !== undefined) params.limit = String(limit)
    if (roomId) params.roomId = roomId
    if (isActive !== undefined) params.isActive = String(isActive)
    const response = await api.get<ListResponse<Booth>>('/booths', { params })
    // For ListResponse, axios wraps it as { data: { data: [...], meta: {...} } }
    // So we need to return response.data directly, not unwrap it
    if (response.data && typeof response.data === 'object' && 'data' in response.data && 'meta' in response.data) {
      return response.data as ListResponse<Booth>
    }
    // Fallback: if response structure is different (e.g., just an array)
    const unwrapped = unwrapResponse(response)
    if (Array.isArray(unwrapped)) {
      // If it's an array, wrap it in ListResponse format
      return {
        data: unwrapped,
        meta: {
          page,
          limit: limit || unwrapped.length,
          total: unwrapped.length,
          totalPages: 1
        }
      }
    }
    // If it's already a ListResponse structure, return it
    return unwrapped as unknown as ListResponse<Booth>
  },

  async getBooth(id: string): Promise<Booth> {
    const response = await api.get<Booth>(`/booths/${id}`)
    return unwrapResponse(response)
  },

  async createBooth(data: CreateBoothDto): Promise<Booth> {
    const response = await api.post<Booth>('/booths', data)
    return unwrapResponse(response)
  },

  async updateBooth(id: string, data: UpdateBoothDto): Promise<Booth> {
    const response = await api.put<Booth>(`/booths/${id}`, data)
    return unwrapResponse(response)
  },

  async deleteBooth(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/booths/${id}`)
    return unwrapResponse(response)
  },

  async getBoothServices(boothId: string): Promise<BoothServicesResponse> {
    const response = await api.get<BoothServicesResponse>(`/booths/${boothId}/services`)
    return unwrapResponse(response)
  },

  async updateBoothServices(boothId: string, data: UpdateBoothServicesDto): Promise<{ message: string; booth: Booth }> {
    const response = await api.put<{ message: string; booth: Booth }>(`/booths/${boothId}/services`, data)
    return unwrapResponse(response)
  },
}

// Template Types
export type TemplateField = {
  name: string
  label: string
  type: 'string' | 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'select' | 'multiselect'
  required?: boolean
  options?: string[] // For select/multiselect types
  placeholder?: string
  defaultValue?: string | number | boolean
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export type Template = {
  id: string
  templateCode: string
  name: string
  specialtyId?: string
  specialty?: { id: string; name: string; specialtyCode: string }
  fields: {
    fields: TemplateField[]
  }
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export type CreateTemplateDto = {
  templateCode: string
  name: string
  fields: {
    fields: TemplateField[]
  }
  specialtyId: string
  isActive?: boolean
}

export type UpdateTemplateDto = {
  name?: string
  fields?: {
    fields: TemplateField[]
  }
  isActive?: boolean
}

// Templates API
export const templatesService = {
  async listTemplates(): Promise<Template[]> {
    const response = await api.get<Template[] | { data?: Template[] }>('/medical-records/templates')
    const data = unwrapResponse(response)
    if (Array.isArray(data)) {
      return data
    }
    return (data as { data?: Template[] }).data || []
  },

  async getTemplate(id: string): Promise<Template> {
    const response = await api.get<Template>(`/medical-records/templates/${id}`)
    return unwrapResponse(response)
  },

  async createTemplate(data: CreateTemplateDto): Promise<Template> {
    const response = await api.post<Template>('/templates', data)
    return unwrapResponse(response)
  },

  async updateTemplate(id: string, data: UpdateTemplateDto): Promise<Template> {
    const response = await api.put<Template>(`/templates/${id}`, data)
    return unwrapResponse(response)
  },

  async deleteTemplate(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/templates/${id}`)
    return unwrapResponse(response)
  },
}

