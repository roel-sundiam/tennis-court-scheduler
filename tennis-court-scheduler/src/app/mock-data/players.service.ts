import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Player } from './mock-players';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlayersService {
  private apiUrl = `${environment.apiUrl}/players`;

  constructor(private http: HttpClient) { }

  getPlayers(): Observable<Player[]> {
    return this.http.get<Player[]>(this.apiUrl);
  }

  getPlayerById(id: string): Observable<Player> {
    return this.http.get<Player>(`${this.apiUrl}/${id}`);
  }

  addPlayer(player: Omit<Player, 'id'>): Observable<Player> {
    return this.http.post<Player>(this.apiUrl, player);
  }

  updatePlayer(id: string, updatedPlayer: Partial<Player>): Observable<Player> {
    return this.http.put<Player>(`${this.apiUrl}/${id}`, updatedPlayer);
  }

  deletePlayer(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // The following methods are now client-side helpers only
  // You may want to move these to a utility service if needed
  isSeedTaken(seed: number, players: Player[], excludeId?: string): boolean {
    return players.some(player => 
      player.seed === seed && player.id !== excludeId
    );
  }

  getNextAvailableSeed(players: Player[]): number {
    const usedSeeds = players.map(player => player.seed).sort((a, b) => a - b);
    let nextSeed = 1;
    for (const seed of usedSeeds) {
      if (seed === nextSeed) {
        nextSeed++;
      } else {
        break;
      }
    }
    return nextSeed;
  }
} 