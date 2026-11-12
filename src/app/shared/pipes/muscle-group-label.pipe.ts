import { Pipe, PipeTransform } from '@angular/core';
import { MUSCLE_GROUPS } from '../utils/muscle-groups';

// Turns the backend enum (e.g. "CHEST") into the UI label (e.g. "Pecho")
@Pipe({ name: 'muscleGroupLabel' })
export class MuscleGroupLabelPipe implements PipeTransform {
  transform(value: string): string {
    return MUSCLE_GROUPS.find(group => group.value === value?.toUpperCase())?.label ?? value;
  }
}
