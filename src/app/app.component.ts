import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ProfileService } from './services/profile.service';
import { UsersService } from './services/users.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterLink, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  title = 'Lizard';
  showSidebar: boolean = true;
  user: any;
  private userSubscription: Subscription;
  profile: any;
  isMenuOpen = false;
  showModal = false; // Controla la visibilidad del modal
  modalMessage = '';
  users: any[] = [];
  searchQuery: string = '';
  filteredUsers: any[] = [];
  recentSearches: any[] = []; // Añade un array para las búsquedas recientes

  loggedUser: string | null = null; // Variable para almacenar el username logueado

  constructor(
    private router: Router,
    private authService: AuthService,
    private profileService: ProfileService,
    private cd: ChangeDetectorRef,
    private usersServices: UsersService
  ) {
    this.userSubscription = this.authService.userData$.subscribe((userData) => {
      this.user = userData; // Actualiza los datos del usuario cuando cambien
    });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const username =
          this.router.routerState.snapshot.root.firstChild?.params['username']; // Ajusta para obtener el username
        if (username) {
          this.onGetProfileByUsername(username); // Llama al método para cargar el perfil
        }
        this.showSidebar = this.router.url !== '/'; // Oculta el sidebar cuando la ruta es '/'
      }
    });
  }
  onGetProfileByUsername(username: string): void {
    this.profileService.getProfile(username).subscribe((data) => {
      this.profile = Array.isArray(data) ? data[0] : data; // Asignar el primer elemento si es un arreglo
      this.cd.detectChanges();
    });
  }
  ngOnInit(): void {
    this.loadAllUsers();
    this.loadRecentSearches();

    this.authService.userData$.subscribe((userData) => {
      if (userData) {
        this.loggedUser = userData.username;
        this.user = userData;
        this.onGetProfile(userData._id); // Mover esta llamada aquí
      }
    });
  }
  getProfileLink(username: string): string {
    // Si el username del usuario seleccionado es el mismo que el del usuario logueado, redirige a '/perfil'
    return username === this.loggedUser
      ? `/perfil/${username}`
      : `/profile/${username}`;
  }
  loadAllUsers() {
    this.usersServices.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
      },
    });
  }
  onSearch(): void {
    const query = this.searchQuery.toLowerCase();

    if (query) {
      this.filteredUsers = this.users.filter(
        (user) =>
          (user.user.name && user.user.name.toLowerCase().includes(query)) ||
          (user.user.lastName &&
            user.user.lastName.toLowerCase().includes(query)) ||
          (user.user.username &&
            user.user.username.toLowerCase().includes(query))
      );
    } else {
      this.filteredUsers = this.recentSearches; // Muestra búsquedas recientes si el input está vacío
    }
  }
  loadRecentSearches(): void {
    if (!this.user) return; // Asegurarse de que hay un usuario logeado

    const key = `recentSearches_${this.user._id}`; // Clave específica para cada usuario
    this.recentSearches = JSON.parse(localStorage.getItem(key) || '[]'); // Carga las búsquedas recientes
    this.filteredUsers = this.recentSearches; // Asigna las búsquedas recientes al array filtrado
  }

  // Método para ocultar el sidebar
  isSidebarCollapsed: boolean = false; // Estado inicial del sidebar
  isCustomPanelOpen: boolean = false; // Estado del panel personalizado

  // Método para alternar el colapso del sidebar
  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    this.isCustomPanelOpen = !this.isCustomPanelOpen;

    // Enfocar el input si se abre el panel
    if (this.isCustomPanelOpen && this.searchInput) {
      setTimeout(() => {
        this.searchInput.nativeElement.focus(); // Enfocar el input
      });
    }

    this.loadRecentSearches(); // Cargar búsquedas recientes al abrir el panel
  }

  clearRecentSearches(): void {
    if (!this.user) return; // Asegurarse de que hay un usuario logeado

    const key = `recentSearches_${this.user._id}`; // Clave específica para cada usuario
    localStorage.removeItem(key); // Eliminar búsquedas recientes del localStorage
    this.recentSearches = []; // Limpiar el array que contiene las búsquedas en la vista
    this.filteredUsers = []; // Limpiar el array filtrado
  }

  logout(): void {
    this.authService.logout();
    this.closeMenu();
    this.router.navigate(['/']);
  }

  ngOnDestroy() {
    // Desuscribirse cuando el componente se destruye para evitar fugas de memoria
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  onGetProfile(userId: string): void {
    this.profileService.getProfile(userId).subscribe(
      (data) => {
        this.profile = Array.isArray(data) ? data[0] : data; // Asignar el primer elemento si es un arreglo
        this.cd.detectChanges(); // Forzar la detección de cambios
      },
      (error) => {}
    );
  }
  getPhotoUrl(filename: string): string {
    return `https://storage.googleapis.com/v1alpha-e6e24.appspot.com/${filename}`;
  }
  closeCustomPanel(user: any): void {
    this.isCustomPanelOpen = false;
    this.isSidebarCollapsed = false;
    this.searchQuery = '';

    if (!this.user) return;

    const key = `recentSearches_${this.user._id}`;
    const storedSearches = JSON.parse(localStorage.getItem(key) || '[]');
    const userExists = storedSearches.some(
      (stored: any) => stored.user.username === user.user.username
    );

    if (!userExists) {
      storedSearches.unshift(user);
    }

    // Guardar solo hasta 10 búsquedas recientes
    localStorage.setItem(key, JSON.stringify(storedSearches.slice(0, 10)));

    // Navegar al perfil del usuario seleccionado
    const profileLink = this.getProfileLink(user.user.username);
    this.router.navigate([profileLink]).then(() => {
      // Recargar la página después de la navegación
      window.location.reload();
    });

    // Cargar búsquedas recientes
    this.loadRecentSearches();
  }
  removeUser(user: any) {
    this.filteredUsers = this.filteredUsers.filter((u) => u !== user);
  }
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
  closeMenu() {
    this.isMenuOpen = false;
  }
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const targetElement = event.target as HTMLElement;

    // Verifica si el clic fue fuera del menú
    if (!targetElement.closest('.menu-container')) {
      this.closeMenu();
    }
  }
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // Verifica si se presionó la tecla Esc
    if (event.key === 'Escape') {
      this.closeMenu();
    }
  }
}
