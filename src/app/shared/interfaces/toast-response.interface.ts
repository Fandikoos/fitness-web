export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastResponse {
    id: number;
    message: string;
    type: ToastType;
}