import type { LucideIcon } from "lucide-react";
import {
  Armchair, BadgeCheck, Building2, CalendarDays, CalendarSync, ChartColumn, Circle, Clock, CreditCard, FileClock, FileText,
  House, Images, Landmark, LayoutList, Link2, Mail, MapPin, MessageSquareText, ScanLine, Settings, Shield, ShoppingCart, Tag,
  Tags, UserRound, Users, Wallet,
} from "lucide-react";

/** Admin menu items name their icon in the database; this maps those names to components. */
const ICONS: Record<string, LucideIcon> = {
  Armchair, BadgeCheck, Building2, CalendarDays, CalendarSync, ChartColumn, Clock, CreditCard, FileClock, FileText, House,
  Images, Landmark, LayoutList, Link2, Mail, MapPin, MessageSquareText, ScanLine, Settings, Shield, ShoppingCart, Tag, Tags,
  UserRound, Users, Wallet,
};

export function menuIcon(name?: string | null): LucideIcon {
  return (name && ICONS[name]) || Circle;
}

/** Menu items store either an icon name (above) or the path of an SVG from the icon set. */
export function isSvgIcon(icon?: string | null): icon is string {
  return !!icon && icon.startsWith("/");
}
