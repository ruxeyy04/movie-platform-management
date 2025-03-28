import { Routes } from '@angular/router';
import { MovieListComponent } from './components/movie-list/movie-list.component';
import { MovieDetailsComponent } from './components/movie-details/movie-details.component';
import { MovieFormComponent } from './components/movie-form/movie-form.component';
import { MoviePlayerComponent } from './components/movie-player/movie-player.component';
import { HomeComponent } from './components/home/home.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'movies', component: MovieListComponent },
    { path: 'movies/new', component: MovieFormComponent },
    { path: 'movies/:id', component: MovieDetailsComponent },
    { path: 'movies/:id/edit', component: MovieFormComponent },
    { path: 'movies/:id/play', component: MoviePlayerComponent },
    { path: '**', redirectTo: 'movies' }
];