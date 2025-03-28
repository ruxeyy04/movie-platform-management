import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    closing?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private _notifications = new BehaviorSubject<Notification[]>([]);
    private counter = 0;

    get notifications$() {
        return this._notifications.asObservable();
    }

    success(message: string): void {
        this.show(message, 'success');
    }

    error(message: string): void {
        this.show(message, 'error');
    }

    info(message: string): void {
        this.show(message, 'info');
    }

    warning(message: string): void {
        this.show(message, 'warning');
    }

    private show(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
        const id = this.counter++;

        // Add the notification
        const currentNotifications = this._notifications.value;
        const newNotifications = [...currentNotifications, { id, message, type }];
        this._notifications.next(newNotifications);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            this.animateThenRemove(id);
        }, 5000);
    }

    // Start the removal animation
    animateThenRemove(id: number): void {
        const currentNotifications = this._notifications.value;
        const index = currentNotifications.findIndex(notification => notification.id === id);

        if (index !== -1) {
            // Set the closing state to trigger animation
            const updatedNotifications = [...currentNotifications];
            updatedNotifications[index] = {
                ...updatedNotifications[index],
                closing: true
            };
            this._notifications.next(updatedNotifications);

            // Remove after animation completes
            setTimeout(() => {
                this.remove(id);
            }, 300); // Match animation duration
        }
    }

    // Actually remove the notification
    remove(id: number): void {
        const currentNotifications = this._notifications.value;
        const newNotifications = currentNotifications.filter(notification => notification.id !== id);
        this._notifications.next(newNotifications);
    }
}