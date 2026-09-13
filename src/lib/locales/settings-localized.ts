import type { LocaleCode } from './fallbacks';

export const settingsLocalized: Partial<Record<LocaleCode, Record<string, string>>> = {
  es: {
    Settings: 'Configuración', 'Save settings': 'Guardar configuración', 'Saving…': 'Guardando…', 'Settings saved': 'Configuración guardada',
    Storage: 'Almacenamiento', 'Access rules': 'Reglas de acceso', 'File storage': 'Almacenamiento de archivos',
    'Storage provider': 'Proveedor de almacenamiento', 'Country gating': 'Restricción por país', Rule: 'Regla',
    'Allow every country': 'Permitir todos los países', 'Allow only these countries': 'Permitir solo estos países',
    'Block these countries': 'Bloquear estos países', Analytics: 'Análisis', Today: 'Hoy', 'Last 7 days': 'Últimos 7 días',
    'All time': 'Todo el tiempo', Products: 'Productos', 'Go to products': 'Ir a productos', 'Top files': 'Archivos principales',
    'Top products': 'Productos principales', 'Recent downloads': 'Descargas recientes', File: 'Archivo', Product: 'Producto',
    Country: 'País', When: 'Cuándo', Downloads: 'Descargas', 'Pricing plans': 'Planes de precios', Free: 'Gratis',
    '/ month': '/ mes', 'Current plan': 'Plan actual', 'Most popular': 'Más popular', Feature: 'Función', Included: 'Incluido',
    'Not included': 'No incluido', Unlimited: 'Ilimitado', Basic: 'Básico', Pro: 'Pro', Business: 'Business',
    'Upgrade to {{name}}': 'Mejorar a {{name}}', 'Plan comparison': 'Comparación de planes',
    'A limited way to get started': 'Una forma limitada de empezar',
    'For growing stores with more downloads': 'Para tiendas en crecimiento con más descargas',
    'For established stores and larger catalogs': 'Para tiendas consolidadas y catálogos más grandes',
    '5 files': '5 archivos', '100 files': '100 archivos', '5 products': '5 productos', '50 products': '50 productos',
    'Download access': 'Acceso a descargas', 'Everyone only': 'Solo todos', 'All access rules': 'Todas las reglas de acceso',
    'Global product assignments': 'Asignaciones globales de productos', 'Download analytics': 'Análisis de descargas',
    'Priority support': 'Soporte prioritario',
    'Choose the plan that fits your store. Billing and checkout will be connected later.': 'Elige el plan que se adapte a tu tienda. La facturación y el pago se conectarán más adelante.',
    'You are currently on the {{name}} plan. Billing and checkout will be connected later.': 'Ahora estás en el plan {{name}}. La facturación y el pago se conectarán más adelante.',
    'See which files and products generate downloads.': 'Consulta qué archivos y productos generan descargas.',
    'No downloads yet': 'Aún no hay descargas', 'Nothing to rank yet.': 'Todavía no hay nada que clasificar.',
    'Unable to load settings': 'No se pudo cargar la configuración', 'Unable to save settings': 'No se pudo guardar la configuración',
    'Unable to load analytics': 'No se pudieron cargar los análisis',
  },
  fr: {
    Settings: 'Paramètres', 'Save settings': 'Enregistrer les paramètres', Storage: 'Stockage', Analytics: 'Analyses',
    Today: 'Aujourd’hui', 'Pricing plans': 'Offres tarifaires', Free: 'Gratuit', '/ month': '/ mois', 'Current plan': 'Offre actuelle',
    Basic: 'Basique', 'Most popular': 'Le plus populaire', Feature: 'Fonctionnalité',
  },
  de: {
    Settings: 'Einstellungen', 'Save settings': 'Einstellungen speichern', Storage: 'Speicher', Analytics: 'Analysen',
    Today: 'Heute', 'Pricing plans': 'Tarife', Free: 'Kostenlos', '/ month': '/ Monat', 'Current plan': 'Aktueller Tarif',
    Basic: 'Basis', 'Most popular': 'Am beliebtesten', Feature: 'Funktion',
  },
  'zh-CN': {
    Settings: '设置', 'Save settings': '保存设置', Storage: '存储', Analytics: '数据分析', Today: '今天',
    'Pricing plans': '价格套餐', Free: '免费', '/ month': '/月', 'Current plan': '当前套餐', Basic: '基础版',
    'Most popular': '最受欢迎', Feature: '功能',
  },
  ja: {
    Settings: '設定', 'Save settings': '設定を保存', Storage: 'ストレージ', Analytics: '分析', Today: '今日',
    'Pricing plans': '料金プラン', Free: '無料', '/ month': '/月', 'Current plan': '現在のプラン', Basic: 'ベーシック',
    'Most popular': '人気', Feature: '機能',
  },
  ko: {
    Settings: '설정', 'Save settings': '설정 저장', Storage: '스토리지', Analytics: '분석', Today: '오늘',
    'Pricing plans': '요금제', Free: '무료', '/ month': '/월', 'Current plan': '현재 요금제', Basic: '베이직',
    'Most popular': '가장 인기', Feature: '기능',
  },
  ar: {
    Settings: 'الإعدادات', 'Save settings': 'حفظ الإعدادات', Storage: 'التخزين', Analytics: 'التحليلات', Today: 'اليوم',
    'Pricing plans': 'خطط الأسعار', Free: 'مجاني', '/ month': '/ شهر', 'Current plan': 'الخطة الحالية', Basic: 'أساسي',
    'Most popular': 'الأكثر شيوعًا', Feature: 'الميزة',
  },
  pt: {
    Settings: 'Configurações', 'Save settings': 'Salvar configurações', Storage: 'Armazenamento', Analytics: 'Análises',
    Today: 'Hoje', 'Pricing plans': 'Planos de preços', Free: 'Grátis', '/ month': '/ mês', 'Current plan': 'Plano atual',
    Basic: 'Básico', 'Most popular': 'Mais popular', Feature: 'Recurso',
  },
  hi: {
    Settings: 'सेटिंग्स', 'Save settings': 'सेटिंग सहेजें', Storage: 'स्टोरेज', Analytics: 'विश्लेषण', Today: 'आज',
    'Pricing plans': 'मूल्य योजनाएँ', Free: 'मुफ़्त', '/ month': '/ माह', 'Current plan': 'वर्तमान प्लान', Basic: 'बेसिक',
    'Most popular': 'सबसे लोकप्रिय', Feature: 'सुविधा',
  },
  ru: {
    Settings: 'Настройки', 'Save settings': 'Сохранить настройки', Storage: 'Хранилище', Analytics: 'Аналитика', Today: 'Сегодня',
    'Pricing plans': 'Тарифы', Free: 'Бесплатно', '/ month': '/ месяц', 'Current plan': 'Текущий тариф', Basic: 'Базовый',
    'Most popular': 'Самый популярный', Feature: 'Функция',
  },
  id: {
    Settings: 'Setelan', 'Save settings': 'Simpan setelan', Storage: 'Penyimpanan', Analytics: 'Analitik', Today: 'Hari ini',
    'Pricing plans': 'Paket harga', Free: 'Gratis', '/ month': '/ bulan', Basic: 'Dasar', 'Most popular': 'Paling populer', Feature: 'Fitur',
  },
  tr: {
    Settings: 'Ayarlar', 'Save settings': 'Ayarları kaydet', Storage: 'Depolama', Analytics: 'Analiz', Today: 'Bugün',
    'Pricing plans': 'Fiyat planları', Free: 'Ücretsiz', '/ month': '/ ay', Basic: 'Temel', 'Most popular': 'En popüler', Feature: 'Özellik',
  },
  vi: {
    Settings: 'Cài đặt', 'Save settings': 'Lưu cài đặt', Storage: 'Lưu trữ', Analytics: 'Phân tích', Today: 'Hôm nay',
    'Pricing plans': 'Gói dịch vụ', Free: 'Miễn phí', '/ month': '/ tháng', Basic: 'Cơ bản', 'Most popular': 'Phổ biến nhất', Feature: 'Tính năng',
  },
  bn: {
    Settings: 'সেটিংস', Storage: 'স্টোরেজ', Analytics: 'বিশ্লেষণ', Today: 'আজ', Free: 'ফ্রি', Basic: 'বেসিক',
    'Access rules': 'অ্যাক্সেস নিয়ম', 'Most popular': 'সবচেয়ে জনপ্রিয়',
  },
  ur: {
    Settings: 'ترتیبات', Storage: 'اسٹوریج', Analytics: 'تجزیات', Today: 'آج', Free: 'مفت', Basic: 'بنیادی',
    'Access rules': 'رسائی کے قواعد', 'Most popular': 'سب سے مقبول',
  },
  mr: {
    Settings: 'सेटिंग्ज', Storage: 'स्टोरेज', Analytics: 'विश्लेषण', Today: 'आज', Free: 'मोफत', Basic: 'बेसिक',
    'Access rules': 'प्रवेश नियम', 'Most popular': 'सर्वाधिक लोकप्रिय',
  },
  te: {
    Settings: 'సెట్టింగ్‌లు', Storage: 'నిల్వ', Analytics: 'విశ్లేషణ', Today: 'ఈరోజు', Free: 'ఉచితం', Basic: 'బేసిక్',
    'Access rules': 'యాక్సెస్ నియమాలు', 'Most popular': 'అత్యంత ప్రాచుర్యం',
  },
  ta: {
    Settings: 'அமைப்புகள்', Storage: 'சேமிப்பு', Analytics: 'பகுப்பாய்வு', Today: 'இன்று', Free: 'இலவசம்', Basic: 'அடிப்படை',
    'Access rules': 'அணுகல் விதிகள்', 'Most popular': 'மிகவும் பிரபலமானது',
  },
  pcm: {
    Settings: 'Settings', Storage: 'Where e dey keep files', Analytics: 'Download breakdown', Today: 'Today',
    Free: 'Free', Basic: 'Basic', 'Most popular': 'People like this one pass',
  },
};
