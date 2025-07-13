import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CoinService, CoinBalance } from '../../services/coin.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatSnackBarModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss']
})
export class AdminPanelComponent implements OnInit {
  coinsToAdd: number = 100;
  description: string = '';
  isLoading = false;
  clubBalance: CoinBalance | null = null;
  
  // Predefined amounts for quick selection
  quickAmounts = [50, 100, 200, 500, 1000];

  constructor(
    private coinService: CoinService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit() {
    // Check if user is RoelSundiam
    if (!this.isRoelSundiam()) {
      this.snackBar.open('Access denied. Admin panel is restricted to authorized administrators.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      this.router.navigate(['/']);
      return;
    }

    this.loadClubBalance();
  }

  isRoelSundiam(): boolean {
    const user = this.authService.getUser();
    return user?.username === 'RoelSundiam';
  }

  loadClubBalance() {
    // Admin needs to see the actual club balance, not their unlimited access
    // Make a direct API call to get VGTennisMorningClub balance
    this.coinService.getClubBalance().subscribe({
      next: (balance) => {
        this.clubBalance = balance;
      },
      error: (error) => {
        console.error('Failed to load club balance:', error);
        this.snackBar.open('Failed to load club balance', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  setQuickAmount(amount: number) {
    this.coinsToAdd = amount;
  }

  addCoinsToClub() {
    if (!this.coinsToAdd || this.coinsToAdd <= 0) {
      this.snackBar.open('Please enter a valid coin amount', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isLoading = true;
    const desc = this.description || `Admin added ${this.coinsToAdd} coins to club`;
    
    this.coinService.addCoinsToClub(this.coinsToAdd, desc).subscribe({
      next: (success) => {
        this.isLoading = false;
        if (success) {
          this.snackBar.open(
            `Successfully added ${this.coinsToAdd} coins to club balance!`, 
            'Close', 
            {
              duration: 5000,
              panelClass: ['success-snackbar']
            }
          );
          // Reset form
          this.coinsToAdd = 100;
          this.description = '';
          // Reload balance
          this.loadClubBalance();
        } else {
          this.snackBar.open('Failed to add coins to club', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error adding coins:', error);
        this.snackBar.open('Error adding coins to club', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  refreshBalance() {
    this.loadClubBalance();
    this.snackBar.open('Balance refreshed', 'Close', {
      duration: 2000
    });
  }
}