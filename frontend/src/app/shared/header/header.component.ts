import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ReactiveFormsModule]
})
export class HeaderComponent implements OnInit {
  title = 'Movie Theater';
  searchControl = new FormControl('');
  showMobileMenu = false;

  constructor(private router: Router) { }

  ngOnInit(): void {
    // In a real application, we would implement search functionality
    // This is a placeholder for demonstration purposes
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

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  handleSearch(event: Event): void {
    event.preventDefault();
    const query = this.searchControl.value;
    console.log('Search submitted:', query);
    // In a real application, we would navigate to search results
    // For demonstration, just log the query
  }
}