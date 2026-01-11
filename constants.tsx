
import { ActivityKey } from './types';

export const ACTIVITY_MAP: { key: ActivityKey; label: string; short: string; color: string }[] = [
  { key: "revision_bod_transito", label: "Revisión bod-transito", short: "RBT", color: "bg-orange-500" },
  { key: "consumos_internos", label: "Consumos internos", short: "CI", color: "bg-orange-500" },
  { key: "consumos_clientes", label: "Consumos clientes", short: "CC", color: "bg-orange-500" },
  { key: "averias_donaciones", label: "Averías/Donaciones", short: "A/D", color: "bg-orange-500" },
  { key: "talleres_reclasificaciones", label: "Talleres/Reclasificaciones", short: "T/R", color: "bg-orange-500" },
  { key: "ajustes_inventarios", label: "Ajustes de inventarios", short: "AI", color: "bg-orange-500" },
  { key: "saldo_costo_mcia_no_cod", label: "Saldo al costo/Mcia no cod", short: "SCM", color: "bg-orange-500" },
  { key: "motivos", label: "Motivos", short: "MOT", color: "bg-orange-500" },
  { key: "acumulacion_inferior_500", label: "Acumulación inferior a $500mil", short: "A500", color: "bg-yellow-400" },
  { key: "ajuste_al_costo", label: "Ajuste al costo", short: "AC", color: "bg-slate-200" },
];

export const MONTH_OPTIONS = [
  { value: 'enero', label: 'Enero' },
  { value: 'febrero', label: 'Febrero' },
  { value: 'marzo', label: 'Marzo' },
  { value: 'abril', label: 'Abril' },
  { value: 'mayo', label: 'Mayo' },
  { value: 'junio', label: 'Junio' },
  { value: 'julio', label: 'Julio' },
  { value: 'agosto', label: 'Agosto' },
  { value: 'septiembre', label: 'Septiembre' },
  { value: 'octubre', label: 'Octubre' },
  { value: 'noviembre', label: 'Noviembre' },
  { value: 'diciembre', label: 'Diciembre' },
];

// Generar años desde 2024 hasta 2099
export const YEAR_OPTIONS = Array.from({ length: 2099 - 2024 + 1 }, (_, i) => {
  const year = (2024 + i).toString();
  return { value: year, label: year };
});

export const LOCATION_GROUPS = [
  { value: 'all', label: 'Todas las Regiones' },
  { value: 'VALLE', label: 'Grupo Valle' },
  { value: 'CAUCA', label: 'Grupo Cauca' },
  { value: 'ANTIOQUIA', label: 'Grupo Antioquia' },
];
