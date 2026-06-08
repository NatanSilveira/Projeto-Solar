import React, { useState } from 'react';
import { Package, Search, Filter, CheckCircle2, XCircle, Clock, MapPin, User as UserIcon } from 'lucide-react';
import { useData } from '../../store/DataContext';

export default function MaterialRequestsManagement() {
  const { requests, updateRequestStatus, team } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.store.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    await updateRequestStatus(id, status);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success/10 text-success border-success/20';
      case 'rejected': return 'bg-danger/10 text-danger border-danger/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20 text-warning';
      default: return 'bg-coke-gray text-text-dim border-coke-gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Recusado';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  const getPromoterName = (id: string) => {
    return team.find(t => t.id === id)?.name || id;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-coke-white">Gestão de Solicitações</h1>
        <p className="text-text-dim">Analise e responda às solicitações de materiais de merchandising e manutenção.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim h-5 w-5" />
          <input 
            type="text" 
            placeholder="Buscar por tipo ou loja..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-coke-black border border-coke-gray rounded-xl pl-10 pr-4 py-3 text-coke-white focus:ring-1 focus:ring-coke-red outline-none"
          />
        </div>
        <div className="flex gap-2 p-1 bg-coke-black border border-coke-gray rounded-xl">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${
                statusFilter === status 
                  ? 'bg-coke-red text-white' 
                  : 'text-text-dim hover:text-coke-white'
              }`}
            >
              {status === 'all' ? 'Todos' : getStatusText(status)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredRequests.map((request) => (
          <div key={request.id} className="bg-coke-black border border-coke-gray rounded-xl overflow-hidden">
            <div className={`p-4 border-b border-coke-gray flex justify-between items-center ${
              request.status === 'pending' ? 'bg-warning/5' : ''
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getStatusStyle(request.status)} border`}>
                  {request.status === 'approved' ? <CheckCircle2 className="w-5 h-5" /> :
                   request.status === 'rejected' ? <XCircle className="w-5 h-5" /> :
                   <Clock className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-coke-white uppercase tracking-tight">{request.type}</h3>
                  <div className="flex flex-wrap gap-4 mt-1">
                    <span className="flex items-center text-[10px] text-text-dim font-bold uppercase">
                      <MapPin className="w-3 h-3 mr-1" />
                      {request.store}
                    </span>
                    <span className="flex items-center text-[10px] text-text-dim font-bold uppercase">
                      <UserIcon className="w-3 h-3 mr-1" />
                      {getPromoterName(request.promoterId)}
                    </span>
                    <span className="text-[10px] text-text-dim font-bold uppercase">
                      {new Date(request.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusStyle(request.status)}`}>
                {getStatusText(request.status)}
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="bg-coke-darker p-4 rounded-xl border border-coke-gray">
                <p className="text-sm text-text-dim leading-relaxed">
                  {request.description || 'Sem descrição detalhada.'}
                </p>
              </div>

              {request.status === 'pending' && (
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => handleStatusUpdate(request.id, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-danger/30 text-danger rounded-xl font-bold text-xs uppercase hover:bg-danger/10 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Recusar</span>
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(request.id, 'approved')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-success text-white rounded-xl font-bold text-xs uppercase hover:bg-success/80 transition-colors shadow-lg shadow-success/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aprovar Solicitação</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredRequests.length === 0 && (
          <div className="bg-coke-black border border-coke-gray border-dashed rounded-xl p-20 text-center text-text-dim">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm font-medium">Nenhuma solicitação encontrada para os filtros aplicados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
