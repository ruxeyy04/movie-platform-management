import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MovieListComponent } from './components/movie-list/movie-list.component';
import { MovieDetailsComponent } from './components/movie-details/movie-details.component';
import { MovieFormComponent } from './components/movie-form/movie-form.component';
import { MoviePlayerComponent } from './components/movie-player/movie-player.component';

const routes: Routes = [
    { path: '', redirectTo: '/movies', pathMatch: 'full' },
    { path: 'movies', component: MovieListComponent },
    { path: 'movies/new', component: MovieFormComponent },
    { path: 'movies/:id', component: MovieDetailsComponent },
    { path: 'movies/:id/edit', component: MovieFormComponent },
    { path: 'movies/:id/play', component: MoviePlayerComponent },
    { path: '**', redirectTo: '/movies' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { } 