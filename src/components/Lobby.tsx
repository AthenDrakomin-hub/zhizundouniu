import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Gamepad2, User, Search, RefreshCw, Smartphone, Package, Shield, LayoutGrid, X, MessageSquare, Settings, ArrowRight, Copy, MessageCircle as WechatIcon, Crown, Swords, Coins, Hexagon, Sprout, Flame } from 'lucide-react';
import { cn } from '../lib/utils';
import { socket } from '../App';

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
  const [toastMsg, setToastMsg] = useState('');
  const [openPanel, setOpenPanel] = useState('');
  const [payMethod, setPayMethod] = useState<'alipay' | 'usdt'>('alipay');
  const [cards, setCards] = useState(parseInt(localStorage.getItem('player_cards') || '0', 10));
  const [systemConfig, setSystemConfig] = useState({
    alipayQrUrl: '/images/ui/alipay_qr.png',
    usdtQrUrl: '/images/ui/usdt_qr.png',
    usdtAddress: 'T_YOUR_USDT_ADDRESS_HERE'
  });

  useEffect(() => {
    socket.emit('getSystemConfig');
    const handleSystemConfig = (config: any) => {
      setSystemConfig(config);
    };
    socket.on('systemConfigUpdated', handleSystemConfig);

    const handleCardsUpdated = () => {
      setCards(parseInt(localStorage.getItem('player_cards') || '0', 10));
    };
    window.addEventListener('cardsUpdated', handleCardsUpdated);
    
    return () => {
      window.removeEventListener('cardsUpdated', handleCardsUpdated);
      socket.off('systemConfigUpdated', handleSystemConfig);
    };
  }, []);

  const [avatar, setAvatar] = useState(localStorage.getItem('player_avatar') || '/images/ui/head_boy.png');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2000);
  };

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
          { 
            id: 'bull', 
            name: '斗牛集合', 
            tag: '火爆', 
            bg: 'linear-gradient(135deg, #FF4B2B 0%, #8B0000 100%)',
            border: '#FFD700',
            icon: Flame,
            desc: '百人抢庄 刺激翻倍'
          },
          { 
            id: 'sangong', 
            name: '三公集合', 
            bg: 'linear-gradient(135deg, #11998E 0%, #004d40 100%)',
            border: '#00FF87',
            icon: Crown,
            desc: '经典三公 纯粹博弈'
          },
          { 
            id: 'zhajinhua', 
            name: '炸金花集合', 
            tag: '经典', 
            bg: 'linear-gradient(135deg, #FDC830 0%, #F37335 100%)',
            border: '#FFF500',
            icon: Swords,
            desc: '心理博弈 赢家通吃'
          },
          { 
            id: 'paijiu', 
            name: '牌九合集', 
            bg: 'linear-gradient(135deg, #8A2387 0%, #E94057 100%)',
            border: '#FF8A00',
            icon: Hexagon,
            desc: '传统骨牌 实力较量'
          },
          { 
            id: 'doudizhu', 
            name: '欢乐斗地主', 
            bg: 'linear-gradient(135deg, #1CB5E0 0%, #000851 100%)',
            border: '#00D2FF',
            icon: Sprout,
            desc: '国民游戏 全民同乐'
          },
          { 
            id: 'majiang', 
            name: '血战麻将', 
            bg: 'linear-gradient(135deg, #1D976C 0%, #093028 100%)',
            border: '#9D50BB',
            icon: Coins,
            desc: '血战到底 刮风下雨'
          }
        ].map((game) => (
          <motion.div
            key={game.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenModal}
            className="relative h-36 rounded-3xl p-4 flex flex-col justify-end overflow-hidden cursor-pointer shadow-[0_10px_20px_rgba(0,0,0,0.5)] group"
            style={{
              background: game.bg,
              border: `2px solid ${game.border}80`,
              boxShadow: `inset 0 0 30px ${game.border}30, 0 10px 20px rgba(0,0,0,0.5)`
            }}
          >
            {/* Dynamic ambient glow based on border color */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-screen" 
                 style={{ background: `radial-gradient(circle at center, ${game.border}40 0%, transparent 70%)` }} />

            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }}></div>

            {/* Content */}
            <div className="relative z-10 w-full">
              <h3 className="text-xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-widest bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
                {game.name}
              </h3>
              <p className="text-[10px] font-bold text-white/80 tracking-widest mt-0.5 uppercase opacity-80 drop-shadow-md">
                {game.desc}
              </p>
            </div>
            
            {game.tag && (
              <div className="absolute top-3 left-3 bg-gradient-to-b from-[#FF4500] to-[#8B0000] border border-[#FFD700] text-[#FFF] text-[10px] px-2 py-0.5 rounded-full font-black shadow-lg z-10 animate-pulse">
                {game.tag}
              </div>
            )}

            {/* Background icon with dynamic styling */}
            <game.icon 
              className="absolute -top-2 -right-2 w-20 h-20 pointer-events-none drop-shadow-2xl opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-500" 
              style={{ color: game.border }}
              strokeWidth={1.5}
            />
            
            {/* Glossy reflection effect */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent transform -skew-y-6 -translate-y-4 pointer-events-none" />
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderRoom = () => (
    <div className="flex-1 flex flex-col pt-4 px-4 pb-24 relative">
      <div className="flex justify-between items-center z-10 mb-4">
        <button onClick={() => showToast('已刷新历史战绩')} className="flex items-center gap-2 bg-gradient-to-b from-[#FFF] to-[#E0E0E0] text-[#333] font-bold px-4 py-1.5 rounded-lg border border-[#D4AF37] shadow-md active:scale-95 transition-transform">
          战绩刷新 <RefreshCw className="w-4 h-4 text-[#D4AF37]" />
        </button>
      </div>
      
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="text-center flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-black/40 rounded-full flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <LayoutGrid className="w-10 h-10 text-white/20" />
          </div>
          <h2 className="text-[#FFD700] text-xl font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-widest">
            暂无进行中的房间
          </h2>
          <p className="text-white/50 text-sm font-medium tracking-wider">
            请前往「大厅」选择游戏并输入房间号创建对局
          </p>
          <button 
            onClick={() => setActiveTab('hall')}
            className="mt-4 bg-gradient-to-r from-[#D4AF37] to-[#F2C94C] text-black px-8 py-3 rounded-full font-black shadow-[0_5px_15px_rgba(212,175,55,0.4)] active:scale-95 transition-all"
          >
            前往大厅创建房间
          </button>
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
            <img src={avatar} alt="avatar" className="w-full h-full rounded-xl object-cover" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white drop-shadow-md">{tempName}</h2>
            <p className="text-xs text-[#D4AF37] font-medium mt-1 tracking-widest">ID: {localStorage.getItem('player_id')?.substring(0,6).toUpperCase() || '123456'}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => {
            navigator.clipboard.writeText(localStorage.getItem('player_id') || '');
            showToast('ID已复制到剪贴板');
          }} className="bg-gradient-to-r from-[#4A2F2F] to-[#2A1F1F] border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-bold px-3 py-1.5 rounded-lg shadow-md active:scale-95 flex items-center justify-center gap-1">
            <Copy className="w-3 h-3" /> 复制 ID
          </button>
          <button onClick={() => {
            showToast('正在同步微信资料...');
            setTimeout(() => {
              // 在这里预留重新拉取微信授权/资料同步的接口
              showToast('微信资料已是最新');
            }, 1000);
          }} className="bg-gradient-to-r from-[#1A8A7A] to-[#0A4F46] border border-[#D4AF37]/50 text-[#FDFBF7] text-xs font-bold px-3 py-1.5 rounded-lg shadow-md active:scale-95 flex items-center justify-center gap-1 mt-1">
            <RefreshCw className="w-3 h-3" /> 同步资料
          </button>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="flex flex-col gap-3 mt-4">
        <div onClick={() => setOpenPanel('cards')} className="bg-gradient-to-r from-[#5C2D38] to-[#4A1A24] rounded-xl border border-white/10 flex items-center justify-between p-4 cursor-pointer shadow-lg active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-3 text-white">
            <Package className="w-5 h-5 text-[#FFD700]" />
            <span className="font-bold tracking-widest">我的房卡包</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#D4AF37] font-bold tracking-widest">剩余 {cards} 张</span>
            <ArrowRight className="w-4 h-4 text-white/30" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPanelContent = () => {
    switch (openPanel) {
      case 'store': return (
        <div className="flex flex-col items-center gap-4 py-2 w-full max-w-sm mx-auto">
          {/* 房卡商品信息 */}
          <div className="bg-gradient-to-b from-[#1a1a1a] to-black w-full rounded-2xl border border-[#D4AF37]/30 overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>
            
            <div className="p-4 flex items-center justify-between border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-2">
                <img src="/images/ui/logo3.png" alt="logo" className="w-8 h-8 object-contain drop-shadow-lg mix-blend-screen" />
                <div>
                  <div className="text-[#D4AF37] font-black text-lg tracking-wider">至尊房卡 <span className="text-white/80 text-sm font-bold">× 1</span></div>
                  <div className="text-[10px] text-white/40 tracking-widest">创建房间专属通行证</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-red-500 font-black text-2xl drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">￥20</div>
                <div className="text-[10px] text-white/40 mt-0.5">≈ 3 USDT</div>
              </div>
            </div>

            {/* 支付方式切换 */}
            <div className="flex border-b border-white/5 bg-black/60">
              <button
                onClick={() => setPayMethod('alipay')}
                className={`flex-1 py-3 text-sm font-bold transition-colors ${payMethod === 'alipay' ? 'text-[#1677FF] bg-[#1677FF]/10 border-b-2 border-[#1677FF]' : 'text-white/50 hover:text-white/80'}`}
              >
                支付宝转账
              </button>
              <button
                onClick={() => setPayMethod('usdt')}
                className={`flex-1 py-3 text-sm font-bold transition-colors ${payMethod === 'usdt' ? 'text-[#26A17B] bg-[#26A17B]/10 border-b-2 border-[#26A17B]' : 'text-white/50 hover:text-white/80'}`}
              >
                USDT (TRC20)
              </button>
            </div>

            {/* 收款码/地址区域 */}
            <div className="p-6 flex flex-col items-center justify-center bg-[#111] min-h-[260px]">
              {payMethod === 'alipay' ? (
                <>
                  <div className="text-xs text-white/50 mb-3 flex items-center gap-2">
                    <div className="w-8 h-px bg-white/10"></div>
                    <span className="tracking-widest">支付宝个人收款码</span>
                    <div className="w-8 h-px bg-white/10"></div>
                  </div>

                  <div className="bg-white p-3 rounded-2xl shadow-[0_0_30px_rgba(22,119,255,0.15)] relative group">
                    <img
                      src={systemConfig.alipayQrUrl}
                      alt="支付宝收款码"
                      className="w-40 h-40 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src='https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=alipay_qr_placeholder&color=000000&bgcolor=ffffff';
                      }}
                    />
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#1677FF]/50 blur-[2px] animate-scan"></div>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#1677FF]/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#1677FF]"></div>
                    </div>
                    <span className="text-xs font-bold text-[#1677FF]">打开支付宝扫一扫</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs text-white/50 mb-3 flex items-center gap-2">
                    <div className="w-8 h-px bg-white/10"></div>
                    <span className="tracking-widest">USDT (TRC20) 收款地址</span>
                    <div className="w-8 h-px bg-white/10"></div>
                  </div>

                  <div className="bg-white p-3 rounded-2xl shadow-[0_0_30px_rgba(38,161,123,0.15)] relative group mb-4">
                    <img
                      src={systemConfig.usdtQrUrl}
                      alt="USDT收款码"
                      className="w-32 h-32 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src=`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${systemConfig.usdtAddress}&color=000000&bgcolor=ffffff`;
                      }}
                    />
                  </div>

                  <div className="w-full bg-black/50 border border-white/10 rounded-lg p-3 flex flex-col gap-2">
                    <div className="text-[10px] text-white/40">充值地址 (点击复制):</div>
                    <div 
                      className="text-xs font-mono text-[#26A17B] break-all cursor-pointer active:scale-95 transition-transform"
                      onClick={() => {
                        navigator.clipboard.writeText(systemConfig.usdtAddress);
                        showToast('USDT地址已复制');
                      }}
                    >
                      {systemConfig.usdtAddress}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 支付说明与ID */}
            <div className="p-4 bg-black/40 border-t border-white/5 text-center">
              <p className="text-[11px] text-[#D4AF37]/80 leading-relaxed font-medium">
                此为<span className="text-white font-bold px-1">个人人工收款</span>，付款时请务必<span className="text-red-400 font-bold px-1">备注游戏ID</span><br/>
                或在付款后截图发给客服，核实后<span className="text-white">人工发卡</span>
              </p>
              
              <div className="mt-3 flex items-center justify-center gap-2 bg-black/50 py-2 px-3 rounded-lg border border-white/10">
                <span className="text-xs text-white/40">您的ID:</span>
                <span className="text-sm font-mono text-white tracking-widest">{localStorage.getItem('player_id') || '游客'}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(localStorage.getItem('player_id') || '');
                    showToast('已复制游戏ID，请在付款时备注');
                  }}
                  className="ml-2 bg-white/10 hover:bg-white/20 text-xs px-2 py-1 rounded transition-colors text-white/80 active:scale-95"
                >
                  复制ID
                </button>
              </div>
            </div>
          </div>

          {/* 开发测试用的模拟充值按钮 (真实上线时可隐藏或加密码保护) */}
          {import.meta.env.DEV && (
            <button
              onClick={() => {
                const current = parseInt(localStorage.getItem('player_cards') || '0', 10);
                localStorage.setItem('player_cards', (current + 1).toString());
                setCards(current + 1);
                window.dispatchEvent(new Event('cardsUpdated'));
                showToast('测试通道成功：房卡 +1');
              }}
              className="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-[#D4AF37]/30 text-[#D4AF37]/70 text-sm font-bold hover:bg-[#D4AF37]/10 transition-colors active:scale-[0.98] flex flex-col items-center justify-center gap-1"
            >
              <span>[开发者测试] 模拟付款成功</span>
              <span className="text-[10px] font-normal opacity-50">点击直接增加一张房卡，仅在开发环境可见</span>
            </button>
          )}
        </div>
      );
      case 'chat': return <div className="text-center text-white/70 py-4">全服聊天室建设中，敬请期待。</div>;
      case 'phone': return (
         <div className="flex flex-col gap-4">
           <input type="text" placeholder="请输入11位手机号" className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37]" id="phoneInput" defaultValue={localStorage.getItem('player_phone') || ''} />
           <button onClick={() => {
              const val = (document.getElementById('phoneInput') as HTMLInputElement).value;
              localStorage.setItem('player_phone', val);
              showToast('手机号已绑定');
              setOpenPanel('');
           }} className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-black py-3 rounded-xl active:scale-[0.98] transition-transform shadow-[0_5px_15px_rgba(212,175,55,0.4)]">绑定手机</button>
         </div>
      );
      case 'key': return (
         <div className="flex flex-col gap-4">
           <input type="password" placeholder="请输入6位安全密钥" className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37]" id="keyInput" defaultValue={localStorage.getItem('player_key') || ''} />
           <button onClick={() => {
              const val = (document.getElementById('keyInput') as HTMLInputElement).value;
              localStorage.setItem('player_key', val);
              showToast('安全密钥已保存');
              setOpenPanel('');
           }} className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-black py-3 rounded-xl active:scale-[0.98] transition-transform shadow-[0_5px_15px_rgba(212,175,55,0.4)]">保存设置</button>
         </div>
      );
      case 'cards': return (
        <div className="text-center flex flex-col gap-4 items-center py-4">
          <Package className="w-12 h-12 text-[#FFD700] mx-auto opacity-80" />
          <div className="text-white/80">当前剩余 <span className="text-[#FFD700] font-black text-2xl px-2">{cards}</span> 张房卡</div>
          <button onClick={() => setOpenPanel('store')} className="bg-white/10 border border-white/20 text-white font-bold py-2 px-8 rounded-full text-sm hover:bg-white/20 active:scale-95 transition-all">前往获取</button>
        </div>
      );
      default: return null;
    }
  };

  const panelTitles: Record<string, string> = {
    store: '房卡商城',
    chat: '全服聊天',
    phone: '绑定手机',
    key: '安全密钥',
    cards: '我的房卡'
  };

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
              <span>房卡: {cards}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setOpenPanel('store')} className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
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
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-gradient-to-b from-[#1C1F26] to-[#0D1017] border border-[#D4AF37]/30 rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            >
              {/* Header */}
              <div className="bg-black/40 border-b border-white/5 p-4 flex justify-between items-center relative">
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />
                <h2 className="text-lg font-black text-white tracking-widest ml-2">加入/创建对局</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                <p className="text-center text-xs text-white/50 font-medium leading-relaxed">
                  输入房间号即可加入对局。<br/>
                  如房间不存在，将自动创建并消耗 <span className="text-[#D4AF37] font-bold">1张房卡</span>。
                </p>

                <div className="flex bg-black/60 border border-white/10 rounded-xl overflow-hidden focus-within:border-[#D4AF37]/50 focus-within:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all">
                  <div className="bg-black/40 px-4 py-3 text-[#D4AF37] font-black text-sm border-r border-white/10 flex items-center justify-center min-w-[80px]">
                    房间号
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="6位数字"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 bg-transparent px-4 py-3 text-white font-black text-lg outline-none placeholder:text-white/20 placeholder:font-normal"
                  />
                </div>

                <button
                  type="submit"
                  disabled={roomId.length < 6}
                  className="w-full mt-2 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#FFD700] hover:to-[#D4AF37] text-black py-3.5 rounded-xl font-black text-lg shadow-[0_5px_15px_rgba(212,175,55,0.4)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex flex-col items-center justify-center leading-tight"
                >
                  <span>确认进入</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-black/80 backdrop-blur-md border border-[#D4AF37]/50 text-white px-6 py-3 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.8)] font-bold text-sm"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generic Panel Modal */}
      <AnimatePresence>
        {openPanel && !['store', 'chat', 'phone', 'key', 'cards'].includes(openPanel) === false && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenPanel('')}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-gradient-to-b from-[#1C1F26] to-[#0D1017] border border-[#D4AF37]/30 rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            >
              <div className="bg-black/40 border-b border-white/5 p-4 flex justify-between items-center relative">
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />
                <h2 className="text-lg font-black text-white tracking-widest ml-2">{panelTitles[openPanel]}</h2>
                <button onClick={() => setOpenPanel('')} className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                {renderPanelContent()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
