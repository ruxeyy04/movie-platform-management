export interface Movie {
    id?: number;
    title: string;
    description: string;
    releaseYear: number;
    director: string;
    genre: string[];
    duration: number; // in minutes
    rating: number; // 1-10
    posterUrl: string;
    videoUrl: string;
} 