import React, { useState } from 'react';
import { FileText, Plus, Search, CheckCircle, Clock, X, Trash2 } from 'lucide-react';
import { useData } from '../../store/DataContext';
import { FormQuestion, QuestionType } from '../../types';

export default function FormsManagement() {
  const { formTemplates, addFormTemplate, deleteFormTemplate, formResponses, team } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [selectedFormForResults, setSelectedFormForResults] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // New Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [selectedPromoterIds, setSelectedPromoterIds] = useState<string[]>([]);

  const handleDeleteForm = async (id: string) => {
    if (deletingId === id) {
      await deleteFormTemplate(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
    }
  };

  const filteredForms = formTemplates.filter(form => 
    form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addQuestion = () => {
    const newQuestion: FormQuestion = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      label: '',
      required: true
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<FormQuestion>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const togglePromoterSelection = (id: string) => {
    setSelectedPromoterIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleSaveForm = async () => {
    if (!newTitle || questions.length === 0) {
      alert("Preencha o título e adicione pelo menos uma pergunta.");
      return;
    }

    if (targetType === 'specific' && selectedPromoterIds.length === 0) {
      alert("Selecione pelo menos um promotor ou escolha 'Todos'.");
      return;
    }

    await addFormTemplate({
      title: newTitle,
      description: newDesc,
      status: 'active',
      questions: questions,
      targetPromoterIds: targetType === 'all' ? null : selectedPromoterIds
    });

    setIsModalOpen(false);
    setNewTitle('');
    setNewDesc('');
    setQuestions([]);
    setTargetType('all');
    setSelectedPromoterIds([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-coke-white">Gestão de Formulários</h1>
          <p className="text-text-dim">Crie e gerencie checklists e pesquisas para a equipe.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-coke-red text-white rounded-xl font-bold text-sm hover:bg-coke-red/80 transition-colors uppercase"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Formulário</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-coke-black border border-coke-gray rounded-xl p-5 flex items-center space-x-4">
          <div className="w-12 h-12 bg-coke-gray rounded-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-coke-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-dim">Total de Formulários</p>
            <p className="text-2xl font-bold text-coke-white">{formTemplates.length}</p>
          </div>
        </div>
        
        <div className="bg-coke-black border border-coke-gray rounded-xl p-5 flex items-center space-x-4">
          <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-dim">Formulários Ativos</p>
            <p className="text-2xl font-bold text-success">
              {formTemplates.filter(f => f.status === 'active').length}
            </p>
          </div>
        </div>

        <div className="bg-coke-black border border-coke-gray rounded-xl p-5 flex items-center space-x-4">
          <div className="w-12 h-12 bg-coke-gray rounded-full flex items-center justify-center">
            <Clock className="w-6 h-6 text-coke-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-dim">Respostas Coletadas</p>
            <p className="text-2xl font-bold text-coke-white">
              {formResponses.length}
            </p>
          </div>
        </div>
      </div>

      {/* Forms List Section */}
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
              className="block w-full pl-10 pr-3 py-2 border-none rounded-xl focus:ring-1 focus:ring-coke-red sm:text-sm bg-coke-gray text-coke-white placeholder-text-dim outline-none"
              placeholder="Buscar formulários..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-5">
          {filteredForms.map((form) => (
            <div key={form.id} className="bg-coke-darker border border-coke-gray rounded-xl p-5 hover:border-coke-red/50 transition-colors flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1">
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase w-fit ${
                    form.status === 'active' ? 'bg-success/10 text-success border border-success/20' :
                    form.status === 'draft' ? 'bg-warning/10 text-warning border border-warning/20' :
                    'bg-coke-gray text-text-dim border border-coke-gray'
                  }`}>
                    {form.status === 'active' ? 'Ativo' :
                     form.status === 'draft' ? 'Rascunho' : 'Arquivado'}
                  </span>
                  <span className="text-[10px] text-text-dim uppercase font-bold">
                    Alvo: {form.targetPromoterIds ? `${form.targetPromoterIds.length} Promotores` : 'Todos'}
                  </span>
                </div>
                <span className="text-xs text-text-dim">
                  {new Date(form.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-coke-white mb-2">{form.title}</h3>
              <p className="text-sm text-text-dim mb-6 flex-1 line-clamp-2">{form.description}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-coke-gray mt-auto">
                <div className="text-sm">
                  <span className="font-bold text-coke-white">
                    {formResponses.filter(r => r.formId === form.id).length}
                  </span>
                  <span className="text-text-dim ml-1">respostas</span>
                </div>
                <div className="flex gap-4 items-center">
                  <button 
                    onClick={() => {
                      setSelectedFormForResults(form.id);
                      setIsResultsModalOpen(true);
                    }}
                    className="text-coke-white hover:text-coke-red transition-colors uppercase text-xs font-bold"
                  >
                    Respostas
                  </button>
                  {deletingId === form.id ? (
                    <div className="flex gap-2">
                       <button onClick={() => setDeletingId(null)} className="text-[10px] uppercase font-bold text-text-dim hover:text-white">Cancelar</button>
                       <button onClick={() => handleDeleteForm(form.id)} className="text-[10px] uppercase font-bold text-danger hover:text-red-400 bg-danger/10 px-1 rounded">Confirma?</button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleDeleteForm(form.id)}
                      className="text-text-dim hover:text-danger transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredForms.length === 0 && (
            <div className="col-span-full p-8 text-center text-text-dim">
              Nenhum formulário criado ainda.
            </div>
          )}
        </div>
      </div>

      {/* NEW FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-coke-black border border-coke-gray w-full max-w-2xl rounded-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-coke-gray flex justify-between items-center bg-coke-darker rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-coke-white">Criar Novo Formulário</h2>
                <p className="text-sm text-text-dim">Defina as perguntas para sua equipe.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-coke-gray rounded-full transition-colors text-text-dim">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-coke-white">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-coke-white uppercase tracking-widest pl-1">Título do Formulário</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Auditoria de Geladeira"
                    className="w-full bg-coke-darker border border-coke-gray rounded-xl p-4 text-coke-white focus:ring-1 focus:ring-coke-red outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-coke-white uppercase tracking-widest pl-1">Descrição / Objetivo</label>
                  <textarea 
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Breve explicação sobre o que deve ser coletado..."
                    className="w-full bg-coke-darker border border-coke-gray rounded-xl p-4 text-coke-white focus:ring-1 focus:ring-coke-red outline-none min-h-[80px] resize-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-coke-white uppercase tracking-widest pl-1">Público Alvo (Promotores)</label>
                  <div className="flex gap-4 mb-3">
                    <button 
                      onClick={() => setTargetType('all')}
                      className={`flex-1 py-3 px-3 rounded-xl border text-[10px] font-bold uppercase transition-colors ${
                        targetType === 'all' 
                        ? 'bg-coke-red border-coke-red text-white' 
                        : 'border-coke-gray text-text-dim hover:bg-coke-gray'
                      }`}
                    >
                      Todos
                    </button>
                    <button 
                      onClick={() => setTargetType('specific')}
                      className={`flex-1 py-3 px-3 rounded-xl border text-[10px] font-bold uppercase transition-colors ${
                        targetType === 'specific' 
                        ? 'bg-coke-red border-coke-red text-white' 
                        : 'border-coke-gray text-text-dim hover:bg-coke-gray'
                      }`}
                    >
                      Selecionar Específicos
                    </button>
                  </div>

                  {targetType === 'specific' && (
                    <div className="bg-coke-darker border border-coke-gray rounded-xl p-4 max-h-[150px] overflow-y-auto scrollbar-hide">
                      <div className="grid grid-cols-2 gap-3">
                        {team.map(promoter => (
                          <label key={promoter.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-coke-gray cursor-pointer transition-colors group">
                            <input 
                              type="checkbox"
                              checked={selectedPromoterIds.includes(promoter.id)}
                              onChange={() => togglePromoterSelection(promoter.id)}
                              className="w-4 h-4 rounded text-coke-red bg-coke-gray border-none focus:ring-0 cursor-pointer"
                            />
                            <span className="text-xs text-coke-white truncate group-hover:text-coke-red transition-colors">{promoter.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-coke-gray">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-coke-white flex items-center gap-2 uppercase text-xs tracking-widest">
                    Questões
                    <span className="bg-coke-gray text-text-dim text-[10px] px-2 py-0.5 rounded uppercase">
                      {questions.length} selecionadas
                    </span>
                  </h3>
                  <button 
                    onClick={addQuestion}
                    className="text-coke-red hover:text-coke-red/80 font-bold text-[10px] uppercase flex items-center gap-1 border border-coke-red/30 px-3 py-1 rounded-lg"
                  >
                    <Plus className="w-3 h-3" />
                    Adicionar
                  </button>
                </div>

                <div className="space-y-3">
                  {questions.map((q, index) => (
                    <div key={q.id} className="bg-coke-darker border border-coke-gray rounded-xl p-4 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <input 
                            type="text"
                            value={q.label}
                            onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                            placeholder="Enunciado da pergunta..."
                            className="w-full bg-coke-black border border-coke-gray rounded-lg p-3 text-sm text-coke-white focus:ring-1 focus:ring-coke-red outline-none font-medium"
                          />
                          <div className="flex flex-wrap gap-3">
                            <div className="flex items-center space-x-2 bg-coke-black px-3 py-2 rounded-lg border border-coke-gray">
                              <span className="text-[10px] text-coke-white uppercase font-bold">Tipo:</span>
                              <div className="relative">
                                <select 
                                  value={q.type}
                                  onChange={(e) => updateQuestion(q.id, { type: e.target.value as QuestionType })}
                                  className="appearance-none bg-coke-black border-none text-xs text-coke-white focus:ring-0 outline-none pr-8 cursor-pointer"
                                >
                                  <option value="text" className="bg-coke-black text-white">Texto</option>
                                  <option value="number" className="bg-coke-black text-white">Número</option>
                                  <option value="boolean" className="bg-coke-black text-white">Sim/Não</option>
                                  <option value="select" className="bg-coke-black text-white">Seleção</option>
                                  <option value="photo" className="bg-coke-black text-white">Foto</option>
                                </select>
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-text-dim">
                                  <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                </div>
                              </div>
                            </div>
                            <label className="flex items-center space-x-2 cursor-pointer bg-coke-black px-2 py-1 rounded-lg border border-coke-gray">
                              <input 
                                type="checkbox"
                                checked={q.required}
                                onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                                className="w-3 h-3 rounded text-coke-red bg-coke-gray border-none focus:ring-0"
                              />
                              <span className="text-[10px] text-text-dim uppercase font-bold">Obrigatória</span>
                            </label>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeQuestion(q.id)}
                          className="p-1.5 text-text-dim hover:text-coke-red transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {questions.length === 0 && (
                    <div className="border-2 border-dashed border-coke-gray rounded-xl p-12 text-center text-text-dim text-sm">
                      Nenhuma pergunta adicionada. Comece clicando em "Adicionar" acima.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-coke-gray flex gap-3 bg-coke-darker rounded-b-2xl">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-4 border border-coke-gray text-coke-white rounded-xl font-bold text-xs uppercase hover:bg-coke-gray transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveForm}
                className="flex-1 px-4 py-4 bg-coke-red text-white rounded-xl font-bold text-xs uppercase hover:bg-red-600 transition-colors shadow-lg shadow-coke-red/20"
              >
                Publicar Formulário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS MODAL */}
      {isResultsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-coke-black border border-coke-gray w-full max-w-4xl rounded-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-coke-gray flex justify-between items-center bg-coke-darker rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-coke-white">
                  Respostas: {formTemplates.find(f => f.id === selectedFormForResults)?.title}
                </h2>
                <p className="text-sm text-text-dim">Acompanhe as coletas realizadas em campo.</p>
              </div>
              <button onClick={() => setIsResultsModalOpen(false)} className="p-2 hover:bg-coke-gray rounded-full transition-colors text-text-dim">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {formResponses
                  .filter(r => r.formId === selectedFormForResults)
                  .map(response => {
                    const template = formTemplates.find(t => t.id === response.formId);
                    return (
                      <div key={response.id} className="bg-coke-darker border border-coke-gray rounded-xl p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-4 border-b border-coke-gray/50">
                          <div>
                            <p className="text-sm font-bold text-coke-white tracking-tight">{response.storeName}</p>
                            <p className="text-[10px] text-text-dim uppercase font-bold tracking-widest mt-1">
                              {new Date(response.submittedAt).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Promotor</p>
                            <p className="text-xs font-bold text-coke-red">{team.find(t => t.id === response.promoterId)?.name || response.promoterId}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {template?.questions.map(q => (
                            <div key={q.id} className="space-y-1 bg-coke-black p-4 rounded-lg border border-coke-gray">
                              <p className="text-[10px] font-bold text-coke-white uppercase tracking-widest">{q.label}</p>
                              <div className="text-sm text-coke-white mt-1">
                                {q.type === 'photo' ? (
                                  response.answers[q.id] ? (
                                    <div className="mt-2 rounded-lg overflow-hidden border border-coke-gray max-w-[200px] shadow-lg">
                                      <img src={response.answers[q.id]} alt="Resposta" className="w-full h-auto" />
                                    </div>
                                  ) : <span className="italic text-text-dim text-xs">Nenhuma foto enviada</span>
                                ) : q.type === 'boolean' ? (
                                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] border ${response.answers[q.id] ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'}`}>
                                    {response.answers[q.id] ? 'SIM' : 'NÃO'}
                                  </span>
                                ) : (
                                  <p className="font-medium">{response.answers[q.id] || <span className="italic text-text-dim">Sem resposta</span>}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                {formResponses.filter(r => r.formId === selectedFormForResults).length === 0 && (
                  <div className="text-center py-20 text-text-dim flex flex-col items-center">
                    <FileText className="w-12 h-12 mb-4 opacity-20" />
                    <p>Nenhuma resposta coletada para este formulário ainda.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
