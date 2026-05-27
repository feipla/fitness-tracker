/**
 * 循迹应用 - 主入口
 * 负责应用初始化和全局配置
 */

// ==================== 应用初始化 ====================
class XunjiApp {
    constructor() {
        this.state = null;
        this.isReady = false;
    }

    // 初始化应用
    async init() {
        try {
            console.log('[循迹] 正在初始化应用...');
            
            // 初始化状态管理
            this.state = new AppState();
            
            // 标记就绪
            this.isReady = true;
            
            console.log('[循迹] 应用初始化完成 ✅');
            console.log('[循迹] 存储使用情况:', this.state.storage.getUsage());
            
            // 触发就绪事件
            this._emitEvent('app:ready');
            
        } catch (error) {
            console.error('[循迹] 应用初始化失败:', error);
            this.isReady = false;
            this._showError('应用初始化失败，请刷新页面重试');
        }
    }

    // 显示错误信息
    _showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fff;
            padding: 24px 32px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            text-align: center;
            z-index: 9999;
            max-width: 80%;
        `;
        errorDiv.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
            <div style="font-size: 18px; color: #333; margin-bottom: 8px;">出错了</div>
            <div style="font-size: 14px; color: #666;">${message}</div>
            <button onclick="location.reload()" 
                    style="margin-top: 16px; 
                           padding: 8px 24px; 
                           background: #1B4332; 
                           color: white; 
                           border: none; 
                           border-radius: 6px; 
                           cursor: pointer;">
                重新加载
            </button>
        `;
        document.body.appendChild(errorDiv);
    }

    // 发射事件
    _emitEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
        console.log(`[循迹] 事件触发: ${eventName}`);
    }

    // 检查是否就绪
    ready() {
        return new Promise((resolve, reject) => {
            if (this.isReady) {
                resolve(this);
            } else {
                const checkReady = setInterval(() => {
                    if (this.isReady) {
                        clearInterval(checkReady);
                        resolve(this);
                    }
                }, 100);

                // 超时处理（5秒）
                setTimeout(() => {
                    clearInterval(checkReady);
                    reject(new Error('应用初始化超时'));
                }, 5000);
            }
        });
    }
}

// ==================== 启动应用 ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('[循迹] DOM 加载完成，开始启动应用...');
    
    // 创建应用实例
    window.app = new XunjiApp();
    
    // 初始化
    window.app.init().then(() => {
        console.log('[循迹] 应用已准备就绪');
        
        // 将状态暴露到全局方便调试
        window.appState = window.app.state;
    }).catch((error) => {
        console.error('[循迹] 启动失败:', error);
    });
});

// ==================== 全局工具函数 ====================

// 格式化日期
window.formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// 格式化时间
window.formatTime = (minutes) => {
    if (!minutes) return '0分钟';
    if (minutes < 60) return `${minutes}分钟`;
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};

// 显示提示消息
window.showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? '#4CAF50' : 
                     type === 'warning' ? '#FF9800' : 
                     type === 'error' ? '#F44336' : '#2196F3';
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${bgColor};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideDown 0.3s ease-out;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    // 3秒后自动消失
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// 添加动画样式
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }

    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(styleSheet);

console.log('[循迹] 主入口模块加载完成');
