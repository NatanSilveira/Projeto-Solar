const fs = require('fs');
let file = fs.readFileSync('src/pages/promoter/ValidityControl.tsx', 'utf8');

file = file.replace(`      if (newProduct) {
        setSelectedProduct(newProduct.id);
        setSearchTerm(newProduct.name);
      }`, `      if (newProduct) {
        setSelectedProduct(newProduct.id);
        setSearchTerm(newProduct.name);
        setProductToEdit(newProduct);
      }`);

file = file.replace(`              <button
                type="button"
                onClick={() => setIsScanning(true)}
                className="px-4 py-3 rounded-xl bg-coke-red text-white hover:bg-coke-red/80 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-offset-coke-black focus:ring-coke-red"
                title="Escanear Código de Barras"
              >
                <Camera className="w-5 h-5" />
              </button>`, `              {selectedProduct ? (
                <button
                  type="button"
                  onClick={() => setProductToEdit(products.find(p => p.id === selectedProduct))}
                  className="px-4 py-3 rounded-xl bg-coke-gray text-white hover:bg-coke-gray/80 transition-colors"
                  title="Editar Produto Selecionado"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsScanning(true)}
                  className="px-4 py-3 rounded-xl bg-coke-red text-white hover:bg-coke-red/80 transition-colors"
                  title="Escanear Código de Barras"
                >
                  <Camera className="w-5 h-5" />
                </button>
              )}`);

fs.writeFileSync('src/pages/promoter/ValidityControl.tsx', file);
