import Routine from "./exercise.interface";

export interface ProgramResponse {
    id: number;
    name: string;
    description: string;
    createdAt: Date;
    routines: Routine [];
    active: boolean;
}

export interface ProgramRequest {
    name: string;
    description: string;
    active: boolean;
}