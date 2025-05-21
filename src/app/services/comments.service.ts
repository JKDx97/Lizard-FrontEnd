import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private apiUrl = `${environment.api}`; // URL de tu API


  constructor(private http : HttpClient) { }

  getComments(postId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/comm/posts/${postId}/comments`);
  }

  addComment(content: string, postId: string, userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/comm/comments`, { content, postId, userId });
  }}
