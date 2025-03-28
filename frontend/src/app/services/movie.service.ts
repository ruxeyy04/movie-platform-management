import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
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
            return of(MOVIES);
        }
        return this.http.get<Movie[]>(this.apiUrl);
    }

    getMovie(id: number): Observable<Movie> {
        if (this.useMock) {
            const movie = MOVIES.find(m => m.id === id);
            return of(movie as Movie);
        }
        return this.http.get<Movie>(`${this.apiUrl}/${id}`);
    }

    addMovie(movie: Movie): Observable<Movie> {
        if (this.useMock) {
            // Create a new ID based on the highest existing ID
            const newId = Math.max(...MOVIES.map(m => m.id || 0)) + 1;
            const newMovie = { ...movie, id: newId };
            MOVIES.push(newMovie);
            return of(newMovie);
        }
        return this.http.post<Movie>(this.apiUrl, movie);
    }

    updateMovie(id: number, movie: Movie): Observable<Movie> {
        if (this.useMock) {
            const index = MOVIES.findIndex(m => m.id === id);
            if (index !== -1) {
                MOVIES[index] = { ...movie, id };
                return of(MOVIES[index]);
            }
            return of({} as Movie);
        }
        return this.http.put<Movie>(`${this.apiUrl}/${id}`, movie);
    }

    deleteMovie(id: number): Observable<void> {
        if (this.useMock) {
            const index = MOVIES.findIndex(m => m.id === id);
            if (index !== -1) {
                MOVIES.splice(index, 1);
            }
            return of(void 0);
        }
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}