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
