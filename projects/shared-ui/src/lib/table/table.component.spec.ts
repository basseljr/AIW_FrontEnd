import { TestBed } from '@angular/core/testing';
import { TableColumn, TableComponent } from './table.component';

interface TestRow {
  id: string;
  name: string;
}

describe('TableComponent', () => {
  const columns: TableColumn<TestRow>[] = [
    { key: 'name', label: 'Name', field: 'name' },
  ];

  function build(): ReturnType<typeof TestBed.createComponent<TableComponent<TestRow>>> {
    return TestBed.configureTestingModule({
      imports: [TableComponent],
    }).createComponent<TableComponent<TestRow>>(TableComponent);
  }

  it('renders an empty state when rows is empty and loading is false', () => {
    const fixture = build();
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rows', []);
    fixture.componentRef.setInput('emptyMessage', 'Nothing here');
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector('.ui-table__empty');
    expect(empty?.textContent?.trim()).toBe('Nothing here');
  });

  it('renders skeleton rows when loading', () => {
    const fixture = build();
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rows', []);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const skeletonBars = fixture.nativeElement.querySelectorAll('.ui-table__skeleton-bar');
    expect(skeletonBars.length).toBeGreaterThan(0);
  });

  it('renders row data using the column field', () => {
    const fixture = build();
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rows', [
      { id: '1', name: 'Alpha' },
      { id: '2', name: 'Beta' },
    ]);
    fixture.detectChanges();

    const cells = Array.from(
      fixture.nativeElement.querySelectorAll('.ui-table__td'),
    ) as HTMLElement[];
    expect(cells.map((c) => c.textContent?.trim())).toEqual(['Alpha', 'Beta']);
  });
});
