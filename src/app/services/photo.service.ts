import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Photo {
  id: string;
  title: string;
  description: string;
  categoryIds: string[];
  categoryNames?: string[];
  categorySlugs?: string[];
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

    return this.http.get<{ success: boolean; data: any }>(url).pipe(
      map(response => {
        if (response.success && response.data) {
          // Map snake_case database fields to camelCase
          const photos = (response.data.photos || []).map((photo: any) => ({
            id: photo.id,
            title: photo.title,
            description: photo.description,
            categoryIds: photo.categoryIds || [],
            categoryNames: photo.categoryNames || [],
            categorySlugs: photo.categorySlugs || [],
            r2Key: photo.r2_key || photo.r2Key,
            fileSize: photo.file_size || photo.fileSize,
            mimeType: photo.mime_type || photo.mimeType,
            price: photo.price,
            isActive: photo.is_active !== undefined ? photo.is_active : photo.isActive,
            uploadedBy: photo.uploaded_by || photo.uploadedBy,
            createdAt: photo.created_at || photo.createdAt,
            updatedAt: photo.updated_at || photo.updatedAt
          }));
          
          return {
            photos,
            pagination: response.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 }
          };
        }
        throw new Error('Failed to fetch photos');
      })
    );
  }

  getPhotoById(id: string): Observable<Photo> {
    return this.http.get<{ success: boolean; data: { photo: any } }>(
      `${environment.apiUrl}/photos/${id}`
    ).pipe(
      map(response => {
        if (response.success && response.data?.photo) {
          const photo = response.data.photo;
          return {
            id: photo.id,
            title: photo.title,
            description: photo.description,
            categoryIds: photo.categoryIds || [],
            categoryNames: photo.categoryNames || [],
            categorySlugs: photo.categorySlugs || [],
            r2Key: photo.r2_key || photo.r2Key,
            fileSize: photo.file_size || photo.fileSize,
            mimeType: photo.mime_type || photo.mimeType,
            price: photo.price,
            isActive: photo.is_active !== undefined ? photo.is_active : photo.isActive,
            uploadedBy: photo.uploaded_by || photo.uploadedBy,
            createdAt: photo.created_at || photo.createdAt,
            updatedAt: photo.updated_at || photo.updatedAt
          };
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

  updatePhoto(id: string, updates: Partial<Photo>): Observable<Photo> {
    return this.http.put<{ success: boolean; data: { photo: Photo } }>(
      `${environment.apiUrl}/photos/${id}`,
      updates
    ).pipe(
      map(response => {
        if (response.success) {
          return response.data.photo;
        }
        throw new Error('Failed to update photo');
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
