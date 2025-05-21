import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OtherProfileService } from '../services/other-profile.service';
import { CommonModule } from '@angular/common';
import { TimeAgoPipe } from '../time-ago.pipe';
import { FollowService } from '../services/follow.service';
import { AuthService } from '../services/auth.service';
import { MessagesService } from '../services/messages.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-other-profile',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe, FormsModule],
  templateUrl: './other-profile.component.html',
  styleUrl: './other-profile.component.css',
})
export class OtherProfileComponent implements OnInit {
  @Input() user: any;
  profile: any;
  posts: any[] = [];
  followers: any[] = [];
  followerCount: number = 0;

  following: any[] = [];
  isFollowing: boolean = false;
  constructor(
    private route: ActivatedRoute,
    private otherProfileService: OtherProfileService,
    private followService: FollowService,
    private authService: AuthService,
    private messageService: MessagesService
  ) {}

  isImage(fileName: string | null | undefined): boolean {
    if (!fileName) return false;
    return /\.(jpg|jpeg|png|gif|jfif)$/i.test(fileName);
  }

  isVideo(fileName: string | null | undefined): boolean {
    if (!fileName) return false;
    return /\.(mp4|mov|avi|mkv)$/i.test(fileName);
  }
  getPostUrl(photoPath: string): string {
    return `https://storage.googleapis.com/v1alpha-e6e24.appspot.com/${photoPath}`;
  }

  getPhotoUrl(filename: string): string {
    return `https://storage.googleapis.com/v1alpha-e6e24.appspot.com/${filename}`;
  }

  /////////////////////////////////////////////////////////
  //Video
  userHasInteracted = false;
  @ViewChild('videoPlayer', { static: false })
  videoPlayer!: ElementRef<HTMLVideoElement>;
  currentTime: string = '0:00';
  duration: string = '0:00';
  previousVolume: number = 1;
  mutedState: boolean = false;
  currentProgress: number = 0;
  isLoading: boolean = false;

  ngAfterViewInit() {
    window.addEventListener('click', () => (this.userHasInteracted = true));
    window.addEventListener('keydown', () => (this.userHasInteracted = true));
    window.addEventListener('scroll', this.checkVideoVisibility.bind(this));
    document.addEventListener(
      'visibilitychange',
      this.handleVisibilityChange.bind(this)
    );

    setTimeout(() => {
      if (this.videoPlayer) {
        const video: HTMLVideoElement = this.videoPlayer.nativeElement;

        video.addEventListener(
          'loadedmetadata',
          this.onLoadedMetadata.bind(this)
        );
        video.addEventListener('timeupdate', this.updateTime.bind(this));
      } else {
      }
    }, 100);
  }
  onLoadedMetadata(event: Event) {
    const video: HTMLVideoElement = event.target as HTMLVideoElement;
    this.duration = this.formatTime(video.duration);
    this.currentTime = this.formatTime(video.currentTime); // Asegurarse de mostrar el tiempo actual correctamente
  }

  updateTime() {
    const video: HTMLVideoElement = this.videoPlayer.nativeElement;
    this.currentTime = this.formatTime(video.currentTime); // Actualizar el tiempo transcurrido
    console.log('Current time updated:', this.currentTime); // Depurar
  }

  checkVideoVisibility() {
    const allVideos = document.querySelectorAll('video');
    const windowHeight =
      window.innerHeight || document.documentElement.clientHeight;
    let videoAlreadyPlaying = false;

    allVideos.forEach((video: HTMLVideoElement) => {
      const rect = video.getBoundingClientRect();
      const videoCenter = rect.top + rect.height / 2;

      if (
        videoCenter < windowHeight &&
        videoCenter > 0 &&
        !videoAlreadyPlaying
      ) {
        // Si el video ya está en reproducción, no cambiar
        if (this.videoPlayer?.nativeElement !== video) {
          // Desvincular eventos del video anterior
          if (this.videoPlayer) {
            this.removeVideoEvents(this.videoPlayer.nativeElement);
          }

          // Asignar el nuevo video visible y vincular eventos
          this.videoPlayer = new ElementRef(video);
          this.initializeVideoEvents();

          // Actualizar los tiempos con el nuevo video
          this.duration = this.formatTime(video.duration);
          this.currentTime = this.formatTime(video.currentTime);
        }

        // Configurar volumen y mute
        this.videoPlayer.nativeElement.volume = this.mutedState
          ? 0
          : this.previousVolume;
        this.videoPlayer.nativeElement.muted = this.mutedState;
        this.videoPlayer.nativeElement.play().catch((error) => {
          console.log('Error al reproducir el video: ', error);
        });
        videoAlreadyPlaying = true;
      } else {
        video.pause();
      }
    });
  }

  initializeVideoEvents() {
    if (this.videoPlayer) {
      const video: HTMLVideoElement = this.videoPlayer.nativeElement;

      // Añadir eventos solo para el video visible
      video.addEventListener(
        'loadedmetadata',
        this.onLoadedMetadata.bind(this)
      );
      video.addEventListener('timeupdate', this.updateTime.bind(this));

      // Actualizar el tiempo actual al cambiar de video
      this.updateTime();
    } else {
      console.error('Error: videoPlayer no encontrado');
    }
  }
  handleVisibilityChange() {
    const allVideos = document.querySelectorAll('video');

    if (document.hidden) {
      allVideos.forEach((video: HTMLVideoElement) => {
        video.pause();
        video.muted = this.mutedState;
        video.volume = this.mutedState ? 0 : this.previousVolume;
      });
    } else {
      allVideos.forEach((video: HTMLVideoElement) => {
        video.volume = this.mutedState ? 0 : this.previousVolume;
        if (!video.paused) {
          video.play();
        }
      });

      this.checkVideoVisibility();
    }
  }
  removeVideoEvents(video: HTMLVideoElement) {
    // Limpiar los eventos del video anterior
    video.removeEventListener(
      'loadedmetadata',
      this.onLoadedMetadata.bind(this)
    );
    video.removeEventListener('timeupdate', this.updateTime);
  }
  ngOnInit(): void {
    document.addEventListener(
        'visibilitychange',
        this.handleVisibilityChange.bind(this)
    );

    this.loadProfileOther();


   
}

  loadProfileOther(): void {
    const username = this.route.snapshot.paramMap.get('username');
    if (username) {
      this.otherProfileService.getProfileByUsername(username).subscribe({
        next: (data) => {
          this.user = data.user;
          this.profile = data.profile;
          this.posts = data.posts;
          this.followers = data.followers ?? [];
          this.followerCount = data.followers.length;
          this.following = data.following ?? []; // Usar coalescencia nula para asegurar que sea un array

          const userId = this.authService.getUserDataId(); // ID del usuario autenticado
          // Revisar el estado de seguimiento usando el ID del usuario autenticado
          const followingStatus = localStorage.getItem(
            `following_${userId}_${this.user.idC}`
          );
          if (followingStatus) {
            this.isFollowing = JSON.parse(followingStatus);
          }
        },
        error: (err) => {},
      });
    }
  }

  verid(): void {
    const id = this.user.id;
    alert(id);
  }

  ngOnDestroy() {
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange.bind(this)
    );
  }
  togglePlayPause(video: HTMLVideoElement) {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  updateProgress(video: HTMLVideoElement) {
    const progress = (video.currentTime / video.duration) * 100;
    this.currentProgress = progress;
  }

  seekVideo(video: HTMLVideoElement, event: Event) {
    const input = event.target as HTMLInputElement;
    const seekTime = (Number(input.value) / 100) * video.duration; // Convierte input.value a número
    video.currentTime = seekTime;
  }
  changeVolume(event: any) {
    const newVolume = parseFloat(event.target.value);

    const allVideos = document.querySelectorAll('video');
    allVideos.forEach((video: HTMLVideoElement) => {
      video.volume = newVolume;

      if (newVolume > 0) {
        this.mutedState = false;
        video.muted = false;
      } else {
        this.mutedState = true;
        video.muted = true;
      }
    });

    this.syncVolume(this.videoPlayer.nativeElement);
  }
  toggleMute(video: HTMLVideoElement) {
    this.mutedState = !this.mutedState;

    if (this.mutedState) {
      this.previousVolume = video.volume || 0.5;
      video.volume = 0;
    } else {
      video.volume = this.previousVolume;
    }

    const allVideos = document.querySelectorAll('video');
    allVideos.forEach((vid: HTMLVideoElement) => {
      vid.muted = this.mutedState;
      if (this.mutedState) {
        vid.volume = 0;
      } else {
        vid.volume = this.previousVolume;
      }
    });
  }

  syncVolume(changedVideo: HTMLVideoElement) {
    const newVolume = changedVideo.volume;
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach((video: HTMLVideoElement) => {
      if (video !== changedVideo) {
        video.volume = newVolume;
      }
    });

    this.previousVolume = newVolume;
  }
  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) {
      return '0:00';
    }
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }
  toggleFullScreen(video: HTMLVideoElement) {
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if ((<any>video).webkitRequestFullscreen) {
      (<any>video).webkitRequestFullscreen();
    } else if ((<any>video).msRequestFullscreen) {
      (<any>video).msRequestFullscreen();
    }
  }

  playVideoInModal(): void {
    const videoElement = document.querySelector(
      '#expandedModal video'
    ) as HTMLVideoElement; // Afirmación de tipo
    if (videoElement) {
      videoElement.play().catch((error) => {}); // Reproducir el video
    }
  }

  toggleFollow(): void {
    const userId = this.authService.getUserDataId();

    if (this.isFollowing) {
      this.followService.unfollowUser(userId, this.user.idC).subscribe(
        () => {
          this.isFollowing = false;
          this.updateFollowStatus(userId, this.user.idC, this.isFollowing);
          this.followerCount--; // Actualizar contador
        },
        (error) => console.error('Error al dejar de seguir al usuario', error)
      );
    } else {
      this.followService.followUser(userId, this.user.idC).subscribe(
        () => {
          this.isFollowing = true;
          this.updateFollowStatus(userId, this.user.idC, this.isFollowing);
          this.followerCount++; // Actualizar contador
        },
        (error) => console.error('Error al seguir al usuario', error)
      );
    }
  }
  private updateFollowStatus(
    userId: string,
    targetUserId: string,
    status: boolean
  ): void {
    localStorage.setItem(
      `following_${userId}_${targetUserId}`,
      JSON.stringify(status)
    );
  }

  openFollowersModal(): void {
    const modalElement = document.getElementById('followersModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  messages: any[] = [];
  newMessage: string = '';
  
  

  
}
