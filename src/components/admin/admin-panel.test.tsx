import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminPanelLayout } from '@/components/admin/layout/AdminPanelLayout';
import { DashboardView } from '@/components/admin/dashboard/DashboardView';
import { ModulePlaceholder } from '@/components/admin/module/ModulePlaceholder';
import { ADMIN_NAV_GROUPS } from '@/lib/admin/navigation';
import { ADMIN_MODULES } from '@/lib/admin/module-config';
import { AdminApiError } from '@/lib/auth/types';

const replaceMock = vi.fn();
const pathnameMock = vi.fn(() => '/admin');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: vi.fn(),
  }),
  usePathname: () => pathnameMock(),
}));

vi.mock('@/lib/auth/api', () => ({
  loginAdmin: vi.fn(),
  logoutAdmin: vi.fn(),
  fetchAdminMe: vi.fn(),
}));

import { fetchAdminMe, logoutAdmin } from '@/lib/auth/api';

const mockedMe = fetchAdminMe as unknown as ReturnType<typeof vi.fn>;
const mockedLogout = logoutAdmin as unknown as ReturnType<typeof vi.fn>;

const adminProfile = {
  id: '1',
  email: 'admin@example.com',
  fullName: 'Ada Admin',
  role: 'ADMIN' as const,
};

const editorProfile = {
  id: '2',
  email: 'editor@example.com',
  fullName: 'Ece Editör',
  role: 'EDITOR' as const,
};

function mockDesktopViewport() {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('max-width') ? false : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function mockMobileViewport() {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === '(max-width: 1023px)',
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

async function renderPanel(role: 'ADMIN' | 'EDITOR' = 'ADMIN', pathname = '/admin') {
  pathnameMock.mockReturnValue(pathname);
  mockedMe.mockResolvedValue(role === 'ADMIN' ? adminProfile : editorProfile);

  render(
    <AdminPanelLayout>
      {pathname === '/admin' ? <DashboardView /> : null}
    </AdminPanelLayout>,
  );

  await screen.findByRole('navigation', { name: 'Yönetim menüsü' });
}

async function openUserMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /Kullanıcı menüsü/i }));
}

describe('Admin panel shell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDesktopViewport();
    localStorage.clear();
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('renders sidebar menu links for all planned modules', async () => {
    await renderPanel('ADMIN');

    const nav = screen.getByRole('navigation', { name: 'Yönetim menüsü' });
    const links = within(nav).getAllByRole('link');

    const expectedHrefs = ADMIN_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.href));
    const actualHrefs = links.map((link) => link.getAttribute('href'));

    for (const href of expectedHrefs) {
      expect(actualHrefs).toContain(href);
    }
  });

  it('marks the active menu item for nested routes', async () => {
    await renderPanel('ADMIN', '/admin/pages');

    const pagesLink = screen.getByRole('link', { name: 'Sayfalar' });
    expect(pagesLink).toHaveAttribute('aria-current', 'page');

    const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
    expect(dashboardLink).not.toHaveAttribute('aria-current');
  });

  it('keeps dashboard active only on /admin', async () => {
    await renderPanel('ADMIN', '/admin/home');

    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Ana Sayfa' })).toHaveAttribute('aria-current', 'page');
  });

  it('persists sidebar collapse state in localStorage on desktop', async () => {
    const user = userEvent.setup();
    await renderPanel('ADMIN');

    const collapseButton = await screen.findByRole('button', { name: 'Kenar çubuğunu daralt' });
    await user.click(collapseButton);

    expect(localStorage.getItem('admin-sidebar-collapsed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Kenar çubuğunu genişlet' })).toBeInTheDocument();
  });

  it('renders sidebar user area with avatar, name and role in horizontal layout', async () => {
    await renderPanel('ADMIN');

    const sidebar = screen.getByLabelText('Kenar çubuğu');
    const userArea = sidebar.querySelector('.admin-sidebar-user');
    const scrollArea = sidebar.querySelector('.admin-sidebar-scroll');
    const footer = sidebar.querySelector('.admin-sidebar-footer');

    expect(userArea).toBeTruthy();
    expect(scrollArea).toBeTruthy();
    expect(footer).toBeTruthy();
    expect(userArea).toHaveClass('admin-sidebar-user');
    expect(within(sidebar).getByText('Ada Admin')).toHaveClass('admin-sidebar-user-name');
    expect(within(sidebar).getByText('Yönetici')).toHaveClass('admin-sidebar-user-role');
    expect(within(sidebar).getByText('AA')).toHaveClass('admin-sidebar-user-avatar');
  });

  it('hides sidebar user name and role when collapsed, keeping avatar visible', async () => {
    const user = userEvent.setup();
    await renderPanel('ADMIN');

    await user.click(await screen.findByRole('button', { name: 'Kenar çubuğunu daralt' }));

    const sidebar = screen.getByLabelText('Kenar çubuğu');
    expect(sidebar).toHaveClass('admin-sidebar--collapsed');
    expect(sidebar.querySelector('.admin-sidebar-user-name')).not.toBeInTheDocument();
    expect(sidebar.querySelector('.admin-sidebar-user-role')).not.toBeInTheDocument();
    expect(within(sidebar).getByText('AA')).toHaveClass('admin-sidebar-user-avatar');
  });

  it('keeps last sidebar menu items reachable above the footer region', async () => {
    await renderPanel('ADMIN');

    const sidebar = screen.getByLabelText('Kenar çubuğu');
    const scrollArea = sidebar.querySelector('.admin-sidebar-scroll');
    const settingsLink = within(sidebar).getByRole('link', { name: 'Site Ayarları' });
    const usersLink = within(sidebar).getByRole('link', { name: 'Kullanıcılar' });

    expect(scrollArea).toContainElement(settingsLink);
    expect(scrollArea).toContainElement(usersLink);
    expect(sidebar.querySelector('.admin-sidebar-footer')).not.toContainElement(settingsLink);
  });

  it('shows Users menu for ADMIN role', async () => {
    await renderPanel('ADMIN');
    expect(screen.getByRole('link', { name: 'Kullanıcılar' })).toBeInTheDocument();
  });

  it('hides Users menu for EDITOR role (UI-only)', async () => {
    await renderPanel('EDITOR');
    expect(screen.queryByRole('link', { name: 'Kullanıcılar' })).not.toBeInTheDocument();
  });

  it('opens and closes mobile drawer with overlay click and Escape', async () => {
    mockMobileViewport();
    const user = userEvent.setup();
    await renderPanel('ADMIN');

    await user.click(screen.getByRole('button', { name: 'Menüyü aç' }));
    expect(screen.getByLabelText('Kenar çubuğu')).toHaveClass('admin-sidebar--open');

    await user.click(screen.getByRole('button', { name: 'Menüyü kapat' }));
    expect(screen.getByLabelText('Kenar çubuğu')).not.toHaveClass('admin-sidebar--open');

    await user.click(screen.getByRole('button', { name: 'Menüyü aç' }));
    await user.keyboard('{Escape}');
    expect(screen.getByLabelText('Kenar çubuğu')).not.toHaveClass('admin-sidebar--open');
  });

  it('locks body scroll while mobile drawer is open', async () => {
    mockMobileViewport();
    const user = userEvent.setup();
    await renderPanel('ADMIN');

    await user.click(screen.getByRole('button', { name: 'Menüyü aç' }));
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('opens accessible user menu with disabled profile item', async () => {
    const user = userEvent.setup();
    await renderPanel('ADMIN');

    await openUserMenu(user);

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Profil/i })).toBeDisabled();
    expect(screen.getByText('Yakında')).toBeInTheDocument();
  });

  it('logs out from user menu using existing logout flow', async () => {
    const user = userEvent.setup();
    mockedLogout.mockResolvedValue(undefined);
    await renderPanel('ADMIN');

    await openUserMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Çıkış Yap' }));

    await waitFor(() => {
      expect(mockedLogout).toHaveBeenCalled();
      expect(replaceMock).toHaveBeenCalledWith('/admin/login');
    });
  });

  it('disables view site button when NEXT_PUBLIC_SITE_URL is missing', async () => {
    await renderPanel('ADMIN');
    expect(screen.getByRole('button', { name: /Siteyi Görüntüle/i })).toBeDisabled();
  });
});

describe('Admin dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDesktopViewport();
  });

  it('does not show fake statistics on dashboard cards', async () => {
    pathnameMock.mockReturnValue('/admin');
    mockedMe.mockResolvedValue(adminProfile);

    render(
      <AdminPanelLayout>
        <DashboardView />
      </AdminPanelLayout>,
    );

    await screen.findByRole('heading', { level: 2, name: 'Genel Bakış' });

    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(4);
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });
});

describe('ModulePlaceholder', () => {
  it('renders module title, description and upcoming notice', () => {
    const config = ADMIN_MODULES.pages;

    render(<ModulePlaceholder title={config.title} description={config.description} />);

    expect(screen.getByRole('heading', { name: config.title })).toBeInTheDocument();
    expect(screen.getByText(config.description)).toBeInTheDocument();
    expect(screen.getByText(/Bu modül sonraki adımlarda hazırlanacaktır/i)).toBeInTheDocument();
  });
});

describe('AdminPanelLayout auth gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDesktopViewport();
    pathnameMock.mockReturnValue('/admin');
  });

  it('shows loading state before protected content', () => {
    mockedMe.mockImplementation(() => new Promise(() => undefined));
    render(
      <AdminPanelLayout>
        <DashboardView />
      </AdminPanelLayout>,
    );

    expect(screen.getByRole('status')).toHaveTextContent(/Oturum kontrol/);
    expect(screen.queryByRole('navigation', { name: 'Yönetim menüsü' })).not.toBeInTheDocument();
  });

  it('redirects unauthorized users to login', async () => {
    mockedMe.mockRejectedValue(new AdminApiError('Authentication required', 401, 'UNAUTHORIZED'));
    render(
      <AdminPanelLayout>
        <DashboardView />
      </AdminPanelLayout>,
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/admin/login');
    });
  });

  it('redirects to login when logout session is already invalid', async () => {
    const user = userEvent.setup();
    mockedMe.mockResolvedValue(editorProfile);
    mockedLogout.mockRejectedValue(new AdminApiError('Authentication required', 401, 'UNAUTHORIZED'));

    render(
      <AdminPanelLayout>
        <DashboardView />
      </AdminPanelLayout>,
    );

    await screen.findByRole('button', { name: /Kullanıcı menüsü/i });
    await openUserMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Çıkış Yap' }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/admin/login');
    });
  });
});
