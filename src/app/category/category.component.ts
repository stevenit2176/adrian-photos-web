import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CategoryService, Category } from '../services/category.service';
import { PhotoService, Photo, PhotosResponse } from '../services/photo.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnInit {
  category: Category | null = null;
  photos: Photo[] = [];
  loading = true;
  error: string | null = null;
  pagination = {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  };

  constructor(
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private photoService: PhotoService
  ) {}

  ngOnInit(): void {
    const categoryId = this.route.snapshot.paramMap.get('id');
    if (categoryId) {
      this.loadCategory(categoryId);
      this.loadPhotos(categoryId);
    } else {
      this.error = 'Category ID not found';
      this.loading = false;
    }
  }

  loadCategory(id: string): void {
    this.categoryService.getCategoryById(id).subscribe({
      next: (category) => {
        this.category = category;
      },
      error: (err) => {
        this.error = 'Failed to load category';
        console.error('Error loading category:', err);
      }
    });
  }

  loadPhotos(categoryId: string): void {
    this.photoService.getPhotos(categoryId, this.pagination.page, this.pagination.limit).subscribe({
      next: (response: PhotosResponse) => {
        this.photos = response.photos;
        this.pagination = response.pagination;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load photos';
        this.loading = false;
        console.error('Error loading photos:', err);
      }
    });
  }

  getPhotoUrl(r2Key: string): string {
    return this.photoService.getPhotoUrl(r2Key);
  }

  loadMore(): void {
    if (this.pagination.page < this.pagination.totalPages && this.category) {
      this.pagination.page++;
      this.loadPhotos(this.category.id);
    }
  }
}
