const API_BASE_URL = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '') + '/api';

let accessToken: string | null = localStorage.getItem('hr_access_token');

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem('hr_access_token', token);
  } else {
    localStorage.removeItem('hr_access_token');
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getDocumentDownloadUrl(documentId: string): string {
  const token = getAccessToken();
  return `/api/hr/documents/${documentId}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;
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
    credentials: 'include',
  });

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
