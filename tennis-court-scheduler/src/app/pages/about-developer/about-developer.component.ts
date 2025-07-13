import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-about-developer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './about-developer.component.html',
  styleUrls: ['./about-developer.component.scss']
})
export class AboutDeveloperComponent {
  skills = [
    'Angular', 'TypeScript', 'Node.js', 'Express.js', 'MongoDB', 
    'JavaScript', 'HTML5', 'CSS3', 'Material Design', 'REST APIs',
    'Git', 'Responsive Design', 'PWA', 'Docker', 'Azure/AWS'
  ];

  projects = [
    {
      name: 'Tennis Court Scheduler',
      description: 'A full-stack web application for managing tennis club scheduling, player management, and match coordination.',
      technologies: ['Angular', 'Node.js', 'MongoDB', 'Material Design'],
      features: ['Poll-based scheduling', 'Player management', 'Team generation', 'Activity tracking', 'Coin-based system']
    }
  ];

  // Contact information
  email = 'sundiamr@aol.com';
  githubUrl = 'https://github.com/roel-sundiam';
  linkedinUrl = 'https://www.linkedin.com/in/roel-sundiam-a86b864/';
  facebookUrl = 'https://www.facebook.com/bot.sundi';

  openLink(url: string) {
    window.open(url, '_blank');
  }

  sendEmail() {
    window.open(`mailto:${this.email}`, '_blank');
  }
}