/**
 * Which app chrome each screen shows on phones, following the redesign references:
 * - screens with their own top bar (back button + logo) hide the site header below `lg`;
 * - the search field sits under the header on browse screens only;
 * - flows with their own sticky action bar (seat map, checkout, payment, OTP, ticket) hide the bottom navigation.
 */
const OWN_TOP_BAR = [/^\/events\/[^/]+$/, /^\/sessions\//, /^\/login/, /^\/verify/, /^\/tickets\/[^/]+$/];
const WITH_SEARCH = [/^\/$/, /^\/events$/, /^\/payment\/result/];
const NO_BOTTOM_NAV = [/^\/sessions\//, /^\/checkout/, /^\/payment$/, /^\/login/, /^\/verify/, /^\/tickets\/[^/]+$/];

export const hasOwnTopBar = (pathname: string) => OWN_TOP_BAR.some((r) => r.test(pathname));
export const showsHeaderSearch = (pathname: string) => WITH_SEARCH.some((r) => r.test(pathname));
export const showsBottomNav = (pathname: string) => !NO_BOTTOM_NAV.some((r) => r.test(pathname));
