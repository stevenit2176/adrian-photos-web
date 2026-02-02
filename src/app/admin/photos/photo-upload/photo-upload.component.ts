import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { CategoryService, Category } from '../../../services/category.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-photo-upload',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  templateUrl: './photo-upload.component.html',
  styleUrls: ['./photo-upload.component.scss']
})
export class PhotoUploadComponent implements OnInit {
  uploadForm: FormGroup;
  categories: Category[] = [];
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isDragging = false;
  isUploading = false;
  uploadProgress = 0;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private categoryService: CategoryService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.uploadForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      categoryIds: this.fb.array([], Validators.required),
      price: [0, [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => {
        this.snackBar.open('Failed to load categories', 'Close', { duration: 3000 });
        console.error('Error loading categories:', err);
      }
    });
  }

  get categoryIdsArray(): FormArray {
    return this.uploadForm.get('categoryIds') as FormArray;
  }

  onCategoryChange(categoryId: string, checked: boolean): void {
    if (checked) {
      this.categoryIdsArray.push(new FormControl(categoryId));
    } else {
      const index = this.categoryIdsArray.controls.findIndex(x => x.value === categoryId);
      this.categoryIdsArray.removeAt(index);
    }
  }

  isCategorySelected(categoryId: string): boolean {
    return this.categoryIdsArray.value.includes(categoryId);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File): void {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      this.snackBar.open('Please select a valid image file (JPEG, PNG, WebP, or GIF)', 'Close', { duration: 4000 });
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      this.snackBar.open('File size must be less than 10MB', 'Close', { duration: 4000 });
      return;
    }

    this.selectedFile = file;

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeFile(): void {
    this.selectedFile = null;
    this.imagePreview = null;
  }

  canSubmit(): boolean {
    return this.uploadForm.valid && !!this.selectedFile && !this.isUploading;
  }

  async onSubmit(): Promise<void> {
    if (!this.canSubmit() || !this.selectedFile) {
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('title', this.uploadForm.value.title);
    formData.append('description', this.uploadForm.value.description);
    formData.append('categoryIds', JSON.stringify(this.uploadForm.value.categoryIds));
    formData.append('price', this.uploadForm.value.price.toString());

    this.http.post(`${environment.apiUrl}/photos/upload`, formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = Math.round(100 * event.loaded / (event.total || 1));
        } else if (event.type === HttpEventType.Response) {
          this.snackBar.open('Photo uploaded successfully!', 'View', { duration: 5000 })
            .onAction()
            .subscribe(() => {
              this.router.navigate(['/admin/photos']);
            });
          this.resetForm();
        }
      },
      error: (err) => {
        console.error('Upload error:', err);
        const errorMessage = err.error?.error?.message || 'Failed to upload photo';
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        this.isUploading = false;
        this.uploadProgress = 0;
      }
    });
  }

  resetForm(): void {
    this.uploadForm.reset({ price: 0 });
    this.categoryIdsArray.clear();
    this.selectedFile = null;
    this.imagePreview = null;
    this.isUploading = false;
    this.uploadProgress = 0;
  }

  cancel(): void {
    this.router.navigate(['/admin/photos']);
  }
}
