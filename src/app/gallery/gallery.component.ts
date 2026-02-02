import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { CategoryService, Category } from '../services/category.service';

interface Photo {
  id: number;
  title: string;
  imageUrl: string;
  description: string;
  categoryId?: string; // Category ID for carousel linking
}

interface CategoryDisplay extends Category {
  imageUrl: string;
  photoCount: number;
}

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule
  ],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements OnInit {
  currentSlide = 0;
  autoPlayInterval: any;
  selectedCategory: string | null = null;

  // Sample carousel photos
  carouselPhotos: Photo[] = [
    {
      id: 1,
      title: 'Urban Landscapes',
      imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&h=600&fit=crop',
      description: 'Explore the beauty of modern cityscapes',
      categoryId: '1' // Will be updated based on your actual category IDs
    },
    {
      id: 2,
      title: 'Nature Photography',
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop',
      description: 'Breathtaking views from around the world',
      categoryId: '2'
    },
    {
      id: 3,
      title: 'Abstract Art',
      imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&h=600&fit=crop',
      description: 'Contemporary abstract compositions',
      categoryId: '3'
    },
    {
      id: 4,
      title: 'Portrait Series',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=600&fit=crop',
      description: 'Capturing human emotions and expressions',
      categoryId: '4'
    }
  ];

  // Categories loaded from API
  categories: CategoryDisplay[] = [];
  
  // Default images for categories (fallback)
  private defaultImages: { [key: string]: string } = {
    'landscapes': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    'urban': 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop',
    'abstract': 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
    'portraits': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    'wildlife': 'https://images.unsplash.com/photo-1484406566174-9da000fda645?w=400&h=300&fit=crop',
    'black-white': 'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=400&h=300&fit=crop'
  };
  
  constructor(
    private categoryService: CategoryService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.startAutoPlay();
    this.loadCategories();
    
    // Check for category filter in query params
    this.route.queryParams.subscribe(params => {
      this.selectedCategory = params['category'] || null;
    });
  }
  
  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories.map(cat => ({
          ...cat,
          imageUrl: this.defaultImages[cat.slug] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
          photoCount: 0 // Will be updated when we have real photos
        }));
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  ngOnDestroy() {
    this.stopAutoPlay();
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.carouselPhotos.length;
  }

  prevSlide() {
    this.currentSlide = (this.currentSlide - 1 + this.carouselPhotos.length) % this.carouselPhotos.length;
  }

  goToSlide(index: number) {
    this.currentSlide = index;
  }

  startAutoPlay() {
    this.autoPlayInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  onCarouselMouseEnter() {
    this.stopAutoPlay();
  }

  onCarouselMouseLeave() {
    this.startAutoPlay();
  }
}
