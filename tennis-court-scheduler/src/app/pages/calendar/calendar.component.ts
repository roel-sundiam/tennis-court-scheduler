import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CoinService } from '../../services/coin.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatToolbarModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  calendarDays: any[] = [];
  isLoading = false;
  currentDate = new Date();
  
  // Coin system
  hasAccess = false;
  coinBalance = 0;
  pageCost = 1;

  constructor(
    private coinService: CoinService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializeCoinSystem();
  }

  initializeCoinSystem() {
    // Subscribe to balance changes
    this.coinService.balance$.subscribe(balance => {
      this.coinBalance = balance;
    });

    // Check if user can access the page
    this.checkPageAccess();
  }

  checkPageAccess() {
    if (this.coinService.canAfford('CALENDAR_VIEW')) {
      this.purchasePageAccess();
    } else {
      this.showInsufficientCoinsMessage();
    }
  }

  purchasePageAccess() {
    this.coinService.useCoins('CALENDAR_VIEW', 'Calendar page access').subscribe({
      next: (success) => {
        if (success) {
          this.hasAccess = true;
          this.generateCalendarDays();
          if (!this.coinService.hasUnlimitedAccess()) {
            this.showSuccessMessage(`Calendar access granted! (${this.pageCost} coin used)`);
          }
        } else {
          this.showInsufficientCoinsMessage();
        }
      },
      error: (error) => {
        console.error('Failed to purchase calendar access:', error);
        this.showErrorMessage('Failed to process payment. Please try again.');
      }
    });
  }

  private showSuccessMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showInsufficientCoinsMessage() {
    const message = `Insufficient coins to access Calendar. Need ${this.pageCost} coin.`;
    this.snackBar.open(message, 'Purchase Coins', {
      duration: 8000,
      panelClass: ['warning-snackbar']
    }).onAction().subscribe(() => {
      this.openPurchaseModal();
    });
  }

  openPurchaseModal() {
    import('../../components/purchase-modal/purchase-modal.component').then(module => {
      this.dialog.open(module.PurchaseModalComponent, {
        width: '900px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        data: { currentBalance: this.coinBalance }
      });
    });
  }

  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.generateCalendarDays();
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.generateCalendarDays();
  }

  goToToday() {
    this.currentDate = new Date();
    this.generateCalendarDays();
  }

  getMonthYearString(): string {
    return this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  getMatchStatusColor(status: string): string {
    return status === 'active' ? '#4CAF50' : '#1976d2';
  }

  getMatchStatusText(status: string): string {
    return status === 'active' ? 'Active' : 'Scheduled';
  }

  getTeamDisplay(team: any): string {
    return team?.name || 'TBD';
  }

  getSelectedDateMatches(): any[] {
    return [];
  }

  getSelectedDateString(): string {
    return this.currentDate.toLocaleDateString();
  }

  private generateCalendarDays() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    this.calendarDays = [];
    
    // Add empty days for the start of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      this.calendarDays.push({ date: null });
    }
    
    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      this.calendarDays.push({
        date: new Date(year, month, day),
        matches: [] // You would populate this with actual matches
      });
    }
  }
} 