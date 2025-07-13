import { Routes, CanActivateFn } from '@angular/router';
import { PollListComponent } from './pages/poll-list/poll-list.component';
import { PollDetailsComponent } from './pages/poll-details/poll-details.component';
import { PollResultsComponent } from './pages/poll-results/poll-results.component';
import { TeamsMatchesComponent } from './pages/teams-matches/teams-matches.component';
import { PlayersListComponent } from './pages/players-list/players-list.component';
import { PlayerFormComponent } from './pages/player-form/player-form.component';
import { ActivityLogsComponent } from './pages/activity-logs/activity-logs.component';
import { AdminPanelComponent } from './pages/admin-panel/admin-panel.component';
import { AboutDeveloperComponent } from './pages/about-developer/about-developer.component';
import { LoginComponent } from './pages/login/login.component';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.isAdmin()) {
    window.location.href = '/';
    return false;
  }
  return true;
};

export const routes: Routes = [
  { path: '', component: PollListComponent },
  { path: 'poll/:id', component: PollDetailsComponent },
  { path: 'poll/:id/results', component: PollResultsComponent, canActivate: [adminGuard] },
  { path: 'teams-matches', component: TeamsMatchesComponent },
  { path: 'login', component: LoginComponent },
  { path: 'players', component: PlayersListComponent, canActivate: [adminGuard] },
  { path: 'players/new', component: PlayerFormComponent, canActivate: [adminGuard] },
  { path: 'players/:id/edit', component: PlayerFormComponent, canActivate: [adminGuard] },
  { path: 'activity-logs', component: ActivityLogsComponent, canActivate: [adminGuard] },
  { path: 'admin-panel', component: AdminPanelComponent, canActivate: [adminGuard] },
  { path: 'about-developer', component: AboutDeveloperComponent },
  { path: '**', redirectTo: '' }
];
