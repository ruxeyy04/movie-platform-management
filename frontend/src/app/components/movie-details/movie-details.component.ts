import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Movie } from '../../models/movie.model';
import { MovieService } from '../../services/movie.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-movie-details',
  templateUrl: './movie-details.component.html',
  styleUrls: ['./movie-details.component.css']
})
export class MovieDetailsComponent implements OnInit {
  movie: Movie | null = null;
  loading = true;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private movieService: MovieService,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.getMovie();
  }

  getMovie(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id)) {
      this.error = true;
      this.loading = false;
      return;
    }

    this.movieService.getMovie(id)
      .subscribe({
        next: (movie) => {
          this.movie = movie;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching movie details', err);
          this.error = true;
          this.loading = false;
        }
      });
  }

  goBack(): void {
    this.location.back();
  }

  deleteMovie(): void {
    if (!this.movie?.id) return;

    if (confirm('Are you sure you want to delete this movie?')) {
      this.movieService.deleteMovie(this.movie.id).subscribe({
        next: () => {
          this.router.navigate(['/movies']);
        },
        error: (err) => {
          console.error('Error deleting movie', err);
          alert('Failed to delete the movie. Please try again.');
        }
      });
    }
  }
}