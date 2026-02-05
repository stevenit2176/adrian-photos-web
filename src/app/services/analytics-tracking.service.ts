import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/**
 * Google Analytics 4 Measurement Protocol Service
 * Sends events to GA4 for tracking user behavior
 */
@Injectable({
  providedIn: 'root'
})
export class AnalyticsTrackingService {
  private readonly GA4_ENDPOINT = 'https://www.google-analytics.com/mp/collect';
  private readonly measurementId = environment.ga4MeasurementId;
  private readonly apiSecret = environment.ga4ApiSecret;
  private clientId: string;
  private sessionId: string;
  private sessionStartTime: number;

  constructor(private router: Router) {
    // Generate or retrieve client ID (stored in localStorage)
    this.clientId = this.getOrCreateClientId();
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    
    // Track page views on route changes
    this.initializeRouteTracking();
  }

  /**
   * Initialize automatic page view tracking
   */
  private initializeRouteTracking(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.trackPageView(event.urlAfterRedirects);
      });
  }

  /**
   * Track a page view event
   */
  trackPageView(pagePath: string): void {
    const event = {
      name: 'page_view',
      params: {
        page_location: window.location.href,
        page_path: pagePath,
        page_title: document.title,
        engagement_time_msec: Date.now() - this.sessionStartTime
      }
    };
    
    this.sendEvent(event);
  }

  /**
   * Track a custom event
   */
  trackEvent(eventName: string, params?: any): void {
    const event = {
      name: eventName,
      params: params || {}
    };
    
    this.sendEvent(event);
  }

  /**
   * Track add to cart event
   */
  trackAddToCart(photoId: string | number, productName: string, price: number): void {
    this.trackEvent('add_to_cart', {
      currency: 'USD',
      value: price,
      items: [{
        item_id: photoId.toString(),
        item_name: productName,
        price: price
      }]
    });
  }

  /**
   * Track purchase event
   */
  trackPurchase(orderId: string, totalAmount: number, items: any[]): void {
    this.trackEvent('purchase', {
      transaction_id: orderId,
      currency: 'USD',
      value: totalAmount,
      items: items
    });
  }

  /**
   * Send event to GA4 via Measurement Protocol
   */
  private sendEvent(event: any): void {
    // Don't send in development unless explicitly enabled
    if (!environment.production && !environment.enableAnalytics) {
      console.log('[Analytics] Event (not sent in dev):', event);
      return;
    }

    const payload = {
      client_id: this.clientId,
      events: [event],
      user_properties: {
        session_id: { value: this.sessionId }
      }
    };

    const url = `${this.GA4_ENDPOINT}?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`;

    // Send as beacon (non-blocking)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } else {
      // Fallback to fetch
      fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        },
        keepalive: true
      }).catch(error => {
        console.error('[Analytics] Failed to send event:', error);
      });
    }

    console.log('[Analytics] Event sent:', event.name, event.params);
  }

  /**
   * Get or create a persistent client ID
   */
  private getOrCreateClientId(): string {
    let clientId = localStorage.getItem('ga_client_id');
    
    if (!clientId) {
      // Generate a UUID-like client ID
      clientId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      
      localStorage.setItem('ga_client_id', clientId);
    }
    
    return clientId;
  }

  /**
   * Generate a session ID
   */
  private generateSessionId(): string {
    return Date.now().toString();
  }
}
