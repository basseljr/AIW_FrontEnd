import { Injectable, computed, signal } from '@angular/core';
import { CartItem, SelectedModifier } from '../models/catalog.model';

function sameItem(
  a: CartItem,
  variantId: string | undefined,
  modifiers: SelectedModifier[] | undefined,
): boolean {
  if (a.selectedVariantId !== variantId) return false;
  const aMods = JSON.stringify(
    (a.selectedModifiers ?? []).map((m) => m.optionId).sort(),
  );
  const bMods = JSON.stringify(
    (modifiers ?? []).map((m) => m.optionId).sort(),
  );
  return aMods === bMods;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<CartItem[]>([]);
  readonly items = this._items.asReadonly();

  readonly count = computed(() =>
    this._items().reduce((s, i) => s + i.quantity, 0),
  );

  readonly total = computed(() =>
    this._items().reduce((s, i) => {
      const modTotal = (i.selectedModifiers ?? []).reduce(
        (m, mod) => m + mod.price,
        0,
      );
      return s + (i.price + modTotal) * i.quantity;
    }, 0),
  );

  addItem(item: CartItem): void {
    this._items.update((current) => {
      const idx = current.findIndex(
        (c) =>
          c.itemId === item.itemId &&
          sameItem(c, item.selectedVariantId, item.selectedModifiers),
      );
      if (idx >= 0) {
        const updated = [...current];
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + item.quantity,
        };
        return updated;
      }
      return [...current, item];
    });
  }

  removeItem(itemId: string, variantId?: string): void {
    this._items.update((current) =>
      current.filter(
        (c) => !(c.itemId === itemId && c.selectedVariantId === variantId),
      ),
    );
  }

  updateQuantity(itemId: string, quantity: number, variantId?: string): void {
    if (quantity <= 0) {
      this.removeItem(itemId, variantId);
      return;
    }
    this._items.update((current) =>
      current.map((c) =>
        c.itemId === itemId && c.selectedVariantId === variantId
          ? { ...c, quantity }
          : c,
      ),
    );
  }

  clear(): void {
    this._items.set([]);
  }
}
