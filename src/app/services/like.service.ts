import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class LikeService {

  private apiUrl = `${environment.api}/like`;


  constructor(private http : HttpClient) { }


  addLike(postId: string, userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, { postId, userId });
  }

  removeLike(postId: string, userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/remove`, { postId, userId });
  }
}
