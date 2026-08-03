import { Component, input, OnInit } from '@angular/core';
import { ListExercisesComponent } from "../list-exercises/list-exercises.component";

@Component({
  selector: 'app-select-exercises',
  templateUrl: './select-exercises.component.html',
  styleUrls: ['./select-exercises.component.css'],
  imports: [
    ListExercisesComponent
]
})
export class SelectExercisesComponent implements OnInit {

  dayOfWeek = input.required<string>();

  constructor() { }

  ngOnInit() {
  }

}
