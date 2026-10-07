import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

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

  (config as any).meta = { startTime: Date.now() };

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
    const startTime = (response.config as any).meta?.startTime || Date.now();
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
