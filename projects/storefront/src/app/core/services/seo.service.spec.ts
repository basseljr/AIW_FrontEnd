import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

import { SeoService } from './seo.service';
import { DEFAULT_DEV_TENANT } from '../models/tenant-config.model';

describe('SeoService', () => {
  let service: SeoService;
  let titleService: Title;
  let metaService: Meta;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SeoService] });
    service = TestBed.inject(SeoService);
    titleService = TestBed.inject(Title);
    metaService = TestBed.inject(Meta);
  });

  it('sets the page title combining page title with business name', () => {
    service.setPageMeta(
      { titleEn: 'Menu', titleAr: 'القائمة' },
      DEFAULT_DEV_TENANT,
      'en',
    );
    expect(titleService.getTitle()).toBe('Menu — The Golden Oasis');
  });

  it('uses Arabic title + business name when lang is ar', () => {
    service.setPageMeta(
      { titleEn: 'Menu', titleAr: 'القائمة' },
      DEFAULT_DEV_TENANT,
      'ar',
    );
    expect(titleService.getTitle()).toBe('القائمة — الواحة الذهبية');
  });

  it('sets meta description', () => {
    service.setPageMeta(
      { titleEn: 'Home', descriptionEn: 'Best restaurant in Kuwait' },
      DEFAULT_DEV_TENANT,
      'en',
    );
    const desc = metaService.getTag('name="description"');
    expect(desc?.content).toBe('Best restaurant in Kuwait');
  });

  it('sets og:title meta', () => {
    service.setPageMeta({ titleEn: 'Home' }, DEFAULT_DEV_TENANT, 'en');
    const ogTitle = metaService.getTag('property="og:title"');
    expect(ogTitle?.content).toContain('Home');
  });

  it('falls back to tenant seo.metaDescriptionEn when pageMeta has no description', () => {
    service.setPageMeta({ titleEn: 'Home' }, DEFAULT_DEV_TENANT, 'en');
    const desc = metaService.getTag('name="description"');
    expect(desc?.content).toBe(DEFAULT_DEV_TENANT.seo.metaDescriptionEn!);
  });
});
