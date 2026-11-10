import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { ToastService } from "../services/toast.service";
import { catchError, throwError } from "rxjs";
import { ErrorResponse } from "../../shared/interfaces/error-response.interface";


export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const toastService = inject(ToastService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            toastService.error(extractMessage(error));
            return throwError(() => error);
        })
    );

}

function extractMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
        return 'Cannot connect to the server. Please try again later.';
    }

    const body = error.error as ErrorResponse | null;

    if (body?.errors?.length) {
        return `${body.message}: ${body.errors.join(', ')}`;
    }
    return body?.message ? body.message : 'Unexpected error. Please try again.';
}
