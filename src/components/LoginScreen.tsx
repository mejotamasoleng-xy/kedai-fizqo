import React, { useState } from 'react';
import { Coffee, Shield, Eye, EyeOff, KeyRound } from 'lucide-react';
import { User } from '../types';

interface LoginScreenProps {
  usersList: User[];
  onLoginSuccess: (user: User) => void;
  cafeName: string;
}

export default function LoginScreen({ usersList, onLoginSuccess, cafeName }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Harap isi username dan password lengkap!');
      return;
    }

    const matched = usersList.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (!matched) {
      setErrorMsg('Username tidak terdaftar!');
      return;
    }

    // Check password
    if (matched.password !== password) {
      setErrorMsg('Password salah! Harap periksa kembali.');
      return;
    }

    if (!matched.active) {
      setErrorMsg('Akun Anda dinonaktifkan oleh owner.');
      return;
    }

    // Success
    onLoginSuccess(matched);
  };

  return (
    <div id="login-container" className="fixed inset-0 z-50 flex items-center justify-center bg-[#F3F5F4] font-sans text-slate-800">
      {/* Visual Ambient Grid Backdrops */}
      <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
      
      <div className="w-full max-w-md p-6 z-10 space-y-8">
        {/* Title branding header */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-[#123524] border border-[#2C4737] flex items-center justify-center text-[#85A947] text-2xl font-extrabold shadow-sm transition-all">
            <Coffee className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-widest text-[#123524] uppercase pt-2">FIZQO CAFE OS</h2>
          <p className="text-[10px] text-[#4D7C0F] uppercase font-mono tracking-widest leading-none font-bold">
            {cafeName || 'Operating System'}
          </p>
        </div>

        {/* Bento Lock-card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 bg-slate-50 rounded-bl-xl border-l border-b border-slate-200">
            <KeyRound className="h-4 w-4 text-[#4D7C0F]" />
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <p className="text-xs font-bold text-[#123524] uppercase font-mono tracking-wide border-b border-slate-100 pb-1.5 mb-4">
                Sistem Otentikasi Petugas
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-mono font-bold leading-normal">
                ⚠️ {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1 font-bold">Username Akun</label>
              <input
                id="login-username"
                type="text"
                autoFocus
                placeholder="Contoh: admin atau kasir"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-[#85A947] rounded-xl text-xs text-slate-900 focus:outline-none transition font-sans font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1 font-bold">Password Keamanan</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan kata sandi..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-[#85A947] rounded-xl text-xs text-slate-900 focus:outline-none transition font-sans font-semibold pr-10"
                />
                <button
                  type="button"
                  id="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
               type="submit"
               id="login-submit"
               className="w-full py-3 bg-[#123524] text-white hover:bg-[#1A3F2C] font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md transform active:scale-[0.98] mt-3 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Shield className="h-4 w-4" />
              <span>Masuk Sekarang</span>
            </button>
          </form>

          {/* Prompt info */}
          <div className="mt-5 pt-3.5 border-t border-slate-100 text-[10px] text-slate-500 font-mono text-center">
            <span>Silakan hubungi owner untuk pendaftaran atau reset akun.</span>
          </div>
        </div>

        <div className="text-center font-mono text-[9px] text-slate-400">
          Kedai Fizqo OS Security Shield • v1.0 • Stable Release
        </div>
      </div>
    </div>
  );
}
