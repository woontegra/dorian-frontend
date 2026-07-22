'use client';

type ProductCategoryStatusSwitchProps = {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  showParentInactiveHint?: boolean;
};

export function ProductCategoryStatusSwitch({
  checked,
  disabled = false,
  onChange,
  showParentInactiveHint = false,
}: ProductCategoryStatusSwitchProps) {
  return (
    <div className="pc-status-switch">
      <div className="pc-status-switch__copy">
        <p className="pc-status-switch__label">Yayın Durumu</p>
        <p className="pc-status-switch__value">{checked ? 'Aktif' : 'Pasif'}</p>
        <p className="pc-status-switch__hint">Pasif kategoriler sitede görünmez.</p>
      </div>
      <button
        type="button"
        role="switch"
        className={`pc-status-switch__control${checked ? ' pc-status-switch__control--on' : ''}`}
        aria-checked={checked}
        aria-label="Yayın Durumu"
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className="pc-status-switch__thumb" aria-hidden="true" />
      </button>
      {showParentInactiveHint ? (
        <p className="pc-status-switch__notice" role="note">
          Ana kategori pasif olduğunda alt kategoriler de sitede kullanılamaz.
        </p>
      ) : null}
    </div>
  );
}
