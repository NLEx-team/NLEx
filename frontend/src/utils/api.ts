import { config } from './config';

const API_BASE = config.apiUrl;

class ApiError extends Error {
  status?: number;
  data?: any;
  
  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit & { timeout?: number } = {}): Promise<T> {
  const { timeout = 90000, ...fetchOptions } = options; // 90 seconds default timeout
  const token = localStorage.getItem('jwt_token');
  
  const headers = new Headers(fetchOptions.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!(fetchOptions.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(
        data?.detail || response.statusText || 'Request failed',
        response.status,
        data
      );
    }

    return data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiError('Нет доступа к ИИ (превышено время ожидания)', 408);
    }
    // Also handle backend connection refused or generic fetch failures
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Сервер недоступен. Проверьте подключение.', 503);
    }
    throw error;
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => 
    request<T>(endpoint, { ...options, method: 'GET' }),
  
  post: <T>(endpoint: string, body?: any, options?: RequestInit) => 
    request<T>(endpoint, { 
      ...options, 
      method: 'POST', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),
  
  put: <T>(endpoint: string, body?: any, options?: RequestInit) => 
    request<T>(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),

  patch: <T>(endpoint: string, body?: any, options?: RequestInit) => 
    request<T>(endpoint, { 
      ...options, 
      method: 'PATCH', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),
  
  delete: <T>(endpoint: string, options?: RequestInit) => 
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
