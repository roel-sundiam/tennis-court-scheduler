import { Component, Input } from '@angular/core';
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
      label: 'Calendar',
      route: '/calendar',
      icon: 'calendar_month',
      description: 'View matches and schedule',
      adminOnly: false
    }
  ];

  user: User | null = null;

  constructor(public auth: AuthService, private router: Router) {
    this.auth.user$.subscribe(user => this.user = user);
  }

  onLogin() {
    this.router.navigate(['/login']);
    this.closeSidenav();
  }

  onLogout() {
    this.auth.logout();
    this.closeSidenav();
  }

  openSidenav() {}
} 