import React, { useState, Suspense, lazy } from 'react';
import { useData } from '../../store/DataContext';
import { useAuth } from '../../store/AuthContext';
import { ExpirationRecord } from '../../types';
import { Camera, Search, Plus, AlertCircle, PackagePlus } from 'lucide-react';

// Lazy loading the scanner because it uses browser APIs that might be heavy
const BarcodeScanner = lazy(() => import('../../components/BarcodeScanner'));

export default function ValidityControl() {
  const { products, expirations, addExpiration, updateExpiration, deleteExpiration, addProduct, calculateRisk, stores } = useData();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [dailyGiro, setDailyGiro] = useState('');

  // Set default store
  React.useEffect(() => {
    if (stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  const selectedStore = stores.find(s => s.id === selectedStoreId);
  
  const [previewRisk, setPreviewRisk] = useState<'SAFE' | 'WARNING' | 'CRITICAL' | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode.includes(searchTerm)
  );

  const myExpirations = expirations.filter(e => e.promoterId === user?.id)
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

  const handleCalculatePreview = () => {
    if (expirationDate && quantity && dailyGiro) {
      const risk = calculateRisk(expirationDate, Number(quantity), Number(dailyGiro));
      setPreviewRisk(risk);
    } else {
      setPreviewRisk(null);
    }
  };

  React.useEffect(() => {
    handleCalculatePreview();
  }, [expirationDate, quantity, dailyGiro]);

  const handleAddNewProduct = async () => {
    if (!searchTerm) return;
    setIsAddingProduct(true);
    try {
      // Create a new product with a mock barcode if it's not a number
      const isBarcode = /^\d+$/.test(searchTerm);
      const newProduct = await addProduct({
        name: isBarcode ? 'Novo Produto' : searchTerm,
        barcode: isBarcode ? searchTerm : Math.floor(Math.random() * 10000000000000).toString(),
        category: 'Outros'
      });
      setSelectedProduct(newProduct.id);
      setSearchTerm(newProduct.name);
    } catch (error) {
      alert('Erro ao adicionar produto.');
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleScan = (decodedText: string) => {
    setIsScanning(false);
    setSearchTerm(decodedText);
    setSelectedProduct(null); // Clear selected product to show search results with the barcode
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !expirationDate || !quantity || !dailyGiro) return;

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    if (editingId) {
      await updateExpiration(editingId, {
        productId: product.id,
        productName: product.name,
        storeId: selectedStoreId,
        storeName: selectedStore?.name || 'Loja Desconhecida',
        expirationDate,
        quantity: Number(quantity),
        dailyGiro: Number(dailyGiro),
        riskLevel: calculateRisk(expirationDate, Number(quantity), Number(dailyGiro))
      });
      setEditingId(null);
      alert('Registro atualizado com sucesso!');
    } else {
      addExpiration({
        productId: product.id,
        productName: product.name,
        storeId: selectedStoreId,
        storeName: selectedStore?.name || 'Loja Desconhecida',
        promoterId: user!.id,
        expirationDate,
        quantity: Number(quantity),
        dailyGiro: Number(dailyGiro),
      });
      alert('Registro adicionado com sucesso!');
    }

    // Reset form
    setSelectedProduct(null);
    setSearchTerm('');
    setExpirationDate('');
    setQuantity('');
    setDailyGiro('');
    setPreviewRisk(null);
  };

  const handleEdit = (record: ExpirationRecord) => {
    setEditingId(record.id);
    setSelectedProduct(record.productId);
    setSearchTerm(record.productName);
    setExpirationDate(record.expirationDate);
    setQuantity(record.quantity.toString());
    setDailyGiro(record.dailyGiro.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      await deleteExpiration(id);
    }
  };

  const getRiskStyles = (risk: string) => {
    switch (risk) {
      case 'CRITICAL': return 'bg-danger/10 text-danger border-danger/20';
      case 'WARNING': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-success/10 text-success border-success/20';
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Modal do Scanner */}
      {isScanning && (
        <Suspense fallback={
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 px-4 backdrop-blur-sm">
            <div className="w-10 h-10 border-4 border-coke-red border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <BarcodeScanner 
            onScan={handleScan}
            onClose={() => setIsScanning(false)}
          />
        </Suspense>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-coke-white">Controle de Validade</h1>
          <p className="text-text-dim text-sm">Registre os produtos e calcule o risco de vencimento.</p>
        </div>
        {editingId && (
          <button 
            onClick={() => {
              setEditingId(null);
              setSelectedProduct(null);
              setSearchTerm('');
              setExpirationDate('');
              setQuantity('');
              setDailyGiro('');
            }}
            className="text-xs font-bold text-coke-red uppercase border border-coke-red/30 px-3 py-1 rounded-lg hover:bg-coke-red/10"
          >
            Cancelar Edição
          </button>
        )}
      </div>

      <div className="bg-coke-black p-6 rounded-xl border border-coke-gray">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Product Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-text-dim mb-1">
              Buscar Produto (Nome ou Código de Barras)
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-text-dim" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (selectedProduct) setSelectedProduct(null);
                  }}
                  className="block w-full pl-10 pr-3 py-3 border-none rounded-xl focus:ring-1 focus:ring-coke-red sm:text-sm bg-coke-gray text-coke-white placeholder-text-dim outline-none"
                  placeholder="Ex: Coca-Cola 2L ou 789..."
                />
              </div>
              <button
                type="button"
                onClick={() => setIsScanning(true)}
                className="px-4 py-3 rounded-xl bg-coke-red text-white hover:bg-coke-red/80 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-offset-coke-black focus:ring-coke-red"
                title="Escanear Código de Barras"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            {searchTerm && !selectedProduct && (
              <div className="mt-2 border border-coke-gray rounded-xl overflow-hidden bg-coke-black max-h-64 overflow-y-auto">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => {
                      setSelectedProduct(product.id);
                      setSearchTerm(product.name);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-coke-gray border-b border-coke-gray last:border-0"
                  >
                    <p className="text-sm font-medium text-coke-white">{product.name}</p>
                    <p className="text-xs text-text-dim">{product.barcode}</p>
                  </button>
                ))}
                
                {filteredProducts.length === 0 && (
                  <div className="px-4 py-6 text-center flex flex-col items-center justify-center">
                    <p className="text-sm text-text-dim mb-3">Nenhum produto encontrado com "{searchTerm}".</p>
                    <button
                      type="button"
                      onClick={handleAddNewProduct}
                      disabled={isAddingProduct}
                      className="flex items-center space-x-2 px-4 py-2 bg-coke-gray hover:bg-coke-gray/80 text-coke-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <PackagePlus className="w-4 h-4" />
                      <span>{isAddingProduct ? 'Adicionando...' : 'Cadastrar novo produto'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedProduct && (
            <>
              <div className="pt-4 border-t border-coke-gray space-y-4">
                <label className="block text-sm font-medium text-text-dim mb-1">
                  Loja Onde o Produto Está
                </label>
                <select 
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full bg-coke-gray border-none rounded-xl px-4 py-3 text-coke-white focus:ring-1 focus:ring-coke-red outline-none appearance-none cursor-pointer"
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-coke-gray">
              <div>
                <label className="block text-sm font-medium text-text-dim mb-1">
                  Data de Validade
                </label>
                <input
                  type="date"
                  required
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="block w-full px-3 py-3 border-none rounded-xl focus:ring-1 focus:ring-coke-red sm:text-sm bg-coke-gray text-coke-white outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-dim mb-1">
                  Quantidade em Estoque
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="block w-full px-3 py-3 border-none rounded-xl focus:ring-1 focus:ring-coke-red sm:text-sm bg-coke-gray text-coke-white placeholder-text-dim outline-none"
                  placeholder="Ex: 100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-dim mb-1">
                  Giro Diário Médio
                </label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="0.1"
                  value={dailyGiro}
                  onChange={(e) => setDailyGiro(e.target.value)}
                  className="block w-full px-3 py-3 border-none rounded-xl focus:ring-1 focus:ring-coke-red sm:text-sm bg-coke-gray text-coke-white placeholder-text-dim outline-none"
                  placeholder="Ex: 10"
                />
              </div>
            </div>
          </>
        )}

        {previewRisk && (
            <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
              previewRisk === 'CRITICAL' ? 'bg-danger/10 border-danger/20 text-danger' :
              previewRisk === 'WARNING' ? 'bg-warning/10 border-warning/20 text-warning' :
              'bg-success/10 border-success/20 text-success'
            }`}>
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold">
                  {previewRisk === 'CRITICAL' ? 'Risco Crítico de Vencimento' : 
                   previewRisk === 'WARNING' ? 'Atenção: Risco Moderado' : 
                   'Estoque Seguro'}
                </h4>
                <p className="text-sm mt-1 opacity-90">
                  Com um estoque de {quantity} unidades e giro de {dailyGiro}/dia, o produto durará aproximadamente {Math.round(Number(quantity) / Number(dailyGiro))} dias.
                  {previewRisk === 'CRITICAL' && ' O produto vencerá antes de ser totalmente vendido.'}
                </p>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={!selectedProduct || !expirationDate || !quantity || !dailyGiro}
              className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-coke-red text-white rounded-xl font-bold uppercase text-xs hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{editingId ? 'Salvar Alterações' : 'Registrar Validade'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* RECENT REGISTRATIONS LIST */}
      <div className="mt-12 space-y-4 pb-12">
        <h2 className="text-lg font-bold text-coke-white uppercase tracking-wider flex items-center gap-2">
          Meus Registros Recentes
          <span className="bg-coke-gray text-[10px] px-2 py-0.5 rounded-full text-text-dim">
            {myExpirations.length}
          </span>
        </h2>
        
        <div className="space-y-3">
          {myExpirations.slice(0, 10).map((record) => (
            <div key={record.id} className="bg-coke-black border border-coke-gray rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className={`w-2 h-10 rounded-full ${
                  record.riskLevel === 'CRITICAL' ? 'bg-danger' :
                  record.riskLevel === 'WARNING' ? 'bg-warning' : 'bg-success'
                }`}></div>
                <div>
                  <h3 className="text-sm font-bold text-coke-white uppercase tracking-tight">{record.productName}</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-[10px] text-text-dim font-medium uppercase px-2 py-0.5 bg-coke-gray rounded">
                      Exp: {new Date(record.expirationDate).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-[10px] text-text-dim font-medium uppercase px-2 py-0.5 bg-coke-gray rounded">
                      Qtd: {record.quantity}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getRiskStyles(record.riskLevel)}`}>
                      {record.riskLevel === 'CRITICAL' ? 'Crítico' : 
                       record.riskLevel === 'WARNING' ? 'Atenção' : 'Seguro'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 self-end sm:self-auto">
                <button 
                  onClick={() => handleEdit(record)}
                  className="text-text-dim hover:text-coke-white transition-colors uppercase text-[10px] font-bold"
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(record.id)}
                  className="text-text-dim hover:text-coke-red transition-colors uppercase text-[10px] font-bold"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
          {myExpirations.length === 0 && (
            <div className="p-12 text-center border-2 border-dashed border-coke-gray rounded-2xl text-text-dim">
              Você ainda não registrou nenhuma validade.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
