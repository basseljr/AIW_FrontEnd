// ── Category ──────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  parentId: string | null;
  nameEn: string;
  nameAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isPublished: boolean;
  itemCount?: number;
}

export interface CategoryRequest {
  parentId?: string | null;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  isPublished: boolean;
}

export interface CategoryReorderItem {
  id: string;
  sortOrder: number;
}

// ── Product ───────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  categoryId: string | null;
  categoryNameEn: string | null;
  nameEn: string;
  nameAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  price: number;
  sku: string | null;
  barcode: string | null;
  imageUrl: string | null;
  isPublished: boolean;
  sortOrder: number;
  productType: string;
  outOfStockBehavior: string | null;
  lowStockThreshold: number | null;
}

export interface ProductListResult {
  items: Product[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ProductRequest {
  categoryId?: string | null;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  price: number;
  sku?: string | null;
  barcode?: string | null;
  imageUrl?: string | null;
  isPublished: boolean;
  sortOrder: number;
  productType: string;
  outOfStockBehavior?: string | null;
  lowStockThreshold?: number | null;
}

// ── Product Variant ───────────────────────────────────────────────────────────

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  barcode: string | null;
  price: number;
  compareAtPrice: number | null;
  quantity: number;
  variantAttributesJson: string;
}

export interface VariantRequest {
  sku: string;
  barcode?: string | null;
  price: number;
  compareAtPrice?: number | null;
  quantity: number;
  variantAttributesJson: string;
}

// ── Inventory ─────────────────────────────────────────────────────────────────

export interface VariantInventory {
  variantId: string;
  branchId: string;
  quantity: number;
  lowStockThreshold: number | null;
}

export interface InventoryUpdateRequest {
  branchId: string;
  quantity: number;
  lowStockThreshold?: number | null;
}

// ── Menu Item ─────────────────────────────────────────────────────────────────

export interface MenuItem {
  id: string;
  categoryId: string;
  categoryNameEn: string | null;
  nameEn: string;
  nameAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  price: number;
  imageUrl: string | null;
  isPublished: boolean;
  isAvailable: boolean;
  preparationTime: number | null;
  calories: number | null;
  spiceLevel: number;
  tags: string | null;
  sku: string | null;
  sortOrder: number;
  modifierGroupIds: string[];
}

export interface MenuItemListResult {
  items: MenuItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface MenuItemRequest {
  categoryId: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  price: number;
  imageUrl?: string | null;
  isPublished: boolean;
  isAvailable: boolean;
  preparationTime?: number | null;
  calories?: number | null;
  spiceLevel: number;
  tags?: string | null;
  sku?: string | null;
  sortOrder: number;
  modifierGroupIds: string[];
}

// ── Modifier Group ────────────────────────────────────────────────────────────

export interface ModifierOption {
  id?: string;
  nameEn: string;
  nameAr: string;
  price: number;
  sortOrder: number;
}

export interface ModifierGroup {
  id: string;
  nameEn: string;
  nameAr: string;
  selectionType: 'single' | 'multiple';
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  status?: string;
  options: ModifierOption[];
}

export interface ModifierGroupRequest {
  nameEn: string;
  nameAr: string;
  selectionType: 'single' | 'multiple';
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  status?: string;
  options: ModifierOption[];
}
