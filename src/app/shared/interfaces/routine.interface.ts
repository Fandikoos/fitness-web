import { ExerciseSetRequest, ExerciseSetResponse } from "./exercise-set.interface";
import { ExerciseTemplateResponse } from "./exercise-template.interface";

export interface RoutineResponse {
    id: number;
    name: string;
    dayOfWeek: string;
    description: string;
    programId: number;
    createdAt: string;
    exercises: RoutineExerciseResponse[];
}

export interface RoutineExerciseResponse {
    id: number;
    exerciseTemplate: ExerciseTemplateResponse;
    orderInRoutine: number;
    notes: string;
    sets: ExerciseSetResponse[];
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
    orderInRoutine: number;
    notes: string;
    sets: ExerciseSetRequest[];
}
