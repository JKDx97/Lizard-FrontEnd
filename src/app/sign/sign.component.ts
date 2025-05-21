import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { RegisterService } from '../services/register.service';
import { ValidatorsService } from '../services/validators.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-sign',
  standalone: true,
  imports: [CommonModule , FormsModule,MatProgressBarModule],
  templateUrl: './sign.component.html',
  styleUrl: './sign.component.css'
})
export class SignComponent implements OnInit{
  password: string = '';
  passwordStrength: number = 0;
  userForm!: FormGroup;
  user = {
    name: '',
    lastName: '',
    day: 1,
    month: 1,
    year: 1970,
    genre: '',
    username: '',
    email: '',
    password: '',
  };
  isLoading = false; // Estado de carga
  usernameTaken: boolean = false; // Asegúrate de que sea `boolean`, no `Boolean`
  emailTaken: boolean = false; // Asegúrate de que sea `boolean`, no `Boolean`

  progress = 0; // Progreso de la barra
  days: number[] = [];
  months = [
    { label: 'Enero', value: 1 },
    { label: 'Febrero', value: 2 },
    { label: 'Marzo', value: 3 },
    { label: 'Abril', value: 4 },
    { label: 'Mayo', value: 5 },
    { label: 'Junio', value: 6 },
    { label: 'Julio', value: 7 },
    { label: 'Agosto', value: 8 },
    { label: 'Septiembre', value: 9 },
    { label: 'Octubre', value: 10 },
    { label: 'Noviembre', value: 11 },
    { label: 'Diciembre', value: 12 },
  ];
  availableYears: number[] = [];
  currentYear = new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private registerService: RegisterService,
    private validService: ValidatorsService,
    private router: Router,
    private authService : AuthService
  ) {}

  ngOnInit(): void {
    this.userForm = this.fb.group({
      day: [null],
      month: [null],
      year: [null],
    });

    this.initializeDays();
    this.initializeYears();
  }

  checkUsername() {
    this.validService.checkUsername(this.user.username).subscribe(
      (response: { isTaken: boolean }) => {
        this.usernameTaken = response.isTaken;
      },
      (error) => {
        console.error('Error al verificar el nombre de usuario:', error);
      }
    );
  }
  checkEmail() {
    this.validService.checkEmail(this.user.email).subscribe(
      (response: { isTaken: boolean }) => {
        this.emailTaken = response.isTaken;
      },
      (error) => {
        console.error('Error al verificar el nombre de usuario:', error);
      }
    );
  }

  initializeDays(): void {
    this.days = Array.from({ length: 31 }, (_, i) => i + 1);
  }

  initializeYears(): void {
    const maxYear = this.currentYear - 18; 
    const minYear = 1900; 
    this.availableYears = Array.from(
      { length: maxYear - minYear + 1 },
      (_, i) => maxYear - i
    );
  }

  onDateChange(): void {
    const selectedDay = this.userForm.get('day')?.value;
    const selectedMonth = this.userForm.get('month')?.value;

    if (selectedDay && selectedMonth) {
      this.updateAvailableYears(selectedDay, selectedMonth);
    }
  }

  updateAvailableYears(day: number, month: number): void {
    const currentDate = new Date();
    const minYear = 1900; 
    const maxYear = this.currentYear - 18; 

    const userBirthdayThisYear = new Date(this.currentYear, month - 1, day);

    if (userBirthdayThisYear <= currentDate) {
      this.availableYears = Array.from(
        { length: maxYear - minYear + 1 },
        (_, i) => maxYear - i
      );
    } else {
      const maxYearForFutureBirthday = maxYear - 1;
      this.availableYears = Array.from(
        { length: maxYearForFutureBirthday - minYear + 1 },
        (_, i) => maxYearForFutureBirthday - i
      );
    }
  }
  onSubmit(): void {
    this.isLoading = true;
    this.progress = 0;
  
    if (
      !this.user.name ||
      !this.user.lastName ||
      !this.user.username ||
      !this.user.email ||
      !this.user.password ||
      !this.user.day ||
      !this.user.month ||
      !this.user.year
    ) {
      console.error('Todos los campos son obligatorios.');
      this.isLoading = false;
      return;
    }
  
    // Verificar la fuerza de la contraseña
    if (this.passwordStrength <= 50) {
      console.error('La contraseña debe ser más fuerte para continuar.');
      this.isLoading = false;
      return;
    }
  
    const interval = setInterval(() => {
      if (this.progress < 100) {
        this.progress += 10;
      }
    }, 800);
  
    if (this.usernameTaken || this.emailTaken) {
      console.error(
        'El nombre de usuario o el correo electrónico ya están en uso.'
      );
      this.isLoading = false;
      return;
    }
  
    if (this.user.day && this.user.month && this.user.year) {
      const birthDate = new Date(
        this.user.year,
        this.user.month - 1,
        this.user.day
      );
      const dataToSend = {
        ...this.user,
        date: birthDate.toISOString().split('T')[0],
      };
  
      this.registerService.Sregister(dataToSend).subscribe(
        (response) => {},
        (error) => {},
        () => {
          clearInterval(interval);
          this.progress = 100;
          this.isLoading = false;
          this.resetForm();
        }
      );
      setTimeout(() => {
        clearInterval(interval);
        this.progress = 100;
        this.isLoading = false;
        this.resetForm();
      }, 8000);
    } else {
      console.error('Fecha de nacimiento no completa');
      this.isLoading = false;
    }
  }
  

  resetForm() {
    this.user = {
      name: '',
      lastName: '',
      day: 1,
      month: 1,
      year: 1970,
      genre: '',
      username: '',
      email: '',
      password: '',
    };
  }
  calculatePasswordStrength(password: string): void {
    let strength = 0;

    if (password.length >= 8) strength += 25; 
    if (/[A-Z]/.test(password)) strength += 25; 
    if (/[0-9]/.test(password)) strength += 25; 
    if (/[\W]/.test(password)) strength += 25; 

    this.passwordStrength = strength;
  }

  get progressBarColor(): string {
    return this.passwordStrength > 50 ? 'primary' : 'warn';
  }
  username: string = '';
  errorMsg: string = '';
  onLogin() {
    this.authService.login(this.username, this.password).subscribe({
      next: (data) => {
        console.log(data.msg); // Mostrar el mensaje de éxito
        this.router.navigate(['/principal'])
      },
      error: (error) => {
        this.errorMsg = error.msg; // Muestra el mensaje de error en la UI
      }
    });
  }
  onLogout(): void {
    this.authService.logout(); // Llama al método logout del servicio
    // Aquí puedes agregar lógica adicional, como redirigir al usuario a una página de inicio de sesión.
  }
}
