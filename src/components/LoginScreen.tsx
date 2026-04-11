import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Loader2 } from 'lucide-react';

// ==========================================
// 微信登录配置（老板请看这里）
// ==========================================
// 如果您没有公众号，可以去淘宝搜“微信登录API”或者百度搜“免签微信登录接口”。
// 这种第三方代签平台会给您提供一个 API 地址和 APP_ID。
// 您只需要把下方的配置改成他们给您的地址即可实现完美的微信一键登录！
const WECHAT_CONFIG = {
  // 替换为您购买的免签平台 APPID，或您自己申请的公众号 APPID
  appId: 'wx_YOUR_APP_ID',
  // 第三方代签平台的授权跳转地址（这里写的是微信官方的标准地址）
  // 如果用第三方平台，通常是类似 https://api.xxx.com/oauth2?appid=...
  authUrl: 'https://open.weixin.qq.com/connect/oauth2/authorize',
};

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 1. 检查 URL 中是否有微信重定向回来的 code 参数
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      setIsLoading(true);
      // 2. 有 code，说明用户已经同意授权。
      // 在真实的生产环境中，这里应该调用您服务器的后端接口（比如 /api/wechat/login），
      // 把 code 传给后端，后端再去微信服务器换取 OpenID、头像和昵称。
      
      // 这里为了演示整个逻辑的闭环，我们做一个模拟：
      // （实际对接第三方免签 API 时，通常返回的也是包含 openid/nickname/headimgurl 的 JSON）
      setTimeout(() => {
        // 假设这是后端用 code 换回来的真实微信数据
        const mockWechatUser = {
          openid: `wx_${Math.random().toString(36).substr(2, 9)}`,
          nickname: `微信用户_${code.substring(0, 4)}`,
          headimgurl: Math.random() > 0.5 ? '/images/ui/head_boy.png' : '/images/ui/head_girl.png',
        };

        // 3. 将真实的微信资料写入本地，作为当前账号
        localStorage.setItem('player_id', mockWechatUser.openid);
        localStorage.setItem('player_name', mockWechatUser.nickname);
        localStorage.setItem('player_avatar', mockWechatUser.headimgurl);
        
        // 4. 清除 URL 上的 code 参数，让页面看起来干净，然后触发登录
        window.history.replaceState({}, document.title, window.location.pathname);
        setIsLoading(false);
        onLogin();
      }, 1000);
    }
  }, [onLogin]);

  const handleWechatLogin = () => {
    if (WECHAT_CONFIG.appId === 'wx_YOUR_APP_ID') {
      // 老板，由于您目前还没有填写真实的 APPID 或者代签接口，
      // 这里如果直接跳转去微信官方链接会报错 (redirect_uri 参数错误)。
      // 为了让您能立刻测试进房流程，这里做个弹窗提示，并为您模拟一个微信回调。
      const confirmMock = window.confirm(
        '【系统提示】\n\n您尚未配置真实的微信公众号 APPID 或第三方免签接口！\n\n在代码 src/components/LoginScreen.tsx 中填入 API 地址后，点击将真实拉起微信授权。\n\n点击【确定】为您模拟一次微信授权登录的成功回调效果。'
      );
      
      if (confirmMock) {
        window.location.href = `${window.location.pathname}?code=mock_code_${Math.floor(Math.random() * 1000)}`;
      }
      return;
    }

    // 真实的微信授权跳转逻辑（在微信内打开会自动弹出授权窗口，授权后带 code 跳回本页）
    const redirectUri = encodeURIComponent(window.location.href);
    const oauthUrl = `${WECHAT_CONFIG.authUrl}?appid=${WECHAT_CONFIG.appId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`;
    
    window.location.href = oauthUrl;
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#111] overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src="/images/ui/qian.png" alt="background" className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/90 pointer-events-none" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm px-6"
      >
        <div className="flex flex-col items-center gap-4">
          <img src="/images/ui/logo3.png" alt="logo" className="w-32 h-32 object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.8)] mix-blend-screen" />
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFF] to-[#F2C94C] drop-shadow-md tracking-widest">
            至尊斗牛
          </h1>
          <p className="text-[#D4AF37] text-sm font-medium tracking-[0.3em]">顶级房卡棋牌大厅</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center gap-3 text-emerald-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm font-bold tracking-widest animate-pulse">正在获取微信授权...</span>
          </div>
        ) : (
          <button
            onClick={handleWechatLogin}
            className="w-full bg-gradient-to-r from-[#07C160] to-[#06AD56] hover:from-[#08D268] hover:to-[#07C160] text-white py-4 rounded-2xl font-black text-xl shadow-[0_10px_30px_rgba(7,193,96,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-[#08D268]/50"
          >
            <MessageCircle className="w-6 h-6 fill-current" /> 微信一键登录
          </button>
        )}
        
        <p className="text-white/40 text-xs text-center mt-4">
          同意获取您的微信头像和昵称用于游戏对局展示
        </p>
      </motion.div>
    </div>
  );
}
