import { ExerciseSetRequest } from "./exercise-set.interface";
import { ExerciseTemplateResponse } from "./exercise-template.interface";

export interface RoutineResponse {
    id: number;
    name: string;
    dayOfWeek: string;
    description: string;
    programId: number;
    createdAt: Date;
    exercises: ExerciseTemplateResponse[];
}

export interface RoutineRequest {
    name: string;
    dayOfWeek: string;
    description: string;
    programId: number;
    exercises: RoutineExerciseRequest[];
}

export interface RoutineExerciseRequest {
    exerciseTemplateId: number;
    order: number;
    notes: string;
    sets: ExerciseSetRequest[];
}