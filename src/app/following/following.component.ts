import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { FollowService } from '../services/follow.service';
import { CommonModule } from '@angular/common';
import { MessagesComponent } from '../messages/messages.component';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-following',
  standalone: true,
  imports: [CommonModule, MessagesComponent],
  templateUrl: './following.component.html',
  styleUrls: ['./following.component.css'],
})
export class FollowingComponent implements OnInit {
  followers: any[] = [];
  following: any[] = [];
  selectedUser: any = null;
  @ViewChild(MessagesComponent) messagesComponent!: MessagesComponent;

  constructor(
    private authService: AuthService,
    private followService: FollowService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadFollowersAndFollowing();
  }

  loadFollowersAndFollowing(): void {
    const userId = this.authService.getUserDataId();
    this.followService.getFollowersAndFollowing(userId).subscribe(
      (data) => {
        this.following = data.following;
        console.log('Following:', this.following);
        console.log('Data received:', data);

        this.selectUserFromUrl();
      },
      (error) => {
        console.error('Error fetching followers and following:', error);
      }
    );
  }

  selectUser(user: any): void {
    this.selectedUser = user;
    this.cdr.detectChanges();

    if (this.messagesComponent) {
      this.messagesComponent.subscribeToNewMessages();
    }

    this.router.navigate(['/direct/inbox'], {
      queryParams: { userId: user.credentials._id },
      replaceUrl: true,
    });
    if (window.innerWidth <= 768) {
      this.isSidebarOpen = false;
    }
  }

  selectUserFromUrl(): void {
    this.route.queryParams.subscribe((params) => {
      const userId = params['userId'];
      if (userId) {
        this.selectedUser = this.following.find(
          (user) => user.credentials._id === userId
        );
        if (this.selectedUser && this.messagesComponent) {
          this.messagesComponent.loadMessages();
          this.cdr.detectChanges();
        }
      }
    });
  }
  getPhotoUrl(filename: string): string {
    return `https://storage.googleapis.com/v1alpha-e6e24.appspot.com/${filename}`;
  }
  isSidebarOpen = false;

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
