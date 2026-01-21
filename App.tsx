
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import AppIcon from './components/AppIcon';
import KPICard from './components/KPICard';
import LocationProgressRow from './components/LocationProgressRow';
import GlobalControls from './components/GlobalControls';
import AuxiliarMonitor from './components/AuxiliarMonitor';
import { Location, Filters, ActivityKey } from './types';
import { ACTIVITY_MAP } from './constants';

// Credenciales fijas para asegurar funcionalidad inmediata
const SUPABASE_URL = "https://vnidipgbrasjlizdghew.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuaWRpcGdicmFzamxpemRnaGV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNjQ4ODIsImV4cCI6MjA4Mzc0MDg4Mn0.O5URn2b6-ys04Mo-lGfJCcQ1U_EU4_nzdin8MV-YTWI";

const App = () => {
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeTab, setActiveTab] = useState<'matrix' | 'auxiliaries'>('matrix');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [dbStatus, setDbStatus] = useState({ connected: false, message: 'Iniciando...' });
  
  const lastUpdateRef = useRef<number>(0);
  const supabase = useMemo(() => createClient(SUPABASE_URL, SUPABASE_KEY), []);

  const [filters, setFilters] = useState<Filters>(() => {
    const now = new Date();
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return {
      month: months[now.getMonth()],
      year: now.getFullYear().toString(),
      locationGroup: 'all',
      search: ''
    };
  });

  const generateDefaultLocations = useCallback(() => {
    return [
      { name: '001 CARIBE - PRINCIPAL', auxiliar: 'DIEGO FERNANDO QUINTERO GALLEGO', group: 'VALLE' },
      { name: '003 CARIBE - CENTRO', auxiliar: 'ERICK DENILSON VILLA FERNANDEZ', group: 'VALLE' },
      { name: '004 CARIBE - MAS CARNES', auxiliar: 'SIN AUXILIAR EN EL MOMENTO', group: 'CAUCA' },
      { name: '005 CARIBE - PUERTO TEJADA', auxiliar: 'GUSTAVO DIAZ VALDEZ', group: 'CAUCA' },
      { name: '009 CARIBE - PANAMERICANA', auxiliar: 'JULIAN ANDRES VELEZ CUAICAL', group: 'VALLE' },
      { name: '010 CARIBE - BUGA', auxiliar: 'DAVID MUELAS EDINSON', group: 'VALLE' },
      { name: '013 CARIBE - EL RETIRO', auxiliar: 'MARIA JOSE ROLDAN RENDON', group: 'ANTIOQUIA' },
      { name: '014 CARIBE - MARINILLA', auxiliar: 'STEVEN CASTRO GOMEZ', group: 'ANTIOQUIA' },
      { name: '018 CARIBE - VILLARICA', auxiliar: 'CESAR ANDRES REYES RENGIFO', group: 'CAUCA' },
      { name: '019 CARIBE - EL ROSARIO', auxiliar: 'KEVIN ANDRES VIDAL ZAMORANO', group: 'VALLE' },
      { name: '021 CARIBE - TERRANOVA', auxiliar: 'CARLOS ANDRES VALENCIA SALAZAR', group: 'VALLE' },
      { name: '022 CARIBE - FARALLONES', auxiliar: 'VICTOR EDUARDO GUZMAN DEL CAMPO', group: 'VALLE' },
      { name: '024 CARIBE - EL DORADO', auxiliar: 'DEYNER PAZ TALAGA', group: 'VALLE' },
      { name: '027 CARIBE - SURTO MAYORISTA', auxiliar: 'YONY FERNANDO TOBAR', group: 'VALLE' },
      { name: '029 CARIBE - BUGA MAYORISTA', auxiliar: 'SIN AUXILIAR EN EL MOMENTO', group: 'VALLE' },
      { name: '030 CARIBE - PUERTO MAYORISTA', auxiliar: 'SIN AUXILIAR EN EL MOMENTO', group: 'CAUCA' }
    ].map(item => ({
      id: item.name.split(' ')[0], 
      name: item.name,
      auxiliar: item.auxiliar,
      group: item.group as any,
      activities: {
        "revision_bod_transito": false, "consumos_internos": false, "consumos_clientes": false,
        "averias_donaciones": false, "talleres_reclasificaciones": false, "ajustes_inventarios": false,
        "saldo_costo_mcia_no_cod": false, "motivos": false, "acumulacion_inferior_500": false,
        "ajuste_al_costo": false
      },
      observation: ''
    }));
  }, []);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setSyncStatus('syncing');
    
    try {
      const { data, error } = await supabase
        .from('inventarios')
        .select('*')
        .eq('month', filters.month)
        .eq('year', filters.year);

      if (error) throw error;

      const baseLocations = generateDefaultLocations();
      const updatedLocations = baseLocations.map(loc => {
        const dbRow = data?.find(d => d.location_id === loc.id);
        if (dbRow) {
          return {
            ...loc,
            activities: { ...loc.activities, ...dbRow.activities },
            observation: dbRow.observation || '',
            auxiliar: dbRow.auxiliar || loc.auxiliar
          };
        }
        return loc;
      });

      setLocations(updatedLocations);
      setSyncStatus('success');
      setDbStatus({ connected: true, message: 'Sincronizado' });
    } catch (e) {
      console.error("Error loading:", e);
      setSyncStatus('error');
      setDbStatus({ connected: false, message: 'Offline / Error' });
      if (!isSilent) setLocations(generateDefaultLocations());
    } finally {
      setLoading(false);
    }
  }, [filters.month, filters.year, generateDefaultLocations, supabase]);

  // Suscripción Real-Time Optimizada
  useEffect(() => {
    const channel = supabase
      .channel('table-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventarios' }, (payload) => {
          // Solo actualizar si el cambio es para el periodo actual
          const record = payload.new as any;
          if (record && record.month === filters.month && record.year === filters.year) {
            // Evitar recarga si el cambio fue originado por nosotros hace menos de 2 segs
            if (Date.now() - lastUpdateRef.current > 2000) {
              setLocations(prev => prev.map(loc => 
                loc.id === record.location_id 
                ? { ...loc, activities: record.activities, observation: record.observation, auxiliar: record.auxiliar }
                : loc
              ));
            }
          }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setDbStatus(s => ({ ...s, connected: true }));
      });

    return () => { supabase.removeChannel(channel); };
  }, [supabase, filters.month, filters.year]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpdate = async (locationId: string, updates: Partial<Location>) => {
    const locToUpdate = locations.find(l => l.id === locationId);
    if (!locToUpdate) return;

    const nextState = { ...locToUpdate, ...updates };
    
    // Optimistic Update
    setLocations(prev => prev.map(l => l.id === locationId ? nextState : l));
    lastUpdateRef.current = Date.now();
    setSyncStatus('syncing');

    try {
      const { error } = await supabase.from('inventarios').upsert({
        id: `${filters.month}-${filters.year}-${locationId}`,
        month: filters.month,
        year: filters.year,
        location_id: locationId,
        activities: nextState.activities,
        observation: nextState.observation,
        auxiliar: nextState.auxiliar,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      
      if (error) throw error;
      setSyncStatus('success');
    } catch (e) {
      setSyncStatus('error');
      console.error("Sync error:", e);
    }
  };

  const handleExport = () => {
    const headers = ['Sede', 'Auxiliar', ...ACTIVITY_MAP.map(a => a.label), 'Observaciones'];
    const rows = locations.map(loc => [
      loc.name,
      loc.auxiliar,
      ...ACTIVITY_MAP.map(a => loc.activities[a.key] ? 'SI' : 'NO'),
      loc.observation
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Reporte_Cierre_${filters.month}_${filters.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = async () => {
    if (!window.confirm("¿BORRAR TODO EL PROGRESO DEL MES SELECCIONADO?")) return;
    
    try {
      const { error } = await supabase
        .from('inventarios')
        .delete()
        .eq('month', filters.month)
        .eq('year', filters.year);
      
      if (error) throw error;
      loadData();
    } catch (e) {
      alert("Error al resetear datos.");
    }
  };

  const kpis = useMemo(() => {
    const totalPossible = locations.length * ACTIVITY_MAP.length;
    const current = locations.reduce((acc, loc) => acc + Object.values(loc.activities).filter(Boolean).length, 0);
    const completedSedes = locations.filter(loc => Object.values(loc.activities).every(Boolean)).length;
    return {
      progress: totalPossible ? Math.round((current / totalPossible) * 100) : 0,
      completed: completedSedes,
      alerts: locations.filter(l => l.observation).length,
      pending: locations.length - completedSedes
    };
  }, [locations]);

  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      const matchGroup = filters.locationGroup === 'all' || loc.group === filters.locationGroup;
      const matchSearch = loc.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                          loc.auxiliar.toLowerCase().includes(filters.search.toLowerCase());
      return matchGroup && matchSearch;
    });
  }, [locations, filters]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-inter">
      <header className="bg-[#0f172a] text-white shadow-2xl sticky top-0 z-[100] border-b border-white/5">
        <div className="container mx-auto px-4 lg:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
              <AppIcon name="LayoutGrid" size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-lg lg:text-xl tracking-tighter uppercase leading-none">CARIBE SUPERMERCADOS SAS</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <div className={`h-2 w-2 rounded-full ${dbStatus.connected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500 animate-pulse'}`} />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {syncStatus === 'syncing' ? 'Guardando en la nube...' : dbStatus.message}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex flex-col items-end mr-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado Global</span>
                <span className="text-xs font-bold text-blue-400">{kpis.progress}% Completado</span>
             </div>
             <button onClick={() => loadData()} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors active:scale-90">
               <AppIcon name="RefreshCw" size={18} className={syncStatus === 'syncing' ? 'animate-spin text-blue-400' : 'text-slate-400'} />
             </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-6 py-6 flex-1 max-w-[1600px]">
        <GlobalControls 
          filters={filters} 
          onFilterChange={setFilters} 
          onExport={handleExport} 
          onRefresh={() => loadData()} 
          onReset={handleReset} 
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard title="Progreso" value={kpis.progress} subtitle="Cierre de Mes" status="info" icon="Target" loading={loading} />
          <KPICard title="Sedes OK" value={kpis.completed} subtitle="100% Finalizadas" status="success" icon="Verified" loading={loading} />
          <KPICard title="Alertas" value={kpis.alerts} subtitle="Novedades Reportadas" status="error" icon="AlertTriangle" loading={loading} />
          <KPICard title="Pendientes" value={kpis.pending} subtitle="Sedes por terminar" status="warning" icon="Clock" loading={loading} />
        </div>

        <div className="flex p-1 bg-slate-200 w-fit rounded-xl mb-6 shadow-inner">
           <button onClick={() => setActiveTab('matrix')} className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'matrix' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-700'}`}>Matriz de Control</button>
           <button onClick={() => setActiveTab('auxiliaries')} className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'auxiliaries' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-700'}`}>Monitor Auxiliares</button>
        </div>

        {activeTab === 'matrix' ? (
            <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden mb-12">
                <div className="overflow-x-auto no-scrollbar">
                    <div className="min-w-[1200px]">
                        <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-100 h-[180px]">
                            <div className="col-span-3 flex items-end px-8 pb-6 font-black text-[10px] uppercase text-slate-400 tracking-widest">Sede / Auxiliar Responsable</div>
                            <div className="col-span-6 grid grid-cols-10 h-full border-l border-slate-100">
                                {ACTIVITY_MAP.map(a => (
                                    <div key={a.key} className="relative flex justify-center border-r border-slate-50 last:border-r-0">
                                        <div className="rotated-header-container"><span className="rotated-text">{a.label}</span></div>
                                    </div>
                                ))}
                            </div>
                            <div className="col-span-2 flex items-end justify-center pb-6 border-l border-slate-100 font-black text-[10px] uppercase text-slate-400 tracking-widest">Avance</div>
                            <div className="col-span-1 flex items-end justify-end pr-8 pb-6 border-l border-slate-100 font-black text-[10px] uppercase text-slate-400 tracking-widest">Obs</div>
                        </div>
                        <div className="divide-y divide-slate-100 min-h-[400px]">
                            {loading ? (
                              <div className="flex flex-col items-center justify-center py-32 gap-4">
                                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Conectando con la base de datos...</span>
                              </div>
                            ) : filteredLocations.length === 0 ? (
                              <div className="py-32 text-center text-slate-400 font-black uppercase text-[12px]">No se encontraron sedes</div>
                            ) : (
                              filteredLocations.map(loc => (
                                <LocationProgressRow 
                                    key={loc.id} 
                                    location={loc} 
                                    onActivityToggle={(id, actId, val) => {
                                      const updatedActivities = { ...loc.activities, [actId]: val };
                                      handleUpdate(id, { activities: updatedActivities });
                                    }}
                                    onObservationUpdate={(id, obs) => handleUpdate(id, { observation: obs })}
                                    onAuxiliarUpdate={(id, aux) => handleUpdate(id, { auxiliar: aux })}
                                />
                              ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        ) : <AuxiliarMonitor locations={locations} />}
      </main>
      <footer className="bg-white border-t border-slate-200 py-12 text-center">
        <div className="flex flex-col items-center gap-2">
           <span className="text-[10px] font-black text-slate-300 tracking-[0.5em] uppercase">CARIBE SUPERMERCADOS SAS • CONTROL DE INVENTARIOS</span>
           <span className="text-[8px] font-bold text-slate-200 uppercase">Creado por Julio Giraldo v2.0</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
