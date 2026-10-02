import { useEffect, useState } from 'react';

/**
 * Number input that keeps its own text while typing (so "12." or "" don't get clobbered)
 * and re-syncs when the underlying value changes from elsewhere.
 */
export function NumInput({
  value,
  onChange,
  decimals = false,
  ...rest
}: {
  value: number;
  onChange: (v: number) => void;
  decimals?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const fmt = (v: number) => (v ? String(Math.round(v * 100) / 100) : '');
  const [text, setText] = useState(fmt(value));

  useEffect(() => {
    const parsed = Number(text) || 0;
    if (Math.abs(parsed - value) > 0.01) setText(fmt(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      {...rest}
      type="text"
      inputMode={decimals ? 'decimal' : 'numeric'}
      value={text}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const t = e.target.value.replace(',', '.');
        if (!/^\d*\.?\d*$/.test(t)) return;
        setText(t);
        onChange(Number(t) || 0);
      }}
    />
  );
}
