import { enableProdMode, Injectable } from '@angular/core';
import { Observable, from, of, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, finalize } from 'rxjs/operators';
import axios, { AxiosError } from 'axios';
import { environment } from '../../environments/environment';

import { GENRES } from './mock-series';
import { Genre } from '../models/genre.model';

// Pagination interface
export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}



@Injectable({
    providedIn: 'root'
})
export class GenreService {
    private useMock = environment.genre_mock_data;
    private apiUrl = environment.GENRE_API_URL;
    private axiosConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(environment.AUTH_USERNAME + ':' + environment.AUTH_PASSWORD),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    };

    // Loading state subjects
    private loadingList = new BehaviorSubject<boolean>(false);
    private loadingCreate = new BehaviorSubject<boolean>(false);
    private loadingUpdate = new BehaviorSubject<boolean>(false);
    private loadingDelete = new BehaviorSubject<boolean>(false);

    // Observable streams
    listLoading$ = this.loadingList.asObservable();
    createLoading$ = this.loadingCreate.asObservable();
    updateLoading$ = this.loadingUpdate.asObservable();
    deleteLoading$ = this.loadingDelete.asObservable();

    constructor() { }

    getGenres(page: number = 1): Observable<PaginatedResponse<Genre>> {
        if (this.useMock) {
            const mockResponse: PaginatedResponse<Genre> = {
                count: GENRES.length,
                next: null,
                previous: null,
                results: [...GENRES]
            };
            return of(mockResponse);
        }

        this.loadingList.next(true);
        return from(axios.get(`${this.apiUrl}?page=${page}`, this.axiosConfig)
            .then(response => response.data))
            .pipe(
                catchError(this.handleError),
                finalize(() => this.loadingList.next(false))
            );
    }

    getGenre(id: number): Observable<Genre> {
        if (this.useMock) {
            const genre = GENRES.find(g => g.id === id);
            if (!genre) {
                return throwError(() => new Error(`Genre with id ${id} not found`));
            }
            return of({ ...genre });
        }

        this.loadingList.next(true);
        return from(axios.get(`${this.apiUrl}${id}/`, this.axiosConfig)
            .then(response => response.data))
            .pipe(
                catchError(this.handleError),
                finalize(() => this.loadingList.next(false))
            );
    }

    addGenre(genre: Genre): Observable<Genre> {
        if (this.useMock) {
            const newId = Math.max(...GENRES.map(g => g.id || 0)) + 1;
            const newGenre = { ...genre, id: newId };
            GENRES.push(newGenre);
            return of({ ...newGenre });
        }

        this.loadingCreate.next(true);
        return from(axios.post(this.apiUrl, genre, this.axiosConfig)
            .then(response => response.data))
            .pipe(
                catchError(this.handleError),
                finalize(() => this.loadingCreate.next(false))
            );
    }

    updateGenre(id: number, genre: Genre): Observable<Genre> {
        if (this.useMock) {
            const index = GENRES.findIndex(g => g.id === id);
            if (index === -1) {
                return throwError(() => new Error(`Genre with id ${id} not found`));
            }
            const updatedGenre = { ...genre, id };
            GENRES[index] = updatedGenre;
            return of({ ...updatedGenre });
        }

        this.loadingUpdate.next(true);
        return from(axios.put(`${this.apiUrl}${id}/`, genre, this.axiosConfig)
            .then(response => response.data))
            .pipe(
                catchError(this.handleError),
                finalize(() => this.loadingUpdate.next(false))
            );
    }

    deleteGenre(id: number): Observable<void> {
        if (this.useMock) {
            const index = GENRES.findIndex(g => g.id === id);
            if (index === -1) {
                return throwError(() => new Error(`Genre with id ${id} not found`));
            }
            GENRES.splice(index, 1);
            return of(void 0);
        }

        this.loadingDelete.next(true);
        return from(axios.delete(`${this.apiUrl}${id}/`, this.axiosConfig)
            .then(() => undefined))
            .pipe(
                catchError(this.handleError),
                finalize(() => this.loadingDelete.next(false))
            );
    }

    getPageFromUrl(url: string | null): number {
        if (!url) return 1;
        const match = url.match(/page=(\d+)/);
        return match ? parseInt(match[1], 10) : 1;
    }

    private handleError(error: any) {
        let errorMessage = '';
        if (error.isAxiosError) {
            const axiosError = error as AxiosError;
            if (axiosError.response && axiosError.response.data) {
                const data = axiosError.response.data;
                if (typeof data === 'object' && data !== null) {
                    const fieldErrors = Object.entries(data)
                        .map(([field, errors]) => {
                            const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
                            if (Array.isArray(errors)) {
                                return `${fieldName}: ${errors.join(', ')}`;
                            }
                            return `${fieldName}: ${errors}`;
                        })
                        .join('\n');

                    if (fieldErrors) {
                        errorMessage = fieldErrors;
                        return throwError(() => ({
                            message: errorMessage,
                            fieldErrors: data,
                            status: axiosError.response?.status || 'unknown'
                        }));
                    }
                }
            }
            errorMessage = `Error Code: ${axiosError.response?.status || 'unknown'}\nMessage: ${axiosError.message}`;
        } else {
            errorMessage = `Error: ${error.message || error}`;
        }
        console.error(errorMessage);
        return throwError(() => new Error(errorMessage));
    }
} 