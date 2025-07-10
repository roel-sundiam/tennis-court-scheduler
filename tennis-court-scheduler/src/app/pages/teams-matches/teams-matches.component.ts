import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { Poll, DateOption, Vote } from '../../models/poll.model';
import { PollService } from '../../services/poll.service';

@Component({
  selector: 'app-teams-matches',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatIconModule
  ],
  templateUrl: './teams-matches.component.html',
  styleUrls: ['./teams-matches.component.scss']
})
export class TeamsMatchesComponent implements OnInit {
  poll: Poll | undefined;
  loading = false;
  error = '';

  constructor(private pollService: PollService) {}

  ngOnInit() {
    this.loadLatestPoll();
  }

  loadLatestPoll() {
    this.loading = true;
    this.pollService.getPolls().subscribe({
      next: (polls) => {
        if (polls && polls.length > 0) {
          // Assuming the latest poll is the one we care about for teams/matches
          this.poll = polls[0]; 
        } else {
          this.error = 'No polls available to generate teams and matches.';
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load polls for teams and matches.';
        this.loading = false;
      }
    });
  }

  getPlayersForOption(optionId: string): Vote[] {
    const option = this.poll?.options.find((opt: DateOption) => opt.id === optionId);
    return option?.votes || [];
  }

  // Helper to format team names (e.g., "Player A / Player B")
  formatTeam(player1: Vote, player2: Vote): string {
    return `${player1.playerName} / ${player2.playerName}`;
  }

  // Placeholder for generating matches (e.g., simple pairs)
  generateMatches(players: Vote[]): string[] {
    const matches: string[] = [];
    if (players.length < 2) {
      return matches;
    }

    // Simple pairing for demonstration
    for (let i = 0; i < players.length; i += 2) {
      if (players[i + 1]) {
        matches.push(this.formatTeam(players[i], players[i + 1]));
      } else {
        matches.push(`${players[i].playerName} (waiting for partner)`);
      }
    }
    return matches;
  }
}
