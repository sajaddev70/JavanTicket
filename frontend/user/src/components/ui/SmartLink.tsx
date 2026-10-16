import Link from "next/link";
import type { NavLink } from "@/types/content";

/** Renders a link managed in the admin panel: internal paths use client routing, others a plain anchor. */
export function SmartLink({
  link,
  children,
  ...props
}: Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { link: NavLink; children?: React.ReactNode }) {
  const content = children ?? link.title;
  const newTab = link.open_in_new_tab ? { target: "_blank", rel: "noreferrer" } : {};
  if (link.url.startsWith("/")) {
    return (
      <Link href={link.url} {...newTab} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <a href={link.url} {...newTab} {...props}>
      {content}
    </a>
  );
}
