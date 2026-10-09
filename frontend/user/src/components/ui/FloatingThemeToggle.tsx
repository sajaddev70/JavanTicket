import { ThemeToggle } from "./ThemeToggle";

/** Theme switch for standalone pages that have no header (login, OTP, 404). */
export function FloatingThemeToggle() {
  return (
    <div className="fixed left-4 top-4 z-40">
      <ThemeToggle className="border border-line bg-surface/90 shadow-card backdrop-blur" />
    </div>
  );
}
