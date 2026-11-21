import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { getSiteSettings } from "@/lib/serverSettings";
import { mediaUrl } from "@/lib/media";
import s from "./maintenance.module.css";

/**
 * Maintenance / "coming soon" page. The proxy shows it on every page of the public address while maintenance is on
 * (admin → settings); title and text come from the site settings.
 */

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: settings?.maintenance_title || "در حال به‌روزرسانی",
    robots: { index: false, follow: false },
  };
}

const STARS: Array<[top: string, left: string, delay: string]> = [
  ["12%", "18%", "0s"],
  ["22%", "82%", "0.6s"],
  ["70%", "10%", "1.2s"],
  ["82%", "76%", "0.3s"],
  ["38%", "6%", "1.8s"],
  ["8%", "52%", "2.2s"],
  ["60%", "92%", "0.9s"],
  ["90%", "40%", "1.5s"],
];

/** Closed gear outline centred on (cx, cy). */
function gearPath(cx: number, cy: number, teeth: number, outer: number, inner: number) {
  const step = (Math.PI * 2) / teeth;
  const pt = (r: number, a: number) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  let d = "";
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    d += `${i === 0 ? "M" : "L"}${pt(inner, a)} L${pt(outer, a + step * 0.15)} L${pt(outer, a + step * 0.45)} L${pt(inner, a + step * 0.6)} `;
  }
  return `${d}Z`;
}

const origin = (x: number, y: number): CSSProperties => ({ transformOrigin: `${x}px ${y}px` });

function Gear({ cx, cy, teeth, outer, inner, fill, className }: { cx: number; cy: number; teeth: number; outer: number; inner: number; fill: string; className: string }) {
  return (
    <g className={className} style={origin(cx, cy)}>
      <path d={gearPath(cx, cy, teeth, outer, inner)} fill={fill} />
      <circle cx={cx} cy={cy} r={inner * 0.55} fill="#1a2f7a" />
      <circle cx={cx} cy={cy} r={inner * 0.22} fill={fill} />
    </g>
  );
}

/** A tower crane carrying a ticket back and forth, next to turning gears. */
function Scene() {
  const jibLattice = Array.from({ length: 15 }, (_, i) => 60 + i * 20);
  const mastLattice = Array.from({ length: 10 }, (_, i) => 80 + i * 20);
  return (
    <svg viewBox="0 0 420 300" className={s.scene} role="img" aria-label="در حال ساخت و به‌روزرسانی">
      <defs>
        <linearGradient id="mt-ticket" x1="0" x2="1">
          <stop offset="0" stopColor="#6324f9" />
          <stop offset="1" stopColor="#fa68b5" />
        </linearGradient>
        <linearGradient id="mt-gear" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fda54f" />
          <stop offset="1" stopColor="#fb8a06" />
        </linearGradient>
        <linearGradient id="mt-gear2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b9a4ff" />
          <stop offset="1" stopColor="#7b35f6" />
        </linearGradient>
      </defs>

      {/* Ground */}
      <rect x="10" y="288" width="400" height="4" rx="2" fill="rgb(255 255 255 / 0.25)" />

      {/* Gears */}
      <Gear cx={100} cy={222} teeth={12} outer={40} inner={32} fill="url(#mt-gear)" className={s.gearCw} />
      <Gear cx={143} cy={265} teeth={8} outer={28} inner={21} fill="url(#mt-gear2)" className={s.gearCcw} />
      <Gear cx={52} cy={168} teeth={8} outer={16} inner={12} fill="rgb(255 255 255 / 0.55)" className={s.gearSmall} />

      {/* Stack of delivered tickets */}
      <g opacity="0.9">
        <rect x="196" y="268" width="56" height="20" rx="4" fill="url(#mt-ticket)" />
        <rect x="204" y="250" width="44" height="18" rx="4" fill="#8e45ff" />
      </g>

      {/* Mast */}
      <g stroke="#ffd18a" strokeWidth="2.5" fill="none">
        <line x1="290" y1="288" x2="290" y2="72" />
        <line x1="310" y1="288" x2="310" y2="72" />
        {mastLattice.map((y) => (
          <line key={y} x1="290" y1={y} x2="310" y2={y + 20} />
        ))}
      </g>
      <rect x="282" y="282" width="36" height="8" rx="2" fill="#ffd18a" />

      {/* Jib + counter-jib */}
      <g stroke="#ffd18a" strokeWidth="2.5" fill="none">
        <line x1="40" y1="60" x2="370" y2="60" />
        <line x1="40" y1="72" x2="370" y2="72" />
        {jibLattice.map((x) => (
          <line key={x} x1={x - 20} y1="72" x2={x} y2="60" />
        ))}
        <line x1="300" y1="30" x2="60" y2="60" />
        <line x1="300" y1="30" x2="365" y2="60" />
        <line x1="300" y1="30" x2="300" y2="60" />
      </g>
      <rect x="340" y="74" width="28" height="22" rx="3" fill="#5a52bf" stroke="#ffd18a" strokeWidth="2" />
      <rect x="306" y="74" width="22" height="18" rx="3" fill="#2f80ff" />
      <rect x="310" y="78" width="14" height="8" rx="1.5" fill="#bfe0ff" />
      <circle cx="300" cy="27" r="4" fill="#ff4d6d" className={s.beacon} />

      {/* Trolley, cable and the ticket it carries */}
      <g className={s.trolley}>
        <rect x="240" y="72" width="20" height="8" rx="2" fill="#fff" />
        <circle cx="244" cy="81" r="2.5" fill="#1a2f7a" />
        <circle cx="256" cy="81" r="2.5" fill="#1a2f7a" />
        <g className={s.swing} style={origin(250, 82)}>
          <line x1="250" y1="82" x2="250" y2="156" stroke="#fff" strokeWidth="1.5" className={s.cable} style={origin(250, 82)} />
          <g className={s.load}>
            <path d="M250 156 v6 a5 5 0 1 1 -5 5" stroke="#fff" strokeWidth="2" fill="none" />
            <line x1="250" y1="168" x2="226" y2="182" stroke="rgb(255 255 255 / 0.7)" strokeWidth="1" />
            <line x1="250" y1="168" x2="274" y2="182" stroke="rgb(255 255 255 / 0.7)" strokeWidth="1" />
            {/* Ticket with side notches */}
            <path
              d="M216 182 h68 a4 4 0 0 1 4 4 v8 a6 6 0 0 0 0 12 v8 a4 4 0 0 1 -4 4 h-68 a4 4 0 0 1 -4 -4 v-8 a6 6 0 0 0 0 -12 v-8 a4 4 0 0 1 4 -4 z"
              fill="url(#mt-ticket)"
            />
            <line x1="264" y1="186" x2="264" y2="214" stroke="rgb(255 255 255 / 0.5)" strokeDasharray="3 3" />
            <rect x="222" y="192" width="34" height="4" rx="2" fill="rgb(255 255 255 / 0.85)" />
            <rect x="222" y="200" width="24" height="4" rx="2" fill="rgb(255 255 255 / 0.55)" />
            <circle cx="275" cy="200" r="4" fill="rgb(255 255 255 / 0.85)" />
          </g>
        </g>
      </g>

      {/* Sparks */}
      <g fill="#ffe7a8">
        <circle cx="128" cy="184" r="2.5" className={s.spark} style={origin(128, 184)} />
        <circle cx="170" cy="236" r="2" className={s.spark} style={{ ...origin(170, 236), animationDelay: "0.7s" }} />
        <circle cx="70" cy="196" r="2" className={s.spark} style={{ ...origin(70, 196), animationDelay: "1.3s" }} />
      </g>
    </svg>
  );
}

export default async function MaintenancePage() {
  const settings = await getSiteSettings();
  const logo = mediaUrl(settings?.logo_dark_url) ?? "/assets/brand/javan/javan_logo_horizontal_onband.svg";
  const title = settings?.maintenance_title || "در حال به‌روزرسانی سایت هستیم";
  const text = settings?.maintenance_text;

  return (
    <main className={`${s.page} bg-band-solid`}>
      <div className={s.grid} aria-hidden />
      <div className={`${s.orb} ${s.orbA}`} aria-hidden />
      <div className={`${s.orb} ${s.orbB}`} aria-hidden />
      <div className={`${s.orb} ${s.orbC}`} aria-hidden />
      {STARS.map(([top, left, delay]) => (
        <span key={`${top}-${left}`} className={s.star} style={{ top, left, animationDelay: delay }} aria-hidden />
      ))}

      <section className={s.card}>
        {/* eslint-disable-next-line @next/next/no-img-element -- logo path comes from the database */}
        <img src={logo} alt={settings?.site_name ?? ""} className="mx-auto mb-4 h-10 w-auto" />

        <Scene />

        <div className="mt-2">
          <span className={s.badge}>
            <span className={s.dot} aria-hidden />
            در حال به‌روزرسانی
          </span>
        </div>

        <h1 className={s.title}>{title}</h1>
        {text && <p className={s.text}>{text}</p>}

        <div className={s.progress} role="progressbar" aria-label="در حال به‌روزرسانی">
          <div className={s.progressBar} />
        </div>
        <p className={s.loadingDots} aria-hidden>
          به‌زودی برمی‌گردیم <span>.</span>
          <span>.</span>
          <span>.</span>
        </p>

        {(settings?.contact_phone || settings?.contact_email) && (
          <p className={s.contact}>
            پشتیبانی:{" "}
            {settings?.contact_phone && (
              <a href={`tel:${settings.contact_phone}`} dir="ltr" className="font-semibold text-white">
                {settings.contact_phone}
              </a>
            )}
            {settings?.contact_phone && settings?.contact_email && " · "}
            {settings?.contact_email && (
              <a href={`mailto:${settings.contact_email}`} dir="ltr" className="font-semibold text-white">
                {settings.contact_email}
              </a>
            )}
          </p>
        )}
      </section>
    </main>
  );
}
