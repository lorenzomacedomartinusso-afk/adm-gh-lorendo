import { useState, FormEvent } from 'react';
import { InjectionSite, ProtocolTiming } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlusCircle, Clock, MapPin, NotebookPen, Syringe } from 'lucide-react';
import { cn } from '../lib/utils';

interface LogFormProps {
  onSave: (record: any) => void;
  recommendedSite: string;
  selectedDate: Date;
}

const SITES: InjectionSite[] = [
  'Abdômen Esq', 'Abdômen Dir', 
  'Coxa Esq', 'Coxa Dir', 
  'Glúteo Esq', 'Glúteo Dir', 
  'Ombro Esq', 'Ombro Dir'
];

const PROTOCOLS: ProtocolTiming[] = [
  'Jejum', 'Pré-Treino', 'Pós-Treino', 'Antes de Dormir'
];

export function LogForm({ onSave, recommendedSite, selectedDate }: LogFormProps) {
  const [doseIU, setDoseIU] = useState<number>(2);
  const [site, setSite] = useState<InjectionSite>(recommendedSite as InjectionSite);
  const [protocol, setProtocol] = useState<ProtocolTiming>('Jejum');
  const [notes, setNotes] = useState('');
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({ 
      doseIU, 
      site, 
      protocol, 
      notes, 
      date: format(selectedDate, 'yyyy-MM-dd'), 
      time 
    });
    setNotes('');
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl">
      <div className="flex items-center justify-between mb-5 sm:mb-8">
        <h2 className="text-base sm:text-xl font-medium text-zinc-100 flex items-center gap-2">
          <Syringe className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> Registrar Dose
        </h2>
        <span className="text-[10px] sm:text-xs font-mono bg-zinc-950 text-zinc-400 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-zinc-800">
          {format(selectedDate, "dd 'de' MMM", { locale: ptBR })}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Time & Dose Row – side by side on mobile to save space */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-1 sm:gap-4">
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm font-medium text-zinc-400 flex items-center gap-1.5 sm:gap-2">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Horário
            </label>
            <input 
              type="time" 
              value={time} 
              onChange={e => setTime(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono text-sm sm:text-base"
              required
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm font-medium text-zinc-400 flex justify-between">
              <span>Dose (UI)</span>
              <span className="font-mono text-emerald-400 font-medium">
                {doseIU.toFixed(1)}
              </span>
            </label>
            <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3">
              <input 
                type="range" 
                min="0.5" max="10" step="0.5"
                value={doseIU}
                onChange={e => setDoseIU(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Injection Site */}
        <div className="space-y-2 sm:space-y-3">
          <label className="text-xs sm:text-sm font-medium text-zinc-400 flex justify-between items-center">
            <span className="flex items-center gap-1.5 sm:gap-2"><MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Localidade</span>
            {site !== recommendedSite && (
               <span 
                 className="text-[9px] sm:text-[10px] text-emerald-400/80 bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold cursor-pointer transition hover:bg-emerald-500/20 active:bg-emerald-500/30" 
                 onClick={() => setSite(recommendedSite as InjectionSite)}
               >
                 Sugestão: {recommendedSite}
               </span>
            )}
          </label>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {SITES.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSite(s)}
                className={cn(
                  "px-2 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-medium transition-all duration-200 border active:scale-[0.97]",
                  site === s 
                    ? "bg-emerald-500 text-zinc-950 border-emerald-500 shadow-sm" 
                    : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Protocol */}
        <div className="space-y-2 sm:space-y-3">
          <label className="text-xs sm:text-sm font-medium text-zinc-400">Protocolo</label>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {PROTOCOLS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setProtocol(p)}
                className={cn(
                  "px-2 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-medium transition-all duration-200 border active:scale-[0.97]",
                  protocol === p 
                    ? "bg-zinc-200 text-zinc-900 border-zinc-300" 
                    : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5 sm:space-y-2">
          <label className="text-xs sm:text-sm font-medium text-zinc-400 flex items-center gap-1.5 sm:gap-2">
            <NotebookPen className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Notas (Opcional)
          </label>
          <input 
            type="text" 
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Feedback, efeitos, estado alvo..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-zinc-100 placeholder:text-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        {/* Submit */}
        <button 
          type="submit"
          className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 font-semibold py-3.5 sm:py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.98]"
        >
          <PlusCircle className="w-5 h-5" />
          Registrar
        </button>
      </form>
    </div>
  );
}
