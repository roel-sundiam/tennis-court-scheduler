import { Injectable } from '@angular/core';
import { PollOption } from '../mock-data/mock-poll';

@Injectable({
  providedIn: 'root'
})
export class DateUtilsService {

  constructor() { }

  /**
   * Generate poll options for the next 7 days starting from tomorrow (date only, no time slots)
   */
  generateWeeklyOptions(): PollOption[] {
    const options: PollOption[] = [];
    const today = new Date();
    
    // Generate options for the next 7 days starting from tomorrow
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dateString = this.formatDate(date);
      
      options.push({
        id: dateString,
        date: dateString,
        time: '' // No specific time, just the date
      });
    }
    
    return options;
  }



  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Format date for display (e.g., "Monday, June 15")
   */
  formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  }



  /**
   * Check if a date is today
   */
  isToday(dateString: string): boolean {
    const today = new Date();
    const date = new Date(dateString);
    return date.toDateString() === today.toDateString();
  }

  /**
   * Check if a date is tomorrow
   */
  isTomorrow(dateString: string): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = new Date(dateString);
    return date.toDateString() === tomorrow.toDateString();
  }

  /**
   * Get a friendly date label
   */
  getFriendlyDateLabel(dateString: string): string {
    if (this.isTomorrow(dateString)) {
      return 'Tomorrow';
    } else {
      return this.formatDateForDisplay(dateString);
    }
  }
} 