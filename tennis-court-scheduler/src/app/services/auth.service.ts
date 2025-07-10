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

  private currentUser = {
    id: '1',
    name: 'John Doe',
    isAdmin: true
  };

  constructor(private router: Router) {}

  login(username: string, password: string): Observable<User | null> {
    // Mock admin credentials
    if (username === 'admin' && password === 'admin123') {
      const user: User = {
        username: 'admin',
        role: 'admin',
        token: 'mock-admin-token'
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
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.userSubject.value;
  }

  isAdmin(): boolean {
    return this.currentUser.isAdmin;
  }

  getCurrentUserId(): string {
    return this.currentUser.id;
  }

  getCurrentUserName(): string {
    return this.currentUser.name;
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