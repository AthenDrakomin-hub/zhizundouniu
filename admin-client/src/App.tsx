import React, { useState, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { ShieldCheck, ArrowRight, Zap, Users, Plus, X, Trash2, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Room, Card } from '../../src/types';
import { getWinningCards } from '../../src/lib/gameLogic';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getSocketUrl = () => {
  if (!import.meta.env.PROD) return 'http://localhost:3000';
  // If we are on admin.yefeng.us.cc, we should connect to the same host's root but through the app domain, or just omit URL
  if (window.location.hostname.includes('yefeng.us.cc')) {
    return 'https://app.yefeng.us.cc';
  }
  return window.location.origin;
};

const getApiUrl = (path: string) => {
  return `${getSocketUrl()}${path}`;
};

const socket: Socket = io(getSocketUrl());

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

  // User Management State
  const [showUserModal, setShowUserModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(getApiUrl('/api/admin/users'), {
        headers: { 'x-admin-key': adminKey }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      showToast('获取用户失败: ' + err.message);
    }
  };

  useEffect(() => {
    if (showUserModal) {
      fetchUsers();
    }
  }, [showUserModal]);

  const handleAddCards = async (userId: string) => {
    const amountStr = prompt('请输入要增加的房卡数量（可输入负数扣除）:');
    if (!amountStr) return;
    const amount = parseInt(amountStr);
    if (isNaN(amount)) {
      showToast('输入无效');
      return;
    }
    try {
      const res = await fetch(getApiUrl(`/api/admin/users/${userId}/cards`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ amount })
      });
      if (!res.ok) throw new Error('Failed to update cards');
      showToast('房卡更新成功');
      fetchUsers();
    } catch (err: any) {
      showToast('操作失败: ' + err.message);
    }
  };

  const handleSetTargetProfit = async (userId: string) => {
    const profitStr = prompt('请输入该玩家的预期目标利润 (当前为系统吃分/吐分依据):');
    if (!profitStr) return;
    const targetProfit = parseInt(profitStr);
    if (isNaN(targetProfit)) {
      showToast('输入无效');
      return;
    }
    try {
      const res = await fetch(getApiUrl(`/api/admin/users/${userId}/target-profit`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ targetProfit })
      });
      if (!res.ok) throw new Error('Failed to update target profit');
      showToast('目标利润设置成功');
      fetchUsers();
    } catch (err: any) {
      showToast('操作失败: ' + err.message);
    }
  };

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, key: 'alipayQrUrl' | 'usdtQrUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024) { // limit 200kb
        showToast('图片太大，请选择小于200KB的图片');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setSystemConfig(prev => ({ ...prev, [key]: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

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

  const handleDeleteRoom = (roomId: string) => {
    if (confirm(`确定要解散房间 ${roomId} 吗？此操作不可恢复！`)) {
      socket.emit('adminDeleteRoom', { roomId });
      showToast(`已解散房间 ${roomId}`);
    }
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
          <div className="bg-[#1a0505]/95 backdrop-blur-3xl border border-red-500/30 p-8 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(220,38,38,0.5)] relative overflow-hidden">
            <div className="flex flex-col items-center gap-3 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.6)] border border-red-400/50">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-black tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">至尊后台系统</h1>
                <p className="text-red-400 text-xs font-bold tracking-[0.2em] mt-1">SUPREME ADMIN CONSOLE</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-2 tracking-widest">安全密钥 (ADMIN KEY)</label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full bg-black/60 border border-red-500/30 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none transition-all shadow-inner text-center font-mono tracking-widest"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 tracking-widest border border-red-500/50"
              >
                验证身份 <ArrowRight className="w-5 h-5" />
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
          <div className="grid grid-cols-3 gap-3 mb-8">
            <button
              onClick={handleCreateRoom}
              className="bg-[#1a0505]/95 hover:bg-black/90 text-white font-black p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.2)] active:scale-95 transition-all border border-red-500/50 hover:border-red-400"
            >
              <Plus className="w-6 h-6 stroke-[3] text-red-400" />
              <span className="tracking-widest text-xs text-white/90">创建房间</span>
            </button>
            <button
              onClick={() => setShowConfigModal(true)}
              className="bg-[#1a0505]/95 hover:bg-black/90 text-white font-black p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,0,0,0.5)] active:scale-95 transition-all border border-white/20 hover:border-white/40"
            >
              <ShieldCheck className="w-6 h-6 text-white/80" />
              <span className="tracking-widest text-xs text-white/90">收款设置</span>
            </button>
            <button
              onClick={() => setShowUserModal(true)}
              className="bg-[#1a0505]/95 hover:bg-black/90 text-white font-black p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,0,0,0.5)] active:scale-95 transition-all border border-white/20 hover:border-white/40"
            >
              <Users className="w-6 h-6 text-white/80" />
              <span className="tracking-widest text-xs text-white/90">用户管理</span>
            </button>
          </div>

          {/* 列表区 */}
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="w-1.5 h-4 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            <h2 className="text-sm font-bold text-white/90 tracking-widest uppercase">所有房间监控</h2>
          </div>
          
          <div className="space-y-3">
            {allRooms.map(r => (
              <div 
                key={r.id} 
                onClick={() => handleJoinRoom(r.id)}
                className="bg-[#1a0505]/95 backdrop-blur-md p-5 rounded-2xl border border-white/20 flex items-center justify-between cursor-pointer hover:border-red-500/80 hover:bg-black transition-all shadow-[0_10px_20px_rgba(0,0,0,0.3)] group"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-black text-xl tracking-wider text-white">房号: {r.id}</span>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded font-bold tracking-widest border",
                      r.status === 'game_over' ? "bg-white/10 text-white/50 border-white/20" : "bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                    )}>
                      {r.status === 'game_over' ? '已结束' : '进行中'}
                    </span>
                  </div>
                  <div className="text-xs text-white/60 flex items-center gap-3 font-medium tracking-wide">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {r.players.length}/{r.config.maxPlayers} 人
                      </span>
                      <div className="w-px h-3 bg-white/20" />
                      <span className="flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" /> 进度: <span className="text-white">{r.currentRound}</span>/{r.config.totalRounds}
                      </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoom(r.id);
                      }}
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500/80 hover:text-white text-white/40 transition-colors shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-red-500/20 group-hover:text-red-400 transition-colors border border-transparent group-hover:border-red-500/30">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
            ))}
            {allRooms.length === 0 && (
              <div className="text-center py-12 bg-[#1a0505]/60 backdrop-blur-sm rounded-2xl border border-white/10 shadow-inner">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-white/40 font-bold tracking-widest text-sm">暂无房间运行中</p>
                <p className="text-white/20 text-xs mt-1">等待玩家创建或手动创建</p>
              </div>
            )}
          </div>
        </div>

        {/* Config Modal */}
          {showConfigModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className="bg-[#1a0505]/95 border border-red-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.2)] relative">
                <div className="p-5 border-b border-red-500/20 flex justify-between items-center bg-black/60">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-red-400" />
                    <h2 className="font-black tracking-widest text-xl text-white">系统收款设置</h2>
                  </div>
                  <button onClick={() => setShowConfigModal(false)} className="text-white/60 hover:text-white bg-white/5 hover:bg-white/20 p-2 rounded-full transition-colors"><X className="w-5 h-5"/></button>
                </div>
                <div className="p-6 space-y-5">
                <div>
                    <label className="block text-xs font-bold text-white/80 mb-2 tracking-widest">支付宝收款码路径/URL或上传</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={systemConfig.alipayQrUrl}
                        onChange={e => setSystemConfig({...systemConfig, alipayQrUrl: e.target.value})}
                        className="flex-1 bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-500 text-white"
                      />
                      <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl border border-white/20 text-xs font-bold whitespace-nowrap transition-colors">
                        上传图片
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'alipayQrUrl')} />
                      </label>
                    </div>
                    {systemConfig.alipayQrUrl && systemConfig.alipayQrUrl.startsWith('data:image') && (
                      <img src={systemConfig.alipayQrUrl} alt="alipay" className="w-16 h-16 object-contain mt-2 rounded border border-white/10" />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/80 mb-2 tracking-widest">USDT收款码路径/URL或上传</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={systemConfig.usdtQrUrl}
                        onChange={e => setSystemConfig({...systemConfig, usdtQrUrl: e.target.value})}
                        className="flex-1 bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-500 text-white"
                      />
                      <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl border border-white/20 text-xs font-bold whitespace-nowrap transition-colors">
                        上传图片
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'usdtQrUrl')} />
                      </label>
                    </div>
                    {systemConfig.usdtQrUrl && systemConfig.usdtQrUrl.startsWith('data:image') && (
                      <img src={systemConfig.usdtQrUrl} alt="usdt" className="w-16 h-16 object-contain mt-2 rounded border border-white/10" />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/80 mb-2 tracking-widest">USDT (TRC20) 钱包地址</label>
                    <input
                      type="text"
                      value={systemConfig.usdtAddress}
                      onChange={e => setSystemConfig({...systemConfig, usdtAddress: e.target.value})}
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-red-500 text-white"
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

        {/* User Management Modal */}
        {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#1a0505]/95 border border-red-500/30 rounded-3xl w-full max-w-3xl overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.2)] relative max-h-[85vh] flex flex-col">
              <div className="p-5 border-b border-red-500/20 flex justify-between items-center bg-black/60 shrink-0">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-red-400" />
                  <h2 className="font-black tracking-widest text-xl text-white">用户管理中心</h2>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={fetchUsers} className="text-sm font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-colors">刷新列表</button>
                  <button onClick={() => setShowUserModal(false)} className="text-white/60 hover:text-white bg-white/5 hover:bg-white/20 p-2 rounded-full transition-colors"><X className="w-5 h-5"/></button>
                </div>
              </div>
              <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
                {users.length === 0 ? (
                  <div className="text-center text-white/50 py-10 text-sm font-bold tracking-widest">暂无用户</div>
                ) : (
                  <div className="space-y-4">
                    {users.map(u => (
                      <div key={u.id} className="bg-black/60 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-red-500/50 transition-all shadow-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <img src={u.avatar || '/images/ui/head_boy.png'} alt="avatar" className="w-10 h-10 rounded-full border border-white/20 object-cover" />
                            <span className="font-black text-lg text-white">{u.username}</span>
                            {u.role === 'admin' && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded font-black tracking-wider border border-red-500/30">ADMIN</span>}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-white/80 font-medium pl-1">
                            <span className="text-white/50 text-xs">ID: {u.id}</span>
                            <span className="flex items-center gap-1"><span className="text-white/50">房卡:</span> <span className="text-yellow-400 font-black text-base">{u.room_cards}</span></span>
                            <span className="flex items-center gap-1"><span className="text-white/50">总盈亏:</span> <span className={cn("font-black", u.current_profit > 0 ? "text-green-400" : u.current_profit < 0 ? "text-red-400" : "text-white")}>{u.current_profit}</span></span>
                            <span className="flex items-center gap-1"><span className="text-white/50">点杀目标:</span> <span className="text-purple-400 font-black">{u.target_profit}</span></span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                          <button onClick={() => handleAddCards(u.id)} className="bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 border border-yellow-500/30 px-4 py-2 rounded-xl text-sm font-black active:scale-95 transition-all">
                            发放房卡
                          </button>
                          <button onClick={() => handleSetTargetProfit(u.id)} className="bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 border border-purple-500/30 px-4 py-2 rounded-xl text-sm font-black active:scale-95 transition-all">
                            设目标盈亏
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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