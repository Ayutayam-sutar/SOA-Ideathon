const API_BASE_URL = 'http://localhost:3001/api';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('karwaan_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  const config: RequestInit = {
    ...options,
    headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    let errorMsg = 'An error occurred';
    const textData = await response.text();
    try {
      const errorData = JSON.parse(textData);
      errorMsg = errorData.error || errorMsg;
    } catch (e) {
      // Not JSON
      errorMsg = textData || errorMsg;
    }
    throw new Error(errorMsg);
  }

  // Handle empty 204 No Content responses successfully
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export const apiClient = {
  get: (endpoint: string) => fetchWithAuth(endpoint, { method: 'GET' }),
  post: (endpoint: string, body?: any) => fetchWithAuth(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: (endpoint: string, body?: any) => fetchWithAuth(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  put: (endpoint: string, body?: any) => fetchWithAuth(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: (endpoint: string) => fetchWithAuth(endpoint, { method: 'DELETE' }),
};
