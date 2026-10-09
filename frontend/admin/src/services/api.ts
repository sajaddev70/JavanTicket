import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAdminAuthStore } from '@/stores/useAdminAuthStore';

type TimedConfig = InternalAxiosRequestConfig & { meta?: { startTime: number } };

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  (config as TimedConfig).meta = { startTime: Date.now() };

  console.log(
    `========== API REQUEST ==========\n` +
    `METHOD: ${config.method?.toUpperCase()}\n` +
    `URL: ${config.baseURL || ''}${config.url || ''}\n` +
    `=================================`
  );

  return config;
});

api.interceptors.response.use(
  (response) => {
    const startTime = (response.config as TimedConfig).meta?.startTime || Date.now();
    const duration = Date.now() - startTime;

    console.log(
      `========== API RESPONSE ==========\n` +
      `METHOD: ${response.config.method?.toUpperCase()}\n` +
      `URL: ${response.config.baseURL || ''}${response.config.url || ''}\n` +
      `STATUS: ${response.status}\n` +
      `DURATION: ${duration}ms\n` +
      `=================================`
    );

    return response.data;
  },
  (error) => {
    const config = error.config || {};
    const startTime = config.meta?.startTime || Date.now();
    const duration = Date.now() - startTime;
    const status = error.response?.status;
    const url = `${config.baseURL || ''}${config.url || ''}`;

    console.error(
      `========== API ERROR ==========\n` +
      `METHOD: ${config.method?.toUpperCase()}\n` +
      `URL: ${url}\n` +
      `STATUS: ${status || 'NETWORK_ERROR'}\n` +
      `DURATION: ${duration}ms\n` +
      `ERROR: ${error.message}\n` +
      `RESPONSE: ${JSON.stringify(error.response?.data || {})}\n` +
      `=================================`
    );

    // An expired or revoked admin session: drop it; AdminLayout then sends the user to the login page.
    if (status === 401 && useAdminAuthStore.getState().token) {
      useAdminAuthStore.getState().logout();
    }

    let message = 'ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت و وضعیت سرویس را بررسی کنید.';

    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (status === 401) {
      message = 'نشست شما منقضی شده است. لطفاً مجدداً وارد شوید.';
    } else if (status === 403) {
      message = 'شما دسترسی لازم برای انجام این عملیات را ندارید.';
    } else if (status === 404) {
      message = 'اطلاعات موردنظر پیدا نشد.';
    } else if (status === 500) {
      message = 'خطایی در سامانه رخ داده است. لطفاً مجدداً تلاش کنید.';
    }

    const customError = {
      success: false,
      message,
      status,
      originalError: error.response?.data,
    };

    return Promise.reject(customError);
  }
);

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  status?: number;
}

/** GET helper that unwraps the backend's { success, data } envelope. */
export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const envelope = (await api.get(url, { params })) as unknown as ApiEnvelope<T>;
  return envelope.data;
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const envelope = (await api.post(url, body)) as unknown as ApiEnvelope<T>;
  return envelope.data;
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const envelope = (await api.put(url, body)) as unknown as ApiEnvelope<T>;
  return envelope.data;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const envelope = (await api.delete(url)) as unknown as ApiEnvelope<T>;
  return envelope.data;
}
