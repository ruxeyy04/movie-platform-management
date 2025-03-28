import { Movie } from '../models/movie.model';

export const MOVIES: Movie[] = [
    {
        id: 1,
        title: 'Inception',
        description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
        releaseYear: 2010,
        director: 'Christopher Nolan',
        genre: ['Action', 'Adventure', 'Sci-Fi'],
        duration: 148,
        rating: 8.8,
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg',
        videoUrl: 'https://example.com/inception.mp4'
    },
    {
        id: 2,
        title: 'The Shawshank Redemption',
        description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
        releaseYear: 1994,
        director: 'Frank Darabont',
        genre: ['Drama'],
        duration: 142,
        rating: 9.3,
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_.jpg',
        videoUrl: 'https://example.com/shawshank-redemption.mp4'
    },
    {
        id: 3,
        title: 'The Dark Knight',
        description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        releaseYear: 2008,
        director: 'Christopher Nolan',
        genre: ['Action', 'Crime', 'Drama'],
        duration: 152,
        rating: 9.0,
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_.jpg',
        videoUrl: 'https://example.com/dark-knight.mp4'
    },
    {
        id: 4,
        title: 'Pulp Fiction',
        description: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
        releaseYear: 1994,
        director: 'Quentin Tarantino',
        genre: ['Crime', 'Drama'],
        duration: 154,
        rating: 8.9,
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg',
        videoUrl: 'https://example.com/pulp-fiction.mp4'
    }
];