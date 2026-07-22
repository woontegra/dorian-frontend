'use client';

import { useEffect, useRef } from 'react';
import type { MenuItem } from '@kurumsal/shared';

type MenuItemDeleteDialogProps = {
  open: boolean;
  item: MenuItem | null;
  loading: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function MenuItemDeleteDialog({
  open,
  item,
  loading,
  errorMessage,
  onConfirm,
  onCancel,
}: MenuItemDeleteDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !loading) {
        onCancel();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    cancelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, loading, onCancel]);

  if (!open || !item) {
    return null;
  }

  const description = errorMessage
    ? errorMessage
    : `"${item.label}" menü öğesini kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`;

  return (
    <div className="admin-dialog-backdrop" role="presentation" onClick={loading ? undefined : onCancel}>
      <div
        className="admin-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="mi-delete-title"
        aria-describedby="mi-delete-description"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="mi-delete-title" className="admin-dialog-title">
          Menü Öğesini Sil
        </h3>
        <p id="mi-delete-description" className="admin-dialog-description">
          {description}
        </p>
        <div className="admin-dialog-actions">
          <button ref={cancelRef} type="button" className="admin-button" onClick={onCancel} disabled={loading}>
            Vazgeç
          </button>
          {!errorMessage ? (
            <button type="button" className="admin-button admin-button-primary" onClick={onConfirm} disabled={loading}>
              {loading ? 'Siliniyor…' : 'Sil'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
