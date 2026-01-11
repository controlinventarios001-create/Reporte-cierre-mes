
import React from 'react';
import AppIcon from './AppIcon';
import * as LucideIcons from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle: string;
  status: 'success' | 'warning' | 'error' | 'info';
  icon: keyof typeof LucideIcons;
  loading?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, status, icon, loading }) => {
  const statusColors = {
    success: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-100',
        text: 'text-emerald-600',
        iconBg: 'bg-emerald-100/50'
    },
    warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-100',
        text: 'text-amber-600',
        iconBg: 'bg-amber-100/50'
    },
    error: {
        bg: 'bg-rose-50',
        border: 'border-rose-100',
        text: 'text-rose-600',
        iconBg: 'bg-rose-100/50'
    },
    info: {
        bg: 'bg-blue-50',
        border: 'border-blue-100',
        text: 'text-blue-600',
        iconBg: 'bg-blue-100/50'
    },
  };

  const style = statusColors[status];

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm animate-pulse">
        <div className="h-4 w-24 bg-slate-200 rounded mb-6"></div>
        <div className="h-10 w-20 bg-slate-200 rounded mb-2"></div>
        <div className="h-3 w-32 bg-slate-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/5 hover:shadow-2xl hover:shadow-slate-300/50 transition-all duration-300 group">
      <div className="flex flex-col h-full">
        <div className={`p-3 rounded-xl w-fit mb-6 transition-all duration-500 group-hover:scale-110 ${style.iconBg} ${style.text}`}>
          <AppIcon name={icon} size={28} />
        </div>
        
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">{title}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tighter">
              {typeof value === 'number' && title.includes('Progreso') ? `${value}%` : value}
            </span>
          </div>
          <p className="text-[11px] font-bold text-slate-400 mt-2 flex items-center gap-1.5 opacity-60">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
};

export default KPICard;
