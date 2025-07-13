import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { Poll, DateOption, Vote } from '../../models/poll.model';
import { PollService } from '../../services/poll.service';
import { PlayersService } from '../../mock-data/players.service';
import { Player } from '../../mock-data/mock-players';
import { CoinService } from '../../services/coin.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

// Team generation interfaces
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

interface GeneratedMatches {
  dateId: string;
  algorithm: string;
  teams: Team[];
  matches: Match[];
  reservePlayers: Player[];
}

interface ManualPairingState {
  availablePlayers: Player[];
  selectedPlayers: Player[];
  teams: Team[];
  reservePlayers: Player[];
}

@Component({
  selector: 'app-poll-results',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatChipsModule,
    MatListModule,
    MatTooltipModule,
    MatDialogModule,
    MatMenuModule,
    FormsModule,
    MatSnackBarModule
  ],
  templateUrl: './poll-results.component.html',
  styleUrls: ['./poll-results.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PollResultsComponent implements OnInit {
  poll: Poll | undefined;
  players: Player[] = [];
  loading = false;
  error = '';
  
  // Team generation properties
  generatedMatches: { [dateId: string]: GeneratedMatches } = {};
  selectedAlgorithms: { [dateId: string]: string } = {};
  
  // Manual pairing properties
  manualPairingStates: { [dateId: string]: ManualPairingState } = {};
  
  // View toggle property
  isCompactView = true;
  
  // Coin system
  hasAccess = false;
  coinBalance = 0;
  pageCost = 5;
  
  algorithmOptions = [
    { value: 'random', label: 'Random' },
    { value: 'balanced', label: 'Balanced (Top vs Bottom)' },
    { value: 'grouped', label: 'Skill-Level Groups' },
    { value: 'manual', label: 'Manual Pairing' }
  ];

  constructor(
    private route: ActivatedRoute,
    private pollService: PollService,
    private playersService: PlayersService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    public coinService: CoinService,
    private snackBar: MatSnackBar,
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
    if (this.coinService.canAfford('POLL_RESULTS_VIEW')) {
      this.purchasePageAccess();
    } else {
      this.showInsufficientCoinsMessage();
    }
  }

  purchasePageAccess() {
    this.coinService.useCoins('POLL_RESULTS_VIEW', 'Poll Results page access').subscribe({
      next: (success) => {
        if (success) {
          this.hasAccess = true;
          this.loadAllData();
          if (!this.coinService.hasUnlimitedAccess()) {
            this.showSuccessMessage(`Poll Results access granted! (${this.pageCost} coins used)`);
          }
        } else {
          this.showInsufficientCoinsMessage();
        }
      },
      error: (error) => {
        console.error('Failed to purchase poll results access:', error);
        this.showErrorMessage('Failed to process payment. Please try again.');
      }
    });
  }

  loadAllData() {
    this.loadPollResults();
    this.loadPlayers();
    this.loadGeneratedTeams();
  }

  loadPollResults() {
    const pollId = this.route.snapshot.paramMap.get('id');
    if (!pollId) {
      this.error = 'Invalid poll ID';
      return;
    }

    this.loading = true;
    this.pollService.getPollById(pollId).subscribe({
      next: (poll) => {
        if (poll) {
          this.poll = poll;
          this.loading = false;
        } else {
          this.error = 'Poll not found';
          this.loading = false;
        }
      },
      error: () => {
        this.error = 'Failed to load poll results';
        this.loading = false;
      }
    });
  }

  getSortedDateOptions(): DateOption[] {
    if (!this.poll) return [];
    const sorted = [...this.poll.options].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return sorted;
  }

  getVotesForOption(optionId: string): Vote[] {
    const option = this.poll?.options.find((opt: DateOption) => opt.id === optionId);
    return option?.votes || [];
  }

  getVoteCount(optionId: string): number {
    return this.getPlayersForDate(optionId).length;
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
    const pollId = this.route.snapshot.paramMap.get('id');
    if (!pollId) return;

    console.log('Loading generated teams for poll:', pollId);
    this.pollService.getGeneratedTeams(pollId).subscribe({
      next: (response) => {
        console.log('📥 Backend response for generated teams:', response);
        const savedTeams = response.generatedTeams || [];
        console.log('📊 Saved teams data:', savedTeams);
        
        // Convert saved teams back to the local format
        savedTeams.forEach((teamData: any) => {
          console.log('🔄 Restoring teams for date:', teamData.dateId);
          this.generatedMatches[teamData.dateId] = {
            dateId: teamData.dateId,
            algorithm: teamData.algorithm,
            teams: teamData.teams,
            matches: teamData.matches,
            reservePlayers: teamData.reservePlayers
          };
          // Also set the selected algorithm for the dropdown
          this.selectedAlgorithms[teamData.dateId] = teamData.algorithm;
        });
        
        console.log('🎯 Final generatedMatches:', this.generatedMatches);
        console.log('🎯 Final selectedAlgorithms:', this.selectedAlgorithms);
        
        // Force change detection to update the UI
        this.cdr.detectChanges();
        console.log('🔄 Triggered change detection');
      },
      error: (error) => {
        console.error('❌ Failed to load generated teams:', error);
      }
    });
  }

  // Get players who voted for a specific date with their full player data
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

  // Generate teams based on selected algorithm
  generateTeams(dateId: string) {
    // Check if user can afford team generation
    if (!this.coinService.canAfford('TEAM_GENERATION')) {
      this.showInsufficientCoinsMessage('generate teams');
      return;
    }

    const algorithm = this.selectedAlgorithms[dateId];
    if (!algorithm) return;

    const players = this.getPlayersForDate(dateId);
    if (players.length < 2) return;

    // Charge coins for team generation
    this.coinService.useCoins('TEAM_GENERATION', `Generate teams for ${dateId} using ${algorithm} algorithm`).subscribe({
      next: (success) => {
        if (success) {
          this.executeTeamGeneration(dateId, algorithm, players);
          if (!this.coinService.hasUnlimitedAccess()) {
            const cost = this.coinService.getFeatureCost('TEAM_GENERATION');
            this.showSuccessMessage(`Teams generated! (${cost} coins used)`);
          }
        } else {
          this.showInsufficientCoinsMessage('generate teams');
        }
      },
      error: (error) => {
        console.error('Failed to charge for team generation:', error);
        this.showErrorMessage('Failed to process payment for team generation.');
      }
    });
  }

  private executeTeamGeneration(dateId: string, algorithm: string, players: Player[]) {

    let teams: Team[] = [];
    let reservePlayers: Player[] = [];

    switch (algorithm) {
      case 'random':
        ({ teams, reservePlayers } = this.generateRandomTeams(players));
        break;
      case 'balanced':
        ({ teams, reservePlayers } = this.generateBalancedTeams(players));
        break;
      case 'grouped':
        ({ teams, reservePlayers } = this.generateGroupedTeams(players));
        break;
      case 'manual':
        this.initializeManualPairing(dateId, players);
        return; // Don't create matches yet for manual pairing
    }

    const matches = this.createMatches(teams);

    const generatedTeamsData = {
      dateId,
      algorithm,
      teams,
      matches,
      reservePlayers
    };

    this.generatedMatches[dateId] = generatedTeamsData;

    // Save to backend for non-admin users to see
    this.saveTeamsToBackend(generatedTeamsData);
  }

  // Save generated teams to backend
  private saveTeamsToBackend(generatedTeamsData: GeneratedMatches) {
    const pollId = this.route.snapshot.paramMap.get('id');
    if (!pollId) return;

    console.log('Attempting to save teams to backend:', generatedTeamsData);
    this.pollService.saveGeneratedTeams(pollId, generatedTeamsData).subscribe({
      next: (response) => {
        console.log('✅ Teams successfully saved to backend:', response);
      },
      error: (error) => {
        console.error('❌ Failed to save teams to backend:', error);
      }
    });
  }

  // Algorithm 1: Random team generation
  private generateRandomTeams(players: Player[]): { teams: Team[], reservePlayers: Player[] } {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const teams: Team[] = [];
    const reservePlayers: Player[] = [];

    // Create teams from pairs
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      if (i + 1 < shuffled.length) {
        teams.push(this.createTeam(shuffled[i], shuffled[i + 1], teams.length + 1));
      }
    }

    // Add remaining players as reserves
    if (shuffled.length % 2 !== 0) {
      reservePlayers.push(shuffled[shuffled.length - 1]);
    }

    // If odd number of teams, move last team's players to reserves
    if (teams.length % 2 !== 0) {
      const lastTeam = teams.pop()!;
      reservePlayers.push(lastTeam.player1, lastTeam.player2);
    }

    return { teams, reservePlayers };
  }

  // Algorithm 2: Balanced (Top vs Bottom)
  private generateBalancedTeams(players: Player[]): { teams: Team[], reservePlayers: Player[] } {
    const teams: Team[] = [];
    const reservePlayers: Player[] = [];
    const usablePlayers = players.slice(0, Math.floor(players.length / 4) * 4);
    
    // Pair highest with lowest seed
    const half = Math.floor(usablePlayers.length / 2);
    for (let i = 0; i < half; i += 2) {
      if (i + 1 < half) {
        // Pair top seeds with bottom seeds
        teams.push(this.createTeam(usablePlayers[i], usablePlayers[usablePlayers.length - 1 - i], teams.length + 1));
        teams.push(this.createTeam(usablePlayers[i + 1], usablePlayers[usablePlayers.length - 2 - i], teams.length + 1));
      }
    }

    // Add excess players as reserves
    reservePlayers.push(...players.slice(usablePlayers.length));

    return { teams, reservePlayers };
  }

  // Algorithm 3: Skill-Level Groups
  private generateGroupedTeams(players: Player[]): { teams: Team[], reservePlayers: Player[] } {
    const teams: Team[] = [];
    const reservePlayers: Player[] = [];
    
    // Group players into groups of 4
    for (let i = 0; i < players.length; i += 4) {
      const group = players.slice(i, i + 4);
      if (group.length === 4) {
        // Within each group, pair highest rank with lowest rank
        // group[0] = highest rank (best), group[3] = lowest rank (worst)
        // group[1] = 2nd best, group[2] = 2nd worst
        teams.push(this.createTeam(group[0], group[3], teams.length + 1)); // Best + Worst
        teams.push(this.createTeam(group[1], group[2], teams.length + 1)); // 2nd Best + 2nd Worst
      } else {
        // Add incomplete group to reserves
        reservePlayers.push(...group);
      }
    }

    return { teams, reservePlayers };
  }

  private createTeam(player1: Player, player2: Player, teamNumber: number): Team {
    return {
      id: `team-${teamNumber}`,
      player1,
      player2,
      averageSeed: (player1.seed + player2.seed) / 2
    };
  }

  private createMatches(teams: Team[]): Match[] {
    const matches: Match[] = [];
    
    for (let i = 0; i < teams.length - 1; i += 2) {
      matches.push({
        id: `match-${matches.length + 1}`,
        teamA: teams[i],
        teamB: teams[i + 1]
      });
    }

    return matches;
  }

  hasGeneratedMatches(dateId: string): boolean {
    const hasMatches = !!this.generatedMatches[dateId];
    console.log(`🔍 hasGeneratedMatches(${dateId}):`, hasMatches);
    return hasMatches;
  }

  getGeneratedMatches(dateId: string): GeneratedMatches | undefined {
    return this.generatedMatches[dateId];
  }

  // Manual pairing methods
  initializeManualPairing(dateId: string, players: Player[]) {
    this.manualPairingStates[dateId] = {
      availablePlayers: [...players],
      selectedPlayers: [],
      teams: [],
      reservePlayers: []
    };
  }

  getManualPairingState(dateId: string): ManualPairingState | undefined {
    return this.manualPairingStates[dateId];
  }

  isManualPairingMode(dateId: string): boolean {
    return this.selectedAlgorithms[dateId] === 'manual' && !!this.manualPairingStates[dateId];
  }

  selectPlayerForTeam(dateId: string, player: Player) {
    const state = this.manualPairingStates[dateId];
    if (!state) return;

    // Move player from available to selected
    state.availablePlayers = state.availablePlayers.filter(p => p.id !== player.id);
    state.selectedPlayers.push(player);

    // If we have 2 selected players, create a team
    if (state.selectedPlayers.length === 2) {
      this.createManualTeam(dateId);
    }
  }

  unselectPlayer(dateId: string, player: Player) {
    const state = this.manualPairingStates[dateId];
    if (!state) return;

    // Move player from selected back to available
    state.selectedPlayers = state.selectedPlayers.filter(p => p.id !== player.id);
    state.availablePlayers.push(player);
    // Sort by seed to maintain order
    state.availablePlayers.sort((a, b) => a.seed - b.seed);
  }

  createManualTeam(dateId: string) {
    const state = this.manualPairingStates[dateId];
    if (!state || state.selectedPlayers.length !== 2) return;

    const [player1, player2] = state.selectedPlayers;
    const team = this.createTeam(player1, player2, state.teams.length + 1);
    
    state.teams.push(team);
    state.selectedPlayers = [];
  }

  removeTeam(dateId: string, teamId: string) {
    const state = this.manualPairingStates[dateId];
    if (!state) return;

    const teamIndex = state.teams.findIndex(t => t.id === teamId);
    if (teamIndex === -1) return;

    const team = state.teams[teamIndex];
    
    // Move players back to available
    state.availablePlayers.push(team.player1, team.player2);
    state.availablePlayers.sort((a, b) => a.seed - b.seed);
    
    // Remove team
    state.teams.splice(teamIndex, 1);
    
    // Renumber remaining teams
    state.teams.forEach((team, index) => {
      team.id = `team-${index + 1}`;
    });
  }

  moveToReserve(dateId: string, player: Player) {
    const state = this.manualPairingStates[dateId];
    if (!state) return;

    // Remove from available and add to reserves
    state.availablePlayers = state.availablePlayers.filter(p => p.id !== player.id);
    state.reservePlayers.push(player);
  }

  moveFromReserve(dateId: string, player: Player) {
    const state = this.manualPairingStates[dateId];
    if (!state) return;

    // Remove from reserves and add to available
    state.reservePlayers = state.reservePlayers.filter(p => p.id !== player.id);
    state.availablePlayers.push(player);
    state.availablePlayers.sort((a, b) => a.seed - b.seed);
  }

  finalizeManualPairing(dateId: string) {
    const state = this.manualPairingStates[dateId];
    if (!state) return;

    // Move any remaining available players to reserves
    state.reservePlayers.push(...state.availablePlayers);
    state.availablePlayers = [];

    // Create matches from teams
    const matches = this.createMatches(state.teams);

    const generatedTeamsData = {
      dateId,
      algorithm: 'manual',
      teams: state.teams,
      matches,
      reservePlayers: state.reservePlayers
    };

    this.generatedMatches[dateId] = generatedTeamsData;

    // Clear manual pairing state
    delete this.manualPairingStates[dateId];

    // Save to backend
    this.saveTeamsToBackend(generatedTeamsData);
  }

  cancelManualPairing(dateId: string) {
    delete this.manualPairingStates[dateId];
    this.selectedAlgorithms[dateId] = '';
  }

  // Match removal methods
  removeMatch(dateId: string, matchId: string) {
    const generatedData = this.generatedMatches[dateId];
    if (!generatedData) return;

    // Find the match to remove
    const matchIndex = generatedData.matches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return;

    const match = generatedData.matches[matchIndex];
    const matchNumber = match.id.split('-')[1];
    
    // Open confirmation dialog
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px'
    });
    
    dialogRef.componentInstance.title = `Remove Match ${matchNumber}`;
    dialogRef.componentInstance.message = `Are you sure you want to remove Match ${matchNumber}? The 4 players will be moved to reserves.`;
    dialogRef.componentInstance.confirmText = 'Remove Match';

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Move players from the match back to reserves
        generatedData.reservePlayers.push(
          match.teamA.player1,
          match.teamA.player2,
          match.teamB.player1,
          match.teamB.player2
        );

        // Remove the match
        generatedData.matches.splice(matchIndex, 1);

        // Remove the teams from the teams array
        generatedData.teams = generatedData.teams.filter(
          team => team.id !== match.teamA.id && team.id !== match.teamB.id
        );

        // Renumber remaining matches
        generatedData.matches.forEach((match, index) => {
          match.id = `match-${index + 1}`;
        });

        // Save updated data to backend
        this.saveTeamsToBackend(generatedData);
      }
    });
  }

  clearAllMatches(dateId: string) {
    const generatedData = this.generatedMatches[dateId];
    if (!generatedData) return;

    // Open confirmation dialog
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px'
    });
    
    dialogRef.componentInstance.title = 'Clear All Matches';
    dialogRef.componentInstance.message = 'Are you sure you want to clear all matches for this date? All players will be moved to reserves. This action cannot be undone.';
    dialogRef.componentInstance.confirmText = 'Clear All';

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Move all players to reserves
        generatedData.teams.forEach(team => {
          generatedData.reservePlayers.push(team.player1, team.player2);
        });

        // Clear teams and matches
        generatedData.teams = [];
        generatedData.matches = [];

        // Save updated data to backend
        this.saveTeamsToBackend(generatedData);
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

  private showInsufficientCoinsMessage(action: string = 'access poll results') {
    const cost = action === 'generate teams' ? this.coinService.getFeatureCost('TEAM_GENERATION') : this.pageCost;
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
