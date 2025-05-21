import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class ValidatorsService {

  private ValidUrl = `${environment.api}/valid`

  constructor(private http : HttpClient) { }

  checkUsername(username: string): Observable<{ isTaken: boolean }> {
    return this.http.get<{ isTaken: boolean }>(`${this.ValidUrl}/checkUsername?username=${username}`)
  }

  checkEmail(email : string):Observable<{isTaken :boolean}>{
    return this.http.get<{isTaken : boolean}>(`${this.ValidUrl}/checkEmail?email=${email}`)
  }
}
