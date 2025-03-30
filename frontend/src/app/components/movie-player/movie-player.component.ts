import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Movie } from '../../models/movie.model';
import { MovieService } from '../../services/movie.service';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

import { VgCoreModule, VgApiService } from '@videogular/ngx-videogular/core';
import { VgControlsModule } from '@videogular/ngx-videogular/controls';
import { VgOverlayPlayModule } from '@videogular/ngx-videogular/overlay-play';
import { VgBufferingModule } from '@videogular/ngx-videogular/buffering';

@Component({
  selector: 'app-movie-player',
  templateUrl: './movie-player.component.html',
  styleUrls: ['./movie-player.component.css'],
  standalone: true,
  imports: [CommonModule,
    VgCoreModule,
    VgControlsModule,
    VgOverlayPlayModule,
    VgBufferingModule
  ]
})
export class MoviePlayerComponent implements OnInit {
  preload: string = 'auto';
  api: VgApiService | undefined;
  movie: Movie | null = null;
  loading = true;
  error = false;
  youtubeVideoUrl: SafeResourceUrl | null = null;
  mediaBaseUrl = environment.MEDIA_URL;

  constructor(
    private route: ActivatedRoute,
    private movieService: MovieService,
    private location: Location,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.getMovie();
  }

  onPlayerReady(api: VgApiService): void {
    this.api = api;

    this.api.getDefaultMedia().subscriptions.seeking.subscribe(
      () => console.log('Seeking started')
    );

    this.api.getDefaultMedia().subscriptions.seeked.subscribe(
      () => console.log('Seeking completed')
    );

    this.api.getDefaultMedia().subscriptions.loadedMetadata.subscribe(
      () => {
        console.log('Video metadata loaded');
      }
    );

    this.api.getDefaultMedia().subscriptions.canPlay.subscribe(
      () => {
        console.log('Video can play');
        if (this.api) {
          const media = this.api.getDefaultMedia();
          if (media.state === 'paused') {
            setTimeout(() => {
              if (this.api) {
                this.api.play();
                setTimeout(() => {
                  if (this.api && media.canPlay) {
                    this.api.pause();
                  }
                }, 200);
              }
            }, 500);
          }
        }
      }
    );
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

          if (movie.videoUrl && movie.videoUrl.includes('youtube')) {
            this.prepareYoutubeUrl(movie.videoUrl);
          }
        },
        error: (err) => {
          console.error('Error fetching movie for playback', err);
          this.error = true;
          this.loading = false;
        }
      });
  }

  prepareYoutubeUrl(url: string): void {
    let videoId = '';

    if (url.includes('youtube.com/watch')) {
      videoId = new URL(url).searchParams.get('v') || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }

    if (videoId) {
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      this.youtubeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }
  }

  goBack(): void {
    this.location.back();
  }

  seekTo(seconds: number): void {
    if (this.api) {
      this.api.seekTime(seconds);
    }
  }

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

  isUsingLocalVideo(): boolean {
    return !!(this.movie && this.movie.videoUploadFile_url);
  }

  isUsingYoutubeVideo(): boolean {
    return !!(this.movie && this.movie.videoUrl && this.youtubeVideoUrl);
  }

  getFullMediaUrl(path: string | null): string {
    if (!path) return '';
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${this.mediaBaseUrl}/${cleanPath}`;
  }


}