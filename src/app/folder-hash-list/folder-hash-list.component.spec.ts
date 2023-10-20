import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FolderHashListComponent } from './folder-hash-list.component';

describe('FolderHashListComponent', () => {
  let component: FolderHashListComponent;
  let fixture: ComponentFixture<FolderHashListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FolderHashListComponent]
    });
    fixture = TestBed.createComponent(FolderHashListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
