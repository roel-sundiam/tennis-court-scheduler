import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoinBalanceComponent } from './coin-balance.component';

describe('CoinBalanceComponent', () => {
  let component: CoinBalanceComponent;
  let fixture: ComponentFixture<CoinBalanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoinBalanceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CoinBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
