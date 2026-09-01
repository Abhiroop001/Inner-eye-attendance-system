const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL
  ? (import.meta as any).env.VITE_API_URL.replace(/\/$/, '')
  : (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')
    ? 'https://inner-eye-attendance-system.onrender.com'
    : '')) + '/api';

let accessToken: string | null = localStorage.getItem('access_token');

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
  requestId?: string;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // sends refresh token cookie
  });

  // Handle Token Expiry & Automatic Refresh
  if (
    response.status === 401 &&
    accessToken &&
    !endpoint.includes('/auth/login') &&
    !endpoint.includes('/auth/refresh')
  ) {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshRes.ok) {
        const refreshData: ApiResponse<{ accessToken: string }> = await refreshRes.json();
        if (refreshData.success && refreshData.data.accessToken) {
          setAccessToken(refreshData.data.accessToken);
          headers.set('Authorization', `Bearer ${refreshData.data.accessToken}`);
          // Retry original request with new access token
          response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
          });
        }
      } else {
        setAccessToken(null);
      }
    } catch (e) {
      setAccessToken(null);
    }
  }

  const json: ApiResponse<T> = await response.json();

  if (!response.ok || !json.success) {
    const errorMsg = json.error?.message || `HTTP Request failed with status ${response.status}`;
    const err = new Error(errorMsg) as any;
    err.code = json.error?.code || 'REQUEST_FAILED';
    err.fields = json.error?.fields;
    err.status = response.status;
    throw err;
  }

  return json.data;
}
