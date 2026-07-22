'use client';

import type { ReactNode } from 'react';
import type { HeroContentPosition, HeroTextAlign } from '@kurumsal/shared';
import { AlignCenter, AlignLeft, AlignRight, isValidHexColor } from './hero-editor-icons';

type SwitchProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
};

export function HeroSwitch({ checked, onChange, label, hint, disabled }: SwitchProps) {
  return (
    <div className={`he-switch${disabled ? ' is-disabled' : ''}`}>
      <div className="he-switch__copy">
        <span className="he-switch__label">{label}</span>
        {hint ? <span className="he-switch__hint">{hint}</span> : null}
      </div>
      <button
        type="button"
        role="switch"
        className={`he-switch__control${checked ? ' is-on' : ''}`}
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className="he-switch__thumb" aria-hidden="true" />
      </button>
    </div>
  );
}

type SegmentOption<T extends string> = { value: T; label: string };

export function HeroSegmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="he-segmented" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`he-segmented__btn${value === option.value ? ' is-active' : ''}`}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

const POSITIONS: Array<{ value: HeroContentPosition; label: string }> = [
  { value: 'TOP_LEFT', label: 'Sol üst' },
  { value: 'TOP_CENTER', label: 'Üst orta' },
  { value: 'TOP_RIGHT', label: 'Sağ üst' },
  { value: 'MIDDLE_LEFT', label: 'Sol orta' },
  { value: 'MIDDLE_CENTER', label: 'Merkez' },
  { value: 'MIDDLE_RIGHT', label: 'Sağ orta' },
  { value: 'BOTTOM_LEFT', label: 'Sol alt' },
  { value: 'BOTTOM_CENTER', label: 'Alt orta' },
  { value: 'BOTTOM_RIGHT', label: 'Sağ alt' },
];

export function HeroPositionPicker({
  value,
  onChange,
}: {
  value: HeroContentPosition;
  onChange: (value: HeroContentPosition) => void;
}) {
  return (
    <div className="he-position" role="group" aria-label="İçerik konumu">
      {POSITIONS.map((item) => (
        <button
          key={item.value}
          type="button"
          className={`he-position__cell${value === item.value ? ' is-active' : ''}`}
          aria-label={item.label}
          aria-pressed={value === item.value}
          onClick={() => onChange(item.value)}
        />
      ))}
    </div>
  );
}

export function HeroAlignPicker({
  value,
  onChange,
}: {
  value: HeroTextAlign;
  onChange: (value: HeroTextAlign) => void;
}) {
  return (
    <div className="he-align" role="group" aria-label="Metin hizası">
      {(
        [
          ['LEFT', AlignLeft, 'Sola'],
          ['CENTER', AlignCenter, 'Ortala'],
          ['RIGHT', AlignRight, 'Sağa'],
        ] as const
      ).map(([align, Icon, label]) => (
        <button
          key={align}
          type="button"
          className={`he-align__btn${value === align ? ' is-active' : ''}`}
          aria-label={label}
          aria-pressed={value === align}
          onClick={() => onChange(align)}
        >
          <Icon />
        </button>
      ))}
    </div>
  );
}

export function HeroColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const hex = value.startsWith('#') ? value.slice(0, 7) : '#000000';
  return (
    <label className="he-field">
      <span className="he-field__label">{label}</span>
      <div className="he-color">
        <input
          type="color"
          className="he-color__swatch"
          value={hex}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label} seçici`}
        />
        <input
          type="text"
          className="he-color__hex"
          value={value}
          spellCheck={false}
          onChange={(event) => {
            const next = event.target.value.trim();
            if (next === 'transparent' || isValidHexColor(next) || next.startsWith('#')) {
              onChange(next);
            }
          }}
          onBlur={(event) => {
            const next = event.target.value.trim();
            if (next !== 'transparent' && !isValidHexColor(next)) {
              onChange(hex);
            }
          }}
        />
      </div>
    </label>
  );
}

export function HeroSliderField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  displayValue,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  displayValue?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="he-field">
      <span className="he-field__label">
        {label}
        <span className="he-field__value">{displayValue ?? `${value}${suffix}`}</span>
      </span>
      <div className="he-slider">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <div className="he-slider__input">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
          />
          <span>{suffix}</span>
        </div>
      </div>
    </label>
  );
}

export function HeroTextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
  maxLength,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string | null;
  maxLength?: number;
  multiline?: boolean;
}) {
  return (
    <label className="he-field">
      <span className="he-field__label">
        {label}
        {required ? <span className="he-field__req">*</span> : null}
        {maxLength != null ? (
          <span className="he-field__value">
            {value.length}/{maxLength}
          </span>
        ) : null}
      </span>
      {multiline ? (
        <textarea
          className={`he-input${error ? ' is-invalid' : ''}`}
          rows={4}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className={`he-input${error ? ' is-invalid' : ''}`}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {error ? <span className="he-field__error">{error}</span> : null}
    </label>
  );
}

export function HeroSelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <label className="he-field">
      <span className="he-field__label">{label}</span>
      <select className="he-input he-input--select" value={value} onChange={(event) => onChange(event.target.value as T)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function HeroAccordion({
  id,
  title,
  icon,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  icon: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className={`he-acc${open ? ' is-open' : ''}`}>
      <button type="button" className="he-acc__head" aria-expanded={open} aria-controls={`he-acc-${id}`} onClick={onToggle}>
        <span className="he-acc__icon" aria-hidden="true">
          {icon}
        </span>
        <span className="he-acc__title">{title}</span>
        <span className="he-acc__chevron" aria-hidden="true" />
      </button>
      {open ? (
        <div id={`he-acc-${id}`} className="he-acc__body">
          {children}
        </div>
      ) : null}
    </section>
  );
}
