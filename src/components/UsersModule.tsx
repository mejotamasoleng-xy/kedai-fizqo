import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { UserPlus, Search, UserCheck, ShieldAlert, Key, Trash2, ShieldCheck } from 'lucide-react';

interface UsersModuleProps {
  usersList: User[];
  onCreateUser: (newUser: User) => void;
  onToggleUserStatus: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  currentUser: User;
  onAddAuditLog: (action: string, module: string, details: string) => void;
}

export default function UsersModule({
  usersList,
  onCreateUser,
  onToggleUserStatus,
  onDeleteUser,
  currentUser,
  onAddAuditLog
}: UsersModuleProps) {
  // Form input states
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !name.trim() || !password.trim()) {
      alert('⚠️ Harap isi semua kolom formulir pendaftaran!');
      return;
    }

    // Check duplicate
    const exists = usersList.some(
      u => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (exists) {
      alert(`⚠️ Username "${username}" sudah digunakan! Sediakan username unik.`);
      return;
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      username: username.trim().toLowerCase(),
      name: name.trim(),
      role,
      active: true,
      password: password
    };

    onCreateUser(newUser);
    onAddAuditLog(
      'Create User',
      'User Accounts',
      `Registered path user ${newUser.name} with role [${newUser.role}]`
    );

    // Reset Form
    setUsername('');
    setName('');
    setPassword('');
    setRole('cashier');
    alert(`✅ Berhasil mendaftarkan akun baru: ${newUser.name} (${newUser.role})!`);
  };

  const filteredUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6 h-full overflow-y-auto font-sans">
      
      {/* Grid: Form on Left, Accounts list on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Create User Card (Left Column) */}
        <div className="lg:col-span-1 bento-card space-y-4 text-slate-800 border border-slate-200 shadow-sm bg-white">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <UserPlus className="h-4.5 w-4.5 text-[#123524]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">BUAT AKUN BARU (REGISTER)</h3>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1 font-bold">Nama Lengkap Petugas *</label>
              <input
                id="user-full-name"
                type="text"
                placeholder="Contoh: Muhammad Rian"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-855 placeholder-slate-400 font-semibold focus:outline-none focus:border-[#85A947]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1 font-bold">Username Akun *</label>
              <input
                id="user-username"
                type="text"
                placeholder="Contoh: rian_kasir"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-855 placeholder-slate-400 focus:outline-none focus:border-[#85A947] font-bold font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1 font-bold">Password Login *</label>
              <input
                id="user-password"
                type="password"
                placeholder="Masukkan kata sandi..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-855 placeholder-slate-400 focus:outline-none focus:border-[#85A947] font-bold font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1 font-bold">Hak Akses (Role) *</label>
              <select
                id="user-role-select"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#85A947]"
              >
                <option value="cashier">Cashier (Akses POS & Pengeluaran)</option>
                <option value="manager">Manager (Akses Gudang, Recipes & Reports)</option>
                <option value="owner">Owner (Akses Penuh + Security & Akun)</option>
              </select>
            </div>

            <button
              type="submit"
              id="user-submit-btn"
              className="w-full py-2.5 bg-[#123524] border border-[#1A3F2C] hover:bg-[#1A3F2C] font-extrabold text-xs uppercase tracking-wider text-white rounded-xl transition shadow-xs cursor-pointer"
            >
              Daftarkan Petugas Baru
            </button>
          </form>
        </div>

        {/* Directory Accounts List (Right Column - span 2) */}
        <div className="lg:col-span-2 bento-card space-y-4 text-slate-800 border border-slate-200 bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4.5 w-4.5 text-[#123524]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex-1">REKAPAN AKUN PETUGAS AKTIF</h3>
            </div>

            {/* Micro search filter */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                id="user-dir-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, user, atau hak..."
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10.5px] text-slate-800 font-semibold placeholder-slate-400 focus:outline-none focus:border-[#85A947]"
              />
            </div>
          </div>

          {/* Accounts Grid or Tables */}
          <div className="overflow-x-auto rounded-xl border border-slate-150">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50 font-mono font-bold">
                  <th className="p-3">Nama Petugas</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Password</th>
                  <th className="p-3">Role Status</th>
                  <th className="p-3 text-center">Status Keaktifan</th>
                  <th className="p-3 text-right">Aksi Akun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans font-medium text-slate-700">
                {filteredUsers.map((u) => {
                  const isSelf = u.id === currentUser.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900">
                        {u.name} {isSelf && <span className="text-[9px] text-[#4D7C0F] font-bold font-mono">(Anda)</span>}
                      </td>
                      <td className="p-3 font-mono text-slate-600 font-semibold">{u.username}</td>
                      <td className="p-3 font-mono text-slate-400 flex items-center gap-1 font-semibold">
                        <Key className="h-3 w-3 shrink-0 text-slate-500" />
                        <span>{u.password || '******'}</span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-black border ${
                          u.role === 'owner' 
                            ? 'bg-green-50 text-green-800 border-green-200' 
                            : u.role === 'manager'
                            ? 'bg-cyan-50 border-cyan-200 text-cyan-800'
                            : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          id={`toggle-status-${u.id}`}
                          onClick={() => !isSelf && onToggleUserStatus(u.id)}
                          disabled={isSelf}
                          className={`px-2 py-0.5 rounded text-[8.5px] font-mono uppercase font-black transition-all border ${
                            u.active 
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 cursor-pointer' 
                              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 cursor-pointer'
                          } ${isSelf ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={isSelf ? 'Tidak bisa menonaktifkan akun sendiri!' : 'Klik untuk ubah status keaktifan akun'}
                        >
                          {u.active ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          id={`delete-user-${u.id}`}
                          onClick={() => {
                            if (isSelf) {
                              alert('⚠️ Anda tidak bisa menghapus akun Anda sendiri yang sedang aktif!');
                              return;
                            }
                            if (confirm(`Apakah Anda yakin ingin menghapus akun ${u.name}?`)) {
                              onDeleteUser(u.id);
                              onAddAuditLog('Delete Account', 'User Accounts', `Deleted account of ${u.name} (${u.username})`);
                            }
                          }}
                          disabled={isSelf}
                          className={`text-red-650 hover:text-red-700 hover:underline transition shrink-0 ${isSelf ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                          title="Hapus akun dari sistem"
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-bold font-mono">
                      Tidak ada akun petugas yang cocok dengan pencarian Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>

    </div>
  );
}
