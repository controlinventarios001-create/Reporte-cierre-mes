
import React, { useState } from 'react';
import AppIcon from './AppIcon';
import { Location, ActivityKey } from '../types';
import { ACTIVITY_MAP } from '../constants';

interface LocationProgressRowProps {
  location: Location;
  onActivityToggle: (locationId: string, activityId: ActivityKey, checked: boolean) => void;
  onObservationUpdate: (locationId: string, observation: string) => void;
  onAuxiliarUpdate: (locationId: string, auxiliar: string) => void;
}

const LocationProgressRow: React.FC<LocationProgressRowProps> = ({ 
  location, 
  onActivityToggle, 
  onObservationUpdate,
  onAuxiliarUpdate
}) => {
  const [isEditingObs, setIsEditingObs] = useState(false);
  const [localObs, setLocalObs] = useState(location.observation);
  const [isEditingAux, setIsEditingAux] = useState(false);
  const [localAux, setLocalAux] = useState(location.auxiliar);

  const completedCount = Object.values(location.activities).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / ACTIVITY_MAP.length) * 100);

  const handleObsSubmit = () => {
    onObservationUpdate(location.id, localObs);
    setIsEditingObs(false);
  };

  const handleAuxSubmit = () => {
    onAuxiliarUpdate(location.id, localAux);
    setIsEditingAux(false);
  };

  const groupStyles = {
    VALLE: 'bg-blue-50 text-blue-600 border-blue-100',
    CAUCA: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    ANTIOQUIA: 'bg-purple-50 text-purple-600 border-purple-100'
  };

  return (
    <div className="group bg-white hover:bg-slate-50/50 transition-all duration-300">
      <div className="grid grid-cols-12 items-center min-h-[80px]">
        {/* Sede e Info */}
        <div className="col-span-3 p-4 lg:pl-6">
          <div className="flex items-center gap-2 mb-1.5">
             <h4 className="font-bold text-slate-800 text-[11px] lg:text-[12px] uppercase tracking-tight truncate" title={location.name}>
                {location.name}
             </h4>
             <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase shrink-0 ${groupStyles[location.group]}`}>
               {location.group}
             </span>
          </div>
          
          <div className="relative group/aux">
            {isEditingAux ? (
              <input 
                type="text" 
                value={localAux}
                onChange={(e) => setLocalAux(e.target.value)}
                className="text-[10px] w-full px-2 py-1 border-2 border-blue-500 rounded bg-white font-bold outline-none"
                autoFocus
                onBlur={handleAuxSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleAuxSubmit()}
              />
            ) : (
              <div 
                className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-blue-600 transition-colors"
                onClick={() => setIsEditingAux(true)}
              >
                <AppIcon name="User" size={10} />
                <span className="text-[10px] font-bold uppercase truncate max-w-[200px]">
                  {location.auxiliar}
                </span>
                <AppIcon name="Edit2" size={8} className="opacity-0 group-hover/aux:opacity-100" />
              </div>
            )}
          </div>
        </div>

        {/* Checkboxes verdes Estilo Imagen */}
        <div className="col-span-6">
          <div className="grid grid-cols-10 h-full">
            {ACTIVITY_MAP.map((act) => (
              <div key={act.key} className="flex justify-center border-l border-slate-100/50 py-4">
                <button
                  onClick={() => onActivityToggle(location.id, act.key, !location.activities[act.key])}
                  className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-300 ${
                    location.activities[act.key] 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                      : 'bg-slate-100 border border-slate-200 text-transparent hover:border-blue-300 hover:bg-slate-200'
                  }`}
                  title={act.label}
                >
                  <AppIcon name="Check" size={16} strokeWidth={4} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Progreso Vertical */}
        <div className="col-span-2 px-6 border-l border-slate-100 flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden mr-3 border border-slate-200/50">
                    <div 
                        className={`h-full transition-all duration-1000 ${
                            progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <span className={`text-[12px] font-black tracking-tight ${progressPercent === 100 ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {progressPercent}%
                </span>
            </div>
        </div>

        {/* Observaciones icon */}
        <div className="col-span-1 flex justify-end pr-6 border-l border-slate-100">
          <button 
            onClick={() => setIsEditingObs(!isEditingObs)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              location.observation 
                ? 'text-blue-600 bg-blue-50 shadow-inner' 
                : 'text-slate-300 hover:text-slate-600 hover:bg-slate-200'
            }`}
          >
            <AppIcon name={location.observation ? "MessageSquare" : "PlusSquare"} size={18} />
          </button>
        </div>
      </div>

      {/* Panel de Observación */}
      {isEditingObs && (
        <div className="p-6 bg-blue-50/50 border-t border-blue-100 animate-in slide-in-from-top duration-300">
          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                    <AppIcon name="FileText" size={14} />
                </div>
                <label className="text-xs font-black uppercase text-blue-900 tracking-wider">Notas de Auditoría e Inventarios</label>
            </div>
            <textarea 
              value={localObs}
              onChange={(e) => setLocalObs(e.target.value)}
              placeholder="Describa aquí novedades, hallazgos o justificaciones..."
              className="w-full text-sm font-medium p-4 rounded-2xl border-2 border-white focus:border-blue-500 outline-none min-h-[120px] bg-white shadow-xl shadow-blue-900/5 transition-all"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsEditingObs(false)} className="px-6 py-2 text-[11px] font-black uppercase text-slate-500 hover:bg-slate-200 rounded-xl transition-colors tracking-widest">Cancelar</button>
              <button onClick={handleObsSubmit} className="px-8 py-2 text-[11px] font-black uppercase bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all tracking-widest">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {location.observation && !isEditingObs && (
        <div className="px-6 py-2.5 bg-blue-50/20 border-t border-slate-100 flex items-center gap-3">
           <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-100/50 px-2 py-0.5 rounded tracking-tighter shrink-0">Nota</span>
           <p className="text-[11px] text-slate-500 font-medium italic truncate">
             "{location.observation}"
           </p>
        </div>
      )}
    </div>
  );
};

export default LocationProgressRow;
