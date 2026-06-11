'use client';

import { useState } from 'react';
import { loginAdminAction } from '../actions';
import { toast } from 'sonner';

export function AdminLogin() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('password', password);

    const res = await loginAdminAction(formData);
    if (res?.error) {
      toast.error(res.error);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <div>
        <label className="info-label mb-1.5 block">Senha de acesso</label>
        <input 
          type="password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          className="input" 
          placeholder="••••••••" 
          required 
          autoFocus 
        />
      </div>
      <button 
        type="submit" 
        disabled={loading || !password} 
        className="btn btn-primary w-full"
      >
        {loading ? 'Verificando...' : 'Entrar no painel'}
      </button>
      <p className="text-center text-[11px] font-medium text-[var(--text-muted)]">Sessão expira automaticamente após 8 horas.</p>
    </form>
  );
}
