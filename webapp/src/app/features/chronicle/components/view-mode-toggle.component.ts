import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ViewMode } from '../../../core/state/time-map.reducer';

@Component({
  selector: 'app-view-mode-toggle',
  template: `
    <div class="toggle" role="group" aria-label="顯示方式">
      <button type="button" [attr.aria-pressed]="mode === 'map'" (click)="modeChange.emit('map')">地圖</button>
      <button type="button" [attr.aria-pressed]="mode === 'chronicle'" (click)="modeChange.emit('chronicle')">年表</button>
    </div>
  `,
  styles: [`
    :host {
      flex: none;
      display: block;
      padding: 4px;
      border: 1px solid rgba(210, 190, 160, 0.2);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.72);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      box-shadow: 0 2px 16px rgba(0, 0, 0, 0.05);
    }
    .toggle { display: flex; gap: 2px; }
    button {
      min-width: 52px;
      min-height: 44px;
      padding: 0 10px;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: #514332;
      font: inherit;
      font-size: 0.9rem;
      cursor: pointer;
    }
    button[aria-pressed='true'] { background: #efe3c7; color: #2c241b; font-weight: 600; }
    button:focus-visible { outline: 2px solid #8b2030; outline-offset: 2px; }
  `]
})
export class ViewModeToggleComponent {
  @Input() mode: ViewMode = 'map';
  @Output() modeChange = new EventEmitter<ViewMode>();
}
