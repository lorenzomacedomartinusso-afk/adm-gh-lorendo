import { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CheckCircle2, CircleDashed, AlertTriangle } from 'lucide-react';
import { GHRecord, DutyRecord } from '../types';
import { cn } from '../lib/utils';

interface CalendarProps {
  records: GHRecord[];
  duties: DutyRecord[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function Calendar({ records, duties, selectedDate, onSelectDate }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { locale: ptBR, weekStartsOn: 0 }); // Domingo
  const endDate = endOfWeek(monthEnd, { locale: ptBR, weekStartsOn: 0 });
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDaysFull = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const weekDaysShort = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const rowCount = Math.ceil(days.length / 7);

  return (
    <div className="bg-transparent sm:bg-zinc-900 border-0 sm:border border-zinc-800 rounded-2xl sm:rounded-3xl p-0.5 sm:p-6 lg:p-8 shadow-none sm:shadow-xl flex flex-col lg:flex-1 lg:h-full lg:min-h-0 flex-shrink-0">
      {/* Month Navigation */}
      <div className="flex justify-between items-center mb-4 sm:mb-8 flex-shrink-0">
        <h2 className="text-lg sm:text-2xl font-medium text-zinc-100 capitalize tracking-tight font-sans">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <div className="flex gap-1.5 sm:gap-2">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
            className="p-2 sm:p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl hover:bg-zinc-800 active:bg-zinc-700 transition-colors text-zinc-400 hover:text-zinc-100"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
            className="p-2 sm:p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl hover:bg-zinc-800 active:bg-zinc-700 transition-colors text-zinc-400 hover:text-zinc-100"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-4 mb-2 sm:mb-4 flex-shrink-0">
        {weekDaysFull.map((day, i) => (
          <div key={day} className="text-center text-[10px] sm:text-sm font-medium text-zinc-500 uppercase tracking-wider">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{weekDaysShort[i]}</span>
          </div>
        ))}
      </div>

      <div 
        className="grid grid-cols-7 gap-1 sm:gap-4 lg:flex-1 lg:h-full lg:min-h-0 h-[240px] sm:h-auto"
        style={{ gridTemplateRows: `repeat(${rowCount}, 1fr)` }}
      >
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayRecords = records.filter(r => r.date === dateStr);
          const dayDuties = duties.filter(d => d.date === dateStr);
          const totalUI = dayRecords.reduce((sum, r) => sum + r.doseIU, 0);
          const isSelected = isSameDay(day, selectedDate);
          const isMonth = isSameMonth(day, monthStart);
          const is28th = format(day, 'd') === '28';

          return (
            <div 
              key={day.toString()}
              onClick={() => onSelectDate(day)}
              className={cn(
                "h-full min-h-0 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 lg:p-3 flex flex-col justify-between transition-all cursor-pointer group relative border active:scale-[0.95]",
                isSelected 
                  ? "bg-zinc-800 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]" 
                  : isMonth 
                    ? "bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/80" 
                    : "opacity-30 border-transparent bg-transparent hover:bg-zinc-900/50",
                is28th && isMonth && !isSelected && "border-amber-500/30"
              )}
            >
              {/* Day Number */}
              <div className="flex justify-between items-start">
                <span className={cn(
                  "text-xs sm:text-sm font-medium w-5.5 h-5.5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full transition-colors",
                  isToday(day) 
                    ? "bg-emerald-500 text-zinc-950" 
                    : isSelected 
                      ? "text-emerald-400 font-semibold" 
                      : is28th ? "text-amber-400 font-bold" : "text-zinc-400 group-hover:text-zinc-200"
                )}>
                  {format(day, 'd')}
                </span>
                {is28th && isMonth && (
                  <AlertTriangle className={cn("w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4", isSelected ? "text-emerald-400" : "text-amber-500")} />
                )}
              </div>
              
              {/* Day Content – hidden on very small, compact on mobile */}
              <div className="mt-auto flex flex-col gap-0.5 sm:gap-1.5">
                {/* Duties indicators */}
                {(dayDuties.length > 0 || is28th) && (
                   <div className="hidden sm:flex flex-wrap gap-1 mb-1">
                     {is28th && isMonth && (
                       <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Dia 28: Medição, Exame, Dra." />
                     )}
                     {dayDuties.map(d => (
                       <span 
                         key={d.id} 
                         className={cn(
                           "flex-shrink-0",
                           d.completed ? "text-zinc-500" : "text-blue-400"
                         )}
                         title={d.title}
                       >
                         {d.completed ? <CheckCircle2 className="w-2 h-2 md:w-3 md:h-3" /> : <CircleDashed className="w-2 h-2 md:w-3 md:h-3" />}
                       </span>
                     ))}
                   </div>
                )}
                
                {/* Mobile: multi-colored dot indicators */}
                <div className="sm:hidden flex justify-center gap-1.5 pb-0.5">
                  {dayRecords.length > 0 && (
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]",
                      isSelected ? "bg-emerald-400" : "bg-emerald-500"
                    )} />
                  )}
                  {dayDuties.length > 0 && (
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      dayDuties.every(d => d.completed) ? "bg-zinc-600" : "bg-blue-400"
                    )} />
                  )}
                  {is28th && isMonth && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  )}
                </div>

                {/* Desktop: full UI badge */}
                {dayRecords.length > 0 && (
                  <div className="hidden sm:block">
                    <div className={cn(
                      "text-[10px] md:text-xs font-mono font-medium self-start px-2 py-0.5 rounded-md",
                      isSelected ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-800 text-zinc-300"
                    )}>
                      {totalUI.toFixed(1)} UI
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dayRecords.map(r => (
                        <div 
                          key={r.id} 
                          className={cn(
                            "w-1 h-1 md:w-1.5 md:h-1.5 rounded-full",
                            isSelected ? "bg-emerald-400" : "bg-emerald-500/50"
                          )} 
                          title={`${r.doseIU}UI - ${r.site}`} 
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
