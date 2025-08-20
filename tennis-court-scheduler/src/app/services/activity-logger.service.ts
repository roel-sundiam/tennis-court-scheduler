import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { filter } from 'rxjs/operators';

export interface ActivityLog {
  userId: string;
  username: string;
  userRole: 'admin' | 'user' | 'anonymous';
  action: string;
  page: string;
  timestamp: Date;
  userAgent: string;
  ipAddress?: string;
  sessionId: string;
  additionalData?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityLoggerService {
  private apiUrl = `${environment.apiUrl}/activity-logs`;
  private sessionId: string;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {
    this.sessionId = this.generateSessionId();
    this.initializeRouterLogging();
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private initializeRouterLogging() {
    // Log page navigation automatically
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.logPageAccess(event.url);
    });
  }

  logPageAccess(page: string) {
    const user = this.authService.getUser();
    
    const log: ActivityLog = {
      userId: user?.username || 'anonymous',
      username: user?.username || 'Anonymous User',
      userRole: user?.role || 'anonymous',
      action: 'PAGE_ACCESS',
      page: page,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      sessionId: this.sessionId
    };

    this.sendLog(log);
    this.logToConsole('Page Access', log);
  }

  logUserAction(action: string, additionalData?: any) {
    const user = this.authService.getUser();
    const currentPage = this.router.url;
    
    const log: ActivityLog = {
      userId: user?.username || 'anonymous',
      username: user?.username || 'Anonymous User',
      userRole: user?.role || 'anonymous',
      action: action,
      page: currentPage,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      additionalData: additionalData
    };

    this.sendLog(log);
    this.logToConsole('User Action', log);
  }

  logVoteSubmission(pollId: string, playerId: string, optionIds: string[]) {
    this.logUserAction('VOTE_SUBMISSION', {
      pollId,
      playerId,
      optionIds,
      voteCount: optionIds.length
    });
  }

  logTeamGeneration(algorithm: string, playerCount: number, dateId: string) {
    this.logUserAction('TEAM_GENERATION', {
      algorithm,
      playerCount,
      dateId
    });
  }

  logPlayerManagement(action: 'CREATE' | 'UPDATE' | 'DELETE' | 'REORDER', playerId?: string) {
    this.logUserAction('PLAYER_MANAGEMENT', {
      managementAction: action,
      playerId
    });
  }

  logLogin(username: string, role: string) {
    const log: ActivityLog = {
      userId: username,
      username: username,
      userRole: role as 'admin' | 'user',
      action: 'USER_LOGIN',
      page: '/login',
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      sessionId: this.sessionId
    };

    this.sendLog(log);
    this.logToConsole('User Login', log);
  }

  logLogout(username: string) {
    const log: ActivityLog = {
      userId: username,
      username: username,
      userRole: this.authService.getUser()?.role || 'user',
      action: 'USER_LOGOUT',
      page: this.router.url,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      sessionId: this.sessionId
    };

    this.sendLog(log);
    this.logToConsole('User Logout', log);
  }

  private sendLog(log: ActivityLog) {
    // Send to backend
    this.http.post(this.apiUrl, log).subscribe({
      next: () => {
        // Log sent successfully
      },
      error: (error) => {
        console.warn('Failed to send activity log to server:', error);
        // Fallback to local storage
        this.storeLogLocally(log);
      }
    });
  }

  private storeLogLocally(log: ActivityLog) {
    try {
      const existingLogs = localStorage.getItem('activity_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(log);
      
      // Keep only last 100 logs to prevent storage issues
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('activity_logs', JSON.stringify(logs));
    } catch (error) {
      console.warn('Failed to store log locally:', error);
    }
  }

  private logToConsole(type: string, log: ActivityLog) {
    console.log(`🔍 ${type}:`, {
      user: `${log.username} (${log.userRole})`,
      action: log.action,
      page: log.page,
      time: log.timestamp.toLocaleString(),
      session: log.sessionId,
      data: log.additionalData
    });
  }

  // Get headers with authentication for RoelSundiam
  private getAuthHeaders() {
    const user = this.authService.getUser();
    const headers = new HttpHeaders();
    
    // Only add authorization if user is RoelSundiam
    if (user && user.username === 'RoelSundiam') {
      return headers.set('Authorization', `Bearer ${user.username}`);
    }
    
    return headers;
  }

  // Get activity logs for admin dashboard (requires RoelSundiam authentication)
  getActivityLogs(params?: any) {
    const headers = this.getAuthHeaders();
    
    // Build query parameters
    let queryParams = new URLSearchParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key].toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    const url = queryString ? `${this.apiUrl}?${queryString}` : this.apiUrl;
    
    return this.http.get<any>(url, { headers });
  }

  // Get logs for specific user (requires RoelSundiam authentication)
  getUserActivityLogs(userId: string, limit: number = 20) {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/user/${userId}?limit=${limit}`, { headers });
  }

  // Get activity statistics (requires RoelSundiam authentication)
  getActivityStats() {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/stats`, { headers });
  }

  // Get locally stored logs (fallback)
  getLocalActivityLogs(): ActivityLog[] {
    try {
      const logs = localStorage.getItem('activity_logs');
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.warn('Failed to retrieve local logs:', error);
      return [];
    }
  }
}