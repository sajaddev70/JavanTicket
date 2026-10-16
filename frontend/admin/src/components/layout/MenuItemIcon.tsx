import { createElement } from "react";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { isSvgIcon, menuIcon } from "@/lib/icons";
import { cn } from "@/lib/cn";

/** Icon of an admin menu item: an SVG from the icon set (by path) or a named built-in icon. */
export function MenuItemIcon({ icon, className }: { icon?: string | null; className?: string }) {
  if (isSvgIcon(icon)) return <SvgIcon src={icon} className={cn("size-[19px]", className)} />;
  // The icon components are module-level constants looked up by name, not created here.
  return createElement(menuIcon(icon), { className: cn("size-[19px] shrink-0", className), strokeWidth: 1.8 });
}
