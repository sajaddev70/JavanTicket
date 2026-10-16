import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { authStorage } from "@/stores/authStorage";
import type { AuthResponse } from "@/types/user";

/** Backend base URL as the browser sees it (inlined at build time). */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1";

const DEV = process.env.NODE_ENV !== "production";

/** Error every service call rejects with: always a Persian, user-presentable message. */
export class ApiError extends Error {
  readonly status?: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(message: string, status?: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Record<string, string>;
}

type TimedConfig = InternalAxiosRequestConfig & { meta?: { startTime: number } };

/** Server-side rendering talks to the backend directly (Docker network), the browser through the public URL. */
const BASE_URL = typeof window === "undefined" ? process.env.API_INTERNAL_URL || API_BASE_URL : API_BASE_URL;

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: typeof window === "undefined" ? 6_000 : 15_000,
  headers: { "Content-Type": "application/json" },
  // Auth uses the Authorization header (the backend issues bearer tokens, not cookies).
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = authStorage.token();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  (config as TimedConfig).meta = { startTime: Date.now() };
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (DEV) {
      const started = (response.config as TimedConfig).meta?.startTime ?? Date.now();
      console.debug(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} ${response.status} ${Date.now() - started}ms`);
    }
    return response;
  },
  (error: AxiosError<Partial<Envelope<unknown>>>) => {
    const status = error.response?.status;
    if (DEV) {
      const log = !status || status >= 500 ? console.error : console.warn;
      log(`[API] ${error.config?.method?.toUpperCase()} ${error.config?.url} ${status ?? "NETWORK"}`, error.response?.data ?? error.message);
    }
    // Expired access token: renew it once with the refresh token and replay the request.
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    if (status === 401 && original && !original._retried && original.headers?.Authorization && !original.url?.startsWith("/auth/")) {
      original._retried = true;
      return refreshSession().then((token) => {
        if (!token) return Promise.reject(toApiError(error));
        original.headers.Authorization = `Bearer ${token}`;
        return api.request(original);
      });
    }
    // Revoked session or no refresh possible: sign out locally; guarded pages then send the user to /login.
    if (status === 401 && authStorage.token()) authStorage.signOut();
    return Promise.reject(toApiError(error));
  },
);

let refreshing: Promise<string | null> | null = null;

/** One refresh at a time, shared by every request that failed with 401 meanwhile. Resolves to the new access token. */
function refreshSession(): Promise<string | null> {
  const refreshToken = authStorage.refreshToken();
  if (!refreshToken) return Promise.resolve(null);
  refreshing ??= axios
    .post<Envelope<AuthResponse>>(`${BASE_URL}/auth/user/refresh`, { refreshToken }, { timeout: 15_000 })
    .then(({ data }) => {
      authStorage.signIn(data.data.accessToken, data.data.user, data.data.refreshToken);
      return data.data.accessToken;
    })
    .catch(() => {
      authStorage.signOut();
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/** Maps any failure to an ApiError with a Persian message (never raw Axios / server exception text). */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const body = error.response?.data as Partial<Envelope<unknown>> | undefined;
    const serverMessage = typeof body?.message === "string" && body.message.trim() ? body.message : undefined;
    // 5xx bodies from the backend carry a generic Persian message already; proxies may answer with HTML instead.
    if (serverMessage && /[؀-ۿ]/.test(serverMessage)) return new ApiError(serverMessage, status, body?.errors);
    if (!error.response) {
      return new ApiError(
        error.code === "ECONNABORTED" ? "پاسخی از سرور دریافت نشد. لطفاً دوباره تلاش کنید." : "ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.",
      );
    }
    return new ApiError(STATUS_MESSAGES[status ?? 0] ?? "دریافت اطلاعات با خطا مواجه شد.", status);
  }
  return new ApiError("خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید.");
}

const STATUS_MESSAGES: Record<number, string> = {
  400: "اطلاعات ارسالی معتبر نیست.",
  401: "نشست شما منقضی شده است. لطفاً دوباره وارد شوید.",
  403: "شما دسترسی لازم برای این عملیات را ندارید.",
  404: "اطلاعات موردنظر پیدا نشد.",
  409: "این عملیات با وضعیت فعلی سازگار نیست. لطفاً صفحه را به‌روز کنید.",
  429: "تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.",
  500: "خطایی در سامانه رخ داده است. لطفاً دوباره تلاش کنید.",
  502: "سرویس در دسترس نیست. لطفاً کمی بعد دوباره تلاش کنید.",
  503: "سرویس در دسترس نیست. لطفاً کمی بعد دوباره تلاش کنید.",
};

/** Message of an error for the UI. */
export function errorMessage(error: unknown, fallback = "دریافت اطلاعات با خطا مواجه شد."): string {
  return error instanceof ApiError ? error.message : error ? toApiError(error).message : fallback;
}

export function isStatus(error: unknown, status: number): boolean {
  return error instanceof ApiError && error.status === status;
}

/** Calls the API and unwraps the backend's { success, message, data } envelope. */
async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await api.request<Envelope<T>>(config);
  return response.data.data;
}

/** Like [request] but also returns the backend's success message (shown in toasts). */
export async function requestWithMessage<T>(config: AxiosRequestConfig): Promise<{ data: T; message?: string }> {
  const response = await api.request<Envelope<T>>(config);
  return { data: response.data.data, message: response.data.message };
}

/** Drops empty filter values so URLs stay clean (`?q=&page=` → nothing). */
export function cleanParams(params: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""));
}

export const http = {
  get: <T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "GET", url, params: params && cleanParams(params) }),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => request<T>({ ...config, method: "POST", url, data }),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => request<T>({ ...config, method: "PUT", url, data }),
  delete: <T>(url: string, config?: AxiosRequestConfig) => request<T>({ ...config, method: "DELETE", url }),
};
