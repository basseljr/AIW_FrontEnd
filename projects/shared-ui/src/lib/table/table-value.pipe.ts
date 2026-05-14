import { Pipe, PipeTransform } from '@angular/core';

/**
 * Reads a field from a row object for the default cell rendering in
 * `<ui-table>`. Lives in its own file so it can be imported by the table
 * component without forward-reference gymnastics. Returns '' for null/missing
 * values so cells stay empty rather than showing "undefined".
 */
@Pipe({ name: 'tableValue', standalone: true, pure: true })
export class TableValuePipe implements PipeTransform {
  transform(row: unknown, field: string): unknown {
    if (row === null || row === undefined || typeof row !== 'object') {
      return '';
    }
    const value = (row as Record<string, unknown>)[field];
    return value === null || value === undefined ? '' : value;
  }
}
