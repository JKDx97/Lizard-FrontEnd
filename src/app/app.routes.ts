import { Routes } from '@angular/router';
import { SignComponent } from './sign/sign.component';
import { PrincipalComponent } from './principal/principal.component';
import { authGuard } from './guard/auth.guard';
import { ProfileComponent } from './profile/profile.component';
import { OtherProfileComponent } from './other-profile/other-profile.component';
import { MessagesComponent } from './messages/messages.component';
import { FollowingComponent } from './following/following.component';

export const routes: Routes = [
    {path : '' , component:SignComponent},
    {path : 'principal' , component:PrincipalComponent, canActivate : [authGuard]},
    {path : 'direct/inbox' , component:FollowingComponent , canActivate : [authGuard]},
    {path : 'perfil/:username' , component:ProfileComponent , canActivate : [authGuard]},
    {path : 'profile/:username' , component:OtherProfileComponent , canActivate: [authGuard]}
];
