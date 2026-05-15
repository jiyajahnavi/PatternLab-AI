import React, { useMemo } from 'react';
import { subDays, format, getDay } from 'date-fns';
import { useProgressStore } from '../../store/useProgressStore';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const HeatmapCalendar: React.FC = () => {
  const { heatmap } = useProgressStore();

  const { weeks, monthLabels, totalProblems } = useMemo(() => {
    const today = new Date();
    const last365Days = Array.from({ length: 365 }).map((_, i) => {
      const d = subDays(today, 364 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      return { date: d, dateStr, count: heatmap[dateStr] || 0 };
    });

    // Build weeks grid (columns = weeks, rows = days of week)
    const weeks: typeof last365Days[] = [];
    let currentWeek: typeof last365Days = [];

    // Pad start to align with correct day of week (Sun=0)
    const firstDayOfWeek = getDay(last365Days[0].date);
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: new Date(0), dateStr: '', count: -1 });
    }

    last365Days.forEach(day => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) {
      // pad end
      while (currentWeek.length < 7) currentWeek.push({ date: new Date(0), dateStr: '', count: -1 });
      weeks.push(currentWeek);
    }

    // Build month label positions: find first week of each new month
    const monthLabels: { label: string; colIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const firstReal = week.find(d => d.count !== -1 && d.dateStr !== '');
      if (firstReal) {
        const m = firstReal.date.getMonth();
        if (m !== lastMonth) {
          monthLabels.push({ label: MONTHS[m], colIndex: wi });
          lastMonth = m;
        }
      }
    });

    const totalProblems = last365Days.reduce((acc, d) => acc + d.count, 0);
    return { weeks, monthLabels, totalProblems };
  }, [heatmap]);

  const getColor = (count: number) => {
    if (count === 0) return { bg: '#1C1C22', border: '#28282F' };
    if (count === 1) return { bg: '#312E5E', border: '#403C7A' };
    if (count <= 3) return { bg: '#504EA3', border: '#6361C0' };
    return { bg: '#7C6FF7', border: '#9488FF' };
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-primary">Activity Heatmap</h3>
        <span className="text-xs text-muted font-mono">{totalProblems} problems in the last year</span>
      </div>

      <div className="overflow-x-auto pb-2 custom-scrollbar">
        <div style={{ width: '100%' }}>
          {/* Month labels */}
          <div className="flex mb-1 pl-7">
            {weeks.map((_, wi) => {
              const ml = monthLabels.find(m => m.colIndex === wi);
              return (
                <div
                  key={wi}
                  style={{ width: 14, marginRight: 3, flexShrink: 0 }}
                  className="text-[9px] text-muted font-mono"
                >
                  {ml ? ml.label : ''}
                </div>
              );
            })}
          </div>

          {/* Grid rows (days of week) */}
          <div className="flex gap-0">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-1 shrink-0">
              {DAYS.map((d, i) => (
                <div
                  key={i}
                  style={{ height: 14, lineHeight: '14px' }}
                  className="text-[9px] text-muted font-mono w-5 text-right pr-1"
                >
                  {i % 2 === 1 ? d : ''}
                </div>
              ))}
            </div>

            {/* Heatmap cells: columns = weeks, rows = days */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day, di) => {
                    const color = day.count === -1 ? null : getColor(day.count);
                    return (
                      <div
                        key={di}
                        title={day.count > 0 ? `${day.count} problem${day.count > 1 ? 's' : ''} on ${day.dateStr}` : day.dateStr || ''}
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 3,
                          backgroundColor: color ? color.bg : 'transparent',
                          border: color ? `1px solid ${color.border}` : 'none',
                          boxShadow: day.count >= 4 ? '0 0 6px rgba(124,111,247,0.35)' : 'none',
                          transition: 'transform 0.1s',
                          cursor: day.count !== -1 ? 'crosshair' : 'default',
                          flexShrink: 0,
                        }}
                        onMouseEnter={e => { if (day.count !== -1) (e.currentTarget as HTMLElement).style.transform = 'scale(1.25)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 text-[10px] text-muted mt-3">
        <span>Less</span>
        {[0, 1, 2, 4].map(c => {
          const col = getColor(c);
          return (
            <div
              key={c}
              style={{ width: 11, height: 11, borderRadius: 2, backgroundColor: col.bg, border: `1px solid ${col.border}` }}
            />
          );
        })}
        <span>More</span>
      </div>
    </div>
  );
};
