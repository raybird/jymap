import { fakeAsync, tick } from '@angular/core/testing';
import { SearchService } from '../../../core/services/search.service';
import { SearchBoxComponent } from './search-box.component';

function input(component: SearchBoxComponent, value: string): void {
  component.onSearchInput({ target: { value } } as unknown as Event);
}

describe('SearchBoxComponent', () => {
  it('清空輸入會取消尚未完成的搜尋', fakeAsync(() => {
    const service = new SearchService();
    const search = spyOn(service, 'search').and.returnValue([]);
    const component = new SearchBoxComponent(service);
    component.ngOnInit();
    input(component, '郭靖');
    input(component, '');
    tick(200);
    expect(search).not.toHaveBeenCalled();
    component.ngOnDestroy();
  }));

  it('清除後立即重新輸入相同關鍵字仍會搜尋', fakeAsync(() => {
    const service = new SearchService();
    const search = spyOn(service, 'search').and.returnValue([]);
    const component = new SearchBoxComponent(service);
    component.ngOnInit();
    input(component, '郭靖');
    tick(200);
    component.clearSearch();
    input(component, '郭靖');
    tick(200);
    expect(search).toHaveBeenCalledTimes(2);
    component.ngOnDestroy();
  }));
});
