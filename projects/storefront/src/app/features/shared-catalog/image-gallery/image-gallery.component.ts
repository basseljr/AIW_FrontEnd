import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  signal,
} from '@angular/core';
import { ProductImage } from '../../../core/models/catalog.model';

@Component({
  selector: 'sf-image-gallery',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sf-gallery">
      <!-- Main image -->
      <div class="sf-gallery__main">
        @if (activeImage()) {
          <img
            class="sf-gallery__main-img"
            [src]="activeImage()!.imageUrl"
            [alt]="altText"
            loading="lazy"
            width="600"
            height="450"
          />
        } @else {
          <div class="sf-gallery__placeholder" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        }
      </div>

      <!-- Thumbnail strip -->
      @if (images.length > 1) {
        <div class="sf-gallery__thumbs" role="list" aria-label="Product images">
          @for (img of images; track img.id) {
            <button
              class="sf-gallery__thumb"
              [class.sf-gallery__thumb--active]="activeImage()?.id === img.id"
              type="button"
              role="listitem"
              [attr.aria-current]="activeImage()?.id === img.id ? 'true' : null"
              (click)="setActive(img)"
            >
              <img
                [src]="img.imageUrl"
                [alt]="img.altTextEn ?? altText"
                loading="lazy"
                width="80"
                height="60"
              />
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .sf-gallery {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .sf-gallery__main {
        border-radius: 16px;
        overflow: hidden;
        background: var(--color-surface-container, #f4ede5);
        aspect-ratio: 4 / 3;
      }
      .sf-gallery__main-img {
        inline-size: 100%;
        block-size: 100%;
        object-fit: cover;
        transition: transform 0.4s ease;
      }
      .sf-gallery__main:hover .sf-gallery__main-img {
        transform: scale(1.04);
      }
      .sf-gallery__placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        inline-size: 100%;
        block-size: 100%;
        color: var(--color-outline-variant, #d6c4ad);
      }
      .sf-gallery__placeholder svg {
        inline-size: 4rem;
        block-size: 4rem;
      }

      /* Thumbnails */
      .sf-gallery__thumbs {
        display: flex;
        gap: 0.5rem;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        scrollbar-width: none;
        padding-block-end: 0.25rem;
      }
      .sf-gallery__thumbs::-webkit-scrollbar {
        display: none;
      }

      .sf-gallery__thumb {
        flex-shrink: 0;
        scroll-snap-align: start;
        border: 2px solid var(--color-outline-variant, #d6c4ad);
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        padding: 0;
        background: transparent;
        transition: border-color 0.15s;
        inline-size: 5rem;
        block-size: 3.75rem;
      }
      .sf-gallery__thumb img {
        inline-size: 100%;
        block-size: 100%;
        object-fit: cover;
        display: block;
      }
      .sf-gallery__thumb:hover {
        border-color: var(--color-primary, #805600);
      }
      .sf-gallery__thumb--active {
        border-color: var(--color-primary-container, #f2a922);
        border-width: 2.5px;
      }
    `,
  ],
})
export class ImageGalleryComponent implements OnChanges {
  @Input() images: ProductImage[] = [];
  @Input() altText = '';

  readonly activeImage = signal<ProductImage | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['images']) {
      const primary = this.images.find((i) => i.isPrimary) ?? this.images[0] ?? null;
      this.activeImage.set(primary);
    }
  }

  setActive(img: ProductImage): void {
    this.activeImage.set(img);
  }
}
