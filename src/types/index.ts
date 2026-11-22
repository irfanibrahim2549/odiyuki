export interface Category {
  id: string;
  name: string;
  prefix: string;
  created_at?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  category_id: string;
  category_name: string;
  category_prefix?: string;
  images: string[];
  is_available: boolean;
  created_at?: string;
}

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  price: number;
  imageUrl: string;
  qty: number;
}

export interface BuyerInfo {
  name: string;
  phone: string;
  address?: string;
  notes: string;
}

export interface OrderNote {
  orderId: string;
  createdAt: string;
  buyerInfo: BuyerInfo;
  items: CartItem[];
  totalAmount: number;
  totalQty: number;
}
