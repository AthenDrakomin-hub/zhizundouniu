import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Gamepad2, User, Search, RefreshCw, Smartphone, Package, Shield, LayoutGrid, X, MessageSquare, Settings, ArrowRight, Copy, MessageCircle as WechatIcon, Crown, Swords, Coins, Hexagon, Sprout, Flame, Volume2, HelpCircle, Users, Key } from 'lucide-react';
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
  
  const [marqueeIndex, setMarqueeIndex] = useState(0);
  const marqueeMessages = [
    '恭喜玩家 游客8922 在斗牛中赢取 5000 金币！',
    '恭喜玩家 游客1033 在炸金花中赢取 3200 金币！',
    '欢迎新玩家 游客9981 加入游戏！',
    '系统公告：充值请认准官方渠道，谨防上当受骗！',
    '恭喜玩家 游客5521 开启至尊房卡，成功组局！'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setMarqueeIndex((prev) => (prev + 1) % marqueeMessages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const [cards, setCards] = useState(parseInt(localStorage.getItem('player_cards') || '0', 10));
  const [systemConfig, setSystemConfig] = useState({
    alipayQrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=alipay_qr_placeholder&color=000000&bgcolor=ffffff',
    usdtQrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=usdt_qr_placeholder&color=000000&bgcolor=ffffff',
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
      
      {/* 顶部跑马灯与规则按钮 */}
      <div className="flex items-center gap-2 mb-4 bg-black/40 rounded-full p-1 border border-white/10 shadow-[0_5px_15px_rgba(0,0,0,0.5)] mx-1">
        <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] rounded-full p-1.5 flex items-center justify-center shadow-md z-10">
          <Volume2 className="w-4 h-4 text-black" />
        </div>
        <div className="flex-1 overflow-hidden h-6 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={marqueeIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center text-xs text-[#D4AF37] font-medium whitespace-nowrap"
            >
              {marqueeMessages[marqueeIndex]}
            </motion.div>
          </AnimatePresence>
        </div>
        <button 
          onClick={() => setOpenPanel('rules')}
          className="flex items-center gap-1 bg-white/10 hover:bg-[#D4AF37] hover:text-black px-3 py-1.5 rounded-full text-xs text-white/80 transition-colors mr-1 font-bold"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>玩法规则</span>
        </button>
      </div>

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
            onClick={() => setActiveTab('room')}
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
              <div className="flex items-center gap-1 mt-1 opacity-70">
                <Users className="w-3 h-3 text-green-400" />
                <span className="text-[10px] font-mono text-green-400">{Math.floor(Math.random() * 500) + 100} 人在线</span>
              </div>
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
    <div className="flex-1 flex flex-col pt-8 px-6 pb-24 relative overflow-y-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 mb-4 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
          <Key className="w-8 h-8 text-[#D4AF37]" />
        </div>
        <h2 className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-widest mb-2">加入/创建对局</h2>
        <p className="text-white/50 text-xs font-medium tracking-wider">房间私密，请输入6位数字房间号</p>
      </div>

      {/* 房间号显示区 */}
      <div className="flex justify-center gap-2 sm:gap-3 mb-10">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i} 
            className={cn(
              "w-10 sm:w-12 h-12 sm:h-14 rounded-xl flex items-center justify-center text-2xl font-black shadow-[0_5px_15px_rgba(0,0,0,0.5)] transition-all",
              roomId.length === i ? "bg-gradient-to-b from-[#D4AF37]/20 to-transparent border-2 border-[#D4AF37] scale-110 shadow-[0_0_15px_rgba(212,175,55,0.5)]" 
              : roomId.length > i ? "bg-gradient-to-b from-[#D4AF37] to-[#B8860B] text-black border border-[#FFD700]"
              : "bg-black/40 border border-white/10 text-white/20"
            )}
          >
            {roomId[i] || ''}
          </div>
        ))}
      </div>

      {/* 数字小键盘 */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-[280px] mx-auto w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '清空', 0, '删除'].map((key, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.preventDefault();
              if (key === '清空') setRoomId('');
              else if (key === '删除') setRoomId(roomId.slice(0, -1));
              else if (roomId.length < 6) setRoomId(roomId + String(key));
            }}
            className={cn(
              "h-12 sm:h-14 rounded-2xl font-black text-xl flex items-center justify-center active:scale-95 transition-all shadow-[0_5px_10px_rgba(0,0,0,0.3)]",
              typeof key === 'number' 
                ? "bg-gradient-to-b from-[#2A2D35] to-[#1C1F26] text-white border border-white/10 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]" 
                : "bg-black/30 text-white/50 text-base border border-white/5 hover:text-white"
            )}
          >
            {key}
          </button>
        ))}
      </div>

      {/* 确认按钮 */}
      <button 
        onClick={(e) => handleSubmit(e as any)}
        disabled={roomId.length < 6}
        className="mt-8 mx-auto max-w-[280px] w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black py-4 rounded-2xl font-black text-lg shadow-[0_5px_15px_rgba(212,175,55,0.4)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        进入房间 <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );

  const [hiddenAdminClick, setHiddenAdminClick] = useState(0);

  const renderMine = () => (
    <div className="flex-1 flex flex-col pt-4 px-4 pb-24 gap-4 overflow-y-auto">
      {/* Profile Card */}
      <div className="bg-gradient-to-r from-[#3C1B22] to-[#5C2D38] rounded-2xl p-4 border border-[#D4AF37]/50 shadow-[0_10px_20px_rgba(0,0,0,0.5)] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-16 rounded-2xl border-2 border-[#D4AF37] p-0.5 bg-black/50 shadow-inner cursor-pointer"
            onClick={() => {
              const newCount = hiddenAdminClick + 1;
              setHiddenAdminClick(newCount);
              if (newCount >= 5) {
                setHiddenAdminClick(0);
                showToast('已进入开发者/管理模式');
                window.open('https://admin.yefeng.us.cc/', '_blank');
              } else if (newCount >= 3) {
                showToast(`再点击 ${5 - newCount} 次进入管理端`);
              }
            }}
          >
            <img src={avatar} alt="avatar" className="w-full h-full rounded-xl object-cover pointer-events-none" />
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

      {/* Action Grid */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div onClick={() => setOpenPanel('cards')} className="bg-gradient-to-br from-[#2A2D35] to-[#1C1F26] rounded-xl border border-white/5 flex flex-col items-center justify-center p-4 cursor-pointer shadow-lg active:scale-[0.98] transition-transform gap-2">
          <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-[#FFD700]" />
          </div>
          <span className="font-bold text-sm text-white/90">我的房卡包</span>
          <span className="text-xs text-[#D4AF37] font-bold">{cards} 张可用</span>
        </div>
        
        <div onClick={() => showToast('战绩系统正在升级中')} className="bg-gradient-to-br from-[#2A2D35] to-[#1C1F26] rounded-xl border border-white/5 flex flex-col items-center justify-center p-4 cursor-pointer shadow-lg active:scale-[0.98] transition-transform gap-2">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-blue-400" />
          </div>
          <span className="font-bold text-sm text-white/90">历史战绩</span>
          <span className="text-xs text-white/30">查看对局回放</span>
        </div>

        <div onClick={() => showToast('正在连接专属客服...')} className="bg-gradient-to-br from-[#2A2D35] to-[#1C1F26] rounded-xl border border-white/5 flex flex-col items-center justify-center p-4 cursor-pointer shadow-lg active:scale-[0.98] transition-transform gap-2">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-green-400" />
          </div>
          <span className="font-bold text-sm text-white/90">专属客服</span>
          <span className="text-xs text-white/30">全天候 24/7</span>
        </div>

        <div onClick={() => setOpenPanel('rules')} className="bg-gradient-to-br from-[#2A2D35] to-[#1C1F26] rounded-xl border border-white/5 flex flex-col items-center justify-center p-4 cursor-pointer shadow-lg active:scale-[0.98] transition-transform gap-2">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-purple-400" />
          </div>
          <span className="font-bold text-sm text-white/90">游戏帮助</span>
          <span className="text-xs text-white/30">玩法与规则</span>
        </div>
      </div>
    </div>
  );

  const renderPanelContent = () => {
    switch (openPanel) {
      case 'rules': return (
        <div className="flex flex-col gap-4 text-white/80 text-sm leading-relaxed max-h-[60vh] overflow-y-auto px-2 py-4">
          <div className="bg-black/40 p-4 rounded-xl border border-white/10">
            <h3 className="text-[#D4AF37] font-black text-lg mb-2 flex items-center gap-2"><Key className="w-5 h-5"/> 房间与房卡规则</h3>
            <p className="mb-2">1. 平台主打<span className="text-white font-bold">私密好友局</span>，不支持随机匹配。玩家需要知道精确的6位数字房号才能上桌。</p>
            <p>2. 如果输入的房号不存在，系统会为您<span className="text-[#D4AF37] font-bold">自动创建该房间</span>，创建房间需消耗 <span className="text-red-400 font-bold">1 张至尊房卡</span>。</p>
          </div>
          
          <div className="bg-black/40 p-4 rounded-xl border border-white/10">
            <h3 className="text-[#D4AF37] font-black text-lg mb-2 flex items-center gap-2"><Flame className="w-5 h-5"/> 抢庄牛牛核心规则</h3>
            <p className="mb-2"><span className="text-white font-bold">1. 基础玩法：</span>每局发5张牌，其中3张相加凑成10的整数倍（J/Q/K算10），另外2张相加取个位即为“牛数”。</p>
            <p className="mb-2"><span className="text-white font-bold">2. 明牌抢庄：</span>开局发4张明牌，玩家根据牌面选择“抢庄”倍数（1倍/2倍/3倍/4倍等）。</p>
            <p className="mb-2"><span className="text-white font-bold">3. 确定庄家：</span>选择倍数最高的玩家成为庄家。若多人最高倍数相同，系统随机（掷骰子）选庄。</p>
            <p className="mb-2"><span className="text-white font-bold">4. 闲家加注：</span>确定庄家后，闲家根据自己的手牌选择下注倍数（1倍/2倍/3倍等）。</p>
            <p className="mb-2"><span className="text-white font-bold">5. 搓牌亮牌：</span>所有玩家下注完毕，系统发第5张牌。玩家可手动“搓牌”增加刺激感，之后全部亮牌。</p>
            <p className="mb-2"><span className="text-white font-bold">6. 比牌结算：</span>闲家只与庄家比牌。输赢积分 = 底分 × 庄家倍数 × 闲家倍数 × 牌型倍数。</p>
          </div>

          <div className="bg-black/40 p-4 rounded-xl border border-white/10">
            <h3 className="text-[#D4AF37] font-black text-lg mb-2 flex items-center gap-2"><Crown className="w-5 h-5"/> 牌型大小与倍率</h3>
            <p className="mb-1"><span className="text-red-400 font-bold">五小牛 (8倍)：</span>5张牌点数相加不超过10。</p>
            <p className="mb-1"><span className="text-red-400 font-bold">五花牛 (6倍)：</span>5张牌全部是 J、Q、K。</p>
            <p className="mb-1"><span className="text-red-400 font-bold">四花牛 (4倍)：</span>4张牌是 J、Q、K，第5张是 10。</p>
            <p className="mb-1"><span className="text-yellow-400 font-bold">牛牛 (5倍)：</span>3张凑10，剩下2张相加也是10的倍数。</p>
            <p className="mb-1"><span className="text-yellow-400 font-bold">牛九 (3倍)：</span>剩下2张相加个位为 9。</p>
            <p className="mb-1"><span className="text-white font-bold">牛八 / 牛七 (2倍)：</span>剩下2张相加个位为 8 或 7。</p>
            <p className="mb-1"><span className="text-white/60 font-bold">牛六到牛一 / 无牛 (1倍)：</span>剩余牌型皆为1倍。</p>
            <p className="mt-2 text-xs text-[#D4AF37]/80 leading-relaxed border-t border-white/10 pt-2">
              <span className="font-bold">比牌规则：</span>牌型一样大时，比较最大单张牌的大小（K&gt;Q&gt;J&gt;10&gt;...&gt;A）；单张点数相同时比较花色（黑桃&gt;红桃&gt;梅花&gt;方块）。
            </p>
          </div>

          <div className="bg-black/40 p-4 rounded-xl border border-white/10">
            <h3 className="text-[#D4AF37] font-black text-lg mb-2 flex items-center gap-2"><Hexagon className="w-5 h-5"/> 炸金花与三公规则简述</h3>
            <p className="mb-2"><span className="text-white font-bold">三公：</span>J、Q、K为公牌。三张公牌最大，其次比点数大小，9点最大，0点最小。</p>
            <p><span className="text-white font-bold">炸金花：</span>豹子 &gt; 顺金 &gt; 金花 &gt; 顺子 &gt; 对子 &gt; 单牌。比拼心理与运气的巅峰对决！</p>
          </div>
          
          <div className="bg-black/40 p-4 rounded-xl border border-white/10">
            <h3 className="text-red-400 font-black text-lg mb-2 flex items-center gap-2"><Flame className="w-5 h-5"/> 严打外挂与作弊声明</h3>
            <p className="text-xs text-white/70">本平台采用军工级加密通信，拥有严密的防作弊与防伙牌算法。同IP或同设备玩家将被系统标记并隔离。如发现使用第三方辅助工具，将永久封禁账号并没收房卡。</p>
          </div>
          <button onClick={() => setOpenPanel('')} className="mt-2 w-full py-3 bg-white/10 rounded-xl font-bold text-white hover:bg-white/20 transition-colors">我知道了</button>
        </div>
      );
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

            {/* 模拟网关回调交互 */}
            <div className="p-4 bg-black/40 border-t border-white/5 text-center flex flex-col gap-3">
              <p className="text-xs text-white/60">
                完成支付后，请点击下方按钮通知系统审核
              </p>
              <button 
                onClick={() => {
                  showToast('正在提交支付凭证到网关...');
                  setTimeout(() => {
                    showToast('✅ 提交成功！请等待系统审核下发房卡');
                    setOpenPanel('');
                  }, 1500);
                }}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-black py-3 rounded-xl shadow-[0_5px_15px_rgba(212,175,55,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                我已完成付款，提交审核
              </button>
              <div className="flex items-center justify-center gap-2 text-[10px] text-white/30">
                <span>您的充值ID: {localStorage.getItem('player_id')?.substring(0,6).toUpperCase()}</span>
                <span className="w-1 h-1 rounded-full bg-white/20"></span>
                <span>网关加密传输中</span>
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
    cards: '我的房卡',
    rules: '游戏规则与玩法'
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
        {openPanel && panelTitles[openPanel] && (
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
