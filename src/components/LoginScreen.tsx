import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Loader2, MessageCircle } from 'lucide-react';

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const endpoint = isRegister ? '/api/register' : '/api/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '请求失败');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('player_id', data.user.id);
      localStorage.setItem('player_name', data.user.username);
      localStorage.setItem('player_avatar', data.user.avatar || '/images/ui/head_boy.png');
      localStorage.setItem('player_cards', data.user.room_cards?.toString() || '0');

      onLogin();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWechatLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/wechat-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '微信登录失败');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('player_id', data.user.id);
      localStorage.setItem('player_name', data.user.username);
      localStorage.setItem('player_avatar', data.user.avatar || '/images/ui/head_boy.png');
      localStorage.setItem('player_cards', data.user.room_cards?.toString() || '0');

      onLogin();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full min-h-[600px] flex flex-col items-center justify-center relative rounded-3xl overflow-hidden bg-[#111] border border-[#D4AF37]/20 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
      <div className="absolute inset-0 z-0">
        <img src="/images/ui/qian.png" alt="background" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/90 pointer-events-none" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm px-6 py-8"
      >
        <div className="flex flex-col items-center gap-2">
          <img src="/images/ui/logo3.png" alt="logo" className="w-24 h-24 object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.8)] mix-blend-screen" />
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFF] to-[#F2C94C] drop-shadow-md tracking-widest">
            至尊斗牛
          </h1>
          <p className="text-[#D4AF37] text-xs font-medium tracking-[0.3em]">顶级房卡棋牌大厅</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 bg-black/60 p-6 rounded-2xl border border-[#D4AF37]/20 backdrop-blur-md shadow-2xl">
          {error && <div className="text-red-500 text-sm text-center font-bold bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</div>}

          <input
            type="text"
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-[#F2C94C] outline-none transition-colors shadow-inner"
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-[#F2C94C] outline-none transition-colors shadow-inner"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F2C94C] hover:from-[#F2C94C] hover:to-[#D4AF37] text-black py-3 rounded-xl font-black text-lg shadow-[0_5px_15px_rgba(212,175,55,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegister ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />)}
            {isRegister ? '注册并登录' : '登录'}
          </button>

          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-[#D4AF37]/80 text-sm hover:text-[#D4AF37] transition-colors"
          >
            {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
          </button>
          
          <div className="relative w-full flex items-center justify-center my-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <span className="relative bg-[#1a1a1a] px-3 text-xs text-white/30 font-medium">OR</span>
          </div>

          <button
            type="button"
            onClick={handleWechatLogin}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#07C160] to-[#06ad56] hover:from-[#06ad56] hover:to-[#07C160] text-white py-3 rounded-xl font-black text-lg shadow-[0_5px_15px_rgba(7,193,96,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />}
            微信一键登录
          </button>
        </form>
      </motion.div>
    </div>
  );
}
