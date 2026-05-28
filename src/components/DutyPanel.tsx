import { useState } from 'react';
import { DutyRecord } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlusCircle, CheckCircle2, CircleDashed, Trash2, ListChecks, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

interface DutyPanelProps {
  duties: DutyRecord[];
  selectedDate: Date;
  onSaveDuty: (title: string, date: string) => void;
  onToggleDuty: (id: string) => void;
  onDeleteDuty: (id: string) => void;
}

export function DutyPanel({ duties, selectedDate, onSaveDuty, onToggleDuty, onDeleteDuty }: DutyPanelProps) {
  const [newTitle, setNewTitle] = useState('');

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayDuties = duties.filter(d => d.date === dateStr);
  const is28th = format(selectedDate, 'd') === '28';

  const fixedDuties = is28th ? [
    { title: 'Medição de resultados' },
    { title: 'Exame de Sangue' },
    { title: 'Marcar consulta com Dra.' }
  ] : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onSaveDuty(newTitle.trim(), dateStr);
      setNewTitle('');
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-blue-400" /> Deveres
        </h2>
        <span className="text-xs font-mono bg-zinc-950 text-zinc-400 px-3 py-1.5 rounded-full border border-zinc-800">
          {format(selectedDate, "dd 'de' MMM", { locale: ptBR })}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Adicionar um dever (Ex: Comprar seringas)"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <button 
            type="submit"
            disabled={!newTitle.trim()}
            className="bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-semibold px-4 rounded-xl transition-all duration-200 flex items-center justify-center flex-shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
        </div>
      </form>

      <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {fixedDuties.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> Eventos Fixos do Mês
            </h3>
            <div className="space-y-2">
              {fixedDuties.map((fd, i) => (
                <div key={`fixed-${i}`} className="bg-amber-950/20 border border-amber-500/20 p-3 rounded-xl flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500/80"></span>
                  <span className="text-sm font-medium text-amber-200/80">{fd.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {dayDuties.length > 0 ? (
          <div className="space-y-2">
            {dayDuties.map(duty => (
              <div 
                key={duty.id} 
                className={cn(
                  "border p-3 rounded-xl flex items-center justify-between group transition-all cursor-pointer",
                  duty.completed 
                    ? "bg-zinc-950/50 border-zinc-800/50 opacity-60" 
                    : "bg-zinc-900 border-zinc-700 hover:border-zinc-600"
                )}
                onClick={() => onToggleDuty(duty.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <button className="flex-shrink-0 transition-colors">
                    {duty.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <CircleDashed className="w-5 h-5 text-zinc-500 hover:text-blue-400" />
                    )}
                  </button>
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    duty.completed ? "text-zinc-500 line-through" : "text-zinc-200"
                  )}>
                    {duty.title}
                  </span>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteDuty(duty.id);
                  }}
                  className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="Remover dever"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          !is28th && (
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <ListChecks className="w-8 h-8 text-zinc-800 mb-2" />
              <p className="text-zinc-500 text-sm">Sem deveres para este dia.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
