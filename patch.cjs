const fs = require('fs');
let file = fs.readFileSync('src/pages/supervisor/TeamManagement.tsx', 'utf8');
file = file.replace("const [editEmail, setEditEmail] = useState('');", "const [editEmail, setEditEmail] = useState('');\n  const [editStoreId, setEditStoreId] = useState('');");
file = file.replace("setIsEditModalOpen(true);", "setEditStoreId(promoter.storeId || '');\n    setIsEditModalOpen(true);");
file = file.replace("await editUser(selectedPromoter.id, editName, editEmail);", "await editUser(selectedPromoter.id, editName, editEmail, editStoreId || undefined);");
file = file.replace("name: editName, email: editEmail });", "name: editName, email: editEmail, storeId: editStoreId || undefined });");
fs.writeFileSync('src/pages/supervisor/TeamManagement.tsx', file);
