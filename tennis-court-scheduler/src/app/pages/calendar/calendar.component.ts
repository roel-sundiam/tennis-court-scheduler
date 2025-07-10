import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatToolbarModule
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  calendarDays: any[] = [];
  isLoading = false;
  currentDate = new Date();

  ngOnInit() {
    this.generateCalendarDays();
  }

  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.generateCalendarDays();
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.generateCalendarDays();
  }

  goToToday() {
    this.currentDate = new Date();
    this.generateCalendarDays();
  }

  getMonthYearString(): string {
    return this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  getMatchStatusColor(status: string): string {
    return status === 'active' ? '#4CAF50' : '#1976d2';
  }

  getMatchStatusText(status: string): string {
    return status === 'active' ? 'Active' : 'Scheduled';
  }

  getTeamDisplay(team: any): string {
    return team?.name || 'TBD';
  }

  getSelectedDateMatches(): any[] {
    return [];
  }

  getSelectedDateString(): string {
    return this.currentDate.toLocaleDateString();
  }

  private generateCalendarDays() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    this.calendarDays = [];
    
    // Add empty days for the start of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      this.calendarDays.push({ date: null });
    }
    
    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      this.calendarDays.push({
        date: new Date(year, month, day),
        matches: [] // You would populate this with actual matches
      });
    }
  }
} 