// ==================== 数据模型定义 ====================
/**
 * @typedef {Object} WorkoutRecord
 * @property {string} id - 唯一标识符
 * @property {string} date - ISO日期格式
 * @property {'running'|'cycling'|'swimming'|'walking'|'other'} type - 运动类型
 * @property {number} duration - 时长(分钟)
 * @property {number} distance - 距离(公里)
 * @property {number} avgHeartRate - 平均心率
 * @property {number} maxHeartRate - 最大心率
 * @property {number} calories - 消耗卡路里
 * @property {number} trainingLoad - 训练负荷
 * @property {number} recoveryTime - 恢复时间
 * @property {number} aerobicEffect - 有氧效果
 * @property {number} anaerobicEffect - 无氧效果
 * @property {number} stressScore - 压力分数
 * @property {number} vo2max - VO2最大值
 * @property {number} bodyAge - 身体年龄
 * @property {'device'|'estimated'} source - 数据来源
 * @property {string} notes - 备注
 */

/**
 * @typedef {Object} UserProfile
 * @property {number} actualAge - 实际年龄
 * @property {string[]} vision - 十年愿景
 * @property {string} firstVisitDate - 首次访问日期
 * @property {boolean} hasCompletedOnboarding - 是否已完成引导
 */

/**
 * @typedef {Object} LifeTreeState
 * @property {number} trunkThickness - 树干粗细
 * @property {Array<{id: string, type: 'primary'|'secondary', length: number, angle: number, workoutId: string}>} branches - 树枝
 * @property {{density: number, type: string}} leaves - 树叶
 * @property {Array<{type: string, unlockedAt: string}>} flowers - 花
 * @property {Array<{type: string, unlockedAt: string}>} fruits - 果实
 * @property {Array<{position: [number, number], unlockedAt: string}>} stars - 星星
 * @property {Array<{type: string, unlockedAt: string}>} ornaments - 装饰
 * @property {Array<{date: string, state: Object}>} historySnapshots - 历史快照
 */

// ==================== 工具函数 ====================
const typeIcons = {
    running: '🏃',
    cycling: '🚴',
    swimming: '🏊',
    walking: '🚶',
    other: '🏋️'
};

const typeNames = {
    running: '跑步',
    cycling: '骑行',
    swimming: '游泳',
    walking: '步行',
    other: '运动'
};

const typeBgColors = {
    running: 'rgba(33, 150, 243, 0.15)',
    cycling: 'rgba(76, 175, 80, 0.15)',
    swimming: 'rgba(0, 188, 212, 0.15)',
    walking: 'rgba(139, 195, 74, 0.15)',
    other: 'rgba(158, 158, 158, 0.15)'
};

const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
};

const formatShortDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
};

// ==================== 状态管理类 ====================
class AppState {
    constructor() {
        // LocalStorage键
        this.STORAGE_KEYS = {
            USER_PROFILE: 'xunji_user_profile',
            WORKOUT_RECORDS: 'xunji_workout_records',
            TREE_STATE: 'xunji_tree_state',
            HAS_COMPLETED_ONBOARDING: 'xunji_onboarding_done'
        };

        // 应用状态
        this.state = {
            currentView: 'welcome',
            currentTab: 'today',
            currentPeriod: 'week',
            currentWorkoutId: null,
            userProfile: this.loadFromStorage(this.STORAGE_KEYS.USER_PROFILE) || {
                actualAge: 30,
                vision: [],
                firstVisitDate: new Date().toISOString(),
                hasCompletedOnboarding: false
            },
            workoutRecords: this.loadFromStorage(this.STORAGE_KEYS.WORKOUT_RECORDS) || this.generateSampleData(),
            treeState: this.loadFromStorage(this.STORAGE_KEYS.TREE_STATE) || {
                trunkThickness: 1,
                branches: [],
                leaves: { density: 1, type: 'basic' },
                flowers: [],
                fruits: [],
                stars: [],
                ornaments: [],
                historySnapshots: []
            }
        };

        this.listeners = [];
        this.updateTreeState();
    }

    // 生成示例数据
    generateSampleData() {
        const sampleRecords = [];
        const types = ['running', 'cycling', 'swimming', 'walking'];
        const now = new Date();

        for (let i = 0; i < 25; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - Math.floor(Math.random() * 60));
            const type = types[Math.floor(Math.random() * types.length)];
            const duration = 20 + Math.floor(Math.random() * 60);
            const distance = type === 'swimming' ? (0.5 + Math.random() * 2).toFixed(1) : (2 + Math.random() * 10).toFixed(1);
            
            sampleRecords.push({
                id: Date.now() + '-' + i,
                date: date.toISOString(),
                type: type,
                duration: duration,
                distance: parseFloat(distance),
                avgHeartRate: 120 + Math.floor(Math.random() * 50),
                maxHeartRate: 150 + Math.floor(Math.random() * 30),
                calories: 150 + Math.floor(Math.random() * 400),
                trainingLoad: 20 + Math.floor(Math.random() * 80),
                recoveryTime: 12 + Math.floor(Math.random() * 24),
                aerobicEffect: 1 + Math.random() * 4,
                anaerobicEffect: 0.5 + Math.random() * 2,
                stressScore: 10 + Math.floor(Math.random() * 50),
                vo2max: 35 + Math.floor(Math.random() * 15),
                bodyAge: 25 + Math.floor(Math.random() * 10),
                source: 'estimated',
                notes: i % 3 === 0 ? '感觉状态不错！' : ''
            });
        }

        return sampleRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // LocalStorage工具方法
    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('加载数据失败:', e);
            return null;
        }
    }

    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('保存数据失败:', e);
            if (e.name === 'QuotaExceededError') {
                alert('存储空间已满，请清理数据后重试');
            }
        }
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.notify();
    }

    setCurrentView(view) {
        this.setState({ currentView: view });
    }

    setCurrentTab(tab) {
        this.setState({ currentTab: tab });
    }

    setCurrentPeriod(period) {
        this.setState({ currentPeriod: period });
    }

    setCurrentWorkoutId(id) {
        this.setState({ currentWorkoutId: id });
    }

    addWorkoutRecord(record) {
        const newRecord = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            source: 'estimated',
            ...record
        };
        this.state.workoutRecords = [newRecord, ...this.state.workoutRecords];
        this.saveToStorage(this.STORAGE_KEYS.WORKOUT_RECORDS, this.state.workoutRecords);
        this.updateTreeState();
        this.notify();
        return newRecord;
    }

    updateWorkoutRecord(id, updates) {
        this.state.workoutRecords = this.state.workoutRecords.map(record =>
            record.id === id ? { ...record, ...updates } : record
        );
        this.saveToStorage(this.STORAGE_KEYS.WORKOUT_RECORDS, this.state.workoutRecords);
        this.updateTreeState();
        this.notify();
    }

    deleteWorkoutRecord(id) {
        this.state.workoutRecords = this.state.workoutRecords.filter(record => record.id !== id);
        this.saveToStorage(this.STORAGE_KEYS.WORKOUT_RECORDS, this.state.workoutRecords);
        this.updateTreeState();
        this.notify();
    }

    updateUserProfile(updates) {
        this.state.userProfile = { ...this.state.userProfile, ...updates };
        this.saveToStorage(this.STORAGE_KEYS.USER_PROFILE, this.state.userProfile);
        this.notify();
    }

    completeOnboarding() {
        this.updateUserProfile({ hasCompletedOnboarding: true });
        this.setCurrentView('main');
    }

    updateTreeState() {
        const records = this.state.workoutRecords;
        this.state.treeState = {
            trunkThickness: Math.min(10, 1 + Math.floor(records.length / 5)),
            branches: records.slice(0, 20).map((record, index) => {
                let branchType = 'secondary';
                if (index % 4 === 0) branchType = 'primary';
                
                const length = Math.min(100, 30 + (record.duration || 30));
                const angle = 60 + (index * 20) + Math.random() * 20;
                
                return {
                    id: record.id,
                    type: branchType,
                    length: length,
                    angle: angle,
                    workoutId: record.id,
                    record: record
                };
            }),
            leaves: {
                density: Math.min(10, 1 + Math.floor(records.length / 3)),
                type: 'growing'
            },
            flowers: [],
            fruits: [],
            stars: [],
            ornaments: [],
            historySnapshots: []
        };
        this.saveToStorage(this.STORAGE_KEYS.TREE_STATE, this.state.treeState);
    }

    getRecordsByFilter(typeFilter = 'all', timeFilter = 'all') {
        let records = [...this.state.workoutRecords];

        if (typeFilter !== 'all') {
            records = records.filter(r => r.type === typeFilter);
        }

        if (timeFilter !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            let startDate;

            switch (timeFilter) {
                case 'week':
                    startDate = new Date(today);
                    startDate.setDate(today.getDate() - 7);
                    break;
                case 'month':
                    startDate = new Date(today);
                    startDate.setMonth(today.getMonth() - 1);
                    break;
                case 'year':
                    startDate = new Date(today);
                    startDate.setFullYear(today.getFullYear() - 1);
                    break;
            }

            records = records.filter(r => new Date(r.date) >= startDate);
        }

        return records.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getPeriodStats(period) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let startDate;

        switch (period) {
            case 'week':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(today);
                startDate.setMonth(today.getMonth() - 1);
                break;
            case 'year':
                startDate = new Date(today);
                startDate.setFullYear(today.getFullYear() - 1);
                break;
        }

        const records = this.state.workoutRecords.filter(r => new Date(r.date) >= startDate);

        return {
            count: records.length,
            distance: records.reduce((sum, r) => sum + (r.distance || 0), 0),
            duration: records.reduce((sum, r) => sum + (r.duration || 0), 0)
        };
    }

    getPreviousPeriodStats(period) {
        const records = this.state.workoutRecords;
        if (records.length < 3) return null;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let startDate, endDate;

        switch (period) {
            case 'week':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 14);
                endDate = new Date(today);
                endDate.setDate(today.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(today);
                startDate.setMonth(today.getMonth() - 2);
                endDate = new Date(today);
                endDate.setMonth(today.getMonth() - 1);
                break;
            case 'year':
                startDate = new Date(today);
                startDate.setFullYear(today.getFullYear() - 2);
                endDate = new Date(today);
                endDate.setFullYear(today.getFullYear() - 1);
                break;
        }

        const previousRecords = records.filter(r => {
            const date = new Date(r.date);
            return date >= startDate && date < endDate;
        });

        if (previousRecords.length === 0) return null;

        return {
            count: previousRecords.length,
            distance: previousRecords.reduce((sum, r) => sum + (r.distance || 0), 0),
            duration: previousRecords.reduce((sum, r) => sum + (r.duration || 0), 0)
        };
    }

    getBodyAgeEstimate() {
        const baseAge = this.state.userProfile.actualAge || 30;
        const recordCount = this.state.workoutRecords.length;
        const adjustment = Math.min(5, Math.floor(recordCount / 10));
        return {
            bodyAge: baseAge - adjustment,
            actualAge: baseAge,
            difference: adjustment
        };
    }

    getWorkoutById(id) {
        return this.state.workoutRecords.find(r => r.id === id);
    }

    getTotalStats() {
        const records = this.state.workoutRecords;
        const totalWorkouts = records.length;
        const totalDistance = records.reduce((sum, r) => sum + (r.distance || 0), 0);
        const totalCalories = records.reduce((sum, r) => sum + (r.calories || 0), 0);
        
        let streak = 0;
        if (records.length > 0) {
            const sortedDates = records.map(r => new Date(r.date).toDateString()).sort((a, b) => new Date(b) - new Date(a));
            const today = new Date().toDateString();
            let currentDate = new Date();
            
            for (let i = 0; i < 365; i++) {
                const checkDate = new Date(currentDate).toDateString();
                if (sortedDates.includes(checkDate)) {
                    streak++;
                    currentDate.setDate(currentDate.getDate() - 1);
                } else if (i > 0) {
                    break;
                } else {
                    currentDate.setDate(currentDate.getDate() - 1);
                }
            }
        }

        const daysSinceFirst = records.length > 0 
            ? Math.ceil((new Date() - new Date(records[records.length - 1].date)) / (1000 * 60 * 60 * 24))
            : 0;

        return {
            totalWorkouts,
            totalDistance: totalDistance.toFixed(1),
            totalCalories,
            streak,
            daysSinceFirst
        };
    }

    getHeatmapData() {
        const heatmap = {};
        const records = this.state.workoutRecords;
        
        records.forEach(record => {
            const dateKey = new Date(record.date).toDateString();
            if (heatmap[dateKey]) {
                heatmap[dateKey]++;
            } else {
                heatmap[dateKey] = 1;
            }
        });

        return heatmap;
    }
}

// ==================== UI 控制器 ====================
class UIController {
    constructor(appState) {
        this.state = appState;
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderCurrentView();
        this.state.subscribe(() => this.renderCurrentView());
    }

    bindEvents() {
        // 欢迎页按钮
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.state.completeOnboarding();
            });
        }

        // 底部导航
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                this.switchTab(tab);
            });
        });

        // 记录运动按钮
        const recordBtn = document.getElementById('record-workout-btn');
        if (recordBtn) {
            recordBtn.addEventListener('click', () => {
                this.showAddWorkoutDialog();
            });
        }

        // 上传截图按钮
        const uploadBtn = document.getElementById('upload-screenshot-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                this.showUploadModal();
            });
        }

        this.bindUploadEvents();

        // 生命树FAB
        const treeFab = document.getElementById('tree-fab');
        if (treeFab) {
            treeFab.addEventListener('click', () => {
                this.switchTab('tree');
            });
        }

        // 周期切换
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const period = btn.dataset.period;
                this.switchPeriod(period);
            });
        });

        // 筛选器
        const typeFilter = document.getElementById('type-filter');
        const timeFilter = document.getElementById('time-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.renderRecordsContent());
        }
        if (timeFilter) {
            timeFilter.addEventListener('change', () => this.renderRecordsContent());
        }

        this.bindModalEvents();
        this.bindVisionEvents();
        this.bindJourneyEvents();
        this.bindTreeEvents();
    }

    bindModalEvents() {
        // 详情模态框
        const closeDetailBtn = document.getElementById('close-detail-modal');
        if (closeDetailBtn) {
            closeDetailBtn.addEventListener('click', () => this.hideModal('workout-detail-modal'));
        }

        const deleteWorkoutBtn = document.getElementById('delete-workout-btn');
        if (deleteWorkoutBtn) {
            deleteWorkoutBtn.addEventListener('click', () => this.deleteCurrentWorkout());
        }

        const editWorkoutBtn = document.getElementById('edit-workout-btn');
        if (editWorkoutBtn) {
            editWorkoutBtn.addEventListener('click', () => this.showEditModal());
        }

        // 编辑模态框
        const closeEditBtn = document.getElementById('close-edit-modal');
        if (closeEditBtn) {
            closeEditBtn.addEventListener('click', () => this.hideModal('edit-workout-modal'));
        }

        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => this.hideModal('edit-workout-modal'));
        }

        const saveEditBtn = document.getElementById('save-edit-btn');
        if (saveEditBtn) {
            saveEditBtn.addEventListener('click', () => this.saveWorkoutEdit());
        }

        // 分享海报模态框
        const closeShareBtn = document.getElementById('close-share-modal');
        if (closeShareBtn) {
            closeShareBtn.addEventListener('click', () => this.hideModal('share-poster-modal'));
        }

        const cancelShareBtn = document.getElementById('cancel-share-btn');
        if (cancelShareBtn) {
            cancelShareBtn.addEventListener('click', () => this.hideModal('share-poster-modal'));
        }

        const savePosterBtn = document.getElementById('save-poster-btn');
        if (savePosterBtn) {
            savePosterBtn.addEventListener('click', () => this.savePoster());
        }
    }

    bindVisionEvents() {
        document.querySelectorAll('.vision-option').forEach(option => {
            option.addEventListener('click', () => {
                const vision = option.dataset.vision;
                if (vision === 'custom') {
                    this.showCustomVisionModal();
                } else {
                    const visionTexts = {
                        climb: '陪孩子爬山',
                        marathon: '完成马拉松',
                        travel: '70岁独立旅行',
                        energy: '保持充沛精力'
                    };
                    this.state.updateUserProfile({ vision: [visionTexts[vision]] });
                }
            });
        });

        const changeBtn = document.getElementById('change-vision-btn');
        if (changeBtn) {
            changeBtn.addEventListener('click', () => {
                this.state.updateUserProfile({ vision: [] });
            });
        }

        const cancelBtn = document.getElementById('cancel-custom-vision');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                const modal = document.getElementById('custom-vision-modal');
                if (modal) modal.style.display = 'none';
            });
        }

        const saveBtn = document.getElementById('save-custom-vision');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const input = document.getElementById('custom-vision-input');
                const value = input?.value.trim();
                if (value) {
                    this.state.updateUserProfile({ vision: [value] });
                    const modal = document.getElementById('custom-vision-modal');
                    if (modal) modal.style.display = 'none';
                }
            });
        }
    }

    bindJourneyEvents() {
        const shareBtn = document.getElementById('share-journey-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.showSharePoster());
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    renderCurrentView() {
        const { currentView, currentTab, userProfile } = this.state.state;

        const welcomeView = document.getElementById('welcome-view');
        const mainView = document.getElementById('main-view');

        if (userProfile.hasCompletedOnboarding || currentView === 'main') {
            welcomeView.classList.remove('active');
            mainView.classList.add('active');
            this.renderTabContent(currentTab);
        } else {
            welcomeView.classList.add('active');
            mainView.classList.remove('active');
        }
    }

    switchTab(tab) {
        this.state.setCurrentTab(tab);

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tab);
        });

        // 平滑的tab切换效果
        document.querySelectorAll('.tab-view').forEach(view => {
            view.classList.remove('active');
        });
        
        const activeView = document.getElementById(`${tab}-view`);
        if (activeView) {
            // 强制重绘来触发动画
            void activeView.offsetWidth;
            activeView.classList.add('active');
        }

        this.renderTabContent(tab);
    }

    renderTabContent(tab) {
        const skeleton = document.getElementById(`${tab}-skeleton`);
        const content = document.getElementById(`${tab}-content`);

        if (skeleton && content) {
            skeleton.style.display = 'flex';
            content.style.display = 'none';

            setTimeout(() => {
                skeleton.style.display = 'none';
                content.style.display = 'block';

                switch (tab) {
                    case 'today':
                        this.renderTodayContent();
                        break;
                    case 'map':
                        this.renderMapContent();
                        break;
                    case 'records':
                        this.renderRecordsContent();
                        break;
                    case 'journey':
                        this.renderJourneyContent();
                        break;
                    case 'tree':
                        this.renderTreeContent();
                        break;
                }
                
                // 触发卡片动画
                this.triggerCardAnimations(tab);
            }, 600);
        }
    }

    triggerCardAnimations(tab) {
        const view = document.getElementById(`${tab}-view`);
        if (!view) return;
        
        const cards = view.querySelectorAll('.status-card, .action-card, .diary-card, .radar-card, .trend-card, .vision-card, .stat-card, .trend-section, .heatmap-section, .trend-report-card, .tree-container, .tree-info');
        
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
            }, index * 100);
        });
    }

    renderTodayContent() {
        const todayDate = document.getElementById('today-date');
        if (todayDate) {
            const now = new Date();
            const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
            todayDate.textContent = now.toLocaleDateString('zh-CN', options);
        }

        this.renderStatusCard();
        this.renderLoadCard();
        this.checkTodaysWorkout();
    }

    renderStatusCard() {
        const records = this.state.state.workoutRecords;
        
        let recoveryStatus = 'good';
        let recoveryText = '恢复良好';
        let insight = '今天是进行训练的理想时机，身体状态不错。';

        if (records.length > 0) {
            const lastRecord = records[0];
            const daysSinceLastWorkout = (new Date() - new Date(lastRecord.date)) / (1000 * 60 * 60 * 24);

            if (daysSinceLastWorkout < 1) {
                recoveryStatus = 'moderate';
                recoveryText = '适度疲劳';
                insight = '昨天刚运动过，建议进行轻度训练或休息。';
            } else if (daysSinceLastWorkout > 3) {
                recoveryStatus = 'good';
                recoveryText = '恢复良好';
                insight = '已经休息几天了，可以适当增加训练强度。';
            }
        }

        const statusIcon = document.getElementById('status-icon');
        const statusValue = document.getElementById('status-value');
        const statusSource = document.getElementById('status-source');
        const statusInsight = document.getElementById('status-insight');

        if (statusIcon) {
            statusIcon.className = `status-icon recovery-${recoveryStatus}`;
        }
        if (statusValue) {
            statusValue.textContent = recoveryText;
        }
        if (statusSource) {
            statusSource.textContent = '循迹估算';
        }
        if (statusInsight) {
            statusInsight.textContent = insight;
        }
    }

    renderLoadCard() {
        const records = this.state.state.workoutRecords;
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const recentRecords = records.filter(r => new Date(r.date) >= weekAgo);
        const totalDuration = recentRecords.reduce((sum, r) => sum + (r.duration || 0), 0);

        let loadLevel = Math.min(100, (totalDuration / 300) * 100);
        let advice = '建议进行中等强度训练，保持运动习惯。';

        if (loadLevel < 30) {
            advice = '最近运动量较少，建议逐步增加活动量。';
        } else if (loadLevel > 80) {
            advice = '最近运动量较大，注意休息和恢复。';
        }

        const loadFill = document.getElementById('load-fill');
        const loadAdvice = document.getElementById('load-advice');

        if (loadFill) {
            setTimeout(() => {
                loadFill.style.width = `${loadLevel}%`;
            }, 100);
        }
        if (loadAdvice) {
            loadAdvice.textContent = advice;
        }
    }

    checkTodaysWorkout() {
        const records = this.state.state.workoutRecords;
        const today = new Date();
        const todayStr = today.toDateString();

        const todaysWorkout = records.find(r => new Date(r.date).toDateString() === todayStr);

        const diaryEmpty = document.getElementById('diary-empty');
        const diaryContent = document.getElementById('diary-content');

        if (todaysWorkout) {
            if (diaryEmpty) diaryEmpty.style.display = 'none';
            if (diaryContent) diaryContent.style.display = 'block';
            this.renderDiaryContent(todaysWorkout);
        } else {
            if (diaryEmpty) diaryEmpty.style.display = 'block';
            if (diaryContent) diaryContent.style.display = 'none';
        }
    }

    renderDiaryContent(workout) {
        const diaryDate = document.getElementById('diary-date-display');
        const diaryQuote = document.getElementById('diary-quote');
        const diarySummary = document.getElementById('diary-summary');

        const quotes = [
            '每一次运动都是对自己的投资，未来的你会感谢今天的坚持。',
            '身体的每一次疲惫，都是成长的印记。',
            '运动不是负担，而是给生活充电的方式。',
            '今天的汗水，是明天的健康。',
            '在运动中寻找自己，在坚持中遇见更好的自己。'
        ];

        if (diaryDate) {
            const date = new Date(workout.date);
            diaryDate.textContent = date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });
        }

        if (diaryQuote) {
            diaryQuote.textContent = quotes[Math.floor(Math.random() * quotes.length)];
        }

        if (diarySummary) {
            const typeName = typeNames[workout.type] || '运动';
            diarySummary.textContent = `今天你完成了 ${workout.duration} 分钟的${typeName}，距离 ${workout.distance?.toFixed(1) || 0} 公里。继续保持！`;
        }
    }

    renderMapContent() {
        this.renderRadarChart();
        this.renderTrendChart();
        this.renderSummaryStats();
    }

    switchPeriod(period) {
        this.state.setCurrentPeriod(period);

        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.period === period);
        });

        this.renderMapContent();
    }

    renderRadarChart() {
        const period = this.state.state.currentPeriod;
        const stats = this.state.getPeriodStats(period);
        const svg = document.getElementById('radar-svg');

        if (!svg) return;

        const previousStats = this.state.getPreviousPeriodStats(period);
        const centerX = 150;
        const centerY = 150;
        const maxRadius = 100;
        const labels = ['心肺', '恢复', '稳定', '强度', '持续'];
        const angles = labels.map((_, i) => (Math.PI * 2 * i) / labels.length - Math.PI / 2);

        let svgContent = '';

        // 绘制背景网格，添加动画
        for (let i = 1; i <= 5; i++) {
            const radius = (maxRadius / 5) * i;
            svgContent += `<circle cx="${centerX}" cy="${centerY}" r="0" fill="none" stroke="#DDD5C8" stroke-width="1">
                <animate attributeName="r" from="0" to="${radius}" dur="${0.3 + i * 0.1}s" fill="freeze"/>
                <animate attributeName="opacity" from="0" to="1" dur="${0.3 + i * 0.1}s" fill="freeze"/>
            </circle>`;
        }

        // 绘制轴线
        angles.forEach((angle, i) => {
            const x = centerX + Math.cos(angle) * maxRadius;
            const y = centerY + Math.sin(angle) * maxRadius;
            svgContent += `<line x1="${centerX}" y1="${centerY}" x2="${centerX}" y2="${centerY}" stroke="#DDD5C8" stroke-width="1">
                <animate attributeName="x2" from="${centerX}" to="${x}" dur="0.5s" begin="${i * 0.08}s" fill="freeze"/>
                <animate attributeName="y2" from="${centerY}" to="${y}" dur="0.5s" begin="${i * 0.08}s" fill="freeze"/>
            </line>`;
        });

        // 绘制标签
        angles.forEach((angle, i) => {
            const x = centerX + Math.cos(angle) * (maxRadius + 20);
            const y = centerY + Math.sin(angle) * (maxRadius + 20);
            svgContent += `<text x="${x}" y="${y}" text-anchor="middle" fill="#1B4332" font-size="12" dy="4" opacity="0">
                <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="${0.8 + i * 0.05}s" fill="freeze"/>
            ${labels[i]}</text>`;
        });

        // 绘制上一期数据
        if (previousStats) {
            const previousValues = [
                Math.min(100, (previousStats.duration / 300) * 100),
                65,
                Math.min(100, previousStats.count * 20),
                Math.min(100, (previousStats.distance / 50) * 100),
                Math.min(100, (previousStats.duration / 500) * 100)
            ];

            const previousPoints = previousValues.map((value, i) => {
                const radius = Math.max(5, (value / 100) * maxRadius);
                return `${centerX + Math.cos(angles[i]) * radius},${centerY + Math.sin(angles[i]) * radius}`;
            }).join(' ');

            // 上一期数据也添加从中心展开的动画
            const initialPoints = Array(labels.length).fill(`${centerX},${centerY}`).join(' ');
            svgContent += `<polygon points="${initialPoints}" fill="rgba(158, 158, 158, 0.15)" stroke="#9E9E9E" stroke-width="1.5" stroke-dasharray="4,2" opacity="0">
                <animate attributeName="points" from="${initialPoints}" to="${previousPoints}" dur="0.8s" begin="0.9s" fill="freeze" calcMode="spline" keySplines="0.25 0.1 0.25 1"/>
                <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0.9s" fill="freeze"/>
            </polygon>`;
        }

        // 绘制当前期数据
        const currentValues = [
            Math.min(100, Math.max(10, (stats.duration / 300) * 100)),
            70,
            Math.min(100, Math.max(10, stats.count * 20)),
            Math.min(100, Math.max(10, (stats.distance / 50) * 100)),
            Math.min(100, Math.max(10, (stats.duration / 500) * 100))
        ];

        const points = currentValues.map((value, i) => {
            const radius = (value / 100) * maxRadius;
            return `${centerX + Math.cos(angles[i]) * radius},${centerY + Math.sin(angles[i]) * radius}`;
        }).join(' ');

        const initialPoints = Array(labels.length).fill(`${centerX},${centerY}`).join(' ');
        svgContent += `<polygon points="${initialPoints}" fill="rgba(27, 67, 50, 0.25)" stroke="#1B4332" stroke-width="2.5" opacity="0">
            <animate attributeName="points" from="${initialPoints}" to="${points}" dur="1s" begin="1.1s" fill="freeze" calcMode="spline" keySplines="0.25 0.1 0.25 1"/>
            <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="1.1s" fill="freeze"/>
        </polygon>`;

        // 绘制数据点
        currentValues.forEach((value, i) => {
            const radius = (value / 100) * maxRadius;
            const x = centerX + Math.cos(angles[i]) * radius;
            const y = centerY + Math.sin(angles[i]) * radius;
            svgContent += `<circle cx="${centerX}" cy="${centerY}" r="0" fill="#1B4332" opacity="0">
                <animate attributeName="cx" from="${centerX}" to="${x}" dur="0.6s" begin="${1.5 + i * 0.1}s" fill="freeze" calcMode="spline" keySplines="0.25 0.1 0.25 1"/>
                <animate attributeName="cy" from="${centerY}" to="${y}" dur="0.6s" begin="${1.5 + i * 0.1}s" fill="freeze" calcMode="spline" keySplines="0.25 0.1 0.25 1"/>
                <animate attributeName="r" from="0" to="5" dur="0.4s" begin="${1.7 + i * 0.1}s" fill="freeze"/>
                <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="${1.5 + i * 0.1}s" fill="freeze"/>
            </circle>`;
        });

        svg.innerHTML = svgContent;
    }

    renderTrendChart() {
        const bodyAgeData = this.state.getBodyAgeEstimate();
        const trendValue = document.getElementById('trend-value');
        const trendChartContainer = document.getElementById('trend-chart');

        if (trendValue) {
            const sign = bodyAgeData.difference >= 0 ? '年轻' : '年长';
            trendValue.textContent = `${sign} ${Math.abs(bodyAgeData.difference)} 岁`;
        }

        if (!trendChartContainer) return;

        const records = this.state.state.workoutRecords;
        const actualAge = this.state.state.userProfile.actualAge || 30;
        
        let dataPoints = [];
        const weeks = 8;
        
        for (let i = weeks; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i * 7);
            
            let ageAdjustment = 0;
            if (records.length > 0) {
                const progress = Math.min(i / weeks, 1);
                ageAdjustment = Math.floor(records.length / 10) * (1 - progress);
            }
            
            dataPoints.push({
                date: date,
                actualAge: actualAge,
                bodyAge: actualAge - ageAdjustment
            });
        }

        const width = trendChartContainer.offsetWidth || 300;
        const height = 120;
        const padding = { top: 20, right: 20, bottom: 30, left: 40 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const allAges = dataPoints.flatMap(d => [d.actualAge, d.bodyAge]);
        const minAge = Math.min(...allAges) - 2;
        const maxAge = Math.max(...allAges) + 2;

        let svg = `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}">`;

        svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#DDD5C8" stroke-width="1"/>`;
        svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#DDD5C8" stroke-width="1"/>`;

        const gridLines = 4;
        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (chartHeight / gridLines) * i;
            const age = Math.round(maxAge - ((maxAge - minAge) / gridLines) * i);
            svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#F0ECE5" stroke-width="1"/>`;
            svg += `<text x="${padding.left - 5}" y="${y + 4}" text-anchor="end" fill="#9E9E9E" font-size="10">${age}</text>`;
        }

        const actualAgeY = padding.top + chartHeight * (1 - (actualAge - minAge) / (maxAge - minAge));
        svg += `<line x1="${padding.left}" y1="${actualAgeY}" x2="${width - padding.right}" y2="${actualAgeY}" stroke="#E8A838" stroke-width="1.5" stroke-dasharray="4,2"/>`;
        svg += `<text x="${width - padding.right + 5}" y="${actualAgeY + 4}" fill="#E8A838" font-size="10">实际年龄</text>`;

        const points = dataPoints.map((d, i) => {
            const x = padding.left + (chartWidth / (dataPoints.length - 1)) * i;
            const y = padding.top + chartHeight * (1 - (d.bodyAge - minAge) / (maxAge - minAge));
            return `${x},${y}`;
        }).join(' ');

        svg += `<polyline points="${points}" fill="none" stroke="#1B4332" stroke-width="2.5"/>`;

        dataPoints.forEach((d, i) => {
            const x = padding.left + (chartWidth / (dataPoints.length - 1)) * i;
            const y = padding.top + chartHeight * (1 - (d.bodyAge - minAge) / (maxAge - minAge));
            svg += `<circle cx="${x}" cy="${y}" r="4" fill="#1B4332"/>`;
        });

        const firstDate = dataPoints[0].date.toLocaleDateString('zh-CN', { month: 'short' });
        const lastDate = dataPoints[dataPoints.length - 1].date.toLocaleDateString('zh-CN', { month: 'short' });
        svg += `<text x="${padding.left}" y="${height - 8}" text-anchor="start" fill="#9E9E9E" font-size="10">${firstDate}</text>`;
        svg += `<text x="${width - padding.right}" y="${height - 8}" text-anchor="end" fill="#9E9E9E" font-size="10">${lastDate}</text>`;

        svg += '</svg>';
        trendChartContainer.innerHTML = svg;
    }

    renderSummaryStats() {
        const period = this.state.state.currentPeriod;
        const stats = this.state.getPeriodStats(period);

        const summaryWorkouts = document.getElementById('summary-workouts');
        const summaryDistance = document.getElementById('summary-distance');
        const summaryDuration = document.getElementById('summary-duration');

        if (summaryWorkouts) summaryWorkouts.textContent = stats.count;
        if (summaryDistance) summaryDistance.textContent = stats.distance.toFixed(1);
        if (summaryDuration) summaryDuration.textContent = stats.duration;
    }

    renderRecordsContent() {
        const typeFilter = document.getElementById('type-filter');
        const timeFilter = document.getElementById('time-filter');
        const type = typeFilter ? typeFilter.value : 'all';
        const time = timeFilter ? timeFilter.value : 'all';

        const records = this.state.getRecordsByFilter(type, time);
        const timeline = document.getElementById('timeline');
        const emptyState = document.getElementById('empty-records');

        if (!timeline) return;

        if (records.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            timeline.innerHTML = '';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        const groupedRecords = {};
        records.forEach(record => {
            const date = new Date(record.date);
            const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            if (!groupedRecords[dateKey]) {
                groupedRecords[dateKey] = [];
            }
            groupedRecords[dateKey].push(record);
        });

        let html = '';
        Object.keys(groupedRecords).sort((a, b) => new Date(b) - new Date(a)).forEach(dateKey => {
            const groupRecords = groupedRecords[dateKey];
            html += `<div class="timeline-date-group">${formatShortDate(groupRecords[0].date)}</div>`;
            
            groupRecords.forEach(record => {
                html += `
                    <div class="timeline-item" data-id="${record.id}">
                        <div class="timeline-dot ${record.type}" style="background: ${typeBgColors[record.type]}">
                            ${typeIcons[record.type] || '🏋️'}
                        </div>
                        <div class="timeline-card" onclick="window.uiController.showWorkoutDetail('${record.id}')">
                            <div class="timeline-card-header">
                                <div class="timeline-type">${typeNames[record.type] || '运动'}</div>
                            </div>
                            <div class="timeline-meta">
                                <span>${formatShortDate(record.date)}</span>
                            </div>
                            <div class="timeline-stats">
                                <div class="timeline-stat">
                                    <div class="timeline-stat-value">${record.duration || 0}</div>
                                    <div class="timeline-stat-label">分钟</div>
                                </div>
                                <div class="timeline-stat">
                                    <div class="timeline-stat-value">${record.distance?.toFixed(1) || 0}</div>
                                    <div class="timeline-stat-label">公里</div>
                                </div>
                            </div>
                            <div class="timeline-card-actions">
                                <button class="timeline-action-btn" onclick="event.stopPropagation(); window.uiController.showWorkoutDetail('${record.id}')">查看</button>
                                <button class="timeline-action-btn" onclick="event.stopPropagation(); window.uiController.editWorkout('${record.id}')">编辑</button>
                                <button class="timeline-action-btn delete" onclick="event.stopPropagation(); window.uiController.deleteWorkout('${record.id}')">删除</button>
                            </div>
                        </div>
                    </div>
                `;
            });
        });

        timeline.innerHTML = html;
    }

    showWorkoutDetail(id) {
        const workout = this.state.getWorkoutById(id);
        if (!workout) return;

        this.state.setCurrentWorkoutId(id);
        const detailBody = document.getElementById('detail-modal-body');
        
        if (detailBody) {
            detailBody.innerHTML = `
                <div class="detail-header">
                    <div class="detail-icon" style="background: ${typeBgColors[workout.type]}">
                        ${typeIcons[workout.type]}
                    </div>
                    <div>
                        <div class="detail-type">${typeNames[workout.type]}</div>
                        <div class="detail-date">${formatDate(workout.date)}</div>
                    </div>
                </div>
                <div class="detail-stats">
                    <div class="detail-stat">
                        <div class="detail-stat-value">${workout.duration}</div>
                        <div class="detail-stat-label">时长 (分钟)</div>
                    </div>
                    <div class="detail-stat">
                        <div class="detail-stat-value">${workout.distance?.toFixed(1) || 0}</div>
                        <div class="detail-stat-label">距离 (公里)</div>
                    </div>
                    <div class="detail-stat">
                        <div class="detail-stat-value">${workout.avgHeartRate || '--'}</div>
                        <div class="detail-stat-label">平均心率</div>
                    </div>
                    <div class="detail-stat">
                        <div class="detail-stat-value">${workout.calories || 0}</div>
                        <div class="detail-stat-label">消耗 (卡路里)</div>
                    </div>
                </div>
                ${workout.notes ? `
                    <div class="detail-notes">
                        <div class="detail-notes-title">备注</div>
                        <div class="detail-notes-text">${workout.notes}</div>
                    </div>
                ` : ''}
            `;
        }

        this.showModal('workout-detail-modal');
    }

    editWorkout(id) {
        const workout = this.state.getWorkoutById(id);
        if (!workout) return;

        this.state.setCurrentWorkoutId(id);
        
        document.getElementById('edit-type').value = workout.type;
        document.getElementById('edit-duration').value = workout.duration;
        document.getElementById('edit-distance').value = workout.distance;
        document.getElementById('edit-heartrate').value = workout.avgHeartRate || '';
        document.getElementById('edit-calories').value = workout.calories || '';
        document.getElementById('edit-notes').value = workout.notes || '';

        this.hideModal('workout-detail-modal');
        this.showModal('edit-workout-modal');
    }

    showEditModal() {
        const id = this.state.state.currentWorkoutId;
        if (id) {
            this.editWorkout(id);
        }
    }

    saveWorkoutEdit() {
        const id = this.state.state.currentWorkoutId;
        if (!id) return;

        const updates = {
            type: document.getElementById('edit-type').value,
            duration: parseInt(document.getElementById('edit-duration').value) || 0,
            distance: parseFloat(document.getElementById('edit-distance').value) || 0,
            avgHeartRate: parseInt(document.getElementById('edit-heartrate').value) || 0,
            calories: parseInt(document.getElementById('edit-calories').value) || 0,
            notes: document.getElementById('edit-notes').value
        };

        this.state.updateWorkoutRecord(id, updates);
        this.hideModal('edit-workout-modal');
    }

    deleteWorkout(id) {
        if (confirm('确定要删除这条运动记录吗？')) {
            this.state.deleteWorkoutRecord(id);
        }
    }

    deleteCurrentWorkout() {
        const id = this.state.state.currentWorkoutId;
        if (id) {
            this.deleteWorkout(id);
            this.hideModal('workout-detail-modal');
        }
    }

    renderJourneyContent() {
        const { userProfile, workoutRecords } = this.state.state;
        const visionCard = document.getElementById('vision-card');
        const journeyStats = document.getElementById('journey-stats');

        if (userProfile.vision && userProfile.vision.length > 0) {
            if (visionCard) visionCard.style.display = 'none';
            if (journeyStats) journeyStats.style.display = 'block';
            
            const visionValue = document.getElementById('vision-display-value');
            if (visionValue) {
                visionValue.textContent = userProfile.vision.join(' · ');
            }

            this.renderJourneyStats();
            this.renderBodyAgeChart();
            this.renderHeatmap();
            this.renderTrendReport();
        } else {
            if (visionCard) visionCard.style.display = 'block';
            if (journeyStats) journeyStats.style.display = 'none';
        }
    }

    renderJourneyStats() {
        const stats = this.state.getTotalStats();
        
        const totalWorkouts = document.getElementById('total-workouts');
        const totalDistance = document.getElementById('total-distance');
        const streak = document.getElementById('streak');
        const totalCalories = document.getElementById('total-calories');

        if (totalWorkouts) totalWorkouts.textContent = stats.totalWorkouts;
        if (totalDistance) totalDistance.textContent = stats.totalDistance;
        if (streak) streak.textContent = stats.streak;
        if (totalCalories) totalCalories.textContent = stats.totalCalories;
    }

    renderBodyAgeChart() {
        const container = document.getElementById('body-age-chart');
        if (!container) return;

        const records = this.state.state.workoutRecords;
        const actualAge = this.state.state.userProfile.actualAge || 30;
        
        let dataPoints = [];
        const months = 12;
        
        for (let i = months; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            
            let ageAdjustment = 0;
            if (records.length > 0) {
                const progress = Math.min(i / months, 1);
                ageAdjustment = Math.min(8, Math.floor(records.length / 5)) * (1 - progress);
            }
            
            dataPoints.push({
                date: date,
                actualAge: actualAge,
                bodyAge: actualAge - ageAdjustment
            });
        }

        const width = container.offsetWidth || 300;
        const height = 180;
        const padding = { top: 25, right: 25, bottom: 40, left: 50 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const allAges = dataPoints.flatMap(d => [d.actualAge, d.bodyAge]);
        const minAge = Math.min(...allAges) - 3;
        const maxAge = Math.max(...allAges) + 3;

        let svg = `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}">`;

        svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#DDD5C8" stroke-width="1"/>`;
        svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#DDD5C8" stroke-width="1"/>`;

        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (chartHeight / gridLines) * i;
            const age = Math.round(maxAge - ((maxAge - minAge) / gridLines) * i);
            svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#F0ECE5" stroke-width="1"/>`;
            svg += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" fill="#9E9E9E" font-size="11">${age}岁</text>`;
        }

        const actualAgeY = padding.top + chartHeight * (1 - (actualAge - minAge) / (maxAge - minAge));
        svg += `<line x1="${padding.left}" y1="${actualAgeY}" x2="${width - padding.right}" y2="${actualAgeY}" stroke="#E8A838" stroke-width="1.5" stroke-dasharray="5,3"/>`;

        const areaPoints = dataPoints.map((d, i) => {
            const x = padding.left + (chartWidth / (dataPoints.length - 1)) * i;
            const y = padding.top + chartHeight * (1 - (d.bodyAge - minAge) / (maxAge - minAge));
            return `${x},${y}`;
        });
        const areaPath = `M${areaPoints.join(' L')} L${padding.left + chartWidth},${height - padding.bottom} L${padding.left},${height - padding.bottom} Z`;
        svg += `<path d="${areaPath}" fill="rgba(27, 67, 50, 0.1)"/>`;

        svg += `<polyline points="${areaPoints.join(' ')}" fill="none" stroke="#1B4332" stroke-width="3"/>`;

        dataPoints.forEach((d, i) => {
            const x = padding.left + (chartWidth / (dataPoints.length - 1)) * i;
            const y = padding.top + chartHeight * (1 - (d.bodyAge - minAge) / (maxAge - minAge));
            svg += `<circle cx="${x}" cy="${y}" r="5" fill="#1B4332"/>`;
        });

        svg += '</svg>';
        container.innerHTML = svg;
    }

    renderHeatmap() {
        const container = document.getElementById('heatmap-container');
        if (!container) return;

        const heatmapData = this.state.getHeatmapData();
        const weeks = 12;
        const daysPerWeek = 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (weeks * daysPerWeek));

        let html = '';
        const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
        
        dayNames.forEach(day => {
            html += `<div class="heatmap-week-label">${day}</div>`;
        });

        for (let w = 0; w < weeks; w++) {
            for (let d = 0; d < daysPerWeek; d++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + (w * daysPerWeek) + d);
                const dateKey = currentDate.toDateString();
                const count = heatmapData[dateKey] || 0;
                
                let level = 0;
                if (count >= 5) level = 5;
                else if (count >= 4) level = 4;
                else if (count >= 3) level = 3;
                else if (count >= 2) level = 2;
                else if (count >= 1) level = 1;

                const tooltip = count > 0 
                    ? `${formatShortDate(currentDate)}: ${count}次运动`
                    : formatShortDate(currentDate);

                html += `
                    <div class="heatmap-cell ${level > 0 ? `level-${level}` : ''}">
                        <div class="tooltip">${tooltip}</div>
                    </div>
                `;
            }
        }

        html += `<div class="heatmap-legend">
            <span>少</span>
            <div class="heatmap-legend-items">
                <div class="heatmap-legend-item"></div>
                <div class="heatmap-legend-item level-1"></div>
                <div class="heatmap-legend-item level-2"></div>
                <div class="heatmap-legend-item level-3"></div>
                <div class="heatmap-legend-item level-4"></div>
                <div class="heatmap-legend-item level-5"></div>
            </div>
            <span>多</span>
        </div>`;

        container.innerHTML = html;
    }

    renderTrendReport() {
        const stats = this.state.getTotalStats();
        const records = this.state.state.workoutRecords;

        const reportFrequency = document.getElementById('report-frequency');
        const reportDuration = document.getElementById('report-duration');
        const reportTime = document.getElementById('report-time');
        const reportInsight = document.getElementById('report-insight');

        const weeklyFreq = records.length > 0 
            ? Math.round((records.length / Math.max(1, stats.daysSinceFirst)) * 7 * 10) / 10
            : 0;
        const avgDuration = records.length > 0
            ? Math.round(records.reduce((sum, r) => sum + (r.duration || 0), 0) / records.length)
            : 0;

        if (reportFrequency) reportFrequency.textContent = `每周 ${weeklyFreq} 次`;
        if (reportDuration) reportDuration.textContent = `${avgDuration} 分钟`;
        if (reportTime) reportTime.textContent = '早晨';

        let insight = '';
        if (records.length === 0) {
            insight = '开始你的运动之旅，坚持运动，身体状态会持续改善！';
        } else if (records.length < 10) {
            insight = '很好的开始！继续保持规律运动，你会逐渐感受到身体的变化。';
        } else if (records.length < 30) {
            insight = '你已经建立了运动习惯！身体状态正在稳步提升，继续加油！';
        } else {
            insight = '太棒了！你已经把运动变成了生活的一部分，身体年龄正在年轻化！';
        }

        if (reportInsight) reportInsight.textContent = insight;
    }

    showSharePoster() {
        const { userProfile } = this.state.state;
        const stats = this.state.getTotalStats();

        document.getElementById('poster-vision').textContent = userProfile.vision?.[0] || '健康生活';
        document.getElementById('poster-workouts').textContent = stats.totalWorkouts;
        document.getElementById('poster-distance').textContent = stats.totalDistance;
        document.getElementById('poster-days').textContent = stats.daysSinceFirst;

        this.showModal('share-poster-modal');
    }

    savePoster() {
        alert('海报保存功能（需要使用html2canvas等库实现截图）');
        this.hideModal('share-poster-modal');
    }

    showCustomVisionModal() {
        const modal = document.getElementById('custom-vision-modal');
        if (modal) modal.style.display = 'flex';
    }

    renderTreeContent() {
        const { treeState, workoutRecords } = this.state.state;
        
        const trunkThickness = document.getElementById('trunk-thickness');
        const branchCount = document.getElementById('branch-count');
        const leafDensity = document.getElementById('leaf-density');
        const timelineSlider = document.getElementById('timeline-slider');
        const timelineCurrentDate = document.getElementById('timeline-current-date');

        if (trunkThickness) {
            const thicknessLabels = ['基础', '成长', '茁壮', '茂盛', '参天'];
            trunkThickness.textContent = thicknessLabels[Math.min(treeState.trunkThickness - 1, thicknessLabels.length - 1)];
        }
        if (branchCount) branchCount.textContent = treeState.branches.length;
        if (leafDensity) {
            const densityLabels = ['稀疏', '普通', '茂盛', '浓密'];
            leafDensity.textContent = densityLabels[Math.min(treeState.leaves.density - 1, densityLabels.length - 1)];
        }

        if (timelineSlider && workoutRecords.length > 0) {
            timelineSlider.max = workoutRecords.length;
            timelineSlider.value = workoutRecords.length;
            timelineSlider.addEventListener('input', (e) => {
                this.renderLifeTreeAtTime(parseInt(e.target.value));
            });
        }

        if (timelineCurrentDate) {
            timelineCurrentDate.textContent = '今天';
        }

        this.renderLifeTree();
    }

    renderLifeTreeAtTime(timeIndex) {
        const { workoutRecords } = this.state.state;
        if (timeIndex === 0) {
            this.renderEmptyTree();
            return;
        }

        const recordsUpToTime = workoutRecords.slice(0, timeIndex);
        const tempTreeState = this.calculateTreeState(recordsUpToTime);
        this.renderLifeTreeWithState(tempTreeState);
    }

    renderEmptyTree() {
        const svg = document.getElementById('life-tree-svg');
        if (!svg) return;

        svg.innerHTML = `
            <defs>
                <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#8B6914;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#A0826D;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#8B6914;stop-opacity:1" />
                </linearGradient>
                <radialGradient id="leafGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#2E7D32;stop-opacity:1" />
                </radialGradient>
            </defs>
            <rect x="195" y="350" width="10" height="100" fill="url(#trunkGradient)" rx="3"/>
            <text x="200" y="250" text-anchor="middle" fill="#5D4E37" font-size="14" font-family="system-ui">
                开始你的运动之旅
            </text>
        `;
    }

    calculateTreeState(records) {
        const trunkThickness = Math.min(10, 1 + Math.floor(records.length / 5));
        const branches = records.slice(0, 20).map((record, index) => {
            let branchType = 'secondary';
            if (index % 4 === 0) branchType = 'primary';
            
            const length = Math.min(100, 30 + (record.duration || 30));
            const angle = 60 + (index * 20) + Math.random() * 20;
            
            return {
                id: record.id,
                type: branchType,
                length: length,
                angle: angle,
                workoutId: record.id,
                record: record
            };
        });
        
        const leavesDensity = Math.min(10, 1 + Math.floor(records.length / 3));
        
        return {
            trunkThickness,
            branches,
            leaves: { density: leavesDensity, type: 'growing' },
            flowers: [],
            fruits: [],
            stars: []
        };
    }

    renderLifeTreeWithState(treeState) {
        const svg = document.getElementById('life-tree-svg');
        if (!svg) return;

        if (!this.treeTransform) {
            this.treeTransform = {
                scale: 1,
                translateX: 0,
                translateY: 0
            };
        }

        let svgContent = `
            <defs>
                <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#8B6914;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#A0826D;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#8B6914;stop-opacity:1" />
                </linearGradient>
                <radialGradient id="leafGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#2E7D32;stop-opacity:1" />
                </radialGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
                <radialGradient id="starGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#FFA500;stop-opacity:1" />
                </radialGradient>
            </defs>
        `;

        const transformAttr = `transform="translate(${this.treeTransform.translateX}, ${this.treeTransform.translateY}) scale(${this.treeTransform.scale})"`;
        
        svgContent += `<g id="treeContent" ${transformAttr}>`;

        // 添加树干动画
        const trunkWidth = 10 + treeState.trunkThickness * 3;
        const trunkHeight = 120 + treeState.trunkThickness * 5;
        svgContent += `<rect class="tree-trunk" x="${200 - trunkWidth/2}" y="400" width="${trunkWidth}" height="0" fill="url(#trunkGradient)" rx="5">
            <animate attributeName="y" from="400" to="${400 - trunkHeight}" dur="1s" fill="freeze" calcMode="spline" keySplines="0.25 0.1 0.25 1"/>
            <animate attributeName="height" from="0" to="${trunkHeight}" dur="1s" fill="freeze" calcMode="spline" keySplines="0.25 0.1 0.25 1"/>
        </rect>`;

        // 添加分支动画
        treeState.branches.forEach((branch, index) => {
            const trunkBaseY = 400 - trunkHeight + 30;
            const startX = 200;
            const startY = trunkBaseY + (index * 12);
            
            const isLeft = index % 2 === 0;
            const baseAngle = isLeft ? 160 : 20;
            const angle = (baseAngle + (branch.angle % 40)) * Math.PI / 180;
            
            const endX = startX + Math.cos(angle) * branch.length;
            const endY = startY - Math.sin(angle) * branch.length * 0.8;
            
            const strokeWidth = branch.type === 'primary' ? 4 : 2;
            const strokeColor = branch.type === 'primary' ? '#6D5A43' : '#8B7355';
            const delay = 0.5 + index * 0.15; // 每个分支有延迟
            
            svgContent += `<g class="branch tree-branch" data-workout-id="${branch.workoutId}" style="cursor: pointer;">`;
            svgContent += `<line x1="${startX}" y1="${startY}" x2="${startX}" y2="${startY}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round">
                <animate attributeName="x2" from="${startX}" to="${endX}" dur="0.6s" begin="${delay}s" fill="freeze" calcMode="spline" keySplines="0.25 0.1 0.25 1"/>
                <animate attributeName="y2" from="${startY}" to="${endY}" dur="0.6s" begin="${delay}s" fill="freeze" calcMode="spline" keySplines="0.25 0.1 0.25 1"/>
                <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="${delay}s" fill="freeze"/>
            </line>`;
            
            // 添加叶子动画
            const leafCount = Math.floor(branch.length / 15);
            for (let i = 0; i < leafCount; i++) {
                const t = (i + 1) / (leafCount + 1);
                const leafX = startX + (endX - startX) * t + (Math.random() - 0.5) * 10;
                const leafY = startY + (endY - startY) * t + (Math.random() - 0.5) * 10;
                const leafSize = 4 + Math.random() * 4;
                const leafDelay = delay + 0.4 + i * 0.05;
                
                svgContent += `<ellipse class="tree-leaf" cx="${leafX}" cy="${leafY}" rx="0" ry="0" 
                    fill="url(#leafGradient)" opacity="0" transform="rotate(${Math.random() * 360}, ${leafX}, ${leafY})">
                    <animate attributeName="rx" from="0" to="${leafSize}" dur="0.3s" begin="${leafDelay}s" fill="freeze"/>
                    <animate attributeName="ry" from="0" to="${leafSize * 0.6}" dur="0.3s" begin="${leafDelay}s" fill="freeze"/>
                    <animate attributeName="opacity" from="0" to="0.8" dur="0.3s" begin="${leafDelay}s" fill="freeze"/>
                </ellipse>`;
            }
            
            // 添加星星动画
            if (branch.record && branch.record.avgHeartRate && branch.record.avgHeartRate > 130) {
                const starX = endX;
                const starY = endY;
                svgContent += this.renderStar(starX, starY, delay + 0.7);
            }
            
            svgContent += `</g>`;
        });

        svgContent += `</g>`;

        svg.innerHTML = svgContent;

        // 绑定点击事件
        svg.querySelectorAll('.branch').forEach(branch => {
            branch.addEventListener('click', (e) => {
                const workoutId = e.currentTarget.dataset.workoutId;
                if (workoutId) {
                    this.showWorkoutDetail(workoutId);
                }
            });
        });

        this.bindTreeZoomEvents(svg);
    }

    bindTreeZoomEvents(svg) {
        if (!svg) return;

        if (svg._zoomEventsBound) return;
        svg._zoomEventsBound = true;

        let isDragging = false;
        let startX, startY;
        let lastScale = 1;

        const treeContent = svg.querySelector('#treeContent');

        svg.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.treeTransform.scale = Math.max(0.5, Math.min(3, this.treeTransform.scale * delta));
            this.updateTreeTransform();
        });

        svg.addEventListener('mousedown', (e) => {
            if (e.target.closest('.branch')) return;
            isDragging = true;
            startX = e.clientX - this.treeTransform.translateX;
            startY = e.clientY - this.treeTransform.translateY;
        });

        svg.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            this.treeTransform.translateX = e.clientX - startX;
            this.treeTransform.translateY = e.clientY - startY;
            this.updateTreeTransform();
        });

        svg.addEventListener('mouseup', () => {
            isDragging = false;
        });

        svg.addEventListener('mouseleave', () => {
            isDragging = false;
        });

        svg.addEventListener('touchstart', (e) => {
            if (e.target.closest('.branch')) return;
            if (e.touches.length === 1) {
                isDragging = true;
                startX = e.touches[0].clientX - this.treeTransform.translateX;
                startY = e.touches[0].clientY - this.treeTransform.translateY;
            } else if (e.touches.length === 2) {
                isDragging = false;
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                lastScale = this.treeTransform.scale;
                this.lastPinchDistance = Math.hypot(
                    touch1.clientX - touch2.clientX,
                    touch1.clientY - touch2.clientY
                );
            }
        });

        svg.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 1 && isDragging) {
                this.treeTransform.translateX = e.touches[0].clientX - startX;
                this.treeTransform.translateY = e.touches[0].clientY - startY;
                this.updateTreeTransform();
            } else if (e.touches.length === 2) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const distance = Math.hypot(
                    touch1.clientX - touch2.clientX,
                    touch1.clientY - touch2.clientY
                );
                if (this.lastPinchDistance) {
                    const scale = distance / this.lastPinchDistance;
                    this.treeTransform.scale = Math.max(0.5, Math.min(3, lastScale * scale));
                    this.updateTreeTransform();
                }
            }
        });

        svg.addEventListener('touchend', () => {
            isDragging = false;
            this.lastPinchDistance = null;
        });
    }

    updateTreeTransform() {
        const svg = document.getElementById('life-tree-svg');
        const treeContent = svg?.querySelector('#treeContent');
        if (treeContent) {
            treeContent.setAttribute('transform', 
                `translate(${this.treeTransform.translateX}, ${this.treeTransform.translateY}) scale(${this.treeTransform.scale})`
            );
        }
    }

    renderStar(x, y, delay = 0) {
        const starPoints = [];
        const outerRadius = 8;
        const innerRadius = 4;
        
        for (let i = 0; i < 10; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * 36 - 90) * Math.PI / 180;
            starPoints.push(`${x + radius * Math.cos(angle)},${y + radius * Math.sin(angle)}`);
        }
        
        return `<polygon class="tree-flower" points="${starPoints.join(' ')}" fill="url(#starGradient)" filter="url(#glow)" opacity="0">
            <animate attributeName="opacity" from="0" to="1" dur="0.6s" begin="${delay}s" fill="freeze"/>
            <animateTransform attributeName="transform" type="scale" values="0;1" dur="0.6s" begin="${delay}s" fill="freeze" additive="sum" calcMode="spline" keySplines="0.25 0.1 0.25 1" center="${x} ${y}"/>
        </polygon>`;
    }

    renderLifeTree() {
        const { treeState } = this.state.state;
        this.renderLifeTreeWithState(treeState);
    }

    showTreeHelp() {
        this.showModal('tree-help-modal');
    }

    shareTree() {
        const { treeState } = this.state.state;
        const posterSvg = document.getElementById('poster-tree-svg');
        
        const trunkThickness = document.getElementById('poster-trunk');
        const branchCount = document.getElementById('poster-branches');
        const leafDensity = document.getElementById('poster-leaves');

        if (trunkThickness) {
            const thicknessLabels = ['基础', '成长', '茁壮', '茂盛', '参天'];
            trunkThickness.textContent = thicknessLabels[Math.min(treeState.trunkThickness - 1, thicknessLabels.length - 1)];
        }
        if (branchCount) branchCount.textContent = treeState.branches.length;
        if (leafDensity) {
            const densityLabels = ['稀疏', '普通', '茂盛', '浓密'];
            leafDensity.textContent = densityLabels[Math.min(treeState.leaves.density - 1, densityLabels.length - 1)];
        }

        if (posterSvg) {
            this.renderPosterTree(posterSvg, treeState);
        }

        this.showModal('share-tree-modal');
    }

    renderPosterTree(svg, treeState) {
        let svgContent = `
            <defs>
                <linearGradient id="posterTrunkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#8B6914;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#A0826D;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#8B6914;stop-opacity:1" />
                </linearGradient>
                <radialGradient id="posterLeafGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#2E7D32;stop-opacity:1" />
                </radialGradient>
            </defs>
        `;

        const trunkWidth = 8 + treeState.trunkThickness * 2;
        const trunkHeight = 100 + treeState.trunkThickness * 4;
        svgContent += `<rect x="${150 - trunkWidth/2}" y="${320 - trunkHeight}" width="${trunkWidth}" height="${trunkHeight}" fill="url(#posterTrunkGradient)" rx="4"/>`;

        treeState.branches.forEach((branch, index) => {
            const trunkBaseY = 320 - trunkHeight + 25;
            const startX = 150;
            const startY = trunkBaseY + (index * 10);
            
            const isLeft = index % 2 === 0;
            const baseAngle = isLeft ? 160 : 20;
            const angle = (baseAngle + (branch.angle % 40)) * Math.PI / 180;
            
            const endX = startX + Math.cos(angle) * (branch.length * 0.8);
            const endY = startY - Math.sin(angle) * (branch.length * 0.6);
            
            const strokeWidth = branch.type === 'primary' ? 3 : 1.5;
            const strokeColor = branch.type === 'primary' ? '#6D5A43' : '#8B7355';
            
            svgContent += `<line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round"/>`;
            
            const leafCount = Math.floor(branch.length / 20);
            for (let i = 0; i < leafCount; i++) {
                const t = (i + 1) / (leafCount + 1);
                const leafX = startX + (endX - startX) * t + (Math.random() - 0.5) * 8;
                const leafY = startY + (endY - startY) * t + (Math.random() - 0.5) * 8;
                const leafSize = 3 + Math.random() * 3;
                
                svgContent += `<ellipse cx="${leafX}" cy="${leafY}" rx="${leafSize}" ry="${leafSize * 0.6}" 
                    fill="url(#posterLeafGradient)" opacity="0.8" transform="rotate(${Math.random() * 360}, ${leafX}, ${leafY})"/>`;
            }
        });

        svg.innerHTML = svgContent;
    }

    saveTreePoster() {
        alert('生命树海报保存功能（需要使用html2canvas等库实现截图）');
        this.hideModal('share-tree-modal');
    }

    bindTreeEvents() {
        const helpBtn = document.getElementById('help-btn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => this.showTreeHelp());
        }

        const shareBtn = document.getElementById('share-tree-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareTree());
        }

        const closeHelpBtn = document.getElementById('close-tree-help-modal');
        if (closeHelpBtn) {
            closeHelpBtn.addEventListener('click', () => this.hideModal('tree-help-modal'));
        }

        const gotItBtn = document.getElementById('got-it-btn');
        if (gotItBtn) {
            gotItBtn.addEventListener('click', () => this.hideModal('tree-help-modal'));
        }

        const closeShareTreeBtn = document.getElementById('close-share-tree-modal');
        if (closeShareTreeBtn) {
            closeShareTreeBtn.addEventListener('click', () => this.hideModal('share-tree-modal'));
        }

        const cancelShareTreeBtn = document.getElementById('cancel-share-tree-btn');
        if (cancelShareTreeBtn) {
            cancelShareTreeBtn.addEventListener('click', () => this.hideModal('share-tree-modal'));
        }

        const saveTreePosterBtn = document.getElementById('save-tree-poster-btn');
        if (saveTreePosterBtn) {
            saveTreePosterBtn.addEventListener('click', () => this.saveTreePoster());
        }
    }

    showAddWorkoutDialog() {
        const testRecord = {
            type: 'running',
            duration: 30,
            distance: 5,
            avgHeartRate: 140,
            maxHeartRate: 165,
            calories: 300,
            notes: '晨跑'
        };
        this.state.addWorkoutRecord(testRecord);
        this.showStarAnimation();
        alert('运动记录已添加！');
    }

    bindUploadEvents() {
        const modal = document.getElementById('upload-modal');
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');
        const closeBtn = document.getElementById('close-upload-modal');
        const cancelBtn = document.getElementById('cancel-upload');
        const removeBtn = document.getElementById('remove-image-btn');
        const confirmBtn = document.getElementById('confirm-upload');

        if (uploadArea) {
            uploadArea.addEventListener('click', () => {
                fileInput?.click();
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files?.[0]) {
                    this.handleFileSelect(e.target.files[0]);
                }
            });
        }

        if (uploadArea) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                uploadArea.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });

            ['dragenter', 'dragover'].forEach(eventName => {
                uploadArea.addEventListener(eventName, () => {
                    uploadArea.classList.add('dragover');
                });
            });

            ['dragleave', 'drop'].forEach(eventName => {
                uploadArea.addEventListener(eventName, () => {
                    uploadArea.classList.remove('dragover');
                });
            });

            uploadArea.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                if (dt.files?.[0]) {
                    this.handleFileSelect(dt.files[0]);
                }
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideUploadModal());
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideUploadModal());
        }
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideUploadModal();
            });
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', () => this.resetUploadModal());
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirmUpload());
        }
    }

    showUploadModal() {
        const modal = document.getElementById('upload-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideUploadModal() {
        const modal = document.getElementById('upload-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => this.resetUploadModal(), 300);
        }
    }

    resetUploadModal() {
        const uploadArea = document.getElementById('upload-area');
        const previewArea = document.getElementById('preview-area');
        const parsedData = document.getElementById('parsed-data');
        const parsedData2 = document.getElementById('parsed-data2');
        const parsedData3 = document.getElementById('parsed-data3');
        const fileInput = document.getElementById('file-input');
        const confirmBtn = document.getElementById('confirm-upload');
        const btnText = confirmBtn?.querySelector('.btn-text');
        const btnLoading = confirmBtn?.querySelector('.btn-loading');

        if (uploadArea) uploadArea.style.display = 'block';
        if (previewArea) previewArea.style.display = 'none';
        if (parsedData) parsedData.style.display = 'none';
        if (parsedData2) parsedData2.style.display = 'none';
        if (parsedData3) parsedData3.style.display = 'none';
        if (fileInput) fileInput.value = '';
        if (confirmBtn) confirmBtn.disabled = true;
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';

        const typeInput = document.getElementById('parsed-type');
        const durationInput = document.getElementById('parsed-duration');
        const distanceInput = document.getElementById('parsed-distance');
        const hrInput = document.getElementById('parsed-hr');
        const caloriesInput = document.getElementById('parsed-calories');

        if (typeInput) typeInput.value = 'running';
        if (durationInput) durationInput.value = '';
        if (distanceInput) distanceInput.value = '';
        if (hrInput) hrInput.value = '';
        if (caloriesInput) caloriesInput.value = '';
    }

    handleFileSelect(file) {
        const uploadArea = document.getElementById('upload-area');
        const previewArea = document.getElementById('preview-area');
        const previewImage = document.getElementById('preview-image');
        const confirmBtn = document.getElementById('confirm-upload');
        const btnText = confirmBtn?.querySelector('.btn-text');
        const btnLoading = confirmBtn?.querySelector('.btn-loading');

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件（支持 JPG、PNG、GIF 等格式）');
            return;
        }

        // 验证文件大小（10MB）
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('文件大小不能超过 10MB，请选择较小的图片');
            return;
        }

        // 验证文件扩展名
        const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!validExtensions.includes(extension)) {
            alert(`不支持的文件格式，请选择 ${validExtensions.join('、')} 格式的图片`);
            return;
        }

        const reader = new FileReader();
        
        reader.onloadstart = () => {
            // 显示加载状态
            if (confirmBtn) confirmBtn.disabled = true;
        };

        reader.onload = (e) => {
            try {
                if (previewImage) {
                    previewImage.src = e.target.result;
                }
                if (uploadArea) uploadArea.style.display = 'none';
                if (previewArea) previewArea.style.display = 'block';

                if (btnText) btnText.style.display = 'none';
                if (btnLoading) btnLoading.style.display = 'inline';

                // 模拟图片解析过程
                setTimeout(() => {
                    this.parseImage();
                    if (btnText) btnText.style.display = 'inline';
                    if (btnLoading) btnLoading.style.display = 'none';
                    if (confirmBtn) confirmBtn.disabled = false;
                }, 1200);
            } catch (error) {
                console.error('图片处理失败:', error);
                alert('图片处理失败，请尝试其他图片');
                this.resetUploadModal();
            }
        };

        reader.onerror = () => {
            alert('读取图片文件失败，请重试');
            this.resetUploadModal();
        };

        reader.onabort = () => {
            console.log('文件读取被中止');
        };

        reader.readAsDataURL(file);
    }

    parseImage() {
        const parsedData = document.getElementById('parsed-data');
        const parsedData2 = document.getElementById('parsed-data2');
        const parsedData3 = document.getElementById('parsed-data3');

        if (parsedData) {
            parsedData.style.display = 'block';
            parsedData.style.animation = 'slideIn 0.3s ease-out';
        }
        if (parsedData2) {
            parsedData2.style.display = 'grid';
            parsedData2.style.animation = 'slideIn 0.3s ease-out 0.1s both';
        }
        if (parsedData3) {
            parsedData3.style.display = 'grid';
            parsedData3.style.animation = 'slideIn 0.3s ease-out 0.2s both';
        }

        const durationInput = document.getElementById('parsed-duration');
        const distanceInput = document.getElementById('parsed-distance');
        const hrInput = document.getElementById('parsed-hr');
        const caloriesInput = document.getElementById('parsed-calories');

        // 模拟解析数据，使用更合理的默认值
        if (durationInput) durationInput.value = Math.floor(30 + Math.random() * 30);
        if (distanceInput) distanceInput.value = (3 + Math.random() * 5).toFixed(1);
        if (hrInput) hrInput.value = Math.floor(130 + Math.random() * 30);
        if (caloriesInput) caloriesInput.value = Math.floor(250 + Math.random() * 200);
    }

    confirmUpload() {
        // 获取输入值并验证
        const type = document.getElementById('parsed-type')?.value || 'running';
        const durationValue = document.getElementById('parsed-duration')?.value;
        const distanceValue = document.getElementById('parsed-distance')?.value;
        const avgHeartRateValue = document.getElementById('parsed-hr')?.value;
        const caloriesValue = document.getElementById('parsed-calories')?.value;

        // 验证必填字段
        if (!durationValue || parseInt(durationValue) <= 0) {
            alert('请输入有效的运动时长（分钟）');
            return;
        }

        const duration = parseInt(durationValue) || 30;
        const distance = distanceValue ? parseFloat(distanceValue) : 0;
        const avgHeartRate = avgHeartRateValue ? parseInt(avgHeartRateValue) : 0;
        const calories = caloriesValue ? parseInt(caloriesValue) : 0;

        // 验证数值范围
        if (duration > 1440) {
            alert('运动时长不能超过 24 小时（1440 分钟）');
            return;
        }

        if (distance < 0) {
            alert('距离不能为负数');
            return;
        }

        if (distance > 500) {
            alert('运动距离不能超过 500 公里');
            return;
        }

        if (avgHeartRate < 0 || avgHeartRate > 250) {
            alert('心率值不合法，请重新输入');
            return;
        }

        if (calories < 0 || calories > 10000) {
            alert('卡路里数值不合法，请重新输入');
            return;
        }

        // 创建记录对象
        const record = {
            type: type,
            duration: duration,
            distance: distance,
            avgHeartRate: avgHeartRate,
            maxHeartRate: avgHeartRate > 0 ? avgHeartRate + 25 : 0,
            calories: calories,
            notes: '截图导入'
        };

        // 添加记录
        try {
            this.state.addWorkoutRecord(record);
            this.hideUploadModal();
            this.showStarAnimation();
            
            // 显示成功消息
            this.showSuccessMessage('运动记录已添加！');
        } catch (error) {
            console.error('添加记录失败:', error);
            alert('添加记录失败，请重试');
        }
    }

    showSuccessMessage(message) {
        // 创建临时消息元素
        const msgDiv = document.createElement('div');
        msgDiv.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: #1B4332;
            color: white;
            padding: 16px 32px;
            border-radius: 8px;
            font-size: 16px;
            z-index: 10000;
            animation: fadeIn 0.3s ease-out;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        msgDiv.textContent = message;
        document.body.appendChild(msgDiv);

        // 3秒后移除
        setTimeout(() => {
            msgDiv.style.animation = 'fadeIn 0.3s ease-out reverse';
            setTimeout(() => msgDiv.remove(), 300);
        }, 2000);
    }

    showStarAnimation() {
        const starsContainer = document.getElementById('stars-container');
        if (!starsContainer) return;

        const treeFab = document.getElementById('tree-fab');
        if (!treeFab) return;

        const treeRect = treeFab.getBoundingClientRect();
        const targetX = treeRect.left + treeRect.width / 2;
        const targetY = treeRect.top + treeRect.height / 2;

        const starCount = 5;

        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            `;

            const startX = window.innerWidth / 2 + (Math.random() - 0.5) * 200;
            const startY = window.innerHeight / 2 + (Math.random() - 0.5) * 200;

            star.style.left = startX + 'px';
            star.style.top = startY + 'px';
            star.style.position = 'fixed';
            star.style.color = '#E8A838';
            star.style.width = '24px';
            star.style.height = '24px';
            star.style.pointerEvents = 'none';
            star.style.zIndex = '9999';
            star.style.transition = 'all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

            starsContainer.appendChild(star);

            setTimeout(() => {
                star.style.left = targetX + 'px';
                star.style.top = targetY + 'px';
                star.style.opacity = '0';
                star.style.transform = 'scale(0.3)';
            }, 50);

            setTimeout(() => {
                star.remove();
            }, 1200);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const appState = new AppState();
    const uiController = new UIController(appState);
    
    window.appState = appState;
    window.uiController = uiController;
});