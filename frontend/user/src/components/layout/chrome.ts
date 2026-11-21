/**
 * Which app chrome each screen shows on phones, following the redesign references:
 * - screens with their own top bar (back button + logo) hide the site header below `lg`;
 * - the search field sits under the header on browse screens only;
 * - flows with their own sticky action bar (seat map, checkout, payment, OTP, ticket) hide the bottom navigation.
 */
const OWN_TOP_BAR = [/^\/events\/[^/]+$/, /^\/sessions\//, /^\/login/, /^\/verify/, /^\/tickets\/[^/]+$/, /^\/payment\/result/];
const WITH_SEARCH = [/^\/events$/];
const NO_BOTTOM_NAV = [/^\/sessions\//, /^\/checkout/, /^\/payment$/, /^\/login/, /^\/verify/, /^\/tickets\/[^/]+$/];

export const hasOwnTopBar = (pathname: string) => OWN_TOP_BAR.some((r) => r.test(pathname));
export const showsHeaderSearch = (pathname: string) => WITH_SEARCH.some((r) => r.test(pathname));
export const showsBottomNav = (pathname: string) => !NO_BOTTOM_NAV.some((r) => r.test(pathname));

/**
 * Height of the navy band behind the top of each screen (references 01–13). Screens that paint their own full-screen
 * background (login, OTP, payment result) return 0.
 */
const BANDS: [RegExp, string][] = [
  [/^\/(login|verify)/, "0"],
  [/^\/payment\/result/, "0"],
  [/^\/$/, "h-[400px] lg:h-[480px]"],
  [/^\/events$/, "h-[420px] lg:h-[440px]"],
  [/^\/events\/[^/]+$/, "h-[840px] lg:h-[680px]"],
  [/^\/sessions\//, "h-[360px] lg:h-[400px]"],
  [/^\/profile$/, "h-[440px] lg:h-[400px]"],
];

export function bandClass(pathname: string): string | null {
  const hit = BANDS.find(([r]) => r.test(pathname));
  if (hit) return hit[1] === "0" ? null : hit[1];
  return "h-[360px] lg:h-[380px]";
}
