"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        username: formData.username,
        password: formData.password,
        redirect: false,
      });

      if (res?.error) {
        setError('Jina la mtumiaji au nenosiri si sahihi');
      } else {
        router.push("/chat");
      }
    } catch (err) {
      setError('Hitilafu imetokea. Tafadhali jaribu tena.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="glass-panel animate-fade-in p-8 md:p-12 w-full max-w-md">
        <h2 className="title-gradient text-3xl md:text-4xl mb-2 text-center font-bold">
          Karibu Tena
        </h2>
        <p className="text-[#667781] text-center mb-8 text-sm md:text-base">
          Ingia kwenye akaunti yako ya CHART BOX
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block mb-2 text-sm text-[#667781]">
              Jina la Mtumiaji (Username)
            </label>
            <input
              type="text"
              className="input-field w-full"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-[#667781]">
              Nenosiri (Password)
            </label>
            <input
              type="password"
              className="input-field w-full"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn-primary mt-4 w-full" disabled={loading}>
            {loading ? 'Inaingia...' : 'Ingia (Login)'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-[#667781]">
          Huna akaunti? <Link href="/register" className="text-[#25d366] font-medium hover:underline">Jisajili hapa</Link>
        </div>
      </div>
    </main>
  );
}
