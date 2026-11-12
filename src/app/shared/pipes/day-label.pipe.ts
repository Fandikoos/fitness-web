import { Pipe, PipeTransform } from '@angular/core';
import { DAYS_OF_WEEK } from '../utils/days-of-week';

// Convierte el enum del backend (p. ej. "THURSDAY") en la etiqueta de la UI (p. ej. "Jueves")
@Pipe({ name: 'dayLabel' })
export class DayLabelPipe implements PipeTransform {
  transform(value: string): string {
    return DAYS_OF_WEEK.find(day => day.value === value?.toUpperCase())?.label ?? value;
  }
}
