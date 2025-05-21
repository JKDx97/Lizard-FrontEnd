import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../environments/environment'

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private socket: Socket;

  private uploadUrl = `${environment.api}/profile`;

  constructor(private http: HttpClient) {
    this.socket = io(environment.api);
  }

  uploadPhoto(userId: string, file: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('photo', file);
    formData.append('userId', userId);

    return this.http
      .post<any>(this.uploadUrl, formData)
      .pipe(catchError(this.handleError));
  }

  getProfile(userId: string): Observable<any> {
    const url = `${this.uploadUrl}/perfil/${userId}`;
    return this.http.get<any>(url);
  }
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Unknown error!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(errorMessage);
  }
  OnNewprofile(): Observable<any> {
    return new Observable<any>((observer) => {
      this.socket.on('newProfile', (profile: any) => {
        observer.next(profile);
      });

      // Cleanup cuando el observable se cierre
      return () => this.socket.off('newProfile');
    });
  }
}
