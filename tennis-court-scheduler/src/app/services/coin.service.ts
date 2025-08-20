import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface CoinTransaction {
  _id?: string;
  userId: string;
  username: string;
  type: 'PURCHASE' | 'USAGE' | 'REFUND' | 'BONUS';
  amount: number;
  description: string;
  feature: string;
  timestamp: Date;
  balanceAfter: number;
}

export interface CoinBalance {
  userId?: string;
  username?: string;
  clubId?: string;
  balance: number;
  totalPurchased: number;
  totalUsed: number;
  lastUpdated: Date;
  isUnlimited?: boolean;
  displayBalance?: string;
}

export interface CoinPricing {
  feature: string;
  cost: number;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class CoinService {
  private apiUrl = `${environment.apiUrl}/coins`;
  private balanceSubject = new BehaviorSubject<number>(0);
  public balance$ = this.balanceSubject.asObservable();

  // Pricing structure for different features
  private featurePricing: CoinPricing[] = [
    // Page Access Costs
    { feature: 'CALENDAR_VIEW', cost: 1, description: 'View calendar page' },
    { feature: 'POLL_VOTING_VIEW', cost: 2, description: 'View polls and voting' },
    { feature: 'PLAYERS_VIEW', cost: 3, description: 'View players page' },
    { feature: 'TEAMS_MATCHES_VIEW', cost: 2, description: 'View teams & matches' },
    { feature: 'POLL_RESULTS_VIEW', cost: 5, description: 'View poll results page' },
    { feature: 'ACTIVITY_LOGS_VIEW', cost: 1, description: 'View activity logs page' },
    
    // Feature Costs
    { feature: 'VOTE_SUBMISSION', cost: 1, description: 'Submit a vote' },
    { feature: 'PLAYER_ADD', cost: 2, description: 'Add new player' },
    { feature: 'PLAYER_EDIT', cost: 1, description: 'Edit player' },
    { feature: 'PLAYER_DELETE', cost: 1, description: 'Delete player' },
    { feature: 'TEAM_GENERATION', cost: 4, description: 'Generate teams' },
    { feature: 'MATCH_SCHEDULING', cost: 3, description: 'Schedule matches' },
    { feature: 'ACTIVITY_LOGS_FILTER', cost: 2, description: 'Apply filters to logs' },
    { feature: 'ACTIVITY_LOGS_EXPORT', cost: 5, description: 'Export activity data' },
    { feature: 'ACTIVITY_STATS_VIEW', cost: 3, description: 'View statistics dashboard' },
    { feature: 'DATA_EXPORT', cost: 2, description: 'Export data' },
    { feature: 'USER_ANALYTICS', cost: 4, description: 'Access user analytics' }
  ];

  // Add state to track if user is unlimited
  private isUnlimited = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.initializeBalance();
  }

  // Check if current user is RoelSundiam (unlimited access)
  private isRoelSundiam(): boolean {
    const user = this.authService.getUser();
    return user?.username === 'RoelSundiam';
  }

  private initializeBalance() {
    console.log('🪙 CoinService: Initializing balance...');
    console.log('🪙 User:', this.authService.getUser());
    console.log('🪙 Is RoelSundiam:', this.isRoelSundiam());
    
    // Clear any old local storage for shared balance to prevent sync issues
    this.clearOldLocalStorage();
    
    this.loadBalance().subscribe();
  }

  // Clear old local storage entries that cause sync issues
  private clearOldLocalStorage(): void {
    try {
      if (!this.isRoelSundiam()) {
        // Remove any cached club balance to force fresh fetch
        localStorage.removeItem('club_balance_VGTennisMorningClub');
        console.log('🪙 Cleared old local storage for shared balance');
      }
    } catch (error) {
      console.warn('Failed to clear old local storage:', error);
    }
  }

  // Get authorization headers
  private getAuthHeaders(): HttpHeaders {
    const user = this.authService.getUser();
    let headers = new HttpHeaders();
    
    if (user && user.username === 'RoelSundiam') {
      headers = headers.set('Authorization', `Bearer ${user.username}`);
    }
    // For balance checking, no auth header needed for anonymous users
    // They will see club balance, RoelSundiam will see unlimited
    
    return headers;
  }

  // Load current balance
  loadBalance(): Observable<CoinBalance> {
    const headers = this.getAuthHeaders();
    console.log('🪙 Loading balance with headers:', headers);
    
    return new Observable(observer => {
      this.http.get<any>(`${this.apiUrl}/balance`, { headers }).subscribe({
        next: (response) => {
          console.log('🪙 Balance response:', response);
          
          if (response.success) {
            this.isUnlimited = response.data.isUnlimited || false;
            
            if (this.isUnlimited) {
              this.balanceSubject.next(999999); // Display large number for unlimited
            } else {
              this.balanceSubject.next(response.data.balance);
            }
            
            console.log('🪙 Balance set to:', this.balanceSubject.value);
            observer.next(response.data);
          } else {
            // Default balance for new users - use club balance (500)
            this.isUnlimited = false;
            this.balanceSubject.next(500);
            observer.next({
              userId: this.authService.getCurrentUserId(),
              username: this.authService.getCurrentUserName(),
              balance: 500,
              totalPurchased: 500,
              totalUsed: 0,
              lastUpdated: new Date(),
              isUnlimited: false,
              displayBalance: '500'
            });
          }
          observer.complete();
        },
        error: (error) => {
          console.warn('🪙 Failed to load balance from server, using local fallback');
          console.error('🪙 Error details:', error);
          
          const localBalance = this.getLocalBalance();
          this.isUnlimited = this.isRoelSundiam();
          
          if (this.isUnlimited) {
            this.balanceSubject.next(999999);
          } else {
            this.balanceSubject.next(localBalance);
          }
          
          console.log('🪙 Local balance set to:', this.balanceSubject.value);
          
          observer.next({
            userId: this.authService.getCurrentUserId(),
            username: this.authService.getCurrentUserName(),
            balance: this.isUnlimited ? -1 : localBalance,
            totalPurchased: 0,
            totalUsed: 0,
            lastUpdated: new Date(),
            isUnlimited: this.isUnlimited,
            displayBalance: this.isUnlimited ? 'Unlimited' : localBalance.toString()
          });
          observer.complete();
        }
      });
    });
  }

  // Check if user has enough coins for a feature
  canAfford(feature: string): boolean {
    // RoelSundiam has unlimited access
    if (this.isRoelSundiam() || this.isUnlimited) {
      return true;
    }
    
    const pricing = this.featurePricing.find(p => p.feature === feature);
    if (!pricing) return true; // Free if not in pricing list
    
    return this.balanceSubject.value >= pricing.cost;
  }

  // Get cost for a feature
  getFeatureCost(feature: string): number {
    const pricing = this.featurePricing.find(p => p.feature === feature);
    return pricing ? pricing.cost : 0;
  }

  // Use coins for a feature
  useCoins(feature: string, description?: string): Observable<boolean> {
    const pricing = this.featurePricing.find(p => p.feature === feature);
    
    // RoelSundiam has unlimited access - always succeeds but still records transaction
    if (this.isRoelSundiam() || this.isUnlimited) {
      if (!pricing) {
        return new Observable(observer => {
          observer.next(true);
          observer.complete();
        });
      }

      const transaction = {
        feature: feature,
        amount: pricing.cost,
        description: description || pricing.description,
        userId: this.authService.getCurrentUserId()
      };

      const headers = this.getAuthHeaders();
      return new Observable(observer => {
        this.http.post<any>(`${this.apiUrl}/use`, transaction, { headers }).subscribe({
          next: (response) => {
            observer.next(true);
            observer.complete();
          },
          error: (error) => {
            console.warn('Failed to record transaction for unlimited user');
            observer.next(true); // Still allow usage even if logging fails
            observer.complete();
          }
        });
      });
    }

    // Regular users - check and deduct from club balance
    if (!pricing) {
      return new Observable(observer => {
        observer.next(true);
        observer.complete();
      });
    }

    if (!this.canAfford(feature)) {
      return new Observable(observer => {
        observer.next(false);
        observer.complete();
      });
    }

    const transaction = {
      feature: feature,
      amount: pricing.cost,
      description: description || pricing.description,
      userId: this.authService.getCurrentUserId()
    };

    const headers = this.getAuthHeaders();
    return new Observable(observer => {
      this.http.post<any>(`${this.apiUrl}/use`, transaction, { headers }).subscribe({
        next: (response) => {
          if (response.success) {
            if (!response.data.isUnlimited) {
              this.balanceSubject.next(response.data.balanceAfter);
            }
            observer.next(true);
          } else {
            observer.next(false);
          }
          observer.complete();
        },
        error: (error) => {
          console.warn('Failed to use coins on server, using local fallback');
          // Local fallback for club members
          const newBalance = this.balanceSubject.value - pricing.cost;
          this.balanceSubject.next(Math.max(0, newBalance));
          this.setLocalBalance(Math.max(0, newBalance));
          observer.next(newBalance >= 0);
          observer.complete();
        }
      });
    });
  }

  // Add coins to balance (for purchases)
  addCoins(amount: number, description: string = 'Coin purchase'): Observable<boolean> {
    const transaction: CoinTransaction = {
      userId: this.authService.getCurrentUserId(),
      username: this.authService.getCurrentUserName(),
      type: 'PURCHASE',
      amount: amount,
      description: description,
      feature: 'COIN_PURCHASE',
      timestamp: new Date(),
      balanceAfter: this.balanceSubject.value + amount
    };

    const headers = this.getAuthHeaders();
    return new Observable(observer => {
      this.http.post<any>(`${this.apiUrl}/purchase`, transaction, { headers }).subscribe({
        next: (response) => {
          if (response.success) {
            this.balanceSubject.next(response.data.balanceAfter);
            observer.next(true);
          } else {
            observer.next(false);
          }
          observer.complete();
        },
        error: (error) => {
          console.warn('Failed to add coins on server, using local fallback');
          // Local fallback
          const newBalance = this.balanceSubject.value + amount;
          this.balanceSubject.next(newBalance);
          this.setLocalBalance(newBalance);
          observer.next(true);
          observer.complete();
        }
      });
    });
  }

  // Purchase coins (deprecated, use addCoins instead)
  purchaseCoins(amount: number, paymentMethod: string = 'CREDIT_CARD'): Observable<boolean> {
    const transaction: CoinTransaction = {
      userId: this.authService.getCurrentUserId(),
      username: this.authService.getCurrentUserName(),
      type: 'PURCHASE',
      amount: amount,
      description: `Purchased ${amount} coins via ${paymentMethod}`,
      feature: 'COIN_PURCHASE',
      timestamp: new Date(),
      balanceAfter: this.balanceSubject.value + amount
    };

    const headers = this.getAuthHeaders();
    return new Observable(observer => {
      this.http.post<any>(`${this.apiUrl}/purchase`, transaction, { headers }).subscribe({
        next: (response) => {
          if (response.success) {
            this.balanceSubject.next(response.data.balanceAfter);
            observer.next(true);
          } else {
            observer.next(false);
          }
          observer.complete();
        },
        error: (error) => {
          console.warn('Failed to purchase coins on server, using local fallback');
          // Local fallback
          const newBalance = this.balanceSubject.value + amount;
          this.balanceSubject.next(newBalance);
          this.setLocalBalance(newBalance);
          observer.next(true);
          observer.complete();
        }
      });
    });
  }

  // Get transaction history
  getTransactions(limit: number = 50): Observable<CoinTransaction[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/transactions?limit=${limit}`, { headers });
  }

  // Get pricing information
  getPricing(): CoinPricing[] {
    return [...this.featurePricing];
  }

  // Get current balance synchronously
  getCurrentBalance(): number {
    return this.balanceSubject.value;
  }

  // Local storage fallback methods
  private getLocalBalance(): number {
    try {
      // For RoelSundiam - no local storage needed (unlimited)
      if (this.isRoelSundiam()) {
        return 999999; // Large number for display
      }
      
      // For shared club balance, don't use local storage - always fetch from server
      // This ensures all users see the same live balance
      return 500; // Default fallback only
    } catch {
      return 500;
    }
  }

  private setLocalBalance(balance: number): void {
    try {
      // Don't save local balance for shared club balance - causes sync issues
      // Each browser would have different cached values
      if (this.isRoelSundiam()) return;
      
      // For shared balance, don't cache in local storage
      // Always fetch fresh from database to ensure consistency
      console.log('🪙 Skipping local storage for shared club balance');
    } catch (error) {
      console.warn('Failed to save balance locally:', error);
    }
  }

  // Check if user needs more coins
  needsMoreCoins(feature: string): boolean {
    return !this.canAfford(feature);
  }

  // Force refresh balance from server (useful for shared balance sync)
  refreshBalance(): Observable<CoinBalance> {
    console.log('🪙 Force refreshing balance from server...');
    return this.loadBalance();
  }

  // Get recommended coin package based on usage
  getRecommendedPackage(): { amount: number; price: number; description: string } {
    const balance = this.getCurrentBalance();
    
    if (balance <= 5) {
      return { amount: 50, price: 4.99, description: 'Starter Package - Great for regular use' };
    } else if (balance <= 15) {
      return { amount: 100, price: 9.99, description: 'Standard Package - Most popular choice' };
    } else {
      return { amount: 200, price: 19.99, description: 'Pro Package - Best value for power users' };
    }
  }

  // Format balance display
  formatBalance(balance: number): string {
    if (this.isRoelSundiam() || this.isUnlimited) {
      return '∞';
    }
    return `${balance.toLocaleString()}`;
  }

  // Get display balance string
  getDisplayBalance(): string {
    if (this.isRoelSundiam() || this.isUnlimited) {
      return 'Unlimited';
    }
    return this.getCurrentBalance().toString();
  }

  // Check if current user has unlimited access
  hasUnlimitedAccess(): boolean {
    return this.isRoelSundiam() || this.isUnlimited;
  }

  // Get club balance specifically for admin panel
  getClubBalance(): Observable<CoinBalance> {
    const headers = this.getAuthHeaders();
    return new Observable(observer => {
      this.http.get<any>(`${this.apiUrl}/club-balance`, { headers }).subscribe({
        next: (response) => {
          if (response.success) {
            observer.next(response.data);
          } else {
            observer.error('Failed to load club balance');
          }
          observer.complete();
        },
        error: (error) => {
          console.error('Failed to load club balance:', error);
          observer.error(error);
        }
      });
    });
  }

  // Add coins to club balance (RoelSundiam only)
  addCoinsToClub(amount: number, description?: string): Observable<boolean> {
    if (!this.isRoelSundiam()) {
      return new Observable(observer => {
        observer.next(false);
        observer.complete();
      });
    }

    const payload = {
      amount: amount,
      description: description || `Admin added ${amount} coins to club`
    };

    const headers = this.getAuthHeaders();
    return new Observable(observer => {
      this.http.post<any>(`${this.apiUrl}/add-to-club`, payload, { headers }).subscribe({
        next: (response) => {
          if (response.success) {
            console.log(`✅ Added ${amount} coins to club. New balance: ${response.data.clubBalanceAfter}`);
            // Refresh balance to show updated club balance
            this.refreshBalance().subscribe();
            observer.next(true);
          } else {
            observer.next(false);
          }
          observer.complete();
        },
        error: (error) => {
          console.error('❌ Failed to add coins to club:', error);
          observer.next(false);
          observer.complete();
        }
      });
    });
  }
}