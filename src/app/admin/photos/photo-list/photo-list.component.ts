import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PhotoService, Photo } from '../../../services/photo.service';
import { CategoryService, Category } from '../../../services/category.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-photo-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './photo-list.component.html',
  styleUrls: ['./photo-list.component.scss']
})
export class PhotoListComponent implements OnInit {
  displayedColumns: string[] = ['thumbnail', 'title', 'category', 'price', 'status', 'actions'];
  dataSource = new MatTableDataSource<Photo>();
  categories: Category[] = [];
  selectedCategoryId: string | null = null;
  isLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private photoService: PhotoService,
    private categoryService: CategoryService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadPhotos();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  loadPhotos(): void {
    this.isLoading = true;
    const categoryId = this.selectedCategoryId || undefined;
    
    this.photoService.getPhotos(categoryId).subscribe({
      next: (response) => {
        this.dataSource.data = response.photos;
        this.isLoading = false;
      },
      error: (err) => {
        this.snackBar.open('Failed to load photos', 'Close', { duration: 3000 });
        console.error('Error loading photos:', err);
        this.isLoading = false;
      }
    });
  }

  onCategoryFilterChange(categoryId: string | null): void {
    this.selectedCategoryId = categoryId;
    this.loadPhotos();
  }

  getPhotoUrl(photo: Photo): string {
    return this.photoService.getPhotoUrl(photo.r2Key);
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  }

  formatPrice(priceInCents: number): string {
    return `$${(priceInCents / 100).toFixed(2)}`;
  }

  navigateToUpload(): void {
    this.router.navigate(['/admin/photos/upload']);
  }

  editPhoto(photo: Photo): void {
    this.router.navigate(['/admin/photos/edit', photo.id]);
  }

  deletePhoto(photo: Photo): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialog, {
      data: { photoTitle: photo.title }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.photoService.deletePhoto(photo.id).subscribe({
          next: () => {
            this.snackBar.open('Photo deleted successfully', 'Close', { duration: 3000 });
            this.loadPhotos(); // Reload the list
          },
          error: (err) => {
            this.snackBar.open(err.message || 'Failed to delete photo', 'Close', { duration: 5000 });
            this.isLoading = false;
          }
        });
      }
    });
  }

  refreshList(): void {
    this.loadPhotos();
  }
}

// Confirm Delete Dialog Component
@Component({
  selector: 'confirm-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Confirm Delete</h2>
    <mat-dialog-content>
      <p>Are you sure you want to delete "{{ data.photoTitle }}"?</p>
      <p>This action cannot be undone.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancel</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">Delete</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 {
      font-family: 'Prata', serif;
      color: #616e76;
    }
    p {
      font-family: 'Barlow', sans-serif;
    }
    button {
      font-family: 'Barlow', sans-serif;
      font-weight: 800;
    }
  `]
})
export class ConfirmDeleteDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { photoTitle: string }) {}
}

import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';
