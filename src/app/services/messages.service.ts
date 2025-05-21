import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../environments/environment'

@Injectable({
  providedIn: 'root',
})
export class MessagesService {

  private socket! : Socket

  private apiUrl = `${environment.api}/mess`; 
  private newMessageSubject = new Subject<any>();
 

  constructor(private http : HttpClient) {
    this.socket = io(environment.api, { transports: ['websocket', 'polling'] });
    this.listenForNewMessages();

  }

  private listenForNewMessages(): void {
    this.socket.on('newMessage', (message: any) => {
      this.newMessageSubject.next(message);  // Emitir mensaje recibido a través de un Subject
    });
  }

  getNewMessages(): Observable<any> {
    return this.newMessageSubject.asObservable();  // Devolver observable
  }// Asegúrate de que coincida con tu servidor


  sendMessage(senderId: string, receiverId: string, content: string): Observable<any> {
    const body = { senderId, receiverId, content };
    return this.http.post(`${this.apiUrl}/send`, body);
  }

  getMessages(senderId: string, receiverId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/chat/${senderId}/${receiverId}`);
  }
  OnNewMessage(): Observable<any> {
    return new Observable<any>((observer) => {
      this.socket.on('newMessage', (message: any) => {
        console.log('Mensaje recibido en tiempo real:', message);

        observer.next(message);
      });

      return () => this.socket.off('newMessage');
    });
  }
}
