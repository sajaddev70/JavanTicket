import Image from "next/image";
import { asset } from "@/lib/assets";

/** Soft decorative layer shared by the login and OTP pages. */
export function AuthBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-40 -top-40 size-[520px] rounded-full bg-brand-500/12 blur-3xl" />
      <div className="absolute -bottom-48 right-1/3 size-[480px] rounded-full bg-brand-500/10 blur-3xl" />
      <Image
        src={asset("/assets/auth/wave.png")}
        alt=""
        width={838}
        height={248}
        className="absolute bottom-0 left-0 w-[62vw] max-w-[900px] opacity-80 dark:opacity-25"
      />
      <Image
        src={asset("/assets/auth/dots.png")}
        alt=""
        width={244}
        height={108}
        className="absolute bottom-8 left-6 hidden w-36 opacity-70 lg:block dark:opacity-30"
      />
    </div>
  );
}
