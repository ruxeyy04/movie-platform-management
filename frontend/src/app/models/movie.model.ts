export interface Movie {
    id?: number;
    title: string;
    description: string;
    releaseYear: number;
    releaseDate: Date | string | null;
    director: string;
    genre: string[];
    duration: number; // in minutes
    rating: number; // 1-10
    posterUrl: string;
    videoUrl: string;
}