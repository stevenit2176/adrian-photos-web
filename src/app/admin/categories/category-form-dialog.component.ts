import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CategoryService, Category } from '../../services/category.service';

@Component({
  selector: 'app-category-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './category-form-dialog.component.html',
  styleUrls: ['./category-form-dialog.component.scss']
})
export class CategoryFormDialogComponent implements OnInit {
  form: FormGroup;
  isLoading = false;
  isEditMode = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  uploadingImage = false;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<CategoryFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'create' | 'edit'; category?: Category }
  ) {
    this.isEditMode = data.mode === 'edit';
    
    this.form = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.required],
      description: [''],
      displayOrder: [0, [Validators.required, Validators.min(0)]],
      isActive: [true],
      imageR2Key: [''],
      imageAltText: ['']
    });
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.category) {
      this.form.patchValue({
        name: this.data.category.name,
        slug: this.data.category.slug,
        description: this.data.category.description,
        displayOrder: this.data.category.displayOrder,
        isActive: this.data.category.isActive,
        imageR2Key: this.data.category.imageR2Key || '',
        imageAltText: this.data.category.imageAltText || ''
      });

      if (this.data.category.imageR2Key) {
        this.imagePreview = this.categoryService.getCategoryImageUrl(this.data.category.imageR2Key);
      }
    }

    // Auto-generate slug from name
    if (!this.isEditMode) {
      this.form.get('name')?.valueChanges.subscribe(name => {
        if (name && !this.form.get('slug')?.touched) {
          const slug = name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          this.form.patchValue({ slug }, { emitEvent: false });
        }
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];

      // Preview image
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);

      // Upload immediately
      this.uploadImage();
    }
  }

  uploadImage(): void {
    if (!this.selectedFile) return;

    this.uploadingImage = true;
    this.categoryService.uploadCategoryImage(this.selectedFile).subscribe({
      next: (response: any) => {
        this.form.patchValue({ imageR2Key: response.r2Key });
        this.uploadingImage = false;
        this.snackBar.open('Image uploaded successfully', 'Close', { duration: 2000 });
      },
      error: (err: any) => {
        this.snackBar.open('Failed to upload image', 'Close', { duration: 3000 });
        console.error('Upload error:', err);
        this.uploadingImage = false;
        this.selectedFile = null;
        this.imagePreview = null;
      }
    });
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.form.patchValue({ imageR2Key: '', imageAltText: '' });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    this.isLoading = true;
    const categoryData = this.form.value;

    const request = this.isEditMode
      ? this.categoryService.updateCategory(this.data.category!.id, categoryData)
      : this.categoryService.createCategory(categoryData);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          `Category ${this.isEditMode ? 'updated' : 'created'} successfully`,
          'Close',
          { duration: 3000 }
        );
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.snackBar.open(
          err.error?.message || `Failed to ${this.isEditMode ? 'update' : 'create'} category`,
          'Close',
          { duration: 3000 }
        );
        console.error('Error:', err);
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
