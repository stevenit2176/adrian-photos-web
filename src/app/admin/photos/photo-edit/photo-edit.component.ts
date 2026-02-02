import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PhotoService, Photo } from '../../../services/photo.service';
import { CategoryService, Category } from '../../../services/category.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-photo-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatCheckboxModule
  ],
  templateUrl: './photo-edit.component.html',
  styleUrls: ['./photo-edit.component.scss']
})
export class PhotoEditComponent implements OnInit {
  editForm!: FormGroup;
  photo: Photo | null = null;
  categories: Category[] = [];
  isLoading = false;
  isSaving = false;
  photoId: string = '';
  
  // File upload properties
  selectedFile: File | null = null;
  newImagePreview: string | null = null;
  isUploading = false;
  uploadProgress = 0;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private photoService: PhotoService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    
    this.photoId = this.route.snapshot.params['id'];
    if (this.photoId) {
      this.loadPhoto();
    }
  }

  initForm(): void {
    this.editForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.maxLength(1000)]],
      categoryIds: this.fb.array([], Validators.required),
      price: [0, [Validators.required, Validators.min(0)]],
      isActive: [true]
    });
  }

  get categoryIdsArray(): FormArray {
    return this.editForm.get('categoryIds') as FormArray;
  }

  onCategoryChange(categoryId: string, checked: boolean): void {
    if (checked) {
      this.categoryIdsArray.push(new FormControl(categoryId));
    } else {
      const index = this.categoryIdsArray.controls.findIndex(control => control.value === categoryId);
      if (index >= 0) {
        this.categoryIdsArray.removeAt(index);
      }
    }
  }

  isCategorySelected(categoryId: string): boolean {
    return this.categoryIdsArray.controls.some(control => control.value === categoryId);
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.snackBar.open('Failed to load categories', 'Close', { duration: 3000 });
        console.error('Error loading categories:', err);
      }
    });
  }

  loadPhoto(): void {
    this.isLoading = true;
    this.photoService.getPhotoById(this.photoId).subscribe({
      next: (photo) => {
        this.photo = photo;
        
        // Pre-populate the category checkboxes
        this.categoryIdsArray.clear();
        if (photo.categoryIds && photo.categoryIds.length > 0) {
          photo.categoryIds.forEach(categoryId => {
            this.categoryIdsArray.push(new FormControl(categoryId));
          });
        }
        
        this.editForm.patchValue({
          title: photo.title,
          description: photo.description,
          price: photo.price / 100, // Convert cents to dollars
          isActive: photo.isActive
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.snackBar.open('Failed to load photo', 'Close', { duration: 3000 });
        console.error('Error loading photo:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/admin/photos']);
      }
    });
  }

  getPhotoUrl(): string {
    if (!this.photo) return '';
    return this.photoService.getPhotoUrl(this.photo.r2Key);
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
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.snackBar.open('File size must be less than 10MB', 'Close', { duration: 4000 });
      return;
    }

    this.selectedFile = file;

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.newImagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeNewImage(): void {
    this.selectedFile = null;
    this.newImagePreview = null;
  }

  onSubmit(): void {
    if (this.editForm.invalid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    // If there's a new file, upload it first
    if (this.selectedFile) {
      this.uploadNewPhoto();
    } else {
      this.updatePhotoMetadata();
    }
  }

  private uploadNewPhoto(): void {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.isSaving = true;
    this.uploadProgress = 0;

    const categoryIds = this.categoryIdsArray.value;
    
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('title', this.editForm.value.title);
    formData.append('description', this.editForm.value.description);
    formData.append('categoryIds', JSON.stringify(categoryIds));
    formData.append('price', (Math.round(this.editForm.value.price * 100)).toString());
    formData.append('isActive', this.editForm.value.isActive.toString());
    formData.append('replacePhotoId', this.photoId); // Tell backend to replace this photo

    this.http.post(`${environment.apiUrl}/photos/upload`, formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = Math.round(100 * event.loaded / (event.total || 1));
        } else if (event.type === HttpEventType.Response) {
          this.snackBar.open('Photo updated successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/admin/photos']);
        }
      },
      error: (err) => {
        console.error('Upload error:', err);
        const errorMessage = err.error?.error?.message || 'Failed to upload photo';
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        this.isUploading = false;
        this.isSaving = false;
        this.uploadProgress = 0;
      }
    });
  }

  private updatePhotoMetadata(): void {
    const formValue = this.editForm.value;
    const categoryIds = this.categoryIdsArray.value;
    
    const updates = {
      title: formValue.title,
      description: formValue.description,
      categoryIds: categoryIds,
      price: Math.round(formValue.price * 100),
      isActive: formValue.isActive
    };

    this.isSaving = true;
    this.photoService.updatePhoto(this.photoId, updates).subscribe({
      next: () => {
        this.snackBar.open('Photo updated successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/admin/photos']);
      },
      error: (err) => {
        this.snackBar.open(err.message || 'Failed to update photo', 'Close', { duration: 5000 });
        this.isSaving = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/photos']);
  }
}
