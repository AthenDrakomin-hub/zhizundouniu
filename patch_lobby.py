import re

with open('src/components/Lobby.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Store UI
old_store = """            {/* 支付说明与ID */}
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
          </div>"""

new_store = """            {/* 模拟网关回调交互 */}
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
          </div>"""

content = content.replace(old_store, new_store)

# 2. Remove old phone and key cases
content = re.sub(r"case 'phone': return \(.*?\);\s*case 'key': return \(.*?\);", "", content, flags=re.DOTALL)

# 3. Enhance Mine panel
old_mine = """      {/* Settings Grid */}
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
      </div>"""

new_mine = """      {/* Action Grid */}
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
      </div>"""

content = content.replace(old_mine, new_mine)

# 4. Enhance Rules
old_rules = """          <div className="bg-black/40 p-4 rounded-xl border border-white/10">
            <h3 className="text-[#D4AF37] font-black text-lg mb-2 flex items-center gap-2"><Crown className="w-5 h-5"/> 庄家与倍率</h3>
            <p className="mb-2">1. 游戏支持<span className="text-white font-bold">明牌抢庄</span>，看4张牌后决定是否抢庄，倍数最高者成为庄家。</p>
            <p>2. 若多人抢庄倍数相同，系统将通过<span className="text-[#D4AF37] font-bold">掷骰子</span>随机产生庄家，保证绝对公平。</p>
          </div>"""

new_rules = """          <div className="bg-black/40 p-4 rounded-xl border border-white/10">
            <h3 className="text-[#D4AF37] font-black text-lg mb-2 flex items-center gap-2"><Crown className="w-5 h-5"/> 庄家与倍率</h3>
            <p className="mb-2">1. 游戏支持<span className="text-white font-bold">明牌抢庄</span>，看4张牌后决定是否抢庄，倍数最高者成为庄家。</p>
            <p>2. 若多人抢庄倍数相同，系统将通过<span className="text-[#D4AF37] font-bold">掷骰子</span>随机产生庄家，保证绝对公平。</p>
          </div>

          <div className="bg-black/40 p-4 rounded-xl border border-white/10">
            <h3 className="text-[#D4AF37] font-black text-lg mb-2 flex items-center gap-2"><Hexagon className="w-5 h-5"/> 炸金花与三公规则简述</h3>
            <p className="mb-2"><span className="text-white font-bold">三公：</span>J、Q、K为公牌。三张公牌最大，其次比点数大小，9点最大，0点最小。</p>
            <p><span className="text-white font-bold">炸金花：</span>豹子 &gt; 顺金 &gt; 金花 &gt; 顺子 &gt; 对子 &gt; 单牌。比拼心理与运气的巅峰对决！</p>
          </div>
          
          <div className="bg-black/40 p-4 rounded-xl border border-white/10">
            <h3 className="text-red-400 font-black text-lg mb-2 flex items-center gap-2"><Flame className="w-5 h-5"/> 严打外挂与作弊声明</h3>
            <p className="text-xs text-white/70">本平台采用军工级加密通信，拥有严密的防作弊与防伙牌算法。同IP或同设备玩家将被系统标记并隔离。如发现使用第三方辅助工具，将永久封禁账号并没收房卡。</p>
          </div>"""

content = content.replace(old_rules, new_rules)

with open('src/components/Lobby.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

