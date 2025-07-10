import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { Poll, DateOption, Vote } from '../../models/poll.model';
import { PollService } from '../../services/poll.service';

@Component({
  selector: 'app-poll-results',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatIconModule
  ],
  templateUrl: './poll-results.component.html',
  styleUrls: ['./poll-results.component.scss']
})
export class PollResultsComponent implements OnInit {
  poll: Poll | undefined;
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private pollService: PollService
  ) {}

  ngOnInit() {
    this.loadPollResults();
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
    return this.getVotesForOption(optionId).length;
  }
}
