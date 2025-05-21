import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class OtherProfileService {

  private otherProfileUrl = `${environment.api}/other/user/username`

  constructor(private http : HttpClient) { }


  getProfileByUsername(username: string): Observable<any> {
    return this.http.get(`${this.otherProfileUrl}/${username}/profile`);
  }
}
