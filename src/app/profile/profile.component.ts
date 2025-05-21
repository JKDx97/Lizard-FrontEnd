import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PostService } from '../services/post.service';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ProfileService } from '../services/profile.service';
import { TimeAgoPipe } from '../time-ago.pipe';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TimeAgoPipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProfileComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('videoPlayer', { static: false })
  videoPlayer!: ElementRef<HTMLVideoElement>;
  @ViewChild('photoInput', { static: false })
  photoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('textArea', { static: false })
  textArea!: ElementRef<HTMLInputElement>;
  @ViewChild('exampleModal', { static: false }) exampleModal!: ElementRef;

  uploadProgress: number = 0; // Inicializa la variable para el progreso

  userPosts: any[] = [];
  selectedFile: File | null = null;
  selectedFileUrl: string | ArrayBuffer | null = null;
  textAreaHeight: string = '150px';
  username: string | null = null;
  user: any = null;
  post = {
    content: '',
  };
  selectedProfile: File | null = null;
  profile: any;
  currentProgress: number = 0;
  userHasInteracted = false;
  mutedState: boolean = false;
  previousVolume: number = 1;
  currentVolume: number = 1;
  isPlaying = false;
  currentTime: string = '0:00';
  duration: string = '0:00';
  isLoading: boolean = false;
  isFileUploaded: boolean = false; // Propiedad para controlar si el archivo se ha subido
  // Indica si el video está cargando

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private postService: PostService,
    private profileService: ProfileService,
    private cd: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  onImageError(event: any) {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/default.png';
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
    this.previewImage =
      this.getPhotoUrl(this.profile?.photo) || 'ruta/imagen_por_defecto.png';

    import('emoji-picker-element').then(() => {
      console.log('Emoji Picker Element loaded');
    });
    document.addEventListener(
      'visibilitychange',
      this.handleVisibilityChange.bind(this)
    );

    const username = this.route.snapshot.paramMap.get('username');
    if (username) {
      this.user = this.authService.getUserData();

      if (this.user && this.user._id) {
        this.loadUserPosts(this.user._id);
        this.onGetProfile(this.user._id);
        this.cd.detectChanges();

        this.postService.onNewPost().subscribe((newPost: any) => {
          this.ngZone.run(() => {
            if (newPost.author && newPost.author._id === this.user._id) {
              this.userPosts.unshift(newPost);
              this.cd.detectChanges();
            }
          });
        });
        this.profileService.OnNewprofile().subscribe((newProfile: any) => {
          this.ngZone.run(() => {
            this.profile = newProfile;
            this.cd.detectChanges();
          });
        });
      }
      if (!this.user || this.user.username !== username) {
        console.log(
          'No se encontraron datos del usuario, o el usuario es incorrecto.'
        );
      }
    } else {
      console.log('No se proporcionó un nombre de usuario en la ruta.');
    }
  }

  ngOnDestroy() {
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange.bind(this)
    );
  }

  //Profile
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.selectedFileUrl = reader.result;
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.selectedFileUrl = reader.result;
        };
        reader.readAsDataURL(file);
      }

      this.selectedFile = file;
      this.isFileUploaded = false; // Asegúrate de que no esté subido inicialmente
    }
  }

  previewImage: string = ''; // Imagen por defecto antes de la selección

  onFileProfile(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedProfile = file;

      // Crear un FileReader para leer la imagen y generar la vista previa
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImage = e.target.result; // Asignar la URL de la imagen seleccionada para la vista previa
      };
      reader.readAsDataURL(file);
    }
  }
  onSubmit() {
    const formData = new FormData();
    formData.append('authorId', this.user._id);
    formData.append('content', this.post.content);

    if (this.selectedFile) {
      formData.append('photo', this.selectedFile, this.selectedFile.name);
    }

    // Mostrar el spinner en la alerta
    Swal.fire({
      title: 'Cargando...',
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading(); // Muestra el loading
      },
    });

    this.postService.createPost(formData).subscribe(
      (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Post creado con éxito',
          text: 'Tu publicación se ha creado correctamente.',
          timer: 1500,
          showConfirmButton: false,
        });

        this.reset(); // Restablecer el formulario
      },
      (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un error al crear el post. Intenta nuevamente.',
          showConfirmButton: false,
          timer: 1500, // Opcional: tiempo para el error también
        });
      }
    );
  }

  loadUserPosts(userId: string): void {
    this.postService.getUserPosts(userId).subscribe((posts) => {
      this.userPosts = posts;
    });
  }

  onUploadProfile() {
    if (this.selectedProfile) {
      Swal.fire({
        title: 'Guardando...',
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading(); // Muestra el loading
        },
      });
      this.profileService
        .uploadPhoto(this.user._id, this.selectedProfile)
        .subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: 'Foto de perfil subido con éxito',
              text: 'Tu publicación se ha creado correctamente.',
              timer: 1500,
              showConfirmButton: false,
            });
          },
          error: (error) => {},
        });
    } else {
    }
  }

  onGetProfile(userId: string): void {
    this.profileService.getProfile(userId).subscribe(
      (data) => {
        this.profile = Array.isArray(data) ? data[0] : data;
        this.previewImage = this.getPhotoUrl(this.profile.photo); // Asignar la foto de perfil actual

        this.cd.detectChanges();
      },
      (error) => {
        console.error('Error loading photo', error);
      }
    );
  }

  countUploadedPhotos(): number {
    return this.userPosts.filter((post) => post?.photo).length;
  }
  //Modal
  modalContent: {
    photoUrl: string | undefined;
    author?: string;
    content?: string;
    createdAt?: string; // Agrega la fecha de creación aquí
  } | null = null;
  openModal(post: any): void {
    // Pausar el video antes de abrir el modal
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.pause();
    }

    // Establecer el contenido del modal con más detalles
    this.modalContent = {
      photoUrl: this.getPostUrl(post.photo),
      author: post.author?.username,
      content: post.content,
      createdAt: post.createdAt, // Asigna la fecha de creación
    };

    // Abrir el modal
    const modalElement = document.getElementById('expandedModal');
    const modal = new (window as any).bootstrap.Modal(modalElement);
    modal.show();

    modalElement?.addEventListener('shown.bs.modal', () => {
      // Lógica adicional cuando el modal se muestra
    });

    // Evento para limpiar el modal y detener el video cuando se cierra
    modalElement?.addEventListener('hidden.bs.modal', () => {
      this.destroyModal();
    });
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
  clearSelectedFile(): void {
    this.selectedFileUrl = null;
    this.selectedFile = null;
    this.isFileUploaded = false; // Resetea el estado cuando se borra el archivo
    this.photoInput.nativeElement.value = ''; // Resetea el input del archivo
  }
  reset() {
    this.textArea.nativeElement.value = ''; // Resetea el input del archivo

    this.selectedFile = null;
    this.textAreaHeight = '150px';
    this.clearSelectedFile();
    this.isEmojiPickerVisible = false; // Cerrar el emoji picker si está abierto
    // Llama a la función sin parámetros
  }
  isEmojiPickerVisible: boolean = false; // Controla la visibilidad del emoji picker

  toggleEmojiPicker(event: MouseEvent) {
    event.stopPropagation(); // Evitar que el evento click propague
    this.isEmojiPickerVisible = !this.isEmojiPickerVisible;
  }

  addEmoji(event: any) {
    const emoji = event.detail.unicode; // O el formato que prefieras
    this.post.content += emoji; // Agrega el emoji al contenido del textarea
  }

  playVideoInModal(): void {
    const videoElement = document.querySelector(
      '#expandedModal video'
    ) as HTMLVideoElement; // Afirmación de tipo
    if (videoElement) {
      videoElement.play().catch((error) => {
        console.error('Error al intentar reproducir el video:', error);
      }); // Reproducir el video
    }
  }

  destroyModal(): void {
    // Si el video está en reproducción, pausarlo
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.pause();
      // No limpiar el src aquí, solo asegurarte de que el video esté pausado
    }

    // Limpiar el contenido del modal (si es necesario)
    this.modalContent = null; // Esto limpia el contenido del modal, asegurando que se cargue nuevamente al abrir
  }
  isMenuOpen = false;

  openModalProfile() {
    const modalElement = document.getElementById('profileImageModal');
    if (modalElement) {
      const bootstrapModal = new (window as any).bootstrap.Modal(modalElement);
      bootstrapModal.show();
      this.closeMenu();
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
  closeMenu() {
    this.isMenuOpen = false;
  }

  openModalProfileUpload() {
    const modalElement = document.getElementById('uploadPhotoModal');
    if (modalElement) {
      const bootstrapModal = new (window as any).bootstrap.Modal(modalElement);
      bootstrapModal.show();
      this.closeMenu();
    }
  }
  onCancelProfile(): void {
    this.selectedProfile = null;
    this.previewImage = this.getPhotoUrl(this.profile.photo); // Asignar la foto de perfil actual

    // Restablecer el input file
    const inputElement = document.getElementById(
      'imageUpload'
    ) as HTMLInputElement;
    if (inputElement) {
      inputElement.value = ''; // Limpiar el input de archivo
    }
  }
}
