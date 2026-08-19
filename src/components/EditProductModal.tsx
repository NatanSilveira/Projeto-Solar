import React, { useState } from 'react';
// Componente Modal de Edição de Produtos
import { X } from 'lucide-react';
import { Product } from '../types';

interface EditProductModalProps {
  product: Product;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Product>) => Promise<void>;
}

const formatCurrency = (value: string) => {
  let val = value.replace(/\D/g, '');
  if (val === '') return '';
  const floatVal = parseFloat(val) / 100;
  return floatVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function EditProductModal({ product, onClose, onSave }: EditProductModalProps) {
  const [name, setName] = useState(product.name);
  const [barcode, setBarcode] = useState(product.barcode);
  const [price, setPrice] = useState(product.price ? formatCurrency((product.price * 100).toString()) : '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(product.id, { 
        name, 
        barcode, 
        price: price ? parseFloat(price.replace(/\D/g, '')) / 100 : 0 
      });
      onClose();
    } catch (error) {
      alert('Erro ao atualizar produto.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-coke-black border border-coke-gray w-full max-w-md rounded-2xl flex flex-col shadow-2xl">
        <div className="p-6 border-b border-coke-gray flex justify-between items-center bg-coke-darker rounded-t-2xl">
          <h2 className="text-xl font-bold text-coke-white">Editar Produto</h2>
          <button onClick={onClose} className="p-2 hover:bg-coke-gray rounded-full transition-colors text-text-dim">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-dim mb-1">Nome do Produto</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-coke-gray border-none rounded-xl text-coke-white outline-none focus:ring-1 focus:ring-coke-red"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dim mb-1">Código de Barras</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                required
                className="w-full px-4 py-3 bg-coke-gray border-none rounded-xl text-coke-white outline-none focus:ring-1 focus:ring-coke-red"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dim mb-1">Preço (Opcional)</label>
              <input
                type="text"
                placeholder="R$ 0,00"
                value={price}
                onChange={(e) => setPrice(formatCurrency(e.target.value))}
                className="w-full px-4 py-3 bg-coke-gray border-none rounded-xl text-coke-white outline-none focus:ring-1 focus:ring-coke-red"
              />
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-coke-red text-white font-bold rounded-xl hover:bg-coke-red/80 disabled:opacity-50 mt-4"
            >
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
