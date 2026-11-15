export interface ExerciseSetResponse {
    id?: number;
    numberSet: number;
    weightKg: number;
    reps: number;
    rpe: number | null;
}

export interface ExerciseSetRequest {
    numberSet: number;
    weightKg: number;
    reps: number;
    rpe: number | null;
}
