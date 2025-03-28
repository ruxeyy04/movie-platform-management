import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
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
  title = 'Movie Theater';
  searchControl = new FormControl('');
  searchActive = false;
  showMobileMenu = false;
  isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: object, private router: Router) {
    // Check if running in the browser
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      window.addEventListener('scroll', this.onWindowScroll.bind(this));
    }

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
    if (this.isBrowser) {
      window.removeEventListener('scroll', this.onWindowScroll.bind(this));
    }
  }

  toggleSearch(): void {
    this.searchActive = !this.searchActive;
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  onWindowScroll(): void {
    if (!this.isBrowser) return;

    const header = document.querySelector('.netflix-header');
    if (header) {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  }

  handleSearch(event: Event): void {
    event.preventDefault();
    const query = this.searchControl.value;
    console.log('Search submitted:', query);
    // Implement search functionality here
  }
  goToHome(): void {
    this.router.navigate(['/']);
  }
}
