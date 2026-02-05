import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { FulfillmentService, FrameItems, FramePrice, FrameConfig } from '../services/fulfillment.service';

@Component({
  selector: 'app-frame-configurator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatExpansionModule
  ],
  templateUrl: './frame-configurator.component.html',
  styleUrls: ['./frame-configurator.component.scss']
})
export class FrameConfiguratorComponent implements OnInit, AfterViewInit {
  @Input() photoId!: string;
  @Input() photoImageUrl!: string;
  @Output() addToCart = new EventEmitter<{ photoId: string; sku: string; config: FramePrice }>();

  frameItems: FrameItems | null = null;
  loading = false;
  calculating = false;
  error: string | null = null;
  private dataLoaded = false;
  showSpinner = false; // Don't show spinner immediately

  // Configuration
  selectedProfile = '';
  selectedColor = '';
  frameWidth = 8;
  frameHeight = 10;
  selectedCover = 'Clear Acrylic';
  selectedBacking = 'Acid Free Foamcore';
  
  // Mat options
  useOuterMat = false;
  outerMatType = '';
  outerMatColor = '';
  outerMatThickness = 1.5;
  
  useInnerMat = false;
  innerMatType = '';
  innerMatColor = '';
  innerMatThickness = 0.5;

  // Calculated price
  framePrice: FramePrice | null = null;

  // Available options filtered by selection
  availableColors: string[] = [];
  availableProfiles: string[] = [];

  constructor(
    private fulfillmentService: FulfillmentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadFrameItems();
  }

  ngAfterViewInit(): void {
    // Not needed anymore
  }

  loadFrameItems(): void {
    if (this.dataLoaded) return;
    
    this.dataLoaded = true;
    this.loading = true;
    this.error = null;
    
    // Only show spinner if loading takes longer than 300ms
    const spinnerTimeout = setTimeout(() => {
      if (this.loading) {
        this.showSpinner = true;
      }
    }, 300);

    this.fulfillmentService.getFrameItems().subscribe({
      next: (items) => {
        clearTimeout(spinnerTimeout);
        this.frameItems = items;
        this.loading = false;
        this.showSpinner = false;
        this.cdr.detectChanges();

        // Validate items structure
        if (!items || !items.styles || !items.covers || !items.backings) {
          this.error = 'Invalid frame options data received.';
          console.error('Invalid items structure:', items);
          return;
        }

        // Get unique profiles
        this.availableProfiles = [...new Set(items.styles.map(s => s.profile_name))];
        
        // Set defaults
        if (this.availableProfiles.length > 0) {
          this.selectedProfile = this.availableProfiles[0];
          this.updateAvailableColors();
        }

        if (items.covers.length > 0) {
          this.selectedCover = items.covers[0].cover_name;
        }

        if (items.backings.length > 0) {
          this.selectedBacking = items.backings[0].backing_name;
        }

        // Auto-calculate initial price
        this.calculatePrice();
      },
      error: (err) => {
        clearTimeout(spinnerTimeout);
        console.error('Error loading frame items:', err);
        this.error = 'Failed to load frame options. Please try again.';
        this.loading = false;
        this.showSpinner = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateAvailableColors(): void {
    if (!this.frameItems) return;

    this.availableColors = [
      ...new Set(
        this.frameItems.styles
          .filter(s => s.profile_name === this.selectedProfile)
          .map(s => s.color_name)
      )
    ];

    if (this.availableColors.length > 0) {
      this.selectedColor = this.availableColors[0];
    }
  }

  onProfileChange(): void {
    this.updateAvailableColors();
    this.calculatePrice();
  }

  calculatePrice(): void {
    if (!this.selectedProfile || !this.selectedColor || !this.frameWidth || !this.frameHeight) {
      return;
    }

    this.calculating = true;
    this.error = null;

    const config: FrameConfig = {
      profile: this.selectedProfile,
      color: this.selectedColor,
      width: this.frameWidth,
      height: this.frameHeight,
      cover: this.selectedCover,
      backing: this.selectedBacking,
      image_url: this.photoImageUrl
    };

    if (this.useOuterMat && this.outerMatType && this.outerMatColor) {
      config.outer_mat_type = this.outerMatType;
      config.outer_mat_color = this.outerMatColor;
      config.outer_mat_thickness = this.outerMatThickness;
    }

    if (this.useInnerMat && this.innerMatType && this.innerMatColor) {
      config.inner_mat_type = this.innerMatType;
      config.inner_mat_color = this.innerMatColor;
      config.inner_mat_thickness = this.innerMatThickness;
    }

    this.fulfillmentService.calculateFramePrice(config).subscribe({
      next: (price) => {
        this.framePrice = price;
        this.calculating = false;
      },
      error: (err) => {
        console.error('Error calculating price:', err);
        this.error = 'Failed to calculate price. Please check your configuration.';
        this.calculating = false;
      }
    });
  }

  onAddToCart(): void {
    if (this.framePrice) {
      this.addToCart.emit({
        photoId: this.photoId,
        sku: this.framePrice.sku,
        config: this.framePrice
      });
    }
  }

  getMatTypes(): string[] {
    if (!this.frameItems) return [];
    return [...new Set(this.frameItems.mats.map(m => m.mat_type_name))];
  }

  getMatColors(matType: string): string[] {
    if (!this.frameItems) return [];
    return [
      ...new Set(
        this.frameItems.mats
          .filter(m => m.mat_type_name === matType)
          .map(m => m.mat_design_name)
      )
    ];
  }
}
