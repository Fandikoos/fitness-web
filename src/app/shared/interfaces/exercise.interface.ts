import { ExerciseSetResponse } from "./exercise-set.interface";

export default interface ExerciseResponse {
    id: number;
    name: string;
    imageUrl?: string;
    videoUrl?: string;
    orderInRoutine: number;
    notes: string;
    exerciseSetResponse: ExerciseSetResponse[];
}

