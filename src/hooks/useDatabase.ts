import { useState, useEffect } from 'react';
import { GHRecord, DayStats, DutyRecord } from '../types';
import { format, parseISO, startOfWeek, subDays, eachDayOfInterval } from 'date-fns';

const DB_KEY = '@gh-tracker:records';
const DUTY_KEY = '@gh-tracker:duties';

export function useDatabase() {
  const [records, setRecords] = useState<GHRecord[]>([]);
  const [duties, setDuties] = useState<DutyRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(DB_KEY);
    const savedDuties = localStorage.getItem(DUTY_KEY);
    
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse DB", e);
      }
    }
    
    if (savedDuties) {
      try {
        setDuties(JSON.parse(savedDuties));
      } catch (e) {
        console.error("Failed to parse Duties DB", e);
      }
    }
    
    setIsLoaded(true);
  }, []);

  const saveRecord = (record: Omit<GHRecord, 'id' | 'createdAt'>) => {
    const newRecord: GHRecord = {
      ...record,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    
    const updated = [newRecord, ...records].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`).getTime();
      const dateB = new Date(`${b.date}T${b.time}`).getTime();
      return dateB - dateA;
    });
    
    setRecords(updated);
    localStorage.setItem(DB_KEY, JSON.stringify(updated));
  };

  const deleteRecord = (id: string) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    localStorage.setItem(DB_KEY, JSON.stringify(updated));
  };

  const saveDuty = (title: string, date: string) => {
    const newDuty: DutyRecord = {
      id: crypto.randomUUID(),
      title,
      date,
      completed: false,
      createdAt: Date.now()
    };
    
    const updated = [...duties, newDuty];
    setDuties(updated);
    localStorage.setItem(DUTY_KEY, JSON.stringify(updated));
  };

  const deleteDuty = (id: string) => {
    const updated = duties.filter(d => d.id !== id);
    setDuties(updated);
    localStorage.setItem(DUTY_KEY, JSON.stringify(updated));
  };

  const toggleDuty = (id: string) => {
    const updated = duties.map(d => 
      d.id === id ? { ...d, completed: !d.completed } : d
    );
    setDuties(updated);
    localStorage.setItem(DUTY_KEY, JSON.stringify(updated));
  };

  // Helper to get stats for the last 7 days
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
    // Logic to recommend next site (simple round-robin based on last used)
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
    getRecommendedSite
  };
}
