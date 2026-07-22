'use client';

import { useEffect, useRef } from 'react';
import type { ProductListItem } from '@kurumsal/shared';

type ProductsDeleteDialogProps = {
  open: boolean;
  product: ProductListItem | null;
  loading: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ProductsDeleteDialog({
  open,
  product,
  loading,
  errorMessage,
  onConfirm,
  onCancel,
}: ProductsDeleteDialogProps) {
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

  if (!open || !product) {
    return null;
  }

  const description = errorMessage
    ? errorMessage
    : `"${product.name}" ürününü kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`;

  return (
    <div className="admin-dialog-backdrop" role="presentation" onClick={loading ? undefined : onCancel}>
      <div
        className="admin-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="products-delete-title"
        aria-describedby="products-delete-description"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="products-delete-title" className="admin-dialog-title">
          Ürünü Sil
        </h3>
        <p id="products-delete-description" className="admin-dialog-description">
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
