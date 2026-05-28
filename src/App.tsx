import { useState, useEffect } from 'react';
import { Trash2, Syringe, ListChecks, User, Camera } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDatabase } from './hooks/useDatabase';
import { Calendar } from './components/Calendar';
import { LogForm } from './components/LogForm';
import { DutyPanel } from './components/DutyPanel';
import { cn } from './lib/utils';

export default function App() {
  const { 
    records, 
    duties,
    isLoaded, 
    saveRecord, 
    deleteRecord, 
    saveDuty,
    deleteDuty,
    toggleDuty,
    getRecommendedSite
  } = useDatabase();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'gh' | 'duties'>('gh');
  const [profilePic, setProfilePic] = useState<string | null>(null);

  useEffect(() => {
    setProfilePic(localStorage.getItem('gh-profile-pic'));
  }, []);

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfilePic(base64String);
        localStorage.setItem('gh-profile-pic', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isLoaded) return null; // Hydration guard

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayRecords = records.filter(r => r.date === selectedDateStr);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-emerald-500/30">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col">
        
        {/* Header Setup */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 flex-shrink-0">
          <div className="flex items-center gap-4">
            <label className="relative w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 hover:border-zinc-700 cursor-pointer overflow-hidden group transition-all">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <Camera className="w-4 h-4 text-white" />
              </div>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleProfilePicChange} 
              />
            </label>
            <h1 className="text-xl font-medium tracking-tight text-emerald-400">ADM GH Lorenzo</h1>
          </div>
          
          <div className="text-sm font-medium text-zinc-500">
            Simplificando seu monitoramento diário.
          </div>
        </header>

        <div className="flex flex-col xl:flex-row gap-8 items-start flex-1">
          {/* Main Calendar View */}
          <div className="w-full xl:w-2/3">
            <Calendar 
              records={records} 
              duties={duties}
              selectedDate={selectedDate} 
              onSelectDate={setSelectedDate} 
            />
          </div>

          {/* Right Panel: Switchable Logic */}
          <div className="w-full xl:w-1/3 flex flex-col gap-6">
            
            {/* Tabs */}
            <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <button
                onClick={() => setActiveTab('gh')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  activeTab === 'gh' 
                    ? "bg-zinc-800 text-zinc-100 shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                )}
              >
                <Syringe className="w-4 h-4" /> Registrar GH
              </button>
              <button
                onClick={() => setActiveTab('duties')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  activeTab === 'duties' 
                    ? "bg-zinc-800 text-zinc-100 shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                )}
              >
                <ListChecks className="w-4 h-4" /> Deveres do Dia
              </button>
            </div>

            {activeTab === 'gh' ? (
              <div className="flex flex-col gap-6">
                <LogForm 
                  onSave={saveRecord} 
                  recommendedSite={getRecommendedSite()} 
                  selectedDate={selectedDate} 
                />

                {/* Daily Records List */}
                {dayRecords.length > 0 && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
                    <h3 className="text-lg font-medium text-zinc-100 mb-4 flex items-center justify-between">
                      Log do Dia
                      <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                        {dayRecords.reduce((sum, r) => sum + r.doseIU, 0).toFixed(1)} UI Total
                      </span>
                    </h3>
                    
                    <div className="space-y-3">
                      {dayRecords.map(record => (
                        <div key={record.id} className="bg-zinc-950 border border-zinc-800/60 p-4 rounded-2xl flex items-start justify-between group hover:border-zinc-700 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-400 font-mono font-medium">{record.time}</span>
                              <span className="text-zinc-600">•</span>
                              <span className="text-sm font-medium text-zinc-200">{record.doseIU.toFixed(1)} UI</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                              <span className="bg-zinc-800 px-2 py-0.5 rounded-md text-zinc-300">{record.site}</span>
                              <span>{record.protocol}</span>
                            </div>
                            {record.notes && (
                              <p className="text-xs text-zinc-500 mt-2 italic flex items-center gap-1.5 before:content-[''] before:block before:w-px before:h-3 before:bg-zinc-700">
                                {record.notes}
                              </p>
                            )}
                          </div>
                          <button 
                            onClick={() => deleteRecord(record.id)}
                            className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                            title="Remover dose"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {dayRecords.length === 0 && (
                  <div className="bg-zinc-900/40 border border-zinc-800/50 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                    <p className="text-zinc-500 text-sm">Nenhum registro para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</p>
                    <p className="text-zinc-600 text-xs mt-1">Dia limpo.</p>
                  </div>
                )}
              </div>
            ) : (
              <DutyPanel 
                duties={duties} 
                selectedDate={selectedDate}
                onSaveDuty={saveDuty}
                onToggleDuty={toggleDuty}
                onDeleteDuty={deleteDuty}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
