import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MovieService } from '../../services/movie.service';
import { Movie } from '../../models/movie.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ReactiveFormsModule]
})
export class HeaderComponent implements OnInit, OnDestroy {
  title = 'MovieFlix';
  searchControl = new FormControl('');
  searchActive = false;
  showMobileMenu = false;
  isBrowser: boolean;
  isScrolled = false;

  // Search suggestions
  suggestions: Movie[] = [];
  showSuggestions = false;
  searchLoading = false;
  private searchSubscription: Subscription | null = null;
  private routeSubscription: Subscription | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private router: Router,
    private movieService: MovieService
  ) {
    // Check if running in the browser
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.onWindowScroll();

    // Set up search input with debounce
    this.searchSubscription = this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter(value => !!value && value.length >= 2), // Only search if at least 2 characters
        switchMap(value => {
          this.searchLoading = true; // Show loading indicator
          return this.movieService.getSearchSuggestions(value || '');
        })
      )
      .subscribe({
        next: (results) => {
          this.suggestions = results;
          this.showSuggestions = results.length > 0;
          this.searchLoading = false; // Hide loading indicator
        },
        error: (error) => {
          console.error('Error fetching search suggestions:', error);
          this.searchLoading = false; // Hide loading indicator on error
        }
      });

    // Listen for route changes to update the search control value
    this.routeSubscription = this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const searchParam = urlParams.get('search');

        if (searchParam) {
          this.searchControl.setValue(searchParam, { emitEvent: false });
        } else if (!this.router.url.includes('/movies?search=')) {
          // Only clear if we're not on a search page
          this.searchControl.setValue('', { emitEvent: false });
        }
      });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }

    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  toggleSearch(): void {
    this.searchActive = !this.searchActive;
    if (this.searchActive) {
      setTimeout(() => {
        const searchInput = document.querySelector('.search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    } else {
      this.showSuggestions = false;
    }
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;

    // When opening mobile menu, focus the search input after a short delay
    if (this.showMobileMenu) {
      setTimeout(() => {
        const mobileSearchInput = document.querySelector('.mobile-search-form input') as HTMLInputElement;
        if (mobileSearchInput) {
          // Clear any existing value
          this.searchControl.setValue('', { emitEvent: false });
          this.suggestions = [];
          this.showSuggestions = false;
        }
      }, 300);
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (!this.isBrowser) return;

    this.isScrolled = window.scrollY > 20;
  }

  @HostListener('window:keydown.enter')
  onEnterKeyPressed(): void {
    if (this.searchControl.value) {
      this.handleSearch(new Event('submit'));
    }
  }

  handleSearch(event: Event): void {
    event.preventDefault();
    const query = this.searchControl.value;

    if (query) {
      this.searchLoading = true; // Show loading indicator

      // Navigate to movies page with search query
      this.router.navigate(['/movies'], { queryParams: { search: query } })
        .then(() => {
          // Hide indicators after navigation completes
          this.searchActive = false;
          this.showSuggestions = false;
          this.searchLoading = false;
        })
        .catch(error => {
          console.error('Navigation error:', error);
          this.searchLoading = false;
        });
    }
  }

  onSearchFocus(): void {
    if (this.searchControl.value && this.suggestions.length > 0) {
      this.showSuggestions = true;
    }
  }

  onSearchBlur(): void {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  onSearchInput(): void {
    const query = this.searchControl.value;
    if (!query) {
      this.showSuggestions = false;
      this.suggestions = [];
    }
  }

  goToMovieDetails(movie: Movie): void {
    if (movie && movie.id) {
      this.router.navigate(['/movies', movie.id]);
      this.searchActive = false;
      this.showSuggestions = false;
      this.searchControl.setValue('');
    }
  }

  goToHome(): void {
    this.router.navigate(['/']);
    this.showMobileMenu = false;
  }
}
