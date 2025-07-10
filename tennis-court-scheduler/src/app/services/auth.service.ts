import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';

export interface User {
  username: string;
  role: 'admin' | 'user';
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  user$ = this.userSubject.asObservable();


  constructor(private router: Router) {}

  login(username: string, password: string): Observable<User | null> {
    // Mock admin credentials
    const adminUsers = [
      { username: 'admin', password: 'admin123' },
      { username: 'sundi', password: 'sundi123' },
      { username: 'VGTennisMorningCub', password: 'VGTennis123' }  // VG Tennis Morning Club admin
    ];
    
    // Check if credentials match any admin user
    const adminMatch = adminUsers.find(admin => 
      admin.username === username && admin.password === password
    );
    
    if (adminMatch) {
      const user: User = {
        username: adminMatch.username,
        role: 'admin',
        token: `mock-admin-token-${adminMatch.username}`
      };
      this.setUser(user);
      return of(user);
    }
    
    // Mock regular user
    if (username === 'user' && password === 'user123') {
      const user: User = {
        username: 'user',
        role: 'user',
        token: 'mock-user-token'
      };
      this.setUser(user);
      return of(user);
    }
    return of(null);
  }

  logout() {
    localStorage.removeItem('auth_user');
    this.userSubject.next(null);
    this.router.navigate(['/']);
  }

  isLoggedIn(): boolean {
    return !!this.userSubject.value;
  }

  isAdmin(): boolean {
    const user = this.userSubject.value;
    return user?.role === 'admin';
  }

  getCurrentUserId(): string {
    const user = this.userSubject.value;
    return user?.username || '';
  }

  getCurrentUserName(): string {
    const user = this.userSubject.value;
    return user?.username || '';
  }

  getUser(): User | null {
    return this.userSubject.value;
  }

  private setUser(user: User) {
    localStorage.setItem('auth_user', JSON.stringify(user));
    this.userSubject.next(user);
  }

  private getStoredUser(): User | null {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  }
} 