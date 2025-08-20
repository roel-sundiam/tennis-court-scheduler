import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Poll, Vote } from '../../models/poll.model';
import { PollService } from '../../services/poll.service';
import { PlayersService } from '../../mock-data/players.service';
import { Player } from '../../mock-data/mock-players';
import { CoinService } from '../../services/coin.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

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
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatSnackBarModule,
    MatDialogModule
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
  teamsRecentlyCleared = false;
  
  // View toggle property
  isCompactView = true;

  // Coin system
  hasAccess = false;
  coinBalance = 0;
  pageCost = 2;

  constructor(
    private pollService: PollService,
    private playersService: PlayersService,
    public coinService: CoinService,
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
    if (this.coinService.canAfford('TEAMS_MATCHES_VIEW')) {
      this.purchasePageAccess();
    } else {
      this.showInsufficientCoinsMessage();
    }
  }

  purchasePageAccess() {
    this.coinService.useCoins('TEAMS_MATCHES_VIEW', 'Teams & Matches page access').subscribe({
      next: (success) => {
        if (success) {
          this.hasAccess = true;
          this.loadData();
          // Auto-refresh teams data every 30 seconds to sync with vote changes
          setInterval(() => {
            this.loadGeneratedTeams();
          }, 30000);
          if (!this.coinService.hasUnlimitedAccess()) {
            this.showSuccessMessage(`Teams & Matches access granted! (${this.pageCost} coins used)`);
          }
        } else {
          this.showInsufficientCoinsMessage();
        }
      },
      error: (error) => {
        console.error('Failed to purchase teams access:', error);
        this.showErrorMessage('Failed to process payment. Please try again.');
      }
    });
  }

  loadData() {
    this.loading = true;
    this.loadPoll();
    this.loadPlayers();
    this.loadGeneratedTeams();
  }

  // Check for auto-generation after data is loaded
  private checkForAutoGeneration() {
    if (!this.poll || !this.players.length) {
      console.log('🤖 Auto-generation skipped: missing poll or players');
      return;
    }

    console.log('🤖 Teams-matches: Checking auto-generation for all dates...');
    
    // Check each date option for auto-generation opportunity
    this.poll.options.forEach(dateOption => {
      const players = this.getPlayersForDate(dateOption.id);
      const existingTeams = this.getGeneratedTeamsForDate(dateOption.id);
      
      console.log(`🤖 Date ${dateOption.id}: ${players.length} players, existing teams:`, existingTeams);
      console.log(`🔍 Players for ${dateOption.id}:`, players.map(p => p.name));
      
      // Auto-generate if 4+ players and no existing teams
      const needsGeneration = players.length >= 4 && !existingTeams;
      
      if (needsGeneration) {
        console.log(`🤖 Auto-generating teams for ${dateOption.id} with ${players.length} players`);
        this.autoGenerateTeamsForDate(dateOption.id, players);
      } else {
        console.log(`🤖 Skipping auto-generation for ${dateOption.id}: ${players.length} players, has teams: ${!!existingTeams}`);
      }
    });
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
    console.log('🔍 Loading generated teams from backend...');
    const previousTeamsCount = this.generatedTeams.length;
    
    this.pollService.getGeneratedTeams('1').subscribe({
      next: (response) => {
        console.log('📥 Backend response:', response);
        const newTeams = response.generatedTeams || [];
        
        // Check if teams were recently cleared (had teams before, now empty)
        if (previousTeamsCount > 0 && newTeams.length === 0) {
          this.teamsRecentlyCleared = true;
          console.log('🔄 Teams were cleared due to vote changes');
          
          // Clear the flag after 10 seconds
          setTimeout(() => {
            this.teamsRecentlyCleared = false;
          }, 10000);
        }
        
        this.generatedTeams = newTeams;
        console.log('🎯 Generated teams loaded:', this.generatedTeams.length, 'entries');
        if (this.generatedTeams.length === 0) {
          console.log('✅ No generated teams found - database has been cleared!');
        }
        
        // Check for auto-generation after loading existing teams and when poll/players are available
        setTimeout(() => {
          this.checkForAutoGeneration();
        }, 100);
      },
      error: (error) => {
        console.error('❌ Failed to load generated teams:', error);
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

  // Manual refresh method for user-triggered updates
  refreshTeams() {
    this.loadData();
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
    const cost = this.coinService.getFeatureCost('TEAMS_MATCHES_VIEW');
    const message = `Insufficient coins for Teams & Matches access. Need ${cost} coin${cost > 1 ? 's' : ''}.`;
    this.snackBar.open(message, 'Purchase Coins', {
      duration: 8000,
      panelClass: ['warning-snackbar']
    }).onAction().subscribe(() => {
      this.openPurchaseModal();
    });
  }

  // Auto-generation methods
  private autoGenerateTeamsForDate(dateId: string, players: Player[]) {
    console.log(`🤖 Teams-matches: Auto-generating teams for ${dateId} with ${players.length} players`);
    
    // For auto-generation, create matches directly from all players
    const matches = this.createMatchesFromAllPlayers(players);
    
    // Create dummy teams for structure (not actually used in display)
    const teams: Team[] = [];
    const reservePlayers: Player[] = []; // Always empty

    const generatedTeamsData = {
      dateId,
      algorithm: 'random',
      teams,
      matches,
      reservePlayers
    };

    // Save to backend
    this.saveTeamsToBackend(generatedTeamsData);
    console.log(`✅ Teams-matches: Auto-generated teams for ${dateId} with all ${players.length} players`);
  }

  // Create matches directly from all players (for auto-generation)
  private createMatchesFromAllPlayers(allPlayers: Player[]): Match[] {
    const matches: Match[] = [];
    
    if (allPlayers.length < 4) {
      return matches;
    }

    console.log(`🎯 Teams-matches: Creating matches from ${allPlayers.length} players:`, allPlayers.map(p => p.name));

    // Create 4 matches ensuring all players participate
    const playerPool = [...allPlayers];
    const playerUsageCount = new Map<string, number>();
    
    // Initialize usage count
    allPlayers.forEach(player => {
      playerUsageCount.set(player.id, 0);
    });

    for (let matchNum = 1; matchNum <= 4; matchNum++) {
      // Sort players by usage count (least used first) then shuffle among tied players
      const availablePlayers = playerPool
        .sort((a, b) => {
          const usageA = playerUsageCount.get(a.id) || 0;
          const usageB = playerUsageCount.get(b.id) || 0;
          if (usageA !== usageB) {
            return usageA - usageB; // Least used first
          }
          return Math.random() - 0.5; // Random among tied players
        });

      // Take first 4 available players
      if (availablePlayers.length >= 4) {
        const selectedPlayers = availablePlayers.slice(0, 4);
        
        // Create teams from selected players
        const teamA = this.createTeam(selectedPlayers[0], selectedPlayers[1], 1);
        const teamB = this.createTeam(selectedPlayers[2], selectedPlayers[3], 2);
        
        // Update usage count
        selectedPlayers.forEach(player => {
          const currentCount = playerUsageCount.get(player.id) || 0;
          playerUsageCount.set(player.id, currentCount + 1);
        });
        
        matches.push({
          id: `match-${matchNum}`,
          teamA,
          teamB
        });
        
        console.log(`✅ Teams-matches: Match ${matchNum}: ${selectedPlayers.map(p => p.name).join(', ')}`);
      }
    }

    console.log('🎯 Teams-matches: Final player usage counts:');
    playerUsageCount.forEach((count, playerId) => {
      const player = allPlayers.find(p => p.id === playerId);
      console.log(`  ${player?.name}: ${count} matches`);
    });

    return matches;
  }

  private createTeam(player1: Player, player2: Player, teamNumber: number): Team {
    return {
      id: `team-${teamNumber}`,
      player1,
      player2,
      averageSeed: (player1.seed + player2.seed) / 2
    };
  }

  // Save generated teams to backend
  private saveTeamsToBackend(generatedTeamsData: any) {
    console.log('Teams-matches: Attempting to save teams to backend:', generatedTeamsData);
    this.pollService.saveGeneratedTeams('1', generatedTeamsData).subscribe({
      next: (response) => {
        console.log('✅ Teams-matches: Teams successfully saved to backend:', response);
        // Reload teams to show the new data
        this.loadGeneratedTeams();
      },
      error: (error) => {
        console.error('❌ Teams-matches: Failed to save teams to backend:', error);
      }
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