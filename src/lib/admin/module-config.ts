export type AdminModuleConfig = {
  title: string;
  description: string;
};

export const ADMIN_MODULES = {
  home: {
    title: 'Ana Sayfa',
    description: 'Web sitenizin ana sayfa içeriğini ve bölümlerini yönetin.',
  },
  pages: {
    title: 'Sayfalar',
    description: 'Kurumsal sayfalarınızı oluşturun, düzenleyin ve yayınlayın.',
  },
  sliders: {
    title: 'Hero / Slider',
    description: 'Ana sayfa hero alanını tek görsel veya carousel olarak yönetin.',
  },
  products: {
    title: 'Ürünler',
    description: 'Ürün kataloğunuzu ve ürün detay sayfalarını yönetin.',
  },
  productCategories: {
    title: 'Ürün Kategorileri',
    description: 'Ürün kategorilerini düzenleyerek katalog yapısını oluşturun.',
  },
  projects: {
    title: 'Projeler',
    description: 'Tamamlanan ve devam eden projelerinizi sergileyin.',
  },
  gallery: {
    title: 'Galeri',
    description: 'Fotoğraf ve görsel galerilerinizi yönetin.',
  },
  blog: {
    title: 'Blog',
    description: 'Blog yazılarınızı ve kategorilerinizi yönetin.',
  },
  menus: {
    title: 'Menü Yönetimi',
    description: 'Site navigasyon menülerini ve bağlantılarını düzenleyin.',
  },
  footer: {
    title: 'Footer Yönetimi',
    description: 'Alt bilgi alanındaki bağlantıları ve içerikleri yönetin.',
  },
  media: {
    title: 'Medya Kütüphanesi',
    description: 'Görselleri, belgeleri ve diğer medya dosyalarını yönetin.',
  },
  messages: {
    title: 'Mesajlar',
    description: 'İletişim formundan gelen mesajları görüntüleyin ve yanıtlayın.',
  },
  seo: {
    title: 'SEO Yönetimi',
    description: 'Meta başlıkları, açıklamaları ve arama motoru ayarlarını yönetin.',
  },
  redirects: {
    title: 'Yönlendirmeler',
    description: 'URL yönlendirmelerini tanımlayın ve eski bağlantıları yönetin.',
  },
  settings: {
    title: 'Site Ayarları',
    description: 'Sitenizin kurumsal, iletişim ve genel SEO bilgilerini yönetin.',
  },
  users: {
    title: 'Kullanıcılar',
    description: 'Yönetim paneli kullanıcılarını ve rollerini yönetin.',
  },
} as const satisfies Record<string, AdminModuleConfig>;
