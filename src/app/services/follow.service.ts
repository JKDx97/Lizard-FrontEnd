import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class FollowService {
  private apiUrl = `${environment.api}/foll`;
  private followersSubject = new BehaviorSubject<any[]>([]);
  followers$ = this.followersSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Seguir a un usuario
  followUser(userId: string, targetUserId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/follow`, { userId, targetUserId });
  }
  
  unfollowUser(userId: string, targetUserId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/unfollow`, { userId, targetUserId });
  }

  // Obtener la lista de seguidores y seguidos
  getFollowersAndFollowing(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${userId}/followers-following`);
  }
}
