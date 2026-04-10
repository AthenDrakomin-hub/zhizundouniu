import React, { useState, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { ShieldCheck, ArrowRight, Zap, Key, Plus, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Room, Card } from '../../src/types';
import { getWinningCards, getBullName } from '../../src/lib/gameLogic';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Connect to the main server port 3000
// Initialize socket connection dynamically based on the current origin
// Since Nginx proxies /socket.io/ to the backend, we can just connect to '/' or omit the URL
const socket: Socket = io(window.location.origin, {
  path: '/socket.io/'
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

  useEffect(() => {
    socket.on('adminLoginSuccess', (rooms: Room[]) => {
      setIsLoggedIn(true);
      setAllRooms(rooms);
    });

    socket.on('adminRoomsUpdate', (rooms: Room[]) => {
      setAllRooms(rooms);
    });

    socket.on('roomUpdate', (roomData: Room) => {
      setRoom(roomData);
    });

    socket.on('error', (msg) => {
      alert(msg);
    });

    return () => {
      socket.off('adminLoginSuccess');
      socket.off('adminRoomsUpdate');
      socket.off('roomUpdate');
      socket.off('error');
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
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
        {/* Immersive Background Image */}
        <div className="absolute inset-0 z-[-10]">
          <img src="/images/ui/hou.png" alt="background" className="w-full h-full object-cover scale-105" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/80" />
        </div>
        
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-900/30 blur-[120px] rounded-full pointer-events-none z-[-5]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-slate-900/40 blur-[100px] rounded-full pointer-events-none z-[-5]" />

        <div className="relative z-10 w-full max-w-md">
          {/* Glass Card */}
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden">
            {/* Top Shine Accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
            
            <div className="flex flex-col items-center mb-10">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                <div className="w-20 h-20 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center shadow-inner relative z-10">
                  <ShieldCheck className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                </div>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white mb-2">至尊控制台</h1>
              <p className="text-slate-400 text-sm tracking-widest font-medium">SUPREME ADMIN CONSOLE</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider text-slate-500 uppercase px-1">安全认证秘钥</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                    <Key className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    placeholder="请输入 admin123"
                    value={adminKey}
                    onChange={e => setAdminKey(e.target.value)}
                    className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-lg font-mono tracking-widest text-white focus:border-emerald-500/50 focus:bg-slate-900 outline-none transition-all placeholder:text-slate-700 placeholder:tracking-normal"
                    required
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 group mt-2"
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
            <div className="flex items-center gap-2 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
              <ShieldCheck className="w-7 h-7" />
              <h1 className="font-black text-xl tracking-wider">房卡管理中心</h1>
            </div>
            <button onClick={() => window.location.reload()} className="text-xs font-bold text-white/50 hover:text-white transition-colors uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full backdrop-blur-sm">退出</button>
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
                {allRooms.reduce((sum, r) => sum + (r.currentRound || 0), 0) + 120}
              </div>
            </div>
            <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div className="text-[10px] font-bold text-white/50 mb-1 tracking-widest">系统总盈亏</div>
              <div className="text-3xl font-black text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                +{allRooms.reduce((sum, r) => sum + r.players.filter(p => p.isBot).reduce((s, p) => s + (p.totalScore || 0), 0), 0) + 8850}
              </div>
            </div>
          </div>

          {/* 钥匙生成区 */}
          <button 
            onClick={handleCreateRoom}
            className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-black p-5 rounded-2xl mb-8 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-95 transition-all border border-red-500/50"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
            <span className="tracking-widest">生成新房卡 (创建房间)</span>
          </button>

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
      </div>
    );
  }

  // 2. 房间控制页（核心改牌页）
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col h-[100dvh] overflow-hidden max-w-md mx-auto relative border-x border-white/5 shadow-2xl">
      {/* Header */}
      <header className="h-14 bg-slate-900 border-b border-white/10 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setRoom(null)} className="text-slate-400 hover:text-white p-1">
            <ArrowRight className="w-5 h-5 rotate-180" />
          </button>
          <div>
            <h1 className="font-black text-sm text-yellow-500">控制台: {room.id}</h1>
            <div className="text-[10px] text-slate-500">进度: {room.currentRound}/{room.config.totalRounds}</div>
          </div>
        </div>
      </header>

      {/* Main Content - Players (全场透视区) */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar relative">
        {toastMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-2 rounded-full font-black shadow-xl z-50 text-sm whitespace-nowrap">
            {toastMsg}
          </div>
        )}
        
        <div className="space-y-4 pb-20">
          {room.players.map(player => (
            <div key={player.id} className={cn(
              "bg-slate-900 rounded-2xl border p-4 relative overflow-hidden",
              player.isDealer ? "border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]" : "border-white/5",
              selectedPlayerId === player.id ? "ring-2 ring-yellow-400 bg-slate-800" : ""
            )}>
              <div className="flex justify-between items-center mb-3">
                <div className="font-black text-base flex items-center gap-2">
                  {player.name} 
                  {player.isDealer && <span className="bg-yellow-500 text-black text-[10px] px-1.5 py-0.5 rounded">庄</span>}
                </div>
                <div className="text-right">
                  <div className="text-yellow-500 font-mono text-sm">💰 {player.score}</div>
                  <div className={cn("text-[10px] font-bold", (player.totalScore || 0) >= 0 ? "text-emerald-400" : "text-red-400")}>
                    总盈亏: {(player.totalScore || 0) > 0 ? '+' : ''}{player.totalScore || 0}
                  </div>
                </div>
              </div>

              {/* Cards */}
              <div className="flex items-center justify-between">
                {/* First 4 Cards */}
                <div className="flex gap-1">
                  {player.cards.slice(0, 4).map((card, i) => (
                    <div key={i} className="w-8 h-12 bg-white rounded flex flex-col items-center justify-center text-[10px] font-bold shadow-sm">
                      <div className={['♥', '♦'].includes(card.suit) ? "text-red-600" : "text-black"}>{card.value}</div>
                      <div className={['♥', '♦'].includes(card.suit) ? "text-red-600" : "text-black"}>{card.suit}</div>
                    </div>
                  ))}
                  {player.cards.length === 0 && <div className="text-xs text-slate-600 italic py-2">等待发牌...</div>}
                </div>
                
                {/* 5th Card (Preset or Requested) */}
                {(room.status === 'dealing_5' || room.status === 'playing' || room.status === 'finished') && (
                  <div 
                    onClick={() => setSelectedPlayerId(selectedPlayerId === player.id ? null : player.id)}
                    className={cn(
                      "w-10 h-14 rounded flex flex-col items-center justify-center text-[10px] font-bold shadow-md cursor-pointer transition-all border",
                      selectedPlayerId === player.id ? "border-yellow-400 animate-pulse scale-110" : "border-transparent",
                      player.presetFifthCard || player.fifthCardRequested ? "bg-yellow-100" : "bg-slate-800 border-dashed border-slate-600 hover:border-yellow-500/50"
                    )}
                  >
                    {player.presetFifthCard ? (
                      <>
                        <div className={['♥', '♦'].includes(player.presetFifthCard.suit) ? "text-red-600" : "text-black"}>{player.presetFifthCard.value}</div>
                        <div className={['♥', '♦'].includes(player.presetFifthCard.suit) ? "text-red-600" : "text-black"}>{player.presetFifthCard.suit}</div>
                        <div className="absolute -top-1 -right-1 text-[8px] bg-red-600 px-1 rounded-full text-white">改</div>
                      </>
                    ) : player.fifthCardRequested && player.cards[4] ? (
                      <>
                        <div className={['♥', '♦'].includes(player.cards[4].suit) ? "text-red-600" : "text-black"}>{player.cards[4].value}</div>
                        <div className={['♥', '♦'].includes(player.cards[4].suit) ? "text-red-600" : "text-black"}>{player.cards[4].suit}</div>
                      </>
                    ) : (
                      <div className="text-slate-500 text-[8px] text-center px-1">点此<br/>换牌</div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Hand Type */}
              {player.finish && (
                <div className="absolute bottom-2 right-2 text-[10px] font-black bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">
                  {getBullName(player.bull)}
                </div>
              )}

              {/* Target Win Rate Control */}
              <div className="mt-4 pt-3 border-t border-white/10">
                <div className="flex justify-between text-[10px] mb-2">
                  <span className="text-red-400 font-bold">压制 (0%)</span>
                  <span className="text-slate-400">系统胜率调控: <span className="text-yellow-400 font-bold">{player.targetWinRate ?? 50}%</span></span>
                  <span className="text-yellow-500 font-bold">放水 (100%)</span>
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
                  className="w-full h-2 bg-gradient-to-r from-red-600 via-slate-500 to-yellow-500 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          ))}
          {room.players.length === 0 && <div className="text-center text-slate-500 py-10">等待玩家加入...</div>}
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