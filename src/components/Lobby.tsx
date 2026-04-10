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
            className="relative h-32 rounded-2xl p-4 flex flex-col justify-end overflow-hidden cursor-pointer shadow-lg border border-[#D4AF37]/50"
            style={{
              background: 'linear-gradient(135deg, #2a1f1f 0%, #4a2f2f 100%)',
              boxShadow: 'inset 0 0 20px rgba(212, 175, 55, 0.2), 0 10px 20px rgba(0,0,0,0.5)'
            }}
          >
            {/* Dark gold stroke & glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/10 to-transparent pointer-events-none" />
            <div className="absolute inset-0 border border-[#D4AF37]/30 rounded-2xl pointer-events-none" />
            
            <h3 className="text-xl font-black text-[#FDFBF7] drop-shadow-md z-10">{game.name}</h3>
            {game.tag && (
              <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-md z-10">
                {game.tag}
              </div>
            )}
            
            {/* Background icon/pattern */}
            <Gamepad2 className="absolute top-4 right-4 w-12 h-12 text-[#D4AF37]/20 pointer-events-none" />
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderRoom = () => (
    <div className="flex-1 flex flex-col pt-4 px-4 pb-24">
      <div className="flex justify-between mb-4">
        <button className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/10 text-sm">
          <Search className="w-4 h-4" /> 切换
        </button>
        <button className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/10 text-sm">
          <RefreshCw className="w-4 h-4" /> 刷新
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-white/50 text-sm tracking-widest font-bold bg-black/30 p-8 rounded-3xl border border-white/5">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
          加入公会后，等待会长开房
        </div>
      </div>
    </div>
  );

  const renderMine = () => (
    <div className="flex-1 flex flex-col pt-4 px-4 pb-24 gap-4 overflow-y-auto">
      {/* Profile Card */}
      <div className="bg-gradient-to-r from-[#2a1f1f] to-[#4a2f2f] rounded-3xl p-6 border border-[#D4AF37]/30 shadow-xl flex items-center gap-4">
        <div className="w-20 h-20 rounded-full border-2 border-[#D4AF37] p-1 bg-black/50">
          <img src="/images/ui/head_boy.png" alt="avatar" className="w-full h-full rounded-full object-cover" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">{tempName || '默认玩家'}</h2>
          <p className="text-sm text-[#D4AF37] font-medium mt-1">ID: 888888</p>
        </div>
      </div>

      {/* Settings List */}
      <div className="bg-black/40 rounded-3xl border border-white/10 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/5 cursor-pointer hover:bg-white/5">
          <div className="flex items-center gap-3 text-white/90">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <span className="font-bold">聊天室</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3 text-white/90">
            <Settings className="w-5 h-5 text-purple-400" />
            <span className="font-bold">管理功能</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" onChange={(e) => {
              if(e.target.checked) {
                window.open('http://localhost:3000', '_blank');
                setTimeout(() => e.target.checked = false, 500); // reset visually
              }
            }} />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border-b border-white/5 cursor-pointer hover:bg-white/5">
          <div className="flex items-center gap-3 text-white/90">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <span className="font-bold">修改手机</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5">
          <div className="flex items-center gap-3 text-white/90">
            <Package className="w-5 h-5 text-yellow-500" />
            <span className="font-bold">房卡包</span>
          </div>
          <span className="text-sm text-white/50">0张</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src="/images/ui/qian.png" alt="background" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#1a1a1a]" />
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
      <nav className="absolute bottom-0 left-0 right-0 z-20 h-20 bg-black/80 backdrop-blur-xl border-t border-white/10 flex justify-around items-center px-6 pb-safe">
        <button 
          onClick={() => setActiveTab('hall')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'hall' ? 'text-[#D4AF37]' : 'text-white/50 hover:text-white/80')}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold">大厅</span>
        </button>
        <button 
          onClick={() => setActiveTab('room')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'room' ? 'text-[#D4AF37]' : 'text-white/50 hover:text-white/80')}
        >
          <LayoutGrid className="w-6 h-6" />
          <span className="text-[10px] font-bold">开房</span>
        </button>
        <button 
          onClick={() => setActiveTab('mine')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'mine' ? 'text-[#D4AF37]' : 'text-white/50 hover:text-white/80')}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-bold">我的</span>
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
