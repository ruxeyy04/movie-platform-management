import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule, isPlatformBrowser } from '@angular/common';

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

  constructor(@Inject(PLATFORM_ID) private platformId: object, private router: Router) {
    // Check if running in the browser
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.onWindowScroll();

    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(value => {
        console.log('Search query:', value);
        // Implement search functionality here
      });
  }

  ngOnDestroy(): void {
    // No need for explicit event handler cleanup with @HostListener
  }

  toggleSearch(): void {
    this.searchActive = !this.searchActive;
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (!this.isBrowser) return;

    this.isScrolled = window.scrollY > 20;
  }

  handleSearch(event: Event): void {
    event.preventDefault();
    const query = this.searchControl.value;
    console.log('Search submitted:', query);
    // Implement search functionality here

    if (query) {
      // Navigate to search results or filter current view
      this.searchActive = false;
    }
  }

  goToHome(): void {
    this.router.navigate(['/']);
    this.showMobileMenu = false;
  }
}
