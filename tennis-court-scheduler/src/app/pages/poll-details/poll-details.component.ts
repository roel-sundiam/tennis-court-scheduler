import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { Poll } from '../../models/poll.model';
import { PollService } from '../../services/poll.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PlayersService } from '../../mock-data/players.service';
import { Player } from '../../mock-data/mock-players';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AlertDialogComponent } from '../../components/alert-dialog/alert-dialog.component';

@Component({
  selector: 'app-poll-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatInputModule,
    MatDialogModule // Import MatDialogModule
  ],
  templateUrl: './poll-details.component.html',
  styleUrls: ['./poll-details.component.scss']
})
export class PollDetailsComponent implements OnInit {
  poll: Poll | undefined;
  players: Player[] = [];
  selectedPlayerId: string = '';
  selectedDates: { [key: string]: boolean } = {};
  initialSelectedDates: { [key: string]: boolean } = {}; // To track initial state
  loading = false;
  error = '';
  submitting = false;

  // Autocomplete form control and filtered players
  playerControl = new FormControl();
  filteredPlayers!: Observable<Player[]>;

  constructor(
    private route: ActivatedRoute,
    private pollService: PollService,
    private playersService: PlayersService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog // Inject MatDialog
  ) {}

  ngOnInit() {
    this.loadPoll();
    this.loadPlayers();
    this.setupAutocomplete();
  }

  setupAutocomplete() {
    this.filteredPlayers = this.playerControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterPlayers(value || ''))
    );
  }

  private _filterPlayers(value: string): Player[] {
    const filterValue = value.toLowerCase();
    const sortedPlayers = this.getSortedPlayersByName();
    
    return sortedPlayers.filter(player => 
      player.name.toLowerCase().includes(filterValue)
    );
  }

  loadPoll() {
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
          console.log('Poll loaded:', this.poll);
          console.log('Poll votes:', this.poll.votes);
          this.loading = false;
          this.onPlayerSelectionChange();
        } else {
          this.error = 'Poll not found';
          this.loading = false;
        }
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
        this.setupAutocomplete(); // Setup autocomplete after players are loaded
      },
      error: () => {
        this.error = 'Failed to load players';
      }
    });
  }

  onPlayerSelectionChange() {
    this.selectedDates = {};
    this.initialSelectedDates = {};
    if (this.poll && this.selectedPlayerId) {
      console.log('--- Player Selection Change Debug ---');
      console.log('Selected Player ID:', this.selectedPlayerId);
      console.log('All votes in poll:', this.poll.votes);
      
      // Find ALL votes by this player (there might be multiple vote records)
      const playerVotes = this.poll.votes?.filter(vote => vote.playerId === this.selectedPlayerId) || [];
      console.log('All player votes found:', playerVotes);
      
      // Collect all option IDs this player has voted for across all their votes
      const allVotedOptionIds = new Set<string>();
      playerVotes.forEach(vote => {
        vote.optionIds?.forEach(optionId => allVotedOptionIds.add(optionId));
      });
      console.log('All voted option IDs for this player:', Array.from(allVotedOptionIds));
      
      this.poll.options.forEach(option => {
        const isSelected = allVotedOptionIds.has(option.id);
        
        console.log(`Option ${option.id} (${option.date}): isSelected = ${isSelected}`);
        
        this.selectedDates[option.id] = isSelected;
        this.initialSelectedDates[option.id] = isSelected; // Store initial state
      });
      
      console.log('Final selectedDates:', this.selectedDates);
      console.log('Final initialSelectedDates:', this.initialSelectedDates);
    }
  }

  submitVotes() {
    const pollId = this.route.snapshot.paramMap.get('id');
    if (!pollId || !this.selectedPlayerId) {
      this.openAlertDialog('Error', 'Please select a player before submitting.');
      return;
    }

    // Check if there are any changes to submit
    const currentSelections = Object.keys(this.selectedDates).filter(dateId => this.selectedDates[dateId]).sort();
    const initialSelections = Object.keys(this.initialSelectedDates).filter(dateId => this.initialSelectedDates[dateId]).sort();

    console.log('--- Frontend Validation Debug ---');
    console.log('Selected Player ID:', this.selectedPlayerId);
    console.log('Current Selections (sorted):', currentSelections);
    console.log('Initial Selections (sorted):', initialSelections);
    console.log('Selected Dates Object:', this.selectedDates);
    console.log('Initial Selected Dates Object:', this.initialSelectedDates);

    // First check: No changes at all
    if (JSON.stringify(currentSelections) === JSON.stringify(initialSelections)) {
      this.openAlertDialog('Info', 'No changes made to your vote.');
      return;
    }

    // New validation logic: Allow adding new dates and removing existing votes
    // But prevent the same date from being voted for multiple times in one submission
    
    // Find dates that were unselected (removed from vote)
    const removedDates = Object.keys(this.initialSelectedDates)
      .filter(dateId => this.initialSelectedDates[dateId] && !this.selectedDates[dateId]);
    
    // Find dates that were newly selected (added to vote)
    const addedDates = Object.keys(this.selectedDates)
      .filter(dateId => this.selectedDates[dateId] && !this.initialSelectedDates[dateId]);
    
    // Find dates that remain selected (no change)
    const unchangedDates = Object.keys(this.selectedDates)
      .filter(dateId => this.selectedDates[dateId] && this.initialSelectedDates[dateId]);
    
    console.log('Removed dates:', removedDates);
    console.log('Added dates:', addedDates);
    console.log('Unchanged dates:', unchangedDates);
    
    // This validation is now more permissive - we allow the changes
    // The backend will handle the actual vote updates

    this.submitting = true;
    const selectedPlayer = this.players.find(p => p.id === this.selectedPlayerId);
    if (!selectedPlayer) {
      this.openAlertDialog('Error', 'Selected player not found.');
      this.submitting = false;
      return;
    }

    const selectedOptionIds = Object.keys(this.selectedDates)
      .filter(dateId => this.selectedDates[dateId]);

    console.log('🔍 Frontend vote submission debug:');
    console.log('- Poll ID:', pollId);
    console.log('- Player ID:', selectedPlayer.id);
    console.log('- Player Name:', selectedPlayer.name);
    console.log('- Selected Option IDs:', selectedOptionIds);
    console.log('- Selected Dates Object:', this.selectedDates);

    this.pollService.submitVotes(pollId, selectedPlayer.id, selectedPlayer.name, selectedOptionIds).subscribe({
      next: (response: any) => {
        console.log('Vote submission response:', response);
        
        // Update the poll data with the response from backend
        if (response.poll) {
          this.poll = response.poll;
          console.log('Updated poll after submission:', this.poll);
        }
        
        // Clear generated teams since votes have changed
        this.pollService.clearGeneratedTeams(pollId).subscribe({
          next: (clearResponse) => {
            console.log('✅ Generated teams cleared due to vote changes:', clearResponse);
            if (clearResponse.clearedCount > 0) {
              console.log(`🗑️ Cleared ${clearResponse.clearedCount} generated team entries`);
            }
          },
          error: (err) => {
            console.warn('⚠️ Failed to clear generated teams:', err);
            // Don't fail the vote submission if team clearing fails
          }
        });
        
        this.submitting = false;
        this.openAlertDialog('Success', response.message || 'Vote submitted successfully!');
        
        // Refresh the player selection to update the UI with the new vote state
        this.onPlayerSelectionChange(); 
      },
      error: (err) => {
        console.error('Vote submission error:', err);
        this.error = err.error?.message || 'Failed to submit votes';
        this.submitting = false;
        this.openAlertDialog('Error', this.error);
      }
    });
  }

  hasVotes(): boolean {
    if (!this.poll || !this.poll.options) {
      return false;
    }
    return this.poll.options.some(date => date.votes && date.votes.length > 0);
  }

  getVotersForDate(dateId: string): Array<{playerName: string, playerId: string, timestamp: Date}> {
    if (!this.poll?.votes) {
      return [];
    }

    // Find all votes that include this dateId and sort by timestamp (first come, first serve)
    const allVotersForDate = this.poll.votes
      .filter(vote => vote.optionIds?.includes(dateId))
      .map(vote => ({
        playerName: vote.playerName,
        playerId: vote.playerId,
        timestamp: new Date(vote.createdAt || 0) // Use createdAt timestamp for ordering
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); // Ascending order (earliest first)

    // Deduplicate by playerId - keep only the earliest vote for each player
    const uniqueVoters = allVotersForDate.reduce((acc, voter) => {
      const existingVoter = acc.find(v => v.playerId === voter.playerId);
      if (!existingVoter) {
        acc.push(voter); // First time seeing this player, add them
      }
      // If player already exists, keep the existing one (it's earlier due to sorting)
      return acc;
    }, [] as Array<{playerName: string, playerId: string, timestamp: Date}>);

    return uniqueVoters;
  }

  // Tennis doubles helper methods
  getMaxPlayersForCurrentVotes(dateId: string): number {
    // Calculate the next multiple of 4 that can accommodate all current voters
    const currentVotes = this.getVotersForDate(dateId).length;
    if (currentVotes === 0) {
      return 4; // Default minimum for one doubles match
    }
    return Math.ceil(currentVotes / 4) * 4;
  }

  getValidPlayersCount(dateId: string): number {
    // Get the number of players that can actually play (divisible by 4)
    const totalVoters = this.getVotersForDate(dateId).length;
    return Math.floor(totalVoters / 4) * 4;
  }

  getExcessPlayers(dateId: string): number {
    // Get the number of excess players (remainder when divided by 4)
    const totalVoters = this.getVotersForDate(dateId).length;
    return totalVoters % 4;
  }

  getPlayerInitials(playerName: string): string {
    return playerName
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2); // Take first 2 initials
  }

  getSelectedPlayerName(): string {
    const selectedPlayer = this.players.find(player => player.id === this.selectedPlayerId);
    return selectedPlayer ? selectedPlayer.name : '';
  }

  getSortedPlayersByName(): any[] {
    return [...this.players].sort((a, b) => a.name.localeCompare(b.name));
  }

  onPlayerSelected(player: Player) {
    this.selectedPlayerId = player.id;
    this.playerControl.setValue(player.name);
    this.onPlayerSelectionChange();
  }

  displayPlayerName(player: Player): string {
    return player ? player.name : '';
  }

  openAlertDialog(title: string, message: string): void {
    this.dialog.open(AlertDialogComponent, {
      data: { title, message }
    });
  }
}
