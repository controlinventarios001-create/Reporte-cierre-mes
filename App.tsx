
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AppIcon from './components/AppIcon';
import KPICard from './components/KPICard';
import LocationProgressRow from './components/LocationProgressRow';
import GlobalControls from './components/GlobalControls';
import AuxiliarMonitor from './components/AuxiliarMonitor';
import { Location, Filters } from './types';
import { ACTIVITY_MAP } from './constants';

// Las credenciales ahora se obtienen de variables de entorno
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

  // Initialize Supabase client
  const supabase = useMemo(() => {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      console.log("Supabase Client initialized with ENV vars.");
      return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    console.warn("Supabase credentials missing. Running in LOCAL MODE.");
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

  // REALTIME SUBSCRIPTION
  useEffect(() => {
    if (!supabase) return;

    // Suscribirse a cambios en la tabla 'inventarios'
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'inventarios',
          filter: `month=eq.${filters.month}` // Opcional: filtrar por mes para reducir tráfico
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newRow = payload.new as any;
            if (newRow.year === filters.year) {
              setLocations(prev => prev.map(loc => 
                loc.id === newRow.location_id 
                ? { 
                    ...loc, 
                    activities: newRow.activities, 
                    observation: newRow.observation, 
                    auxiliar: newRow.auxiliar 
                  } 
                : loc
              ));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, filters.month, filters.year]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setSyncStatus('syncing');
    
    const savedLocal = localStorage.getItem(currentKey);
    let currentLocations: Location[] = savedLocal ? JSON.parse(savedLocal) : generateDefaultLocations();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('inventarios')
          .select('*')
          .eq('month', filters.month)
          .eq('year', filters.year);

        if (error) throw error;

        if (data && data.length > 0) {
          const mergedLocations = currentLocations.map(loc => {
            const dbLoc = data.find(d => d.location_id === loc.id);
            if (dbLoc) {
              return {
                ...loc,
                activities: dbLoc.activities || loc.activities,
                observation: dbLoc.observation || '',
                auxiliar: dbLoc.auxiliar || loc.auxiliar
              };
            }
            return loc;
          });
          currentLocations = mergedLocations;
          setSyncStatus('success');
        } else {
          setSyncStatus('idle');
        }
      } catch (e) {
        console.error("Supabase Load Error:", e);
        setSyncStatus('error');
      }
    }
    
    setLocations(currentLocations);
    setLoading(false);
  }, [currentKey, generateDefaultLocations, supabase, filters.month, filters.year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync state to handle remote update
  const handleUpdate = async (locationId: string, updates: Partial<Location>) => {
    const locToUpdate = locations.find(l => l.id === locationId);
    if (!locToUpdate) return;

    // Apply updates locally first (Optimistic UI)
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
      } catch (e) {
        console.error("Supabase Upsert Error:", e);
        setSyncStatus('error');
      }
    }
  };

  const handleResetAll = () => {
    if (window.confirm("¿Reiniciar datos locales? Esto NO borrará la base de datos central.")) {
        localStorage.removeItem(currentKey);
        setLocations(generateDefaultLocations());
    }
  };

  const handleExportExcel = () => {
    const headers = ["Sede", "Auxiliar", "Region", ...ACTIVITY_MAP.map(a => a.label), "Observacion"];
    const rows = locations.map(loc => [
      loc.name, 
      loc.auxiliar, 
      loc.group,
      ...ACTIVITY_MAP.map(a => loc.activities[a.key] ? "SI" : "NO"),
      loc.observation.replace(/,/g, ';').replace(/\n/g, ' ') 
    ]);
    
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `SIA_CARIBE_${filters.month.toUpperCase()}_${filters.year}.csv`;
    link.click();
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
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">SIA • Gestión</p>
                <div className={`h-1.5 w-1.5 rounded-full ${syncStatus === 'success' ? 'bg-emerald-500' : syncStatus === 'error' ? 'bg-rose-500' : 'bg-slate-500 animate-pulse'}`} />
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
                  {syncStatus === 'success' ? 'En Línea' : syncStatus === 'syncing' ? 'Sincronizando...' : 'Modo Local'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={loadData} title="Forzar Refresco" className="p-2 text-slate-400 hover:text-white transition-colors">
                <AppIcon name="RefreshCw" size={18} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
             </button>
             <div className="hidden sm:block text-right">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Periodo</p>
                <p className="text-[11px] font-bold text-slate-300 mt-1 uppercase">{filters.month} {filters.year}</p>
             </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-6 py-8 flex-1 max-w-[1500px]">
        <GlobalControls 
            filters={filters} onFilterChange={setFilters} 
            onExport={handleExportExcel} onRefresh={loadData} onReset={handleResetAll}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <KPICard title="Progreso Mes" value={kpis.totalCompletion} subtitle={`${filters.month.toUpperCase()} ${filters.year}`} status="info" icon="Target" loading={loading} />
          <KPICard title="Completas" value={kpis.completedSedes} subtitle="Sedes al 100%" status="success" icon="Verified" loading={loading} />
          <KPICard title="Pendientes" value={kpis.pendingSedes} subtitle="Sedes incompletas" status="warning" icon="Clock8" loading={loading} />
          <KPICard title="Reportes" value={kpis.totalAlerts} subtitle="Sedes con observación" status="error" icon="StickyNote" loading={loading} />
        </div>

        <div className="flex p-1.5 bg-slate-200 w-fit rounded-[1.2rem] mb-8 shadow-inner">
           <button onClick={() => setActiveTab('matrix')} className={`flex items-center gap-3 px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'matrix' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}>
                <AppIcon name="Table" size={16} /> Matriz
           </button>
           <button onClick={() => setActiveTab('auxiliaries')} className={`flex items-center gap-3 px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'auxiliaries' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}>
                <AppIcon name="Users" size={16} /> Auxiliares
           </button>
        </div>

        {activeTab === 'matrix' ? (
            <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-200 overflow-hidden mb-12">
                <div className="bg-blue-600 text-white px-8 py-5 flex items-center justify-between">
                    <h2 className="font-black text-sm uppercase tracking-widest">Actividades Mensuales</h2>
                    <span className="text-[10px] font-black uppercase bg-blue-700 px-3 py-1 rounded-full">{filters.month} {filters.year}</span>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                    <div className="min-w-[1200px]">
                        <div className="grid grid-cols-12 bg-white border-b border-slate-100 h-[180px]">
                            <div className="col-span-3 flex items-end px-8 pb-4">
                                <span className="font-black text-[11px] uppercase text-slate-400 tracking-[0.2em]">Sede</span>
                            </div>
                            <div className="col-span-6 grid grid-cols-10 h-full border-l border-slate-100">
                                {ACTIVITY_MAP.map(a => (
                                    <div key={a.key} className="relative flex justify-center border-r border-slate-50 last:border-r-0">
                                        <div className="rotated-header-container">
                                            <span className="rotated-text">{a.label}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="col-span-2 flex items-end justify-center pb-4 border-l border-slate-100">
                                <span className="font-black text-[11px] uppercase text-slate-400 tracking-[0.2em]">Avance</span>
                            </div>
                            <div className="col-span-1 flex items-end justify-end pr-8 pb-4 border-l border-slate-100">
                                <span className="font-black text-[11px] uppercase text-slate-400 tracking-[0.2em]">Obs</span>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {loading ? (
                                <div className="py-24 text-center">
                                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sincronizando con la nube...</p>
                                </div>
                            ) : filteredLocations.length === 0 ? (
                                <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-lg">No hay resultados</div>
                            ) : (
                                filteredLocations.map(loc => (
                                    <LocationProgressRow 
                                        key={loc.id} 
                                        location={loc} 
                                        onActivityToggle={(id, key, checked) => handleUpdate(id, { activities: { ...loc.activities, [key]: checked } })} 
                                        onObservationUpdate={(id, observation) => handleUpdate(id, { observation })}
                                        onAuxiliarUpdate={(id, auxiliar) => handleUpdate(id, { auxiliar })}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <AuxiliarMonitor locations={filteredLocations} />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-10 mt-auto">
        <div className="container mx-auto px-6 text-center">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">SIA CARIBE SAS • LOGÍSTICA</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
