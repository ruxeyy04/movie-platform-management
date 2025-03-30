import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpErrorResponse, HttpRequest, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, Subscription, Subject } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { from } from 'rxjs';
import axios, { CancelTokenSource } from 'axios';

export interface UploadProgress {
    state: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'ERROR';
    progress: number;
    uploadedUrl?: string;
    error?: string;
    filename?: string;
    filePath?: string;
}

@Injectable({
    providedIn: 'root'
})
export class FileUploadService {
    private apiUrl = environment.FILE_UPLOAD_API_URL;
    private mediaUrl: string;
    private axiosConfig = {
        headers: {
            'Authorization': 'Basic ' + btoa(environment.AUTH_USERNAME + ':' + environment.AUTH_PASSWORD),
        }
    };
    private uploadsMap = new Map<string, BehaviorSubject<UploadProgress>>();
    private uploadSubscriptions = new Map<string, Subscription>();
    private cancelSubjects = new Map<string, Subject<void>>();

    constructor(private http: HttpClient) {
        // Construct the media URL from the backend URL
        this.mediaUrl = `${environment.BACKEND_URL}/media/`;
    }

    getUploadProgress(uploadId: string): Observable<UploadProgress> {
        if (!this.uploadsMap.has(uploadId)) {
            this.uploadsMap.set(uploadId, new BehaviorSubject<UploadProgress>({
                state: 'PENDING',
                progress: 0
            }));
        }
        return this.uploadsMap.get(uploadId)!.asObservable();
    }

    uploadFile(file: File, type: 'poster' | 'video'): Observable<UploadProgress> {
        const uploadId = `${type}_${Date.now()}`;

        // Process the filename: replace spaces with underscores
        const originalName = file.name;
        const extension = originalName.substring(originalName.lastIndexOf('.'));
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
        const processedName = nameWithoutExt.replace(/\s+/g, '_');

        // Create unique filename with format: unique_id_processedname.extension
        const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
        const uniqueFilename = `${uniqueId}_${processedName}${extension}`;

        const progressSubject = new BehaviorSubject<UploadProgress>({
            state: 'PENDING',
            progress: 0
        });

        this.uploadsMap.set(uploadId, progressSubject);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        formData.append('filename', uniqueFilename);

        const cancelSubject = new Subject<void>();
        this.cancelSubjects.set(uploadId, cancelSubject);

        const headers = new HttpHeaders({
            'Authorization': 'Basic ' + btoa(environment.AUTH_USERNAME + ':' + environment.AUTH_PASSWORD)
        });

        const req = new HttpRequest('POST', `${this.apiUrl}${type}/`, formData, {
            reportProgress: true,
            headers: headers
        });

        const subscription = this.http.request(req).pipe(
            takeUntil(cancelSubject),
            map(event => this.getEventMessage(event, file)),
            catchError((error) => {
                return this.handleError(error);
            })
        ).subscribe({
            next: (event: any) => {
                if (event.type === 'progress') {
                    progressSubject.next({
                        state: 'IN_PROGRESS',
                        progress: event.progress
                    });
                } else if (event.type === 'complete') {
                    progressSubject.next({
                        state: 'DONE',
                        progress: 100,
                        uploadedUrl: event.url,
                        filename: event.filename,
                        filePath: this.extractFilePath(event.url)
                    });
                    this.cleanupUpload(uploadId);
                }
            },
            error: (error: any) => {
                progressSubject.next({
                    state: 'ERROR',
                    progress: 0,
                    error: error.message || 'Upload failed'
                });

                this.cleanupUpload(uploadId);
            },
            complete: () => {
                if (cancelSubject.isStopped) {
                    progressSubject.next({
                        state: 'ERROR',
                        progress: 0,
                        error: 'Upload cancelled successfully'
                    });
                }
            }
        });

        this.uploadSubscriptions.set(uploadId, subscription);

        return progressSubject.asObservable();
    }

    cancelUpload(uploadId: string, deleteFromServer: boolean = false): void {
        const subject = this.uploadsMap.get(uploadId);
        let currentState = subject?.getValue();
        let cancelMessage = 'Upload cancelled successfully';

        if (currentState?.state === 'DONE' && currentState?.uploadedUrl) {
            cancelMessage = 'Upload cancelled and removed from the server';

            if (deleteFromServer && currentState.uploadedUrl) {
                this.deleteFile(currentState.uploadedUrl, false).subscribe();
            }
        }

        const cancelSubject = this.cancelSubjects.get(uploadId);
        if (cancelSubject && !cancelSubject.closed) {
            cancelSubject.next();
            cancelSubject.complete();
        }

        if (subject) {
            subject.next({
                state: 'ERROR',
                progress: 0,
                error: cancelMessage
            });
        }

        this.cleanupUpload(uploadId);
    }

    private cleanupUpload(uploadId: string): void {
        const subscription = this.uploadSubscriptions.get(uploadId);
        if (subscription) {
            subscription.unsubscribe();
            this.uploadSubscriptions.delete(uploadId);
        }

        const cancelSubject = this.cancelSubjects.get(uploadId);
        if (cancelSubject && !cancelSubject.closed) {
            cancelSubject.complete();
        }
        this.cancelSubjects.delete(uploadId);
    }

    deleteFile(fileUrl: string, showNotification: boolean = true): Observable<any> {
        return from(axios.post(`${this.apiUrl}delete/`,
            { url: fileUrl },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + btoa(environment.AUTH_USERNAME + ':' + environment.AUTH_PASSWORD)
                }
            }))
            .pipe(
                map(response => {
                    return { ...response.data, showNotification };
                }),
                catchError(this.handleError)
            );
    }

    private getEventMessage(event: HttpEvent<any>, file: File): any {
        switch (event.type) {
            case HttpEventType.Sent:
                return { type: 'progress', progress: 0 };

            case HttpEventType.UploadProgress:
                const progress = Math.round(100 * event.loaded / (event.total || file.size));
                return { type: 'progress', progress };

            case HttpEventType.Response:
                return {
                    type: 'complete',
                    url: event.body?.url || null,
                    filename: event.body?.filename || null
                };

            default:
                return { type: 'unsupported', event };
        }
    }

    private handleError(error: HttpErrorResponse) {
        let errorMessage = '';
        if (error.error instanceof ErrorEvent) {
            errorMessage = `Error: ${error.error.message}`;
        } else {
            errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
        console.error(errorMessage);
        return throwError(() => new Error(errorMessage));
    }

    /**
     * Extracts the file path from a URL
     * @param url The full URL to the file
     * @returns The relative path like "movie_posters/filename.png"
     */
    extractFilePath(url: string): string {
        if (!url) return '';

        try {
            const mediaIndex = url.indexOf(this.mediaUrl);
            if (mediaIndex === -1) {
                const altMediaIndex = url.indexOf('/media/');
                if (altMediaIndex === -1) return '';

                let path = url.substring(altMediaIndex + 7);
                path = decodeURIComponent(path).replace(/\\/g, '/');
                return path;
            }

            let path = url.substring(mediaIndex + this.mediaUrl.length);
            path = decodeURIComponent(path).replace(/\\/g, '/');
            return path;
        } catch (error) {
            console.error('Error extracting file path:', error);
            return '';
        }
    }

}
