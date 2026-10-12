import type { StatusMap } from "@/components/ui/StatusPill";

/** Display labels of the status codes returned by the API. */
export const EVENT_DISPLAY_STATUS: StatusMap = {
  ON_SALE: { label: "در حال فروش", tone: "success" },
  SCHEDULED: { label: "برنامه‌ریزی شده", tone: "brand" },
  RUNNING: { label: "در حال برگزاری", tone: "warning" },
  FINISHED: { label: "اتمام یافته", tone: "muted" },
  CANCELLED: { label: "لغو شده", tone: "danger" },
};

export const EVENT_STATUS_OPTIONS = [
  { value: "PUBLISHED", label: "منتشر شده (فروش فعال)" },
  { value: "DRAFT", label: "پیش‌نویس / برنامه‌ریزی شده" },
  { value: "CANCELLED", label: "لغو شده" },
  { value: "ARCHIVED", label: "بایگانی" },
];

export const SESSION_DISPLAY_STATUS: StatusMap = {
  ON_SALE: { label: "در حال فروش", tone: "brand" },
  LIMITED: { label: "تعداد محدود", tone: "warning" },
  ALMOST_FULL: { label: "در آستانه تکمیل", tone: "danger" },
  SOLD_OUT: { label: "تکمیل ظرفیت", tone: "danger" },
  RUNNING: { label: "در حال اجرا", tone: "success" },
  SCHEDULED: { label: "برنامه‌ریزی شده", tone: "muted" },
  FINISHED: { label: "پایان یافته", tone: "muted" },
  CANCELLED: { label: "لغو شده", tone: "danger" },
};

export const SESSION_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "فعال (در حال فروش)" },
  { value: "SCHEDULED", label: "برنامه‌ریزی شده" },
  { value: "COMPLETED", label: "برگزار شده" },
  { value: "CANCELLED", label: "لغو شده" },
];

export const CITY_STATUS: StatusMap = {
  ACTIVE: { label: "فعال", tone: "success" },
  PLANNED: { label: "در برنامه", tone: "warning" },
  INACTIVE: { label: "غیرفعال", tone: "muted" },
};

export const HALL_STATUS: StatusMap = {
  ACTIVE: { label: "فعال", tone: "success" },
  EQUIPPING: { label: "در حال تجهیز", tone: "warning" },
  UNDER_CONSTRUCTION: { label: "در دست ساخت", tone: "muted" },
  INACTIVE: { label: "غیرفعال", tone: "danger" },
};

export const HALL_TYPES: StatusMap = {
  CONFERENCE: { label: "همایش", tone: "brand" },
  EXHIBITION: { label: "نمایشگاه", tone: "success" },
  CONCERT: { label: "کنسرت", tone: "danger" },
  EDUCATION: { label: "آموزشی", tone: "purple" },
  THEATER: { label: "تئاتر", tone: "warning" },
};

export const options = (map: StatusMap) => Object.entries(map).map(([value, s]) => ({ value, label: s.label }));

export const ORDER_STATUS: StatusMap = {
  PAID: { label: "پرداخت‌شده", tone: "success" },
  PENDING: { label: "در انتظار پرداخت", tone: "warning" },
  CANCELLED: { label: "لغو شده", tone: "muted" },
  REFUNDED: { label: "مسترد شده", tone: "danger" },
};

export const TICKET_STATUS: StatusMap = {
  VALID: { label: "معتبر", tone: "success" },
  USED: { label: "استفاده شده", tone: "brand" },
  CANCELLED: { label: "باطل", tone: "danger" },
};

export const ORG_TYPES: StatusMap = {
  SCHOOL: { label: "مدرسه", tone: "brand" },
  UNIVERSITY: { label: "دانشگاه", tone: "purple" },
  ORGANIZATION: { label: "سازمان / نهاد", tone: "success" },
  COMPANY: { label: "شرکت", tone: "warning" },
};

export const ACTIVE_STATUS: StatusMap = {
  ACTIVE: { label: "فعال", tone: "success" },
  INACTIVE: { label: "غیرفعال", tone: "muted" },
};

export const RESERVATION_STATUS: StatusMap = {
  PENDING: { label: "در انتظار تأیید", tone: "warning" },
  CONFIRMED: { label: "تأیید شده", tone: "success" },
  COMPLETED: { label: "برگزار شده", tone: "brand" },
  CANCELLED: { label: "لغو شده", tone: "danger" },
};

export const INVOICE_STATUS: StatusMap = {
  DRAFT: { label: "پیش‌نویس", tone: "muted" },
  ISSUED: { label: "صادر شده", tone: "brand" },
  PAID: { label: "پرداخت شده", tone: "success" },
  CANCELLED: { label: "لغو شده", tone: "danger" },
};

export const SETTLEMENT_STATUS: StatusMap = {
  PENDING: { label: "در انتظار بررسی", tone: "warning" },
  APPROVED: { label: "تأیید شده", tone: "brand" },
  PAID: { label: "پرداخت شده", tone: "success" },
  REJECTED: { label: "رد شده", tone: "danger" },
};

export const GATE_RESULT: StatusMap = {
  ACCEPTED: { label: "ورود مجاز", tone: "success" },
  ALREADY_USED: { label: "استفاده‌شده", tone: "warning" },
  CANCELLED: { label: "باطل شده", tone: "danger" },
  WRONG_SESSION: { label: "سانس دیگر", tone: "purple" },
  INVALID: { label: "نامعتبر", tone: "danger" },
};

export const CRM_SEGMENT: StatusMap = {
  VIP: { label: "ویژه (VIP)", tone: "purple" },
  LOYAL: { label: "وفادار", tone: "success" },
  REGULAR: { label: "عادی", tone: "brand" },
  NEW: { label: "جدید", tone: "warning" },
  AT_RISK: { label: "در خطر ریزش", tone: "danger" },
  PROSPECT: { label: "بدون خرید", tone: "muted" },
};

export const CRM_CHANNEL: StatusMap = {
  CALL: { label: "تماس تلفنی", tone: "brand" },
  SMS: { label: "پیامک", tone: "success" },
  EMAIL: { label: "ایمیل", tone: "purple" },
  MEETING: { label: "جلسه حضوری", tone: "warning" },
  SUPPORT: { label: "پشتیبانی", tone: "danger" },
};

export const CRM_STATUS: StatusMap = {
  OPEN: { label: "باز", tone: "brand" },
  FOLLOW_UP: { label: "نیازمند پیگیری", tone: "warning" },
  CLOSED: { label: "بسته شده", tone: "muted" },
};

export const USER_STATUS: StatusMap = {
  ACTIVE: { label: "فعال", tone: "success" },
  DISABLED: { label: "غیرفعال", tone: "danger" },
};

export const USER_TYPE: StatusMap = {
  ADMIN: { label: "مدیر پنل", tone: "purple" },
  USER: { label: "کاربر سایت", tone: "brand" },
};

export const LOG_ACTION: StatusMap = {
  LOGIN: { label: "ورود", tone: "brand" },
  CREATE: { label: "ایجاد", tone: "success" },
  UPDATE: { label: "ویرایش", tone: "warning" },
  DELETE: { label: "حذف", tone: "danger" },
  ACTION: { label: "عملیات", tone: "purple" },
};

export const TRANSACTION_TYPE: StatusMap = {
  SALE: { label: "فروش بلیت", tone: "success" },
  INVOICE: { label: "پیش‌فاکتور سازمانی", tone: "brand" },
  REFUND: { label: "استرداد", tone: "danger" },
  SETTLEMENT: { label: "تسویه با برگزارکننده", tone: "warning" },
};
