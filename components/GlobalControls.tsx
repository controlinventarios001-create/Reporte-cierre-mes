
import React from 'react';
import AppIcon from './AppIcon';
import { Filters } from '../types';
import { MONTH_OPTIONS, YEAR_OPTIONS, LOCATION_GROUPS } from '../constants';

interface GlobalControlsProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onExport: () => void;
  onRefresh: () => void;
  onReset: () => void;
}

const GlobalControls: React.FC<GlobalControlsProps> = ({ filters, onFilterChange, onExport, onRefresh, onReset }) => {
  const handleResetClick = () => {
    if (window.confirm("¿ESTÁ SEGURO? Esta acción borrará todos los avances del mes y año seleccionados en este dispositivo.")) {
      onReset();
    }
  };

  return (
    <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 mb-8">
      {/* Buscador de Sede */}
      <div className="relative mb-8 group">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-blue-500 group-focus-within:text-blue-600">
          <AppIcon name="Search" size={24} strokeWidth={2.5} />
        </div>
        <input 
          type="text"
          placeholder="BUSCAR POR NOMBRE O CÓDIGO (EJ: 030, PRINCIPAL, DIEGO...)"
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-sm lg:text-base font-bold outline-none focus:border-blue-500 focus:bg-white focus:ring-8 focus:ring-blue-500/5 transition-all placeholder:text-slate-400 placeholder:font-bold uppercase tracking-tight"
        />
        {filters.search && (
          <button 
            onClick={() => onFilterChange({ ...filters, search: '' })}
            className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-400 hover:text-rose-500 transition-colors"
          >
            <AppIcon name="XCircle" size={24} />
          </button>
        )}
      </div>

      <div className="flex flex-col xl:flex-row items-end justify-between gap-6 border-t border-slate-50 pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full xl:w-auto">
          {/* Selector de Mes */}
          <div className="flex flex-col gap-2 min-w-[160px]">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Mes:</label>
            <div className="relative">
                <select 
                value={filters.month}
                onChange={(e) => onFilterChange({ ...filters, month: e.target.value })}
                className="w-full appearance-none bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 transition-all cursor-pointer"
                >
                {MONTH_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <AppIcon name="ChevronDown" size={14} />
                </div>
            </div>
          </div>

          {/* Selector de Año */}
          <div className="flex flex-col gap-2 min-w-[120px]">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Año:</label>
            <div className="relative">
                <select 
                value={filters.year}
                onChange={(e) => onFilterChange({ ...filters, year: e.target.value })}
                className="w-full appearance-none bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 transition-all cursor-pointer"
                >
                {YEAR_OPTIONS.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <AppIcon name="ChevronDown" size={14} />
                </div>
            </div>
          </div>

          {/* Selector de Grupo */}
          <div className="flex flex-col gap-2 min-w-[180px]">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Región:</label>
            <div className="relative">
                <select 
                value={filters.locationGroup}
                onChange={(e) => onFilterChange({ ...filters, locationGroup: e.target.value })}
                className="w-full appearance-none bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 transition-all cursor-pointer"
                >
                {LOCATION_GROUPS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <AppIcon name="ChevronDown" size={14} />
                </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <button 
            onClick={handleResetClick}
            title="Borrar todos los datos actuales"
            className="flex items-center justify-center gap-2 px-4 h-[48px] text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-rose-100 font-bold text-xs uppercase tracking-widest"
          >
            <AppIcon name="Trash2" size={18} />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>

          <button 
            onClick={onRefresh}
            className="flex items-center justify-center gap-2 px-4 h-[48px] text-slate-500 hover:bg-slate-100 rounded-xl transition-all border border-slate-200 font-bold text-xs uppercase tracking-widest"
          >
            <AppIcon name="RefreshCw" size={18} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          
          <button 
            onClick={onExport}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 h-[48px] text-xs font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95 uppercase tracking-widest"
          >
            <AppIcon name="Download" size={18} />
            Exportar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalControls;
