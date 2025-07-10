import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Player } from '../../mock-data/mock-players';
import { PlayersService } from '../../mock-data/players.service';

@Component({
  selector: 'app-player-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './player-form.component.html',
  styleUrls: ['./player-form.component.scss']
})
export class PlayerFormComponent implements OnInit {
  player: Partial<Player> = {
    name: '',
    seed: 1
  };
  isEditMode = false;
  playerId: string | null = null;
  errors: { [key: string]: string } = {};
  players: Player[] = [];
  loading = true;

  constructor(
    private playersService: PlayersService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Always fetch players first
    this.playersService.getPlayers().subscribe(players => {
      this.players = players;
      this.route.params.subscribe(params => {
        if (params['id']) {
          this.playerId = params['id'];
          this.isEditMode = true;
          this.loadPlayer();
        } else {
          this.player.seed = this.playersService.getNextAvailableSeed(this.players);
          this.loading = false;
        }
      });
    });
  }

  loadPlayer(): void {
    if (this.playerId) {
      this.playersService.getPlayerById(this.playerId).subscribe(existingPlayer => {
        if (existingPlayer) {
          this.player = { ...existingPlayer };
        } else {
          this.router.navigate(['/players']);
        }
        this.loading = false;
      }, () => {
        this.router.navigate(['/players']);
        this.loading = false;
      });
    }
  }

  validateForm(): boolean {
    this.errors = {};

    if (!this.player.name?.trim()) {
      this.errors['name'] = 'Name is required';
    }

    if (!this.player.seed || this.player.seed < 1) {
      this.errors['seed'] = 'Seed must be a positive number';
    } else if (this.playersService.isSeedTaken(this.player.seed, this.players, this.playerId || undefined)) {
      this.errors['seed'] = 'This seed number is already taken';
    }

    return Object.keys(this.errors).length === 0;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    if (this.isEditMode && this.playerId) {
      this.playersService.updatePlayer(this.playerId, this.player).subscribe(() => {
        this.router.navigate(['/players']);
      });
    } else {
      this.playersService.addPlayer(this.player as Omit<Player, 'id'>).subscribe(() => {
        this.router.navigate(['/players']);
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/players']);
  }
} 