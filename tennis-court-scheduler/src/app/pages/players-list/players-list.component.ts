import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Player } from '../../mock-data/mock-players';
import { PlayersService } from '../../mock-data/players.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../services/auth.service';
import { CoinService } from '../../services/coin.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-players-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DragDropModule, MatSnackBarModule, MatDialogModule, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './players-list.component.html',
  styleUrls: ['./players-list.component.scss']
})
export class PlayersListComponent implements OnInit {
  players: Player[] = [];
  saving = false;
  
  // Coin system
  hasAccess = false;
  coinBalance = 0;
  pageCost = 3;

  constructor(
    private playersService: PlayersService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public auth: AuthService,
    public coinService: CoinService,
    private router: Router
  ) {}

  ngOnInit(): void {
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
    if (this.coinService.canAfford('PLAYERS_VIEW')) {
      this.purchasePageAccess();
    } else {
      this.showInsufficientCoinsMessage();
    }
  }

  purchasePageAccess() {
    this.coinService.useCoins('PLAYERS_VIEW', 'Players management page access').subscribe({
      next: (success) => {
        if (success) {
          this.hasAccess = true;
          this.loadPlayers();
          if (!this.coinService.hasUnlimitedAccess()) {
            this.showSuccessMessage(`Players access granted! (${this.pageCost} coins used)`);
          }
        } else {
          this.showInsufficientCoinsMessage();
        }
      },
      error: (error) => {
        console.error('Failed to purchase players access:', error);
        this.showErrorMessage('Failed to process payment. Please try again.');
      }
    });
  }

  loadPlayers(): void {
    this.playersService.getPlayers().subscribe(players => {
      this.players = players;
    });
  }

  deletePlayer(id: string): void {
    if (this.saving) return;
    
    // Check if user can afford delete action
    if (!this.coinService.canAfford('PLAYER_DELETE')) {
      this.showInsufficientCoinsMessage('delete player');
      return;
    }
    
    const player = this.players.find(p => p.id === id);
    if (!player) return;
    
    const dialogRef = this.dialog.open(DeletePlayerDialogComponent, {
      width: '90vw',
      maxWidth: '400px',
      data: { playerName: player.name }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Charge coins for delete action
        this.coinService.useCoins('PLAYER_DELETE', `Delete player: ${player.name}`).subscribe({
          next: (success) => {
            if (success) {
              this.playersService.deletePlayer(id).subscribe(() => {
                this.loadPlayers();
                const message = this.coinService.hasUnlimitedAccess() 
                  ? `${player.name} has been deleted`
                  : `${player.name} has been deleted (1 coin used)`;
                this.snackBar.open(message, 'Close', { duration: 3000 });
              });
            } else {
              this.showInsufficientCoinsMessage('delete player');
            }
          },
          error: (error) => {
            console.error('Failed to charge for delete:', error);
            this.showErrorMessage('Failed to process payment for delete.');
          }
        });
      }
    });
  }

  trackByPlayerId(index: number, player: Player): string {
    return player.id;
  }

  onDrop(event: CdkDragDrop<Player[]>): void {
    if (this.saving) return;
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.players, event.previousIndex, event.currentIndex);
      this.updateSeedNumbersAndPersist();
    }
  }

  private updateSeedNumbersAndPersist(): void {
    this.saving = true;
    this.players.forEach((player, index) => {
      player.seed = index + 1;
    });
    // Wait for all updates to finish
    let completed = 0;
    const total = this.players.length;
    for (const player of this.players) {
      this.playersService.updatePlayer(player.id, { seed: player.seed }).subscribe({
        next: () => {
          completed++;
          if (completed === total) {
            this.saving = false;
            this.snackBar.open('Seed order updated!', 'Close', { duration: 2000 });
            this.loadPlayers();
          }
        },
        error: () => {
          completed++;
          if (completed === total) {
            this.saving = false;
            this.snackBar.open('Seed order updated (with errors)', 'Close', { duration: 2000 });
            this.loadPlayers();
          }
        }
      });
    }
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

  private showInsufficientCoinsMessage(action: string = 'access players') {
    const cost = action === 'delete player' ? this.coinService.getFeatureCost('PLAYER_DELETE') : this.pageCost;
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

// Delete Player Dialog Component
@Component({
  selector: 'app-delete-player-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="delete-dialog">
      <div class="dialog-header">
        <mat-icon class="warning-icon">warning</mat-icon>
        <h2 mat-dialog-title>Delete Player</h2>
      </div>
      
      <div mat-dialog-content class="dialog-content">
        <p>Are you sure you want to delete <strong>{{data.playerName}}</strong>?</p>
        <p class="warning-text">This action cannot be undone.</p>
      </div>
      
      <div mat-dialog-actions class="dialog-actions">
        <button mat-stroked-button (click)="onCancel()" class="cancel-btn">
          <mat-icon>close</mat-icon>
          Cancel
        </button>
        <button mat-raised-button color="warn" (click)="onDelete()" class="delete-btn">
          <mat-icon>delete</mat-icon>
          Delete
        </button>
      </div>
    </div>
  `,
  styles: [`
    .delete-dialog {
      background: var(--bg-card, #2c2c2c);
      color: var(--text-primary, #ffffff);
      border-radius: 12px;
      overflow: hidden;
    }
    
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 24px 16px 24px;
      border-bottom: 1px solid var(--border-color, #555);
    }
    
    .warning-icon {
      color: #ff9800;
      font-size: 2rem !important;
      width: 2rem !important;
      height: 2rem !important;
    }
    
    h2 {
      margin: 0;
      color: var(--text-primary, #ffffff) !important;
      font-size: 1.4rem;
      font-weight: 600;
    }
    
    .dialog-content {
      padding: 24px;
      
      p {
        margin: 0 0 12px 0;
        color: var(--text-primary, #ffffff);
        line-height: 1.5;
        
        strong {
          color: #ff9800;
          font-weight: 600;
        }
      }
      
      .warning-text {
        color: var(--text-secondary, #e0e0e0);
        font-size: 0.9rem;
        font-style: italic;
        margin-bottom: 0;
      }
    }
    
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px 24px 24px;
      background: var(--bg-elevated, #3a3a3a);
      border-top: 1px solid var(--border-color, #555);
    }
    
    .cancel-btn {
      color: var(--text-secondary, #e0e0e0) !important;
      border-color: var(--border-color, #555) !important;
      
      &:hover {
        background: var(--bg-elevated, #3a3a3a) !important;
        color: var(--text-primary, #ffffff) !important;
      }
    }
    
    .delete-btn {
      background: #f44336 !important;
      color: white !important;
      
      &:hover {
        background: #d32f2f !important;
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(244, 67, 54, 0.4);
      }
    }
    
    ::ng-deep .mat-mdc-dialog-container {
      background: var(--bg-card, #2c2c2c) !important;
      color: var(--text-primary, #ffffff) !important;
    }
    
    @media (max-width: 768px) {
      .dialog-header {
        padding: 16px 20px 12px 20px;
        
        .warning-icon {
          font-size: 1.5rem !important;
          width: 1.5rem !important;
          height: 1.5rem !important;
        }
        
        h2 {
          font-size: 1.2rem;
        }
      }
      
      .dialog-content {
        padding: 16px 20px;
        
        p {
          font-size: 0.9rem;
          margin: 0 0 10px 0;
        }
        
        .warning-text {
          font-size: 0.8rem;
        }
      }
      
      .dialog-actions {
        padding: 12px 20px 16px 20px;
        flex-direction: column-reverse;
        gap: 8px;
        
        .cancel-btn, .delete-btn {
          width: 100%;
          min-height: 44px;
          font-size: 0.9rem;
          
          mat-icon {
            font-size: 1rem !important;
          }
        }
      }
    }
    
    @media (max-width: 480px) {
      .dialog-header {
        padding: 12px 16px 8px 16px;
        
        h2 {
          font-size: 1.1rem;
        }
      }
      
      .dialog-content {
        padding: 12px 16px;
        
        p {
          font-size: 0.85rem;
        }
        
        .warning-text {
          font-size: 0.75rem;
        }
      }
      
      .dialog-actions {
        padding: 8px 16px 12px 16px;
        
        .cancel-btn, .delete-btn {
          font-size: 0.85rem;
          min-height: 40px;
        }
      }
    }
  `]
})
export class DeletePlayerDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeletePlayerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { playerName: string }
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onDelete(): void {
    this.dialogRef.close(true);
  }
}