import { User, UserSearchResponse } from "../types/user";
import api from "../config";

class UserService {
  // Search users by query (phone, email, or name)
  async searchUsers(query: string): Promise<UserSearchResponse> {
    const response = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
    return response.data;
  }

  // Get user by ID
  async getUserById(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  }

  // Search doctors by query
  async searchDoctors(query: string): Promise<UserSearchResponse> {
    const response = await this.searchUsers(query);
    // Filter only doctors
    const doctors = response.users.filter(user => user.role === 'DOCTOR');
    return {
      query: response.query,
      total: doctors.length,
      users: doctors
    };
  }

  // Get doctor by ID using search
  async getDoctorById(id: string): Promise<User | null> {
    try {
      // Use search endpoint with the ID as query
      const response = await this.searchUsers(id);
      const doctor = response.users.find(user => user.id === id && user.role === 'DOCTOR');
      return doctor || null;
    } catch (error) {
      console.error('Error getting doctor by ID:', error);
      return null;
    }
  }

  // Get multiple doctors by IDs
  async getDoctorsByIds(ids: string[]): Promise<Record<string, User>> {
    if (ids.length === 0) return {};
    
    const doctorsMap: Record<string, User> = {};
    
    for (const id of ids) {
      try {
        const doctor = await this.getDoctorById(id);
        if (doctor) {
          doctorsMap[id] = doctor;
        }
      } catch (error) {
        console.error(`Error loading doctor ${id}:`, error);
      }
    }
    
    return doctorsMap;
  }

  // Upload avatar for current user
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const userService = new UserService();
