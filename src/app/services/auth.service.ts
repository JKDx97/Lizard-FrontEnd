import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private socket!: Socket;
  private isLoggedIn = false; 
  private userDataSubject = new BehaviorSubject<any>(null); 
  userData$ = this.userDataSubject.asObservable(); 

  constructor() {
    this.socket = io(`${environment.api}`);
    this.isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const storedUserData = JSON.parse(localStorage.getItem('userData') || 'null');
    if (storedUserData) {
      this.userDataSubject.next(storedUserData); 
    }
  }

  login(username: string, password: string): Observable<any> {
    return new Observable((observer) => {
      if (!this.socket.connected) {
        this.socket.connect();
      }
  
      this.socket.emit('login', { username, password });
  
      this.socket.on('login_success', (data) => {
        this.isLoggedIn = true;
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userData', JSON.stringify(data.user)); 
        this.userDataSubject.next(data.user); 
        observer.next(data);
        observer.complete();
      });
  
      this.socket.on('login_error', (error) => {
        observer.error(error);
      });
    });
  }

  getUserData() {
    return this.userDataSubject.getValue();
  }

  getUserDataId(){
    return this.userDataSubject.value?._id
  }
  getUserUsername(){
    return this.userDataSubject.value?._username
  }

  logout(): void {
    this.isLoggedIn = false;
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userData');
    this.userDataSubject.next(null); 

    this.socket.emit('logout');
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  isAuthenticated(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }
}
