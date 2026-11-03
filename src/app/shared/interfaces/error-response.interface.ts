export interface ErrorResponse {
    status: number;
    error: string;
    message: string;
    errors?: string[];
    timestamp: string;
    path: string;
}