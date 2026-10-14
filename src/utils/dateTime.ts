import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';

dayjs.extend(calendar);

export const formatTime = (ts: number): string => dayjs(ts).format('h:mm A');

export const isSameDay = (a: number, b: number): boolean =>
  dayjs(a).isSame(b, 'day');

export const formatDateLabel = (ts: number): string =>
  dayjs(ts).calendar(null, {
    sameDay: '[Today]',
    lastDay: '[Yesterday]',
    sameElse: 'D MMM YYYY',
  });

export const formatDateTime = (ts: number): string =>
  dayjs(ts).format('D MMM YYYY, h:mm A');