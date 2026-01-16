
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import AppIcon from './components/AppIcon';
import KPICard from './components/KPICard';
import LocationProgressRow from './components/LocationProgressRow';
import GlobalControls from './components/GlobalControls';
import AuxiliarMonitor from './components/AuxiliarMonitor';
import { Location, Filters } from './types';
import { ACTIVITY_MAP } from './constants';

// Credenciales desde variables de entorno
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const INITIAL_LOCATIONS_DATA: { name: string; auxiliar: string; group: Location['group'] }[] = [
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
];

const App = () => {
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeTab, setActiveTab] = useState<'matrix' | 'auxiliaries'>('matrix');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [dbError, setDbError] = useState<string | null>(null);

  const supabase = useMemo(() => {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return null;
  }, []);

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

  const currentKey = useMemo(() => `caribe_data_${filters.month}_${filters.year}`, [filters.month, filters.year]);

  const generateDefaultLocations = useCallback(() => {
    return INITIAL_LOCATIONS_DATA.map((item) => ({
      id: `loc-${item.name.split(' ')[0]}`,
      name: item.name,
      auxiliar: item.auxiliar,
      group: item.group,
      activities: {
        "revision_bod_transito": false, "consumos_internos": false, "consumos_clientes": false,
        "averias_donaciones": false, "talleres_reclasificaciones": false, "ajustes_inventarios": false,
        "saldo_costo_mcia_no_cod": false, "motivos": false, "acumulacion_inferior_500": false,
        "ajuste_al_costo": false
      },
      observation: ''
    }));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setSyncStatus('syncing');
    setDbError(null);
    
    let currentLocations: Location[] = generateDefaultLocations();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('inventarios')
          .select('*')
          .eq('month', filters.month)
          .eq('year', filters.year);

        if (error) throw error;

        if (data && data.length > 0) {
          currentLocations = currentLocations.map(loc => {
            const dbLoc = data.find(d => d.location_id === loc.id);
            return dbLoc ? {
              ...loc,
              activities: dbLoc.activities || loc.activities,
              observation: dbLoc.observation || '',
              auxiliar: dbLoc.auxiliar || loc.auxiliar
            } : loc;
          });
          setSyncStatus('success');
        } else {
          setSyncStatus('idle');
        }
      } catch (e: any) {
        console.error("Error cargando:", e);
        setSyncStatus('error');
        setDbError(e.message || "No se pudo conectar con la base de datos");
      }
    }
    
    setLocations(currentLocations);
    setLoading(false);
  }, [filters.month, filters.year, generateDefaultLocations, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventarios' }, (payload) => {
        const newRow = payload.new as any;
        if (newRow && newRow.month === filters.month && newRow.year === filters.year) {
          setLocations(prev => prev.map(loc => 
            loc.id === newRow.location_id 
              ? { ...loc, activities: newRow.activities, observation: newRow.observation, auxiliar: newRow.auxiliar } 
              : loc
          ));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, filters.month, filters.year]);

  const handleUpdate = async (locationId: string, updates: Partial<Location>) => {
    const locToUpdate = locations.find(l => l.id === locationId);
    if (!locToUpdate) return;

    const nextLocState = { ...locToUpdate, ...updates };
    setLocations(prev => prev.map(loc => loc.id === locationId ? nextLocState : loc));

    if (supabase) {
      setSyncStatus('syncing');
      const compositeId = `${filters.month}-${filters.year}-${locationId}`;
      try {
        const { error } = await supabase
          .from('inventarios')
          .upsert({
            id: compositeId,
            month: filters.month,
            year: filters.year,
            location_id: locationId,
            activities: nextLocState.activities,
            observation: nextLocState.observation,
            auxiliar: nextLocState.auxiliar,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });

        if (error) throw error;
        setSyncStatus('success');
      } catch (e: any) {
        setSyncStatus('error');
        console.error("Error guardando:", e);
      }
    }
  };

  const filteredLocations = useMemo(() => {
    const term = filters.search.toLowerCase().trim();
    return locations.filter(loc => {
      const matchGroup = filters.locationGroup === 'all' || loc.group === filters.locationGroup;
      const matchSearch = loc.name.toLowerCase().includes(term) || loc.auxiliar.toLowerCase().includes(term);
      return matchGroup && (term === '' || matchSearch);
    });
  }, [locations, filters.locationGroup, filters.search]);

  const kpis = useMemo(() => {
    if (filteredLocations.length === 0) return { totalCompletion: 0, completedSedes: 0, pendingSedes: 0, totalAlerts: 0 };
    const totalPossible = filteredLocations.length * ACTIVITY_MAP.length;
    const actualCompleted = filteredLocations.reduce((acc, loc) => acc + Object.values(loc.activities).filter(Boolean).length, 0);
    const completedSedes = filteredLocations.filter(loc => Object.values(loc.activities).filter(Boolean).length === ACTIVITY_MAP.length).length;
    return { 
        totalCompletion: Math.round((actualCompleted / totalPossible) * 100),
        completedSedes,
        pendingSedes: filteredLocations.length - completedSedes,
        totalAlerts: filteredLocations.filter(loc => loc.observation.length > 0).length
    };
  }, [filteredLocations]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-[#111827] text-white shadow-xl sticky top-0 z-[100] border-b border-white/10">
        <div className="container mx-auto px-4 lg:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <AppIcon name="LayoutGrid" size={26} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl lg:text-2xl tracking-tighter leading-none uppercase">CARIBE SAS</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">GESTIÓN INVENTARIOS</p>
                <div className={`h-1.5 w-1.5 rounded-full ${syncStatus === 'success' ? 'bg-emerald-500' : syncStatus === 'error' ? 'bg-rose-500' : 'bg-slate-500 animate-pulse'}`} />
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
                  {syncStatus === 'success' ? 'Sincronizado' : syncStatus === 'syncing' ? 'Guardando...' : 'Sin Conexión'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={loadData} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
            <AppIcon name="RefreshCw" size={20} className={syncStatus === 'syncing' ? 'animate-spin text-blue-400' : 'text-slate-400'} />
          </button>
        </div>
      </header>

      {dbError && (
        <div className="bg-rose-500 text-white px-6 py-2 text-center text-[10px] font-bold uppercase tracking-widest">
          Error de base de datos: {dbError} - Revisa las políticas RLS en Supabase
        </div>
      )}

      <main className="container mx-auto px-4 lg:px-6 py-8 flex-1 max-w-[1500px]">
        <GlobalControls 
            filters={filters} onFilterChange={setFilters} 
            onExport={() => {}} onRefresh={loadData} onReset={() => setLocations(generateDefaultLocations())}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <KPICard title="Progreso" value={kpis.totalCompletion} subtitle="Total general" status="info" icon="Target" loading={loading} />
          <KPICard title="Completas" value={kpis.completedSedes} subtitle="Sedes listas" status="success" icon="Verified" loading={loading} />
          <KPICard title="Alertas" value={kpis.totalAlerts} subtitle="Con observación" status="error" icon="StickyNote" loading={loading} />
          <KPICard title="Pendientes" value={kpis.pendingSedes} subtitle="Por completar" status="warning" icon="Clock8" loading={loading} />
        </div>

        <div className="flex p-1.5 bg-slate-200 w-fit rounded-2xl mb-8">
           <button onClick={() => setActiveTab('matrix')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'matrix' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500'}`}>Matriz</button>
           <button onClick={() => setActiveTab('auxiliaries')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'auxiliaries' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500'}`}>Auxiliares</button>
        </div>

        {activeTab === 'matrix' ? (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mb-12">
                <div className="overflow-x-auto no-scrollbar">
                    <div className="min-w-[1200px]">
                        <div className="grid grid-cols-12 bg-white border-b border-slate-100 h-[180px]">
                            <div className="col-span-3 flex items-end px-8 pb-4">
                                <span className="font-black text-[11px] uppercase text-slate-400 tracking-widest">Sede</span>
                            </div>
                            <div className="col-span-6 grid grid-cols-10 h-full border-l border-slate-100">
                                {ACTIVITY_MAP.map(a => (
                                    <div key={a.key} className="relative flex justify-center border-r border-slate-50 last:border-r-0">
                                        <div className="rotated-header-container"><span className="rotated-text">{a.label}</span></div>
                                    </div>
                                ))}
                            </div>
                            <div className="col-span-2 flex items-end justify-center pb-4 border-l border-slate-100"><span className="font-black text-[11px] uppercase text-slate-400 tracking-widest">Avance</span></div>
                            <div className="col-span-1 flex items-end justify-end pr-8 pb-4 border-l border-slate-100"><span className="font-black text-[11px] uppercase text-slate-400 tracking-widest">Obs</span></div>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {loading ? (
                                <div className="py-24 text-center text-slate-400 font-bold uppercase text-[10px] animate-pulse">Cargando datos...</div>
                            ) : filteredLocations.map(loc => (
                                <LocationProgressRow 
                                    key={loc.id} 
                                    location={loc} 
                                    onActivityToggle={(id, key, checked) => handleUpdate(id, { activities: { ...loc.activities, [key]: checked } })} 
                                    onObservationUpdate={(id, observation) => handleUpdate(id, { observation })}
                                    onAuxiliarUpdate={(id, auxiliar) => handleUpdate(id, { auxiliar })}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <AuxiliarMonitor locations={filteredLocations} />
        )}
      </main>
      <footer className="bg-white border-t border-slate-200 py-10 text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CARIBE SAS • 2024</p></footer>
    </div>
  );
};

export default App;
