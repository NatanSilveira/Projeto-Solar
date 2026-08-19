const fs = require('fs');
let file = fs.readFileSync('src/components/EditProductModal.tsx', 'utf8');

const formatHelper = `const formatCurrency = (value: string) => {
  let val = value.replace(/\\D/g, '');
  if (val === '') return '';
  const floatVal = parseFloat(val) / 100;
  return floatVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};`;

file = file.replace('export default function EditProductModal', formatHelper + '\n\nexport default function EditProductModal');

file = file.replace(
  'const [price, setPrice] = useState(product.price?.toString() || \'\');',
  'const [price, setPrice] = useState(product.price ? formatCurrency((product.price * 100).toString()) : \'\');'
);

file = file.replace(
  'price: parseFloat(price) || 0',
  'price: price ? parseFloat(price.replace(/\\D/g, \'\')) / 100 : 0'
);

file = file.replace(
  `              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}`,
  `              <input
                type="text"
                placeholder="R$ 0,00"
                value={price}
                onChange={(e) => setPrice(formatCurrency(e.target.value))}`
);

fs.writeFileSync('src/components/EditProductModal.tsx', file);
