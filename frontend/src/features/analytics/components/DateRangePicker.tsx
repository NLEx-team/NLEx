import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addDays,
  isSameDay,
  isSameMonth,
} from 'date-fns';
import './DateRangePicker.css';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

const fmt = (d: Date) => format(d, 'yyyy-MM-dd');
const parse = (s: string): Date | null => (s ? new Date(`${s}T00:00:00`) : null);

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(() => parse(startDate) || new Date());
  // First click of a new range selection (before the second click commits it).
  const [pendingStart, setPendingStart] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const locale = i18n.language.startsWith('ru') ? 'ru-RU' : 'en-US';
  const weekStartsOn: 0 | 1 = i18n.language.startsWith('ru') ? 1 : 0;
  const today = startOfToday();

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Reset any half-finished selection when the popover closes.
  useEffect(() => {
    if (!open) {
      setPendingStart(null);
      setHoverDate(null);
    }
  }, [open]);

  const todayDate = new Date();
  const presets = [
    { key: 'today', label: t('analytics.preset_today'), start: fmt(todayDate), end: fmt(todayDate) },
    { key: 'yesterday', label: t('analytics.preset_yesterday'), start: fmt(subDays(todayDate, 1)), end: fmt(subDays(todayDate, 1)) },
    { key: 'last7', label: t('analytics.preset_last7'), start: fmt(subDays(todayDate, 6)), end: fmt(todayDate) },
    { key: 'month', label: t('analytics.preset_this_month'), start: fmt(startOfMonth(todayDate)), end: fmt(todayDate) },
    { key: 'all', label: t('analytics.preset_all_time'), start: '', end: '' },
  ];
  const activePreset = presets.find(p => p.start === startDate && p.end === endDate);

  const shortDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' });

  let triggerLabel: string;
  if (activePreset) {
    triggerLabel = activePreset.label;
  } else if (startDate || endDate) {
    const s = startDate ? shortDate(startDate) : '…';
    const e = endDate ? shortDate(endDate) : '…';
    triggerLabel = startDate === endDate ? s : `${s} – ${e}`;
  } else {
    triggerLabel = t('analytics.preset_all_time');
  }

  const openPopover = () => {
    if (!open) {
      setViewMonth(parse(startDate) || new Date());
    }
    setOpen(o => !o);
  };

  // The range to visualise: the in-progress selection (if any) wins over the committed one.
  const committedStart = parse(startDate);
  const committedEnd = parse(endDate);
  let rangeA: Date | null;
  let rangeB: Date | null;
  if (pendingStart) {
    const other = hoverDate || pendingStart;
    const ordered = pendingStart.getTime() <= other.getTime();
    rangeA = ordered ? pendingStart : other;
    rangeB = ordered ? other : pendingStart;
  } else {
    rangeA = committedStart;
    rangeB = committedEnd;
  }
  const aTime = rangeA ? rangeA.getTime() : null;
  const bTime = rangeB ? rangeB.getTime() : null;

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn });
    const gridEnd = endOfWeek(endOfMonth(viewMonth), { weekStartsOn });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [viewMonth, weekStartsOn]);

  const weekdayLabels = useMemo(() => {
    const gridStart = startOfWeek(new Date(), { weekStartsOn });
    return Array.from({ length: 7 }, (_, i) =>
      addDays(gridStart, i).toLocaleDateString(locale, { weekday: 'short' })
    );
  }, [locale, weekStartsOn]);

  const monthTitle = (() => {
    const raw = viewMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  })();

  const handleDayClick = (day: Date) => {
    if (day.getTime() > today.getTime()) return; // no future dates
    if (!pendingStart) {
      setPendingStart(day);
      setHoverDate(null);
      return;
    }
    const ordered = pendingStart.getTime() <= day.getTime();
    const a = ordered ? pendingStart : day;
    const b = ordered ? day : pendingStart;
    onChange(fmt(a), fmt(b));
    setPendingStart(null);
    setHoverDate(null);
    setOpen(false);
  };

  return (
    <div className="date-range" ref={containerRef}>
      <button
        type="button"
        className={`date-range__trigger ${open ? 'date-range__trigger--open' : ''}`}
        onClick={openPopover}
      >
        <Icon icon="mdi:calendar-range-outline" className="date-range__cal-icon" />
        <span className="date-range__label">{triggerLabel}</span>
        <Icon icon="mdi:chevron-down" className="date-range__chevron" />
      </button>

      {open && (
        <div className="date-range__popover">
          <div className="date-range__presets">
            {presets.map(p => (
              <button
                key={p.key}
                type="button"
                className={`date-range__preset ${activePreset?.key === p.key ? 'date-range__preset--active' : ''}`}
                onClick={() => { onChange(p.start, p.end); setPendingStart(null); setOpen(false); }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="date-range__calendar">
            <div className="date-range__cal-header">
              <button
                type="button"
                className="date-range__nav"
                onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                aria-label="Previous month"
              >
                <Icon icon="mdi:chevron-left" />
              </button>
              <span className="date-range__month-title">{monthTitle}</span>
              <button
                type="button"
                className="date-range__nav"
                onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                aria-label="Next month"
              >
                <Icon icon="mdi:chevron-right" />
              </button>
            </div>

            <div className="date-range__weekdays">
              {weekdayLabels.map((w, i) => (
                <span key={i} className="date-range__weekday">{w}</span>
              ))}
            </div>

            <div className="date-range__days">
              {days.map(day => {
                const isStart = !!rangeA && isSameDay(day, rangeA);
                const isEnd = !!rangeB && isSameDay(day, rangeB);
                const isSingle = isStart && isEnd;
                const dayTime = day.getTime();
                const inRange = aTime !== null && bTime !== null && dayTime > aTime && dayTime < bTime;
                const isOutside = !isSameMonth(day, viewMonth);
                const isToday = isSameDay(day, today);
                const isFuture = dayTime > today.getTime();

                const classes = ['date-range__day'];
                if (isSingle) classes.push('date-range__day--single');
                else if (isStart) classes.push('date-range__day--start');
                else if (isEnd) classes.push('date-range__day--end');
                else if (inRange) classes.push('date-range__day--in-range');
                if (isOutside) classes.push('date-range__day--outside');
                if (isToday) classes.push('date-range__day--today');
                if (isFuture) classes.push('date-range__day--future');

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    className={classes.join(' ')}
                    disabled={isFuture}
                    onClick={() => handleDayClick(day)}
                    onMouseEnter={() => pendingStart && setHoverDate(day)}
                  >
                    <span>{day.getDate()}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
