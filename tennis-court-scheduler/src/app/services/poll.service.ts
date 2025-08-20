import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Poll } from '../models/poll.model';
import { DateUtilsService } from './date-utils.service';
import { environment } from '../../environments/environment';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PollService {
  private apiUrl = `${environment.apiUrl}/polls`;

  constructor(private http: HttpClient, private dateUtils: DateUtilsService) {}

  getPolls(): Observable<Poll[]> {
    return this.http.get<Poll[]>(this.apiUrl);
  }

  getPollById(id: string): Observable<Poll> {
    return this.http.get<Poll>(`${this.apiUrl}/${id}`);
  }

  createPoll(poll: Partial<Poll>): Observable<Poll> {
    // Ensure options are generated if not provided
    if (!poll.options || poll.options.length === 0) {
      poll.options = this.dateUtils.generateMWFOptions().map((opt, index) => ({
        id: `${index + 1}`,
        date: opt.date,
        time: '18:00',
        maxPlayers: 4,
        votes: [],
        isFull: false
      }));
    }
    return this.http.post<Poll>(this.apiUrl, poll);
  }

  updatePoll(id: string, poll: Partial<Poll>): Observable<Poll> {
    return this.http.put<Poll>(`${this.apiUrl}/${id}`, poll);
  }

  deletePoll(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  submitVotes(pollId: string, playerId: string, playerName: string, optionIds: string[]): Observable<Poll> {
    const voteData = { playerId, playerName, optionIds };
    console.log('🚀 PollService submitVotes called:');
    console.log('- URL:', `${this.apiUrl}/${pollId}/vote`);
    console.log('- Vote Data:', voteData);
    console.log('- Option IDs type:', typeof optionIds, 'length:', optionIds.length);
    return this.http.post<Poll>(`${this.apiUrl}/${pollId}/vote`, voteData);
  }

  clearAllVotes(pollId: string): Observable<Poll> {
    return this.getPollById(pollId).pipe(
      switchMap(poll => {
        if (!poll) {
          throw new Error('Poll not found');
        }
        // Clear all votes for all options within the poll
        poll.options.forEach(option => {
          option.votes = [];
        });
        poll.totalVotes = 0;
        return this.updatePoll(pollId, poll);
      })
    );
  }

  // Save generated teams to backend
  saveGeneratedTeams(pollId: string, generatedTeamsData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${pollId}/teams`, generatedTeamsData);
  }

  // Get generated teams from backend
  getGeneratedTeams(pollId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${pollId}/teams`);
  }

  // Clear generated teams when votes change
  clearGeneratedTeams(pollId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${pollId}/teams`);
  }

  // Delete a specific match
  deleteMatch(pollId: string, dateId: string, matchId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${pollId}/teams/${dateId}/matches/${matchId}`);
  }
}
