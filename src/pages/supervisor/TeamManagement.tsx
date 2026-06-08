import React, { useState } from 'react';
import { Users, UserPlus, Search, MapPin, Activity, X, Trash2 } from 'lucide-react';
import { useData } from '../../store/DataContext';
import { useAuth } from '../../store/AuthContext';
import { User } from '../../types';

export default function TeamManagement() {
  const { team, formResponses, updateUserStatus, deleteUser, stores, addTeamMember } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPromoter, setSelectedPromoter] = useState<User | null>(null);

  // New Promoter State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const myTeam = team.filter(member => member.supervisorId === user?.id);

  const filteredTeam = myTeam.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPromoter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) return;
    setErrorMsg('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          role: 'promoter',
          password: newPassword,
          supervisorId: user?.id,
          storeId: selectedStoreId || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setSelectedStoreId('');
      setIsAddModalOpen(false);
      
      const newPromoter = await response.json();
      addTeamMember(newPromoter);
    } catch (err) {
      setErrorMsg("Erro ao cadastrar promotor. O email já está em uso.");
    }
  };

  const handleDeletePromoter = async (id: string, name: string) => {
    if (deletingId === id) {
      await deleteUser(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
    }
  };

  const getPromoterProgress = (promoterId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const responsesToday = formResponses.filter(r => 
      r.promoterId === promoterId && 
      r.submittedAt.startsWith(today)
    );
    
    // For now, let's assume each promoter has 5 assigned stores
    const assigned = 5;
    const completed = responsesToday.length;
    
    return { completed, assigned };
  };

  const handleStatusChange = async (member: User, newStatus: User['status']) => {
    await updateUserStatus(member.id, newStatus);
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'vacation': return 'bg-warning/10 text-warning border-warning/20';
      case 'inactive': return 'bg-danger/10 text-danger border-danger/20';
      default: return 'bg-success/10 text-success border-success/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'vacation': return 'Férias';
      case 'inactive': return 'Inativo';
      default: return 'Ativo';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-coke-white">Gestão de Equipe</h1>
          <p className="text-text-dim">Acompanhe seus promotores e o status das rotas.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-coke-red text-white rounded-xl font-bold text-sm hover:bg-coke-red/80 transition-colors uppercase"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Promotor</span>
        </button>
      </div>

      {/* Team List */}
      <div className="bg-coke-black border border-coke-gray rounded-xl overflow-hidden">
        <div className="p-5 border-b border-coke-gray">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-text-dim" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-coke-gray rounded-xl focus:ring-1 focus:ring-coke-red sm:text-sm bg-coke-darker text-coke-white placeholder-text-dim outline-none"
              placeholder="Buscar por nome ou email..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-coke-gray">
            <thead className="bg-coke-darker">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-dim uppercase tracking-wider">
                  Promotor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-dim uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-dim uppercase tracking-wider">
                  Alterar Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-dim uppercase tracking-wider">
                  Progresso Hoje
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-coke-black divide-y divide-coke-gray">
              {filteredTeam.map((member) => {
                const progress = getPromoterProgress(member.id);
                return (
                  <tr key={member.id} className="hover:bg-coke-gray/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-coke-gray rounded-full flex items-center justify-center font-bold text-coke-white">
                          {member.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-coke-white">{member.name}</div>
                          <div className="text-sm text-text-dim">{member.email}</div>
                          {member.supervisorId === user?.id && (
                            <div className="text-[10px] text-coke-red font-bold uppercase mt-0.5">Sua Equipe</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-[10px] uppercase leading-5 font-bold rounded-md border ${getStatusStyles(member.status)}`}>
                        {getStatusText(member.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select 
                        value={member.status || 'active'}
                        onChange={(e) => handleStatusChange(member, e.target.value as User['status'])}
                        className="bg-coke-darker border border-coke-gray rounded-xl text-xs px-3 py-2 text-coke-white outline-none focus:ring-1 focus:ring-coke-red cursor-pointer appearance-none"
                      >
                        <option value="active" className="bg-coke-black">Ativo</option>
                        <option value="vacation" className="bg-coke-black">Férias</option>
                        <option value="inactive" className="bg-coke-black">Inativo</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-coke-white mr-2">
                          {progress.completed}/{progress.assigned}
                        </span>
                        <div className="w-full bg-coke-gray rounded-full h-2 max-w-[100px]">
                          <div 
                            className="bg-coke-red h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${(progress.completed / (progress.assigned || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button 
                          onClick={() => setSelectedPromoter(member)}
                          className="text-coke-white hover:text-coke-red transition-colors uppercase text-xs font-bold"
                        >
                          Detalhes
                        </button>
                        {deletingId === member.id ? (
                          <div className="flex gap-2 bg-coke-black border border-danger/20 p-1 rounded-lg items-center">
                            <span className="text-[10px] text-danger uppercase font-bold px-1">Confirma?</span>
                            <button onClick={() => setDeletingId(null)} className="text-[10px] text-text-dim hover:text-white uppercase font-bold cursor-pointer bg-coke-darker px-2 py-1 rounded">Não</button>
                            <button onClick={() => handleDeletePromoter(member.id, member.name)} className="text-[10px] bg-danger text-white uppercase font-bold cursor-pointer border-none px-2 py-1 rounded">Sim</button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleDeletePromoter(member.id, member.name)}
                            className="text-text-dim hover:text-danger transition-colors"
                            title="Excluir Promotor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredTeam.length === 0 && (
            <div className="p-8 text-center text-text-dim">
              Nenhum promotor encontrado na sua equipe.
            </div>
          )}
        </div>
      </div>

      {/* ADD PROMOTER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-coke-black border border-coke-gray w-full max-w-md rounded-2xl">
            <div className="p-6 border-b border-coke-gray flex justify-between items-center bg-coke-darker rounded-t-2xl">
              <h2 className="text-xl font-bold text-coke-white">Cadastrar Novo Promotor</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 hover:bg-coke-gray rounded-full text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPromoter} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-coke-red/10 border border-coke-red text-coke-red px-4 py-3 rounded-xl text-sm font-bold">
                  {errorMsg}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-coke-white uppercase tracking-widest pl-1">Nome Completo</label>
                <input 
                  required
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nome do Promotor"
                  className="w-full bg-coke-darker border border-coke-gray rounded-xl p-4 text-coke-white focus:ring-1 focus:ring-coke-red outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-coke-white uppercase tracking-widest pl-1">Email Corporativo</label>
                <input 
                  required
                  type="email" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="promotor@solar.com"
                  className="w-full bg-coke-darker border border-coke-gray rounded-xl p-4 text-coke-white focus:ring-1 focus:ring-coke-red outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-coke-white uppercase tracking-widest pl-1">Senha Inicial</label>
                <input 
                  required
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="********"
                  className="w-full bg-coke-darker border border-coke-gray rounded-xl p-4 text-coke-white focus:ring-1 focus:ring-coke-red outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-coke-white uppercase tracking-widest pl-1">Vincular à Loja</label>
                <select 
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full bg-coke-darker border border-coke-gray rounded-xl p-4 text-coke-white focus:ring-1 focus:ring-coke-red outline-none appearance-none cursor-pointer"
                >
                  <option value="" className="bg-coke-black">Selecione uma loja (Opcional)</option>
                  {stores.map(s => (
                    <option key={s.id} value={s.id} className="bg-coke-black">{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-4 border border-coke-gray text-coke-white rounded-xl font-bold text-xs uppercase hover:bg-coke-gray transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-4 bg-coke-red text-white rounded-xl font-bold text-xs uppercase hover:bg-red-600 transition-colors shadow-lg shadow-coke-red/20"
                >
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROMOTER DETAILS MODAL */}
      {selectedPromoter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-coke-black border border-coke-gray w-full max-w-md rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center bg-coke-darker -m-6 p-6 rounded-t-2xl border-b border-coke-gray mb-0">
              <h2 className="text-xl font-bold text-coke-white">Detalhes do Promotor</h2>
              <button onClick={() => setSelectedPromoter(null)} className="p-2 hover:bg-coke-gray rounded-full text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-coke-gray rounded-full flex items-center justify-center font-bold text-2xl text-coke-white border-2 border-coke-red">
                  {selectedPromoter.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-coke-white tracking-tight">{selectedPromoter.name}</h3>
                  <p className="text-text-dim text-sm">{selectedPromoter.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-coke-gray">
                <div>
                  <label className="text-[10px] text-text-dim uppercase font-bold tracking-widest">Status Atual</label>
                  <p className="text-coke-white font-medium">{getStatusText(selectedPromoter.status)}</p>
                </div>
                <div>
                  <label className="text-[10px] text-text-dim uppercase font-bold tracking-widest">Código ID</label>
                  <p className="text-coke-white font-mono text-xs">{selectedPromoter.id}</p>
                </div>
                <div>
                  <label className="text-[10px] text-text-dim uppercase font-bold tracking-widest">Respostas Hoje</label>
                  <p className="text-coke-white font-medium">{getPromoterProgress(selectedPromoter.id).completed}</p>
                </div>
                <div>
                  <label className="text-[10px] text-text-dim uppercase font-bold tracking-widest">Cargo</label>
                  <p className="text-coke-white uppercase text-[10px] font-bold bg-coke-gray inline-block px-2 py-0.5 rounded">Promotor</p>
                </div>
                <div>
                  <label className="text-[10px] text-text-dim uppercase font-bold tracking-widest">Loja Vinculada</label>
                  <p className="text-coke-white font-medium">{stores.find(s => s.id === selectedPromoter.storeId)?.name || 'Nenhuma'}</p>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <label className="text-[10px] text-text-dim uppercase font-bold tracking-widest">Histórico de Atividade</label>
                <div className="p-4 bg-coke-darker border border-coke-gray rounded-xl text-xs text-text-dim">
                  Última sincronização registrada hoje às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedPromoter(null)}
              className="w-full bg-coke-red text-white py-4 rounded-xl font-bold uppercase transition-transform active:scale-[0.98] mt-2 shadow-lg shadow-coke-red/10"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

