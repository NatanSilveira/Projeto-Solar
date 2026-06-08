import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { useData } from '../../store/DataContext';
import { useAuth } from '../../store/AuthContext';

export default function FormsList() {
  const { formTemplates, formResponses } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredForms = formTemplates.filter(form => {
    const isActive = form.status === 'active';
    const matchesSearch = form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         form.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!isActive || !matchesSearch) return false;

    // Check targeting: if targetPromoterIds is null or empty, it's for everyone.
    // Otherwise, check if user.id is in the list.
    if (!form.targetPromoterIds || form.targetPromoterIds.length === 0) return true;
    return form.targetPromoterIds.includes(user?.id);
  });

  // Consider as "completed" if the current promoter has already responded to it at least once
  // (In a real scenario, this would be per store per day)
  const completedFormIds = new Set(
    formResponses
      .filter(r => r.promoterId === user?.id)
      .map(r => r.formId)
  );

  const pendingForms = filteredForms.filter(f => !completedFormIds.has(f.id));
  const completedForms = filteredForms.filter(f => completedFormIds.has(f.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-coke-white">Formulários e Pesquisas</h1>
        <p className="text-text-dim">Responda aos checklists e pesquisas solicitados nas lojas.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-coke-black border border-coke-gray rounded-xl p-5 flex items-center space-x-4">
          <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
            <Clock className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-dim">Disponíveis</p>
            <p className="text-2xl font-bold text-warning">{pendingForms.length}</p>
          </div>
        </div>
        
        <div className="bg-coke-black border border-coke-gray rounded-xl p-5 flex items-center space-x-4">
          <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-dim">Respondidos por Você</p>
            <p className="text-2xl font-bold text-success">{completedForms.length}</p>
          </div>
        </div>
      </div>

      {/* Tasks List */}
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
              placeholder="Buscar por formulário..."
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {pendingForms.length > 0 && (
            <div className="p-5">
              <h2 className="text-sm font-bold text-text-dim uppercase tracking-wider mb-4">Pendentes</h2>
              <div className="space-y-3">
                {pendingForms.map(form => (
                  <button 
                    key={form.id} 
                    onClick={() => navigate(`/promoter/forms/${form.id}`)}
                    className="w-full text-left bg-coke-darker border border-coke-gray rounded-xl p-4 hover:border-coke-red/50 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-coke-gray rounded-full flex items-center justify-center shrink-0 border border-transparent group-hover:border-coke-red/30 transition-colors">
                        <FileText className="w-5 h-5 text-coke-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-coke-white group-hover:text-coke-red transition-colors">{form.title}</h3>
                        <p className="text-xs text-text-dim mt-1 line-clamp-1">{form.description}</p>
                        <span className="inline-block mt-2 px-2 py-1 bg-coke-gray text-text-dim border border-coke-gray/20 text-[10px] font-bold rounded-md uppercase">
                          {form.questions.length} Questões
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-text-dim group-hover:text-coke-red transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {completedForms.length > 0 && (
            <div className="p-5 border-t border-coke-gray">
              <h2 className="text-sm font-bold text-text-dim uppercase tracking-wider mb-4">Concluídos</h2>
              <div className="space-y-3">
                {completedForms.map(form => (
                  <div key={form.id} className="w-full text-left bg-coke-darker/50 border border-coke-gray/50 rounded-xl p-4 flex items-center justify-between opacity-70">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center shrink-0">
                        <CheckCircle className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-coke-white">{form.title}</h3>
                        <p className="text-xs text-text-dim mt-1">{form.description}</p>
                        <span className="inline-block mt-2 text-[10px] font-bold text-text-dim uppercase">
                          Já respondido por você
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredForms.length === 0 && (
            <div className="p-8 text-center text-text-dim">
              Nenhum formulário ativo encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
