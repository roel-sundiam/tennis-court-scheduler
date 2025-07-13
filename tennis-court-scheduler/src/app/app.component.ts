import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from './services/auth.service';
import { ActivityLoggerService } from './services/activity-logger.service';
import { NavMenuComponent } from './components/nav-menu/nav-menu.component';
import { CoinBalanceComponent } from './components/coin-balance/coin-balance.component';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatMenuModule,
    MatDividerModule,
    NavMenuComponent,
    CoinBalanceComponent,
    FooterComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  navItems = [
    {
      label: 'Polls',
      route: '/',
      icon: 'poll',
      description: 'Vote on court availability',
      adminOnly: false
    },
    {
      label: 'Poll Results',
      route: '/poll/1/results',
      icon: 'analytics',
      description: 'View voting results and generate teams',
      adminOnly: true
    },
    {
      label: 'Players',
      route: '/players',
      icon: 'people',
      description: 'Manage player roster',
      adminOnly: true
    },
    {
      label: 'Teams & Matches',
      route: '/teams-matches',
      icon: 'sports_tennis',
      description: 'View team assignments',
      adminOnly: false
    },
    {
      label: 'Activity Logs',
      route: '/activity-logs',
      icon: 'history',
      description: 'Monitor user activity and page access',
      adminOnly: true,
      roelSundiamOnly: true
    },
    {
      label: 'Admin Panel',
      route: '/admin-panel',
      icon: 'admin_panel_settings',
      description: 'Manage coin system and club settings',
      adminOnly: true,
      roelSundiamOnly: true
    }
  ];

  constructor(
    public auth: AuthService, 
    private router: Router,
    private activityLogger: ActivityLoggerService
  ) {
    // Set up circular dependency resolution
    this.auth.setActivityLogger(this.activityLogger);
    // ActivityLoggerService is automatically initialized and starts logging page access
  }

  closeSidenav() {
    if (this.sidenav) {
      this.sidenav.close();
    }
  }

  // Check if navigation item should be visible
  isNavItemVisible(item: any): boolean {
    // If item is not admin-only, show to everyone
    if (!item.adminOnly) {
      return true;
    }

    // If user is not admin, don't show admin-only items
    if (!this.auth.isAdmin()) {
      return false;
    }

    // If item is RoelSundiam-only, check specific username
    if (item.roelSundiamOnly) {
      const user = this.auth.getUser();
      return user?.username === 'RoelSundiam';
    }

    // Regular admin item, show to all admins
    return true;
  }
}
