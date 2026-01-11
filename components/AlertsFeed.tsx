
import React from 'react';
import AppIcon from './AppIcon';
import { Alert } from '../types';

interface AlertsFeedProps {
  alerts: Alert[];
}

const AlertsFeed: React.FC<AlertsFeedProps> = ({ alerts }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'delayed': return { name: 'Clock' as const, color: 'text-amber-500 bg-amber-50' };
      case 'anomaly': return { name: 'AlertTriangle' as const, color: 'text-rose-500 bg-rose-50' };
      case 'completed': return { name: 'CheckCircle' as const, color: 'text-emerald-500 bg-emerald-50' };
      default: return { name: 'Bell' as const, color: 'text-blue-500 bg-blue-50' };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
       <div className="p-4 border-b border-slate-100 flex items-center justify-between">
         <h3 className="text-sm font-semibold text-slate-900">Actividad Reciente</h3>
         <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase">Alertas</span>
       </div>
       <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
         {alerts.length === 0 ? (
           <div className="p-8 text-center">
             <AppIcon name="ShieldCheck" size={32} className="mx-auto text-slate-200 mb-2" />
             <p className="text-xs text-slate-400">Sin alertas pendientes</p>
           </div>
         ) : (
           alerts.map((alert) => {
             const style = getIcon(alert.type);
             return (
               <div key={alert.id} className="p-4 hover:bg-slate-50 transition-colors">
                 <div className="flex gap-3">
                   <div className={`p-2 rounded-lg shrink-0 h-fit ${style.color}`}>
                     <AppIcon name={style.name} size={16} />
                   </div>
                   <div className="min-w-0">
                     <p className="text-sm font-bold text-slate-900 leading-tight">{alert.title}</p>
                     <p className="text-xs text-slate-500 mt-1 line-clamp-2">{alert.message}</p>
                     <div className="flex items-center gap-2 mt-2">
                       <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                         <AppIcon name="MapPin" size={10} /> {alert.location}
                       </span>
                       <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                         <AppIcon name="Clock" size={10} /> 
                         {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                     </div>
                   </div>
                 </div>
               </div>
             );
           })
         )}
       </div>
       <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <button className="text-[10px] font-bold text-slate-500 hover:text-blue-600 uppercase tracking-widest">Ver Todo el Historial</button>
       </div>
    </div>
  );
};

export default AlertsFeed;
