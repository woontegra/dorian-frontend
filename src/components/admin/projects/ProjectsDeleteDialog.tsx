'use client';

import { useEffect, useRef } from 'react';
import type { ProjectListItem } from '@kurumsal/shared';

type ProjectsDeleteDialogProps = {
  open: boolean;
  project: ProjectListItem | null;
  loading: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ProjectsDeleteDialog({
  open,
  project,
  loading,
  errorMessage,
  onConfirm,
  onCancel,
}: ProjectsDeleteDialogProps) {
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

  if (!open || !project) {
    return null;
  }

  const description = errorMessage
    ? errorMessage
    : `"${project.name}" projesini kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`;

  return (
    <div className="admin-dialog-backdrop" role="presentation" onClick={loading ? undefined : onCancel}>
      <div
        className="admin-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="projects-delete-title"
        aria-describedby="projects-delete-description"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="projects-delete-title" className="admin-dialog-title">
          Projeyi Sil
        </h3>
        <p id="projects-delete-description" className="admin-dialog-description">
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
