export interface Category {
  id: string;
  parentId?: string;
  nameEn: string;
  nameAr: string;
  imageUrl?: string;
  sortOrder: number;
  // Returned by backend catalog endpoints
  slug?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  itemCount?: number;
}

export interface CatalogItem {
  // Fields returned by backend CatalogItemDto
  id: string;
  categoryId?: string;
  categoryNameEn?: string;
  categoryNameAr?: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  price: number;
  imageUrl?: string;
  productType?: string;
  hasVariants?: boolean;
  sortOrder?: number;
  createdAt?: string;
  // Returned by backend (slug-enabled endpoints); also present on detail responses
  slug?: string;
  categorySlug?: string;
  isAvailable?: boolean;
  isPublished?: boolean;
  compareAtPrice?: number;
  images?: ProductImage[];
  tags?: string[];
  hasModifiers?: boolean;
  durationMinutes?: number;
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  altTextEn?: string;
  altTextAr?: string;
  isPrimary: boolean;
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
  options: ModifierOption[];
}

export interface ModifierOption {
  id: string;
  nameEn: string;
  nameAr: string;
  price: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  isAvailable: boolean;
  attributes: VariantAttribute[];
}

export interface VariantAttribute {
  attributeId: string;
  attributeNameEn: string;
  attributeNameAr: string;
  valueId: string;
  valueEn: string;
  valueAr: string;
}

export interface CatalogItemDetail extends CatalogItem {
  modifierGroups?: ModifierGroup[];
  variants?: ProductVariant[];
  relatedItems?: CatalogItem[];
}

export interface CatalogPage {
  items: CatalogItem[];
  nextCursor: string | null;
  limit?: number;
  total?: number;
}

export interface SearchSuggestion {
  id: string;
  nameEn: string;
  nameAr: string;
  price: number;
  imageUrl?: string;
  // Optional — not returned by backend
  slug?: string;
  categorySlug?: string;
}

export interface CartItem {
  itemId: string;
  slug: string;
  categorySlug: string;
  nameEn: string;
  nameAr: string;
  imageUrl?: string;
  price: number;
  quantity: number;
  selectedModifiers?: SelectedModifier[];
  selectedVariantId?: string;
  variantLabel?: string;
  specialInstructions?: string;
  /** Assigned by the backend when the item is saved to the server cart. Used for PUT/DELETE. */
  cartItemId?: string;
}

export interface SelectedModifier {
  groupId: string;
  groupNameEn: string;
  groupNameAr: string;
  optionId: string;
  optionNameEn: string;
  optionNameAr: string;
  price: number;
}

export interface CatalogFilters {
  categorySlug?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  q?: string;
}
