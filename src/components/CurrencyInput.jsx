import React, { useState } from 'react';
import { parseCurrencyValue, formatCurrencyNoSymbol } from '../utils/money';

function toEditableAmount(value) {
  if (!value?.trim()) return '';
  const num = parseCurrencyValue(value);
  if (num === 0 && !/\d/.test(value)) return '';
  if (num % 1 === 0) return String(Math.round(num));
  return num.toFixed(2).replace('.', ',');
}

function sanitizeTyping(value) {
  let s = value.replace(/[^\d,]/g, '');
  const commaIdx = s.indexOf(',');
  if (commaIdx !== -1) {
    s = s.slice(0, commaIdx + 1) + s.slice(commaIdx + 1).replace(/,/g, '');
    const [intPart, decPart = ''] = s.split(',');
    s = intPart + ',' + decPart.slice(0, 2);
  }
  return s;
}

const CurrencyInput = ({ value, onChange, className, placeholder, disabled, required }) => {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');

  const displayValue = focused
    ? draft
    : (value?.trim() ? formatCurrencyNoSymbol(parseCurrencyValue(value)) : '');

  const handleFocus = () => {
    setDraft(toEditableAmount(value));
    setFocused(true);
  };

  const handleBlur = () => {
    setFocused(false);
    const trimmed = draft.trim();
    if (!trimmed) {
      onChange('');
      return;
    }
    onChange(formatCurrencyNoSymbol(parseCurrencyValue(trimmed)));
  };

  const handleChange = (e) => {
    const next = sanitizeTyping(e.target.value);
    setDraft(next);
    onChange(next);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      placeholder={placeholder}
      value={displayValue}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      disabled={disabled}
      required={required}
    />
  );
};

export default CurrencyInput;
