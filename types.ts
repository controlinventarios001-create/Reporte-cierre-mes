
export interface ActivityState {
  "revision_bod_transito": boolean;
  "consumos_internos": boolean;
  "consumos_clientes": boolean;
  "averias_donaciones": boolean;
  "talleres_reclasificaciones": boolean;
  "ajustes_inventarios": boolean;
  "saldo_costo_mcia_no_cod": boolean;
  "motivos": boolean;
  "acumulacion_inferior_500": boolean;
  "ajuste_al_costo": boolean;
}

export interface Location {
  id: string;
  name: string;
  auxiliar: string;
  group: 'VALLE' | 'CAUCA' | 'ANTIOQUIA';
  activities: ActivityState;
  observation: string;
}

export interface Alert {
  id: string;
  type: 'delayed' | 'anomaly' | 'completed';
  title: string;
  message: string;
  location: string;
  timestamp: Date;
}

export interface Filters {
  month: string;
  year: string;
  locationGroup: string;
  search: string;
}

export type ActivityKey = keyof ActivityState;
