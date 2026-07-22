'use client';

import type { ProjectListItem } from '@kurumsal/shared';
import { GripVertical, Pencil, Star, Trash2 } from 'lucide-react';

type ProjectsTableProps = {
  items: ProjectListItem[];
  canDelete: boolean;
  statusLoadingId: string | null;
  featuredLoadingId: string | null;
  onEdit: (project: ProjectListItem) => void;
  onDelete: (project: ProjectListItem) => void;
  onStatusChange: (project: ProjectListItem, isActive: boolean) => void;
  onFeaturedChange: (project: ProjectListItem, isFeatured: boolean) => void;
  onMove: (projectId: string, direction: -1 | 1) => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function ProjectsTable({
  items,
  canDelete,
  statusLoadingId,
  featuredLoadingId,
  onEdit,
  onDelete,
  onStatusChange,
  onFeaturedChange,
  onMove,
}: ProjectsTableProps) {
  return (
    <div className="projects-table-wrap">
      <table className="projects-table">
        <thead>
          <tr>
            <th scope="col" aria-label="Sıralama" />
            <th scope="col">Proje</th>
            <th scope="col">Müşteri</th>
            <th scope="col">Sektör</th>
            <th scope="col">Durum</th>
            <th scope="col">Öne Çıkan</th>
            <th scope="col">Tamamlanma</th>
            <th scope="col">Güncellenme</th>
            <th scope="col">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {items.map((project, index) => (
            <tr key={project.id}>
              <td>
                <div className="projects-table__order">
                  <button
                    type="button"
                    className="projects-table__handle"
                    aria-label={`${project.name} sırasını yukarı taşı`}
                    disabled={index === 0}
                    onClick={() => onMove(project.id, -1)}
                  >
                    <GripVertical size={16} aria-hidden="true" />
                  </button>
                  <div className="projects-table__order-buttons">
                    <button
                      type="button"
                      className="projects-table__order-btn"
                      aria-label={`${project.name} yukarı`}
                      disabled={index === 0}
                      onClick={() => onMove(project.id, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="projects-table__order-btn"
                      aria-label={`${project.name} aşağı`}
                      disabled={index === items.length - 1}
                      onClick={() => onMove(project.id, 1)}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              </td>
              <td>
                <div className="projects-table__project">
                  {project.coverImage ? (
                    <img src={project.coverImage.url} alt="" className="projects-table__thumb" />
                  ) : (
                    <div className="projects-table__thumb projects-table__thumb--empty" aria-hidden="true" />
                  )}
                  <div>
                    <p className="projects-table__name">{project.name}</p>
                    <p className="projects-table__meta">{project.slug}</p>
                  </div>
                </div>
              </td>
              <td>
                <div className="projects-table__client">
                  <span>{project.clientName ?? '—'}</span>
                  {!project.showClientName ? <span className="projects-table__badge">Gizli</span> : null}
                </div>
              </td>
              <td>{project.sector ?? '—'}</td>
              <td>
                <label className="projects-table__switch">
                  <input
                    type="checkbox"
                    checked={project.isActive}
                    disabled={statusLoadingId === project.id}
                    aria-label={`${project.name} durumu`}
                    onChange={(event) => onStatusChange(project, event.target.checked)}
                  />
                  <span>{project.isActive ? 'Aktif' : 'Pasif'}</span>
                </label>
              </td>
              <td>
                <button
                  type="button"
                  className={`projects-table__featured${project.isFeatured ? ' projects-table__featured--on' : ''}`}
                  aria-pressed={project.isFeatured}
                  aria-label={`${project.name} öne çıkan durumu`}
                  disabled={featuredLoadingId === project.id}
                  onClick={() => onFeaturedChange(project, !project.isFeatured)}
                >
                  <Star size={16} aria-hidden="true" />
                  <span>{project.isFeatured ? 'Öne çıkan' : 'Öne çıkar'}</span>
                </button>
              </td>
              <td>{project.completedAt ? formatDate(project.completedAt) : '—'}</td>
              <td>{formatDate(project.updatedAt)}</td>
              <td>
                <div className="projects-table__actions">
                  <button
                    type="button"
                    className="projects-table__action"
                    onClick={() => onEdit(project)}
                    aria-label={`${project.name} düzenle`}
                  >
                    <Pencil size={15} />
                  </button>
                  {canDelete ? (
                    <button
                      type="button"
                      className="projects-table__action projects-table__action--danger"
                      onClick={() => onDelete(project)}
                      aria-label={`${project.name} sil`}
                    >
                      <Trash2 size={15} />
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
