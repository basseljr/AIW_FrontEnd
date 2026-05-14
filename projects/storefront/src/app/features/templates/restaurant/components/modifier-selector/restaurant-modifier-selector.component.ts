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
import {
  CatalogItemDetail,
  ModifierGroup,
  ModifierOption,
  SelectedModifier,
} from '../../../../../core/models/catalog.model';

export interface ModifierConfirmEvent {
  modifiers: SelectedModifier[];
  quantity: number;
  instructions: string;
}

@Component({
  selector: 'sf-restaurant-modifier-selector',
  standalone: true,
  imports: [TranslateModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open && item) {
      <div
        class="sf-mod__overlay"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="'sf-mod-title'"
        (click)="onOverlayClick($event)"
      >
        <div class="sf-mod__panel" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="sf-mod__header">
            @if (item.imageUrl) {
              <img class="sf-mod__header-img" [src]="item.imageUrl" [alt]="lang === 'ar' ? item.nameAr : item.nameEn" loading="lazy" />
            }
            <div class="sf-mod__header-info">
              <h2 id="sf-mod-title" class="sf-mod__item-name">{{ lang === 'ar' ? item.nameAr : item.nameEn }}</h2>
              <span class="sf-mod__base-price">
                {{ item.price | number: '1.3-3' }} {{ 'common.currency' | translate }}
              </span>
            </div>
            <button
              class="sf-mod__close"
              type="button"
              [attr.aria-label]="'common.close' | translate"
              (click)="close()"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Body: modifier groups -->
          <div class="sf-mod__body">
            @for (group of item.modifierGroups ?? []; track group.id) {
              <section class="sf-mod__group">
                <div class="sf-mod__group-header">
                  <h3 class="sf-mod__group-name">{{ lang === 'ar' ? group.nameAr : group.nameEn }}</h3>
                  @if (group.isRequired) {
                    <span class="sf-mod__required-badge">{{ 'item_detail.required' | translate }}</span>
                  } @else {
                    <span class="sf-mod__optional-badge">{{ 'item_detail.optional' | translate }}</span>
                  }
                </div>

                <div class="sf-mod__options" role="group" [attr.aria-labelledby]="'group-' + group.id">
                  @for (opt of group.options; track opt.id) {
                    @if (group.selectionType === 'single') {
                      <label class="sf-mod__option">
                        <input
                          type="radio"
                          class="sf-mod__radio"
                          [name]="'group-' + group.id"
                          [value]="opt.id"
                          [checked]="isSelected(group.id, opt.id)"
                          (change)="onSingleSelect(group, opt)"
                        />
                        <span class="sf-mod__option-name">{{ lang === 'ar' ? opt.nameAr : opt.nameEn }}</span>
                        <span class="sf-mod__option-price">
                          @if (opt.price > 0) {
                            +{{ opt.price | number: '1.3-3' }} {{ 'common.currency' | translate }}
                          } @else {
                            {{ 'catalog.free' | translate }}
                          }
                        </span>
                      </label>
                    } @else {
                      <label class="sf-mod__option">
                        <input
                          type="checkbox"
                          class="sf-mod__checkbox"
                          [checked]="isSelected(group.id, opt.id)"
                          (change)="onMultiSelect(group, opt, $event)"
                        />
                        <span class="sf-mod__option-name">{{ lang === 'ar' ? opt.nameAr : opt.nameEn }}</span>
                        <span class="sf-mod__option-price">
                          @if (opt.price > 0) {
                            +{{ opt.price | number: '1.3-3' }} {{ 'common.currency' | translate }}
                          } @else {
                            {{ 'catalog.free' | translate }}
                          }
                        </span>
                      </label>
                    }
                  }
                </div>
              </section>
            }

            <!-- Special instructions -->
            <section class="sf-mod__group">
              <h3 class="sf-mod__group-name">{{ 'item_detail.special_instructions' | translate }}</h3>
              <textarea
                class="sf-mod__instructions"
                [placeholder]="'item_detail.special_instructions_placeholder' | translate"
                maxlength="500"
                rows="3"
                [value]="instructions()"
                (input)="onInstructions($event)"
              ></textarea>
            </section>
          </div>

          <!-- Footer -->
          <div class="sf-mod__footer">
            <div class="sf-mod__quantity">
              <button class="sf-mod__qty-btn" type="button" (click)="decreaseQty()" [disabled]="quantity() <= 1">−</button>
              <span class="sf-mod__qty-value">{{ quantity() }}</span>
              <button class="sf-mod__qty-btn" type="button" (click)="increaseQty()">+</button>
            </div>
            <div class="sf-mod__total">
              <span class="sf-mod__total-label">{{ 'item_detail.total_price' | translate }}</span>
              <span class="sf-mod__total-value">
                {{ totalPrice() | number: '1.3-3' }} {{ 'common.currency' | translate }}
              </span>
            </div>
            <button
              class="sf-mod__confirm-btn"
              type="button"
              [disabled]="!canConfirm()"
              (click)="confirmAdd()"
            >
              {{ 'catalog.add_to_cart' | translate }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .sf-mod__overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.55);
        z-index: 200;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding-block-start: 2rem;
      }

      @media (min-width: 640px) {
        .sf-mod__overlay {
          align-items: center;
        }
        .sf-mod__panel {
          border-radius: 16px !important;
          max-block-size: 85vh !important;
        }
      }

      .sf-mod__panel {
        background: var(--color-background, #fff8f1);
        border-radius: 20px 20px 0 0;
        inline-size: 100%;
        max-inline-size: 36rem;
        max-block-size: 92vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: sf-mod-slide-up 0.28s cubic-bezier(0.4, 0, 0.2, 1);
      }

      @keyframes sf-mod-slide-up {
        from {
          transform: translateY(24px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .sf-mod__header {
        display: flex;
        align-items: center;
        gap: 0.875rem;
        padding: 1rem 1.25rem;
        border-block-end: 1px solid var(--color-outline-variant, #d6c4ad);
        flex-shrink: 0;
      }
      .sf-mod__header-img {
        inline-size: 4rem;
        block-size: 4rem;
        object-fit: cover;
        border-radius: 10px;
        flex-shrink: 0;
      }
      .sf-mod__header-info {
        flex: 1;
        min-inline-size: 0;
      }
      .sf-mod__item-name {
        font-size: 1.0625rem;
        font-weight: 700;
        color: var(--color-on-surface, #1e1b17);
        margin: 0 0 0.25rem;
        line-height: 1.3;
      }
      .sf-mod__base-price {
        font-size: 0.9375rem;
        font-weight: 700;
        color: var(--color-primary-container, #f2a922);
      }
      .sf-mod__close {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        inline-size: 2rem;
        block-size: 2rem;
        border: none;
        background: var(--color-surface-container, #f4ede5);
        border-radius: 50%;
        cursor: pointer;
        color: var(--color-on-surface-variant, #514534);
        flex-shrink: 0;
      }
      .sf-mod__close svg {
        inline-size: 1rem;
        block-size: 1rem;
      }

      .sf-mod__body {
        flex: 1;
        overflow-y: auto;
        padding: 1rem 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .sf-mod__group {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
      }
      .sf-mod__group-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .sf-mod__group-name {
        font-size: 0.9375rem;
        font-weight: 700;
        color: var(--color-primary, #805600);
        margin: 0;
      }
      .sf-mod__required-badge {
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding-block: 0.125rem;
        padding-inline: 0.5rem;
        background: var(--color-primary-container, #f2a922);
        color: var(--color-on-primary-container, #634100);
        border-radius: 9999px;
      }
      .sf-mod__optional-badge {
        font-size: 0.6875rem;
        font-weight: 600;
        color: var(--color-on-surface-variant, #514534);
        padding-block: 0.125rem;
        padding-inline: 0.5rem;
        border: 1px solid var(--color-outline-variant, #d6c4ad);
        border-radius: 9999px;
      }

      .sf-mod__options {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }
      .sf-mod__option {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        padding: 0.625rem 0.875rem;
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        border-radius: 10px;
        cursor: pointer;
        transition: border-color 0.15s, background-color 0.15s;
        background: var(--color-surface, #ffffff);
      }
      .sf-mod__option:hover {
        border-color: var(--color-primary, #805600);
      }
      .sf-mod__option:has(input:checked) {
        border-color: var(--color-primary-container, #f2a922);
        background: color-mix(in srgb, var(--color-primary-container, #f2a922) 12%, transparent);
      }
      .sf-mod__radio,
      .sf-mod__checkbox {
        accent-color: var(--color-primary, #805600);
        inline-size: 1rem;
        block-size: 1rem;
        flex-shrink: 0;
        cursor: pointer;
      }
      .sf-mod__option-name {
        flex: 1;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-on-surface, #1e1b17);
      }
      .sf-mod__option-price {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--color-on-surface-variant, #514534);
      }

      .sf-mod__instructions {
        inline-size: 100%;
        padding: 0.625rem 0.875rem;
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        border-radius: 10px;
        background: var(--color-surface, #ffffff);
        color: var(--color-on-surface, #1e1b17);
        font-size: 0.875rem;
        font-family: inherit;
        resize: vertical;
        transition: border-color 0.15s;
      }
      .sf-mod__instructions:focus {
        outline: none;
        border-color: var(--color-primary, #805600);
      }

      .sf-mod__footer {
        padding: 1rem 1.25rem;
        border-block-start: 1px solid var(--color-outline-variant, #d6c4ad);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-shrink: 0;
        background: var(--color-background, #fff8f1);
      }

      .sf-mod__quantity {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        flex-shrink: 0;
      }
      .sf-mod__qty-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        inline-size: 2rem;
        block-size: 2rem;
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        border-radius: 50%;
        background: var(--color-surface, #ffffff);
        color: var(--color-primary, #805600);
        font-size: 1.25rem;
        font-weight: 300;
        cursor: pointer;
        transition: border-color 0.15s;
        line-height: 1;
      }
      .sf-mod__qty-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .sf-mod__qty-btn:hover:not(:disabled) {
        border-color: var(--color-primary, #805600);
      }
      .sf-mod__qty-value {
        min-inline-size: 1.5rem;
        text-align: center;
        font-size: 1rem;
        font-weight: 700;
        color: var(--color-on-surface, #1e1b17);
      }

      .sf-mod__total {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.125rem;
      }
      .sf-mod__total-label {
        font-size: 0.6875rem;
        color: var(--color-on-surface-variant, #514534);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .sf-mod__total-value {
        font-size: 1.125rem;
        font-weight: 800;
        color: var(--color-primary-container, #f2a922);
      }

      .sf-mod__confirm-btn {
        padding-block: 0.625rem;
        padding-inline: 1.5rem;
        background: var(--color-primary, #805600);
        color: var(--color-on-primary, #ffffff);
        border: none;
        border-radius: 9999px;
        font-size: 0.9375rem;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        transition: background-color 0.2s;
        white-space: nowrap;
      }
      .sf-mod__confirm-btn:hover:not(:disabled) {
        background: var(--color-primary-container, #f2a922);
        color: var(--color-on-primary-container, #634100);
      }
      .sf-mod__confirm-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
    `,
  ],
})
export class RestaurantModifierSelectorComponent implements OnChanges {
  @Input() item: CatalogItemDetail | null = null;
  @Input() open = false;
  @Input() lang: 'en' | 'ar' = 'en';
  @Output() confirm = new EventEmitter<ModifierConfirmEvent>();
  @Output() closed = new EventEmitter<void>();

  readonly quantity = signal(1);
  readonly instructions = signal('');
  private readonly _selections = signal<Map<string, string[]>>(new Map());

  readonly totalPrice = computed(() => {
    if (!this.item) return 0;
    const modTotal = [...this._selections().entries()].reduce((sum, [groupId, optIds]) => {
      const group = this.item?.modifierGroups?.find((g) => g.id === groupId);
      if (!group) return sum;
      return (
        sum +
        optIds.reduce((gs, optId) => {
          const opt = group.options.find((o) => o.id === optId);
          return gs + (opt?.price ?? 0);
        }, 0)
      );
    }, 0);
    return (this.item.price + modTotal) * this.quantity();
  });

  readonly canConfirm = computed(() => {
    if (!this.item) return false;
    const required = (this.item.modifierGroups ?? []).filter((g) => g.isRequired);
    return required.every((g) => {
      const sel = this._selections().get(g.id);
      return sel && sel.length > 0;
    });
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['item'] || changes['open']) {
      if (this.open) {
        this.quantity.set(1);
        this.instructions.set('');
        this._selections.set(new Map());
      }
    }
  }

  isSelected(groupId: string, optId: string): boolean {
    return this._selections().get(groupId)?.includes(optId) ?? false;
  }

  onSingleSelect(group: ModifierGroup, opt: ModifierOption): void {
    this._selections.update((m) => {
      const updated = new Map(m);
      updated.set(group.id, [opt.id]);
      return updated;
    });
  }

  onMultiSelect(group: ModifierGroup, opt: ModifierOption, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this._selections.update((m) => {
      const updated = new Map(m);
      const current = updated.get(group.id) ?? [];
      updated.set(
        group.id,
        checked ? [...current, opt.id] : current.filter((id) => id !== opt.id),
      );
      return updated;
    });
  }

  onInstructions(event: Event): void {
    this.instructions.set((event.target as HTMLTextAreaElement).value);
  }

  increaseQty(): void {
    this.quantity.update((q) => q + 1);
  }

  decreaseQty(): void {
    this.quantity.update((q) => Math.max(1, q - 1));
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as Element).classList.contains('sf-mod__overlay')) {
      this.close();
    }
  }

  close(): void {
    this.closed.emit();
  }

  confirmAdd(): void {
    if (!this.item || !this.canConfirm()) return;
    const modifiers: SelectedModifier[] = [];
    for (const [groupId, optIds] of this._selections().entries()) {
      const group = this.item.modifierGroups?.find((g) => g.id === groupId);
      if (!group) continue;
      for (const optId of optIds) {
        const opt = group.options.find((o) => o.id === optId);
        if (!opt) continue;
        modifiers.push({
          groupId: group.id,
          groupNameEn: group.nameEn,
          groupNameAr: group.nameAr,
          optionId: opt.id,
          optionNameEn: opt.nameEn,
          optionNameAr: opt.nameAr,
          price: opt.price,
        });
      }
    }
    this.confirm.emit({
      modifiers,
      quantity: this.quantity(),
      instructions: this.instructions(),
    });
  }
}
