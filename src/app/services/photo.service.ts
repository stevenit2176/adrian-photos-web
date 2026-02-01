import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Photo {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  categorySlug?: string;
  r2Key: string;
  fileSize: number;
  mimeType: string;
  price: number;
  isActive: boolean;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PhotosResponse {
  photos: Photo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Product {
  id: string;
  name: string;
  description: string;
  sizes: ProductSize[];
}

export interface ProductSize {
  id: string;
  productTypeId: string;
  productTypeName: string;
  name: string;
  width: number;
  height: number;
  basePrice: number;
  displayOrder: number;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  constructor(private http: HttpClient) {}

  getPhotos(categoryId?: string, page = 1, limit = 20): Observable<PhotosResponse> {
    let url = `${environment.apiUrl}/photos?page=${page}&limit=${limit}`;
    if (categoryId) {
      url += `&categoryId=${categoryId}`;
    }

    return this.http.get<{ success: boolean; data: PhotosResponse }>(url).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error('Failed to fetch photos');
      })
    );
  }

  getPhotoById(id: string): Observable<Photo> {
    return this.http.get<{ success: boolean; data: { photo: Photo } }>(
      `${environment.apiUrl}/photos/${id}`
    ).pipe(
      map(response => {
        if (response.success) {
          return response.data.photo;
        }
        throw new Error('Failed to fetch photo');
      })
    );
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<{ success: boolean; data: { productTypes: Product[] } }>(
      `${environment.apiUrl}/products/pricing`
    ).pipe(
      map(response => {
        if (response.success) {
          return response.data.productTypes;
        }
        throw new Error('Failed to fetch products');
      })
    );
  }

  deletePhoto(id: string): Observable<void> {
    return this.http.delete<{ success: boolean }>(
      `${environment.apiUrl}/photos/${id}`
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error('Failed to delete photo');
        }
      })
    );
  }

  getPhotoUrl(r2Key: string): string {
    // For MVP, photos will be served through the API
    // In production, you'd use a custom R2 domain
    return `${environment.apiUrl}/photos/image/${r2Key}`;
  }
}
