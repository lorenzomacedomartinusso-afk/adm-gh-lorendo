import { useState, useEffect, ChangeEvent } from 'react';
import { Trash2, Syringe, ListChecks, User, Camera, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDatabase } from './hooks/useDatabase';
import { Calendar } from './components/Calendar';
import { LogForm } from './components/LogForm';
import { DutyPanel } from './components/DutyPanel';
import { cn } from './lib/utils';
import { supabase } from './lib/supabase';

type MobileView = 'calendar' | 'gh' | 'duties';

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
    getRecommendedSite,
    clearAllData
  } = useDatabase();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'gh' | 'duties'>('gh');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>('calendar');

  useEffect(() => {
    // 1. Carrega do LocalStorage instantaneamente para experiência offline-first
    const cachedPic = localStorage.getItem('gh-profile-pic');
    if (cachedPic) setProfilePic(cachedPic);

    // 2. Busca o avatar atualizado do Supabase em background
    async function loadProfilePic() {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'profile_pic')
          .single();
        
        if (!error && data?.value) {
          setProfilePic(data.value);
          localStorage.setItem('gh-profile-pic', data.value);
        }
      } catch (e) {
        console.error("Failed to load profile pic from Supabase", e);
      }
    }
    loadProfilePic();
  }, []);

  const handleProfilePicChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setProfilePic(base64String);
        localStorage.setItem('gh-profile-pic', base64String);

        // Salva no Supabase em background
        try {
          await supabase
            .from('app_settings')
            .upsert({ 
              key: 'profile_pic', 
              value: base64String, 
              updated_at: new Date().toISOString() 
            });
        } catch (err) {
          console.error("Failed to save profile pic to Supabase", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isLoaded) return null; // Hydration guard

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayRecords = records.filter(r => r.date === selectedDateStr);

  return (
    <div className="h-screen lg:h-auto lg:min-h-screen bg-[#050505] text-zinc-100 selection:bg-emerald-500/30 flex flex-col overflow-hidden lg:overflow-visible">
      <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-10 flex flex-col flex-1 min-h-0 pb-20 lg:pb-10">
        
        {/* Header */}
        <header className="w-full flex flex-col gap-2 sm:gap-3 mb-6 sm:mb-10 flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col gap-0.5 sm:gap-1 flex-1 min-w-0 pr-4">
              <h1 className="text-2xl sm:text-4xl font-black font-logo tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.15)] truncate">
                ADM GH Lorenzo
              </h1>
              <p className="text-[11px] sm:text-sm font-medium text-zinc-500 tracking-wide">
                Simplificando seu monitoramento diário.
              </p>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  if (window.confirm("Deseja realmente limpar todos os dados de teste (registros, deveres e foto)?")) {
                    clearAllData();
                    window.location.reload();
                  }
                }}
                className="text-[10px] sm:text-xs font-semibold text-zinc-500 hover:text-red-400 hover:border-red-500/20 active:scale-95 border border-zinc-900 bg-zinc-950/60 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                title="Limpar todos os dados de teste"
              >
                Limpar Testes
              </button>
              <div className="text-xs font-mono font-medium text-zinc-500 bg-zinc-950/60 border border-zinc-900 px-3 py-1.5 rounded-xl hidden sm:block">
                {format(new Date(), "dd/MM/yyyy")}
              </div>
              <label className="relative w-11 h-11 sm:w-14 sm:h-14 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 hover:border-zinc-700 shadow-md cursor-pointer overflow-hidden group transition-all">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                )}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Camera className="w-4 h-4 text-white" />
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleProfilePicChange} 
                />
              </label>
            </div>
          </div>
          <div className="w-full h-[1px] bg-gradient-to-r from-emerald-500/20 via-zinc-800 to-transparent mt-1" />
        </header>

        {/* ========== DESKTOP LAYOUT ========== */}
        <div className="hidden lg:flex gap-8 items-start flex-1">
          {/* Main Calendar View */}
          <div className="w-2/3">
            <Calendar 
              records={records} 
              duties={duties}
              selectedDate={selectedDate} 
              onSelectDate={setSelectedDate} 
            />
          </div>

          {/* Right Panel */}
          <div className="w-1/3 flex flex-col gap-6">
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
                onSelectDate={setSelectedDate}
                onSaveDuty={saveDuty}
                onToggleDuty={toggleDuty}
                onDeleteDuty={deleteDuty}
              />
            )}
          </div>
        </div>

        {/* ========== MOBILE LAYOUT ========== */}
        <div className={cn(
          "lg:hidden flex flex-col flex-1 min-h-0",
          mobileView !== 'calendar' && "mobile-scroll"
        )}>
          {mobileView === 'calendar' && (
            <div className="flex-1 flex flex-col min-h-0 fade-in h-full">
              <Calendar 
                records={records} 
                duties={duties}
                selectedDate={selectedDate} 
                onSelectDate={(date) => {
                  setSelectedDate(date);
                }} 
              />
            </div>
          )}

          {mobileView === 'gh' && (
            <div className="flex flex-col gap-4 fade-in">
              <LogForm 
                onSave={saveRecord} 
                recommendedSite={getRecommendedSite()} 
                selectedDate={selectedDate} 
              />

              {/* Mobile Daily Records */}
              {dayRecords.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
                  <h3 className="text-base font-medium text-zinc-100 mb-3 flex items-center justify-between">
                    Log do Dia
                    <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {dayRecords.reduce((sum, r) => sum + r.doseIU, 0).toFixed(1)} UI
                    </span>
                  </h3>
                  
                  <div className="space-y-2">
                    {dayRecords.map(record => (
                      <div key={record.id} className="bg-zinc-950 border border-zinc-800/60 p-3 rounded-xl flex items-start justify-between">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-mono font-medium text-sm">{record.time}</span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-sm font-medium text-zinc-200">{record.doseIU.toFixed(1)} UI</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <span className="bg-zinc-800 px-2 py-0.5 rounded-md text-zinc-300">{record.site}</span>
                            <span className="truncate">{record.protocol}</span>
                          </div>
                          {record.notes && (
                            <p className="text-xs text-zinc-500 mt-1 italic truncate">{record.notes}</p>
                          )}
                        </div>
                        <button 
                          onClick={() => deleteRecord(record.id)}
                          className="p-2 text-zinc-500 hover:text-red-400 active:text-red-400 active:bg-red-400/10 rounded-xl transition-all flex-shrink-0"
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
                <div className="bg-zinc-900/40 border border-zinc-800/50 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <p className="text-zinc-500 text-sm">Nenhum registro para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</p>
                  <p className="text-zinc-600 text-xs mt-1">Dia limpo.</p>
                </div>
              )}
            </div>
          )}

          {mobileView === 'duties' && (
            <div className="fade-in">
              <DutyPanel 
                duties={duties} 
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onSaveDuty={saveDuty}
                onToggleDuty={toggleDuty}
                onDeleteDuty={deleteDuty}
              />
            </div>
          )}
        </div>
      </div>

      {/* ========== MOBILE BOTTOM NAVIGATION ========== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
          <button
            onClick={() => setMobileView('calendar')}
            className={cn(
              "flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 active:scale-95",
              mobileView === 'calendar'
                ? "text-emerald-400"
                : "text-zinc-500"
            )}
          >
            <CalendarDays className="w-5 h-5" />
            <span className="text-[10px] font-medium bottom-nav-label">Calendário</span>
          </button>

          <button
            onClick={() => setMobileView('gh')}
            className={cn(
              "flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 active:scale-95",
              mobileView === 'gh'
                ? "text-emerald-400"
                : "text-zinc-500"
            )}
          >
            <Syringe className="w-5 h-5" />
            <span className="text-[10px] font-medium bottom-nav-label">Registrar</span>
          </button>

          <button
            onClick={() => setMobileView('duties')}
            className={cn(
              "flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 active:scale-95",
              mobileView === 'duties'
                ? "text-emerald-400"
                : "text-zinc-500"
            )}
          >
            <ListChecks className="w-5 h-5" />
            <span className="text-[10px] font-medium bottom-nav-label">Deveres</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
