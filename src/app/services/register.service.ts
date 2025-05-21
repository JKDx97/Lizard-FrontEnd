import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class RegisterService {

  private registerUrl = `${environment.api}/register`

  constructor(private http : HttpClient) { }

  Sregister(user : any):Observable<any>{
    return this.http.post<any>(this.registerUrl , user)
  }


}
