import React, { useState, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { ShieldCheck, ArrowRight, Zap } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Room, Card } from '../../src/types';
import { getWinningCards, getBullName } from '../../src/lib/gameLogic';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Connect to the main server port 3000
const socket: Socket = io('http://localhost:3000');

const SUITS = ['♠', '♥', '♣', '♦'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export default function App() {
  const [roomId, setRoomId] = useState('');
  const [roomKey, setRoomKey] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    socket.on('adminLoginSuccess', (roomData: Room) => {
      setIsLoggedIn(true);
      setRoom(roomData);
    });

    socket.on('roomUpdate', (roomData: Room) => {
      setRoom(roomData);
    });

    socket.on('error', (msg) => {
      alert(msg);
    });

    return () => {
      socket.off('adminLoginSuccess');
      socket.off('roomUpdate');
      socket.off('error');
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    socket.emit('adminLogin', { roomId, roomKey });
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-yellow-500/20 p-10 rounded-3xl w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-center mb-6 text-yellow-500">
            <ShieldCheck className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-black text-center mb-2">至尊后台系统</h1>
          <p className="text-center text-slate-500 mb-8 text-sm">上帝视角 · 实时风控</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              placeholder="房间号"
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-center text-xl font-black focus:border-yellow-500 outline-none"
              required
            />
            <input
              type="text"
              placeholder="房卡钥匙"
              value={roomKey}
              onChange={e => setRoomKey(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-center text-xl font-black focus:border-yellow-500 outline-none"
              required
            />
            <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black p-4 rounded-xl mt-4">
              登入后台
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-slate-900 border-b border-white/10 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <ShieldCheck className="text-yellow-500 w-6 h-6" />
          <h1 className="font-black text-lg">至尊后台</h1>
          <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-bold border border-blue-500/30">
            房间: {room.id}
          </div>
          <div className="px-3 py-1 bg-white/5 text-slate-400 rounded text-xs font-bold border border-white/10">
            状态: {room.status}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-sm">
            <span className="text-slate-500 mr-2">局数</span>
            <span className="font-bold">{room.currentRound}/{room.config.totalRounds}</span>
          </div>
          <button onClick={() => window.location.reload()} className="text-xs bg-red-600/20 text-red-500 px-3 py-1.5 rounded hover:bg-red-600 hover:text-white transition-colors">退出</button>
        </div>
      </header>

      {/* Main Content - Players */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative">
        {toastMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-2 rounded-full font-black shadow-xl z-50">
            {toastMsg}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {room.players.map(player => (
            <div key={player.id} className={cn(
              "bg-slate-900 rounded-2xl border p-5 relative overflow-hidden",
              player.isDealer ? "border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.1)]" : "border-white/10"
            )}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-black text-lg flex items-center gap-2">
                    {player.name} 
                    {player.isDealer && <span className="bg-yellow-500 text-black text-[10px] px-1.5 py-0.5 rounded">庄</span>}
                  </div>
                  <div className="text-yellow-500 font-mono text-sm mt-1">💰 {player.score}</div>
                </div>
                <div className="text-right text-xs space-y-1">
                  {player.bidMultiplier > 0 && <div className="text-blue-400">抢 {player.bidMultiplier}倍</div>}
                  {player.betMultiplier > 0 && <div className="text-emerald-400">下注 {player.betMultiplier}倍</div>}
                  <div className={cn("font-bold", player.ready ? "text-emerald-500" : "text-slate-500")}>
                    {player.ready ? '已准备' : '未准备'}
                  </div>
                </div>
              </div>

              {/* Cards */}
              <div className="flex items-center gap-2 mt-4">
                {/* First 4 Cards */}
                {player.cards.slice(0, 4).map((card, i) => (
                  <div key={i} className="w-12 h-16 bg-white rounded flex flex-col items-center justify-center text-sm font-bold shadow-md">
                    <div className={['♥', '♦'].includes(card.suit) ? "text-red-600" : "text-black"}>{card.value}</div>
                    <div className={['♥', '♦'].includes(card.suit) ? "text-red-600" : "text-black"}>{card.suit}</div>
                  </div>
                ))}
                
                {/* 5th Card (Preset or Requested) */}
                {(room.status === 'dealing_5' || room.status === 'playing' || room.status === 'finished') && (
                  <div className="flex items-center gap-2 ml-4 relative">
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                    <div 
                      onClick={() => setSelectedPlayerId(selectedPlayerId === player.id ? null : player.id)}
                      className={cn(
                        "w-12 h-16 rounded flex flex-col items-center justify-center text-sm font-bold shadow-md cursor-pointer transition-all border-2",
                        selectedPlayerId === player.id ? "border-yellow-400 animate-pulse scale-110" : "border-transparent",
                        player.presetFifthCard || player.fifthCardRequested ? "bg-yellow-100" : "bg-slate-800 border-dashed border-slate-600 hover:border-yellow-500/50"
                      )}
                    >
                      {player.presetFifthCard ? (
                        <>
                          <div className={['♥', '♦'].includes(player.presetFifthCard.suit) ? "text-red-600" : "text-black"}>{player.presetFifthCard.value}</div>
                          <div className={['♥', '♦'].includes(player.presetFifthCard.suit) ? "text-red-600" : "text-black"}>{player.presetFifthCard.suit}</div>
                          <div className="absolute -top-2 -right-2 text-[8px] bg-red-600 px-1 rounded-full text-white">改</div>
                        </>
                      ) : player.fifthCardRequested && player.cards[4] ? (
                        <>
                          <div className={['♥', '♦'].includes(player.cards[4].suit) ? "text-red-600" : "text-black"}>{player.cards[4].value}</div>
                          <div className={['♥', '♦'].includes(player.cards[4].suit) ? "text-red-600" : "text-black"}>{player.cards[4].suit}</div>
                        </>
                      ) : (
                        <div className="text-slate-500 text-[10px]">待搓牌</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Hand Type */}
              {player.finish && (
                <div className="absolute bottom-2 right-2 text-xs font-black bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30">
                  {getBullName(player.bull)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer - Deck Pool */}
      <div className={cn(
        "bg-slate-900 border-t border-white/10 p-4 transition-all shrink-0",
        selectedPlayerId ? "ring-2 ring-yellow-500 shadow-[0_-10px_30px_rgba(234,179,8,0.2)]" : ""
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold text-slate-400">
            {selectedPlayerId ? (
              <span className="text-yellow-500 flex items-center gap-2">
                <Zap className="w-4 h-4" /> 
                请从下方牌池中为玩家选择一张牌
              </span>
            ) : "剩余牌池 (点击玩家的第5张牌以改牌)"}
          </div>
          <div className="text-xs text-slate-500">剩余: {room.remainingDeck?.length || 0} 张</div>
        </div>

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
                      "flex-1 h-10 rounded flex items-center justify-center text-sm font-bold transition-all relative overflow-hidden",
                      isAvailable ? "bg-white cursor-pointer hover:scale-105" : "bg-slate-800 text-slate-700 cursor-not-allowed opacity-30",
                      ['♥', '♦'].includes(suit) && isAvailable ? "text-red-600" : "text-black",
                      winningMatch ? "ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.6)] z-10" : ""
                    )}
                  >
                    {value}{suit}
                    {winningMatch && (
                      <div className="absolute inset-0 bg-yellow-400/20" />
                    )}
                    {winningMatch && (
                      <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[8px] px-1 rounded-bl">
                        {winningMatch.bull >= 11 ? '炸' : '牛'}
                      </div>
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