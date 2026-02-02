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
  isActive: boolean;
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
    return this.http.get<{ success: boolean; data: { category: Category } }>(
      `${environment.apiUrl}/categories/${id}`
    ).pipe(
      map(response => {
        if (response.success) {
          return response.data.category;
        }
        throw new Error('Failed to fetch category');
      })
    );
  }
}
