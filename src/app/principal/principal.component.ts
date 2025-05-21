import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PostService } from '../services/post.service';
import { ProfileService } from '../services/profile.service';
import Swal from 'sweetalert2';
import { TimeAgoPipe } from '../time-ago.pipe';
import { LikeService } from '../services/like.service';
import { CommentsService } from '../services/comments.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-principal',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe,FormsModule],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.css',
})
export class PrincipalComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() posts: any[] = [];
  isLoading = false;
  offset = 0; // Desplazamiento inicial
  limit = 10; // Número de posts a cargar por cada solicitud
  allPostsLoaded = false;

  @ViewChild('videoPlayer', { static: false })
  videoPlayer!: ElementRef<HTMLVideoElement>;

  currentProgress: number = 0;
  userHasInteracted = false;
  mutedState: boolean = false;
  previousVolume: number = 1;
  currentTime: string = '0:00';
  duration: string = '0:00';

  constructor(
    private postService: PostService,
    private authService: AuthService,
    private likeService: LikeService,
    private commentService : CommentsService
  ) {}

  loadRandomPosts(): void {
    if (this.isLoading || this.allPostsLoaded) return;

    this.isLoading = true;

    this.postService.getRandomPosts(this.limit, this.offset).subscribe({
      next: (data: any) => {
        if (data.length === 0) {
          this.allPostsLoaded = true;
        } else {
          const userId = this.authService.getUserDataId(); // Obtener el ID del usuario logueado
          data.forEach((post: any) => {
            // Verificar el estado de 'me gusta' en localStorage y aplicarlo
            post.userHasLiked = this.isLiked(post._id, userId);
          });
          this.posts = [...this.posts, ...data];
          this.offset += this.limit;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar posts aleatorios', error);
        this.isLoading = false;
      },
    });
  }

  isLiked(postId: string, userId: string): boolean {
    return !!localStorage.getItem(`liked_${postId}_${userId}`); // Usar userId en la clave
  }

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
        console.error('Error: videoPlayer no encontrado');
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
    const allVideos = document.querySelectorAll('video');

    allVideos.forEach((video: HTMLVideoElement) => {
      // Actualizar duración y tiempo transcurrido cuando se cargan los metadatos
      video.addEventListener('loadedmetadata', () => {
        this.duration = this.formatTime(video.duration);
        this.currentTime = this.formatTime(video.currentTime);
      });

      // Actualizar el progreso en cada cambio de tiempo
      video.addEventListener('timeupdate', () => {
        this.currentTime = this.formatTime(video.currentTime);
        this.updateProgress(video);
      });
    });
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
    this.loadRandomPosts();

    document.addEventListener(
      'visibilitychange',
      this.handleVisibilityChange.bind(this)
    );
  }

  selectPost(post: any) {
    // Mostrar alerta con el ID del post (o cualquier otro dato)
    alert(`Post seleccionado: ID = ${post._id}`);
  }
  ngOnDestroy() {
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange.bind(this)
    );
  }

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

  //Video
  togglePlayPause(video: HTMLVideoElement) {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  updateProgress(video: HTMLVideoElement) {
    this.currentProgress = (video.currentTime / video.duration) * 100;
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

  toggleLike(post: any) {
    const userId = this.authService.getUserDataId(); // Obtener el ID del usuario logueado
    this.likeService.addLike(post._id, userId).subscribe((response: any) => {
      if (response.message === 'Me gusta agregado') {
        post.likesCount++;
        post.userHasLiked = true; // Mantener el estado en rojo
        localStorage.setItem(`liked_${post._id}_${userId}`, 'true'); // Guardar en localStorage
      } else if (response.message === 'Me gusta eliminado') {
        post.likesCount--;
        post.userHasLiked = false; // Cambiar el estado a gris
        localStorage.removeItem(`liked_${post._id}_${userId}`); // Remover de localStorage
      }
    });
  }
  selectedPost: any;
  newCommentText: string = '';
  comments: any[] = [];

  openCommentsModal(post: any) {
    this.selectedPost = { ...post, comments: post.comments || [] }; // Asegura que comments exista
    this.loadComments(post._id);
  }
  loadComments(postId: string) {
    this.commentService.getComments(postId).subscribe((comments) => {
      this.comments = comments;
      if (this.selectedPost) {
        this.selectedPost.comments = comments; // Actualiza comments en el post seleccionado
      }
      console.log('Data comentarios: ' , comments);
    });
  }
  addComment() {
    const userId = this.authService.getUserDataId();
    if (this.newCommentText.trim()) {
      this.commentService.addComment(this.newCommentText, this.selectedPost._id, userId).subscribe((newComment) => {
        // Comprueba si el autor se ha devuelto correctamente
        if (!newComment.author) {
          newComment.author = { username: this.authService.getUserUsername() }; // Usa el nombre de usuario del authService si no está en la respuesta
        }
        
        // Evita duplicación al agregar solo a selectedPost.comments
        this.selectedPost.comments.unshift(newComment);
        
        this.newCommentText = ''; // Limpia el campo
      });
    }
  }
  
}
