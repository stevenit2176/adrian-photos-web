import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { CategoryService, Category } from '../../services/category.service';
import { CategoryFormDialogComponent } from './category-form-dialog.component';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss']
})
export class CategoryListComponent implements OnInit {
  displayedColumns: string[] = ['image', 'name', 'slug', 'description', 'displayOrder', 'status', 'actions'];
  dataSource = new MatTableDataSource<Category>();
  isLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private categoryService: CategoryService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  loadCategories(): void {
    this.isLoading = true;
    this.categoryService.getCategories().subscribe({
      next: (categories: Category[]) => {
        this.dataSource.data = categories;
        this.isLoading = false;
      },
      error: (err: any) => {
        this.snackBar.open('Failed to load categories', 'Close', { duration: 3000 });
        console.error('Error loading categories:', err);
        this.isLoading = false;
      }
    });
  }

  getCategoryImageUrl(category: Category): string {
    if (!category.imageR2Key) {
      return '';
    }
    return this.categoryService.getCategoryImageUrl(category.imageR2Key);
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CategoryFormDialogComponent, {
      width: '600px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCategories();
      }
    });
  }

  openEditDialog(category: Category): void {
    const dialogRef = this.dialog.open(CategoryFormDialogComponent, {
      width: '600px',
      data: { mode: 'edit', category }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCategories();
      }
    });
  }

  deleteCategory(category: Category): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: { categoryName: category.name }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.categoryService.deleteCategory(category.id).subscribe({
          next: () => {
            this.snackBar.open('Category deleted successfully', 'Close', { duration: 3000 });
            this.loadCategories();
          },
          error: (err: any) => {
            this.snackBar.open(err.error?.message || 'Failed to delete category', 'Close', { duration: 5000 });
            console.error('Error deleting category:', err);
            this.isLoading = false;
          }
        });
      }
    });
  }
}
