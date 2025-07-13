import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CoinService } from '../../services/coin.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-coin-balance',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './coin-balance.component.html',
  styleUrls: ['./coin-balance.component.scss']
})
export class CoinBalanceComponent implements OnInit, OnDestroy {
  balance = 0;
  isLoading = false;
  private balanceSubscription?: Subscription;

  constructor(
    private coinService: CoinService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    // Load balance for all users (shared club balance or unlimited for RoelSundiam)
    this.loadBalance();
    this.subscribeToBalance();
  }

  ngOnDestroy() {
    if (this.balanceSubscription) {
      this.balanceSubscription.unsubscribe();
    }
  }

  isRoelSundiam(): boolean {
    const user = this.authService.getUser();
    return user?.username === 'RoelSundiam';
  }

  private loadBalance() {
    this.isLoading = true;
    this.coinService.loadBalance().subscribe({
      next: (balance) => {
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load balance:', error);
        this.isLoading = false;
      }
    });
  }

  private subscribeToBalance() {
    this.balanceSubscription = this.coinService.balance$.subscribe(balance => {
      this.balance = balance;
    });
  }

  openPurchaseModal() {
    import('../purchase-modal/purchase-modal.component').then(module => {
      const dialogRef = this.dialog.open(module.PurchaseModalComponent, {
        width: '900px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        data: { currentBalance: this.balance }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          // Purchase successful, balance should be automatically updated via subscription
          console.log('Purchase completed successfully');
        }
      });
    });
  }

  formatBalance(): string {
    return this.coinService.formatBalance(this.balance);
  }

  getBalanceColor(): string {
    if (this.balance <= 5) return '#f44336'; // Red - Critical
    if (this.balance <= 15) return '#ff9800'; // Orange - Low
    return '#4caf50'; // Green - Good
  }

  getTooltipText(): string {
    if (this.balance <= 5) {
      return 'Critical: Very low coin balance! Purchase more coins to continue using features.';
    } else if (this.balance <= 15) {
      return 'Warning: Low coin balance. Consider purchasing more coins soon.';
    }
    return 'Good: You have sufficient coins for feature usage.';
  }
}
