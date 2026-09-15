export type UserRole =
  | "user"
  | "seller"
  | "business"
  | "service_provider"
  | "admin";

export type VerificationStatus =
  | "unverified"
  | "phone_verified"
  | "identity_verified"
  | "business_verified";

export type ListingStatus =
  | "draft"
  | "active"
  | "paused"
  | "sold"
  | "expired"
  | "rejected";

export type ListingType =
  | "product"
  | "service"
  | "business"
  | "job"
  | "real_estate"
  | "vehicle"
  | "agriculture"
  | "rent";

export interface User {
  id: string;
  fullName: string;
  phone: string;
  role: UserRole;
  verification: VerificationStatus;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  district?: string;
}

export interface Listing {
  id: string;
  ownerId: string;
  type: ListingType;
  categoryId: string;
  title: string;
  description: string;
  price?: number;
  negotiable?: boolean;
  images: string[];
  location?: Location;
  status: ListingStatus;
  views: number;
  saves: number;
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  id: string;
  ownerId?: string;
  name: string;
  description?: string;
  phone?: string;
  address?: string;
  location?: Location;
  hours?: string;
  images: string[];
  services: string[];
  products: string[];
  verification: VerificationStatus;
  claimed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequest {
  id: string;
  userId: string;
  title: string;
  description: string;
  images: string[];
  location?: Location;
  preferredTime?: string;
  status:
    | "open"
    | "receiving_offers"
    | "accepted"
    | "completed"
    | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOffer {
  id: string;
  requestId: string;
  providerId: string;
  price?: number;
  description?: string;
  availableTime?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface Campaign {
  id: string;
  businessId: string;
  title: string;
  description: string;
  imageUrl?: string;
  discountPercent?: number;
  startAt: string;
  endAt: string;
  active: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  title: string;
  icon: string;
  parentId?: string;
  active: boolean;
  sortOrder: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
