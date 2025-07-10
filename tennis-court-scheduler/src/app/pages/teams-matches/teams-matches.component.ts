import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { Poll, Vote } from '../../models/poll.model';
import { PollService } from '../../services/poll.service';
import { PlayersService } from '../../mock-data/players.service';
import { Player } from '../../mock-data/mock-players';

// Interfaces for generated teams data
interface Team {
  id: string;
  player1: Player;
  player2: Player;
  averageSeed: number;
}

interface Match {
  id: string;
  teamA: Team;
  teamB: Team;
}

interface GeneratedTeams {
  dateId: string;
  algorithm: string;
  teams: Team[];
  matches: Match[];
  reservePlayers: Player[];
  createdAt?: string;
}

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
  players: Player[] = [];
  generatedTeams: GeneratedTeams[] = [];
  loading = false;
  error = '';

  constructor(
    private pollService: PollService,
    private playersService: PlayersService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.loadPoll();
    this.loadPlayers();
    this.loadGeneratedTeams();
  }

  loadPoll() {
    this.pollService.getPollById('1').subscribe({
      next: (poll) => {
        if (poll) {
          this.poll = poll;
        } else {
          this.error = 'Poll not found';
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load poll';
        this.loading = false;
      }
    });
  }

  loadPlayers() {
    this.playersService.getPlayers().subscribe({
      next: (players) => {
        this.players = players;
      },
      error: () => {
        console.error('Failed to load players');
      }
    });
  }

  loadGeneratedTeams() {
    this.pollService.getGeneratedTeams('1').subscribe({
      next: (response) => {
        this.generatedTeams = response.generatedTeams || [];
      },
      error: () => {
        console.error('Failed to load generated teams');
      }
    });
  }

  // Get sorted date options
  getSortedDateOptions() {
    if (!this.poll?.options) return [];
    return [...this.poll.options].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  // Get players who voted for a specific date with full player data
  getPlayersForDate(dateId: string): Player[] {
    if (!this.poll?.votes || !this.players.length) return [];
    
    // Find all votes that include this dateId
    const voterIds = this.poll.votes
      .filter(vote => vote.optionIds?.includes(dateId))
      .map(vote => vote.playerId);
    
    // Get full player data for these voters and sort by seed
    return this.players
      .filter(player => voterIds.includes(player.id))
      .sort((a, b) => a.seed - b.seed); // Sort by seed (1 = best)
  }

  // Get generated teams for a specific date
  getGeneratedTeamsForDate(dateId: string): GeneratedTeams | undefined {
    return this.generatedTeams.find(gt => gt.dateId === dateId);
  }

  // Check if date has generated teams
  hasGeneratedTeams(dateId: string): boolean {
    return !!this.getGeneratedTeamsForDate(dateId);
  }

  // Check if date has enough players for matches
  hasEnoughPlayers(dateId: string): boolean {
    return this.getPlayersForDate(dateId).length >= 4;
  }

  // Get vote count for a date
  getVoteCount(dateId: string): number {
    return this.getPlayersForDate(dateId).length;
  }

  // Format algorithm name for display
  formatAlgorithmName(algorithm: string): string {
    switch (algorithm) {
      case 'random':
        return 'Random Teams';
      case 'balanced':
        return 'Balanced (Top vs Bottom)';
      case 'grouped':
        return 'Skill-Level Groups';
      default:
        return algorithm;
    }
  }
}