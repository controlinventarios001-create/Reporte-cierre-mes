
import React from 'react';
import { Location } from '../types';
import { ACTIVITY_MAP } from '../constants';

interface ActivityHeatmapProps {
  data: Location[];
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-800 text-white p-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          Mapa de Calor de Actividades
        </h3>
        <span className="text-[10px] bg-slate-700 px-2 py-1 rounded text-slate-300">Vista Global</span>
      </div>
      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr>
                <th className="p-1 text-left text-slate-400 font-medium">Ubicación</th>
                {ACTIVITY_MAP.map(act => (
                  <th key={act.key} className="p-1 text-center text-slate-400 font-medium" title={act.label}>{act.short}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 8).map(loc => (
                <tr key={loc.id} className="border-t border-slate-50">
                  <td className="p-1 font-bold text-slate-700 truncate max-w-[80px]">{loc.name.split('-')[0]}</td>
                  {ACTIVITY_MAP.map(act => (
                    <td key={act.key} className="p-1 text-center">
                      <div className={`w-3 h-3 mx-auto rounded-sm transition-colors ${loc.activities[act.key] ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-slate-400 mt-4 text-center italic">Mostrando las primeras 8 sedes</p>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
