import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-header">
        <mat-icon class="warn-icon">warning</mat-icon>
        <h2 mat-dialog-title>{{ title }}</h2>
      </div>
      
      <div mat-dialog-content class="dialog-content">
        <p>{{ message }}</p>
      </div>
      
      <div mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="warn" (click)="onConfirm()">
          {{ confirmText }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog { min-width: 300px; max-width: 500px; }
    .dialog-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
    .warn-icon { color: #f44336; font-size: 32px; width: 32px; height: 32px; }
    .dialog-header h2 { margin: 0; font-size: 1.5rem; font-weight: 600; }
    .dialog-content { margin-bottom: 24px; }
    .dialog-content p { margin: 0; color: #666; font-size: 1rem; line-height: 1.5; }
    .dialog-actions { display: flex; gap: 12px; justify-content: flex-end; }
    .dialog-actions button { border-radius: 20px; padding: 8px 24px; font-weight: 500; }
  `]
})
export class ConfirmDialogComponent {
  title = '';
  message = '';
  confirmText = 'Confirm';

  constructor(private dialogRef: MatDialogRef<ConfirmDialogComponent>) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}