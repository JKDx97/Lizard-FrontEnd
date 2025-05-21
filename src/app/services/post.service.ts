import { HttpClient, HttpRequest, HttpEventType } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private apiUrl = `${environment.api}/post/`;
  private postUser = `${environment.api}/post/posts`;

  private socket! : Socket

  constructor(private http: HttpClient) {
    this.socket = io(environment.api)
  }

  createPost(postData: FormData): Observable<any> {
    const req = new HttpRequest('POST', this.apiUrl, postData, {
      reportProgress: true, // Habilitar el seguimiento del progreso
    });

    return new Observable(observer => {
      this.http.request(req).subscribe(event => {
        // Monitorear el progreso de la subida
        if (event.type === HttpEventType.UploadProgress) {
          if (event.total) {
            const percentDone = Math.round((event.loaded / event.total) * 100);
            observer.next({ status: 'progress', percent: percentDone });
          }
        } else if (event.type === HttpEventType.Response) {
          observer.next({ status: 'done', response: event.body });
          observer.complete();
        }
      }, error => {
        observer.error(error);
      });
    });
  }

  getUserPosts(authorId: string): Observable<any> {
    return this.http.get<any>(`${this.postUser}/${authorId}`);
  }

  onNewPost(): Observable<any> {
    return new Observable<any>((observer) => {
      this.socket.on('newPost', (post: any) => {
        observer.next(post);
      });

      // Cleanup cuando el observable se cierre
      return () => this.socket.off('newPost');
    });
  }

  getRandomPosts(limit: number = 10, offset: number = 0): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/random-posts?limit=${limit}&offset=${offset}`);
  }


}
