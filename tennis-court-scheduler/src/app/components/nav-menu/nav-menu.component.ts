import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { AuthService, User } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nav-menu',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule
  ],
  templateUrl: './nav-menu.component.html',
  styleUrls: ['./nav-menu.component.scss']
})
export class NavMenuComponent {
  @Input() closeSidenav: () => void = () => {};
  menuItems = [
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

  user: User | null = null;

  constructor(
    public auth: AuthService, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.auth.user$.subscribe(user => {
      this.user = user;
      // Use markForCheck instead of detectChanges to avoid assertion error
      this.cdr.markForCheck();
    });
  }

  onLogin() {
    this.router.navigate(['/login']);
    this.closeSidenav();
  }

  onLogout() {
    this.auth.logout();
    this.closeSidenav();
  }

  // Check if menu item should be visible
  isMenuItemVisible(item: any): boolean {
    const currentUser = this.auth.getUser();

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
      return currentUser?.username === 'RoelSundiam';
    }

    // Regular admin item, show to all admins
    return true;
  }

  openSidenav() {}
} 