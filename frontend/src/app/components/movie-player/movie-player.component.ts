import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Movie } from '../../models/movie.model';
import { MovieService } from '../../services/movie.service';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-movie-player',
  templateUrl: './movie-player.component.html',
  styleUrls: ['./movie-player.component.css'],
  standalone: true,
  imports: [CommonModule,
    //  RouterLink
  ]
})
export class MoviePlayerComponent implements OnInit {
  movie: Movie | null = null;
  loading = true;
  error = false;

  constructor(
    private route: ActivatedRoute,
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
          console.error('Error fetching movie for playback', err);
          this.error = true;
          this.loading = false;
        }
      });
  }

  goBack(): void {
    this.location.back();
  }

  // Format the release date into "Month Day, Year Weekday" format
  formatReleaseDate(date: string | Date | null): string {
    if (!date) return 'Coming Soon';

    const releaseDate = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    return releaseDate.toLocaleDateString('en-US', options);
  }
}