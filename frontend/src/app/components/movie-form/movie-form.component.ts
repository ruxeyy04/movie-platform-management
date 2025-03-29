import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MovieService } from '../../services/movie.service';
import { Movie } from '../../models/movie.model';
import { Location } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule, MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

// Custom date formats to match Netflix style
export const NETFLIX_DATE_FORMATS = {
  parse: {
    dateInput: 'MM/DD/YYYY',
  },
  display: {
    dateInput: 'MM/DD/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-movie-form',
  templateUrl: './movie-form.component.html',
  styleUrls: ['./movie-form.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatIconModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: NETFLIX_DATE_FORMATS }
  ]
})
export class MovieFormComponent implements OnInit {
  movieForm!: FormGroup;
  isEditMode = false;
  movieId: number | null = null;
  loading = false;
  submitting = false;
  posterPreview: string | null = null;
  isComingSoon = false;
  maxDate: Date = new Date(new Date().getFullYear() + 5, 11, 31); // Max date 5 years from now

  // File upload states
  usePosterUrl = true;
  useVideoUrl = true;
  posterFile: File | null = null;
  videoFile: File | null = null;
  posterFilePreview: SafeUrl | null = null;
  videoFileName: string | null = null;

  // File upload error states
  posterSizeError = false;
  videoSizeError = false;

  // Predefined list of common movie genres
  genreOptions: string[] = [
    'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime',
    'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror',
    'Music', 'Musical', 'Mystery', 'Romance', 'Sci-Fi', 'Sport',
    'Thriller', 'War', 'Western'
  ];

  // Set file size limits (in bytes)
  readonly MAX_POSTER_SIZE = 5 * 1024 * 1024; // 5MB
  readonly MAX_VIDEO_SIZE = 1024 * 1024 * 1024; // 100MB

  // File size formatting helper
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private movieService: MovieService,
    private location: Location,
    private notificationService: NotificationService,
    private sanitizer: DomSanitizer
  ) { }
  ngOnInit(): void {
    this.initForm();

    // Check if we're in edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.movieId = Number(id);
      this.loadMovie(this.movieId);
    }
  }

  initForm(): void {
    this.movieForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      releaseYear: ['', [Validators.required, Validators.min(1888), Validators.max(this.getCurrentYear() + 5)]],
      releaseDate: [null, [Validators.required]], // Date field
      director: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      genre: this.fb.array([], [Validators.required, Validators.minLength(1)]),
      duration: ['', [Validators.required, Validators.min(1), Validators.max(600)]],
      rating: ['', [Validators.required, Validators.min(0), Validators.max(10)]],
      posterUrl: [''],
      videoUrl: ['']
    });

    // Set validators based on URL/file choice
    this.updatePosterValidators();
    this.updateVideoValidators();

    // Update poster preview when URL changes
    this.movieForm.get('posterUrl')?.valueChanges.subscribe(url => {
      if (this.usePosterUrl && url && this.isValidUrl(url)) {
        this.posterPreview = url;
      } else if (this.usePosterUrl) {
        this.posterPreview = null;
      }
    });
  }

  updatePosterValidators(): void {
    const posterUrlControl = this.movieForm.get('posterUrl');

    if (this.usePosterUrl) {
      posterUrlControl?.setValidators([Validators.required, Validators.pattern(/^https?:\/\/.+/)]);
    } else {
      posterUrlControl?.clearValidators();
    }

    posterUrlControl?.updateValueAndValidity();
  }

  updateVideoValidators(): void {
    const videoUrlControl = this.movieForm.get('videoUrl');

    if (this.useVideoUrl) {
      videoUrlControl?.setValidators([Validators.required, Validators.pattern(/^https?:\/\/.+/)]);
    } else {
      videoUrlControl?.clearValidators();
    }

    videoUrlControl?.updateValueAndValidity();
  }

  onPosterInputTypeChange(useUrl: boolean): void {
    this.usePosterUrl = useUrl;
    this.updatePosterValidators();
    this.posterSizeError = false; // Reset error state when switching input types

    // Clear opposite input
    if (useUrl) {
      this.posterFile = null;
      this.posterFilePreview = null;
    } else {
      this.movieForm.get('posterUrl')?.setValue('');
      this.posterPreview = null;
    }
  }

  onVideoInputTypeChange(useUrl: boolean): void {
    this.useVideoUrl = useUrl;
    this.updateVideoValidators();
    this.videoSizeError = false; // Reset error state when switching input types

    // Clear opposite input
    if (useUrl) {
      this.videoFile = null;
      this.videoFileName = null;
    } else {
      this.movieForm.get('videoUrl')?.setValue('');
    }
  }

  onPosterFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      this.posterSizeError = false; // Reset error state

      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        this.notificationService.error('Please select an image file for the poster');
        return;
      }

      // Check file size
      if (file.size > this.MAX_POSTER_SIZE) {
        this.posterSizeError = true; // Set error state
        this.notificationService.error(`File size exceeds the limit of ${this.formatFileSize(this.MAX_POSTER_SIZE)}. Your file is ${this.formatFileSize(file.size)}.`);
        // Reset the file input
        fileInput.value = '';
        return;
      }

      this.posterFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.posterFilePreview = this.sanitizer.bypassSecurityTrustUrl(reader.result as string);
        this.posterPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onVideoFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      this.videoSizeError = false; // Reset error state

      // Check if file is a video
      if (!file.type.startsWith('video/')) {
        this.notificationService.error('Please select a video file');
        return;
      }

      // Check file size
      if (file.size > this.MAX_VIDEO_SIZE) {
        this.videoSizeError = true; // Set error state
        this.notificationService.error(`File size exceeds the limit of ${this.formatFileSize(this.MAX_VIDEO_SIZE)}. Your file is ${this.formatFileSize(file.size)}.`);
        // Reset the file input
        fileInput.value = '';
        return;
      }

      this.videoFile = file;
      this.videoFileName = file.name;
    }
  }

  loadMovie(id: number): void {
    this.loading = true;
    this.movieService.getMovie(id).subscribe({
      next: (movie) => {
        this.updateForm(movie);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading movie', error);
        this.loading = false;
        alert('Failed to load movie details. Redirecting to movie list.');
        this.router.navigate(['/movies']);
      }
    });
  }

  updateForm(movie: Movie): void {
    // Reset genre FormArray
    const genreFormArray = this.movieForm.get('genre') as FormArray;
    while (genreFormArray.length) {
      genreFormArray.removeAt(0);
    }

    // Add each genre to the FormArray
    if (movie.genre) {
      movie.genre.forEach(genre => {
        genreFormArray.push(this.fb.control(genre));
      });
    }

    // Check if the movie has a release date, if not it's "Coming Soon"
    this.isComingSoon = movie.releaseDate === null;

    // If movie is coming soon, disable release date validation
    if (this.isComingSoon) {
      const releaseDateControl = this.movieForm.get('releaseDate');
      releaseDateControl?.clearValidators();
      releaseDateControl?.updateValueAndValidity();
    }

    // Prepare release date as Date object if it exists
    let releaseDate = null;
    if (movie.releaseDate && !this.isComingSoon) {
      releaseDate = new Date(movie.releaseDate);
    }

    // Update form values
    this.movieForm.patchValue({
      title: movie.title,
      description: movie.description,
      releaseYear: movie.releaseYear,
      releaseDate: releaseDate, // Now properly a Date object or null
      director: movie.director,
      duration: movie.duration,
      rating: movie.rating,
      posterUrl: movie.posterUrl,
      videoUrl: movie.videoUrl
    });

    // Update poster preview
    this.posterPreview = movie.posterUrl;
  }

  get genreArray(): FormArray {
    return this.movieForm.get('genre') as FormArray;
  }

  addGenre(genre: string): void {
    const genreArray = this.movieForm.get('genre') as FormArray;
    if (!genreArray.value.includes(genre) && genre.trim() !== '') {
      genreArray.push(this.fb.control(genre));
    }
  }

  removeGenre(index: number): void {
    const genreArray = this.movieForm.get('genre') as FormArray;
    genreArray.removeAt(index);
  }

  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }

  onSubmit(): void {
    if (this.movieForm.invalid || (!this.usePosterUrl && !this.posterFile) || (!this.useVideoUrl && !this.videoFile)) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.movieForm.controls).forEach(key => {
        const control = this.movieForm.get(key);
        control?.markAsTouched();
      });

      if (!this.usePosterUrl && !this.posterFile) {
        this.notificationService.warning('Please upload a poster image');
      }

      if (!this.useVideoUrl && !this.videoFile) {
        this.notificationService.warning('Please upload a video file');
      }

      this.notificationService.warning('Please fix the validation errors before submitting.');
      return;
    }

    // In a real application, you would upload the files to a server here
    // and get back URLs to use in your movie data
    // For this implementation, we'll simulate this by creating object URLs

    let posterUrlToUse = this.usePosterUrl ? this.movieForm.value.posterUrl : null;
    let videoUrlToUse = this.useVideoUrl ? this.movieForm.value.videoUrl : null;

    // In a real app, this would be an API call to upload files
    if (!this.usePosterUrl && this.posterFile) {
      // Simulate uploaded file URL - in a real app, you'd get this from your server
      posterUrlToUse = this.posterPreview;
    }

    if (!this.useVideoUrl && this.videoFile) {
      // Simulate uploaded file URL - in a real app, you'd get this from your server
      videoUrlToUse = `https://example.com/uploads/${this.videoFileName}`;
    }

    // Get the form values and prepare data for submission
    const formValues = this.movieForm.value;
    const movieData: Movie = {
      ...formValues,
      // Format the date if it exists and not in Coming Soon mode
      releaseDate: this.isComingSoon ? null : formValues.releaseDate,
      // Use the correct URLs based on input type
      posterUrl: posterUrlToUse,
      videoUrl: videoUrlToUse
    };

    this.submitting = true;

    if (this.isEditMode && this.movieId) {
      // Update existing movie
      this.movieService.updateMovie(this.movieId, movieData).subscribe({
        next: (updatedMovie) => {
          this.submitting = false;
          this.notificationService.success(`"${updatedMovie.title}" has been updated successfully.`);
          this.router.navigate(['/movies', updatedMovie.id]);
        },
        error: (error) => {
          console.error('Error updating movie', error);
          this.submitting = false;
          this.notificationService.error('Failed to update movie. Please try again.');
        }
      });
    } else {
      // Create new movie
      this.movieService.addMovie(movieData).subscribe({
        next: (newMovie) => {
          this.submitting = false;
          this.notificationService.success(`"${newMovie.title}" has been added successfully.`);
          this.router.navigate(['/movies', newMovie.id]);
        },
        error: (error) => {
          console.error('Error creating movie', error);
          this.submitting = false;
          this.notificationService.error('Failed to create movie. Please try again.');
        }
      });
    }
  }

  goBack(): void {
    this.location.back();
  }
  getCurrentYear(): number {
    return new Date().getFullYear();
  }
  // Add this method to MovieFormComponent to check if a genre is already selected
  isGenreSelected(genre: string): boolean {
    return this.genreArray.value.includes(genre);
  }

  // Handle Coming Soon toggle
  toggleComingSoon(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.isComingSoon = isChecked;

    const releaseDateControl = this.movieForm.get('releaseDate');

    if (isChecked) {
      // Coming soon is checked, so remove validation
      releaseDateControl?.clearValidators();
      releaseDateControl?.setValue(null);
    } else {
      // Coming soon is unchecked, so add validation back
      releaseDateControl?.setValidators([Validators.required]);
    }

    releaseDateControl?.updateValueAndValidity();
  }

  // Add method to get rating description based on rating value
  getRatingDescription(rating: number): string {
    if (rating >= 9) return 'Exceptional';
    if (rating >= 8) return 'Excellent';
    if (rating >= 7) return 'Very Good';
    if (rating >= 6) return 'Good';
    if (rating >= 5) return 'Average';
    if (rating >= 3) return 'Below Average';
    if (rating > 0) return 'Poor';
    return 'Not Rated';
  }
}