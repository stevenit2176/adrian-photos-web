import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { PhotoService, Photo, Product, ProductSize } from '../services/photo.service';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-photo-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule
  ],
  templateUrl: './photo-detail.component.html',
  styleUrls: ['./photo-detail.component.scss']
})
export class PhotoDetailComponent implements OnInit {
  photo: Photo | null = null;
  products: Product[] = [];
  selectedProduct: Product | null = null;
  selectedSize: ProductSize | null = null;
  quantity = 1;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private photoService: PhotoService,
    private cartService: CartService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const photoId = this.route.snapshot.paramMap.get('id');
    if (photoId) {
      this.loadPhoto(photoId);
      this.loadProducts();
    } else {
      this.error = 'Photo ID not found';
      this.loading = false;
    }
  }

  loadPhoto(id: string): void {
    this.photoService.getPhotoById(id).subscribe({
      next: (photo) => {
        this.photo = photo;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load photo';
        this.loading = false;
        console.error('Error loading photo:', err);
      }
    });
  }

  loadProducts(): void {
    this.photoService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        // Auto-select first product if available
        if (products.length > 0) {
          this.selectedProduct = products[0];
          if (products[0].sizes && products[0].sizes.length > 0) {
            this.selectedSize = products[0].sizes[0];
          }
        }
      },
      error: (err) => {
        console.error('Error loading products:', err);
      }
    });
  }

  onProductChange(): void {
    // Reset selected size when product changes
    if (this.selectedProduct && this.selectedProduct.sizes.length > 0) {
      this.selectedSize = this.selectedProduct.sizes[0];
    } else {
      this.selectedSize = null;
    }
  }

  getPhotoUrl(): string {
    if (!this.photo) return '';
    return this.photoService.getPhotoUrl(this.photo.r2Key);
  }

  formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
  }

  canAddToCart(): boolean {
    return !!(this.photo && this.selectedProduct && this.selectedSize && this.quantity > 0);
  }

  addToCart(): void {
    if (!this.canAddToCart() || !this.photo || !this.selectedProduct || !this.selectedSize) {
      return;
    }

    this.cartService.addItem({
      photoId: this.photo.id,
      photoTitle: this.photo.title,
      photoThumbnail: this.getPhotoUrl(),
      productTypeId: this.selectedProduct.id,
      productTypeName: this.selectedProduct.name,
      productSizeId: this.selectedSize.id,
      productSizeName: this.selectedSize.name,
      unitPrice: this.selectedSize.basePrice,
      quantity: this.quantity
    });

    this.snackBar.open('Added to cart!', 'View Cart', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    }).onAction().subscribe(() => {
      this.router.navigate(['/cart']);
    });
  }

  goBack(): void {
    this.router.navigate(['/gallery']);
  }
}
