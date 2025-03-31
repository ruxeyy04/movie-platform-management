import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'time',
    standalone: true
})
export class TimePipe implements PipeTransform {
    transform(value: number): string {
        if (!value && value !== 0) return '00:00';

        const hours = Math.floor(value / 3600);
        const minutes = Math.floor((value % 3600) / 60);
        const seconds = Math.floor(value % 60);

        if (hours > 0) {
            const hoursStr = `${hours}`;
            const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
            const secondsStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
            return `${hoursStr}:${minutesStr}:${secondsStr}`;
        } else {
            // Format: MM:SS
            const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
            const secondsStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
            return `${minutesStr}:${secondsStr}`;
        }
    }
} 