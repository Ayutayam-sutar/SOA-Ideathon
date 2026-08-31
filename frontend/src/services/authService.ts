import { User } from '../types';

const API_URL = 'http://localhost:3001/api/auth';

export const authService = {
  async register(data: any): Promise<void> {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const resData = await response.json();
    if (!resData.success) {
      throw new Error(resData.error || 'Registration failed');
    }
  },

  async login(email: string, password: string, role?: string): Promise<{ token: string, user: User }> {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Login failed');
    }

    localStorage.setItem('karwaan_token', data.token);
    return data;
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem('karwaan_token');
    localStorage.removeItem('karwaan_token');
    
    if (token) {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).catch(e => console.error('Logout request failed', e));
    }
  },

  async me(): Promise<User | null> {
    const token = localStorage.getItem('karwaan_token');
    if (!token) return null;

    try {
      const response = await fetch(`${API_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!data.success) {
        localStorage.removeItem('karwaan_token');
        return null;
      }

      return data.user;
    } catch (error) {
      console.error('Failed to fetch user', error);
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem('karwaan_token');
  }
};
