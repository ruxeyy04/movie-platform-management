import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Movie } from '../../models/movie.model';
import { MovieService } from '../../services/movie.service';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { TimePipe } from '../../shared/pipes/time.pipe';

// Quality option interface
interface QualityOption {
  value: string;
  label: string;
  width: number;
  height: number;
}

@Component({
  selector: 'app-movie-player',
  templateUrl: './movie-player.component.html',
  styleUrls: ['./movie-player.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    TimePipe
  ]
})
export class MoviePlayerComponent implements OnInit, AfterViewInit {
  @ViewChild('videoPlayer') videoPlayerRef!: ElementRef<HTMLVideoElement>;

  movie: Movie | null = null;
  loading = true;
  error = false;
  youtubeVideoUrl: SafeResourceUrl | null = null;
  mediaBaseUrl = environment.MEDIA_URL;
  backendUrl = environment.BACKEND_URL;

  // Custom video player properties
  isPlaying: boolean = false;
  isMuted: boolean = false;
  isFullscreen: boolean = false;
  controlsVisible: boolean = true;
  speedOptionsVisible: boolean = false;
  controlsTimeoutId: any = null;
  isBuffering: boolean = false;

  // Video playback
  currentTime: number = 0;
  totalDuration: number = 0;
  progressPercent: number = 0;
  bufferedPercent: number = 0;
  volumeLevel: number = 100;
  currentPlaybackSpeed: number = 1.0;
  playbackSpeeds: number[] = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  // Quality options
  availableQualities: QualityOption[] = [
    { value: 'auto', label: 'Auto', width: 0, height: 0 },
    { value: '1080p', label: '1080p HD', width: 1920, height: 1080 },
    { value: '720p', label: '720p HD', width: 1280, height: 720 },
    { value: '480p', label: '480p', width: 854, height: 480 },
    { value: '360p', label: '360p', width: 640, height: 360 }
  ];
  currentQuality: string = 'auto';
  autoQualityLabel: string = '720p HD';
  qualityOptionsVisible: boolean = false;

  videoCurrentTime: number = 0;

  private videoElement!: HTMLVideoElement;
  private bufferingTimeoutId: any = null;

  constructor(
    private route: ActivatedRoute,
    private movieService: MovieService,
    private location: Location,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.getMovie();
  }

  ngAfterViewInit(): void {
    this.checkAndInitPlayer();
  }

  private checkAndInitPlayer(): void {
    if (this.videoPlayerRef?.nativeElement) {
      this.initVideoPlayer();
    } else {
      setTimeout(() => this.checkAndInitPlayer(), 100);
    }
  }

  initVideoPlayer(): void {
    if (this.videoPlayerRef?.nativeElement) {
      this.videoElement = this.videoPlayerRef.nativeElement;

      this.videoElement.volume = this.volumeLevel / 100;

      this.videoElement.addEventListener('play', () => {
        this.isPlaying = true;
        // console.log('Video playing');
      });

      this.videoElement.addEventListener('pause', () => {
        this.isPlaying = false;
        // console.log('Video paused');
      });

      this.videoElement.addEventListener('ended', () => {
        this.isPlaying = false;
        this.controlsVisible = true;
        // console.log('Video ended');
      });

      this.videoElement.addEventListener('loadedmetadata', () => {
        this.totalDuration = this.videoElement.duration;
        // console.log('Video metadata loaded, duration:', this.totalDuration);

        this.detectBestQuality();
      });

      this.videoElement.addEventListener('waiting', () => {
        this.onVideoBuffering(true);
      });

      this.videoElement.addEventListener('stalled', () => {
        this.onVideoBuffering(true);
      });

      this.videoElement.addEventListener('canplay', () => {
        this.onVideoBuffering(false);
      });

      this.videoElement.addEventListener('playing', () => {
        this.onVideoBuffering(false);
      });

      // Log that player is ready
      // console.log('Video player initialized');
    } else {
      // console.error('Video player element not found');
    }
  }

  // Handle video buffering state
  onVideoBuffering(isBuffering: boolean): void {
    // Use timeout to avoid flickering for very short buffering periods
    if (isBuffering) {
      if (this.bufferingTimeoutId) {
        clearTimeout(this.bufferingTimeoutId);
      }

      this.bufferingTimeoutId = setTimeout(() => {
        this.isBuffering = true;
        // console.log('Video is buffering');
      }, 300); // Show buffering indicator after 300ms of waiting
    } else {
      if (this.bufferingTimeoutId) {
        clearTimeout(this.bufferingTimeoutId);
        this.bufferingTimeoutId = null;
      }

      this.isBuffering = false;
      // console.log('Video buffering ended');
    }
  }

  // Detect the best quality based on screen size
  detectBestQuality(): void {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    for (const quality of this.availableQualities) {
      if (quality.value === 'auto') continue;

      if (screenWidth >= quality.width && screenHeight >= quality.height) {
        this.autoQualityLabel = quality.label;
        break;
      }
    }
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

          setTimeout(() => {
            this.checkAndInitPlayer();
          }, 300);
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

    let cleanPath = path.startsWith('/') ? path.substring(1) : path;

    if (cleanPath.includes('movie_videos')) {
      cleanPath = cleanPath.replace('/media/', '').replace('movie_videos', 'api/stream');
      return `${this.backendUrl}/${cleanPath}`;
    } else if (cleanPath.includes('movie_posters')) {
      return `${this.mediaBaseUrl}/${cleanPath}`;
    }

    return `${this.mediaBaseUrl}/${cleanPath}`;
  }
  getVideoSourceForQuality(): string {
    if (!this.movie || !this.movie.videoUploadFile_url) return '';

    const baseUrl = this.getFullMediaUrl(this.movie.videoUploadFile_url);

    if (this.currentQuality === 'auto') {
      return baseUrl;
    }
    return `${baseUrl}?quality=${this.currentQuality}`;
  }

  toggleQualityOptions(): void {
    this.qualityOptionsVisible = !this.qualityOptionsVisible;

    if (this.qualityOptionsVisible) {
      this.speedOptionsVisible = false;
    }
  }

  setVideoQuality(quality: string): void {
    if (this.currentQuality === quality) {
      this.qualityOptionsVisible = false;
      return;
    }

    if (this.videoElement) {
      this.videoCurrentTime = this.videoElement.currentTime;
      const wasPlaying = !this.videoElement.paused;

      this.onVideoBuffering(true);

      this.currentQuality = quality;

      setTimeout(() => {
        if (this.videoElement) {
          this.videoElement.currentTime = this.videoCurrentTime;

          if (wasPlaying) {
            this.videoElement.play();
          }
        }
      }, 100);
    } else {
      this.currentQuality = quality;
    }

    this.qualityOptionsVisible = false;
    // console.log('Quality changed to:', quality);
  }

  togglePlayPause(): void {
    // console.log('Toggle play/pause called');
    if (!this.videoElement) {
      console.error('Video element not available');
      this.checkAndInitPlayer();
      return;
    }

    try {
      if (this.videoElement.paused) {
        const playPromise = this.videoElement.play();
        if (playPromise) {
          playPromise
            .then(() => {
              this.isPlaying = true;
              // console.log('Video started playing');
            })
            .catch(error => {
              console.error('Error playing video:', error);
            });
        }
      } else {
        this.videoElement.pause();
        this.isPlaying = false;
        // console.log('Video paused');
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  }

  showControls(): void {
    this.controlsVisible = true;
    this.resetControlsTimeout();
  }

  hideControlsWithDelay(): void {
    this.resetControlsTimeout();
    this.controlsTimeoutId = setTimeout(() => {
      if (this.isPlaying) {
        this.controlsVisible = false;
      }
    }, 3000);
  }

  resetControlsTimeout(): void {
    if (this.controlsTimeoutId) {
      clearTimeout(this.controlsTimeoutId);
    }
  }

  onTimeUpdate(): void {
    if (!this.videoElement) return;

    this.currentTime = this.videoElement.currentTime;
    this.totalDuration = this.videoElement.duration || 0;
    this.progressPercent = this.totalDuration > 0 ? (this.currentTime / this.totalDuration) * 100 : 0;

    if (this.videoElement.buffered && this.videoElement.buffered.length > 0) {
      const bufferedEnd = this.videoElement.buffered.end(this.videoElement.buffered.length - 1);
      this.bufferedPercent = (bufferedEnd / this.totalDuration) * 100;
    }
  }

  onVideoLoaded(): void {
    if (!this.videoElement) {
      this.checkAndInitPlayer();
      return;
    }

    this.totalDuration = this.videoElement.duration;
    // console.log('Video loaded, duration:', this.totalDuration);
  }

  onVideoEnded(): void {
    this.isPlaying = false;
    this.controlsVisible = true;
  }
  onProgressBarClick(event: MouseEvent): void {
    if (!this.videoElement) {
      console.error('Video element not available for seeking');
      return;
    }

    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (event.clientX - rect.left) / rect.width;
    const seekTo = clickPosition * this.totalDuration;

    try {
      this.onVideoBuffering(true);

      this.videoElement.currentTime = seekTo;
      // console.log('Clicked on progress bar. Seeking to:', seekTo);
    } catch (error) {
      console.error('Error seeking via progress bar click:', error);
    }
  }

  onSeekBarInput(event: Event): void {
    if (!this.videoElement) {
      console.error('Video element not available for seeking');
      return;
    }

    const input = event.target as HTMLInputElement;
    const seekTo = (parseFloat(input.value) / 100) * this.totalDuration;
    try {
      this.onVideoBuffering(true);

      this.videoElement.currentTime = seekTo;
      // console.log('Seeking to:', seekTo);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  }

  toggleMute(): void {
    if (!this.videoElement) return;

    this.isMuted = !this.isMuted;
    this.videoElement.muted = this.isMuted;
    // console.log('Mute toggled:', this.isMuted);
  }

  onVolumeChange(event: Event): void {
    if (!this.videoElement) return;

    const input = event.target as HTMLInputElement;
    this.volumeLevel = parseFloat(input.value);
    this.videoElement.volume = this.volumeLevel / 100;

    if (this.volumeLevel > 0 && this.isMuted) {
      this.isMuted = false;
      this.videoElement.muted = false;
    }

    // console.log('Volume changed to:', this.volumeLevel);
  }

  toggleSpeedOptions(): void {
    this.speedOptionsVisible = !this.speedOptionsVisible;

    if (this.speedOptionsVisible) {
      this.qualityOptionsVisible = false;
    }
  }

  setPlaybackSpeed(speed: number): void {
    if (!this.videoElement) return;

    this.currentPlaybackSpeed = speed;
    this.videoElement.playbackRate = speed;
    this.speedOptionsVisible = false;
    // console.log('Playback speed set to:', speed);
  }

  skipBackward(): void {
    if (!this.videoElement) return;

    const newTime = Math.max(0, this.videoElement.currentTime - 10);

    this.onVideoBuffering(true);

    this.videoElement.currentTime = newTime;
    // console.log('Skipped backward to:', newTime);
  }

  skipForward(): void {
    if (!this.videoElement) return;

    const newTime = Math.min(this.totalDuration, this.videoElement.currentTime + 10);

    this.onVideoBuffering(true);

    this.videoElement.currentTime = newTime;
    // console.log('Skipped forward to:', newTime);
  }

  toggleFullscreen(): void {
    if (!this.videoElement) return;

    const container = this.videoElement.closest('.video-wrapper') as HTMLElement;
    if (!container) return;

    try {
      if (!this.isFullscreen) {
        if (container.requestFullscreen) {
          container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          (container as any).webkitRequestFullscreen();
        } else if ((container as any).msRequestFullscreen) {
          (container as any).msRequestFullscreen();
        }
        this.isFullscreen = true;
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
        this.isFullscreen = false;
      }
      // console.log('Fullscreen toggled:', this.isFullscreen);
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  }

  @HostListener('document:fullscreenchange')
  @HostListener('document:webkitfullscreenchange')
  @HostListener('document:mozfullscreenchange')
  @HostListener('document:MSFullscreenChange')
  onFullscreenChange(): void {
    this.isFullscreen = !!document.fullscreenElement;
  }
}