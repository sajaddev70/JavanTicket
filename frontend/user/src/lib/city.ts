/** Cookie with the city picked in the header, readable by server rendering so city-filtered lists match. */
export const CITY_COOKIE = "city";

export function parseCityId(value: string | undefined | null): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function writeCityCookie(cityId: number | null) {
  document.cookie =
    cityId === null ? `${CITY_COOKIE}=; path=/; max-age=0; samesite=lax` : `${CITY_COOKIE}=${cityId}; path=/; max-age=31536000; samesite=lax`;
}
