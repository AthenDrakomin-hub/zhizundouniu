import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Gamepad2, User, Search, RefreshCw, Smartphone, Package, Shield, LayoutGrid, X, MessageSquare, Settings, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface LobbyProps {
  onJoin: (roomId: string, name: string) => void;
  tempName: string;
  setTempName: (name: string) => void;
  roomId: string;
  setRoomId: (id: string) => void;
}

export function Lobby({ onJoin, tempName, setTempName, roomId, setRoomId }: LobbyProps) {
  const [activeTab, setActiveTab] = useState<'hall' | 'room' | 'mine'>('hall');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.length === 6 && tempName) {
      onJoin(roomId, tempName);
    }
  };

  const renderHall = () => (
    <div className="flex-1 overflow-y-auto pb-24 pt-4 px-4">
      {/* Grid of games */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { id: 'bull', name: '斗牛集合', tag: '火爆' },
          { id: 'sangong', name: '三公集合' },
          { id: 'zhajinhua', name: '炸金花集合', tag: '经典' },
          { id: 'paijiu', name: '牌九合集' },
          { id: 'doudizhu', name: '欢乐斗地主' },
          { id: 'majiang', name: '血战麻将' }
        ].map((game) => (
          <motion.div
            key={game.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenModal}
            className="relative h-32 rounded-2xl p-4 flex flex-col justify-end overflow-hidden cursor-pointer shadow-lg border-2 border-[#D4AF37]/80"
            style={{
              background: 'linear-gradient(135deg, #1A8A7A 0%, #0A4F46 100%)',
              boxShadow: 'inset 0 0 30px rgba(212, 175, 55, 0.3), 0 10px 20px rgba(0,0,0,0.5)'
            }}
          >
            {/* Dark gold stroke & glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent pointer-events-none" />
            
            <h3 className="text-xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-10 text-center uppercase tracking-widest bg-gradient-to-b from-[#FFF] to-[#F2C94C] bg-clip-text text-transparent" style={{ WebkitTextStroke: '1px #4A2F00' }}>
              {game.name}
            </h3>
            {game.tag && (
              <div className="absolute top-2 left-2 bg-gradient-to-b from-[#FF4500] to-[#8B0000] border border-[#FFD700] text-[#FFF] text-[10px] px-2 py-0.5 rounded-full font-black shadow-md z-10">
                {game.tag}
              </div>
            )}

            {/* Background icon/pattern */}
            <Gamepad2 className="absolute top-4 right-4 w-12 h-12 text-[#D4AF37]/30 pointer-events-none drop-shadow-md" />
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderRoom = () => (
    <div className="flex-1 flex flex-col pt-4 px-4 pb-24 relative">
      <div className="flex justify-between items-center z-10 mb-4">
        <button className="flex items-center gap-2 bg-gradient-to-b from-[#FFF] to-[#E0E0E0] text-[#333] font-bold px-4 py-1.5 rounded-lg border border-[#D4AF37] shadow-md active:scale-95 transition-transform">
          <Search className="w-4 h-4 text-[#D4AF37]" /> 切换
        </button>
        <button className="flex items-center gap-2 bg-gradient-to-b from-[#FFF] to-[#E0E0E0] text-[#333] font-bold px-4 py-1.5 rounded-lg border border-[#D4AF37] shadow-md active:scale-95 transition-transform">
          刷新 <RefreshCw className="w-4 h-4 text-[#D4AF37]" />
        </button>
      </div>
      <div className="absolute top-16 right-4 z-10">
        <button className="bg-black/50 backdrop-blur-md text-[#D4AF37] border border-[#D4AF37]/50 text-xs px-3 py-1.5 rounded-full shadow-lg active:scale-95">
          复制链接
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="text-center">
          <h2 className="text-[#FFD700] text-xl font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-widest bg-black/40 px-6 py-3 rounded-full border border-white/10 backdrop-blur-sm">
            加入公会后，等待会长开房
          </h2>
        </div>
      </div>
    </div>
  );

  const renderMine = () => (
    <div className="flex-1 flex flex-col pt-4 px-4 pb-24 gap-4 overflow-y-auto">
      {/* Profile Card */}
      <div className="bg-gradient-to-r from-[#3C1B22] to-[#5C2D38] rounded-2xl p-4 border border-[#D4AF37]/50 shadow-[0_10px_20px_rgba(0,0,0,0.5)] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl border-2 border-[#D4AF37] p-0.5 bg-black/50 shadow-inner">
            <img src="/images/ui/head_boy.png" alt="avatar" className="w-full h-full rounded-xl object-cover" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white drop-shadow-md">{tempName || '默认玩家'}</h2>
            <p className="text-xs text-[#D4AF37] font-medium mt-1 tracking-widest">ID: {Math.floor(Math.random() * 9000000) + 1000000}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button className="bg-gradient-to-r from-[#4A2F2F] to-[#2A1F1F] border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-bold px-3 py-1.5 rounded-lg shadow-md active:scale-95">复制 ID</button>
          <button className="bg-gradient-to-r from-[#8B0000] to-[#4B0000] border border-[#D4AF37]/50 text-[#FDFBF7] text-xs font-bold px-3 py-1.5 rounded-lg shadow-md active:scale-95">修改头像</button>
        </div>
      </div>

      {/* Settings List */}
      <div className="flex flex-col gap-3 mt-2">
        <div className="bg-gradient-to-r from-[#5C2D38] to-[#4A1A24] rounded-xl border border-white/10 flex items-center justify-between p-4 cursor-pointer shadow-lg active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-3 text-white">
            <MessageSquare className="w-5 h-5 text-[#87CEEB]" />
            <span className="font-bold tracking-widest">聊天室</span>
          </div>
          <ArrowRight className="w-4 h-4 text-white/30" />
        </div>

        <div className="bg-gradient-to-r from-[#5C2D38] to-[#4A1A24] rounded-xl border border-white/10 flex items-center justify-between p-4 shadow-lg">
          <div className="flex items-center gap-3 text-white">
            <Settings className="w-5 h-5 text-[#FFD700]" />
            <span className="font-bold tracking-widest">管理功能</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" onChange={(e) => {
              if(e.target.checked) {
                window.open('http://localhost:3000', '_blank');
                setTimeout(() => e.target.checked = false, 500); // reset visually
              }
            }} />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#D4AF37] peer-checked:to-[#F2C94C]"></div>
          </label>
        </div>

        <div className="bg-gradient-to-r from-[#5C2D38] to-[#4A1A24] rounded-xl border border-white/10 flex items-center justify-between p-4 cursor-pointer shadow-lg active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-3 text-white">
            <Smartphone className="w-5 h-5 text-[#98FB98]" />
            <span className="font-bold tracking-widest">修改手机</span>
          </div>
          <ArrowRight className="w-4 h-4 text-white/30" />
        </div>

        <div className="bg-gradient-to-r from-[#5C2D38] to-[#4A1A24] rounded-xl border border-white/10 flex items-center justify-between p-4 cursor-pointer shadow-lg active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-3 text-white">
            <Shield className="w-5 h-5 text-[#87CEEB]" />
            <span className="font-bold tracking-widest">密钥设置</span>
          </div>
          <ArrowRight className="w-4 h-4 text-white/30" />
        </div>

        <div className="bg-gradient-to-r from-[#5C2D38] to-[#4A1A24] rounded-xl border border-white/10 flex items-center justify-between p-4 cursor-pointer shadow-lg active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-3 text-white">
            <Package className="w-5 h-5 text-[#FFD700]" />
            <span className="font-bold tracking-widest">房卡包</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/70 font-bold">剩余0张</span>
            <ArrowRight className="w-4 h-4 text-white/30" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src="/images/ui/qian.png" alt="background" className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/90 pointer-events-none" />
      </div>

      {/* Header */}
      <header className="relative z-10 h-16 bg-black/50 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-[#D4AF37] p-0.5 overflow-hidden">
            <img src="/images/ui/head_boy.png" alt="avatar" className="w-full h-full rounded-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold">{tempName || '默认玩家'}</span>
            <div className="flex items-center gap-1 text-[10px] text-[#D4AF37]">
              <Package className="w-3 h-3" />
              <span>房卡: 0</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
            商城
          </button>
          <img src="/images/ui/logo3.png" alt="logo" className="w-10 h-10 object-contain drop-shadow-lg mix-blend-screen" />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-hidden flex flex-col">
        {activeTab === 'hall' && renderHall()}
        {activeTab === 'room' && renderRoom()}
        {activeTab === 'mine' && renderMine()}
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 z-20 h-20 flex justify-around items-center px-6 pb-safe border-t-2 border-[#D4AF37]/50 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]"
           style={{ background: 'linear-gradient(to bottom, #E8DCC4, #B89C6A)' }}>
        <button
          onClick={() => setActiveTab('hall')}
          className={cn("flex flex-col items-center justify-center gap-1 transition-all h-full w-24 relative", activeTab === 'hall' ? 'text-[#6A3F1A]' : 'text-[#8C6B45]')}
        >
          {activeTab === 'hall' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#FFF] to-transparent shadow-[0_0_10px_#FFF]" />}
          <Home className={cn("w-7 h-7 drop-shadow-md", activeTab === 'hall' && 'scale-110')} />
          <span className="text-[12px] font-black drop-shadow-sm">大厅</span>
        </button>
        <button
          onClick={() => setActiveTab('room')}
          className={cn("flex flex-col items-center justify-center gap-1 transition-all h-full w-24 relative", activeTab === 'room' ? 'text-[#6A3F1A]' : 'text-[#8C6B45]')}
        >
          {activeTab === 'room' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#FFF] to-transparent shadow-[0_0_10px_#FFF]" />}
          <LayoutGrid className={cn("w-7 h-7 drop-shadow-md", activeTab === 'room' && 'scale-110')} />
          <span className="text-[12px] font-black drop-shadow-sm">开房</span>
        </button>
        <button
          onClick={() => setActiveTab('mine')}
          className={cn("flex flex-col items-center justify-center gap-1 transition-all h-full w-24 relative", activeTab === 'mine' ? 'text-[#6A3F1A]' : 'text-[#8C6B45]')}
        >
          {activeTab === 'mine' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#FFF] to-transparent shadow-[0_0_10px_#FFF]" />}
          <User className={cn("w-7 h-7 drop-shadow-md", activeTab === 'mine' && 'scale-110')} />
          <span className="text-[12px] font-black drop-shadow-sm">我的</span>
        </button>
      </nav>

      {/* Game Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={handleCloseModal}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="relative w-full max-w-sm bg-slate-900/90 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl p-6"
            >
              <button 
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-white/50 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-white mb-2">加入/创建对局</h2>
                <p className="text-sm text-white/50">输入您的名字和房号</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative bg-black/50 rounded-xl overflow-hidden flex items-center px-4 h-[56px] border border-white/10 focus-within:border-[#D4AF37] transition-colors">
                  <span className="text-[#D4AF37] font-bold text-sm min-w-[40px]">大名</span>
                  <div className="w-[1px] h-4 bg-white/20 mx-3" />
                  <input
                    type="text"
                    placeholder="请输入您的名字"
                    value={tempName}
                    onChange={e => setTempName(e.target.value)}
                    className="flex-1 bg-transparent text-white outline-none placeholder:text-white/30"
                    required
                  />
                </div>

                <div className="relative bg-black/50 rounded-xl overflow-hidden flex items-center px-4 h-[56px] border border-white/10 focus-within:border-[#D4AF37] transition-colors">
                  <span className="text-[#D4AF37] font-bold text-sm min-w-[40px]">房号</span>
                  <div className="w-[1px] h-4 bg-white/20 mx-3" />
                  <input
                    type="text"
                    placeholder="6位房间钥匙"
                    value={roomId}
                    onChange={e => setRoomId(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="flex-1 bg-transparent text-[#F2C94C] text-lg font-black tracking-widest outline-none placeholder:text-white/30 placeholder:tracking-normal uppercase"
                    required
                  />
                </div>

                <button 
                  type="submit"
                  disabled={roomId.length !== 6 || !tempName}
                  className="w-full mt-4 bg-gradient-to-r from-[#D4AF37] to-[#F2C94C] text-black font-black text-lg py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 transition-all"
                >
                  加入 / 创建房间
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
