const fs = require('fs');
let file = fs.readFileSync('src/pages/supervisor/SupervisorDashboard.tsx', 'utf8');

// Remove stackId="a" from Bar components
file = file.replace(/stackId="a"\s*/g, '');

fs.writeFileSync('src/pages/supervisor/SupervisorDashboard.tsx', file);
