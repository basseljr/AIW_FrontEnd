#!/usr/bin/env node
/**
 * Translation parity linter — PRD §29.
 *
 * Loads `projects/shared-i18n/src/lib/assets/i18n/{en,ar}.json` and verifies
 * both files have the exact same key set. Missing keys on either side cause
 * a non-zero exit so the CI pipeline fails on translation drift.
 */
const fs = require('fs');
const path = require('path');

const I18N_DIR = path.join(__dirname, '..', 'projects', 'shared-i18n', 'src', 'lib', 'assets', 'i18n');

function loadLocale(name) {
  const file = path.join(I18N_DIR, `${name}.json`);
  if (!fs.existsSync(file)) {
    console.error(`Missing translation file: ${file}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function flatten(obj, prefix = '') {
  const out = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      out.push(...flatten(value, fullKey));
    } else {
      out.push(fullKey);
    }
  }
  return out;
}

const en = loadLocale('en');
const ar = loadLocale('ar');

const enKeys = new Set(flatten(en));
const arKeys = new Set(flatten(ar));

const missingInAr = [...enKeys].filter((k) => !arKeys.has(k)).sort();
const missingInEn = [...arKeys].filter((k) => !enKeys.has(k)).sort();

let failed = false;

if (missingInAr.length > 0) {
  failed = true;
  console.error('Missing Arabic translations:');
  for (const k of missingInAr) console.error(`  - ${k}`);
}
if (missingInEn.length > 0) {
  failed = true;
  console.error('Missing English translations:');
  for (const k of missingInEn) console.error(`  - ${k}`);
}

if (failed) {
  process.exit(1);
}

console.log(`OK — ${enKeys.size} keys present in both en.json and ar.json`);
