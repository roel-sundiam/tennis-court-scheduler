import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { ActivityLoggerService, ActivityLog } from '../../services/activity-logger.service';
import { AuthService } from '../../services/auth.service';
import { CoinService } from '../../services/coin.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

interface ActivityStats {
  totalLogs: number;
  topUsers: Array<{ _id: { userId: string; userRole: string }; count: number }>;
  actionBreakdown: Array<{ _id: string; count: number }>;
  topPages: Array<{ _id: string; count: number }>;
  dailyActivity: Array<{ _id: string; count: number }>;
}

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './activity-logs.component.html',
  styleUrls: ['./activity-logs.component.scss']
})
export class ActivityLogsComponent implements OnInit {
  activityLogs: ActivityLog[] = [];
  stats: ActivityStats | null = null;
  loading = true;
  error = '';
  
  // Filters
  selectedUser = '';
  selectedAction = '';
  selectedUserRole = '';
  selectedPage = '';
  startDate = '';
  endDate = '';
  
  // Pagination
  currentPage = 0;
  limit = 50;
  hasMore = false;
  
  // View options
  viewMode: 'logs' | 'stats' = 'logs';
  userRoles = ['admin', 'user', 'anonymous'];
  actions = ['PAGE_ACCESS', 'VOTE_SUBMISSION', 'TEAM_GENERATION', 'PLAYER_MANAGEMENT', 'USER_LOGIN', 'USER_LOGOUT'];
  
  // Coin system
  hasAccessToPage = false;
  coinBalance = 0;
  featureCosts = {
    VIEW: 1,
    FILTER: 2,
    STATS: 3,
    EXPORT: 5
  };

  constructor(
    private activityLogger: ActivityLoggerService,
    private authService: AuthService,
    private coinService: CoinService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit() {
    // Check if user is admin
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/']);
      return;
    }

    // Check if user is specifically RoelSundiam for activity logs access
    const user = this.authService.getUser();
    if (!user || user.username !== 'RoelSundiam') {
      this.error = 'Access denied. Activity logs are restricted to RoelSundiam only.';
      this.loading = false;
      return;
    }
    
    // Initialize coin system
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
    if (this.coinService.canAfford('ACTIVITY_LOGS_VIEW')) {
      this.purchasePageAccess();
    } else {
      this.showInsufficientCoinsMessage('view activity logs');
    }
  }

  purchasePageAccess() {
    this.coinService.useCoins('ACTIVITY_LOGS_VIEW', 'Activity Logs page access').subscribe({
      next: (success) => {
        if (success) {
          this.hasAccessToPage = true;
          this.loadActivityLogs();
          this.loadStats();
          this.showSuccessMessage(`Page access granted! (${this.featureCosts.VIEW} coins used)`);
        } else {
          this.showInsufficientCoinsMessage('access this page');
        }
      },
      error: (error) => {
        console.error('Failed to purchase page access:', error);
        this.showErrorMessage('Failed to process coin payment. Please try again.');
      }
    });
  }

  loadActivityLogs() {
    this.loading = true;
    this.error = '';
    
    const params: any = {
      limit: this.limit,
      offset: this.currentPage * this.limit
    };
    
    if (this.selectedUser) params.userId = this.selectedUser;
    if (this.selectedAction) params.action = this.selectedAction;
    if (this.selectedUserRole) params.userRole = this.selectedUserRole;
    if (this.selectedPage) params.page = this.selectedPage;
    if (this.startDate) params.startDate = this.startDate;
    if (this.endDate) params.endDate = this.endDate;
    
    this.activityLogger.getActivityLogs(params).subscribe({
      next: (response: any) => {
        if (this.currentPage === 0) {
          this.activityLogs = response.data || [];
        } else {
          this.activityLogs.push(...(response.data || []));
        }
        this.hasMore = response.pagination?.hasMore || false;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading activity logs:', error);
        
        if (error.status === 403) {
          this.error = 'Access denied. Activity logs are restricted to RoelSundiam only.';
        } else if (error.status === 401) {
          this.error = 'Authentication required. Please login as RoelSundiam.';
        } else {
          this.error = 'Failed to load activity logs. Please try again.';
          // Fallback to local logs for non-auth errors
          this.activityLogs = this.activityLogger.getLocalActivityLogs();
        }
        
        this.loading = false;
      }
    });
  }
  
  loadStats() {
    // Note: Stats endpoint would need to be implemented in the service
    // For now, we'll calculate basic stats from the logs
    this.calculateBasicStats();
  }
  
  calculateBasicStats() {
    if (!this.activityLogs.length) return;
    
    const userCounts: { [key: string]: { count: number; role: string } } = {};
    const actionCounts: { [key: string]: number } = {};
    const pageCounts: { [key: string]: number } = {};
    const dailyCounts: { [key: string]: number } = {};
    
    this.activityLogs.forEach(log => {
      // User stats
      const userKey = log.userId;
      if (!userCounts[userKey]) {
        userCounts[userKey] = { count: 0, role: log.userRole };
      }
      userCounts[userKey].count++;
      
      // Action stats
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      
      // Page stats
      pageCounts[log.page] = (pageCounts[log.page] || 0) + 1;
      
      // Daily stats
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    
    this.stats = {
      totalLogs: this.activityLogs.length,
      topUsers: Object.entries(userCounts)
        .map(([userId, data]) => ({ _id: { userId, userRole: data.role }, count: data.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      actionBreakdown: Object.entries(actionCounts)
        .map(([action, count]) => ({ _id: action, count }))
        .sort((a, b) => b.count - a.count),
      topPages: Object.entries(pageCounts)
        .map(([page, count]) => ({ _id: page, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      dailyActivity: Object.entries(dailyCounts)
        .map(([date, count]) => ({ _id: date, count }))
        .sort((a, b) => a._id.localeCompare(b._id))
    };
  }

  applyFilters() {
    if (!this.hasAccessToPage) {
      this.showErrorMessage('Please purchase page access first.');
      return;
    }

    // Check if user can afford filtering
    if (!this.coinService.canAfford('ACTIVITY_LOGS_FILTER')) {
      this.showInsufficientCoinsMessage('apply filters');
      return;
    }

    // Purchase filter access
    this.coinService.useCoins('ACTIVITY_LOGS_FILTER', 'Apply activity log filters').subscribe({
      next: (success) => {
        if (success) {
          this.currentPage = 0;
          this.loadActivityLogs();
          this.showSuccessMessage(`Filters applied! (${this.featureCosts.FILTER} coins used)`);
        } else {
          this.showInsufficientCoinsMessage('apply filters');
        }
      },
      error: (error) => {
        console.error('Failed to purchase filter access:', error);
        this.showErrorMessage('Failed to process coin payment for filters.');
      }
    });
  }

  clearFilters() {
    this.selectedUser = '';
    this.selectedAction = '';
    this.selectedUserRole = '';
    this.selectedPage = '';
    this.startDate = '';
    this.endDate = '';
    this.applyFilters();
  }

  loadMore() {
    if (this.hasMore && !this.loading) {
      this.currentPage++;
      this.loadActivityLogs();
    }
  }

  switchView(mode: 'logs' | 'stats') {
    if (!this.hasAccessToPage) {
      this.showErrorMessage('Please purchase page access first.');
      return;
    }

    if (mode === 'stats') {
      // Check if user can afford stats view
      if (!this.coinService.canAfford('ACTIVITY_STATS_VIEW')) {
        this.showInsufficientCoinsMessage('view activity statistics');
        return;
      }

      // Purchase stats access
      this.coinService.useCoins('ACTIVITY_STATS_VIEW', 'View activity statistics').subscribe({
        next: (success) => {
          if (success) {
            this.viewMode = mode;
            this.calculateBasicStats();
            this.showSuccessMessage(`Statistics view unlocked! (${this.featureCosts.STATS} coins used)`);
          } else {
            this.showInsufficientCoinsMessage('view statistics');
          }
        },
        error: (error) => {
          console.error('Failed to purchase stats access:', error);
          this.showErrorMessage('Failed to process coin payment for statistics.');
        }
      });
    } else {
      this.viewMode = mode;
    }
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleString();
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'admin': return '#f44336';
      case 'user': return '#4caf50';
      case 'anonymous': return '#ff9800';
      default: return '#9e9e9e';
    }
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'PAGE_ACCESS': return 'visibility';
      case 'VOTE_SUBMISSION': return 'how_to_vote';
      case 'TEAM_GENERATION': return 'groups';
      case 'PLAYER_MANAGEMENT': return 'people';
      case 'USER_LOGIN': return 'login';
      case 'USER_LOGOUT': return 'logout';
      default: return 'info';
    }
  }

  // Export data feature
  exportData() {
    if (!this.hasAccessToPage) {
      this.showErrorMessage('Please purchase page access first.');
      return;
    }

    // Check if user can afford export
    if (!this.coinService.canAfford('ACTIVITY_LOGS_EXPORT')) {
      this.showInsufficientCoinsMessage('export activity data');
      return;
    }

    // Purchase export access
    this.coinService.useCoins('ACTIVITY_LOGS_EXPORT', 'Export activity logs data').subscribe({
      next: (success) => {
        if (success) {
          this.performExport();
          this.showSuccessMessage(`Data exported successfully! (${this.featureCosts.EXPORT} coins used)`);
        } else {
          this.showInsufficientCoinsMessage('export data');
        }
      },
      error: (error) => {
        console.error('Failed to purchase export access:', error);
        this.showErrorMessage('Failed to process coin payment for export.');
      }
    });
  }

  private performExport() {
    const dataToExport = {
      logs: this.activityLogs,
      stats: this.stats,
      exportedAt: new Date().toISOString(),
      exportedBy: this.authService.getUser()?.username
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `activity-logs-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  // Coin system helper methods
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

  private showInsufficientCoinsMessage(action: string) {
    const message = `Insufficient coins to ${action}. Click the coin balance to purchase more.`;
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

  // Utility methods for template
  canAffordFeature(feature: string): boolean {
    return this.coinService.canAfford(feature);
  }

  getFeatureCost(feature: string): number {
    return this.coinService.getFeatureCost(feature);
  }
}
