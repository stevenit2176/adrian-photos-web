import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  isActive: number | boolean; // SQLite returns 0/1
  imageR2Key?: string;
  imageAltText?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<{ success: boolean; data: { categories: Category[] } }>(
      `${environment.apiUrl}/categories`
    ).pipe(
      map(response => {
        if (response.success) {
          return response.data.categories;
        }
        throw new Error('Failed to fetch categories');
      })
    );
  }

  getCategoryById(id: string): Observable<Category> {
    console.log('CategoryService: Fetching category by ID:', id);
    return this.http.get<{ success: boolean; data: { category: Category } }>(
      `${environment.apiUrl}/categories/${id}`
    ).pipe(
      map(response => {
        console.log('CategoryService: Received response:', response);
        if (response.success) {
          return response.data.category;
        }
        throw new Error('Failed to fetch category');
      })
    );
  }

  createCategory(category: Partial<Category>): Observable<Category> {
    return this.http.post<{ success: boolean; data: { category: Category } }>(
      `${environment.apiUrl}/categories/create`,
      category
    ).pipe(
      map(response => {
        if (response.success) {
          return response.data.category;
        }
        throw new Error('Failed to create category');
      })
    );
  }

  updateCategory(id: string, category: Partial<Category>): Observable<Category> {
    return this.http.put<{ success: boolean; data: { category: Category } }>(
      `${environment.apiUrl}/categories/${id}/update`,
      category
    ).pipe(
      map(response => {
        if (response.success) {
          return response.data.category;
        }
        throw new Error('Failed to update category');
      })
    );
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<{ success: boolean }>(
      `${environment.apiUrl}/categories/${id}/delete`
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error('Failed to delete category');
        }
      })
    );
  }

  uploadCategoryImage(file: File): Observable<{ r2Key: string; fileName: string; fileSize: number; mimeType: string }> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http.post<{ success: boolean; data: any }>(
      `${environment.apiUrl}/categories/upload-image`,
      formData
    ).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error('Failed to upload image');
      })
    );
  }

  getCategoryImageUrl(r2Key: string): string {
    return `${environment.apiUrl}/photos/image?key=${encodeURIComponent(r2Key)}`;
  }
}
