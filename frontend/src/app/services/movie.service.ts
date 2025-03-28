import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Movie } from '../models/movie.model';

@Injectable({
    providedIn: 'root'
})
export class MovieService {
    private apiUrl = 'http://localhost:3000/api/movies'; // Adjust based on your backend URL

    constructor(private http: HttpClient) { }

    getMovies(): Observable<Movie[]> {
        return this.http.get<Movie[]>(this.apiUrl);
    }

    getMovie(id: number): Observable<Movie> {
        return this.http.get<Movie>(`${this.apiUrl}/${id}`);
    }

    addMovie(movie: Movie): Observable<Movie> {
        return this.http.post<Movie>(this.apiUrl, movie);
    }

    updateMovie(id: number, movie: Movie): Observable<Movie> {
        return this.http.put<Movie>(`${this.apiUrl}/${id}`, movie);
    }

    deleteMovie(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
} 