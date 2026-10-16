'use client';

import { useRef } from 'react';
import { cn } from '@/lib/cn';
import { toEnDigits, toFaDigits } from '@/lib/format';

interface OtpInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  onComplete: (code: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}

/** Four single-digit boxes: auto-advance, backspace to previous, arrow navigation and full-code paste. */
export function OtpInput({ value, onChange, onComplete, disabled, invalid }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const length = value.length;

  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  const commit = (next: string[]) => {
    onChange(next);
    if (next.every((d) => d !== '')) onComplete(next.join(''));
  };

  const handleChange = (index: number, raw: string) => {
    const digits = toEnDigits(raw).replace(/\D/g, '');
    if (!digits) {
      const next = [...value];
      next[index] = '';
      onChange(next);
      return;
    }
    // Typing over a filled box or autofill can deliver several digits at once.
    const next = [...value];
    let cursor = index;
    for (const d of digits) {
      if (cursor >= length) break;
      next[cursor++] = d;
    }
    commit(next);
    focus(cursor);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      e.preventDefault();
      const next = [...value];
      next[index - 1] = '';
      onChange(next);
      focus(index - 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focus(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focus(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const digits = toEnDigits(e.clipboardData.getData('text')).replace(/\D/g, '').slice(0, length);
    if (!digits) return;
    e.preventDefault();
    const next = Array.from({ length }, (_, i) => digits[i] ?? '');
    commit(next);
    focus(digits.length);
  };

  return (
    <div className="flex justify-center gap-3 sm:gap-8" dir="ltr" onPaste={handlePaste}>
      {value.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          value={digit ? toFaDigits(digit) : ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          autoFocus={i === 0}
          aria-label={`رقم ${toFaDigits(String(i + 1))} کد تأیید`}
          className={cn(
            'size-[64px] rounded-xl border-2 bg-surface text-center text-[30px] font-black text-ink outline-none transition sm:size-[104px] sm:text-[44px]',
            'focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 disabled:opacity-60',
            invalid ? 'border-danger/50' : digit ? 'border-brand-500/40' : 'border-line-strong',
          )}
        />
      ))}
    </div>
  );
}
