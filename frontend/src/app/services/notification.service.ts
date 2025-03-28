import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
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
            this.remove(id);
        }, 5000);
    }

    remove(id: number): void {
        const currentNotifications = this._notifications.value;
        const newNotifications = currentNotifications.filter(notification => notification.id !== id);
        this._notifications.next(newNotifications);
    }
}