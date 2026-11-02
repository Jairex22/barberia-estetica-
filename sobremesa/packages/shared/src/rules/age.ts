/** Edad cumplida en `now` para una fecha de nacimiento ISO (YYYY-MM-DD). */
export function ageFromBirthdate(birthdate: string, now: Date = new Date()): number {
  const [y, m, d] = birthdate.split('-').map(Number) as [number, number, number];
  let age = now.getUTCFullYear() - y;
  const hadBirthday =
    now.getUTCMonth() + 1 > m || (now.getUTCMonth() + 1 === m && now.getUTCDate() >= d);
  if (!hadBirthday) age -= 1;
  return age;
}
export function isAdult(birthdate: string, minAge = 18, now: Date = new Date()): boolean {
  return ageFromBirthdate(birthdate, now) >= minAge;
}
