import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Movie } from '../../models/movie.model';
import { MovieService } from '../../services/movie.service';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { TimePipe } from '../../shared/pipes/time.pipe';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
// Quality option interface
interface QualityOption {
  value: string;
  label: string;
  width: number;
  height: number;
}

// Subtitle interface
interface Subtitle {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
}

// Subtitle font option interface
interface SubtitleFontOption {
  value: string;
  label: string;
}

// Subtitle size option interface
interface SubtitleSizeOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-movie-player',
  templateUrl: './movie-player.component.html',
  styleUrls: ['./movie-player.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    TimePipe,
    FormsModule
  ]
})
export class MoviePlayerComponent implements OnInit, AfterViewInit {
  @ViewChild('videoPlayer') videoPlayerRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('subtitleTrack') subtitleTrackRef!: ElementRef<HTMLTrackElement>;

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

  // Subtitle options
  subtitles: Subtitle[] = [];
  currentSubtitleText: string = '';
  subtitleFile: File | null = null;
  subtitleVisible: boolean = true;
  subtitleOptionsVisible: boolean = false;
  subtitleDelayMs: number = 0;
  subtitleLoaded: boolean = false;
  subtitleFileName: string = '';

  // Subtitle font options
  subtitleFontOptions: SubtitleFontOption[] = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Courier New', label: 'Courier New' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Verdana', label: 'Verdana' }
  ];
  currentSubtitleFont: string = 'Arial';

  // Subtitle size options
  subtitleSizeOptions: SubtitleSizeOption[] = [
    { value: '12px', label: 'Small' },
    { value: '16px', label: 'Medium' },
    { value: '20px', label: 'Large' },
    { value: '24px', label: 'X-Large' },
    { value: '28px', label: 'XX-Large' },
    { value: '46px', label: 'XXX-Large' }
  ];
  currentSubtitleSize: string = '20px';

  // Subtitle color
  currentSubtitleColor: string = '#FFFFFF';

  // Subtitle background
  currentSubtitleBgColor: string = 'rgba(0, 0, 0, 0.5)';
  subtitleBgEnabled: boolean = true;

  videoCurrentTime: number = 0;

  private videoElement!: HTMLVideoElement;
  private bufferingTimeoutId: any = null;

  constructor(
    private route: ActivatedRoute,
    private movieService: MovieService,
    private location: Location,
    private sanitizer: DomSanitizer,
    private notificationService: NotificationService
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
    if (this.videoElement) {
      this.currentTime = this.videoElement.currentTime;
      this.progressPercent = (this.currentTime / this.totalDuration) * 100;

      // Update buffered amount
      if (this.videoElement.buffered.length > 0) {
        const bufferedEnd = this.videoElement.buffered.end(this.videoElement.buffered.length - 1);
        this.bufferedPercent = (bufferedEnd / this.totalDuration) * 100;
      }

      // Update subtitle text based on current time
      this.updateCurrentSubtitle();
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
  formatDate(dateString: string | Date | null): string {
    if (!dateString) {
      return 'Coming Soon';
    }

    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  // Subtitle methods
  toggleSubtitleOptions(): void {
    this.subtitleOptionsVisible = !this.subtitleOptionsVisible;
    this.speedOptionsVisible = false;
    this.qualityOptionsVisible = false;
    this.resetControlsTimeout();
  }

  toggleSubtitleVisibility(): void {
    // console.log('toggleSubtitleVisibility called, current value:', this.subtitleVisible);
    this.subtitleVisible = !this.subtitleVisible;
    // console.log('New subtitle visibility:', this.subtitleVisible);

    if (this.subtitleVisible && this.subtitles.length > 0) {
      // Force update subtitle display
      this.updateCurrentSubtitle();
      // console.log('Updated subtitle text to:', this.currentSubtitleText);
    } else {
      this.currentSubtitleText = '';
      // console.log('Cleared subtitle text');
    }

    this.resetControlsTimeout();
  }

  onSubtitleFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      this.subtitleFile = fileInput.files[0];
      this.subtitleFileName = this.subtitleFile.name;
      this.parseSrtFile(this.subtitleFile);
    }
  }

  parseSrtFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = reader.result as string;
      this.subtitles = this.parseSrt(content);
      this.subtitleLoaded = this.subtitles.length > 0;
      // console.log(`Parsed ${this.subtitles.length} subtitle entries from ${file.name}`);

      // Show initial subtitle based on current time
      this.updateCurrentSubtitle();

      // Display a feedback message
      if (this.subtitleLoaded) {
        this.notificationService.success(`Successfully loaded ${this.subtitles.length} subtitle entries from ${file.name}`);
      } else {
        this.notificationService.error('Failed to load subtitles. Please check the format of your .srt file.');
      }
    };
    reader.readAsText(file);
  }

  parseSrt(srtContent: string): Subtitle[] {
    const subtitles: Subtitle[] = [];
    const blocks = srtContent.replace(/\r/g, '').split('\n\n');

    // console.log(`Found ${blocks.length} subtitle blocks to parse`);

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i].trim();
      if (!block) continue;

      const lines = block.split('\n');
      if (lines.length < 3) continue;

      const idLine = lines[0].trim();
      const timeLine = lines[1].trim();
      const textLines = lines.slice(2);

      const id = parseInt(idLine);
      if (isNaN(id)) continue;

      const timeMatch = timeLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s+-->\s+(\d{2}):(\d{2}):(\d{2}),(\d{3})/);

      if (timeMatch) {
        const startHours = parseInt(timeMatch[1]);
        const startMinutes = parseInt(timeMatch[2]);
        const startSeconds = parseInt(timeMatch[3]);
        const startMilliseconds = parseInt(timeMatch[4]);

        const endHours = parseInt(timeMatch[5]);
        const endMinutes = parseInt(timeMatch[6]);
        const endSeconds = parseInt(timeMatch[7]);
        const endMilliseconds = parseInt(timeMatch[8]);

        const startTime = startHours * 3600 + startMinutes * 60 + startSeconds + startMilliseconds / 1000;
        const endTime = endHours * 3600 + endMinutes * 60 + endSeconds + endMilliseconds / 1000;

        const text = textLines.join(' ').trim();

        subtitles.push({
          id,
          startTime,
          endTime,
          text
        });
      } else {
        // console.warn(`Could not parse timing in subtitle block ${i + 1}: ${timeLine}`);
      }
    }

    // Sort subtitles by start time
    subtitles.sort((a, b) => a.startTime - b.startTime);

    return subtitles;
  }

  timeToSeconds(timeString: string): number {
    try {
      const [time, ms] = timeString.split(',');
      const [hours, minutes, seconds] = time.split(':').map(Number);
      return hours * 3600 + minutes * 60 + seconds + parseInt(ms) / 1000;
    } catch (error) {
      console.error('Error parsing time string:', timeString, error);
      return 0;
    }
  }

  updateCurrentSubtitle(): void {
    if (!this.subtitleVisible || this.subtitles.length === 0) {
      this.currentSubtitleText = '';
      return;
    }

    const currentTimeWithDelay = this.currentTime + (this.subtitleDelayMs / 1000);
    let found = false;

    // console.log(`Looking for subtitle at time: ${currentTimeWithDelay}s, with ${this.subtitles.length} subtitles loaded`);

    for (const subtitle of this.subtitles) {
      if (currentTimeWithDelay >= subtitle.startTime && currentTimeWithDelay <= subtitle.endTime) {
        this.currentSubtitleText = subtitle.text;
        found = true;
        // console.log(`Found subtitle: "${subtitle.text}" (${subtitle.startTime}s - ${subtitle.endTime}s)`);
        break;
      }
    }

    if (!found) {
      this.currentSubtitleText = '';
    }
  }

  setSubtitleFont(font: string): void {
    this.currentSubtitleFont = font;
  }

  setSubtitleSize(size: string): void {
    this.currentSubtitleSize = size;
  }

  setSubtitleColor(color: string): void {
    this.currentSubtitleColor = color;
  }

  setSubtitleBgColor(color: string): void {
    this.currentSubtitleBgColor = color;
  }

  handleSubtitleFontChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.setSubtitleFont(selectElement.value);
  }

  handleSubtitleSizeChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.setSubtitleSize(selectElement.value);
  }

  handleSubtitleColorChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.setSubtitleColor(inputElement.value);
  }

  handleSubtitleBgColorChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.setSubtitleBgColor(inputElement.value);
  }

  toggleSubtitleBackground(): void {
    this.subtitleBgEnabled = !this.subtitleBgEnabled;
  }

  adjustSubtitleDelay(milliseconds: number): void {
    this.subtitleDelayMs += milliseconds;
  }

  getSubtitleStyle(): any {
    return {
      'font-family': this.currentSubtitleFont,
      'font-size': this.currentSubtitleSize,
      'color': this.currentSubtitleColor,
      'background-color': this.subtitleBgEnabled ? this.currentSubtitleBgColor : 'transparent',
      'padding': this.subtitleBgEnabled ? '5px 10px' : '0',
      'border-radius': this.subtitleBgEnabled ? '4px' : '0'
    };
  }

  // // Test function to display a subtitle at any time
  // testSubtitleDisplay(): void {
  //   if (this.subtitles.length === 0) {
  //     // Create a test subtitle if none loaded
  //     this.subtitles = [
  //       {
  //         id: 1,
  //         startTime: 0,
  //         endTime: 9999,
  //         text: 'Test subtitle - If you can see this, subtitles are working!'
  //       }
  //     ];
  //     this.subtitleLoaded = true;
  //     this.subtitleVisible = true;
  //     this.currentSubtitleText = this.subtitles[0].text;
  //     console.log('Test subtitle created and displayed');

  //     // Reset after 5 seconds
  //     setTimeout(() => {
  //       if (this.subtitles.length === 1 && this.subtitles[0].text.includes('Test subtitle')) {
  //         this.subtitles = [];
  //         this.subtitleLoaded = false;
  //         this.currentSubtitleText = '';
  //       }
  //     }, 5000);
  //   }
  // }

  // // Force subtitle visibility on/off
  // forceSubtitleVisibility(visible: boolean): void {
  //   console.log(`Forcing subtitle visibility: ${visible}`);
  //   this.subtitleVisible = visible;

  //   if (this.subtitleVisible && this.subtitles.length > 0) {
  //     this.updateCurrentSubtitle();
  //   } else {
  //     this.currentSubtitleText = '';
  //   }
  // }

  // // Create an example subtitle for testing
  // createExampleSubtitle(): void {
  //   // Create a simple subtitle file with entries spanning the video duration
  //   if (this.totalDuration > 0) {
  //     const segmentLength = 10; // Each subtitle lasts 10 seconds
  //     const subtitles: Subtitle[] = [];

  //     for (let i = 0; i < Math.floor(this.totalDuration / segmentLength); i++) {
  //       const startTime = i * segmentLength;
  //       const endTime = (i + 1) * segmentLength;

  //       subtitles.push({
  //         id: i + 1,
  //         startTime: startTime,
  //         endTime: endTime,
  //         text: `Example subtitle #${i + 1} (${startTime}s - ${endTime}s)`
  //       });
  //     }

  //     this.subtitles = subtitles;
  //     this.subtitleLoaded = true;
  //     this.subtitleFileName = 'example-subtitle.srt';
  //     this.subtitleVisible = true;
  //     this.updateCurrentSubtitle();

  //     this.notificationService.success(`Created ${subtitles.length} example subtitles for testing`);
  //   } else {
  //     this.notificationService.error('Cannot create example subtitles until video is loaded');
  //   }
  // }
}