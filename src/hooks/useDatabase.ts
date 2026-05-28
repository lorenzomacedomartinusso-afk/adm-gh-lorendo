import { useState, useEffect } from 'react';
import { GHRecord, DayStats, DutyRecord } from '../types';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { supabase } from '../lib/supabase';

const DB_KEY = '@gh-tracker:records';
const DUTY_KEY = '@gh-tracker:duties';

export function useDatabase() {
  const [records, setRecords] = useState<GHRecord[]>([]);
  const [duties, setDuties] = useState<DutyRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      // 1. Carrega do LocalStorage instantaneamente para experiência offline-first
      const saved = localStorage.getItem(DB_KEY);
      const savedDuties = localStorage.getItem(DUTY_KEY);
      
      if (saved) {
        try {
          setRecords(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse local DB", e);
        }
      }
      
      if (savedDuties) {
        try {
          setDuties(JSON.parse(savedDuties));
        } catch (e) {
          console.error("Failed to parse local Duties DB", e);
        }
      }
      
      setIsLoaded(true);

      // 2. Busca dados atualizados do Supabase em background e sincroniza
      try {
        const { data: dbRecords, error: recordsError } = await supabase
          .from('gh_records')
          .select('*')
          .order('date', { ascending: false })
          .order('time', { ascending: false });

        if (!recordsError && dbRecords) {
          const mappedRecords: GHRecord[] = dbRecords.map(r => ({
            id: r.id,
            date: r.date,
            time: r.time,
            doseIU: Number(r.dose_iu),
            site: r.site as any,
            protocol: r.protocol as any,
            notes: r.notes || undefined,
            createdAt: new Date(r.created_at).getTime(),
          }));
          setRecords(mappedRecords);
          localStorage.setItem(DB_KEY, JSON.stringify(mappedRecords));
        }

        const { data: dbDuties, error: dutiesError } = await supabase
          .from('duty_records')
          .select('*')
          .order('created_at', { ascending: true });

        if (!dutiesError && dbDuties) {
          const mappedDuties: DutyRecord[] = dbDuties.map(d => ({
            id: d.id,
            date: d.date,
            title: d.title,
            completed: d.completed,
            createdAt: new Date(d.created_at).getTime(),
          }));
          setDuties(mappedDuties);
          localStorage.setItem(DUTY_KEY, JSON.stringify(mappedDuties));
        }
      } catch (e) {
        console.error("Failed to sync with Supabase", e);
      }
    }
    loadData();
  }, []);

  const saveRecord = async (record: Omit<GHRecord, 'id' | 'createdAt'>) => {
    const tempId = crypto.randomUUID();
    const tempRecord: GHRecord = {
      ...record,
      id: tempId,
      createdAt: Date.now(),
    };
    
    // Atualização Otimista da UI (Instantâneo)
    const updated = [tempRecord, ...records].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`).getTime();
      const dateB = new Date(`${b.date}T${b.time}`).getTime();
      return dateB - dateA;
    });
    setRecords(updated);
    localStorage.setItem(DB_KEY, JSON.stringify(updated));

    // Salva no Supabase em background
    try {
      const { data, error } = await supabase
        .from('gh_records')
        .insert({
          date: record.date,
          time: record.time,
          dose_iu: record.doseIU,
          site: record.site,
          protocol: record.protocol,
          notes: record.notes || null,
        })
        .select()
        .single();
        
      if (!error && data) {
        // Substitui o registro temporário pelo oficial do Supabase
        setRecords(prev => prev.map(r => r.id === tempId ? {
          id: data.id,
          date: data.date,
          time: data.time,
          doseIU: Number(data.dose_iu),
          site: data.site as any,
          protocol: data.protocol as any,
          notes: data.notes || undefined,
          createdAt: new Date(data.created_at).getTime(),
        } : r));
        
        // Salva na memória local atualizada
        setRecords(prev => {
          localStorage.setItem(DB_KEY, JSON.stringify(prev));
          return prev;
        });
      }
    } catch (e) {
      console.error("Failed to save record to Supabase", e);
    }
  };

  const deleteRecord = async (id: string) => {
    // Atualização Otimista
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    localStorage.setItem(DB_KEY, JSON.stringify(updated));

    // Deleta no Supabase
    try {
      await supabase
        .from('gh_records')
        .delete()
        .eq('id', id);
    } catch (e) {
      console.error("Failed to delete record from Supabase", e);
    }
  };

  const saveDuty = async (title: string, date: string) => {
    const tempId = crypto.randomUUID();
    const tempDuty: DutyRecord = {
      id: tempId,
      title,
      date,
      completed: false,
      createdAt: Date.now()
    };
    
    // Atualização Otimista
    const updated = [...duties, tempDuty];
    setDuties(updated);
    localStorage.setItem(DUTY_KEY, JSON.stringify(updated));

    // Salva no Supabase
    try {
      const { data, error } = await supabase
        .from('duty_records')
        .insert({
          title,
          date,
          completed: false,
        })
        .select()
        .single();

      if (!error && data) {
        setDuties(prev => prev.map(d => d.id === tempId ? {
          id: data.id,
          date: data.date,
          title: data.title,
          completed: data.completed,
          createdAt: new Date(data.created_at).getTime(),
        } : d));

        setDuties(prev => {
          localStorage.setItem(DUTY_KEY, JSON.stringify(prev));
          return prev;
        });
      }
    } catch (e) {
      console.error("Failed to save duty to Supabase", e);
    }
  };

  const deleteDuty = async (id: string) => {
    // Atualização Otimista
    const updated = duties.filter(d => d.id !== id);
    setDuties(updated);
    localStorage.setItem(DUTY_KEY, JSON.stringify(updated));

    // Deleta no Supabase
    try {
      await supabase
        .from('duty_records')
        .delete()
        .eq('id', id);
    } catch (e) {
      console.error("Failed to delete duty from Supabase", e);
    }
  };

  const toggleDuty = async (id: string) => {
    const item = duties.find(d => d.id === id);
    if (!item) return;

    const newCompleted = !item.completed;

    // Atualização Otimista
    const updated = duties.map(d => 
      d.id === id ? { ...d, completed: newCompleted } : d
    );
    setDuties(updated);
    localStorage.setItem(DUTY_KEY, JSON.stringify(updated));

    // Atualiza no Supabase
    try {
      await supabase
        .from('duty_records')
        .update({ completed: newCompleted })
        .eq('id', id);
    } catch (e) {
      console.error("Failed to toggle duty in Supabase", e);
    }
  };

  const getWeeklyStats = (): DayStats[] => {
    const today = new Date();
    const last7Days = eachDayOfInterval({
      start: subDays(today, 6),
      end: today,
    });

    return last7Days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayRecords = records.filter(r => r.date === dateStr);
      const totalIU = dayRecords.reduce((sum, r) => sum + r.doseIU, 0);
      
      return {
        date: dateStr,
        totalIU,
        count: dayRecords.length
      };
    });
  };

  const getTotalWeeklyIU = () => {
    return getWeeklyStats().reduce((sum, day) => sum + day.totalIU, 0);
  };

  const getRecommendedSite = () => {
    if (records.length === 0) return 'Abdômen Esq';
    const sites = [
      'Abdômen Esq', 'Abdômen Dir', 
      'Coxa Esq', 'Coxa Dir', 
      'Glúteo Esq', 'Glúteo Dir', 
      'Ombro Esq', 'Ombro Dir'
    ];
    const lastSite = records[0].site;
    const lastIdx = sites.indexOf(lastSite);
    return sites[(lastIdx + 1) % sites.length];
  };

  const clearAllData = async () => {
    setRecords([]);
    setDuties([]);
    localStorage.removeItem(DB_KEY);
    localStorage.removeItem(DUTY_KEY);
    localStorage.removeItem('gh-profile-pic');

    // Deleta tudo no Supabase
    try {
      await supabase.from('gh_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('duty_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('app_settings').delete().neq('key', 'empty_key');
    } catch (e) {
      console.error("Failed to clear Supabase data", e);
    }
  };

  return {
    records,
    duties,
    isLoaded,
    saveRecord,
    deleteRecord,
    saveDuty,
    deleteDuty,
    toggleDuty,
    getWeeklyStats,
    getTotalWeeklyIU,
    getRecommendedSite,
    clearAllData
  };
}
