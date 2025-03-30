import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject, from } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { Movie } from '../models/movie.model';
import { MOVIES } from './mock-movies';
import { environment } from '../../environments/environment';
import { PaginatedResponse } from './genre.service';
import { FileUploadService } from './file-upload.service';
import axios, { AxiosRequestConfig } from 'axios';

@Injectable({
    providedIn: 'root'
})
export class MovieService {
    private apiUrl = environment.MOVIE_API_URL;
    private useMock = environment.movie_mock_data;
    private axiosConfig: AxiosRequestConfig = {
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

    constructor(
        private fileUploadService: FileUploadService
    ) { }

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

        return from(axios.get<PaginatedResponse<Movie>>(`${this.apiUrl}?page=${page}`, this.axiosConfig))
            .pipe(
                map(response => {
                    // Transform each movie in the results to set proper URLs
                    const data = response.data;
                    data.results = data.results.map(movie => this.transformMovieUrls(movie));
                    return data;
                }),
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

        return from(axios.get<Movie>(`${this.apiUrl}${id}/`, this.axiosConfig))
            .pipe(
                map(response => this.transformMovieUrls(response.data)),
                catchError(this.handleError)
            );
    }

    private transformMovieUrls(movie: Movie): Movie {
        const transformed = { ...movie };

        // Handle poster URL - use posterUploadFile_url if available, otherwise use posterUrl
        if (movie.posterUploadFile_url) {
            transformed.posterUrl = this.fileUploadService.getFullMediaUrl(movie.posterUploadFile_url) || movie.posterUrl;
        }

        // Handle video URL - use videoUploadFile_url if available, otherwise use videoUrl
        if (movie.videoUploadFile_url) {
            transformed.videoUrl = this.fileUploadService.getFullMediaUrl(movie.videoUploadFile_url) || movie.videoUrl;
        }

        // Convert API genres array to string array if needed
        if (movie.genres && Array.isArray(movie.genres) && (!movie.genre || movie.genre.length === 0)) {
            transformed.genre = movie.genres.map(g => g.name);
        }

        return transformed;
    }

    addMovie(movie: Movie): Observable<Movie> {
        if (this.useMock) {
            const newId = Math.max(...MOVIES.map(m => m.id || 0)) + 1;
            const newMovie = { ...movie, id: newId };
            MOVIES.push(newMovie);
            return of({ ...newMovie });
        }

        return from(axios.post<Movie>(this.apiUrl, movie, this.axiosConfig))
            .pipe(
                map(response => this.transformMovieUrls(response.data)),
                catchError(this.handleError)
            );
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

        return from(axios.put<Movie>(`${this.apiUrl}${id}/`, movie, this.axiosConfig))
            .pipe(
                map(response => this.transformMovieUrls(response.data)),
                catchError(this.handleError)
            );
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

        return from(axios.delete<void>(`${this.apiUrl}${id}/`, this.axiosConfig))
            .pipe(
                map(() => undefined), // Return void
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
        let errorMessage = 'An unknown error occurred';

        if (axios.isAxiosError(error)) {
            if (error.response) {
                // Server responded with a status code outside of 2xx
                errorMessage = `Error Code: ${error.response.status}\nMessage: ${error.response.data?.message || error.message}`;
            } else if (error.request) {
                // Request was made but no response received
                errorMessage = 'No response received from server';
            } else {
                // Error setting up the request
                errorMessage = error.message;
            }
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error(errorMessage);
        return throwError(() => new Error(errorMessage));
    }
}