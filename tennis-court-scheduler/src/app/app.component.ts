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
import { NavMenuComponent } from './components/nav-menu/nav-menu.component';

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
    NavMenuComponent
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
    }
  ];

  constructor(public auth: AuthService, private router: Router) {}

  closeSidenav() {
    if (this.sidenav) {
      this.sidenav.close();
    }
  }
}
