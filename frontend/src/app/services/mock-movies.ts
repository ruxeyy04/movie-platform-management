import { Movie } from '../models/movie.model';

export const MOVIES: Movie[] = [
    {
        id: 1,
        title: 'Inception',
        description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
        releaseYear: 2010,
        releaseDate: new Date('2010-07-16'),
        director: 'Christopher Nolan',
        genre: ['Action', 'Adventure', 'Sci-Fi'],
        duration: 148,
        rating: 8.8,
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        posterUploadFile_url: '',
        videoUploadFile_url: ''
    },
    {
        id: 2,
        title: 'The Shawshank Redemption',
        description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
        releaseYear: 1994,
        releaseDate: new Date('1994-10-14'),
        director: 'Frank Darabont',
        genre: ['Drama'],
        duration: 142,
        rating: 9.3,
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_.jpg',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        posterUploadFile_url: '',
        videoUploadFile_url: ''
    },
    {
        id: 3,
        title: 'The Dark Knight',
        description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        releaseYear: 2008,
        releaseDate: new Date('2008-07-18'),
        director: 'Christopher Nolan',
        genre: ['Action', 'Crime', 'Drama'],
        duration: 152,
        rating: 9.0,
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_.jpg',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        posterUploadFile_url: '',
        videoUploadFile_url: ''
    },
    {
        id: 4,
        title: 'Pulp Fiction',
        description: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
        releaseYear: 1994,
        releaseDate: new Date('1994-10-14'),
        director: 'Quentin Tarantino',
        genre: ['Crime', 'Drama'],
        duration: 154,
        rating: 8.9,
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        posterUploadFile_url: '',
        videoUploadFile_url: ''
    },
    {
        id: 5,
        title: 'Upcoming Blockbuster',
        description: 'A highly anticipated action movie coming soon to theaters.',
        releaseYear: 2024,
        releaseDate: new Date('2024-10-14'),
        director: 'Famous Director',
        genre: ['Action', 'Thriller'],
        duration: 130,
        rating: 0,
        posterUrl: 'https://dnn24.com/wp-content/uploads/2024/12/Fi_1-.jpg',
        videoUrl: 'https://youtu.be/dQw4w9WgXcQ?si=Ng8HhOMD_XXcuwVe',
        posterUploadFile_url: '',
        videoUploadFile_url: ''
    }
];