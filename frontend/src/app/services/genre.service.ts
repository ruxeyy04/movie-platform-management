import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Genre } from '../models/genre.model';

// Mock data for genres
export const GENRES: Genre[] = [
    { id: 1, name: 'Action' },
    { id: 2, name: 'Adventure' },
];

@Injectable({
    providedIn: 'root'
})
export class GenreService {
    private apiUrl = 'http://localhost:8000/api/genres'; // Django backend API URL
    private useMock = true; // Toggle between mock and real API

    constructor(private http: HttpClient) { }

    getGenres(): Observable<Genre[]> {
        if (this.useMock) {
            return of([...GENRES]); // Return a copy to prevent modification of original
        }
        return this.http.get<Genre[]>(this.apiUrl)
            .pipe(catchError(this.handleError));
    }

    getGenre(id: number): Observable<Genre> {
        if (this.useMock) {
            const genre = GENRES.find(g => g.id === id);
            if (!genre) {
                return throwError(() => new Error(`Genre with id ${id} not found`));
            }
            return of({ ...genre }); // Return a copy
        }
        return this.http.get<Genre>(`${this.apiUrl}/${id}`)
            .pipe(catchError(this.handleError));
    }

    addGenre(genre: Genre): Observable<Genre> {
        if (this.useMock) {
            // Create a new ID based on the highest existing ID
            const newId = Math.max(...GENRES.map(g => g.id || 0)) + 1;
            const newGenre = { ...genre, id: newId };
            GENRES.push(newGenre);
            return of({ ...newGenre }); // Return a copy
        }
        return this.http.post<Genre>(this.apiUrl, genre)
            .pipe(catchError(this.handleError));
    }

    updateGenre(id: number, genre: Genre): Observable<Genre> {
        if (this.useMock) {
            const index = GENRES.findIndex(g => g.id === id);
            if (index === -1) {
                return throwError(() => new Error(`Genre with id ${id} not found`));
            }
            const updatedGenre = { ...genre, id };
            GENRES[index] = updatedGenre;
            return of({ ...updatedGenre }); // Return a copy
        }
        return this.http.put<Genre>(`${this.apiUrl}/${id}`, genre)
            .pipe(catchError(this.handleError));
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
        return this.http.delete<void>(`${this.apiUrl}/${id}`)
            .pipe(catchError(this.handleError));
    }

    private handleError(error: HttpErrorResponse) {
        let errorMessage = '';
        if (error.error instanceof ErrorEvent) {
            // Client-side error
            errorMessage = `Error: ${error.error.message}`;
        } else {
            // Server-side error
            errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
        console.error(errorMessage);
        return throwError(() => new Error(errorMessage));
    }
} 