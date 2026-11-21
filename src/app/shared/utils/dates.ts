import { getDayOfWeekIndex } from './days-of-week';

// Utilidades de fechas sin librerías.
//
// El backend usa LocalDate (fecha sin hora ni zona) y la envía como "2026-11-05".
// OJO: new Date("2026-11-05") la interpreta como medianoche UTC, así que en una zona
// horaria negativa (América) se convierte en el día 4. Por eso:
//   - para enviar fechas usamos toIsoDate(), que lee año/mes/día LOCALES;
//   - para leerlas usamos parseIsoDate(), que crea la fecha a medianoche LOCAL;
//   - y para comparar días basta con comparar los strings "yyyy-MM-dd".

// Date → "yyyy-MM-dd" con la fecha local (no toISOString(), que pasa a UTC)
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// "yyyy-MM-dd" → Date a medianoche local
export function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Devuelve una fecha nueva desplazada n días (no modifica la original)
export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
}

// Semana ISO: empieza en lunes y termina en domingo
export function getWeekRange(date: Date = new Date()): { monday: Date; sunday: Date } {
  const monday = addDays(date, -getDayOfWeekIndex(date));
  return { monday, sunday: addDays(monday, 6) };
}
