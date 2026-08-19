const fs = require('fs');
let file = fs.readFileSync('src/pages/supervisor/SupervisorDashboard.tsx', 'utf8');

const newPdfLogic = `  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Relatório de Controle de Validades', 14, 20);
    
    doc.setFontSize(10);
    doc.text(\`Gerado em: \${new Date().toLocaleDateString('pt-BR')} por \${user?.name}\`, 14, 28);
    
    // Sort all expirations by risk: Critical, Warning, Safe
    const allExpirations = [...expirations].sort((a, b) => {
      const riskWeight = { 'CRITICAL': 1, 'WARNING': 2, 'SAFE': 3 };
      return riskWeight[a.riskLevel] - riskWeight[b.riskLevel];
    });

    const tableData = allExpirations.map(item => {
      const product = products.find(p => p.id === item.productId);
      const barcode = product ? product.barcode : 'N/A';
      let riskStr = 'Seguro';
      if (item.riskLevel === 'CRITICAL') riskStr = 'Crítico';
      else if (item.riskLevel === 'WARNING') riskStr = 'Atenção';

      return [
        item.productName,
        barcode,
        item.storeName,
        new Date(item.expirationDate).toLocaleDateString('pt-BR'),
        item.quantity.toString(),
        item.dailyGiro.toString(),
        riskStr
      ];
    });
    
    autoTable(doc, {
      startY: 35,
      head: [['Produto', 'Código', 'Loja', 'Data de Validade', 'Estoque', 'Giro Diário', 'Risco']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [227, 24, 55] }, // Coke red
      styles: { fontSize: 8 },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 6) { // Risco column
          if (data.cell.raw === 'Crítico') {
            data.cell.styles.textColor = [239, 68, 68]; // Tailwind red-500
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.raw === 'Atenção') {
            data.cell.styles.textColor = [245, 158, 11]; // Tailwind amber-500
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [34, 197, 94]; // Tailwind green-500
          }
        }
      }
    });
    
    doc.save(\`validades_geral_\${new Date().toISOString().split('T')[0]}.pdf\`);
  };`;

// Find the old handleExportPDF function and replace it
file = file.replace(/const handleExportPDF = \(\) => \{[\s\S]*?doc\.save.*?;\n  \};/, newPdfLogic);

fs.writeFileSync('src/pages/supervisor/SupervisorDashboard.tsx', file);
