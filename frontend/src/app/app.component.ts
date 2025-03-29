import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { ToastNotificationsComponent } from './shared/toast-notifications/toast-notifications.component';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  template: `
    <div class="container-fluid p-0 d-flex flex-column min-vh-100">
      <app-header></app-header>
      <main class="container py-4 flex-grow-1">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
      <app-toast-notifications></app-toast-notifications>
    </div>
  `,
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    ToastNotificationsComponent
  ]
})
export class AppComponent implements OnInit {
  title = 'MovieFlix';

  constructor(
    private router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.notificationService.success('Welcome to MovieFlix! Browse our collection of movies.');

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      window.scrollTo(0, 0);
    });
  }
}