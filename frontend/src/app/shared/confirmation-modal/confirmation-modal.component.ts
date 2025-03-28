import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ConfirmationModalComponent {
  @Input() title: string = 'Confirm Action';
  @Input() message: string = 'Are you sure you want to proceed?';
  @Input() confirmButtonText: string = 'Confirm';
  @Input() cancelButtonText: string = 'Cancel';
  @Input() confirmButtonClass: string = 'btn-danger';
  @Input() showModal: boolean = false;

  isClosing: boolean = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.startCloseAnimation();
    setTimeout(() => {
      this.confirm.emit();
      this.showModal = false;
      this.isClosing = false;
    }, 300); // Match animation duration
  }

  onCancel(): void {
    this.startCloseAnimation();
    setTimeout(() => {
      this.cancel.emit();
      this.showModal = false;
      this.isClosing = false;
    }, 300); // Match animation duration
  }

  private startCloseAnimation(): void {
    this.isClosing = true;
  }
}