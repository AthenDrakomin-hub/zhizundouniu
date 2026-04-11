import React from 'react';
import { motion } from 'motion/react';
import { Zap } from 'lucide-react';

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const handleQuickLogin = () => {
    if (!localStorage.getItem('player_id')) {
      const storedId = Math.random().toString(36).substr(2, 9);
      const tempName = `游客${Math.floor(Math.random() * 9000) + 1000}`;
      localStorage.setItem('player_id', storedId);
      localStorage.setItem('player_name', tempName);
      // random avatar 1 or 2
      localStorage.setItem('player_avatar', Math.random() > 0.5 ? '/images/ui/head_boy.png' : '/images/ui/head_girl.png');
    }
    onLogin();
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#111] overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src="/images/ui/qian.png" alt="background" className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/90 pointer-events-none" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm px-6"
      >
        <div className="flex flex-col items-center gap-4">
          <img src="/images/ui/logo3.png" alt="logo" className="w-32 h-32 object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.8)] mix-blend-screen" />
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFF] to-[#F2C94C] drop-shadow-md tracking-widest">
            至尊斗牛
          </h1>
          <p className="text-[#D4AF37] text-sm font-medium tracking-[0.3em]">顶级房卡棋牌大厅</p>
        </div>

        <button
          onClick={handleQuickLogin}
          className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#FFD700] hover:to-[#D4AF37] text-black py-4 rounded-2xl font-black text-xl shadow-[0_10px_30px_rgba(212,175,55,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Zap className="w-6 h-6" /> 一键快速登录
        </button>
        
        <p className="text-white/40 text-xs text-center mt-4">
          无需注册，系统自动分配专属游客账号
        </p>
      </motion.div>
    </div>
  );
}
