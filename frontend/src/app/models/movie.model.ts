import { Genre } from '../models/genre.model';

export interface Movie {
    id?: number;
    title: string;
    description: string;
    releaseYear: number;
    releaseDate: Date | string | null;
    director: string;
    genre: string[];
    genres?: Genre[]; // For API response
    duration: number; // in minutes
    rating: number; // 1-10
    posterUrl: string;
    posterUploadFile_url: string | null;
    videoUrl: string;
    videoUploadFile_url: string | null;
    created_at?: string;
    updated_at?: string;
}

