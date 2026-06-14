import { PatientProfile, PatientProfileSearchResponse } from "../types/user";
import api from "../config";

// Export types for backward compatibility
export interface CreatePatientProfileDto {
  name: string;
  phone?: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  occupation: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  healthInsurance?: string;
  relationship: string;
  patientId?: string | null;
}

class PatientProfileService {
  // Test method to check if the API is working
  async testConnection(): Promise<PatientProfile[]> {
    try {
      const response = await api.get('/patient-profiles/independent');
      console.log('Test connection response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Test connection failed:', error);
      throw error;
    }
  }
  // Search patient profiles by name, phone, or profile code
  async searchPatientProfiles(query: string): Promise<PatientProfileSearchResponse> {
    try {
      const response = await api.get(`/patient-profiles/search?name=${encodeURIComponent(query)}&phone=${encodeURIComponent(query)}&code=${encodeURIComponent(query)}`);
      console.log('API response:', response.data); // Debug log
      
      // Handle different possible response structures
      const data = response.data;
      if (data.patientProfiles) {
        return data;
      } else if (Array.isArray(data)) {
        return {
          query,
          total: data.length,
          patientProfiles: data
        };
      } else if (data.data && Array.isArray(data.data)) {
        return {
          query,
          total: data.data.length,
          patientProfiles: data.data
        };
      } else if (data.profiles && Array.isArray(data.profiles)) {
        return {
          query,
          total: data.profiles.length,
          patientProfiles: data.profiles
        };
      } else {
        // Fallback: return empty result
        return {
          query,
          total: 0,
          patientProfiles: []
        };
      }
    } catch (error) {
      console.error('Search endpoint failed, trying advanced search:', error);
      // Fallback to advanced search if basic search fails
      try {
        return await this.advancedSearch({ name: query });
      } catch (advancedError) {
        console.error('Advanced search also failed:', advancedError);
        return {
          query,
          total: 0,
          patientProfiles: []
        };
      }
    }
  }

  // Advanced search with multiple criteria
  async advancedSearch(params: {
    name?: string;
    phone?: string;
    code?: string;
    gender?: string;
    ageMin?: number;
    ageMax?: number;
    isIndependent?: boolean;
  }): Promise<PatientProfileSearchResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.name) queryParams.append('name', params.name);
    if (params.phone) queryParams.append('phone', params.phone);
    if (params.code) queryParams.append('code', params.code);
    if (params.gender) queryParams.append('gender', params.gender);
    if (params.ageMin) queryParams.append('ageMin', params.ageMin.toString());
    if (params.ageMax) queryParams.append('ageMax', params.ageMax.toString());
    if (params.isIndependent !== undefined) queryParams.append('isIndependent', params.isIndependent.toString());

    const response = await api.get(`/patient-profiles/advanced-search?${queryParams.toString()}`);
    console.log('Advanced search response:', response.data); // Debug log
    
    // Handle different possible response structures
    const data = response.data;
    if (data.patientProfiles) {
      return data;
    } else if (Array.isArray(data)) {
      return {
        query: params.name || params.phone || params.code || '',
        total: data.length,
        patientProfiles: data
      };
    } else if (data.data && Array.isArray(data.data)) {
      return {
        query: params.name || params.phone || params.code || '',
        total: data.data.length,
        patientProfiles: data.data
      };
    } else if (data.profiles && Array.isArray(data.profiles)) {
      return {
        query: params.name || params.phone || params.code || '',
        total: data.profiles.length,
        patientProfiles: data.profiles
      };
    } else {
      // Fallback: return empty result
      return {
        query: params.name || params.phone || params.code || '',
        total: 0,
        patientProfiles: []
      };
    }
  }

  // Get patient profile by code
  async getPatientProfileByCode(code: string): Promise<PatientProfile> {
    const response = await api.get(`/patient-profiles/code/${encodeURIComponent(code)}`);
    return response.data;
  }

  // Get independent patient profiles
  async getIndependentPatientProfiles(): Promise<PatientProfile[]> {
    const response = await api.get('/patient-profiles/independent');
    return response.data;
  }

  // Get patient profile by ID
  async getPatientProfileById(id: string): Promise<PatientProfile> {
    const response = await api.get(`/patient-profiles/${id}`);
    return response.data;
  }

  // Alias for getPatientProfileById (for backward compatibility)
  async getById(id: string): Promise<PatientProfile> {
    return this.getPatientProfileById(id);
  }

  // Get multiple patient profiles by IDs
  async getByIds(ids: string[]): Promise<Record<string, PatientProfile>> {
    if (ids.length === 0) return {};
    
    const profilesMap: Record<string, PatientProfile> = {};
    
    for (const id of ids) {
      try {
        const profile = await this.getPatientProfileById(id);
        profilesMap[id] = profile;
      } catch (error) {
        console.error(`Error loading patient profile ${id}:`, error);
      }
    }
    
    return profilesMap;
  }

  // Alias for getPatientProfileByCode (for backward compatibility)
  async getByProfileId(profileCode: string): Promise<PatientProfile> {
    return this.getPatientProfileByCode(profileCode);
  }

  // Get patient profiles by patient ID
  async getPatientProfilesByPatientId(patientId: string): Promise<PatientProfile[]> {
    const response = await api.get(`/patient-profiles/patient/${encodeURIComponent(patientId)}`);
    return response.data;
  }

  // Create independent patient profile
  async createIndependentPatientProfile(data: CreatePatientProfileDto): Promise<PatientProfile> {
    const response = await api.post('/patient-profiles/independent', data);
    return response.data;
  }

  // Update patient profile
  async updatePatientProfile(id: string, data: {
    name?: string;
    phone?: string;
    address?: string;
    occupation?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    healthInsurance?: string;
  }): Promise<PatientProfile> {
    const response = await api.patch(`/patient-profiles/${id}`, data);
    return response.data;
  }

  // Alias for updatePatientProfile (for backward compatibility)
  async update(id: string, data: {
    name?: string;
    phone?: string;
    address?: string;
    occupation?: string;
    relationship?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    healthInsurance?: string;
  }): Promise<PatientProfile> {
    return this.updatePatientProfile(id, data);
  }

  // Create patient profile (can be linked to patient or independent)
  async create(data: CreatePatientProfileDto): Promise<PatientProfile> {
    if (data.patientId) {
      // Create linked profile
      const response = await api.post('/patient-profiles', data);
      return response.data;
    } else {
      // Create independent profile
      return this.createIndependentPatientProfile(data);
    }
  }

  // Link patient profile to patient
  async linkPatientProfile(profileId: string, patientId: string): Promise<PatientProfile> {
    const response = await api.patch(`/patient-profiles/${profileId}/link`, { patientId });
    return response.data;
  }

  // Unlink patient profile from patient
  async unlinkPatientProfile(profileId: string): Promise<PatientProfile> {
    const response = await api.patch(`/patient-profiles/${profileId}/unlink`);
    return response.data;
  }

  // Delete patient profile
  async deletePatientProfile(profileId: string): Promise<void> {
    await api.delete(`/patient-profiles/${profileId}`);
  }
}

export const patientProfileService = new PatientProfileService();