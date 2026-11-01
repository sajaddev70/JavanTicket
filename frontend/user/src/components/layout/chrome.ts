/**
 * Which app chrome each screen shows on phones, following the app design:
 * - every screen has its own header (brand, back, large title); only the home screen uses the site header;
 * - login and the purchase steps (seats, buyer, checkout, payment, result) hide the bottom navigation.
 */
const NO_BOTTOM_NAV = [/^\/sessions\//, /^\/checkout/, /^\/payment/, /^\/login/, /^\/verify/];

export const hasOwnTopBar = (pathname: string) => pathname !== "/";
export const showsBottomNav = (pathname: string) => !NO_BOTTOM_NAV.some((r) => r.test(pathname));
