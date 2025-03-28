import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Movie } from '../models/movie.model';
import { MOVIES } from './mock-movies';

@Injectable({
    providedIn: 'root'
})
export class MovieService {
    private apiUrl = 'http://localhost:3000/api/movies'; // Will be used later
    private useMock = true; // Toggle between mock and real API

    constructor(private http: HttpClient) { }

    getMovies(): Observable<Movie[]> {
        if (this.useMock) {
            return of([...MOVIES]); // Return a copy to prevent modification of original
        }
        return this.http.get<Movie[]>(this.apiUrl)
            .pipe(catchError(this.handleError));
    }

    getMovie(id: number): Observable<Movie> {
        if (this.useMock) {
            const movie = MOVIES.find(m => m.id === id);
            if (!movie) {
                return throwError(() => new Error(`Movie with id ${id} not found`));
            }
            return of({ ...movie }); // Return a copy to prevent modification of original
        }
        return this.http.get<Movie>(`${this.apiUrl}/${id}`)
            .pipe(catchError(this.handleError));
    }

    addMovie(movie: Movie): Observable<Movie> {
        if (this.useMock) {
            // Create a new ID based on the highest existing ID
            const newId = Math.max(...MOVIES.map(m => m.id || 0)) + 1;
            const newMovie = { ...movie, id: newId };
            MOVIES.push(newMovie);
            return of({ ...newMovie }); // Return a copy
        }
        return this.http.post<Movie>(this.apiUrl, movie)
            .pipe(catchError(this.handleError));
    }

    updateMovie(id: number, movie: Movie): Observable<Movie> {
        if (this.useMock) {
            const index = MOVIES.findIndex(m => m.id === id);
            if (index === -1) {
                return throwError(() => new Error(`Movie with id ${id} not found`));
            }
            const updatedMovie = { ...movie, id };
            MOVIES[index] = updatedMovie;
            return of({ ...updatedMovie }); // Return a copy
        }
        return this.http.put<Movie>(`${this.apiUrl}/${id}`, movie)
            .pipe(catchError(this.handleError));
    }

    deleteMovie(id: number): Observable<void> {
        if (this.useMock) {
            const index = MOVIES.findIndex(m => m.id === id);
            if (index === -1) {
                return throwError(() => new Error(`Movie with id ${id} not found`));
            }
            MOVIES.splice(index, 1);
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