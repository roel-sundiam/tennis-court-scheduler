import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CoinService } from '../../services/coin.service';

interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price: number;
  bonus: number;
  popular?: boolean;
  description: string;
}

@Component({
  selector: 'app-purchase-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule
  ],
  templateUrl: './purchase-modal.component.html',
  styleUrls: ['./purchase-modal.component.scss']
})
export class PurchaseModalComponent {
  coinPackages: CoinPackage[] = [
    {
      id: 'starter',
      name: 'Starter Pack',
      coins: 10,
      price: 5,
      bonus: 0,
      description: 'Perfect for trying out premium features'
    },
    {
      id: 'standard',
      name: 'Standard Pack',
      coins: 25,
      price: 10,
      bonus: 5,
      popular: true,
      description: 'Most popular choice for regular usage'
    },
    {
      id: 'premium',
      name: 'Premium Pack',
      coins: 60,
      price: 20,
      bonus: 15,
      description: 'Best value for power users'
    },
    {
      id: 'ultimate',
      name: 'Ultimate Pack',
      coins: 150,
      price: 40,
      bonus: 50,
      description: 'Maximum value for frequent users'
    }
  ];

  isProcessing = false;

  constructor(
    public dialogRef: MatDialogRef<PurchaseModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private coinService: CoinService,
    private snackBar: MatSnackBar
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  async purchaseCoins(coinPackage: CoinPackage): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      // Simulate payment processing
      await this.simulatePayment(coinPackage);
      
      // Add coins to user's balance
      const totalCoins = coinPackage.coins + coinPackage.bonus;
      const success = await this.coinService.addCoins(totalCoins, `Purchase: ${coinPackage.name}`).toPromise();
      
      if (success) {
        this.showSuccessMessage(coinPackage, totalCoins);
        this.dialogRef.close(true);
      } else {
        throw new Error('Failed to add coins to balance');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      this.showErrorMessage();
    } finally {
      this.isProcessing = false;
    }
  }

  private async simulatePayment(coinPackage: CoinPackage): Promise<void> {
    // Simulate payment processing delay
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 95% success rate
        if (Math.random() > 0.05) {
          resolve();
        } else {
          reject(new Error('Payment processing failed'));
        }
      }, 2000);
    });
  }

  private showSuccessMessage(coinPackage: CoinPackage, totalCoins: number): void {
    const message = `Successfully purchased ${totalCoins} coins! ${coinPackage.bonus > 0 ? `(${coinPackage.coins} + ${coinPackage.bonus} bonus)` : ''}`;
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(): void {
    this.snackBar.open('Purchase failed. Please try again.', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  getTotalCoins(coinPackage: CoinPackage): number {
    return coinPackage.coins + coinPackage.bonus;
  }

  getValuePerDollar(coinPackage: CoinPackage): number {
    return this.getTotalCoins(coinPackage) / coinPackage.price;
  }
}