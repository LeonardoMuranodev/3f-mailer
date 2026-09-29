import { useEffect, useState } from 'react';
import { Send, Clock, CheckCircle2, Mail, RefreshCw, Download, Calendar, FilterX, BarChart3, Plus, AlertTriangle, X, HelpCircle, Info, Eye, MousePointerClick } from 'lucide-react';
import { obtenerEstadisticasGlobales, exportarEstadisticasCampanas } from '../services/api';
import type { GlobalStatsResult } from '../types/stats';
import { RUBROS_LABELS } from '../data/rubros';

export default function EstadisticasGenerales() {
  const [stats, setStats] = useState<GlobalStatsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(new Date());
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showHelp, setShowHelp] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await obtenerEstadisticasGlobales(startDate || undefined, endDate || undefined);
      if (res.success && res.data) {
        setStats(res.data);
        setLastSync(new Date());
      }
    } catch (e) {
      console.error('Error fetching global stats', e);
    } finally {
      setLoading(false);
    }
  };

  const [errorExport, setErrorExport] = useState<string | null>(null);

  const handleExportCsv = async () => {
    setErrorExport(null);
    try {
      const res = await exportarEstadisticasCampanas(startDate || undefined, endDate || undefined);
      if (!res.success || !res.data) {
        setErrorExport('Error al obtener datos para exportar');
        return;
      }
      
      const campanas = res.data;
      if (campanas.length === 0) {
        setErrorExport('No hay campañas para exportar en este periodo');
        return;
      }
      
      const header = ['Asunto', 'Estado', 'Fecha Limite Envio', 'Creado En', 'Total Envios', 'Enviados', 'Fallidos', 'Pendientes'];
      const rows = campanas.map((c: any) => [
        c.asunto,
        c.estado,
        c.fecha_limite_envio ? new Date(c.fecha_limite_envio).toLocaleDateString() : '',
        new Date(c.creado_en).toLocaleDateString(),
        c.total_envios || 0,
        c.enviados || 0,
        c.fallidos || 0,
        c.pendientes || 0
      ]);
      
      const csvContent = [
        header.join(','),
        ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `estadisticas_campanas_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting CSV', error);
      setErrorExport('Ocurrió un error al exportar el CSV');
    }
  };

  const handleMesActual = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  };

  const handleAnoActual = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), 0, 1);
    const lastDay = new Date(today.getFullYear(), 11, 31);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  };

  const handleLimpiarFiltros = () => {
    setStartDate('');
    setEndDate('');
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  if (loading && !stats) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 flex justify-center text-muted">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3"></div>
          Cargando estadísticas globales...
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Calculos KPIs
  const colaEnviados = stats.cola.find(c => c.estado === 'enviado')?.count || 0;
  const colaFallidos = stats.cola.find(c => c.estado === 'fallido')?.count || 0;
  const colaPendientes = (stats.cola.find(c => c.estado === 'pendiente')?.count || 0) + 
                         (stats.cola.find(c => c.estado === 'procesando')?.count || 0);
  
  const totalColaProcessed = colaEnviados + colaFallidos;
  const successRate = totalColaProcessed > 0 ? ((colaEnviados / totalColaProcessed) * 100).toFixed(1) : '0.0';

  const totalCampanas = stats.campanas.reduce((acc, curr) => acc + curr.count, 0);

  // Mostrar pantalla completa de "No hay estadísticas en toda la BD" SOLO si no hay filtros aplicados
  if (!startDate && !endDate && totalCampanas === 0 && totalColaProcessed === 0 && colaPendientes === 0) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 animate-fade-in">
        <div className="bg-surface border border-border rounded-xl shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
            <BarChart3 size={48} />
          </div>
          <h2 className="text-2xl font-bold text-dark mb-3">Aún no hay estadísticas</h2>
          <p className="text-muted max-w-md mx-auto mb-8 text-lg">
            Aquí podrás visualizar métricas clave sobre el rendimiento de tus correos masivos. Comienza creando tu primera campaña para ver los datos en acción.
          </p>
          <a
            href="/nueva"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium shadow-sm"
          >
            <Plus size={20} />
            Crear Primera Campaña
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 animate-fade-in relative">
      {/* Modal de Error (Exportación) */}
      {errorExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface w-full max-w-sm rounded-2xl shadow-xl border border-border p-6 relative animate-slide-up">
            <button 
              onClick={() => setErrorExport(null)}
              className="absolute top-4 right-4 text-muted hover:text-dark transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-danger/10 text-danger rounded-full flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-dark">Error al Exportar</h3>
              <p className="text-muted text-sm leading-relaxed">{errorExport}</p>
              <button
                onClick={() => setErrorExport(null)}
                className="mt-2 w-full py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            Métricas y Rendimiento
          </h1>
          <p className="text-muted mt-1 text-sm">
            Última sincronización: {lastSync.toLocaleTimeString()}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <button
            onClick={handleExportCsv}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-surface border border-border text-dark px-4 py-2 h-[42px] rounded-lg hover:bg-background transition-colors font-medium shadow-sm w-full sm:w-auto"
          >
            <Download size={18} />
            Exportar CSV
          </button>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-surface border border-border text-dark px-4 py-2 h-[42px] rounded-lg hover:bg-background transition-colors font-medium shadow-sm w-full sm:w-auto"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center justify-center gap-2 bg-surface text-dark border border-border px-3 py-2 h-[42px] rounded-lg hover:bg-background transition-colors font-medium shadow-sm w-full sm:w-auto"
            title="Ayuda sobre Métricas"
          >
            <HelpCircle size={20} className="text-primary" />
          </button>
        </div>
      </div>

      {/* Modal de Ayuda */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-lg p-6 border border-border relative animate-slide-up max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 text-muted hover:text-dark transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-dark mb-4 flex items-center gap-2">
              <Info size={20} className="text-primary" />
              Acerca de Métricas y Rendimiento
            </h3>
            
            <div className="space-y-4 text-sm text-dark">
              <p>
                En esta sección puedes consultar y exportar el resumen global de todas las campañas enviadas.
              </p>
              <div className="bg-background p-3 rounded-lg border border-border">
                <h4 className="font-semibold text-primary mb-1">Filtros de Fecha</h4>
                <p className="text-muted leading-relaxed">
                  Los controles de fecha (Desde / Hasta) filtran las métricas para incluir <strong>únicamente</strong> los resultados de campañas creadas o enviadas en ese rango.
                </p>
              </div>
              <div className="bg-background p-3 rounded-lg border border-border">
                <h4 className="font-semibold text-primary mb-1">Exportar CSV</h4>
                <p className="text-muted leading-relaxed">
                  Al hacer clic en <strong>Exportar CSV</strong>, el archivo generado contendrá exactamente los datos calculados según las fechas seleccionadas. Si filtras por el último mes, el CSV solo contendrá métricas de ese mes.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-8 gap-3 bg-surface p-4 rounded-xl border border-border shadow-sm flex-wrap">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const today = new Date();
              const past = new Date(today);
              past.setDate(today.getDate() - 7);
              setStartDate(past.toISOString().split('T')[0]);
              setEndDate(today.toISOString().split('T')[0]);
            }}
            className="px-3 py-1.5 text-sm bg-primary/10 text-primary font-medium rounded-lg hover:bg-primary/20 transition-colors"
          >
            Últimos 7 días
          </button>
          <button
            onClick={handleMesActual}
            className="px-3 py-1.5 text-sm bg-primary/10 text-primary font-medium rounded-lg hover:bg-primary/20 transition-colors"
          >
            Mes Actual
          </button>
          <button
            onClick={handleAnoActual}
            className="px-3 py-1.5 text-sm bg-primary/10 text-primary font-medium rounded-lg hover:bg-primary/20 transition-colors"
          >
            Año Actual
          </button>
        </div>
        
        <div className="hidden lg:block w-px h-6 bg-border mx-2"></div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm bg-background border border-border text-dark rounded-lg outline-none focus:border-primary transition-colors w-[150px]"
              title="Fecha desde"
            />
            <Calendar size={14} className="absolute left-2.5 top-2.5 text-muted" />
          </div>
          <span className="text-muted text-sm">-</span>
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm bg-background border border-border text-dark rounded-lg outline-none focus:border-primary transition-colors w-[150px]"
              title="Fecha hasta"
            />
            <Calendar size={14} className="absolute left-2.5 top-2.5 text-muted" />
          </div>
          
          {(startDate || endDate) && (
            <button
              onClick={handleLimpiarFiltros}
              className="p-1.5 text-danger bg-danger/10 rounded-lg hover:bg-danger/20 transition-colors ml-1"
              title="Limpiar filtros"
            >
              <FilterX size={18} />
            </button>
          )}
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm flex items-center gap-3">
          <div className="bg-dark/10 p-2.5 rounded-lg text-dark">
            <Mail size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted uppercase">Campañas</p>
            <p className="text-xl font-bold text-dark">{totalCampanas}</p>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm flex items-center gap-3">
          <div className="bg-secondary/10 p-2.5 rounded-lg text-secondary">
            <Send size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted uppercase">Despachados</p>
            <p className="text-xl font-bold text-dark">{colaEnviados}</p>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm flex items-center gap-3">
          <div className="bg-warning/10 p-2.5 rounded-lg text-warning">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted uppercase">Pendientes</p>
            <p className="text-xl font-bold text-dark">{colaPendientes}</p>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-lg text-primary">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted uppercase">Tasa Entrega</p>
            <p className="text-xl font-bold text-dark">{successRate}%</p>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm flex items-center gap-3">
          <div className="bg-info/10 p-2.5 rounded-lg text-[#0ea5e9]">
            <Eye size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted uppercase">Aperturas</p>
            <p className="text-xl font-bold text-dark">{stats.aperturasTotales}</p>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm flex items-center gap-3">
          <div className="bg-success/10 p-2.5 rounded-lg text-[#10b981]">
            <MousePointerClick size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted uppercase">Clics</p>
            <p className="text-xl font-bold text-dark">{stats.clicsTotales}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Estado de Campañas */}
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
          <h2 className="text-lg font-bold text-dark mb-6 border-b border-border pb-2">Campañas por Estado</h2>
          <div className="space-y-5">
            {stats.campanas.map((c, i) => {
              const perc = totalCampanas > 0 ? (c.count / totalCampanas) * 100 : 0;
              let barColor = 'bg-primary';
              if (c.estado === 'completada') barColor = 'bg-secondary';
              if (c.estado === 'cancelada') barColor = 'bg-danger';
              if (c.estado === 'en_proceso') barColor = 'bg-warning';
              
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium capitalize text-dark">{c.estado.replace('_', ' ')}</span>
                    <span className="text-muted font-medium">{c.count} ({perc.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2.5 overflow-hidden border border-border/50">
                    <div 
                      className={`${barColor} h-2.5 rounded-full`} 
                      style={{ width: `${perc}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>


        {/* Salud del Padrón y Distribución de Rebotes */}
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-dark mb-6 border-b border-border pb-2">Salud del Padrón y Contactos</h2>
          {stats.padron.length === 0 ? (
            <p className="text-muted text-sm text-center py-4">No hay datos de contactos en la base de datos.</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 flex-1">
              {(() => {
                const total = stats.padron.reduce((acc, curr) => acc + curr.count, 0);
                const colors: Record<string, string> = {
                  'funcional': '#3b82f6',
                  'inactivo': '#64748b',
                  'rebotado spam': '#ef4444',
                  'rebotado inexistente': '#f59e0b',
                  'rebotado desconocido': '#8b5cf6',
                  'rebotado bandeja llena': '#10b981'
                };
                
                let currentDeg = 0;
                const conicStops = stats.padron.map(p => {
                  const percentage = total > 0 ? (p.count / total) * 360 : 0;
                  const color = colors[p.estado] || '#cbd5e1';
                  const start = currentDeg;
                  currentDeg += percentage;
                  return `${color} ${start}deg ${currentDeg}deg`;
                }).join(', ');

                return (
                  <>
                    <div className="relative w-48 h-48 rounded-full flex items-center justify-center shadow-inner" style={{ background: `conic-gradient(${conicStops})` }}>
                      <div className="w-32 h-32 bg-surface rounded-full flex flex-col items-center justify-center shadow-sm">
                        <span className="text-2xl font-bold text-dark">{total}</span>
                        <span className="text-xs text-muted font-medium">Contactos</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {stats.padron.map((p, i) => {
                        const perc = total > 0 ? ((p.count / total) * 100).toFixed(1) : '0';
                        return (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[p.estado] || '#cbd5e1' }}></span>
                            <span className="font-medium text-dark capitalize">
                              {p.estado === 'funcional' ? 'Contactos Activos' : 
                               p.estado === 'rebotado spam' ? 'Marcados Spam' : 
                               p.estado === 'rebotado inexistente' ? 'Mails Inexistentes' : 
                               p.estado === 'rebotado desconocido' ? 'Rebotado Desc.' : 
                               p.estado === 'rebotado bandeja llena' ? 'Bandeja Llena' : 
                               p.estado}
                            </span>
                            <span className="text-muted ml-auto pl-4">{perc}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Distribución por Rubros */}
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
          <h2 className="text-lg font-bold text-dark mb-6 border-b border-border pb-2">Impacto por Rubro (Top 10)</h2>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {stats.rubros.length === 0 ? (
              <p className="text-muted text-sm text-center py-4">No hay datos de rubros registrados en este periodo.</p>
            ) : (
              stats.rubros.map((r, i) => {
                const totalRubros = stats.rubros.reduce((acc, curr) => acc + curr.cantidad_envios, 0);
                const perc = totalRubros > 0 ? (r.cantidad_envios / totalRubros) * 100 : 0;
                return (
                  <div key={i} className="flex flex-col gap-1.5 p-3 rounded-lg hover:bg-background transition-colors border border-transparent hover:border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-dark flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i+1}</span>
                        {r.rubro === '__sin_rubro__' ? 'Sin Rubro' : RUBROS_LABELS[r.rubro] || r.rubro}
                      </span>
                      <span className="text-sm font-bold text-primary">{r.cantidad_envios} envíos</span>
                    </div>
                    <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: `${perc}%` }}></div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Ranking de Campañas */}
      <div className="bg-surface p-6 rounded-xl border border-border shadow-sm mb-8 overflow-hidden">
        <h2 className="text-lg font-bold text-dark mb-6 border-b border-border pb-2">Ranking de Campañas</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary text-white">
                <th className="p-3 rounded-tl-lg font-medium text-sm whitespace-nowrap">Asunto del evento</th>
                <th className="p-3 font-medium text-sm whitespace-nowrap">Efectividad</th>
                <th className="p-3 font-medium text-sm whitespace-nowrap">Aperturas</th>
                <th className="p-3 font-medium text-sm whitespace-nowrap">Total enviados</th>
                <th className="p-3 rounded-tr-lg font-medium text-sm whitespace-nowrap">Total errores</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.ranking.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted text-sm">No hay campañas registradas en este periodo</td></tr>
              ) : (
                stats.ranking.map((r, i) => {
                  const efectividad = r.procesados > 0 ? ((r.exitosos / r.procesados) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={i} className="hover:bg-background transition-colors">
                      <td className="p-3 text-sm text-dark font-medium max-w-[300px] truncate" title={r.asunto}>
                        {i+1}. {r.asunto}
                      </td>
                      <td className="p-3 text-sm text-dark font-medium">{efectividad}%</td>
                      <td className="p-3 text-sm text-dark">{r.aperturas} <span className="text-muted text-xs">({r.procesados > 0 ? ((r.aperturas/r.procesados)*100).toFixed(1) : '0'}%)</span></td>
                      <td className="p-3 text-sm text-dark">{r.procesados}</td>
                      <td className="p-3 text-sm text-danger font-medium">{r.fallidos}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
