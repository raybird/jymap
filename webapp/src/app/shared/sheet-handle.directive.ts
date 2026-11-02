import { Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { resolveSheetState, SHEET_PEEK_HEIGHT, SHEET_TOP_GAP, SheetState } from '../core/utils/viewport';

/** 底部面板的拖曳把手：拖曳時跟手改高度，放開後由 resolveSheetState 決定停靠點。 */
@Directive({ selector: '[appSheetHandle]', standalone: true })
export class SheetHandleDirective {
  @Input('appSheetHandle') state: SheetState = 'half';
  @Output() sheetStateChange = new EventEmitter<SheetState>();

  private panel: HTMLElement | null = null;
  private startY = 0;
  private startHeight = 0;

  constructor(private el: ElementRef<HTMLElement>) {}

  @HostListener('pointerdown', ['$event'])
  onPointerDown(e: PointerEvent): void {
    this.panel = this.el.nativeElement.closest('mat-sidenav');
    if (!this.panel) return;
    this.startY = e.clientY;
    this.startHeight = this.panel.offsetHeight;
    this.panel.classList.add('sheet-dragging');
    this.el.nativeElement.setPointerCapture?.(e.pointerId);
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(e: PointerEvent): void {
    if (!this.panel) return;
    const height = this.startHeight + this.startY - e.clientY;
    const max = window.innerHeight - SHEET_TOP_GAP;
    this.panel.style.height = `${Math.max(SHEET_PEEK_HEIGHT, Math.min(max, height))}px`;
  }

  @HostListener('pointerup')
  @HostListener('pointercancel')
  onPointerEnd(): void {
    if (!this.panel) return;
    const endHeight = this.panel.offsetHeight;
    this.panel.style.height = '';
    this.panel.classList.remove('sheet-dragging');
    this.panel = null;
    this.sheetStateChange.emit(resolveSheetState(this.state, this.startHeight, endHeight, window.innerHeight));
  }

  // 鍵盤操作不會有 pointer 事件，detail 為 0 代表由 Enter 或空白鍵觸發
  @HostListener('click', ['$event'])
  onClick(e: MouseEvent): void {
    if (e.detail === 0) this.sheetStateChange.emit(this.state === 'half' ? 'full' : 'half');
  }
}
