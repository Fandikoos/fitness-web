import { RoutineResponse } from "./routine.interface";

export interface ProgramResponse {
    id: number;
    name: string;
    description: string;
    createdAt: Date;
    routines: RoutineResponse[];
    active: boolean;
}

export interface ProgramRequest {
    name: string;
    description: string;
    active: boolean;
}