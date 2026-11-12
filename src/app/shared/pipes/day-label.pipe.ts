import { Pipe, PipeTransform } from '@angular/core';
import { MUSCLE_GROUPS } from '../utils/muscle-groups';
import { DAYS_OF_WEEK } from '../utils/days-of-week';


@Pipe({ name: 'dayLabel' })
export class dayLabelPipe implements PipeTransform {
  transform(value: string): string {
    return DAYS_OF_WEEK.find(group => group.value === value?.toUpperCase())?.label ?? value;
  }
}
