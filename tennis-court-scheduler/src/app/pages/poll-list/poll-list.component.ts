import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Poll } from '../../models/poll.model';
import { PollService } from '../../services/poll.service';
import { CoinService } from '../../services/coin.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-poll-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './poll-list.component.html',
  styleUrls: ['./poll-list.component.scss']
})
export class PollListComponent implements OnInit {
  polls: Poll[] = [];
  
  // Coin system
  hasAccess = false;
  coinBalance = 0;
  pageCost = 2;

  constructor(
    private pollService: PollService,
    private router: Router,
    public coinService: CoinService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.initializeCoinSystem();
  }

  initializeCoinSystem() {
    // Subscribe to balance changes
    this.coinService.balance$.subscribe(balance => {
      this.coinBalance = balance;
    });

    // Load polls immediately - no page-level coin gate
    this.hasAccess = true;
    this.loadPolls();
  }

  loadPolls() {
    this.pollService.getPolls().subscribe({
      next: (polls: Poll[]) => {
        this.polls = polls;
      },
      error: (err: Error) => {
        console.error('Failed to load polls:', err);
      }
    });
  }

  goToVote() {
    // Check if user can afford voting before navigation
    if (!this.coinService.canAfford('VOTE_SUBMISSION')) {
      this.showInsufficientCoinsMessage('vote');
      return;
    }
    
    // Charge coins for voting access
    this.coinService.useCoins('VOTE_SUBMISSION', 'Access to vote on poll').subscribe({
      next: (success) => {
        if (success) {
          // Navigate to the first poll or a specific poll ID
          this.router.navigate(['/poll', '1']);
          if (!this.coinService.hasUnlimitedAccess()) {
            this.showSuccessMessage(`Voting access granted! (1 coin used)`);
          }
        } else {
          this.showInsufficientCoinsMessage('vote');
        }
      },
      error: (error) => {
        console.error('Failed to purchase voting access:', error);
        this.showErrorMessage('Failed to process payment for voting.');
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

  private showInsufficientCoinsMessage(action: string = 'access polls') {
    const cost = action === 'vote' ? this.coinService.getFeatureCost('VOTE_SUBMISSION') : this.pageCost;
    const message = `Insufficient coins to ${action}. Need ${cost} coin${cost > 1 ? 's' : ''}.`;
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
}