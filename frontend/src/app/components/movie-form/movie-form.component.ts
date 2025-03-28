import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MovieService } from '../../services/movie.service';
import { Movie } from '../../models/movie.model';
import { Location } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-movie-form',
  templateUrl: './movie-form.component.html',
  styleUrls: ['./movie-form.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,
    //  RouterLink
  ]
})
export class MovieFormComponent implements OnInit {
  movieForm!: FormGroup;
  isEditMode = false;
  movieId: number | null = null;
  loading = false;
  submitting = false;
  posterPreview: string | null = null;

  // Predefined list of common movie genres
  genreOptions: string[] = [
    'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime',
    'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror',
    'Music', 'Musical', 'Mystery', 'Romance', 'Sci-Fi', 'Sport',
    'Thriller', 'War', 'Western'
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private movieService: MovieService,
    private location: Location,
    private notificationService: NotificationService
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
      releaseDate: ['', [Validators.required, Validators.maxLength(50)]], // New field with validation
      director: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      genre: this.fb.array([], [Validators.required, Validators.minLength(1)]),
      duration: ['', [Validators.required, Validators.min(1), Validators.max(600)]],
      rating: ['', [Validators.required, Validators.min(0), Validators.max(10)]],
      posterUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      videoUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]]
    });

    // Update poster preview when URL changes
    this.movieForm.get('posterUrl')?.valueChanges.subscribe(url => {
      if (url && this.isValidUrl(url)) {
        this.posterPreview = url;
      } else {
        this.posterPreview = null;
      }
    });
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

    // Update form values
    this.movieForm.patchValue({
      title: movie.title,
      description: movie.description,
      releaseYear: movie.releaseYear,
      releaseDate: movie.releaseDate, // Update with release date value
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
    if (this.movieForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.movieForm.controls).forEach(key => {
        const control = this.movieForm.get(key);
        control?.markAsTouched();
      });
      this.notificationService.warning('Please fix the validation errors before submitting.');
      return;
    }

    const movieData: Movie = this.movieForm.value;
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
}