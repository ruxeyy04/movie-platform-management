import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Movie } from '../models/movie.model';
import { MOVIES } from './mock-movies';
import { environment } from '../../environments/environment';
import { PaginatedResponse } from './genre.service';

@Injectable({
    providedIn: 'root'
})
export class MovieService {
    private apiUrl = environment.MOVIE_API_URL;
    private useMock = environment.movie_mock_data;
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
    private loadingDelete = new BehaviorSubject<boolean>(false);

    // Observable streams
    listLoading$ = this.loadingList.asObservable();
    deleteLoading$ = this.loadingDelete.asObservable();

    constructor(private http: HttpClient) { }

    getMovies(page: number = 1): Observable<PaginatedResponse<Movie>> {
        if (this.useMock) {
            const mockResponse: PaginatedResponse<Movie> = {
                count: MOVIES.length,
                next: null,
                previous: null,
                results: [...MOVIES]
            };
            return of(mockResponse);
        }

        this.loadingList.next(true);
        return this.http.get<PaginatedResponse<Movie>>(`${this.apiUrl}?page=${page}`, this.axiosConfig)
            .pipe(
                catchError(this.handleError),
                finalize(() => this.loadingList.next(false))
            );
    }

    getMovie(id: number): Observable<Movie> {
        if (this.useMock) {
            const movie = MOVIES.find(m => m.id === id);
            if (!movie) {
                return throwError(() => new Error(`Movie with id ${id} not found`));
            }
            return of({ ...movie });
        }
        return this.http.get<Movie>(`${this.apiUrl}${id}/`, this.axiosConfig)
            .pipe(catchError(this.handleError));
    }

    addMovie(movie: Movie): Observable<Movie> {
        if (this.useMock) {
            const newId = Math.max(...MOVIES.map(m => m.id || 0)) + 1;
            const newMovie = { ...movie, id: newId };
            MOVIES.push(newMovie);
            return of({ ...newMovie });
        }
        return this.http.post<Movie>(this.apiUrl, movie, this.axiosConfig)
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
            return of({ ...updatedMovie });
        }
        return this.http.put<Movie>(`${this.apiUrl}${id}/`, movie, this.axiosConfig)
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

        this.loadingDelete.next(true);
        return this.http.delete<void>(`${this.apiUrl}${id}/`, this.axiosConfig)
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
}