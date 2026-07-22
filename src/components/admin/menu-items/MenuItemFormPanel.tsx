'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MenuItem } from '@kurumsal/shared';
import { X } from 'lucide-react';
import { MenuItemStatusSwitch } from '@/components/admin/menu-items/MenuItemStatusSwitch';
import {
  createEmptyMenuItemFormValues,
  menuItemFormSchema,
  menuItemToFormValues,
  type MenuItemFormValues,
} from '@/lib/menu-items/schema';

type MenuItemFormPanelProps = {
  open: boolean;
  saving: boolean;
  items: MenuItem[];
  editing: MenuItem | null;
  restoreFocusRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onSave: (values: MenuItemFormValues) => Promise<void>;
};

function getParentOptions(items: MenuItem[], editing: MenuItem | null) {
  return items.filter((item) => {
    if (editing && item.id === editing.id) {
      return false;
    }
    return true;
  });
}

export function MenuItemFormPanel({
  open,
  saving,
  items,
  editing,
  restoreFocusRef,
  onClose,
  onSave,
}: MenuItemFormPanelProps) {
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [values, setValues] = useState<MenuItemFormValues>(createEmptyMenuItemFormValues());
  const [errors, setErrors] = useState<Partial<Record<keyof MenuItemFormValues, string>>>({});

  const hasChildren = Boolean(editing && editing.childCount > 0);
  const parentOptions = useMemo(() => getParentOptions(items, editing), [items, editing]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (editing) {
      const next = menuItemToFormValues(editing);
      if (editing.childCount > 0) {
        next.placement = 'root';
        next.parentId = null;
      }
      setValues(next);
    } else {
      setValues(createEmptyMenuItemFormValues());
    }
    setErrors({});
  }, [open, editing]);

  useEffect(() => {
    if (!open) {
      return;
    }

    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) {
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, saving, onClose]);

  useEffect(() => {
    if (open) {
      return;
    }
    restoreFocusRef.current?.focus();
  }, [open, restoreFocusRef]);

  if (!open) {
    return null;
  }

  function updateField<K extends keyof MenuItemFormValues>(key: K, value: MenuItemFormValues[K]) {
    setValues((current) => {
      const next = { ...current, [key]: value };
      if (key === 'placement' && value === 'root') {
        next.parentId = null;
      }
      return next;
    });
    setErrors((current) => ({ ...current, [key]: undefined, ...(key === 'placement' ? { parentId: undefined } : {}) }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) {
      return;
    }

    const parsed = menuItemFormSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof MenuItemFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof MenuItemFormValues;
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    await onSave(parsed.data);
  }

  const title = editing ? 'Menü Öğesini Düzenle' : 'Yeni Menü Öğesi';
  const description = editing
    ? editing.label
    : 'Üst menü veya bir üst menünün altında alt menü oluşturun.';

  return (
    <>
      <div className="mi-drawer-backdrop" role="presentation" onClick={saving ? undefined : onClose} />

      <aside
        ref={drawerRef}
        className="mi-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mi-drawer-title"
        aria-describedby="mi-drawer-description"
      >
        <header className="mi-drawer__header">
          <div className="mi-drawer__header-copy">
            <h3 id="mi-drawer-title" className="mi-drawer__title">
              {title}
            </h3>
            <p id="mi-drawer-description" className="mi-drawer__description">
              {description}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="mi-drawer__close"
            onClick={onClose}
            disabled={saving}
            aria-label="Paneli kapat"
          >
            <X size={18} />
          </button>
        </header>

        <form className="mi-drawer__form" onSubmit={(event) => void handleSubmit(event)}>
          <div className="mi-drawer__body">
            <div className="mi-drawer-field">
              <label htmlFor="mi-label">
                Menü adı <span className="mi-drawer-field__required">*</span>
              </label>
              <input
                id="mi-label"
                value={values.label}
                onChange={(event) => updateField('label', event.target.value)}
                disabled={saving}
                autoComplete="off"
              />
              {errors.label ? <p className="mi-drawer-field__error">{errors.label}</p> : null}
            </div>

            <div className="mi-drawer-field">
              <label htmlFor="mi-href">
                Bağlantı adresi
                {values.placement === 'child' ? (
                  <span className="mi-drawer-field__required"> *</span>
                ) : null}
              </label>
              <input
                id="mi-href"
                value={values.href}
                onChange={(event) => updateField('href', event.target.value)}
                disabled={saving}
                placeholder={
                  values.placement === 'child'
                    ? '/sayfa-yolu'
                    : 'İsteğe bağlı: /sayfa veya https://...'
                }
                autoComplete="off"
              />
              <p className="mi-drawer-field__hint">
                {values.placement === 'child'
                  ? '/ ile başlayan site içi yollar veya http(s) adresleri.'
                  : 'Boş bırakırsanız bu öğe yalnızca alt menüyü açan bir başlık olarak kullanılır.'}
              </p>
              {errors.href ? <p className="mi-drawer-field__error">{errors.href}</p> : null}
            </div>

            <fieldset className="mi-drawer-fieldset">
              <legend>Konum</legend>
                <label className="mi-drawer-radio">
                  <input
                    type="radio"
                    name="mi-placement"
                    checked={values.placement === 'root'}
                    disabled={saving}
                    onChange={() => updateField('placement', 'root')}
                  />
                  <span>Üst menü</span>
                </label>
                <label className="mi-drawer-radio">
                  <input
                    type="radio"
                    name="mi-placement"
                    checked={values.placement === 'child'}
                    disabled={saving || hasChildren}
                    onChange={() => updateField('placement', 'child')}
                  />
                  <span>Bir üst menünün altında</span>
                </label>
              {hasChildren ? (
                <p className="mi-drawer-field__hint" role="note">
                  Alt menüleri olan bir üst öğe alt menüye dönüştürülemez.
                </p>
              ) : null}
            </fieldset>

            {values.placement === 'child' ? (
              <div className="mi-drawer-field">
                <label htmlFor="mi-parent">
                  Üst menü <span className="mi-drawer-field__required">*</span>
                </label>
                <select
                  id="mi-parent"
                  value={values.parentId ?? ''}
                  disabled={saving || hasChildren}
                  onChange={(event) => updateField('parentId', event.target.value || null)}
                >
                  <option value="">Üst menü seçin</option>
                  {parentOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
                {errors.parentId ? <p className="mi-drawer-field__error">{errors.parentId}</p> : null}
              </div>
            ) : null}

            <label className="mi-drawer-check">
              <input
                type="checkbox"
                checked={values.openInNewTab}
                disabled={saving}
                onChange={(event) => updateField('openInNewTab', event.target.checked)}
              />
              <span>Yeni sekmede aç</span>
            </label>

            <MenuItemStatusSwitch
              checked={values.isActive}
              disabled={saving}
              onChange={(checked) => updateField('isActive', checked)}
            />
          </div>

          <footer className="mi-drawer__footer">
            <button type="button" className="admin-button mi-drawer__cancel" onClick={onClose} disabled={saving}>
              Vazgeç
            </button>
            <button type="submit" className="admin-button admin-button-primary mi-drawer__submit" disabled={saving}>
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </footer>
        </form>
      </aside>
    </>
  );
}
