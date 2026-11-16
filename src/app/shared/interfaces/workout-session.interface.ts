import { ExerciseTemplateResponse } from "./exercise-template.interface";

export interface WorkoutSessionResponse {
    id: number;
    // LocalDate en el backend → llega como string "yyyy-MM-dd"
    sessionDate: string;
    routineId: number;
    routineName: string;
    notes: string | null;
    createdAt: string;
    exercises: LoggedExerciseResponse[];
}

export interface LoggedExerciseResponse {
    id: number;
    exerciseTemplate: ExerciseTemplateResponse;
    orderInSession: number;
    notes: string | null;
    sets: LoggedSetResponse[];
}

// Serie REALIZADA (no planificada): por eso es distinta de ExerciseSetResponse
export interface LoggedSetResponse {
    id: number;
    numberSet: number;
    weightKg: number;
    reps: number;
    rpe: number | null;
}

// ---- Peticiones (lo que se envía en POST /sessions) ----

export interface WorkoutSessionRequest {
    // Formato "yyyy-MM-dd"; el backend no acepta fechas futuras
    sessionDate: string;
    routineId: number;
    // Máximo 500 caracteres
    notes: string | null;
    // Al menos un ejercicio
    exercises: LoggedExerciseRequest[];
}

export interface LoggedExerciseRequest {
    exerciseTemplateId: number;
    // Empieza en 1
    orderInSession: number;
    // Máximo 255 caracteres
    notes: string | null;
    // Al menos una serie
    sets: LoggedSetRequest[];
}

export interface LoggedSetRequest {
    // Empieza en 1
    numberSet: number;
    // 0 – 999.99 kg, máximo 2 decimales
    weightKg: number;
    // 0 se permite: un intento fallido también es información
    reps: number;
    // 1 – 10, opcional
    rpe: number | null;
}
