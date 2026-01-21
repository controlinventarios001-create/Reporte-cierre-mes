
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import AppIcon from './components/AppIcon';
import KPICard from './components/KPICard';
import LocationProgressRow from './components/LocationProgressRow';
import GlobalControls from './components/GlobalControls';
import AuxiliarMonitor from './components/AuxiliarMonitor';
import { Location, Filters, ActivityKey } from './types';
import { ACTIVITY_MAP } from './constants';

/**
 * SISTEMA DE CONFIGURACIÓN DINÁMICO
 * Detecta llaves en el entorno o permite entrada manual persistente.
 */
const getAppConfig = () => {
  const env = (import.meta as any).env || {};
  const processEnv = (typeof process !== 'undefined' ? process.env : {}) as any;
  const saved = JSON.parse(localStorage.getItem('SIA_CARIBE_CONFIG') || '{}');

  const url = env.VITE_SUPABASE_URL || processEnv.VITE_SUPABASE_URL || saved.url || '';
  const key = env.VITE_SUPABASE_ANON_KEY || processEnv.VITE_SUPABASE_ANON_KEY || saved.key || '';

  return { url, key };
};

const App = () => {
  const [config, setConfig] = useState(getAppConfig());
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeTab, setActiveTab] = useState<'matrix' | 'auxiliaries'>('matrix');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [dbStatus, setDbStatus] = useState({ connected: false, message: 'Verificando...' });

  // Instancia de Supabase reactiva a cambios de config
  const supabase = useMemo(() => {
    if (!config.url || !config.key) return null;
    if (config.url.includes('supabase.com/dashboard')) return 'INVALID_URL';
    try {
      return createClient(config.url, config.key);
    } catch (e) {
      return null;
    }
  }, [config]);

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

  const loadData = useCallback(async () => {
    if (!supabase || typeof supabase === 'string') {
      setDbStatus({ connected: false, message: !config.url ? 'Sin configuración' : 'URL de API inválida' });
      setLocations(generateDefaultLocations());
      setLoading(false);
      return;
    }

    setLoading(true);
    setSyncStatus('syncing');
    
    try {
      const { data, error } = await (supabase as any)
        .from('inventarios')
        .select('*')
        .eq('month', filters.month)
        .eq('year', filters.year);

      if (error) throw error;

      let currentLocations = generateDefaultLocations();
      if (data && data.length > 0) {
        currentLocations = currentLocations.map(loc => {
          const dbLoc = data.find(d => d.location_id === loc.id);
          return dbLoc ? {
            ...loc,
            activities: { ...loc.activities, ...dbLoc.activities },
            observation: dbLoc.observation || '',
            auxiliar: dbLoc.auxiliar || loc.auxiliar
          } : loc;
        });
      }
      setLocations(currentLocations);
      setSyncStatus('success');
      setDbStatus({ connected: true, message: 'Base de Datos Conectada' });
    } catch (e: any) {
      setSyncStatus('error');
      setDbStatus({ connected: false, message: 'Error de Tabla/Acceso' });
      setLocations(generateDefaultLocations());
    } finally {
      setLoading(false);
    }
  }, [filters.month, filters.year, generateDefaultLocations, supabase, config.url]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpdate = async (locationId: string, updates: Partial<Location>) => {
    const locToUpdate = locations.find(l => l.id === locationId);
    if (!locToUpdate) return;

    const nextLocState = { ...locToUpdate, ...updates };
    setLocations(prev => prev.map(loc => loc.id === locationId ? nextLocState : loc));

    if (!supabase || typeof supabase === 'string' || !dbStatus.connected) return;

    setSyncStatus('syncing');
    try {
      const { error } = await (supabase as any).from('inventarios').upsert({
        id: `${filters.month}-${filters.year}-${locationId}`,
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
    }
  };

  const saveManualConfig = (url: string, key: string) => {
    const newConfig = { url, key };
    localStorage.setItem('SIA_CARIBE_CONFIG', JSON.stringify(newConfig));
    setConfig(newConfig);
    setShowConfigModal(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-[#0f172a] text-white shadow-2xl sticky top-0 z-[100] border-b border-white/5">
        <div className="container mx-auto px-4 lg:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-xl">
              <AppIcon name="LayoutGrid" size={26} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-lg lg:text-2xl tracking-tighter uppercase">CARIBE SAS</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className={`h-2.5 w-2.5 rounded-full ${dbStatus.connected ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{dbStatus.message}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!dbStatus.connected && (
              <button 
                onClick={() => setShowConfigModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-[10px] font-black uppercase rounded-lg transition-all shadow-lg shadow-blue-500/20"
              >
                Configurar
              </button>
            )}
            <button onClick={loadData} className="p-3 bg-white/5 hover:bg-white/10 rounded-full">
              <AppIcon name="RefreshCw" size={20} className={syncStatus === 'syncing' ? 'animate-spin text-blue-400' : 'text-slate-400'} />
            </button>
          </div>
        </div>
      </header>

      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Configuración de Base de Datos</h2>
            <p className="text-xs text-slate-500 mb-6 font-medium">Ingrese las credenciales de Supabase. Se guardarán localmente para esta sesión.</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const target = e.target as any;
              saveManualConfig(target.url.value, target.key.value);
            }} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">URL del Proyecto:</label>
                <input name="url" defaultValue={config.url} placeholder="https://xxx.supabase.co" className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500" required />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">API Anon Key:</label>
                <input name="key" defaultValue={config.key} placeholder="eyJhbGciOiJIUzI1..." className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500" required />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setShowConfigModal(false)} className="flex-1 px-6 py-3 bg-slate-100 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cerrar</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all">Guardar Todo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 lg:px-6 py-6 flex-1 max-w-[1500px]">
        <GlobalControls filters={filters} onFilterChange={setFilters} onExport={() => {}} onRefresh={loadData} onReset={() => {}} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard title="Progreso" value={loading ? '...' : 0} subtitle="Avance Global" status="info" icon="Target" loading={loading} />
          <KPICard title="Completas" value={0} subtitle="Meta alcanzada" status="success" icon="Verified" loading={loading} />
          <KPICard title="Alertas" value={0} subtitle="Con observación" status="error" icon="StickyNote" loading={loading} />
          <KPICard title="Pendientes" value={locations.length} subtitle="Por gestionar" status="warning" icon="Clock8" loading={loading} />
        </div>

        <div className="flex p-1 bg-slate-200 w-fit rounded-xl mb-6">
           <button onClick={() => setActiveTab('matrix')} className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'matrix' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500'}`}>Matriz de Control</button>
           <button onClick={() => setActiveTab('auxiliaries')} className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'auxiliaries' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500'}`}>Monitor Auxiliares</button>
        </div>

        {activeTab === 'matrix' ? (
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden mb-12">
                <div className="overflow-x-auto no-scrollbar">
                    <div className="min-w-[1100px]">
                        <div className="grid grid-cols-12 bg-slate-50/50 border-b border-slate-100 h-[170px]">
                            <div className="col-span-3 flex items-end px-8 pb-4"><span className="font-black text-[11px] uppercase text-slate-400 tracking-widest">Sede</span></div>
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
                            {loading ? <div className="py-32 text-center text-slate-400 font-black uppercase text-[12px] animate-pulse">Cargando Sistema...</div> :
                            locations.map(loc => (
                                <LocationProgressRow 
                                    key={loc.id} 
                                    location={loc} 
                                    // Fix: handleUpdate type mismatch. onActivityToggle expects (string, ActivityKey, boolean).
                                    // We wrap it to pass the correct Partial<Location> updates object.
                                    onActivityToggle={(locationId, activityId, checked) => {
                                      const locToUpdate = locations.find(l => l.id === locationId);
                                      if (locToUpdate) {
                                        handleUpdate(locationId, {
                                          activities: {
                                            ...locToUpdate.activities,
                                            [activityId]: checked
                                          }
                                        });
                                      }
                                    }}
                                    onObservationUpdate={(id, obs) => handleUpdate(id, { observation: obs })}
                                    onAuxiliarUpdate={(id, aux) => handleUpdate(id, { auxiliar: aux })}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        ) : <AuxiliarMonitor locations={locations} />}
      </main>
      <footer className="bg-white border-t border-slate-200 py-12 text-center text-[10px] font-black text-slate-300 tracking-[0.5em] uppercase">
        SISTEMA CARIBE SAS • 2024
      </footer>
    </div>
  );
};

export default App;
