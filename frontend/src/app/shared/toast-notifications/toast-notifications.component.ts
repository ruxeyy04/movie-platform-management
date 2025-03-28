import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../services/notification.service';

interface NotificationWithState extends Notification {
  closing?: boolean;
}

@Component({
  selector: 'app-toast-notifications',
  templateUrl: './toast-notifications.component.html',
  styleUrls: ['./toast-notifications.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ToastNotificationsComponent implements OnInit, OnDestroy {
  notifications: NotificationWithState[] = [];
  private subscription: Subscription | null = null;

  constructor(private notificationService: NotificationService) { }

  ngOnInit(): void {
    // Subscribe to notifications once
    this.subscription = this.notificationService.notifications$.subscribe(
      notifications => {
        this.notifications = notifications;
      }
    );
  }

  ngOnDestroy(): void {
    // Clean up the subscription when component is destroyed
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'bi-check-circle-fill';
      case 'error': return 'bi-exclamation-circle-fill';
      case 'warning': return 'bi-exclamation-triangle-fill';
      case 'info': return 'bi-info-circle-fill';
      default: return 'bi-info-circle-fill';
    }
  }

  getToastClass(type: string, closing?: boolean): string {
    return `${type}${closing ? ' toast-closing' : ''}`;
  }

  dismiss(id: number): void {
    this.notificationService.animateThenRemove(id);
  }
}