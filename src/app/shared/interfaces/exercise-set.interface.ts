export interface ExerciseSetResponse {
    id: number;
    setNumber: number;
    weightKg: number;
    reps: number;
    rpe: number;
}

export interface ExerciseSetRequest {
    setNumber: number;
    weightKg: number;
    reps: number;
    rpe: number;
}