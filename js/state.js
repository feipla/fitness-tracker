/**
 * 循迹应用 - 状态管理模块
 * 负责数据持久化和状态同步
 */

// ==================== LocalStorage 工具类 ====================
class StorageManager {
    constructor(prefix = 'xunji_') {
        this.prefix = prefix;
    }

    // 生成完整键名
    _getKey(key) {
        return `${this.prefix}${key}`;
    }

    // 保存数据
    save(key, data) {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(this._getKey(key), serialized);
            console.log(`[循迹] 数据已保存: ${key}`);
            return true;
        } catch (error) {
            console.error('[循迹] 保存失败:', error);
            
            if (error.name === 'QuotaExceededError') {
                alert('存储空间已满，请清理部分数据后重试');
            }
            
            return false;
        }
    }

    // 读取数据
    load(key) {
        try {
            const data = localStorage.getItem(this._getKey(key));
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('[循迹] 读取失败:', error);
            return null;
        }
    }

    // 删除数据
    remove(key) {
        try {
            localStorage.removeItem(this._getKey(key));
            console.log(`[循迹] 数据已删除: ${key}`);
            return true;
        } catch (error) {
            console.error('[循迹] 删除失败:', error);
            return false;
        }
    }

    // 清空所有数据
    clear() {
        try {
            Object.keys(localStorage)
                .filter(key => key.startsWith(this.prefix))
                .forEach(key => localStorage.removeItem(key));
            console.log('[循迹] 所有数据已清空');
            return true;
        } catch (error) {
            console.error('[循迹] 清空失败:', error);
            return false;
        }
    }

    // 检查是否存在
    has(key) {
        return localStorage.getItem(this._getKey(key)) !== null;
    }

    // 获取存储使用情况
    getUsage() {
        let totalSize = 0;
        let itemCount = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                totalSize += (localStorage.getItem(key) || '').length;
                itemCount++;
            }
        }

        return {
            items: itemCount,
            sizeBytes: totalSize,
            sizeKB: (totalSize / 1024).toFixed(2)
        };
    }
}

// ==================== 应用状态 ====================
class AppState {
    constructor() {
        this.storage = new StorageManager();
        
        // 数据存储键名
        this.KEYS = {
            USER_PROFILE: 'user_profile',
            WORKOUTS: 'workout_records',
            SETTINGS: 'app_settings'
        };

        // 初始化状态
        this.state = this._initializeState();
        
        // 变更监听器
        this.listeners = [];
        
        console.log('[循迹] 应用状态初始化完成');
    }

    // 初始化状态（加载或使用默认值）
    _initializeState() {
        return {
            userProfile: this.storage.load(this.KEYS.USER_PROFILE) || this._getDefaultProfile(),
            workouts: this.storage.load(this.KEYS.WORKOUTS) || [],
            settings: this.storage.load(this.KEYS.SETTINGS) || this._getDefaultSettings()
        };
    }

    // 默认用户配置
    _getDefaultProfile() {
        return {
            actualAge: 30,
            vision: '',
            firstVisitDate: new Date().toISOString(),
            hasCompletedOnboarding: false
        };
    }

    // 默认设置
    _getDefaultSettings() {
        return {
            theme: 'auto',
            language: 'zh-CN',
            notifications: true
        };
    }

    // ==================== 用户配置方法 ====================

    getUserProfile() {
        return { ...this.state.userProfile };
    }

    updateUserProfile(updates) {
        this.state.userProfile = {
            ...this.state.userProfile,
            ...updates
        };
        this.storage.save(this.KEYS.USER_PROFILE, this.state.userProfile);
        this._notifyListeners('userProfile', this.state.userProfile);
    }

    completeOnboarding() {
        this.updateUserProfile({ hasCompletedOnboarding: true });
    }

    // ==================== 运动记录方法 ====================

    getWorkouts() {
        return [...this.state.workouts];
    }

    getWorkoutById(id) {
        return this.state.workouts.find(w => w.id === id) || null;
    }

    addWorkout(workoutData) {
        const workout = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            ...workoutData
        };

        this.state.workouts.unshift(workout); // 添加到开头（最新的在前）
        this.storage.save(this.KEYS.WORKOUTS, this.state.workouts);
        this._notifyListeners('workouts', this.state.workouts);

        console.log('[循迹] 新增运动记录:', workout.id);
        return workout;
    }

    updateWorkout(id, updates) {
        const index = this.state.workouts.findIndex(w => w.id === id);
        
        if (index === -1) {
            console.warn('[循迹] 找不到记录:', id);
            return false;
        }

        this.state.workouts[index] = {
            ...this.state.workouts[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.storage.save(this.KEYS.WORKOUTS, this.state.workouts);
        this._notifyListeners('workouts', this.state.workouts);

        console.log('[循迹] 更新运动记录:', id);
        return true;
    }

    deleteWorkout(id) {
        const index = this.state.workouts.findIndex(w => w.id === id);
        
        if (index === -1) {
            console.warn('[循迹] 找不到记录:', id);
            return false;
        }

        this.state.workouts.splice(index, 1);
        this.storage.save(this.KEYS.WORKOUTS, this.state.workouts);
        this._notifyListeners('workouts', this.state.workouts);

        console.log('[循迹] 删除运动记录:', id);
        return true;
    }

    // ==================== 设置方法 ====================

    getSettings() {
        return { ...this.state.settings };
    }

    updateSettings(updates) {
        this.state.settings = {
            ...this.state.settings,
            ...updates
        };
        this.storage.save(this.KEYS.SETTINGS, this.state.settings);
        this._notifyListeners('settings', this.state.settings);
    }

    // ==================== 统计方法 ====================

    getStats() {
        const workouts = this.state.workouts;
        const now = new Date();
        
        // 今日记录
        const todayStr = now.toISOString().split('T')[0];
        const todayWorkouts = workouts.filter(w => 
            w.date && w.date.startsWith(todayStr)
        );

        // 本周记录
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weekWorkouts = workouts.filter(w => 
            w.date && new Date(w.date) >= weekAgo
        );

        // 本月记录
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthWorkouts = workouts.filter(w => 
            w.date && new Date(w.date) >= monthAgo
        );

        // 总距离和时长
        const totalDistance = workouts.reduce((sum, w) => sum + (parseFloat(w.distance) || 0), 0);
        const totalDuration = workouts.reduce((sum, w) => sum + (parseInt(w.duration) || 0), 0);

        return {
            totalWorkouts: workouts.length,
            todayCount: todayWorkouts.length,
            weekCount: weekWorkouts.length,
            monthCount: monthWorkouts.length,
            totalDistance: totalDistance.toFixed(1),
            totalDuration: totalDuration,
            averageDistance: workouts.length > 0 ? (totalDistance / workouts.length).toFixed(1) : 0
        };
    }

    // ==================== 监听器模式 ====================

    subscribe(listener) {
        this.listeners.push(listener);
        
        // 返回取消订阅函数
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    _notifyListeners(type, data) {
        this.listeners.forEach(listener => {
            try {
                listener({ type, data, state: this.state });
            } catch (error) {
                console.error('[循迹] 监听器执行错误:', error);
            }
        });
    }

    // ==================== 工具方法 ====================

    exportData() {
        return JSON.stringify(this.state, null, 2);
    }

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            if (data.userProfile) {
                this.state.userProfile = data.userProfile;
                this.storage.save(this.KEYS.USER_PROFILE, data.userProfile);
            }
            
            if (data.workouts) {
                this.state.workouts = data.workouts;
                this.storage.save(this.KEYS.WORKOUTS, data.workouts);
            }
            
            if (data.settings) {
                this.state.settings = data.settings;
                this.storage.save(this.KEYS.SETTINGS, data.settings);
            }

            this._notifyListeners('import', this.state);
            console.log('[循迹] 数据导入成功');
            return true;
        } catch (error) {
            console.error('[循迹] 数据导入失败:', error);
            return false;
        }
    }

    resetAll() {
        this.state = this._initializeState();
        this.storage.clear();
        this._notifyListeners('reset', this.state);
        console.log('[循迹] 应用已重置');
    }
}

// ==================== 全局初始化 ====================
console.log('[循迹] 状态管理模块加载完成');
