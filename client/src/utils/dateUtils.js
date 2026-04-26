export const formatDate = (date, locale = 'ar-EG') => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
};

export const formatDateTime = (date, locale = 'ar-EG') => {
  if (!date) return '—';
  return new Date(date).toLocaleString(locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const calculateRemainingDays = (endDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const isDatePassed = (date) => {
  return new Date(date) < new Date();
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};