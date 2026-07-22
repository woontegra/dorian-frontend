'use client';

import { useEffect, useRef } from 'react';
import type { ProductCategory } from '@kurumsal/shared';

type ProductCategoryDeleteDialogProps = {
  open: boolean;
  category: ProductCategory | null;
  loading: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ProductCategoryDeleteDialog({
  open,
  category,
  loading,
  errorMessage,
  onConfirm,
  onCancel,
}: ProductCategoryDeleteDialogProps) {
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

  if (!open || !category) {
    return null;
  }

  const description = errorMessage
    ? errorMessage
    : `"${category.name}" kategorisini kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`;

  return (
    <div className="admin-dialog-backdrop" role="presentation" onClick={loading ? undefined : onCancel}>
      <div
        className="admin-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="pc-delete-title"
        aria-describedby="pc-delete-description"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="pc-delete-title" className="admin-dialog-title">
          Kategoriyi Sil
        </h3>
        <p id="pc-delete-description" className="admin-dialog-description">
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
