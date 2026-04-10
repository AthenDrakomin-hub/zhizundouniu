import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Play, LogOut, CheckCircle2, Trophy, Info, User, Settings, ShieldCheck, Zap, Eye, Crown, Ghost, Volume2, VolumeX, EyeOff, ArrowRight } from 'lucide-react';
import { Card as CardComp } from './components/Card';
import { Room, Player, Card } from './types';
import { calculateBull, getBullName } from './lib/gameLogic';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const socket: Socket = io();

interface PlayerSeatProps {
  player: any;
  position: string;
  isSelf?: boolean;
  roomStatus: string;
  roomId?: string;
  key?: React.Key;
  onKick?: (id: string) => void;
  scoreChange?: number;
  showCards?: boolean;
  onAvatarClick?: (id: string, rect: DOMRect) => void;
}

const PlayerSeat = ({ player, position, isSelf = false, roomStatus = "", roomId, onKick, scoreChange, showCards, onAvatarClick }: PlayerSeatProps) => {
  const isDealer = player.isDealer;
  const hasFinished = player.finish;
  const bullResult = hasFinished || roomStatus === 'finished' ? calculateBull(player.cards) : null;
  const isMegaWin = roomStatus === 'finished' && bullResult && bullResult.type >= 10;
  const avatarRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      layout
      className={cn(
        "absolute flex flex-col items-center gap-2",
        position === "bottom" && "bottom-4 left-1/2 -translate-x-1/2",
        position === "top-left" && "top-12 left-12",
        position === "top-right" && "top-12 right-12",
        position === "mid-left" && "top-1/2 left-4 -translate-y-1/2",
        position === "mid-right" && "top-1/2 right-4 -translate-y-1/2",
        isMegaWin && "animate-shake z-[100]"
      )}
    >
      {/* Score Change Animation */}
      {/* Moved to side of avatar */}

      {/* Avatar & Info Container */}
      <div className="relative group flex flex-col items-center">
        {/* Score/Coins (Top of Avatar) */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 bg-[#ffd700] border-2 border-[#b8860b] text-black px-2 sm:px-3 py-0.5 rounded-full flex items-center gap-1 shadow-lg whitespace-nowrap min-w-[60px] justify-center">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-400 rounded-full border border-yellow-600 flex items-center justify-center font-black text-[8px] sm:text-[10px] text-yellow-800 shadow-inner">
            $
          </div>
          <span className="font-black text-xs sm:text-sm drop-shadow-sm">{player.score}</span>
        </div>

        {/* Avatar */}
        <div 
          ref={avatarRef}
          onClick={() => {
            if (onAvatarClick && avatarRef.current) {
              onAvatarClick(player.id, avatarRef.current.getBoundingClientRect());
            }
          }}
          className={cn(
          "w-14 h-14 sm:w-20 sm:h-20 mt-2 rounded-xl border-2 flex items-center justify-center bg-slate-800 shadow-[0_4px_10px_rgba(0,0,0,0.5)] transition-all relative overflow-hidden cursor-pointer",
          isDealer ? "border-yellow-500 scale-105 ring-2 ring-yellow-500/20" : (player.ready ? "border-blue-500" : "border-slate-700"),
          isMegaWin && "mega-win"
        )}>
          {/* Avatar Background Glow */}
          <div className={cn(
            "absolute inset-0 opacity-20",
            isDealer ? "bg-yellow-500" : (player.ready ? "bg-blue-500" : "bg-transparent")
          )} />
          <User className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400 relative z-10" />
        </div>
        
        {/* Name Plate (Bottom of Avatar) */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-sm border border-white/10 shadow-lg min-w-[70px] text-center">
          <div className="text-[10px] sm:text-xs font-bold truncate text-white max-w-[80px]">{player.name}</div>
        </div>
        
        {/* Dealer Crown */}
        {isDealer && (
          <img 
            src="/images/ui/crown.png" 
            alt="Dealer"
            className="absolute -top-3 -right-3 w-8 h-8 sm:w-10 sm:h-10 z-20 drop-shadow-md rotate-12"
          />
        )}

        {player.isHost && (
          <div className="absolute -top-2 -left-2 bg-blue-600 text-white p-1.5 rounded-full shadow-lg border border-white/20 z-20">
            <ShieldCheck className="w-4 h-4" />
          </div>
        )}

        {onKick && !player.isHost && (
          <button 
            onClick={() => onKick(player.id)}
            className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity z-30"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}

        {player.ready && roomStatus === 'waiting' && (
          <motion.div 
            initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap shadow-lg border border-blue-400/30 z-20"
          >
            已准备
          </motion.div>
        )}
      </div>

      <div className="text-center bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5 shadow-xl min-w-[100px]">
        <div className="text-xs sm:text-sm font-black truncate text-white mb-0.5">{player.name}</div>
        <div className="text-[10px] sm:text-xs text-yellow-500 font-mono font-black">💰 {player.score}</div>
      </div>

      {/* Score Change Animation attached to avatar instead of card */}
      <AnimatePresence>
        {scoreChange !== undefined && (
          <motion.div
            initial={{ y: 0, opacity: 0, scale: 0.5 }}
            animate={{ 
              y: [-20, -100, -80], 
              opacity: [0, 1, 1], 
              scale: [0.5, 1.8, 1.5] 
            }}
            transition={{ 
              duration: 1.5,
              times: [0, 0.3, 1],
              ease: "easeOut"
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            className={cn(
              "absolute top-1/2 left-full ml-4 z-[100] font-black text-3xl drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] pointer-events-none flex flex-col items-center",
              scoreChange > 0 ? "text-emerald-400" : "text-red-500"
            )}
          >
            <motion.span
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              {scoreChange > 0 ? `+${scoreChange}` : scoreChange}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Indicators */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {player.bidMultiplier > 0 && (
          <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white text-[10px] sm:text-xs font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-lg border border-orange-300 whitespace-nowrap">
            抢 {player.bidMultiplier}倍
          </div>
        )}
        {player.betMultiplier > 0 && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white text-[10px] sm:text-xs font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-lg border border-indigo-300 whitespace-nowrap">
            注 {player.betMultiplier}倍
          </div>
        )}
        {roomStatus === 'waiting' && player.ready && (
          <div className="text-emerald-400 text-xs sm:text-sm font-black whitespace-nowrap drop-shadow-md">
            已准备
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="relative mt-2 z-10">
        <div className="flex justify-center -space-x-4 sm:-space-x-6">
          {(() => {
            const numCards = (roomStatus === 'dealing_4' || roomStatus === 'bidding' || roomStatus === 'betting') ? 4 : 5;
            const displayCards = [];
            for (let i = 0; i < numCards; i++) {
              if (i < player.cards.length) {
                displayCards.push(player.cards[i]);
              } else {
                displayCards.push({ suit: '?', value: '?' }); // Placeholder card
              }
            }
            return displayCards.map((card: any, i: number) => (
              <CardComp 
                key={i} 
                card={card} 
                index={i} 
                hidden={
                  (!isSelf && !player.finish && roomStatus !== 'finished') || 
                  (isSelf && i < 4 && !showCards && !player.finish && roomStatus !== 'finished') ||
                  (isSelf && i === 4 && (!player.fifthCardRequested || card.value === '?') && roomStatus !== 'finished')
                } 
                isRubbing={isSelf && i === 4 && roomStatus === 'playing' && !player.finish}
                onRub={(progress) => {
                  if (progress > 0.5 && !player.fifthCardRequested && roomId) {
                    // Obfuscated event name: 0x05 + random padding
                    const padding = Array.from({ length: Math.floor(Math.random() * 10) }, () => Math.floor(Math.random() * 256));
                    socket.emit('0x05', { r: roomId, u: player.id, p: padding });
                  }
                }}
                className={cn(
                  "transition-transform hover:-translate-y-2 w-10 h-14 sm:w-14 sm:h-20 shadow-md",
                  isSelf && "cursor-pointer w-12 h-16 sm:w-16 sm:h-24", // Make own cards slightly larger
                  isSelf && i === 4 && roomStatus === 'playing' && !player.finish && "ring-4 ring-yellow-500 ring-offset-4 ring-offset-black/50 scale-125 z-30 ml-4 rotate-[-5deg]"
                )}
              />
            ));
          })()}
          {player.cards.length === 0 && roomStatus !== 'waiting' && (
             <div className="flex -space-x-4 sm:-space-x-6">
               {[0,1,2,3,4].map(i => <CardComp key={i} index={i} hidden className="w-10 h-14 sm:w-14 sm:h-20" />)}
             </div>
          )}
        </div>

        {/* Bull Result Overlay (Wood Style) */}
        {bullResult && (
          <motion.div 
            initial={{ scale: 0, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
          >
            <div className="relative">
              {/* Wooden Plaque Background */}
              <div className="absolute inset-0 bg-[#5c2e0e] rounded-md border-2 border-[#3e1a05] shadow-[0_4px_10px_rgba(0,0,0,0.5)]" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-30 rounded-md" />
              {/* Nails */}
              <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-gray-400 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]" />
              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-gray-400 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]" />
              <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-gray-400 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]" />
              <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-gray-400 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]" />
              
              {/* Text */}
              <div className="relative px-4 py-1 text-yellow-500 font-black text-xs sm:text-sm drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] whitespace-nowrap tracking-wider">
                {getBullName(bullResult.type)}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default function App() {
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [roomId, setRoomId] = useState('');
  const [tempName, setTempName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [activationKey, setActivationKey] = useState('');
  const [rubbingProgress, setRubbingProgress] = useState(0);
  const [scoreChanges, setScoreChanges] = useState<Record<string, number>>({});
  const [showCards, setShowCards] = useState(false);
  const [betAnimations, setBetAnimations] = useState<{ id: string, from: string, amount: number }[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Emotes State
  const [activeEmoteMenu, setActiveEmoteMenu] = useState<{ playerId: string, x: number, y: number } | null>(null);
  const [flyingEmotes, setFlyingEmotes] = useState<{ id: string, fromId: string, toId: string, emote: string }[]>([]);

  // Chips State
  const [flyingChips, setFlyingChips] = useState<{ id: string, fromPos: string, toPos: string }[]>([]);

  const getPlayerPositionStr = (playerId: string, currentRoom: Room) => {
    if (playerId === user?.id) return "bottom";
    const otherPlayers = currentRoom.players.filter(p => p.id !== user?.id);
    const idx = otherPlayers.findIndex(p => p.id === playerId);
    const positions = ["top-left", "top-right", "mid-left", "mid-right"];
    return positions[idx] || "top-left";
  };

  const getCoordinatesFromPos = (pos: string) => {
    switch (pos) {
      case "bottom": return { x: "50vw", y: "85vh" };
      case "top-left": return { x: "15vw", y: "15vh" };
      case "top-right": return { x: "85vw", y: "15vh" };
      case "mid-left": return { x: "10vw", y: "50vh" };
      case "mid-right": return { x: "90vw", y: "50vh" };
      default: return { x: "50vw", y: "50vh" };
    }
  };

  const handleCaptureAndShare = async () => {
    const el = document.getElementById('summary-board');
    if (!el) return;
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(el, { backgroundColor: '#0f172a' });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `至尊斗牛-战报-${new Date().getTime()}.jpg`;
      a.click();
      alert('战报已生成，发送给房主即可结账！');
    } catch (e) {
      console.error(e);
      alert('生成战报失败');
    } finally {
      setIsCapturing(false);
    }
  };

  // 简单的音效管理器，使用刚刚引入的真实音频文件
  const AudioManager = {
    sounds: {
      bgm: new Audio('/audio/bgm.mp3'),
      countDown: new Audio('/audio/countDown.mp3'),
      deal: new Audio('/audio/effect1.mp3'), // 假设 effect1 是发牌音效
      chips: new Audio('/audio/effect2.mp3'), // 假设 effect2 是筹码音效
      heartbeat: new Audio('/audio/effect3.mp3'), // 心跳音效
      bigwin: new Audio('/audio/victory.mp3'), // 大奖音效
      lose: new Audio('/audio/fail.mp3'), // 输局音效
      emote: new Audio('/audio/pop.mp3') // 表情弹出音效
    } as Record<string, HTMLAudioElement>,
    play(name: string) {
      try {
        const audio = this.sounds[name];
        if (!audio) return;
        audio.currentTime = 0;
        if (name === 'bgm') {
          audio.loop = true;
          audio.volume = 0.3;
        }
        audio.play().catch(() => {});
      } catch (e) {
        // 忽略浏览器自动播放限制报错
      }
    },
    stop(name: string) {
      try {
        if (this.sounds[name]) {
          this.sounds[name].pause();
          this.sounds[name].currentTime = 0;
        }
      } catch (e) {}
    }
  };

  const playSound = (name: string) => {
    AudioManager.play(name);
  };

  useEffect(() => {
    socket.on('roomUpdate', (updatedRoom: Room) => {
      if (room) {
        const changes: Record<string, number> = {};
        updatedRoom.players.forEach(p => {
          const oldP = room.players.find(op => op.id === p.id);
          if (oldP && oldP.score !== p.score) {
            changes[p.id] = p.score - oldP.score;
          }

          // Trigger bet animation if player just bet
          if (p.hasBet && oldP && !oldP.hasBet) {
            const animId = Math.random().toString(36).substr(2, 9);
            const fromPos = room.players.indexOf(p) === room.players.findIndex(pl => pl.id === user?.id) ? 'bottom' : 'other';
            setBetAnimations(prev => [...prev, { id: animId, from: fromPos, amount: p.betMultiplier }]);
            playSound('chips');
            setTimeout(() => {
              setBetAnimations(prev => prev.filter(a => a.id !== animId));
            }, 1000);
          }
        });
        if (Object.keys(changes).length > 0) {
          setScoreChanges(changes);
          setTimeout(() => setScoreChanges({}), 3000);
          
          // Play win/lose sounds for self
          if (user) {
            const myChange = changes[user.id];
            if (myChange > 0) playSound('win');
            else if (myChange < 0) playSound('lose');
          }
        }

        // Play sounds based on status change
        if (updatedRoom.status === 'playing' && room.status !== 'playing') {
          playSound('deal');
        } else if (updatedRoom.status === 'dealing_5' && room.status !== 'dealing_5') {
          playSound('heartbeat');
        } else if (updatedRoom.status === 'betting' && room.status !== 'betting') {
          playSound('bet');
        }
      }
      setRoom(updatedRoom);

      // 游戏进入结算状态
      if (updatedRoom.status === 'finished' && room?.status !== 'finished') {
        playSound('chips');
        const me = updatedRoom.players.find(p => p.id === user?.id);
        
        // 满屏红包彩带
        if (me && me.lastWin > 0) {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FF0000', '#FFA500']
          });
        }
        
        // 牛牛或以上大牌震屏 + 音效
        if (me && calculateBull(me.cards).type >= 10) {
          playSound('bigwin');
        }

        // 筹码飞行动画
        const dealer = updatedRoom.players.find(p => p.isDealer);
        if (dealer) {
          const dealerPos = getPlayerPositionStr(dealer.id, updatedRoom);
          const newChips: { id: string, fromPos: string, toPos: string }[] = [];
          
          updatedRoom.players.forEach(p => {
            if (p.isDealer) return;
            const pPos = getPlayerPositionStr(p.id, updatedRoom);
            if (p.lastWin < 0) {
              // Loser -> Dealer
              for(let i=0; i<3; i++) {
                newChips.push({ id: Math.random().toString(36).substr(2, 9), fromPos: pPos, toPos: dealerPos });
              }
            } else if (p.lastWin > 0) {
              // Dealer -> Winner
              for(let i=0; i<3; i++) {
                newChips.push({ id: Math.random().toString(36).substr(2, 9), fromPos: dealerPos, toPos: pPos });
              }
            }
          });
          
          setFlyingChips(newChips);
          setTimeout(() => setFlyingChips([]), 2000);
        }
      }
    });

    socket.on('emoteReceived', ({ fromId, targetId, emote }) => {
      playSound('emote');
      const animId = Math.random().toString(36).substr(2, 9);
      setFlyingEmotes(prev => [...prev, { id: animId, fromId, toId: targetId, emote }]);
      setTimeout(() => {
        setFlyingEmotes(prev => prev.filter(e => e.id !== animId));
      }, 1500);
    });

    socket.on('kicked', () => {
      alert('你已被房主移出房间');
      window.location.reload();
    });

    return () => {
      socket.off('roomUpdate');
      socket.off('kicked');
    };
  }, []);

  const handleActivate = () => {
    if (activationKey.toUpperCase() === room?.config.roomKey) {
      setIsActivated(true);
    } else {
      alert('激活码错误，请联系房主购买房卡');
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = { id: Math.random().toString(36).substr(2, 9), name: tempName };
    setUser(newUser);
    socket.emit('joinRoom', { roomId, user: newUser });
    setIsJoined(true);
    // If room doesn't exist yet, this user will be host and should be auto-activated
    if (!room) setIsActivated(true);
  };

  const handleReady = () => {
    if (!user || !room) return;
    playSound('click');
    socket.emit('ready', { roomId: room.id, userId: user.id });
  };

  const handleBid = (multiplier: number) => {
    if (!user || !room) return;
    playSound('bid');
    socket.emit('bid', { roomId: room.id, userId: user.id, multiplier });
  };

  const handleBet = (multiplier: number) => {
    if (!user || !room) return;
    playSound('bet');
    socket.emit('bet', { roomId: room.id, userId: user.id, multiplier });
  };

  const handleFinish = () => {
    if (!user || !room) return;
    playSound('reveal');
    const player = room.players.find(p => p.id === user.id);
    if (!player) return;
    const { type } = calculateBull(player.cards);
    socket.emit('finish', { roomId: room.id, userId: user.id, bull: type });
  };

  const handleAvatarClick = (playerId: string, rect: DOMRect) => {
    if (playerId === user?.id) return; // Don't emote to self
    setActiveEmoteMenu({
      playerId,
      x: rect.left + rect.width / 2,
      y: rect.top - 20
    });
  };

  const handleSendEmote = (emote: string) => {
    if (!user || !room || !activeEmoteMenu) return;
    socket.emit('sendEmote', {
      roomId: room.id,
      fromId: user.id,
      targetId: activeEmoteMenu.playerId,
      emote
    });
    setActiveEmoteMenu(null);
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Metal Texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum-dark.png')] opacity-30" />
        
        {/* Center Content */}
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
          <Crown className="w-24 h-24 text-yellow-500 mb-8" />
          
          <form onSubmit={handleJoin} className="w-full relative flex flex-col gap-6">
            <input
              type="text"
              placeholder="您的尊姓大名"
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              className="w-full bg-transparent border-b-2 border-yellow-500/50 p-4 text-center text-2xl font-black text-yellow-500 focus:border-yellow-400 outline-none placeholder:text-yellow-500/20"
              required
            />
            <div className="relative">
              <input
                type="text"
                placeholder="_ _ _ _ _ _"
                value={roomId}
                onChange={e => setRoomId(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full bg-transparent border-b-2 border-yellow-500/50 p-4 text-center text-4xl font-black text-yellow-500 tracking-[0.5em] focus:border-yellow-400 outline-none placeholder:text-yellow-500/20 uppercase placeholder:tracking-normal"
                required
              />
              {roomId.length === 6 && tempName && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  type="submit" 
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-yellow-500 hover:text-yellow-400"
                >
                  <ArrowRight className="w-8 h-8" />
                </motion.button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  const currentPlayer = room?.players.find(p => p.id === user?.id);
  const otherPlayers = room?.players.filter(p => p.id !== user?.id) || [];
  
  // Position mapping for UI
  const positions = ["top-left", "top-right", "mid-left", "mid-right"];

  return (
    <div className="min-h-screen text-white font-sans overflow-hidden relative">
      {/* Poker Table Background */}
      <div className="absolute inset-0 pointer-events-none opacity-100">
        <div className="absolute inset-0 bg-black/10" /> {/* Slight darken to make cards pop without hiding red */}
      </div>

      {/* Peek Cards Button */}
      {room?.status && room.status !== 'waiting' && room.status !== 'game_over' && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50">
          <button
            onMouseDown={() => { playSound('click'); setShowCards(true); }}
            onMouseUp={() => setShowCards(false)}
            onMouseLeave={() => setShowCards(false)}
            onTouchStart={() => { playSound('click'); setShowCards(true); }}
            onTouchEnd={() => setShowCards(false)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-full font-black transition-all shadow-2xl border-2",
              showCards 
                ? "bg-yellow-500 text-black border-yellow-400 scale-110" 
                : "bg-black/60 text-yellow-500 border-yellow-500/30 hover:bg-black/80"
            )}
          >
            {showCards ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            {showCards ? '正在看牌' : '按住看牌'}
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="absolute top-4 left-6 z-50 flex items-center gap-3">
        <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-lg flex items-center gap-2">
          <span className="text-xs font-bold text-white/70">局数</span>
          <span className="text-sm font-black text-white">{room?.currentRound}/{room?.config.totalRounds}</span>
        </div>
        <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-lg flex items-center gap-2">
          <span className="text-xs font-bold text-yellow-500/70">积分</span>
          <span className="text-sm font-black text-yellow-400">{currentPlayer?.score}</span>
        </div>
      </div>

      <button 
        onClick={() => window.location.reload()}
        className="absolute top-4 right-6 z-50 p-3 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-2xl transition-all border border-red-600/30"
      >
        <LogOut className="w-6 h-6" />
      </button>

      {/* Game Stage */}
      <div className="relative w-full h-screen max-w-7xl mx-auto">
        {/* Other Players Seats */}
        {otherPlayers.map((player, idx) => (
          <PlayerSeat 
            key={player.id} 
            player={player} 
            position={positions[idx] || "top-left"} 
            roomStatus={room?.status || ""}
            roomId={room?.id}
            onKick={currentPlayer?.isHost ? (id) => socket.emit('kickPlayer', { roomId: room?.id, targetId: id }) : undefined}
            scoreChange={scoreChanges[player.id]}
            onAvatarClick={handleAvatarClick}
          />
        ))}

        {/* Current Player Seat */}
        {currentPlayer && (
          <PlayerSeat 
            player={currentPlayer} 
            position="bottom" 
            isSelf 
            roomStatus={room?.status || ""}
            roomId={room?.id}
            scoreChange={scoreChanges[currentPlayer.id]}
            showCards={showCards}
            onAvatarClick={handleAvatarClick}
          />
        )}

        {/* Central Action Area */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-full max-w-md">
          {/* Bet Animations (Chips) */}
          <AnimatePresence>
            {betAnimations.map(anim => (
              <motion.div
                key={anim.id}
                initial={{ 
                  x: anim.from === 'bottom' ? 0 : (Math.random() > 0.5 ? -200 : 200), 
                  y: anim.from === 'bottom' ? 300 : -200,
                  scale: 0.5,
                  opacity: 0 
                }}
                animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full border-4 border-dashed border-white/40 bg-gradient-to-br from-yellow-500 to-orange-600 shadow-2xl flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center text-white font-black text-xs">
                      {anim.amount}
                    </div>
                  </div>
                  <div className="text-yellow-400 font-black text-xs mt-1 drop-shadow-lg">下注 {anim.amount}倍</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Emote Menu */}
          <AnimatePresence>
            {activeEmoteMenu && (
              <>
                <div className="fixed inset-0 z-[100]" onClick={() => setActiveEmoteMenu(null)} />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: 20 }}
                  style={{ left: activeEmoteMenu.x, top: activeEmoteMenu.y }}
                  className="fixed -translate-x-1/2 -translate-y-full z-[110] bg-black/80 backdrop-blur-xl p-2 rounded-full border border-white/20 shadow-2xl flex gap-2"
                >
                  {['🍺', '💣', '🌹', '💩', '👍'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleSendEmote(emoji)}
                      className="text-2xl sm:text-3xl hover:scale-125 active:scale-95 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Flying Emotes */}
          {flyingEmotes.map(emote => {
            const fromPos = getCoordinatesFromPos(getPlayerPositionStr(emote.fromId, room!));
            const toPos = getCoordinatesFromPos(getPlayerPositionStr(emote.toId, room!));
            return (
              <motion.div
                key={emote.id}
                initial={{ left: fromPos.x, top: fromPos.y, scale: 0.5, opacity: 0 }}
                animate={{ left: toPos.x, top: toPos.y, scale: 2, opacity: 1 }}
                exit={{ opacity: 0, scale: 3 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="fixed -translate-x-1/2 -translate-y-1/2 z-[120] text-6xl pointer-events-none drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
              >
                {emote.emote}
              </motion.div>
            );
          })}

          {/* Flying Chips */}
          {flyingChips.map(chip => {
            const fromPos = getCoordinatesFromPos(chip.fromPos);
            const toPos = getCoordinatesFromPos(chip.toPos);
            return (
              <motion.img
                key={chip.id}
                src="/images/ui/douzi.png"
                initial={{ left: fromPos.x, top: fromPos.y, scale: 0 }}
                animate={{ left: toPos.x, top: toPos.y, scale: 1, rotate: 360 }}
                transition={{ duration: 0.5 + Math.random() * 0.3, ease: "easeOut" }}
                onAnimationComplete={() => playSound('chips')}
                className="fixed -translate-x-1/2 -translate-y-1/2 z-[90] pointer-events-none w-8 h-8 drop-shadow-md"
              />
            );
          })}

          <AnimatePresence mode="wait">
            {room?.status === 'waiting' && (
              <motion.div 
                key="waiting"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center gap-6"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-black mb-2 drop-shadow-lg">等待开局</h2>
                  <p className="text-emerald-200 font-medium">满2人即可开始对决</p>
                </div>
                
                <div className="flex flex-col gap-4 w-full max-w-xs">
                  {!currentPlayer?.ready ? (
                    <button
                      onClick={handleReady}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-2xl font-black shadow-2xl transition-all active:scale-95 text-lg"
                    >
                      准备开始
                    </button>
                  ) : !isActivated ? (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
          <motion.div 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="bg-black/40 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 shadow-2xl w-full max-w-md text-center"
          >
            <div className="w-20 h-20 bg-yellow-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-yellow-500/30">
              <ShieldCheck className="w-10 h-10 text-yellow-500" />
            </div>
            <h1 className="text-3xl font-black mb-2">房卡激活</h1>
            <p className="text-slate-400 mb-8 text-sm">请输入房主提供的 6 位激活码进入房间</p>
            
            <div className="space-y-4">
              <input
                type="text"
                value={activationKey}
                onChange={(e) => setActivationKey(e.target.value.toUpperCase())}
                placeholder="输入激活码"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-center text-2xl font-black tracking-[0.5em] focus:border-yellow-500 outline-none transition-all placeholder:tracking-normal placeholder:text-sm"
                maxLength={6}
              />
              <button
                onClick={handleActivate}
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-black py-4 rounded-2xl font-black text-lg shadow-xl shadow-yellow-600/20 transition-all active:scale-95"
              >
                立即激活
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5">
              <p className="text-xs text-slate-500 mb-4">没有激活码？</p>
              <button className="text-yellow-500 font-bold text-sm hover:underline">联系房主购买房卡</button>
            </div>
          </motion.div>
        </div>
      ) : (
                    <div className="bg-blue-600/20 border-2 border-blue-500 text-blue-400 py-4 rounded-2xl font-black flex items-center justify-center gap-3">
                      <CheckCircle2 className="w-6 h-6" />
                      已准备，等待中
                    </div>
                  )}
                  
                  {currentPlayer?.isHost && room.players.filter(p => p.ready).length >= 2 && (
                    <button
                      onClick={() => { playSound('click'); socket.emit('forceStart', { roomId: room.id }); }}
                      className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white py-4 rounded-2xl font-black shadow-2xl transition-all active:scale-95 text-lg"
                    >
                      强制开局
                    </button>
                  )}
                  
                </div>
              </motion.div>
            )}

            {room?.status === 'bidding' && !currentPlayer?.hasBid && (
              <motion.div 
                key="bidding"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl text-center"
              >
                <h2 className="text-2xl font-black mb-6 text-yellow-400">请抢庄</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[0, 1, 2, 3, 4].map(m => {
                    // Recommendation based on all 5 cards (God Mode induction)
                    const isRecommended = m === 4 && calculateBull(currentPlayer.cards).type >= 7;
                    return (
                      <motion.button
                        key={m}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9, rotate: m === 0 ? -2 : 2 }}
                        onClick={() => handleBid(m)}
                        className={cn(
                          "py-2 sm:py-3 rounded-xl font-black text-sm sm:text-lg shadow-[0_4px_0_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none transition-all border-2 relative overflow-hidden group",
                          m === 0 
                            ? "bg-gradient-to-b from-slate-500 to-slate-700 border-slate-400 text-white" 
                            : "bg-gradient-to-b from-[#ffcc00] to-[#d48800] border-[#ffe44d] text-[#4a1c00]",
                          m === 4 && "col-span-2",
                          isRecommended && "ring-4 ring-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.6)]"
                        )}
                      >
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        
                        {m === 0 ? '不抢' : `${m}倍`}
                        
                        {isRecommended && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] px-1.5 rounded-full"
                          >
                            荐
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {room?.status === 'betting' && !currentPlayer?.isDealer && !currentPlayer?.hasBet && (
              <motion.div 
                key="betting"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl text-center"
              >
                <h2 className="text-2xl font-black mb-2 text-emerald-400">请下注</h2>
                <p className="text-[10px] text-slate-400 mb-6">当前最大可下注: {currentPlayer?.maxAllowedBet}倍</p>
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 5].map(m => {
                    const isDisabled = m > (currentPlayer?.maxAllowedBet || 5);
                    return (
                      <motion.button
                        key={m}
                        whileHover={!isDisabled ? { scale: 1.05 } : {}}
                        whileTap={!isDisabled ? { scale: 0.95 } : {}}
                        disabled={isDisabled}
                        onClick={() => handleBet(m)}
                        className={cn(
                          "py-2 sm:py-3 rounded-xl font-black text-sm sm:text-lg shadow-[0_4px_0_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none transition-all border-2 relative overflow-hidden group",
                          isDisabled 
                            ? "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50 border-slate-700" 
                            : "bg-gradient-to-b from-[#00bfff] to-[#0066cc] border-[#4dd2ff] text-white"
                        )}
                      >
                        {!isDisabled && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        )}
                        {m}倍
                      </motion.button>
                    );
                  })}
                  {room.config.allowPushBet && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleBet(currentPlayer?.maxAllowedBet || 1)}
                      className="col-span-2 py-2 sm:py-3 rounded-xl font-black text-sm sm:text-lg shadow-[0_4px_0_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none transition-all border-2 bg-gradient-to-b from-orange-500 to-red-600 border-orange-400 text-white flex items-center justify-center gap-2 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                      <Zap className="w-5 h-5 fill-current" />
                      梭哈 (最大倍数)
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}

            {room?.status === 'playing' && !currentPlayer?.finish && (
              <motion.div 
                key="playing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <button
                  onClick={handleFinish}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-16 py-6 rounded-[2rem] font-black text-2xl shadow-[0_20px_50px_rgba(16,185,129,0.3)] transition-all active:scale-95 border-b-8 border-emerald-800"
                >
                  摊 牌
                </button>
              </motion.div>
            )}

            {room?.status === 'finished' && (
              <motion.div 
                key="finished"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-black/60 backdrop-blur-2xl p-10 rounded-[3rem] border-2 border-yellow-500/30 shadow-[0_0_100px_rgba(234,179,8,0.2)] text-center max-w-md w-full"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-yellow-500/20">
                  <Trophy className="w-12 h-12 text-black" />
                </div>
                <h2 className="text-4xl font-black mb-2 text-white">对局结束</h2>
                <p className="text-slate-400 mb-6 font-medium">结算完成</p>
                
                <div className="grid grid-cols-1 gap-3 mb-8 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                  {room.players.map(p => (
                    <div key={p.id} className={cn(
                      "p-3 rounded-2xl border flex items-center justify-between",
                      p.isDealer ? "bg-yellow-500/10 border-yellow-500/30" : "bg-white/5 border-white/10"
                    )}>
                      <div className="flex flex-col items-start">
                        <span className="font-bold text-xs text-white">{p.name} {p.isDealer && '(庄)'}</span>
                        <span className={cn(
                          "text-xs font-black",
                          p.lastWin > 0 ? "text-emerald-400" : (p.lastWin < 0 ? "text-red-400" : "text-slate-400")
                        )}>
                          {p.lastWin > 0 ? `+${p.lastWin}` : p.lastWin}
                        </span>
                      </div>
                      <span className="text-blue-400 font-black text-[10px] bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20">
                        {getBullName(calculateBull(p.cards).type)}
                      </span>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => socket.emit('ready', { roomId: room.id, userId: user?.id })}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95"
                >
                  继续对战
                </button>
              </motion.div>
            )}
            {room?.status === 'game_over' && (
              <motion.div 
                key="game_over"
                id="summary-board"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-black/60 backdrop-blur-2xl border-4 border-yellow-500 p-10 rounded-[3rem] shadow-[0_0_100px_rgba(234,179,8,0.4)] text-center max-w-3xl w-full z-[60] relative overflow-hidden"
              >
                {/* Anti-counterfeit Watermark */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.05] rotate-[-15deg] flex flex-wrap gap-x-32 gap-y-24 items-center justify-center scale-150">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="text-2xl font-black whitespace-nowrap text-yellow-500">至尊斗牛 SUPREME</div>
                      <div className="text-[10px] font-mono text-white">{new Date().toLocaleString()}</div>
                      <div className="text-[10px] font-mono text-white">{room.serialNumber}</div>
                    </div>
                  ))}
                </div>

                <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6 relative z-10" />
                <h2 className="text-4xl font-black text-white mb-2 relative z-10">总结算战报</h2>
                <p className="text-slate-400 mb-8 font-mono relative z-10">
                  流水号: {room.serialNumber} | 房间号: {room.id}
                  <br/>
                  <span className="text-yellow-500/80 text-[10px]">防伪验证码: {room.reportHash}</span>
                </p>
                
                {/* Honor Wall */}
                <div className="grid grid-cols-3 gap-4 mb-10">
                  <div className="bg-gradient-to-br from-yellow-500/20 to-transparent p-4 rounded-3xl border border-yellow-500/20">
                    <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <div className="text-[10px] font-bold text-yellow-500 uppercase">至尊之神</div>
                    <div className="text-sm font-black text-white truncate">
                      {room.players.sort((a, b) => b.score - a.score)[0]?.name}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/20 to-transparent p-4 rounded-3xl border border-blue-500/20">
                    <Zap className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-[10px] font-bold text-blue-500 uppercase">运气之王</div>
                    <div className="text-sm font-black text-white truncate">
                      {room.players.sort((a, b) => b.stats.luckCount - a.stats.luckCount)[0]?.name}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-red-500/20 to-transparent p-4 rounded-3xl border border-red-500/20">
                    <Ghost className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <div className="text-[10px] font-bold text-red-500 uppercase">慈善大使</div>
                    <div className="text-sm font-black text-white truncate">
                      {room.players.sort((a, b) => a.score - b.score)[0]?.name}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-10">
                  <div className="grid grid-cols-2 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    <div className="text-left">玩家</div>
                    <div className="text-right">最终得分</div>
                  </div>
                  {room.players.sort((a, b) => b.score - a.score).map((p, idx) => (
                    <div key={p.id} className="grid grid-cols-2 items-center p-4 bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden group">
                      {idx === 0 && <div className="absolute inset-0 bg-yellow-500/5 animate-pulse" />}
                      <div className="flex items-center gap-3 relative z-10">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px]",
                          idx === 0 ? "bg-yellow-500 text-black" : "bg-slate-800 text-slate-400"
                        )}>
                          {idx + 1}
                        </div>
                        <span className="font-bold text-white text-sm truncate">{p.name}</span>
                      </div>
                      <div className={cn("font-black text-xl text-right relative z-10", p.score >= 0 ? "text-emerald-400" : "text-white")}>
                        {p.score >= 0 ? `+${p.score}` : p.score}
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 px-4 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest border-t border-white/5 mt-4">
                    <div className="text-left">系统校验</div>
                    <div className="text-right">Σ {room.players.reduce((acc, p) => acc + p.score, 0)}</div>
                  </div>
                  <div className="text-[8px] text-slate-700 mt-1 italic">
                    注：所有人最终结账分 ({room.players.reduce((acc, p) => acc + p.score, 0)}) = 0
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-slate-800 text-slate-400 py-5 rounded-2xl font-black text-xl transition-all active:scale-95"
                  >
                    返回大厅
                  </button>
                  <button
                    onClick={handleCaptureAndShare}
                    disabled={isCapturing}
                    className="bg-yellow-600 hover:bg-yellow-500 text-black py-5 rounded-2xl font-black text-xl transition-all active:scale-95 shadow-xl shadow-yellow-600/20 disabled:opacity-50"
                  >
                    {isCapturing ? '生成中...' : '导出战报'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Timer Overlay (Wood/Alarm Style) */}
      {['bidding', 'betting', 'playing'].includes(room?.status || '') && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none flex flex-col items-center">
          {/* Alarm Clock Style Timer */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20">
            {/* Ears */}
            <div className="absolute top-0 left-1 w-4 h-4 sm:w-6 sm:h-6 bg-yellow-600 rounded-full border-2 border-yellow-800" />
            <div className="absolute top-0 right-1 w-4 h-4 sm:w-6 sm:h-6 bg-yellow-600 rounded-full border-2 border-yellow-800" />
            
            {/* Main Body */}
            <div className="absolute inset-2 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full border-4 border-yellow-800 shadow-xl flex items-center justify-center">
              <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center shadow-inner">
                <span className="text-2xl sm:text-3xl font-black text-red-600 drop-shadow-sm">
                  {Math.max(0, Math.ceil(room!.config.timeoutSeconds - (Date.now() - room!.phaseStartTime) / 1000))}
                </span>
              </div>
            </div>
            
            {/* Legs */}
            <div className="absolute bottom-0 left-3 w-2 h-3 bg-yellow-800 rotate-[30deg] rounded-b-sm" />
            <div className="absolute bottom-0 right-3 w-2 h-3 bg-yellow-800 -rotate-[30deg] rounded-b-sm" />
          </div>
          
          <div className="mt-2 text-white/60 text-xs sm:text-sm font-bold uppercase tracking-widest drop-shadow-md">
            {room?.status === 'bidding' ? '请抢庄' : room?.status === 'betting' ? '请下注' : '请摊牌'}
          </div>
        </div>
      )}

      {/* Game Status Banner */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30">
        <AnimatePresence>
          {room?.status !== 'waiting' && room?.status !== 'finished' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 text-sm font-bold text-emerald-300 flex items-center gap-3"
            >
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              {room?.status === 'dealing_4' && '正在发放初始牌...'}
              {room?.status === 'bidding' && '抢庄环节进行中...'}
              {room?.status === 'betting' && '闲家正在下注...'}
              {room?.status === 'dealing_5' && '正在发放最后一张牌...'}
              {room?.status === 'playing' && '等待玩家摊牌...'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>



    </div>
  );
}
