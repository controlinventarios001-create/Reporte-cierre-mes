import React, { useMemo } from 'react';
import { Location } from '../types'; // Asegúrate que la ruta a types sea correcta
import AppIcon from './AppIcon';

interface Props {
  locations: Location[];
}

const AuxiliarMonitor: React.FC<Props> = ({ locations }) => {
  
  // Agrupar datos por auxiliar
  const stats = useMemo(() => {
    const groups: Record<string, { total: number; completed: number; locations: string[] }> = {};

    locations.forEach(loc => {
      // Si no tiene auxiliar asignado, lo ponemos en "Sin Asignar"
      const name = loc.auxiliar && loc.auxiliar !== 'SIN AUXILIAR EN EL MOMENTO' 
        ? loc.auxiliar 
        : 'SIN ASIGNAR';

      if (!groups[name]) {
        groups[name] = { total: 0, completed: 0, locations: [] };
      }

      // Contamos actividades (10 por sede)
      const activities = Object.values(loc.activities);
      groups[name].total += activities.length;
      groups[name].completed += activities.filter(Boolean).length;
      groups[name].locations.push(loc.name);
    });

    return Object.entries(groups).sort((a, b) => {
      // Ordenar por porcentaje de menor a mayor (para ver quién va atrasado)
      const pctA = a[1].completed / a[1].total;
      const pctB = b[1].completed / b[1].total;
      return pctA - pctB;
    });
  }, [locations]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {stats.map(([name, data]) => {
        const percentage = Math.round((data.completed / data.total) * 100);
        
        // Color según desempeño
        let colorClass = "bg-red-500";
        if (percentage >= 50) colorClass = "bg-yellow-500";
        if (percentage >= 80) colorClass = "bg-green-500";
        if (percentage === 100) colorClass = "bg-blue-600";

        return (
          <div key={name} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-700 text-sm">{name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                  {data.locations.length} {data.locations.length === 1 ? 'Sede' : 'Sedes'} a cargo
                </p>
              </div>
              <div className={`text-white text-xs font-black px-2 py-1 rounded-lg ${colorClass}`}>
                {percentage}%
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
              <div 
                className={`h-full ${colorClass} transition-all duration-1000`} 
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="text-[10px] text-slate-400 flex flex-wrap gap-1">
               {data.locations.map(locName => (
                 <span key={locName} className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-slate-500">
                   {locName.replace('CARIBE - ', '')}
                 </span>
               ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AuxiliarMonitor;