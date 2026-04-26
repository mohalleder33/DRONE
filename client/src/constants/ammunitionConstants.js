export const AMMUNITION_TYPES = ['متفجرة', 'حارقة', 'خارقة', 'تدريبية'];

export const AMMUNITION_TYPE_OPTIONS = AMMUNITION_TYPES.map(t => ({ value: t, label: t }));

export const LOCATION_TYPES = [
  { value: 'headquarters', label: 'المستودع الرئيسي' },
  { value: 'platform', label: 'منصة' }
];