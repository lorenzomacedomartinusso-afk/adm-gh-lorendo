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
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl flex-1 flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-medium text-zinc-100 capitalize tracking-tight font-sans">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
            className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
            className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 sm:gap-4 mb-4">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs sm:text-sm font-medium text-zinc-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 sm:gap-4 flex-1">
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
                "min-h-[80px] sm:min-h-[120px] rounded-2xl p-2 sm:p-3 flex flex-col transition-all cursor-pointer group relative border",
                isSelected 
                  ? "bg-zinc-800 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
                  : isMonth 
                    ? "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80" 
                    : "opacity-30 border-transparent bg-transparent hover:bg-zinc-900/50",
                is28th && isMonth && !isSelected && "border-amber-500/30"
              )}
            >
              <div className="flex justify-between items-start">
                <span className={cn(
                  "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                  isToday(day) 
                    ? "bg-emerald-500 text-zinc-950" 
                    : isSelected 
                      ? "text-emerald-400" 
                      : is28th ? "text-amber-400 font-bold" : "text-zinc-400 group-hover:text-zinc-200"
                )}>
                  {format(day, 'd')}
                </span>
                {is28th && isMonth && (
                  <AlertTriangle className={cn("w-3 h-3 md:w-4 md:h-4", isSelected ? "text-emerald-400" : "text-amber-500")} />
                )}
              </div>
              
              <div className="mt-auto flex flex-col gap-1.5">
                {(dayDuties.length > 0 || is28th) && (
                   <div className="flex flex-wrap gap-1 mb-1">
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
                {dayRecords.length > 0 && (
                  <>
                    <div className={cn(
                      "text-[10px] md:text-xs font-mono font-medium self-start px-2 py-0.5 rounded-md",
                      isSelected ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-800 text-zinc-300"
                    )}>
                      {totalUI.toFixed(1)} UI
                    </div>
                    <div className="flex flex-wrap gap-1">
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
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
