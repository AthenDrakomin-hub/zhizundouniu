import React, { useState, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { ShieldCheck, ArrowRight, Zap, Key, Plus, ChevronRight, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Room, Card } from '../../src/types';
import { getWinningCards } from '../../src/lib/gameLogic';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getSocketUrl = () => {
  if (!import.meta.env.PROD) return 'http://localhost:3000';
  // Use app.yefeng.us.cc directly for the backend connection to avoid Nginx proxy issues on admin domain
  if (window.location.hostname.includes('yefeng.us.cc')) {
    return 'https://app.yefeng.us.cc';
  }
  if (window.location.hostname.startsWith('admin.')) {
    return window.location.origin.replace('admin.', 'app.');
  }
  return window.location.origin;
};

const socket: Socket = io(getSocketUrl(), {
  path: '/socket.io/',
  transports: ['websocket', 'polling']
});

const SUITS = ['♠', '♥', '♣', '♦'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export default function App() {
  const [adminKey, setAdminKey] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  
  // System Config State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [systemConfig, setSystemConfig] = useState({
    alipayQrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=alipay_qr_placeholder&color=000000&bgcolor=ffffff',
    usdtQrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=usdt_qr_placeholder&color=000000&bgcolor=ffffff',
    usdtAddress: 'T_YOUR_USDT_ADDRESS_HERE'
  });

  useEffect(() => {
    socket.on('adminLoginSuccess', (rooms: Room[]) => {
      setIsLoggedIn(true);
      setAllRooms(rooms);
      socket.emit('getSystemConfig');
    });

    socket.on('systemConfigUpdated', (config: any) => {
      setSystemConfig(config);
    });

    socket.on('adminRoomsUpdate', (rooms: Room[]) => {
      setAllRooms(rooms);
    });

    socket.on('roomUpdate', (roomData: Room) => {
      setRoom(roomData);
    });

    socket.on('connect_error', (err) => {
      showToast('连接服务器失败，请检查网络或后端服务状态: ' + err.message);
    });

    socket.on('error', (msg) => {
      showToast('错误: ' + msg);
    });

    return () => {
      socket.off('adminLoginSuccess');
      socket.off('systemConfigUpdated');
      socket.off('adminRoomsUpdate');
      socket.off('roomUpdate');
      socket.off('connect_error');
      socket.off('error');
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket.connected) {
      showToast('⚠️ 服务器尚未连接，请稍后再试');
      return;
    }
    showToast('正在登入...');
    socket.emit('adminLogin', { adminKey });
  };

  const handleCreateRoom = () => {
    socket.emit('adminCreateRoom');
  };

  const handleJoinRoom = (roomId: string) => {
    socket.emit('adminJoinRoom', { roomId });
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2000);
  };

  const handleSelectDeckCard = (card: Card) => {
    if (!selectedPlayerId || !room) return;
    socket.emit('forceChangeCard', { roomId: room.id, targetId: selectedPlayerId, newCard: card });
    setSelectedPlayerId(null);
    showToast('改牌成功');
  };

  // Smart assist
  const winningCards = useMemo(() => {
    if (!selectedPlayerId || !room) return [];
    const player = room.players.find(p => p.id === selectedPlayerId);
    if (!player || player.cards.length < 4) return [];
    return getWinningCards(player.cards.slice(0, 4), room.remainingDeck || []);
  }, [selectedPlayerId, room]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center p-4 relative overflow-hidden">
        {toastMsg && (
          <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-red-600 border border-red-400 text-white px-8 py-3 rounded-full font-black shadow-[0_0_30px_rgba(220,38,38,0.6)] z-50 text-sm whitespace-nowrap">
            {toastMsg}
          </div>
        )}
        {/* Immersive Background Image */}
        <div className="absolute inset-0 z-[-10]">
          <img src="/images/ui/hou.png" alt="background" loading="lazy" className="w-full h-full object-cover scale-105" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/80" />
        </div>
        
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-900/30 blur-[120px] rounded-full pointer-events-none z-[-5]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-slate-900/40 blur-[100px] rounded-full pointer-events-none z-[-5]" />

        <div className="relative z-10 w-full max-w-[360px]">
          {/* Glass Card (Dark red tint like screenshot) */}
          <div className="bg-[#2a0808]/80 backdrop-blur-2xl border border-red-500/20 p-8 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden">
            
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-4">
                {/* Logo with rounded mask and red glow border */}
                <div className="w-20 h-20 bg-black border border-red-500/50 rounded-2xl overflow-hidden flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.5)] relative z-10">
                  <img src="/images/ui/logo3.png" alt="Logo" loading="lazy" className="w-full h-full object-cover" />
                </div>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white/90 mb-1">至尊控制台</h1>
              <p className="text-white/40 text-[10px] tracking-[0.2em] font-medium uppercase">Supreme Admin Console</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-widest text-white/50 uppercase px-1">安全认证秘钥</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-white/30 group-focus-within:text-red-400 transition-colors">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    placeholder="请输入 admin123"
                    value={adminKey}
                    onChange={e => setAdminKey(e.target.value)}
                    className="w-full bg-[#150505] border border-red-500/20 rounded-2xl py-4 pl-12 pr-4 text-sm font-mono tracking-widest text-white focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 outline-none transition-all placeholder:text-white/20 placeholder:tracking-normal shadow-inner"
                    required
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-[#10b981] hover:bg-[#059669] text-black font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 group mt-4"
              >
                授权登入
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // 1. 首页：房卡管理与活跃房间列表
  if (!room) {
    const activeRooms = allRooms.filter(r => r.status !== 'game_over');

    return (
      <div className="min-h-screen text-white relative overflow-hidden flex justify-center">
        {toastMsg && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-600 border border-red-400 text-white px-8 py-3 rounded-full font-black shadow-[0_0_30px_rgba(220,38,38,0.6)] z-50 text-sm whitespace-nowrap">
            {toastMsg}
          </div>
        )}
        {/* Immersive Red Bull Background */}
        <div className="absolute inset-0 z-[-10]">
          <img src="/images/ui/hou.png" alt="background" className="w-full h-full object-cover scale-105" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />
        </div>
        
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-900/30 blur-[120px] rounded-full pointer-events-none z-[-5]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-slate-900/40 blur-[100px] rounded-full pointer-events-none z-[-5]" />

        <div className="w-full max-w-md p-4 relative z-10">
          <div className="flex items-center justify-between mb-8 mt-4">
            <div className="flex items-center gap-3 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
              <img src="/images/ui/logo3.png" alt="Logo" className="w-8 h-8 object-contain" />
              <h1 className="font-black text-xl tracking-wider">控制大盘</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={() => {
                if (confirm('警告：此操作将清空服务器所有房间数据和缓存！确定执行吗？')) {
                  socket.emit('adminResetAll');
                }
              }} className="text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white transition-colors uppercase tracking-widest border border-red-500/50 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-[0_0_10px_rgba(239,68,68,0.2)]">初始化数据</button>
              <button onClick={() => window.location.reload()} className="text-xs font-bold text-white/50 hover:text-white transition-colors uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full backdrop-blur-sm">退出</button>
            </div>
          </div>

          {/* 顶部看板 */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div className="text-[10px] font-bold text-white/50 mb-1 tracking-widest">当前在线房间</div>
              <div className="text-3xl font-black text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]">{activeRooms.length}</div>
            </div>
            <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div className="text-[10px] font-bold text-white/50 mb-1 tracking-widest">今日总局数</div>
              <div className="text-3xl font-black text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                {allRooms.reduce((sum, r) => sum + (r.currentRound || 0), 0)}
              </div>
            </div>
            <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div className="text-[10px] font-bold text-white/50 mb-1 tracking-widest">系统总盈亏</div>
              <div className="text-3xl font-black text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                {allRooms.reduce((sum, r) => sum + r.players.filter(p => p.isBot).reduce((s, p) => s + (p.totalScore || 0), 0), 0) > 0 ? '+' : ''}
                {allRooms.reduce((sum, r) => sum + r.players.filter(p => p.isBot).reduce((s, p) => s + (p.totalScore || 0), 0), 0)}
              </div>
            </div>
          </div>

          {/* 钥匙生成区与设置区 */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={handleCreateRoom}
              className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-black p-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-95 transition-all border border-red-500/50"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span className="tracking-widest">创建新房间</span>
            </button>
            <button
              onClick={() => setShowConfigModal(true)}
              className="bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800 text-white font-black p-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,0,0,0.5)] active:scale-95 transition-all border border-white/20"
            >
              <span className="tracking-widest">系统收款设置</span>
            </button>
          </div>

          {/* 列表区 */}
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="w-1.5 h-4 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            <h2 className="text-sm font-bold text-white/70 tracking-widest uppercase">所有房间监控</h2>
          </div>
          
          <div className="space-y-3">
            {allRooms.map(r => (
              <div 
                key={r.id} 
                onClick={() => handleJoinRoom(r.id)}
                className="bg-black/40 backdrop-blur-md p-5 rounded-2xl border border-white/10 flex items-center justify-between cursor-pointer hover:border-red-500/50 hover:bg-black/60 transition-all shadow-[0_10px_20px_rgba(0,0,0,0.3)] group"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-black text-xl tracking-wider text-white">房号: {r.id}</span>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded font-bold tracking-widest",
                      r.status === 'game_over' ? "bg-white/10 text-white/50" : "bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                    )}>
                      {r.status === 'game_over' ? '已结束' : '进行中'}
                    </span>
                  </div>
                  <div className="text-xs text-white/50 flex items-center gap-3 font-medium tracking-wide">
                    <span className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-red-400" /> 钥匙: <span className="font-mono text-red-400 bg-red-950/50 px-1.5 py-0.5 rounded border border-red-900/50">{r.config.roomKey}</span>
                    </span>
                    <div className="w-px h-3 bg-white/10" />
                    <span>进度: <span className="text-white">{r.currentRound}</span>/{r.config.totalRounds}</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-red-500/20 group-hover:text-red-400 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            ))}
            {allRooms.length === 0 && (
              <div className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-3">
                <ShieldCheck className="w-10 h-10 text-white/10" />
                <span className="text-white/30 text-sm font-bold tracking-widest">暂无房间数据</span>
              </div>
            )}
          </div>
        </div>

        {/* System Config Modal */}
        {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/20 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
                <h2 className="font-black tracking-widest text-lg">系统收款设置</h2>
                <button onClick={() => setShowConfigModal(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5"/></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-white/50 mb-2 tracking-widest">支付宝收款码路径/URL</label>
                  <input 
                    type="text" 
                    value={systemConfig.alipayQrUrl} 
                    onChange={e => setSystemConfig({...systemConfig, alipayQrUrl: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-500"
                  />
                  <p className="text-[10px] text-white/30 mt-1">例如: /images/ui/alipay_qr.png</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/50 mb-2 tracking-widest">USDT收款码路径/URL</label>
                  <input 
                    type="text" 
                    value={systemConfig.usdtQrUrl} 
                    onChange={e => setSystemConfig({...systemConfig, usdtQrUrl: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/50 mb-2 tracking-widest">USDT (TRC20) 钱包地址</label>
                  <input 
                    type="text" 
                    value={systemConfig.usdtAddress} 
                    onChange={e => setSystemConfig({...systemConfig, usdtAddress: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-red-500"
                  />
                </div>
                <button 
                  onClick={() => {
                    socket.emit('adminUpdateSystemConfig', systemConfig);
                    setShowConfigModal(false);
                    showToast('收款设置已更新');
                  }}
                  className="w-full mt-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-black py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-all tracking-widest"
                >
                  保存设置
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. 房间控制页（核心改牌页）
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col h-[100dvh] overflow-hidden relative shadow-2xl">
      {/* Immersive Red Bull Background for Console */}
      <div className="absolute inset-0 z-[-10]">
        <img src="/images/ui/hou.png" alt="background" loading="lazy" className="w-full h-full object-cover scale-105" />
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      </div>

      {/* Header */}
      <header className="h-16 bg-black/60 backdrop-blur-md border-b border-red-500/20 flex items-center justify-between px-6 shrink-0 relative z-10 shadow-[0_5px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <button onClick={() => setRoom(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/50 transition-colors">
            <ArrowRight className="w-5 h-5 rotate-180" />
          </button>
          <div className="flex items-center gap-3">
            <img src="/images/ui/logo3.png" alt="Logo" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="font-black text-lg text-white tracking-wider">控制台 <span className="text-red-500">{room.id}</span></h1>
              <div className="text-xs text-white/40 tracking-widest font-medium">当前进度: <span className="text-white">{room.currentRound}</span>/{room.config.totalRounds}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Players (全场宽屏透视区) */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative z-10">
        {toastMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 border border-red-400 text-white px-8 py-3 rounded-full font-black shadow-[0_0_30px_rgba(220,38,38,0.6)] z-50 text-sm whitespace-nowrap">
            {toastMsg}
          </div>
        )}
        
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-6 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            <h2 className="text-lg font-black text-white tracking-widest uppercase">全场玩家实时监控</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
            {room.players.map(player => (
              <div key={player.id} className={cn(
                "bg-black/60 backdrop-blur-xl rounded-3xl border p-6 relative overflow-hidden transition-all",
                player.isDealer ? "border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.2)]" : "border-white/10",
                selectedPlayerId === player.id ? "ring-2 ring-red-500 bg-black/80 scale-[1.02]" : "hover:border-white/20"
              )}>
                {player.isDealer && (
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-red-600/20 blur-2xl rounded-full" />
                )}
                
                <div className="flex justify-between items-center mb-6">
                  <div className="font-black text-xl flex items-center gap-3">
                    {player.name} 
                    {player.isDealer && <span className="bg-gradient-to-r from-red-600 to-red-800 text-white text-xs px-2 py-1 rounded shadow-md border border-red-400/50 tracking-widest">庄家</span>}
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-500 font-black text-lg">💰 {player.score}</div>
                    <div className={cn("text-xs font-bold tracking-wider mt-1", (player.totalScore || 0) >= 0 ? "text-emerald-400" : "text-red-400")}>
                      累计盈亏: {(player.totalScore || 0) > 0 ? '+' : ''}{player.totalScore || 0}
                    </div>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-4">
                  <div className="text-xs font-bold text-white/40 tracking-widest uppercase">当前手牌</div>
                  <div className="flex items-center justify-between">
                    {/* First 4 Cards */}
                    <div className="flex gap-2">
                      {player.cards.slice(0, 4).map((card, i) => (
                        <div key={i} className="w-12 h-16 bg-white rounded-lg flex flex-col items-center justify-center font-black shadow-lg">
                          <div className={cn("text-sm", ['♥', '♦'].includes(card.suit) ? "text-red-600" : "text-black")}>{card.value}</div>
                          <div className={cn("text-lg", ['♥', '♦'].includes(card.suit) ? "text-red-600" : "text-black")}>{card.suit}</div>
                        </div>
                      ))}
                      {player.cards.length === 0 && <div className="text-sm text-white/30 italic py-4">等待发牌中...</div>}
                    </div>
                    
                    {/* 5th Card (Preset or Requested) */}
                    {(room.status === 'dealing_5' || room.status === 'playing' || room.status === 'finished') && (
                      <div 
                        onClick={() => setSelectedPlayerId(selectedPlayerId === player.id ? null : player.id)}
                        className={cn(
                          "w-14 h-20 rounded-xl flex flex-col items-center justify-center font-black shadow-xl cursor-pointer transition-all border-2 group",
                          selectedPlayerId === player.id ? "border-red-500 animate-pulse scale-110 shadow-[0_0_20px_rgba(239,68,68,0.4)]" : "border-transparent",
                          player.presetFifthCard || player.fifthCardRequested ? "bg-white" : "bg-black/40 border-dashed border-white/20 hover:border-red-500/50"
                        )}
                      >
                        {player.presetFifthCard ? (
                          <>
                            <div className={cn("text-base", ['♥', '♦'].includes(player.presetFifthCard.suit) ? "text-red-600" : "text-black")}>{player.presetFifthCard.value}</div>
                            <div className={cn("text-xl", ['♥', '♦'].includes(player.presetFifthCard.suit) ? "text-red-600" : "text-black")}>{player.presetFifthCard.suit}</div>
                            <div className="absolute -top-2 -right-2 text-[10px] bg-red-600 border border-white px-2 py-0.5 rounded-full text-white shadow-md">预设</div>
                          </>
                        ) : player.fifthCardRequested && player.cards[4] ? (
                          <>
                            <div className={cn("text-base", ['♥', '♦'].includes(player.cards[4].suit) ? "text-red-600" : "text-black")}>{player.cards[4].value}</div>
                            <div className={cn("text-xl", ['♥', '♦'].includes(player.cards[4].suit) ? "text-red-600" : "text-black")}>{player.cards[4].suit}</div>
                          </>
                        ) : (
                          <div className="text-white/40 text-[10px] text-center px-1 font-medium tracking-widest group-hover:text-red-400 transition-colors">点此<br/>发牌</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Optional: Card Selector Popover */}
                {selectedPlayerId === player.id && room.status !== 'finished' && (
                  <div className="mt-4 p-4 bg-black/80 rounded-xl border border-red-500/50 grid grid-cols-4 gap-2">
                    <div className="col-span-full text-xs text-white/50 text-center mb-2">手动发配第5张牌 (点杀/必胜)</div>
                    {['♠', '♥', '♣', '♦'].map(suit => (
                      <div key={suit} className="flex flex-col gap-1">
                        {['A', 'K', '10', '5'].map(value => (
                          <button
                            key={`${suit}${value}`}
                            onClick={() => {
                              socket.emit('adminSetFifthCard', { roomId: room.id, userId: player.id, card: { suit, value } });
                              setSelectedPlayerId(null);
                              showToast(`已向 ${player.name} 下发预设牌 ${suit}${value}`);
                            }}
                            className={cn(
                              "py-1 px-2 rounded text-sm font-bold bg-white/5 hover:bg-white/20 transition-colors",
                              ['♥', '♦'].includes(suit) ? "text-red-500" : "text-slate-300"
                            )}
                          >
                            {suit}{value}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Hand Type */}
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                  <div className="text-xs text-white/40 font-medium tracking-widest">
                    状态: <span className={player.isDisconnected ? "text-red-500 font-bold" : "text-emerald-400"}>{player.isDisconnected ? '离线' : '在线'}</span>
                  </div>
                  {player.bull !== undefined && (
                    <div className="bg-red-950/50 text-red-400 border border-red-900 px-3 py-1 rounded text-sm font-black tracking-widest">
                      {['无牛', '牛一', '牛二', '牛三', '牛四', '牛五', '牛六', '牛七', '牛八', '牛九', '牛牛', '四花牛', '五花牛', '五小牛'][player.bull]}
                    </div>
                  )}
                </div>

                {/* Target Win Rate Control */}
                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="flex justify-between text-[10px] mb-2 font-bold tracking-widest">
                    <span className="text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">点杀 (0%)</span>
                    <span className="text-white/50">系统胜率调控: <span className={cn(
                      "font-black ml-1 text-sm",
                      (player.targetWinRate ?? 50) < 50 ? "text-red-500" : (player.targetWinRate ?? 50) > 50 ? "text-yellow-500" : "text-white"
                    )}>{player.targetWinRate ?? 50}%</span></span>
                    <span className="text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]">放水 (100%)</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={player.targetWinRate ?? 50}
                    onChange={(e) => {
                      const newRate = parseInt(e.target.value);
                      socket.emit('adminSetWinRate', { roomId: room.id, userId: player.id, winRate: newRate });
                    }}
                    className="w-full h-2.5 bg-gradient-to-r from-red-600 via-slate-700 to-yellow-500 rounded-full appearance-none cursor-pointer shadow-inner
                               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                               [&::-webkit-slider-thumb]:bg-gradient-to-b [&::-webkit-slider-thumb]:from-yellow-300 [&::-webkit-slider-thumb]:to-yellow-600 
                               [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black 
                               [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(234,179,8,0.8)] [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
                  />
                </div>
              </div>
            ))}
            {room.players.length === 0 && <div className="col-span-full text-center text-white/30 py-20 font-bold tracking-widest">等待玩家加入...</div>}
          </div>
        </div>
      </div>

      {/* Footer - Deck Pool (牌库网格 4x13) */}
      <div className={cn(
        "bg-slate-900 border-t border-white/10 p-2 pb-safe transition-all shrink-0 z-10 relative",
        selectedPlayerId ? "ring-2 ring-yellow-500 shadow-[0_-10px_30px_rgba(234,179,8,0.2)]" : ""
      )}>
        {selectedPlayerId && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs font-bold px-4 py-1 rounded-t-lg shadow-lg whitespace-nowrap flex items-center gap-1">
            <Zap className="w-3 h-3" /> 指令就绪：请选一张牌
          </div>
        )}
        <div className="grid grid-rows-4 gap-1">
          {SUITS.map(suit => (
            <div key={suit} className="flex gap-1">
              {VALUES.map(value => {
                const isAvailable = room.remainingDeck?.some(c => c.suit === suit && c.value === value);
                const winningMatch = winningCards.find(c => c.card.suit === suit && c.card.value === value);
                
                return (
                  <button
                    key={`${suit}-${value}`}
                    disabled={!isAvailable || !selectedPlayerId}
                    onClick={() => handleSelectDeckCard({ suit, value })}
                    className={cn(
                      "flex-1 h-8 sm:h-10 rounded flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all relative overflow-hidden",
                      isAvailable ? "bg-white cursor-pointer active:scale-90" : "bg-slate-800 text-slate-700 cursor-not-allowed opacity-30",
                      ['♥', '♦'].includes(suit) && isAvailable ? "text-red-600" : "text-black",
                      winningMatch ? "ring-2 ring-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.6)] z-10" : ""
                    )}
                  >
                    {value}{suit}
                    {winningMatch && (
                      <div className="absolute inset-0 bg-yellow-400/20" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}