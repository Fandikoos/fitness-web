import { formatNumber } from '@angular/common';
import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

// Muestra un volumen de entrenamiento (kg totales) de forma legible:
//   850   → "850 kg"
//   9600  → "9,6 t"   (separador decimal según LOCALE_ID: es-ES usa coma)
@Pipe({ name: 'volume' })
export class VolumePipe implements PipeTransform {
  private locale = inject(LOCALE_ID);

  transform(kg: number | null | undefined): string {
    const value = kg ?? 0;
    if (value >= 1000) {
      return `${formatNumber(value / 1000, this.locale, '1.0-1')} t`;
    }
    return `${formatNumber(value, this.locale, '1.0-0')} kg`;
  }
}
