import ExerciseResponse from "./exercise.interface";

export interface RoutineResponse {
    id: number;
    name: string;
    dayOfWeek: string;
    description: string;
    programId: number;
    createdAt: Date;
    exercises: ExerciseResponse[];
}