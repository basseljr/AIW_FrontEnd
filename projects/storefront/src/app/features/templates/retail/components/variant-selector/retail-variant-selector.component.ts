import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ProductVariant } from '../../../../../core/models/catalog.model';

interface AttributeOption {
  attributeId: string;
  attributeNameEn: string;
  attributeNameAr: string;
  valueId: string;
  valueEn: string;
  valueAr: string;
}

interface AttributeGroup {
  attributeId: string;
  nameEn: string;
  nameAr: string;
  values: AttributeOption[];
}

@Component({
  selector: 'sf-retail-variant-selector',
  standalone: true,
  imports: [TranslateModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sf-variant-sel">
      @for (group of attributeGroups(); track group.attributeId) {
        <div class="sf-variant-sel__group">
          <h4 class="sf-variant-sel__group-label">
            {{ lang === 'ar' ? group.nameAr : group.nameEn }}
          </h4>
          <div class="sf-variant-sel__options" role="group" [attr.aria-label]="'variants.select_option' | translate: { attribute: lang === 'ar' ? group.nameAr : group.nameEn }">
            @for (val of group.values; track val.valueId) {
              <button
                class="sf-variant-sel__option"
                [class.sf-variant-sel__option--selected]="isValueSelected(group.attributeId, val.valueId)"
                [class.sf-variant-sel__option--unavailable]="isValueUnavailable(group.attributeId, val.valueId)"
                [class.sf-variant-sel__option--color]="isColorAttribute(group.nameEn, group.nameAr)"
                type="button"
                (click)="selectValue(group.attributeId, val)"
              >
                @if (isColorAttribute(group.nameEn, group.nameAr)) {
                  <span
                    class="sf-variant-sel__color-swatch"
                    [style.background-color]="val.valueEn.toLowerCase()"
                    [attr.title]="lang === 'ar' ? val.valueAr : val.valueEn"
                    [attr.aria-label]="lang === 'ar' ? val.valueAr : val.valueEn"
                  ></span>
                } @else {
                  {{ lang === 'ar' ? val.valueAr : val.valueEn }}
                }
              </button>
            }
          </div>
        </div>
      }

      @if (selectedVariant()) {
        <div class="sf-variant-sel__price-row">
          <span class="sf-variant-sel__price">
            {{ selectedVariant()!.price | number: '1.3-3' }} {{ 'common.currency' | translate }}
          </span>
          @if (selectedVariant()!.compareAtPrice) {
            <span class="sf-variant-sel__compare">
              {{ selectedVariant()!.compareAtPrice | number: '1.3-3' }}
            </span>
          }
          @if (!selectedVariant()!.isAvailable) {
            <span class="sf-variant-sel__oos">{{ 'variants.out_of_stock' | translate }}</span>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .sf-variant-sel {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .sf-variant-sel__group { display: flex; flex-direction: column; gap: 0.5rem; }
      .sf-variant-sel__group-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-on-surface, #1e1b17);
        margin: 0;
      }
      .sf-variant-sel__options { display: flex; flex-wrap: wrap; gap: 0.5rem; }
      .sf-variant-sel__option {
        padding-block: 0.375rem;
        padding-inline: 0.875rem;
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        border-radius: 8px;
        background: var(--color-surface, #ffffff);
        color: var(--color-on-surface, #1e1b17);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        font-family: inherit;
        transition: border-color 0.15s, background-color 0.15s;
        min-inline-size: 2.5rem;
      }
      .sf-variant-sel__option:hover:not(:disabled) { border-color: var(--color-primary, #805600); }
      .sf-variant-sel__option--selected {
        border-color: var(--color-primary-container, #f2a922);
        background: color-mix(in srgb, var(--color-primary-container, #f2a922) 15%, transparent);
        font-weight: 700;
      }
      .sf-variant-sel__option--unavailable {
        opacity: 0.45;
        text-decoration: line-through;
        cursor: not-allowed;
      }

      .sf-variant-sel__option--color {
        padding: 0.25rem;
        inline-size: 2rem;
        block-size: 2rem;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-inline-size: unset;
        padding-inline: 0.25rem;
      }
      .sf-variant-sel__color-swatch {
        display: block;
        inline-size: 1.25rem;
        block-size: 1.25rem;
        border-radius: 50%;
        border: 1px solid rgba(0, 0, 0, 0.1);
      }

      .sf-variant-sel__price-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding-block-start: 0.5rem;
        border-block-start: 1px solid var(--color-outline-variant, #d6c4ad);
      }
      .sf-variant-sel__price {
        font-size: 1.25rem;
        font-weight: 800;
        color: var(--color-primary-container, #f2a922);
      }
      .sf-variant-sel__compare {
        font-size: 0.875rem;
        color: var(--color-on-surface-variant, #514534);
        text-decoration: line-through;
      }
      .sf-variant-sel__oos {
        font-size: 0.8125rem;
        font-weight: 700;
        color: var(--color-error, #dc2626);
        padding-block: 0.25rem;
        padding-inline: 0.75rem;
        background: rgba(220, 38, 38, 0.1);
        border-radius: 9999px;
      }
    `,
  ],
})
export class RetailVariantSelectorComponent implements OnChanges {
  @Input() variants: ProductVariant[] = [];
  @Input() selectedVariantId: string | null = null;
  @Input() lang: 'en' | 'ar' = 'en';
  @Output() variantSelected = new EventEmitter<ProductVariant>();

  private readonly _selections = signal<Map<string, string>>(new Map());

  readonly selectedVariant = computed(() => {
    const sels = this._selections();
    if (sels.size === 0) return null;
    return (
      this.variants.find((v) =>
        v.attributes.every(
          (a) => sels.get(a.attributeId) === a.valueId,
        ),
      ) ?? null
    );
  });

  readonly attributeGroups = computed((): AttributeGroup[] => {
    const groups = new Map<string, AttributeGroup>();
    for (const variant of this.variants) {
      for (const attr of variant.attributes) {
        if (!groups.has(attr.attributeId)) {
          groups.set(attr.attributeId, {
            attributeId: attr.attributeId,
            nameEn: attr.attributeNameEn,
            nameAr: attr.attributeNameAr,
            values: [],
          });
        }
        const group = groups.get(attr.attributeId)!;
        if (!group.values.some((v) => v.valueId === attr.valueId)) {
          group.values.push({
            attributeId: attr.attributeId,
            attributeNameEn: attr.attributeNameEn,
            attributeNameAr: attr.attributeNameAr,
            valueId: attr.valueId,
            valueEn: attr.valueEn,
            valueAr: attr.valueAr,
          });
        }
      }
    }
    return [...groups.values()];
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedVariantId'] && this.selectedVariantId) {
      const variant = this.variants.find((v) => v.id === this.selectedVariantId);
      if (variant) {
        const map = new Map<string, string>();
        for (const attr of variant.attributes) {
          map.set(attr.attributeId, attr.valueId);
        }
        this._selections.set(map);
      }
    }
  }

  isValueSelected(attributeId: string, valueId: string): boolean {
    return this._selections().get(attributeId) === valueId;
  }

  isValueUnavailable(attributeId: string, valueId: string): boolean {
    const current = new Map(this._selections());
    current.set(attributeId, valueId);
    return !this.variants.some(
      (v) =>
        v.isAvailable &&
        [...current.entries()].every(([aId, vId]) =>
          v.attributes.some((a) => a.attributeId === aId && a.valueId === vId),
        ),
    );
  }

  isColorAttribute(nameEn: string, nameAr: string): boolean {
    return (
      nameEn.toLowerCase().includes('color') ||
      nameEn.toLowerCase().includes('colour') ||
      nameAr.includes('لون')
    );
  }

  selectValue(attributeId: string, val: AttributeOption): void {
    if (this.isValueUnavailable(attributeId, val.valueId)) return;
    this._selections.update((m) => {
      const updated = new Map(m);
      updated.set(attributeId, val.valueId);
      return updated;
    });
    const matched = this.selectedVariant();
    if (matched) {
      this.variantSelected.emit(matched);
    }
  }
}
