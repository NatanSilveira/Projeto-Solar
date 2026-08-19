const fs = require('fs');
let file = fs.readFileSync('src/pages/supervisor/FormsManagement.tsx', 'utf8');
file = file.replace(`    const responsesForForm = formResponses.filter(r => {
      if (r.formId !== selectedFormForResults) return false;
      if (dateFilter) {
        const reqDate = new Date(r.submittedAt).toISOString().split('T')[0];
        if (reqDate !== dateFilter) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());`, `    const responsesForForm = formResponses.filter(r => {
      if (r.formId !== selectedFormForResults) return false;
      return true;
    }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());`);
fs.writeFileSync('src/pages/supervisor/FormsManagement.tsx', file);
