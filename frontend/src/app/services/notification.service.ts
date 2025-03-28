import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    timeout?: number;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private notifications = new BehaviorSubject<Notification[]>([]);
    private counter = 0;

    constructor() { }

    getNotifications(): Observable<Notification[]> {
        return this.notifications.asObservable();
    }

    success(message: string, timeout: number = 5000): void {
        this.addNotification({
            id: this.counter++,
            message,
            type: 'success',
            timeout
        });
    }

    error(message: string, timeout: number = 5000): void {
        this.addNotification({
            id: this.counter++,
            message,
            type: 'error',
            timeout
        });
    }

    info(message: string, timeout: number = 5000): void {
        this.addNotification({
            id: this.counter++,
            message,
            type: 'info',
            timeout
        });
    }

    warning(message: string, timeout: number = 5000): void {
        this.addNotification({
            id: this.counter++,
            message,
            type: 'warning',
            timeout
        });
    }

    private addNotification(notification: Notification): void {
        const current = this.notifications.value;
        const updated = [...current, notification];
        this.notifications.next(updated);

        if (notification.timeout) {
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, notification.timeout);
        }
    }

    removeNotification(id: number): void {
        const current = this.notifications.value;
        const updated = current.filter(notification => notification.id !== id);
        this.notifications.next(updated);
    }
}