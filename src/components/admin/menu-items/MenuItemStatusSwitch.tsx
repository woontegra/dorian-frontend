'use client';

type MenuItemStatusSwitchProps = {
  checked: boolean;
  disabled?: boolean;
  label?: string;
  onChange: (checked: boolean) => void;
};

export function MenuItemStatusSwitch({
  checked,
  disabled = false,
  label = 'Aktif',
  onChange,
}: MenuItemStatusSwitchProps) {
  return (
    <div className="mi-status-switch">
      <div className="mi-status-switch__copy">
        <p className="mi-status-switch__label">{label}</p>
        <p className="mi-status-switch__value">{checked ? 'Aktif' : 'Pasif'}</p>
        <p className="mi-status-switch__hint">Pasif menü öğeleri public sitede gösterilmez.</p>
      </div>
      <button
        type="button"
        role="switch"
        className={`mi-status-switch__control${checked ? ' mi-status-switch__control--on' : ''}`}
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className="mi-status-switch__thumb" aria-hidden="true" />
      </button>
    </div>
  );
}
