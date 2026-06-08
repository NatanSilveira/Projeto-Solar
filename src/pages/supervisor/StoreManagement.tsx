import React, { useState } from 'react';
import { Store as StoreIcon, Plus, Trash2, MapPin, Search, X } from 'lucide-react';
import { useData } from '../../store/DataContext';
import { useAuth } from '../../store/AuthContext';

export default function StoreManagement() {
  const { stores, addStore, deleteStore } = useData();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Store State
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (store.address?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    await addStore({
      name: newName,
      address: newAddress,
      supervisorId: user?.id
    });

    setNewName('');
    setNewAddress('');
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (deletingId === id) {
      await deleteStore(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-coke-white">Gestão de Lojas</h1>
          <p className="text-text-dim">Adicione ou remova lojas sob sua supervisão.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-coke-red text-white rounded-xl font-bold text-sm hover:bg-coke-red/80 transition-colors uppercase"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Loja</span>
        </button>
      </div>

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
              placeholder="Buscar lojas..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-5">
          {filteredStores.map((store) => (
            <div key={store.id} className="bg-coke-darker border border-coke-gray rounded-xl p-5 hover:border-coke-red/50 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-coke-gray rounded-full flex items-center justify-center">
                  <StoreIcon className="w-5 h-5 text-coke-white" />
                </div>
                {deletingId === store.id ? (
                  <div className="flex gap-2">
                    <button onClick={() => setDeletingId(null)} className="text-xs font-bold text-text-dim hover:text-white px-2 py-1 uppercase">Cancelar</button>
                    <button onClick={() => handleDelete(store.id)} className="text-xs font-bold text-danger hover:text-red-400 bg-danger/10 px-2 py-1 rounded uppercase">Confirma?</button>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleDelete(store.id)}
                    className="text-text-dim hover:text-danger p-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-coke-white mb-2">{store.name}</h3>
              
              {store.address && (
                <div className="flex items-start gap-2 text-sm text-text-dim">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{store.address}</span>
                </div>
              )}
            </div>
          ))}
          {filteredStores.length === 0 && (
            <div className="col-span-full py-20 text-center text-text-dim flex flex-col items-center">
              <StoreIcon className="w-12 h-12 mb-4 opacity-20" />
              <p>Nenhuma loja encontrada.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-coke-black border border-coke-gray w-full max-w-md rounded-2xl">
            <div className="p-6 border-b border-coke-gray flex justify-between items-center bg-coke-darker rounded-t-2xl">
              <h2 className="text-xl font-bold text-coke-white">Adicionar Nova Loja</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-coke-gray rounded-full text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStore} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-coke-white uppercase tracking-widest pl-1">Nome da Loja</label>
                <input 
                  required
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Supermercado Solar Centro"
                  className="w-full bg-coke-darker border border-coke-gray rounded-xl p-4 text-coke-white focus:ring-1 focus:ring-coke-red outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-coke-white uppercase tracking-widest pl-1">Endereço (Opcional)</label>
                <textarea 
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Rua, Número, Bairro..."
                  className="w-full bg-coke-darker border border-coke-gray rounded-xl p-4 text-coke-white focus:ring-1 focus:ring-coke-red outline-none min-h-[100px] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-4 border border-coke-gray text-coke-white rounded-xl font-bold text-xs uppercase hover:bg-coke-gray transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-4 bg-coke-red text-white rounded-xl font-bold text-xs uppercase hover:bg-red-600 transition-colors shadow-lg shadow-coke-red/20"
                >
                  Salvar Loja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
