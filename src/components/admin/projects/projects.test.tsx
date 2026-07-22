import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ProjectListItem } from '@kurumsal/shared';
import { ProjectFormPageClient } from '@/components/admin/projects/ProjectFormPageClient';
import { ProjectsPageClient } from '@/components/admin/projects/ProjectsPageClient';
import { AdminApiError } from '@/lib/auth/types';

const replaceMock = vi.fn();
const pushMock = vi.fn();
const routerMock = { replace: replaceMock, push: pushMock };

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/admin/session/AdminSessionProvider', () => ({
  useAdminSession: vi.fn(),
}));

vi.mock('@/lib/projects/api', () => ({
  fetchProjects: vi.fn(),
  fetchProject: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  updateProjectStatus: vi.fn(),
  updateProjectFeatured: vi.fn(),
  reorderProjects: vi.fn(),
  deleteProject: vi.fn(),
  isUnauthorizedError: (error: unknown) => error instanceof AdminApiError && error.code === 'UNAUTHORIZED',
  isForbiddenError: (error: unknown) => error instanceof AdminApiError && error.code === 'FORBIDDEN',
  isProjectSlugConflictError: (error: unknown) => error instanceof AdminApiError && error.code === 'PROJECT_SLUG_CONFLICT',
  isProjectNotFoundError: (error: unknown) =>
    error instanceof AdminApiError && (error.code === 'PROJECT_NOT_FOUND' || error.statusCode === 404),
}));

import { useAdminSession } from '@/components/admin/session/AdminSessionProvider';
import {
  deleteProject,
  fetchProjects,
  updateProjectFeatured,
  updateProjectStatus,
} from '@/lib/projects/api';

const mockedSession = useAdminSession as unknown as ReturnType<typeof vi.fn>;
const mockedFetch = fetchProjects as unknown as ReturnType<typeof vi.fn>;
const mockedStatus = updateProjectStatus as unknown as ReturnType<typeof vi.fn>;
const mockedFeatured = updateProjectFeatured as unknown as ReturnType<typeof vi.fn>;
const mockedDelete = deleteProject as unknown as ReturnType<typeof vi.fn>;

const sampleProject: ProjectListItem = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Ofis Yenileme',
  slug: 'ofis-yenileme',
  shortDescription: 'Kısa açıklama',
  coverImage: null,
  clientName: 'Acme A.Ş.',
  showClientName: true,
  sector: 'İnşaat',
  completedAt: '2025-03-15T00:00:00.000Z',
  isActive: true,
  isFeatured: false,
  sortOrder: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const secondProject: ProjectListItem = {
  ...sampleProject,
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Depo Otomasyonu',
  slug: 'depo-otomasyonu',
  showClientName: false,
  completedAt: null,
};

describe('ProjectsPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSession.mockReturnValue({
      admin: { id: '1', fullName: 'Admin', email: 'a@b.c', role: 'ADMIN' },
    });
    mockedFetch.mockResolvedValue({
      items: [sampleProject],
      pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    });
  });

  it('loads project list', async () => {
    render(<ProjectsPageClient />);
    expect(await screen.findByText('Ofis Yenileme')).toBeInTheDocument();
    expect(screen.getByText('1 proje')).toBeInTheDocument();
  });

  it('shows empty state without auto navigation', async () => {
    mockedFetch.mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 1 },
    });
    render(<ProjectsPageClient />);
    expect(await screen.findByText(/Henüz proje eklenmedi/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('shows filtered empty state after searching with no matches', async () => {
    const user = userEvent.setup();
    mockedFetch.mockResolvedValue({
      items: [sampleProject],
      pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    });
    render(<ProjectsPageClient />);
    await screen.findByText('Ofis Yenileme');

    mockedFetch.mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 1 },
    });
    await user.type(screen.getByPlaceholderText('Proje adı, slug veya açıklama ara…'), 'yok-boyle-proje');

    expect(await screen.findByText(/Filtrelere uygun proje bulunamadı/i)).toBeInTheDocument();
  });

  it('searches projects with debounce', async () => {
    const user = userEvent.setup();
    render(<ProjectsPageClient />);
    await screen.findByText('Ofis Yenileme');
    mockedFetch.mockClear();

    await user.type(screen.getByPlaceholderText('Proje adı, slug veya açıklama ara…'), 'ofis');

    await waitFor(() =>
      expect(mockedFetch).toHaveBeenCalledWith(expect.objectContaining({ search: 'ofis' })),
    );
  });

  it('paginates through results', async () => {
    const user = userEvent.setup();
    mockedFetch.mockResolvedValue({
      items: [sampleProject],
      pagination: { page: 1, pageSize: 20, totalItems: 40, totalPages: 2 },
    });
    render(<ProjectsPageClient />);
    await screen.findByText('Ofis Yenileme');

    mockedFetch.mockResolvedValue({
      items: [secondProject],
      pagination: { page: 2, pageSize: 20, totalItems: 40, totalPages: 2 },
    });
    await user.click(screen.getByRole('button', { name: 'Sonraki' }));

    await waitFor(() => expect(mockedFetch).toHaveBeenCalledWith(expect.objectContaining({ page: 2 })));
    expect(await screen.findByText('Depo Otomasyonu')).toBeInTheDocument();
  });

  it('links to new project page', async () => {
    render(<ProjectsPageClient />);
    await screen.findByText('Ofis Yenileme');
    expect(screen.getByRole('link', { name: /Yeni Proje/i })).toHaveAttribute('href', '/admin/projects/new');
  });

  it('navigates to edit page', async () => {
    const user = userEvent.setup();
    render(<ProjectsPageClient />);
    await user.click(await screen.findByRole('button', { name: 'Ofis Yenileme düzenle' }));
    expect(pushMock).toHaveBeenCalledWith(`/admin/projects/${sampleProject.id}/edit`);
  });

  it('shows hidden client badge when showClientName is false', async () => {
    mockedFetch.mockResolvedValue({
      items: [secondProject],
      pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    });
    render(<ProjectsPageClient />);
    await screen.findByText('Depo Otomasyonu');
    expect(screen.getByText('Gizli')).toBeInTheDocument();
  });

  it('shows delete action for ADMIN role', async () => {
    render(<ProjectsPageClient />);
    await screen.findByText('Ofis Yenileme');
    expect(screen.getByRole('button', { name: 'Ofis Yenileme sil' })).toBeInTheDocument();
  });

  it('hides delete for editor', async () => {
    mockedSession.mockReturnValue({
      admin: { id: '2', fullName: 'Editor', email: 'e@b.c', role: 'EDITOR' },
    });
    render(<ProjectsPageClient />);
    await screen.findByText('Ofis Yenileme');
    expect(screen.queryByRole('button', { name: 'Ofis Yenileme sil' })).not.toBeInTheDocument();
  });

  it('reverts status on error', async () => {
    const user = userEvent.setup();
    mockedStatus.mockRejectedValue(new AdminApiError('Durum hatası', 400, 'VALIDATION'));
    render(<ProjectsPageClient />);
    await screen.findByText('Ofis Yenileme');
    await user.click(screen.getByRole('checkbox', { name: 'Ofis Yenileme durumu' }));
    expect(await screen.findByText(/Durum hatası|güncellenemedi/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Ofis Yenileme durumu' })).toBeChecked();
  });

  it('reverts featured on error', async () => {
    const user = userEvent.setup();
    mockedFeatured.mockRejectedValue(new AdminApiError('Öne çıkan hatası', 400, 'VALIDATION'));
    render(<ProjectsPageClient />);
    await screen.findByText('Ofis Yenileme');
    await user.click(screen.getByRole('button', { name: 'Ofis Yenileme öne çıkan durumu' }));
    expect(await screen.findByText('Öne çıkan hatası')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ofis Yenileme öne çıkan durumu' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('deletes project with confirm dialog', async () => {
    const user = userEvent.setup();
    mockedDelete.mockResolvedValue({ deleted: true });
    render(<ProjectsPageClient />);
    await user.click(await screen.findByRole('button', { name: 'Ofis Yenileme sil' }));
    await user.click(screen.getByRole('button', { name: 'Sil' }));
    await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith(sampleProject.id));
  });

  it('redirects to login on 401', async () => {
    mockedFetch.mockRejectedValue(new AdminApiError('Unauthorized', 401, 'UNAUTHORIZED'));
    render(<ProjectsPageClient />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/admin/login'));
  });
});

describe('ProjectFormPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSession.mockReturnValue({
      admin: { id: '1', fullName: 'Admin', email: 'a@b.c', role: 'ADMIN' },
    });
  });

  it('auto-generates the slug from the name while unedited', async () => {
    const user = userEvent.setup();
    render(<ProjectFormPageClient mode="create" />);

    const nameInput = screen.getByLabelText(/Proje Adı/i);
    await user.type(nameInput, 'Ofis Yenileme');

    const slugInput = screen.getByLabelText(/^Slug/i);
    expect(slugInput).toHaveValue('ofis-yenileme');
  });

  it('preserves a manually edited slug when the name changes again', async () => {
    const user = userEvent.setup();
    render(<ProjectFormPageClient mode="create" />);

    const nameInput = screen.getByLabelText(/Proje Adı/i);
    await user.type(nameInput, 'Ofis Yenileme');

    const slugInput = screen.getByLabelText(/^Slug/i);
    await user.clear(slugInput);
    await user.type(slugInput, 'custom-slug');

    await user.type(nameInput, ' Ek Metin');

    expect(slugInput).toHaveValue('custom-slug');
  });
});
