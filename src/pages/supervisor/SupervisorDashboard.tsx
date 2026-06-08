import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../store/DataContext';
import { useAuth } from '../../store/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, TrendingDown, ClipboardCheck } from 'lucide-react';

export default function SupervisorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { expirations, formResponses, requests } = useData();
  const [isReady, setIsReady] = useState(false);

  // Force chart refresh after mount
  useEffect(() => {
    setIsReady(true);
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Compute live KPIs based on database data
  const { criticalItems, warningItems, safeItems, storeData, potentialLoss, pendingRequests, executionToday } = useMemo(() => {
    const critical = [];
    const warning = [];
    const safe = [];
    let loss = 0;
    
    // Aggregate by store
    const storeMap: Record<string, { name: string, critical: number, warning: number }> = {};

    expirations.forEach(e => {
      const name = e.storeName || 'Loja Desconhecida';
      if (!storeMap[name]) {
        storeMap[name] = { name: name, critical: 0, warning: 0 };
      }

      if (e.riskLevel === 'CRITICAL') {
        critical.push(e);
        storeMap[name].critical += e.quantity;
        loss += (e.quantity * 8.5); // Mock base price
      } else if (e.riskLevel === 'WARNING') {
        warning.push(e);
        storeMap[name].warning += e.quantity;
      } else {
        safe.push(e);
      }
    });

    const pendingReqs = requests.filter(r => r.status === 'pending');
    
    const today = new Date().toISOString().split('T')[0];
    const execToday = formResponses.filter(r => r.submittedAt.startsWith(today));

    return {
      criticalItems: critical,
      warningItems: warning,
      safeItems: safe,
      storeData: Object.values(storeMap).sort((a, b) => (b.critical + b.warning) - (a.critical + a.warning)).slice(0, 5),
      potentialLoss: loss,
      pendingRequests: pendingReqs.length,
      executionToday: execToday.length
    };
  }, [expirations, requests, formResponses]);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-coke-white">Painel do Supervisor</h1>
        <p className="text-text-dim">Acompanhe os indicadores de execução e risco de perda da sua região.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-coke-black border border-coke-gray rounded-xl p-4 md:p-5 flex flex-col justify-between min-w-0">
          <div>
            <div className="text-[10px] md:text-xs text-text-dim mb-1 md:mb-2 uppercase tracking-wide truncate">Execuções Hoje</div>
            <div className="text-xl md:text-2xl font-bold text-success truncate">{executionToday}</div>
          </div>
          <div className="text-[10px] md:text-xs mt-2 flex items-center gap-1 text-text-dim truncate">
            <span>Formulários preenchidos</span>
          </div>
        </div>

        <div className="bg-coke-black border border-coke-gray rounded-xl p-4 md:p-5 flex flex-col justify-between min-w-0">
          <div>
            <div className="text-[10px] md:text-xs text-text-dim mb-1 md:mb-2 uppercase tracking-wide truncate">SKUs Críticos</div>
            <div className="text-xl md:text-2xl font-bold text-danger truncate">{criticalItems.length}</div>
          </div>
          <div className="text-[10px] md:text-xs mt-2 flex items-center gap-1 text-text-dim truncate">
            <span>Risco de vencimento</span>
          </div>
        </div>

        <button 
          onClick={() => navigate('/supervisor/requests')}
          className="bg-coke-black border border-coke-gray rounded-xl p-4 md:p-5 flex flex-col justify-between min-w-0 hover:border-coke-red/50 transition-colors text-left"
        >
          <div>
            <div className="text-[10px] md:text-xs text-text-dim mb-1 md:mb-2 uppercase tracking-wide truncate">Pedidos Pendentes</div>
            <div className="text-xl md:text-2xl font-bold text-warning truncate">{pendingRequests}</div>
          </div>
          <div className="text-[10px] md:text-xs mt-2 flex items-center gap-1 text-text-dim truncate">
            <span className="text-coke-red font-bold uppercase text-[10px]">Ver e Aprovar →</span>
          </div>
        </button>

        <div className="bg-coke-black border border-coke-gray rounded-xl p-4 md:p-5 flex flex-col justify-between min-w-0">
          <div>
            <div className="text-[10px] md:text-xs text-text-dim mb-1 md:mb-2 uppercase tracking-wide truncate">Prejuízo Potencial</div>
            <div className="text-xl md:text-2xl font-bold text-coke-white truncate">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(potentialLoss)}
            </div>
          </div>
          <div className="text-[10px] md:text-xs mt-2 flex items-center gap-1 text-danger truncate">
            <span>Foco em evitar perdas</span>
          </div>
        </div>
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heatmap / Bar Chart */}
        <div className="bg-coke-black border border-coke-gray rounded-xl p-5">
          <h2 className="text-lg font-bold text-coke-white mb-6">Volume em Risco por Ponto de Venda</h2>
          <div className="h-[300px] w-full bg-coke-gray/5 rounded-lg overflow-hidden flex items-center justify-center">
            {isReady && storeData.length > 0 ? (
              <ResponsiveContainer width="99%" height={280}>
                <BarChart 
                  data={storeData} 
                  margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#A0A0A0', fontSize: 10 }} 
                    interval={0}
                    height={50}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#A0A0A0', fontSize: 10 }} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #444', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ padding: '2px 0' }}
                  />
                  <Bar 
                    dataKey="critical" 
                    name="Crítico" 
                    stackId="a" 
                    fill="#ef4444" 
                    isAnimationActive={false}
                    barSize={40}
                  />
                  <Bar 
                    dataKey="warning" 
                    name="Atenção" 
                    stackId="a" 
                    fill="#f59e0b" 
                    isAnimationActive={false}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : isReady && storeData.length === 0 ? (
               <div className="h-full flex items-center justify-center text-text-dim text-sm">
                 Nenhum dado de validade registrado ainda.
               </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-danger"></div>
              </div>
            )}
          </div>
        </div>

        {/* Critical Alerts List */}
        <div className="bg-coke-black border border-coke-gray rounded-xl flex flex-col overflow-hidden">
          <div className="p-5 border-b border-coke-gray flex justify-between items-center">
            <h2 className="text-lg font-bold text-coke-white">Alertas Críticos Recentes</h2>
            <button className="text-sm font-bold text-coke-white hover:text-coke-red transition-colors uppercase">Ver todos</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {criticalItems.slice(0, 10).map(item => (
              <div key={item.id} className="p-4 hover:bg-coke-gray/50 rounded-xl transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-coke-white">{item.productName}</h3>
                    <p className="text-xs text-text-dim mt-1">{item.storeName}</p>
                    <p className="text-xs text-text-dim mt-1">Vence em: {new Date(item.expirationDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className="px-2 py-1 bg-danger/10 text-danger border border-danger/20 text-xs font-bold rounded-md whitespace-nowrap">
                    {item.quantity} un
                  </span>
                </div>
              </div>
            ))}
            {criticalItems.length === 0 && (
              <div className="p-8 text-center text-text-dim h-full flex items-center justify-center">
                <div className="flex flex-col items-center">
                   <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mb-3">
                     <ClipboardCheck className="w-6 h-6 text-success" />
                   </div>
                   Nenhum alerta crítico no momento.<br/>O estoque dos PDVs está sob controle.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
