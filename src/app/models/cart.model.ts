export interface CartItem {
  id: string; // unique cart item ID
  photoId: string;
  photoTitle: string;
  photoThumbnail: string;
  productTypeId: string;
  productTypeName: string;
  productSizeId: string;
  productSizeName: string;
  unitPrice: number; // in cents
  quantity: number;
  total: number; // unitPrice * quantity
  frameConfig?: any; // Frame It Easy configuration for framed products
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  shipping: number;
  total: number;
  itemCount: number;
}

export interface CartCalculation {
  subtotal: number;
  tax: number;
  taxRate: number;
  shipping: number;
  total: number;
  itemCount: number;
}

export interface AddToCartRequest {
  photoId: string;
  photoTitle: string;
  photoThumbnail: string;
  productTypeId: string;
  productTypeName: string;
  productSizeId: string;
  productSizeName: string;
  unitPrice: number;
  quantity?: number;
  frameConfig?: any; // Frame It Easy configuration for framed products
}
