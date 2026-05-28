export type InjectionSite = 
  | 'Abdômen Esq' | 'Abdômen Dir' 
  | 'Coxa Esq' | 'Coxa Dir' 
  | 'Glúteo Esq' | 'Glúteo Dir' 
  | 'Ombro Esq' | 'Ombro Dir';

export type ProtocolTiming = 'Jejum' | 'Pré-Treino' | 'Pós-Treino' | 'Antes de Dormir';

export interface GHRecord {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  doseIU: number;
  site: InjectionSite;
  protocol: ProtocolTiming;
  notes?: string;
  createdAt: number;
}

export interface DutyRecord {
  id: string;
  date: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

export interface DayStats {
  date: string;
  totalIU: number;
  count: number;
}

