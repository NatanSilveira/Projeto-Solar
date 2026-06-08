import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, ChevronLeft, Save, CheckCircle, Store } from 'lucide-react';
import { useData } from '../../store/DataContext';
import { useAuth } from '../../store/AuthContext';

export default function FormExecution() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { formTemplates, addFormResponse, stores } = useData();
  const { user } = useAuth();
  
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = formTemplates.find(f => f.id === taskId);

  // Set default store if not set
  React.useEffect(() => {
    if (stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  const selectedStore = stores.find(s => s.id === selectedStoreId);

  if (!form) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6">
        <h2 className="text-xl font-bold text-coke-white mb-2">Formulário não encontrado</h2>
        <p className="text-text-dim mb-6">O formulário que você está tentando acessar pode ter sido removido ou não existe.</p>
        <button 
          onClick={() => navigate('/promoter/forms')}
          className="px-6 py-2 bg-coke-red text-white rounded-xl font-bold uppercase text-sm"
        >
          Voltar para Lista
        </button>
      </div>
    );
  }

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    
    try {
      await addFormResponse({
        formId: form.id,
        promoterId: user.id,
        storeId: selectedStoreId,
        storeName: selectedStore?.name || 'Loja Desconhecida',
        answers: answers
      });

      setIsSubmitting(false);
      setSubmitted(true);

      // Go back after a short delay
      setTimeout(() => {
        navigate('/promoter/forms');
      }, 2000);
    } catch (err) {
      console.error("Error submitting response", err);
      setIsSubmitting(false);
      alert("Erro ao enviar formulário. Tente novamente.");
    }
  };

  const allRequiredAnswered = form.questions
    .filter(q => q.required)
    .every(q => answers[q.id] !== undefined && answers[q.id] !== '');

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-coke-white">Formulário Enviado!</h2>
        <p className="text-text-dim max-w-sm">
          As informações foram sincronizadas com sucesso. O supervisor já pode visualizar os dados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/promoter/forms')}
          className="p-2 bg-coke-black border border-coke-gray rounded-xl hover:bg-coke-gray transition-colors text-coke-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-coke-white line-clamp-1">{form.title}</h1>
          <p className="text-xs text-text-dim">{form.description}</p>
        </div>
      </div>

      {/* Store Selection */}
      <div className="bg-coke-black border border-coke-gray rounded-xl p-5 space-y-3">
        <label className="flex items-center gap-2 text-xs font-bold text-coke-white uppercase tracking-widest pl-1">
          <Store className="w-3 h-3" />
          Loja Atual
        </label>
        <select 
          value={selectedStoreId}
          onChange={(e) => setSelectedStoreId(e.target.value)}
          className="w-full bg-coke-darker border border-coke-gray rounded-xl px-4 py-4 text-coke-white focus:ring-1 focus:ring-coke-red outline-none appearance-none cursor-pointer"
        >
          {stores.length > 0 ? (
            stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))
          ) : (
            <option value="">Nenhuma loja cadastrada</option>
          )}
        </select>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {form.questions.map((q, index) => (
          <div key={q.id} className="bg-coke-black border border-coke-gray rounded-xl p-5">
            <label className="block text-sm font-medium text-coke-white mb-4">
              <span className="text-coke-red mr-2 font-bold">{index + 1}.</span>
              {q.label}
              {q.required && <span className="text-coke-red ml-1">*</span>}
            </label>

            {/* Inputs based on type */}
            {q.type === 'boolean' && (
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => handleAnswer(q.id, true)}
                  className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-colors ${
                    answers[q.id] === true 
                      ? 'bg-success/20 border-success text-success' 
                      : 'bg-coke-gray border-transparent text-text-dim hover:text-coke-white'
                  }`}
                >
                  SIM
                </button>
                <button
                  type="button"
                  onClick={() => handleAnswer(q.id, false)}
                  className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-colors ${
                    answers[q.id] === false 
                      ? 'bg-danger/20 border-danger text-danger' 
                      : 'bg-coke-gray border-transparent text-text-dim hover:text-coke-white'
                  }`}
                >
                  NÃO
                </button>
              </div>
            )}

            {q.type === 'number' && (
              <input
                type="number"
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswer(q.id, e.target.value)}
                className="w-full bg-coke-darker border border-coke-gray rounded-xl px-4 py-4 text-coke-white focus:border-coke-red focus:ring-1 focus:ring-coke-red outline-none"
                placeholder="Digite um número..."
              />
            )}

            {q.type === 'text' && (
              <textarea
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswer(q.id, e.target.value)}
                className="w-full bg-coke-darker border border-coke-gray rounded-xl px-4 py-4 text-coke-white focus:border-coke-red focus:ring-1 focus:ring-coke-red outline-none min-h-[120px] resize-none"
                placeholder="Descreva aqui sua observação..."
              />
            )}

            {q.type === 'select' && (
              <select 
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswer(q.id, e.target.value)}
                className="w-full bg-coke-darker border border-coke-gray rounded-xl px-4 py-4 text-coke-white focus:border-coke-red focus:ring-1 focus:ring-coke-red outline-none cursor-pointer"
              >
                <option value="">Selecione uma opção...</option>
                {q.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}

            {q.type === 'photo' && (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        handleAnswer(q.id, reader.result);
                      };
                      reader.readAsDataURL(e.target.files[0]);
                    }
                  }}
                  id={`photo-${q.id}`}
                  className="hidden"
                />
                
                {answers[q.id] ? (
                  <div className="relative rounded-xl overflow-hidden border border-coke-gray">
                    <img src={answers[q.id]} alt="Captura" className="w-full h-48 object-cover" />
                    <label 
                      htmlFor={`photo-${q.id}`}
                      className="absolute bottom-4 right-4 bg-coke-red text-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-black/50 transition-colors"
                    >
                      <Camera className="w-5 h-5" />
                    </label>
                  </div>
                ) : (
                  <label 
                    htmlFor={`photo-${q.id}`}
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-coke-gray rounded-xl cursor-pointer hover:border-coke-red/50 hover:bg-coke-gray/10 transition-all group"
                  >
                    <div className="w-12 h-12 bg-coke-gray rounded-full flex items-center justify-center group-hover:bg-coke-red/10 group-hover:text-coke-red transition-colors text-text-dim mb-2">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-text-dim group-hover:text-coke-red">
                      Tirar Foto
                    </span>
                  </label>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Footer actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-coke-black border-t border-coke-gray lg:bg-transparent lg:border-0 lg:p-0 lg:sticky lg:bottom-4">
          <button
            type="submit"
            disabled={!allRequiredAnswered || isSubmitting}
            className="w-full flex items-center justify-center space-x-2 py-4 rounded-xl font-bold uppercase text-white bg-coke-red hover:bg-coke-red/80 focus:outline-none focus:ring-2 focus:ring-coke-red disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Enviar Formulário</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
