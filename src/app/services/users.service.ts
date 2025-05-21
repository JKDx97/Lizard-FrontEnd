import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  private apiUrl = `${environment.api}/other/users`; // URL de tu backend


  constructor(private http : HttpClient) { }


  getAllUsers(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}
