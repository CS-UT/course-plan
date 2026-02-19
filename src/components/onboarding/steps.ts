export interface TourStepDef {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
  device: 'desktop' | 'mobile' | 'both';
}

export const tourSteps: TourStepDef[] = [
  {
    id: 'course-search',
    targetSelector: '[data-tour="course-search"]',
    title: 'جستجوی درس',
    description:
      'از اینجا دروس مورد نظرتان را جستجو کنید و به برنامه اضافه کنید.',
    side: 'left',
    align: 'start',
    device: 'desktop',
  },
  {
    id: 'mobile-add',
    targetSelector: '[data-tour="mobile-add-btn"]',
    title: 'افزودن درس',
    description: 'برای جستجو و افزودن درس، اینجا را لمس کنید.',
    side: 'top',
    align: 'center',
    device: 'mobile',
  },
  {
    id: 'calendar',
    targetSelector: '[data-tour="calendar"]',
    title: 'برنامه هفتگی',
    description:
      'برنامه هفتگی شما اینجا نمایش داده می‌شود. روی خانه‌های خالی بکشید تا دروس آن ساعت فیلتر شوند.',
    side: 'top',
    align: 'center',
    device: 'both',
  },
  {
    id: 'schedule-tabs',
    targetSelector: '[data-tour="schedule-tabs"]',
    title: 'برنامه‌های متعدد',
    description: 'می‌توانید تا ۵ برنامه مختلف بسازید و مقایسه کنید.',
    side: 'bottom',
    align: 'start',
    device: 'both',
  },
  {
    id: 'exams-toggle',
    targetSelector: '[data-tour="exams-toggle"]',
    title: 'جدول امتحانات',
    description: 'جدول امتحانات و تداخل‌ها را اینجا ببینید.',
    side: 'bottom',
    align: 'start',
    device: 'both',
  },
  {
    id: 'export-buttons',
    targetSelector: '[data-tour="export-buttons"]',
    title: 'خروجی و اشتراک‌گذاری',
    description:
      'برنامه را به صورت تصویر، فایل JSON یا لینک تقویم گوگل خروجی بگیرید.',
    side: 'bottom',
    align: 'end',
    device: 'both',
  },
  {
    id: 'dark-mode',
    targetSelector: '[data-tour="dark-mode"]',
    title: 'حالت تاریک',
    description: 'با این دکمه بین حالت روشن و تاریک جابه‌جا شوید.',
    side: 'bottom',
    align: 'end',
    device: 'both',
  },
];
