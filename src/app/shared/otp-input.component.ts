import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  QueryList,
  ViewChildren,
  ElementRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'az-otp-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="otp-wrap">
      <div class="d-flex align-items-center gap-2 mb-2">
        <button
          type="button"
          class="btn btn-join btn-lg"
          (click)="sendOtp()"
          [disabled]="countdown > 0"
        >
          {{ countdown > 0 ? 'Resend in ' + countdown + 's' : sent ? 'Resend OTP' : 'Send OTP' }}
        </button>
        <div class="small text-secondary" *ngIf="phone">to {{ phone }}</div>
      </div>

      <div *ngIf="sent" class="otp-grid" role="group" aria-label="Enter OTP">
        <input
          *ngFor="let d of digits; let i = index; trackBy: trackByIndex"
          #otpBox
          class="otp-input"
          type="tel"
          inputmode="numeric"
          maxlength="1"
          autocomplete="one-time-code"
          [(ngModel)]="digits[i]"
          [ngModelOptions]="{ standalone: true }"
          (input)="onInput($event, i)"
          (keydown)="onKey($event, i)"
          (paste)="onPaste($event)"
        />
        <button
          type="button"
          class="btn btn-join btn-lg ms-2"
          (click)="verifyOtp()"
          [disabled]="!isComplete"
        >
          Verify
        </button>
      </div>
      <div class="small mt-2" *ngIf="verified">
        <span class="badge bg-light text-dark">Phone verified</span>
      </div>
      <div class="text-danger small mt-2" *ngIf="errorMessage">{{ errorMessage }}</div>
    </div>
  `,
  styles: [
    `
      .otp-grid {
        display: flex;
        align-items: center;
      }
      .otp-input {
        width: 42px;
        height: 48px;
        text-align: center;
        border: 1px solid #e7e9f3;
        border-radius: 10px;
        font-size: 18px;
        margin-right: 8px;
      }
      .otp-input:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        border-color: #b9bdfc;
      }
    `,
  ],
})
export class OtpInputComponent implements OnDestroy {
  @Input() phone = '';
  @Input() length = 6;
  @Input() cooldownSec = 30;
  @Input() verified = false;
  @Input() errorMessage: string | null = null;

  @Output() requestOtp = new EventEmitter<void>();
  @Output() verify = new EventEmitter<string>();

  digits: string[] = [];
  countdown = 0;
  private timer: any;
  sent = false;

  @ViewChildren('otpBox') private otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor() {
    this.resetDigits();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  get isComplete(): boolean {
    return this.digits.join('').length === this.length;
  }

  private resetDigits() {
    this.digits = Array.from({ length: this.length }, () => '');
  }

  trackByIndex(i: number) {
    return i;
  }

  sendOtp() {
    this.sent = true;
    this.requestOtp.emit();
    this.startCountdown();
    this.resetDigits();
  }

  private startCountdown() {
    this.countdown = this.cooldownSec;
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.countdown -= 1;
      if (this.countdown <= 0) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }, 1000);
  }

  onInput(ev: Event, idx: number) {
    const el = ev.target as HTMLInputElement;
    const v = (el.value || '').replace(/\D+/g, '').slice(-1);
    this.digits[idx] = v;
    el.value = v;
    if (v && idx < this.length - 1) {
      const next = this.otpInputs.get(idx + 1)?.nativeElement;
      next?.focus();
      next?.select?.();
    }
  }

  onKey(ev: KeyboardEvent, idx: number) {
    const el = ev.target as HTMLInputElement;
    if (ev.key === 'Backspace' && !el.value && idx > 0) {
      const prev = this.otpInputs.get(idx - 1)?.nativeElement;
      this.digits[idx - 1] = '';
      prev?.focus();
      prev?.select?.();
    }
  }

  onPaste(ev: ClipboardEvent) {
    const text = ev.clipboardData?.getData('text') || '';
    const nums = text.replace(/\D+/g, '').slice(0, this.length).split('');
    if (!nums.length) return;
    ev.preventDefault();
    this.digits = Array.from({ length: this.length }, (_, i) => nums[i] || '');
    const lastIdx = Math.min(nums.length, this.length) - 1;
    const next = this.otpInputs.get(Math.max(lastIdx, 0))?.nativeElement;
    next?.focus();
    next?.select?.();
  }

  verifyOtp() {
    const code = this.digits.join('');
    if (code.length === this.length) this.verify.emit(code);
  }
}
