import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {

  currentPage = input.required<number>();
  totalPages = input.required<number>();

  pageChange = output<number>();

  readonly isFirst = computed(() => this.currentPage() === 0);
  readonly isLast = computed(() => this.currentPage() >= this.totalPages() - 1);

  previous(): void {
    if (!this.isFirst()) {
      this.pageChange.emit(this.currentPage() - 1);
    }
  }

  next(): void {
    if (!this.isLast()) {
      this.pageChange.emit(this.currentPage() + 1);
    }
  }
}
