import React from 'react';
import { useData } from '../../store/DataContext';
import { useAuth } from '../../store/AuthContext';
import { AlertTriangle, CheckCircle2, Clock, Package, PlusCircle, ClipboardList } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export default function PromoterDashboard() {
  const { user } = useAuth();
  const { expirations } = useData();
  const navigate = useNavigate();

  const myExpirations = expirations.filter(e => e.promoterId === user?.id);
  
  const criticalCount = myExpirations.filter(e => e.riskLevel === 'CRITICAL').length;
  const warningCount = myExpirations.filter(e => e.riskLevel === 'WARNING').length;
  const safeCount = myExpirations.filter(e => e.riskLevel === 'SAFE').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-coke-white">Olá, {user?.name.split(' ')[0]}</h1>
        <p className="text-text-dim">Aqui está o resumo da sua execução hoje.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => navigate('/promoter/requests')}
          className="flex items-center justify-center space-x-3 p-4 bg-coke-red text-white rounded-xl font-bold uppercase text-xs hover:bg-coke-red/80 transition-all shadow-lg shadow-coke-red/10"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Fazer Solicitação</span>
        </button>
        <button 
          onClick={() => navigate('/promoter/forms')}
          className="flex items-center justify-center space-x-3 p-4 bg-coke-black border border-coke-gray text-white rounded-xl font-bold uppercase text-xs hover:bg-coke-gray transition-all"
        >
          <ClipboardList className="w-5 h-5 text-coke-red" />
          <span>Ver Formulários</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-coke-black border border-coke-gray rounded-xl p-4 md:p-5 flex flex-col justify-between min-w-0">
          <div>
            <div className="text-[10px] md:text-xs text-text-dim mb-1 md:mb-2 uppercase tracking-wide truncate">Risco Crítico</div>
            <div className="text-xl md:text-2xl font-bold text-danger truncate">{criticalCount}</div>
          </div>
          <div className="text-[10px] md:text-xs mt-2 flex items-center gap-1 text-text-dim truncate">
            <AlertTriangle className="w-3 h-3 text-danger shrink-0" />
            <span className="truncate">Itens próximos</span>
          </div>
        </div>

        <div className="bg-coke-black border border-coke-gray rounded-xl p-4 md:p-5 flex flex-col justify-between min-w-0">
          <div>
            <div className="text-[10px] md:text-xs text-text-dim mb-1 md:mb-2 uppercase tracking-wide truncate">Atenção</div>
            <div className="text-xl md:text-2xl font-bold text-warning truncate">{warningCount}</div>
          </div>
          <div className="text-[10px] md:text-xs mt-2 flex items-center gap-1 text-text-dim truncate">
            <Clock className="w-3 h-3 text-warning shrink-0" />
            <span className="truncate">Risco moderado</span>
          </div>
        </div>

        <div className="bg-coke-black border border-coke-gray rounded-xl p-4 md:p-5 flex flex-col justify-between min-w-0">
          <div>
            <div className="text-[10px] md:text-xs text-text-dim mb-1 md:mb-2 uppercase tracking-wide truncate">Estoque Seguro</div>
            <div className="text-xl md:text-2xl font-bold text-success truncate">{safeCount}</div>
          </div>
          <div className="text-[10px] md:text-xs mt-2 flex items-center gap-1 text-text-dim truncate">
            <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
            <span className="truncate">Dentro da margem</span>
          </div>
        </div>
      </div>

      <div className="bg-coke-black border border-coke-gray rounded-xl overflow-hidden">
        <div className="p-5 border-b border-coke-gray flex justify-between items-center">
          <h2 className="text-lg font-bold text-coke-white">Últimos Registros de Validade</h2>
        </div>
        <div className="divide-y divide-coke-gray">
          {myExpirations.slice(0, 5).map((record) => (
            <div key={record.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-coke-gray rounded-lg flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-text-dim" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-coke-white">{record.productName}</h3>
                  <p className="text-xs text-text-dim mt-1">{record.storeName}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs font-medium text-coke-white">
                      Vence em: {format(parseISO(record.expirationDate), "dd/MM/yyyy")}
                    </span>
                    <span className="text-xs text-text-dim">
                      Qtd: {record.quantity} un
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end sm:w-32">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  record.riskLevel === 'CRITICAL' ? 'bg-danger/10 text-danger border border-danger/20' :
                  record.riskLevel === 'WARNING' ? 'bg-warning/10 text-warning border border-warning/20' :
                  'bg-success/10 text-success border border-success/20'
                }`}>
                  {record.riskLevel === 'CRITICAL' ? 'CRÍTICO' : record.riskLevel === 'WARNING' ? 'ATENÇÃO' : 'SEGURO'}
                </span>
              </div>
            </div>
          ))}
          {myExpirations.length === 0 && (
            <div className="p-8 text-center text-text-dim">
              Nenhum registro encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
