import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'promoter' | 'supervisor'>('promoter');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    try {
      let loggedUser;
      if (isRegistering) {
        if (!name) {
          alert('Por favor, insira seu nome.');
          setIsLoading(false);
          return;
        }
        // Force supervisor role for registration on this page
        loggedUser = await register(name, email, 'supervisor', password);
      } else {
        loggedUser = await login(email, role, password);
      }

      if (loggedUser.role === 'promoter') {
        navigate('/promoter/dashboard');
      } else {
        navigate('/supervisor/dashboard');
      }
    } catch (error) {
      // Error is handled in context (alert)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-coke-darker flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-coke-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img src="/logo-solar.png" alt="Solar Coca-Cola" className="h-[80px] object-contain" />
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-coke-black py-8 px-4 sm:rounded-2xl sm:px-10 border border-coke-gray">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {isRegistering && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-text-dim">
                  Nome Completo
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-3 py-3 border-none rounded-xl focus:ring-1 focus:ring-coke-red sm:text-sm bg-coke-gray text-coke-white placeholder-text-dim outline-none"
                    placeholder="Seu nome"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-coke-white uppercase tracking-wider mb-1">
                Email corporativo
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-coke-gray rounded-xl focus:ring-1 focus:ring-coke-red sm:text-sm bg-coke-darker text-coke-white placeholder-text-dim outline-none"
                  placeholder="ex: voce@solar.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" name="password" className="block text-sm font-bold text-coke-white uppercase tracking-wider mb-1">
                Senha de Acesso
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-coke-gray rounded-xl focus:ring-1 focus:ring-coke-red sm:text-sm bg-coke-darker text-coke-white placeholder-text-dim outline-none"
                  placeholder="********"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-coke-white uppercase tracking-wider mb-2">
                Perfil de {isRegistering ? 'Acesso' : 'Acesso'}
              </label>
              {!isRegistering ? (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole('promoter')}
                    className={`py-3 px-4 border rounded-xl text-sm font-medium transition-colors ${
                      role === 'promoter'
                        ? 'border-danger bg-danger/10 text-danger'
                        : 'border-coke-gray text-text-dim hover:bg-coke-gray'
                    }`}
                  >
                    Promotor
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('supervisor')}
                    className={`py-3 px-4 border rounded-xl text-sm font-medium transition-colors ${
                      role === 'supervisor'
                        ? 'border-danger bg-danger/10 text-danger'
                        : 'border-coke-gray text-text-dim hover:bg-coke-gray'
                    }`}
                  >
                    Supervisor
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-coke-darker border border-coke-gray rounded-xl">
                  <p className="text-[10px] text-text-dim uppercase font-bold text-center">
                    Você está se cadastrando como <span className="text-coke-red">Supervisor</span>
                  </p>
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 rounded-xl text-xs font-bold text-white bg-coke-red hover:bg-coke-red/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-coke-black focus:ring-coke-red transition-colors uppercase disabled:opacity-50"
              >
                {isLoading ? 'Aguarde...' : (isRegistering ? 'Criar Conta' : 'Entrar no Sistema')}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-coke-red hover:underline font-medium"
            >
              {isRegistering ? 'Já tem uma conta? Entrar' : 'Não tem conta? Cadastrar-se'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
