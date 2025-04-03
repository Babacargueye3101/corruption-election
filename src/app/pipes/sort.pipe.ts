import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sort'
})
export class SortPipe implements PipeTransform {
  transform(items: any[], field: string, reverse: boolean = false): any[] {
    if (!items) return [];
    if (!field) return items;

    return items.slice().sort((a, b) => {
      const aValue = a[field] ?? a.value;
      const bValue = b[field] ?? b.value;

      if (aValue < bValue) return reverse ? 1 : -1;
      if (aValue > bValue) return reverse ? -1 : 1;
      return 0;
    });
  }
}