import fs from 'fs';

const path = 'src/pages/supervisor/TeamManagement.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add editUser and resetUserPassword from useData
content = content.replace(
  'const { team, formResponses, updateUserStatus, deleteUser, stores, addTeamMember } = useData();',
  'const { team, formResponses, updateUserStatus, deleteUser, stores, addTeamMember, editUser, resetUserPassword } = useData();'
);

// Add new states
const statesToAdd = `
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [resetPasswordValue, setResetPasswordValue] = useState('');
`;

content = content.replace(
  'const [deletingId, setDeletingId] = useState<string | null>(null);',
  `const [deletingId, setDeletingId] = useState<string | null>(null);${statesToAdd}`
);

// Add handlers
const handlersToAdd = `
  const handleOpenEdit = (promoter: User) => {
    setEditName(promoter.name);
    setEditEmail(promoter.email);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPromoter) {
      await editUser(selectedPromoter.id, editName, editEmail);
      setIsEditModalOpen(false);
      setSelectedPromoter({ ...selectedPromoter, name: editName, email: editEmail });
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPromoter) {
      await resetUserPassword(selectedPromoter.id, resetPasswordValue);
      setIsResetPasswordModalOpen(false);
      setResetPasswordValue('');
      alert("Senha redefinida com sucesso.");
    }
  };
`;

content = content.replace(
  'const myTeam = team.filter(member => member.supervisorId === user?.id);',
  `${handlersToAdd}\n  const myTeam = team.filter(member => member.supervisorId === user?.id);`
);

// Add buttons in Details modal
const detailsButtons = `
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => handleOpenEdit(selectedPromoter)}
                  className="flex-1 border border-coke-gray text-coke-white py-2 rounded-xl text-xs font-bold uppercase hover:bg-coke-gray"
                >
                  Editar Dados
                </button>
                <button 
                  onClick={() => setIsResetPasswordModalOpen(true)}
                  className="flex-1 border border-coke-gray text-coke-white py-2 rounded-xl text-xs font-bold uppercase hover:bg-coke-gray"
                >
                  Resetar Senha
                </button>
              </div>
`;

content = content.replace(
  '<div className="pt-4 space-y-2">',
  `${detailsButtons}\n              <div className="pt-4 space-y-2">`
);

// Add the modals at the end
const newModals = `
      {/* EDIT PROMOTER MODAL */}
      {isEditModalOpen && selectedPromoter && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-coke-black border border-coke-gray w-full max-w-md rounded-2xl">
            <div className="p-6 border-b border-coke-gray flex justify-between items-center bg-coke-darker rounded-t-2xl">
              <h2 className="text-xl font-bold text-coke-white">Editar Promotor</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-coke-gray rounded-full text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-coke-white uppercase tracking-widest pl-1">Nome Completo</label>
                <input 
                  required
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-coke-darker border border-coke-gray rounded-xl p-4 text-coke-white focus:ring-1 focus:ring-coke-red outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-coke-white uppercase tracking-widest pl-1">Email</label>
                <input 
                  required
                  type="email" 
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-coke-darker border border-coke-gray rounded-xl p-4 text-coke-white focus:ring-1 focus:ring-coke-red outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-4 border border-coke-gray text-coke-white rounded-xl font-bold text-xs uppercase hover:bg-coke-gray transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-4 bg-coke-red text-white rounded-xl font-bold text-xs uppercase hover:bg-red-600 transition-colors shadow-lg shadow-coke-red/20"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {isResetPasswordModalOpen && selectedPromoter && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-coke-black border border-coke-gray w-full max-w-md rounded-2xl">
            <div className="p-6 border-b border-coke-gray flex justify-between items-center bg-coke-darker rounded-t-2xl">
              <h2 className="text-xl font-bold text-coke-white">Resetar Senha</h2>
              <button 
                onClick={() => setIsResetPasswordModalOpen(false)}
                className="p-2 hover:bg-coke-gray rounded-full text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
              <p className="text-sm text-text-dim">
                Defina uma nova senha para o promotor <span className="font-bold text-white">{selectedPromoter.name}</span>. Ele precisará usar esta senha no próximo login.
              </p>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-coke-white uppercase tracking-widest pl-1">Nova Senha</label>
                <input 
                  required
                  type="password" 
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="Digite a nova senha"
                  className="w-full bg-coke-darker border border-coke-gray rounded-xl p-4 text-coke-white focus:ring-1 focus:ring-coke-red outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="flex-1 px-4 py-4 border border-coke-gray text-coke-white rounded-xl font-bold text-xs uppercase hover:bg-coke-gray transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-4 bg-coke-red text-white rounded-xl font-bold text-xs uppercase hover:bg-red-600 transition-colors shadow-lg shadow-coke-red/20"
                >
                  Redefinir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
`;

content = content.replace(
  '    </div>\n  );\n}\n',
  `\n${newModals}\n    </div>\n  );\n}\n`
);

fs.writeFileSync(path, content, 'utf8');
