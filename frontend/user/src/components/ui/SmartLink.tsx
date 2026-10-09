import Link from "next/link";
import type { NavLink } from "@/services/public";

/** Renders a link managed in the admin panel: internal paths use client routing, others a plain anchor. */
export function SmartLink({ link, className, onClick, children }: { link: NavLink; className?: string; onClick?: () => void; children?: React.ReactNode }) {
  const content = children ?? link.title;
  const newTab = link.open_in_new_tab ? { target: "_blank", rel: "noreferrer" } : {};
  if (link.url.startsWith("/")) {
    return (
      <Link href={link.url} className={className} onClick={onClick} {...newTab}>
        {content}
      </Link>
    );
  }
  return (
    <a href={link.url} className={className} onClick={onClick} {...newTab}>
      {content}
    </a>
  );
}
