export interface ExerciseTemplateResponse {
    id: number;
    name: string;
    muscleGroup: string;
    imageUrl?: string;
    videoUrl?: string;
}

export interface ExerciseTemplateRequest {
    name: string;
    muscleGroup: string;
    imageUrl?: string;
    videoUrl?: string;
}

