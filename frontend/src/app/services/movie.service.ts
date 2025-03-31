import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject, from, forkJoin } from 'rxjs';
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
    private loadingSearch = new BehaviorSubject<boolean>(false);

    // Observable streams
    listLoading$ = this.loadingList.asObservable();
    deleteLoading$ = this.loadingDelete.asObservable();
    searchLoading$ = this.loadingSearch.asObservable();

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

    searchMovies(query: string, page: number = 1): Observable<PaginatedResponse<Movie>> {
        if (this.useMock) {
            // For mock data, perform local filtering
            const filteredMovies = MOVIES.filter(movie =>
                movie.title.toLowerCase().includes(query.toLowerCase()) ||
                movie.director?.toLowerCase().includes(query.toLowerCase()) ||
                movie.genre?.some(g => g.toLowerCase().includes(query.toLowerCase()))
            );

            const mockResponse: PaginatedResponse<Movie> = {
                count: filteredMovies.length,
                next: null,
                previous: null,
                results: [...filteredMovies]
            };
            return of(mockResponse);
        }

        this.loadingSearch.next(true);

        return from(axios.get<PaginatedResponse<Movie>>(`${this.apiUrl}?search=${encodeURIComponent(query)}&page=${page}`, this.axiosConfig))
            .pipe(
                map(response => {
                    const data = response.data;
                    data.results = data.results.map(movie => this.transformMovieUrls(movie));
                    return data;
                }),
                catchError(this.handleError),
                finalize(() => this.loadingSearch.next(false))
            );
    }

    getSearchSuggestions(query: string, limit: number = 5): Observable<Movie[]> {
        if (this.useMock) {
            const filteredMovies = MOVIES.filter(movie =>
                movie.title.toLowerCase().includes(query.toLowerCase())
            ).slice(0, limit);

            return of(filteredMovies);
        }

        return from(axios.get<PaginatedResponse<Movie>>(`${this.apiUrl}?search=${encodeURIComponent(query)}&limit=${limit}`, this.axiosConfig))
            .pipe(
                map(response => {
                    return response.data.results.map(movie => this.transformMovieUrls(movie));
                }),
                catchError(error => {
                    console.error('Error fetching search suggestions:', error);
                    return of([]);
                })
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

    /**
     * Get similar movies based on genre match
     * @param currentMovie The movie to find similar titles for
     * @param limit Maximum number of movies to return
     * @returns Observable of similar movies
     */
    getSimilarMovies(currentMovie: Movie, limit: number = 6): Observable<Movie[]> {
        if (this.useMock) {
            // Use local filtering based on genre match for mock data
            if (!currentMovie.genre || currentMovie.genre.length === 0) {
                return of([]); // No genres to match
            }

            // Filter movies that share at least one genre with the current movie
            // and exclude the current movie itself
            const similarMovies = MOVIES.filter(movie =>
                movie.id !== currentMovie.id &&
                movie.genre &&
                movie.genre.some(genre =>
                    currentMovie.genre!.includes(genre)
                )
            );

            // Sort by number of matching genres (most matches first)
            const sortedSimilar = similarMovies.sort((a, b) => {
                const aMatches = a.genre!.filter(genre => currentMovie.genre!.includes(genre)).length;
                const bMatches = b.genre!.filter(genre => currentMovie.genre!.includes(genre)).length;
                return bMatches - aMatches;
            });

            return of(sortedSimilar.slice(0, limit));
        }

        // For production API, fetch and process multiple genres
        if (!currentMovie.genre || currentMovie.genre.length === 0) {
            return of([]); // No genres to match
        }

        // Create an array of observables, one for each genre
        const genreObservables = currentMovie.genre.map(genre =>
            from(axios.get<PaginatedResponse<Movie>>(
                `${this.apiUrl}?genre=${encodeURIComponent(genre)}&limit=${limit * 2}`,
                this.axiosConfig
            )).pipe(
                map(response => response.data.results
                    .map(movie => this.transformMovieUrls(movie))
                ),
                catchError(() => of([]))
            )
        );

        // Combine all results and process
        return forkJoin(genreObservables).pipe(
            map(resultsArray => {
                // Flatten array of arrays
                const allResults = resultsArray.flat();

                // Remove duplicates and current movie
                const movieMap = new Map<number, { movie: Movie, matchCount: number }>();

                allResults.forEach(movie => {
                    if (!movie.id || movie.id === currentMovie.id) return;

                    if (movieMap.has(movie.id)) {
                        // Increment match count for movies that appear in multiple genre searches
                        const existing = movieMap.get(movie.id)!;
                        existing.matchCount += 1;
                    } else {
                        movieMap.set(movie.id, {
                            movie,
                            matchCount: 1
                        });
                    }
                });

                // Convert map back to array and sort by match count (descending)
                return Array.from(movieMap.values())
                    .sort((a, b) => b.matchCount - a.matchCount)
                    .map(item => item.movie)
                    .slice(0, limit);
            }),
            catchError(error => {
                console.error('Error fetching similar movies:', error);
                return of([]);
            })
        );
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