const fs = require('fs');
let file = fs.readFileSync('src/pages/promoter/ValidityControl.tsx', 'utf8');

file = file.replace(`      setSelectedProduct(newProduct.id);
      setSearchTerm(newProduct.name);`, `      setSelectedProduct(newProduct.id);
      setSearchTerm(newProduct.name);
      setProductToEdit(newProduct);`);

fs.writeFileSync('src/pages/promoter/ValidityControl.tsx', file);
