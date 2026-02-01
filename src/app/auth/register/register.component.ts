import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  hidePassword = true;
  returnUrl: string = '/';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, this.passwordValidator]],
      firstName: [''],
      lastName: ['']
    });
  }

  ngOnInit(): void {
    // Get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    // Redirect if already logged in
    if (this.authService.isAuthenticatedSync()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  /**
   * Custom password validator
   */
  passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    
    if (!value) {
      return null;
    }

    const errors: any = {};

    if (value.length < 8) {
      errors.minLength = 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(value)) {
      errors.uppercase = 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(value)) {
      errors.lowercase = 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(value)) {
      errors.number = 'Password must contain at least one number';
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    const formData = this.registerForm.value;

    this.authService.register(formData).subscribe({
      next: (user) => {
        this.snackBar.open(`Welcome, ${user.firstName || user.email}!`, 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        
        // Navigate to return URL
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open(error.message || 'Registration failed', 'Close', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  getEmailError(): string {
    const control = this.registerForm.get('email');
    if (control?.hasError('required')) {
      return 'Email is required';
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email';
    }
    return '';
  }

  getPasswordError(): string {
    const control = this.registerForm.get('password');
    if (control?.hasError('required')) {
      return 'Password is required';
    }
    if (control?.hasError('minLength')) {
      return control.errors?.['minLength'];
    }
    if (control?.hasError('uppercase')) {
      return control.errors?.['uppercase'];
    }
    if (control?.hasError('lowercase')) {
      return control.errors?.['lowercase'];
    }
    if (control?.hasError('number')) {
      return control.errors?.['number'];
    }
    return '';
  }

  getPasswordStrength(): string {
    const password = this.registerForm.get('password')?.value;
    if (!password) return '';

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return 'weak';
    if (strength <= 3) return 'medium';
    return 'strong';
  }
}
