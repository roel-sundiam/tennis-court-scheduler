import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Player } from '../../mock-data/mock-players';
import { PlayersService } from '../../mock-data/players.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-players-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DragDropModule, MatSnackBarModule],
  templateUrl: './players-list.component.html',
  styleUrls: ['./players-list.component.scss']
})
export class PlayersListComponent implements OnInit {
  players: Player[] = [];
  saving = false;

  constructor(
    private playersService: PlayersService,
    private snackBar: MatSnackBar,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadPlayers();
  }

  loadPlayers(): void {
    this.playersService.getPlayers().subscribe(players => {
      this.players = players;
    });
  }

  deletePlayer(id: string): void {
    if (this.saving) return;
    if (confirm('Are you sure you want to delete this player?')) {
      this.playersService.deletePlayer(id).subscribe(() => {
        this.loadPlayers();
      });
    }
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
} 