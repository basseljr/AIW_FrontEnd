export interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  imageUrl?: string;
  itemCount?: number;
  parentId?: string;
  sortOrder: number;
}

export interface CatalogItem {
  id: string;
  slug: string;
  categoryId: string;
  categorySlug: string;
  categoryNameEn: string;
  categoryNameAr: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  images?: ProductImage[];
  isAvailable: boolean;
  isPublished: boolean;
  tags?: string[];
  hasModifiers?: boolean;       // restaurant
  hasVariants?: boolean;        // retail
  durationMinutes?: number;     // service
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
  total: number;
}

export interface SearchSuggestion {
  id: string;
  slug: string;
  categorySlug: string;
  nameEn: string;
  nameAr: string;
  imageUrl?: string;
  price: number;
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
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  q?: string;
}
