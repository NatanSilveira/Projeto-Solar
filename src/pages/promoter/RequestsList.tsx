import React, { useState } from 'react';
import { MessageSquare, Plus, Search, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useData } from '../../store/DataContext';
import { MaterialRequest } from '../../types';
import { useAuth } from '../../store/AuthContext';

export default function RequestsList() {
  const { requests, addRequest, updateRequestStatus, team, stores } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);

  // New Request State
  const [type, setType] = useState('Material de Merchandising');
  const [storeName, setStoreName] = useState('');

  // Set default store
  React.useEffect(() => {
    if (stores.length > 0 && !storeName) {
      setStoreName(stores[0].name);
    }
  }, [stores, storeName]);
  const [description, setDescription] = useState('');

  const isSupervisor = user?.role === 'supervisor';

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.store.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (isSupervisor) return matchesSearch;
    return matchesSearch && req.promoterId === user?.id;
  });

  const getPromoterName = (id: string) => {
    return team.find(t => t.id === id)?.name || id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await addRequest({
      type,
      store: storeName,
      description,
      promoterId: user.id
    });

    setIsModalOpen(false);
    setDescription('');
  };

  const handleUpdateStatus = async (requestId: string, status: 'approved' | 'rejected') => {
    await updateRequestStatus(requestId, status);
    setSelectedRequest(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5" />;
      case 'rejected': return <AlertCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success/10 text-success border-success/20';
      case 'rejected': return 'bg-danger/10 text-danger border-danger/20';
      default: return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Recusado';
      default: return 'Em Análise';
    }
  };

  return (
    <div className="space-y-6 text-coke-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-coke-white">
            {isSupervisor ? 'Gestão de Solicitações' : 'Minhas Solicitações'}
          </h1>
          <p className="text-text-dim text-sm">
            {isSupervisor 
              ? 'Acompanhe e autorize pedidos de materiais e suporte da equipe.'
              : 'Acompanhe seus pedidos de material, ajustes e suporte.'}
          </p>
        </div>
        {!isSupervisor && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-coke-red text-white rounded-xl font-bold text-sm hover:bg-coke-red/80 transition-colors uppercase"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Solicitação</span>
          </button>
        )}
      </div>

      {/* Requests List */}
      <div className="bg-coke-black border border-coke-gray rounded-xl overflow-hidden flex flex-col">
        <div className="p-5 border-b border-coke-gray">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-text-dim" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border-none rounded-xl focus:ring-1 focus:ring-coke-red sm:text-sm bg-coke-gray text-coke-white placeholder-text-dim outline-none"
              placeholder="Buscar por tipo ou loja..."
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRequests.map(req => (
              <div key={req.id} className="bg-coke-darker border border-coke-gray rounded-xl p-5 hover:border-coke-gray/80 transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      req.status === 'pending' ? 'bg-warning/10 text-warning' :
                      req.status === 'approved' ? 'bg-success/10 text-success' :
                      'bg-danger/10 text-danger'
                    }`}>
                      {getStatusIcon(req.status)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-coke-white">{req.type}</h3>
                      <p className="text-[10px] text-text-dim uppercase font-bold">{req.store}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase border ${getStatusStyles(req.status)}`}>
                    {getStatusText(req.status)}
                  </span>
                </div>
                
                <p className="text-sm text-text-dim line-clamp-2 mb-4 h-10">
                  {req.description}
                </p>
                
                <div className="pt-4 border-t border-coke-gray/50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-dim font-bold uppercase tracking-widest flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(req.date).toLocaleDateString()}
                    </span>
                    {isSupervisor && (
                      <span className="text-[10px] text-coke-red font-bold mt-1">
                        POR: {getPromoterName(req.promoterId)}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => setSelectedRequest(req)}
                    className="text-coke-white hover:text-coke-red transition-colors uppercase text-xs font-bold flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
            
          {filteredRequests.length === 0 && (
            <div className="p-8 text-center text-text-dim">
              Nenhuma solicitação encontrada.
            </div>
          )}
        </div>
      </div>

      {/* REQUEST DETAILS MODAL (FOR APPROVAL) */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-coke-black border border-coke-gray w-full max-w-md rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-coke-white">Detalhes do Pedido</h2>
              <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-coke-gray rounded-full text-text-dim">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-6 p-4 bg-coke-gray/30 rounded-xl">
                 <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    selectedRequest.status === 'pending' ? 'bg-warning/10 text-warning' :
                    selectedRequest.status === 'approved' ? 'bg-success/10 text-success' :
                    'bg-danger/10 text-danger'
                  }`}>
                    {getStatusIcon(selectedRequest.status)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-coke-white">{selectedRequest.type}</h3>
                    <p className="text-sm text-text-dim">{selectedRequest.store}</p>
                  </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Promotor Solicitante</label>
                <p className="text-coke-white font-medium">{getPromoterName(selectedRequest.promoterId)}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Data da Solicitação</label>
                <p className="text-coke-white font-medium">{new Date(selectedRequest.date).toLocaleString('pt-BR')}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Descrição Detalhada</label>
                <div className="p-4 bg-coke-gray rounded-xl text-sm border border-coke-gray">
                  {selectedRequest.description}
                </div>
              </div>
            </div>

            {isSupervisor && selectedRequest.status === 'pending' ? (
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                  className="flex-1 bg-coke-gray text-white py-3 rounded-xl font-bold uppercase transition-colors hover:bg-danger/80"
                >
                  Recusar
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'approved')}
                  className="flex-1 bg-coke-red text-white py-3 rounded-xl font-bold uppercase transition-colors hover:bg-success/80"
                >
                  Aprovar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSelectedRequest(null)}
                className="w-full bg-coke-gray text-white py-3 rounded-xl font-bold uppercase transition-colors hover:bg-coke-gray/80"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      )}

      {/* NEW REQUEST MODAL (ONLY FOR PROMOTER) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-coke-black border border-coke-gray w-full max-w-md rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center bg-coke-darker p-6 rounded-t-2xl border-b border-coke-gray">
              <h2 className="text-xl font-bold text-coke-white">Nova Solicitação</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-coke-gray rounded-full text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-coke-white uppercase tracking-widest pl-1">Tipo de Solicitação</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-coke-darker border border-coke-gray rounded-xl px-4 py-4 text-coke-white focus:ring-1 focus:ring-coke-red outline-none appearance-none cursor-pointer"
                >
                  <option>Material de Merchandising</option>
                  <option>Ajuste de Rota</option>
                  <option>Manutenção de Equipamento</option>
                  <option>Suporte Operacional</option>
                  <option>Outros</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-coke-white uppercase tracking-widest pl-1">Loja</label>
                <select
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-coke-darker border border-coke-gray rounded-xl px-4 py-4 text-coke-white focus:ring-1 focus:ring-coke-red outline-none appearance-none cursor-pointer"
                >
                  {stores.length > 0 ? (
                    stores.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))
                  ) : (
                    <option value="Geral / Sem Loja">Geral / Sem Loja</option>
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-coke-white uppercase tracking-widest pl-1">Descrição / Justificativa</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-coke-darker border border-coke-gray rounded-xl px-4 py-4 text-coke-white focus:ring-1 focus:ring-coke-red outline-none min-h-[120px] resize-none placeholder:text-text-dim/50"
                  placeholder="Explique detalhadamente o que você precisa..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-coke-red text-white py-4 rounded-xl font-bold uppercase transition-transform active:scale-[0.98] hover:bg-red-600 mt-4 shadow-lg shadow-coke-red/20"
              >
                Enviar Solicitação
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
