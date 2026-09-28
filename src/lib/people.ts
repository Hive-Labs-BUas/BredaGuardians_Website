/** Turns a two-letter country code into its flag emoji. */
export function countryFlag(code: string | null | undefined): string | null {
  if (!code) return null;
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(clean)) return null;
  return String.fromCodePoint(...[...clean].map((c) => 127397 + c.charCodeAt(0)));
}

/** Every nationality of a player: the main one first, then any extra ones. */
export function nationalityCodes(player: {
  country_code?: string | null;
  country_codes?: string[] | null;
}): string[] {
  const list = [player.country_code ?? "", ...(player.country_codes ?? [])]
    .map((code) => String(code ?? "").trim().toUpperCase())
    .filter((code) => /^[A-Z]{2}$/.test(code));
  return [...new Set(list)];
}

/** Full years since a birth date, or null when it is missing or invalid. */
export function ageFrom(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const beforeBirthday =
    now.getMonth() < born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 120 ? age : null;
}
