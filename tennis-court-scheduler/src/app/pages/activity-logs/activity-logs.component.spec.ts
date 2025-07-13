import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityLogsComponent } from './activity-logs.component';

describe('ActivityLogsComponent', () => {
  let component: ActivityLogsComponent;
  let fixture: ComponentFixture<ActivityLogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityLogsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ActivityLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
