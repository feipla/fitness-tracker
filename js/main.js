// ==================== State Management ====================
class AppState {
    constructor() {
        this.STORAGE_KEYS = {
            USER_PROFILE: 'xunji_user_profile',
            WORKOUT_RECORDS: 'xunji_workout_records',
            TREE_STATE: 'xunji_tree_state',
            HAS_COMPLETED_ONBOARDING: 'xunji_onboarding_done'
        };
        
        this.state = {
            currentView: 'welcome',
            currentTab: 'today',
            currentPeriod: 'week',
            userProfile: this.loadFromStorage(this.STORAGE_KEYS.USER_PROFILE) || {
                actualAge: 30,
                vision: null,
                firstVisitDate: new Date().toISOString(),
                hasCompletedOnboarding: false
            },
            workoutRecords: this.loadFromStorage(this.STORAGE_KEYS.WORKOUT_RECORDS) || [],
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
    }
    
    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error loading from storage:', e);
            return null;
        }
    }
    
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Error saving to storage:', e);
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
    
    addWorkoutRecord(record) {
        const newRecord = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            source: 'estimated',
            ...record
        };
        const records = [...this.state.workoutRecords, newRecord];
        this.state.workoutRecords = records;
        this.saveToStorage(this.STORAGE_KEYS.WORKOUT_RECORDS, records);
        this.updateTreeState();
        this.notify();
        return newRecord;
    }
    
    updateWorkoutRecord(id, updates) {
        const records = this.state.workoutRecords.map(record => 
            record.id === id ? { ...record, ...updates } : record
        );
        this.state.workoutRecords = records;
        this.saveToStorage(this.STORAGE_KEYS.WORKOUT_RECORDS, records);
        this.notify();
    }
    
    deleteWorkoutRecord(id) {
        const records = this.state.workoutRecords.filter(record => record.id !== id);
        this.state.workoutRecords = records;
        this.saveToStorage(this.STORAGE_KEYS.WORKOUT_RECORDS, records);
        this.notify();
    }
    
    updateUserProfile(updates) {
        const profile = { ...this.state.userProfile, ...updates };
        this.state.userProfile = profile;
        this.saveToStorage(this.STORAGE_KEYS.USER_PROFILE, profile);
        this.notify();
    }
    
    updateTreeState() {
        const recordCount = this.state.workoutRecords.length;
        this.state.treeState = {
            ...this.state.treeState,
            trunkThickness: Math.min(10, 1 + Math.floor(recordCount / 5)),
            branches: this.state.workoutRecords.slice(0, 20).map((record, index) => ({
                id: record.id,
                type: index === 0 ? 'primary' : 'secondary',
                length: Math.min(100, 30 + (record.duration || 30)),
                angle: Math.random() * 360,
                workoutId: record.id
            })),
            leaves: {
                density: Math.min(10, 1 + Math.floor(recordCount / 3)),
                type: 'growing'
            }
        };
        this.saveToStorage(this.STORAGE_KEYS.TREE_STATE, this.state.treeState);
    }
    
    completeOnboarding() {
        this.updateUserProfile({ hasCompletedOnboarding: true });
        this.setCurrentView('main');
    }
    
    getRecordsByFilter(typeFilter, timeFilter) {
        let records = [...this.state.workoutRecords];
        
        if (typeFilter !== 'all') {
            records = records.filter(r => r.type === typeFilter);
        }
        
        if (timeFilter !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            if (timeFilter === 'week') {
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                records = records.filter(r => new Date(r.date) >= weekAgo);
            } else if (timeFilter === 'month') {
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                records = records.filter(r => new Date(r.date) >= monthAgo);
            } else if (timeFilter === 'year') {
                const yearAgo = new Date(today);
                yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                records = records.filter(r => new Date(r.date) >= yearAgo);
            }
        }
        
        return records.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    getPeriodStats(period) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let startDate;
        
        if (period === 'week') {
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'month') {
            startDate = new Date(today);
            startDate.setMonth(startDate.getMonth() - 1);
        } else if (period === 'year') {
            startDate = new Date(today);
            startDate.setFullYear(startDate.getFullYear() - 1);
        }
        
        const records = this.state.workoutRecords.filter(r => new Date(r.date) >= startDate);
        
        return {
            count: records.length,
            distance: records.reduce((sum, r) => sum + (r.distance || 0), 0),
            duration: records.reduce((sum, r) => sum + (r.duration || 0), 0)
        };
    }
    
    getRadarData(period) {
        const stats = this.getPeriodStats(period);
        const previousStats = this.getPreviousPeriodStats(period);
        
        const normalize = (value, max) => Math.min(100, (value / max) * 100);
        
        const current = {
            cardioEndurance: normalize(stats.duration, 300),
            recoveryAbility: 70 + Math.random() * 20,
            trainingStability: normalize(stats.count, 10) * 8,
            intensityTolerance: normalize(stats.distance, 50),
            sustainability: normalize(stats.duration, 500)
        };
        
        const previous = {
            cardioEndurance: normalize(previousStats.duration, 300),
            recoveryAbility: 60 + Math.random() * 20,
            trainingStability: normalize(previousStats.count, 10) * 8,
            intensityTolerance: normalize(previousStats.distance, 50),
            sustainability: normalize(previousStats.duration, 500)
        };
        
        return { current, previous };
    }
    
    getPreviousPeriodStats(period) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let startDate, endDate;
        
        if (period === 'week') {
            endDate = new Date(today);
            endDate.setDate(endDate.getDate() - 7);
            startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'month') {
            endDate = new Date(today);
            endDate.setMonth(endDate.getMonth() - 1);
            startDate = new Date(endDate);
            startDate.setMonth(startDate.getMonth() - 1);
        } else if (period === 'year') {
            endDate = new Date(today);
            endDate.setFullYear(endDate.getFullYear() - 1);
            startDate = new Date(endDate);
            startDate.setFullYear(startDate.getFullYear() - 1);
        }
        
        const records = this.state.workoutRecords.filter(r => {
            const date = new Date(r.date);
            return date >= startDate && date < endDate;
        });
        
        return {
            count: records.length,
            distance: records.reduce((sum, r) => sum + (r.distance || 0), 0),
            duration: records.reduce((sum, r) => sum + (r.duration || 0), 0)
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
}

// ==================== UI Controller ====================
class UIController {
    constructor(state) {
        this.state = state;
        this.currentModal = null;
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.renderCurrentView();
        this.state.subscribe(() => this.renderCurrentView());
    }
    
    bindEvents() {
        // Welcome screen button
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.state.completeOnboarding();
            });
        }
        
        // Bottom navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // Vision options
        document.querySelectorAll('.vision-option').forEach(option => {
            option.addEventListener('click', () => {
                const vision = option.dataset.vision;
                this.selectVision(vision);
            });
        });
        
        // Record workout button
        const recordBtn = document.getElementById('record-workout-btn');
        if (recordBtn) {
            recordBtn.addEventListener('click', () => {
                this.showAddWorkoutDialog();
            });
        }
        
        // Upload screenshot button
        const uploadBtn = document.getElementById('upload-screenshot-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                this.showScreenshotUpload();
            });
        }
        
        // Tree FAB
        const treeFab = document.getElementById('tree-fab');
        if (treeFab) {
            treeFab.addEventListener('click', () => {
                this.switchTab('tree');
            });
        }
        
        // Period toggle
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const period = btn.dataset.period;
                this.switchPeriod(period);
            });
        });
        
        // Explain radar button
        const explainBtn = document.getElementById('explain-radar-btn');
        if (explainBtn) {
            explainBtn.addEventListener('click', () => {
                this.showRadarExplanation();
            });
        }
        
        // Filters
        const typeFilter = document.getElementById('type-filter');
        const timeFilter = document.getElementById('time-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.renderRecordsContent());
        }
        if (timeFilter) {
            timeFilter.addEventListener('change', () => this.renderRecordsContent());
        }
        
        // Save diary button
        const saveDiaryBtn = document.getElementById('save-diary-btn');
        if (saveDiaryBtn) {
            saveDiaryBtn.addEventListener('click', () => {
                this.saveDiaryAsImage();
            });
        }
    }
    
    renderCurrentView() {
        const { currentView, currentTab, userProfile } = this.state.state;
        
        // Switch between welcome and main
        const welcomeScreen = document.getElementById('welcome-screen');
        const mainScreen = document.getElementById('main-screen');
        
        if (userProfile.hasCompletedOnboarding || currentView === 'main') {
            welcomeScreen.classList.remove('active');
            mainScreen.classList.add('active');
            this.renderTabContent(currentTab);
        } else {
            welcomeScreen.classList.add('active');
            mainScreen.classList.remove('active');
        }
    }
    
    switchTab(tab) {
        this.state.setCurrentTab(tab);
        
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tab);
        });
        
        // Show/hide tab views
        document.querySelectorAll('.tab-view').forEach(view => {
            view.classList.remove('active');
            if (view.id === `${tab}-view`) {
                view.classList.add('active');
            }
        });
        
        this.renderTabContent(tab);
    }
    
    renderTabContent(tab) {
        // Show skeleton first
        const skeleton = document.getElementById(`${tab}-skeleton`);
        const content = document.getElementById(`${tab}-content`);
        
        if (skeleton && content) {
            skeleton.style.display = 'flex';
            content.style.display = 'none';
            
            // Simulate loading
            setTimeout(() => {
                skeleton.style.display = 'none';
                content.style.display = 'block';
                
                // Load specific tab content
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
            }, 600);
        }
    }
    
    renderTodayContent() {
        const todayDate = document.getElementById('today-date');
        if (todayDate) {
            const now = new Date();
            const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
            todayDate.textContent = now.toLocaleDateString('zh-CN', options);
        }
        
        // Render status card
        this.renderStatusCard();
        
        // Render load card
        this.renderLoadCard();
        
        // Check for today's workout
        this.checkTodaysWorkout();
    }
    
    renderStatusCard() {
        const hasDeviceData = this.state.state.workoutRecords.some(r => r.source === 'device');
        const records = this.state.state.workoutRecords;
        
        let recoveryStatus = 'good';
        let recoveryText = '恢复良好';
        let insight = '今天是进行训练的理想时机，身体状态不错。';
        
        if (records.length > 0) {
            const lastRecord = records[records.length - 1];
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
            statusSource.textContent = hasDeviceData ? '据设备数据' : '循迹估算';
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
        
        const typeNames = {
            running: '跑步',
            cycling: '骑行',
            swimming: '游泳',
            walking: '步行',
            other: '运动'
        };
        
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
            diarySummary.textContent = `今天你完成了 ${workout.duration} 分钟的${typeName}，距离 ${workout.distance?.toFixed(1) || 0} 公里。平均心率 ${workout.avgHeartRate || 120} 次/分钟。坚持运动，保持健康的生活方式！`;
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
        const radarData = this.state.getRadarData(period);
        const svg = document.getElementById('radar-svg');
        
        if (!svg) return;
        
        const centerX = 150;
        const centerY = 150;
        const maxRadius = 100;
        const labels = ['心肺耐力', '恢复能力', '训练稳定', '强度耐受', '可持续性'];
        const angles = labels.map((_, i) => (Math.PI * 2 * i) / labels.length - Math.PI / 2);
        
        let svgContent = '';
        
        // Draw background circles
        for (let i = 1; i <= 5; i++) {
            const radius = (maxRadius / 5) * i;
            svgContent += `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="#DDD5C8" stroke-width="1"/>`;
        }
        
        // Draw axes
        angles.forEach((angle, i) => {
            const x = centerX + Math.cos(angle) * maxRadius;
            const y = centerY + Math.sin(angle) * maxRadius;
            svgContent += `<line x1="${centerX}" y1="${centerY}" x2="${x}" y2="${y}" stroke="#DDD5C8" stroke-width="1"/>`;
        });
        
        // Draw labels
        angles.forEach((angle, i) => {
            const x = centerX + Math.cos(angle) * (maxRadius + 20);
            const y = centerY + Math.sin(angle) * (maxRadius + 20);
            svgContent += `<text x="${x}" y="${y}" text-anchor="middle" fill="#1B4332" font-size="11" dy="4">${labels[i]}</text>`;
        });
        
        // Draw previous period data
        const previousPoints = this.getRadarPoints(radarData.previous, centerX, centerY, maxRadius);
        svgContent += `<polygon points="${previousPoints}" fill="none" stroke="#9E9E9E" stroke-width="2" stroke-dasharray="4,4"/>`;
        
        // Draw current period data with animation
        const currentPoints = this.getRadarPoints(radarData.current, centerX, centerY, maxRadius);
        svgContent += `<polygon points="${currentPoints}" fill="rgba(27, 67, 50, 0.2)" stroke="#1B4332" stroke-width="2">
            <animate attributeName="opacity" from="0" to="1" dur="1s" fill="freeze"/>
        </polygon>`;
        
        // Draw data points
        const dataValues = Object.values(radarData.current);
        angles.forEach((angle, i) => {
            const value = dataValues[i];
            const radius = (value / 100) * maxRadius;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            svgContent += `<circle cx="${x}" cy="${y}" r="5" fill="#1B4332">
                <animate attributeName="r" from="0" to="5" dur="0.5s" begin="${i * 0.1}s" fill="freeze"/>
            </circle>`;
        });
        
        svg.innerHTML = svgContent;
    }
    
    getRadarPoints(data, centerX, centerY, maxRadius) {
        const values = Object.values(data);
        const angles = values.map((_, i) => (Math.PI * 2 * i) / values.length - Math.PI / 2);
        
        return values.map((value, i) => {
            const radius = (value / 100) * maxRadius;
            const x = centerX + Math.cos(angles[i]) * radius;
            const y = centerY + Math.sin(angles[i]) * radius;
            return `${x},${y}`;
        }).join(' ');
    }
    
    renderTrendChart() {
        const bodyAgeData = this.state.getBodyAgeEstimate();
        const trendValue = document.getElementById('trend-value');
        const trendChart = document.getElementById('trend-chart');
        
        if (trendValue) {
            trendValue.textContent = `年轻 ${bodyAgeData.difference} 岁`;
        }
        
        if (trendChart) {
            const months = 12;
            const dataPoints = [];
            let currentAge = bodyAgeData.actualAge;
            
            for (let i = months; i >= 0; i--) {
                const progress = (months - i) / months;
                const age = currentAge - (bodyAgeData.difference * progress * (0.8 + Math.random() * 0.4));
                dataPoints.push(age);
            }
            
            const chartWidth = trendChart.clientWidth || 300;
            const chartHeight = 120;
            const padding = 20;
            const maxAge = bodyAgeData.actualAge + 2;
            const minAge = bodyAgeData.actualAge - bodyAgeData.difference - 2;
            
            const points = dataPoints.map((age, i) => {
                const x = padding + (i / (dataPoints.length - 1)) * (chartWidth - padding * 2);
                const y = padding + (1 - (age - minAge) / (maxAge - minAge)) * (chartHeight - padding * 2);
                return `${x},${y}`;
            }).join(' ');
            
            const areaPoints = `${padding},${chartHeight - padding} ${points} ${chartWidth - padding},${chartHeight - padding}`;
            
            trendChart.innerHTML = `
                <svg width="100%" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}">
                    <defs>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#1B4332;stop-opacity:0.3"/>
                            <stop offset="100%" style="stop-color:#1B4332;stop-opacity:0"/>
                        </linearGradient>
                    </defs>
                    <polygon points="${areaPoints}" fill="url(#areaGradient)"/>
                    <polyline points="${points}" fill="none" stroke="#1B4332" stroke-width="2"/>
                    <circle cx="${padding + ((dataPoints.length - 1) / (dataPoints.length - 1)) * (chartWidth - padding * 2)}" cy="${padding + (1 - (dataPoints[dataPoints.length - 1] - minAge) / (maxAge - minAge)) * (chartHeight - padding * 2)}" r="6" fill="#E8A838"/>
                </svg>
            `;
        }
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
    
    showRadarExplanation() {
        const explanation = `
            <div class="detail-section">
                <h4>评分说明</h4>
                <div class="detail-content">
                    <p style="margin-bottom: 12px; font-size: 14px; color: var(--color-text-muted); line-height: 1.6;">
                        这些评分基于你的运动数据估算，仅供参考：
                    </p>
                    <div class="detail-grid" style="grid-template-columns: 1fr;">
                        <div class="detail-item" style="margin-bottom: 12px;">
                            <span class="detail-label">心肺耐力</span>
                            <span class="detail-value">基于运动时长和强度估算</span>
                        </div>
                        <div class="detail-item" style="margin-bottom: 12px;">
                            <span class="detail-label">恢复能力</span>
                            <span class="detail-value">基于运动频率和间隔估算</span>
                        </div>
                        <div class="detail-item" style="margin-bottom: 12px;">
                            <span class="detail-label">训练稳定性</span>
                            <span class="detail-value">基于运动规律程度估算</span>
                        </div>
                        <div class="detail-item" style="margin-bottom: 12px;">
                            <span class="detail-label">强度耐受</span>
                            <span class="detail-value">基于运动距离和心率估算</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">可持续性</span>
                            <span class="detail-value">基于长期运动习惯估算</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.showModal('算法说明', explanation, false);
    }
    
    renderRecordsContent() {
        const typeFilter = document.getElementById('type-filter')?.value || 'all';
        const timeFilter = document.getElementById('time-filter')?.value || 'all';
        const records = this.state.getRecordsByFilter(typeFilter, timeFilter);
        
        const timeline = document.getElementById('timeline');
        const emptyState = document.getElementById('empty-records');
        
        if (timeline && emptyState) {
            if (records.length === 0) {
                timeline.innerHTML = '';
                emptyState.style.display = 'block';
            } else {
                emptyState.style.display = 'none';
                this.renderTimeline(records, timeline);
            }
        }
    }
    
    renderTimeline(records, container) {
        const typeIcons = {
            running: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/></svg>`,
            cycling: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><polyline points="15 6 9 12 12 12"/><line x1="12" y1="12" x2="15" y2="17.5"/><line x1="9" y1="12" x2="5.5" y2="17.5"/><polyline points="16 8 18.5 5.5 21 8"/><line x1="18.5" y1="5.5" x2="18.5" y2="12"/></svg>`,
            swimming: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12c2-2 6-2 8 0s6 2 8 0"/><path d="M2 16c2-2 6-2 8 0s6 2 8 0"/><path d="M2 8c2-2 6-2 8 0s6 2 8 0"/><circle cx="5" cy="5" r="1"/></svg>`,
            walking: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/></svg>`,
            other: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`
        };
        
        const typeNames = {
            running: '跑步',
            cycling: '骑行',
            swimming: '游泳',
            walking: '步行',
            other: '运动'
        };
        
        let html = '';
        let lastDate = '';
        
        records.forEach(record => {
            const date = new Date(record.date);
            const dateStr = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
            
            if (dateStr !== lastDate) {
                html += `<div class="timeline-date-group">${dateStr}</div>`;
                lastDate = dateStr;
            }
            
            const recoveryLevel = Math.random() > 0.5 ? (Math.random() > 0.5 ? 'good' : 'moderate') : 'tired';
            const recoveryText = recoveryLevel === 'good' ? '恢复良好' : recoveryLevel === 'moderate' ? '适度疲劳' : '需要休息';
            
            html += `
                <div class="timeline-item">
                    <div class="timeline-dot ${record.type}">
                        ${typeIcons[record.type] || typeIcons.other}
                    </div>
                    <div class="timeline-card" onclick="ui.showRecordDetail('${record.id}')">
                        <div class="timeline-card-header">
                            <div class="timeline-type">${typeNames[record.type] || '运动'}</div>
                            <div class="timeline-actions">
                                <button class="timeline-action-btn" onclick="event.stopPropagation(); ui.editRecord('${record.id}')">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                </button>
                                <button class="timeline-action-btn" onclick="event.stopPropagation(); ui.confirmDeleteRecord('${record.id}')">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"/>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="timeline-meta">
                            <span>${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span class="recovery-badge ${recoveryLevel}">${recoveryText}</span>
                        </div>
                        <div class="timeline-stats">
                            <div class="timeline-stat">
                                <span class="timeline-stat-value">${record.duration}</span>
                                <span class="timeline-stat-label">分钟</span>
                            </div>
                            <div class="timeline-stat">
                                <span class="timeline-stat-value">${record.distance?.toFixed(1) || 0}</span>
                                <span class="timeline-stat-label">公里</span>
                            </div>
                            <div class="timeline-stat">
                                <span class="timeline-stat-value">${record.avgHeartRate || 120}</span>
                                <span class="timeline-stat-label">心率</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    showRecordDetail(id) {
        const record = this.state.state.workoutRecords.find(r => r.id === id);
        if (!record) return;
        
        const typeNames = {
            running: '跑步',
            cycling: '骑行',
            swimming: '游泳',
            walking: '步行',
            other: '运动'
        };
        
        const content = `
            <div class="detail-section">
                <h4>基本信息</h4>
                <div class="detail-content">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">运动类型</span>
                            <span class="detail-value">${typeNames[record.type] || '运动'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">日期</span>
                            <span class="detail-value">${new Date(record.date).toLocaleDateString('zh-CN')}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">时长</span>
                            <span class="detail-value">${record.duration} 分钟</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">距离</span>
                            <span class="detail-value">${record.distance?.toFixed(1) || 0} 公里</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">平均心率</span>
                            <span class="detail-value">${record.avgHeartRate || 120} 次/分钟</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">数据来源</span>
                            <span class="detail-value">${record.source === 'device' ? '设备数据' : '循迹估算'}</span>
                        </div>
                    </div>
                </div>
            </div>
            ${record.notes ? `
            <div class="detail-section">
                <h4>备注</h4>
                <div class="detail-content">
                    <p style="font-size: 14px; color: var(--color-text-muted); line-height: 1.6;">${record.notes}</p>
                </div>
            </div>
            ` : ''}
        `;
        
        this.showModal('运动详情', content, true, [
            { text: '编辑', type: 'primary', action: () => { this.closeModal(); this.editRecord(id); } },
            { text: '删除', type: 'danger', action: () => { this.closeModal(); this.confirmDeleteRecord(id); } }
        ]);
    }
    
    editRecord(id) {
        const record = this.state.state.workoutRecords.find(r => r.id === id);
        if (!record) return;
        
        const typeNames = {
            running: '跑步',
            cycling: '骑行',
            swimming: '游泳',
            walking: '步行',
            other: '其他'
        };
        
        const content = `
            <div class="detail-section">
                <div class="detail-content">
                    <div class="detail-grid" style="grid-template-columns: 1fr;">
                        <div class="detail-item">
                            <span class="detail-label">运动类型</span>
                            <select id="edit-type" class="filter-select" style="margin-top: 4px;">
                                ${Object.entries(typeNames).map(([key, value]) => 
                                    `<option value="${key}" ${record.type === key ? 'selected' : ''}>${value}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">时长（分钟）</span>
                            <input type="number" id="edit-duration" class="filter-select" style="margin-top: 4px;" value="${record.duration}">
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">距离（公里）</span>
                            <input type="number" id="edit-distance" class="filter-select" style="margin-top: 4px;" step="0.1" value="${record.distance || 0}">
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">平均心率</span>
                            <input type="number" id="edit-heartrate" class="filter-select" style="margin-top: 4px;" value="${record.avgHeartRate || 120}">
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">备注</span>
                            <textarea id="edit-notes" class="filter-select" style="margin-top: 4px; min-height: 80px; resize: vertical;">${record.notes || ''}</textarea>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.showModal('编辑记录', content, true, [
            { text: '取消', type: 'cancel', action: () => this.closeModal() },
            { text: '保存', type: 'primary', action: () => this.saveEditedRecord(id) }
        ]);
    }
    
    saveEditedRecord(id) {
        const type = document.getElementById('edit-type')?.value || 'other';
        const duration = parseInt(document.getElementById('edit-duration')?.value) || 30;
        const distance = parseFloat(document.getElementById('edit-distance')?.value) || 0;
        const avgHeartRate = parseInt(document.getElementById('edit-heartrate')?.value) || 120;
        const notes = document.getElementById('edit-notes')?.value || '';
        
        this.state.updateWorkoutRecord(id, { type, duration, distance, avgHeartRate, notes });
        this.closeModal();
    }
    
    confirmDeleteRecord(id) {
        const content = `
            <div class="detail-section">
                <div class="detail-content">
                    <p style="font-size: 14px; color: var(--color-text-muted); line-height: 1.6; text-align: center;">
                        确定要删除这条运动记录吗？此操作无法撤销。
                    </p>
                </div>
            </div>
        `;
        
        this.showModal('删除记录', content, true, [
            { text: '取消', type: 'cancel', action: () => this.closeModal() },
            { text: '删除', type: 'danger', action: () => { this.state.deleteWorkoutRecord(id); this.closeModal(); } }
        ]);
    }
    
    renderJourneyContent() {
        const visionCard = document.getElementById('vision-card');
        const journeyStats = document.getElementById('journey-stats');
        const { userProfile, workoutRecords } = this.state.state;
        
        if (visionCard && journeyStats) {
            if (userProfile.vision) {
                visionCard.style.display = 'none';
                journeyStats.style.display = 'grid';
                
                // Update stats
                const totalWorkouts = document.getElementById('total-workouts');
                const totalDistance = document.getElementById('total-distance');
                const streak = document.getElementById('streak');
                
                if (totalWorkouts) totalWorkouts.textContent = workoutRecords.length;
                if (totalDistance) totalDistance.textContent = Math.round(workoutRecords.reduce((sum, r) => sum + (r.distance || 0), 0) * 10) / 10;
                if (streak) streak.textContent = this.calculateStreak();
            } else {
                visionCard.style.display = 'block';
                journeyStats.style.display = 'none';
            }
        }
    }
    
    renderTreeContent() {
        // Tree content is static placeholder for now
        // Will be enhanced in later phases
    }
    
    selectVision(vision) {
        this.state.updateUserProfile({ vision });
        
        // Show confirmation
        const option = document.querySelector(`[data-vision="${vision}"]`);
        if (option) {
            option.style.background = 'var(--color-primary)';
            option.style.color = 'white';
        }
        
        setTimeout(() => {
            this.renderTabContent('journey');
        }, 300);
    }
    
    showAddWorkoutDialog() {
        const types = ['running', 'cycling', 'swimming', 'walking', 'other'];
        const typeNames = { running: '跑步', cycling: '骑行', swimming: '游泳', walking: '步行', other: '其他' };
        
        const typeIndex = Math.floor(Math.random() * types.length);
        const duration = 30 + Math.floor(Math.random() * 60);
        const distance = Math.round((2 + Math.random() * 10) * 10) / 10;
        
        const record = this.state.addWorkoutRecord({
            type: types[typeIndex],
            typeName: typeNames[types[typeIndex]],
            duration: duration,
            distance: distance,
            avgHeartRate: 120 + Math.floor(Math.random() * 40),
            notes: ''
        });
        
        // Show success feedback
        const btn = document.getElementById('record-workout-btn');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg><span>已记录！</span>';
            setTimeout(() => {
                btn.innerHTML = originalText;
            }, 2000);
        }
        
        // Trigger star animation
        this.triggerStarAnimation();
        
        // Refresh today content
        setTimeout(() => this.renderTodayContent(), 500);
    }
    
    showScreenshotUpload() {
        const content = `
            <div class="detail-section">
                <div class="detail-content" style="text-align: center;">
                    <div style="width: 80px; height: 80px; margin: 0 auto 16px; background: var(--color-warm-sand-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--color-primary);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 40px; height: 40px;">
                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM14.8 9.2L12 12 9.2 9.2c-.39-.39-1.02-.39-1.41 0l-3 3c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L11 12.4V17c0 .55.45 1 1 1s1-.45 1-1v-4.6l1.6 1.6c.39.39 1.02.39 1.41 0l3-3c.39-.39.39-1.02 0-1.41z"/>
                        </svg>
                    </div>
                    <p style="font-size: 14px; color: var(--color-text-muted); line-height: 1.6; margin-bottom: 16px;">
                        截图上传功能即将上线，敬请期待！
                    </p>
                    <p style="font-size: 12px; color: var(--color-text-muted); line-height: 1.6;">
                        未来你将可以上传运动手表截图，系统会自动解析数据。
                    </p>
                </div>
            </div>
        `;
        
        this.showModal('上传截图', content, true);
    }
    
    triggerStarAnimation() {
        const container = document.getElementById('stars-container');
        if (!container) return;
        
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const star = document.createElement('div');
                star.className = 'star';
                star.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                `;
                
                const startX = Math.random() * window.innerWidth;
                const startY = window.innerHeight;
                const endX = window.innerWidth - 60;
                const endY = 120;
                
                star.style.left = `${startX}px`;
                star.style.top = `${startY}px`;
                star.style.color = '#E8A838';
                
                container.appendChild(star);
                
                star.animate([
                    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                    { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0)`, opacity: 0 }
                ], {
                    duration: 1500,
                    easing: 'ease-out',
                    fill: 'forwards'
                }).onfinish = () => star.remove();
            }, i * 100);
        }
    }
    
    saveDiaryAsImage() {
        alert('保存日记卡片功能即将上线！');
    }
    
    showModal(title, content, showFooter = true, customButtons = null) {
        this.closeModal();
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" onclick="ui.closeModal()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">${content}</div>
                ${showFooter ? `
                <div class="modal-footer">
                    ${customButtons ? customButtons.map(btn => `
                        <button class="btn btn-${btn.type}" onclick="ui.handleModalAction(${customButtons.indexOf(btn)})">${btn.text}</button>
                    `).join('') : `
                        <button class="btn btn-cancel" onclick="ui.closeModal()">关闭</button>
                    `}
                </div>
                ` : ''}
            </div>
        `;
        
        document.body.appendChild(modal);
        this.currentModal = { element: modal, actions: customButtons };
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }
    
    handleModalAction(index) {
        if (this.currentModal?.actions?.[index]?.action) {
            this.currentModal.actions[index].action();
        }
    }
    
    closeModal() {
        if (this.currentModal?.element) {
            this.currentModal.element.classList.remove('active');
            setTimeout(() => {
                if (this.currentModal?.element?.parentNode) {
                    this.currentModal.element.remove();
                }
            }, 300);
        }
        this.currentModal = null;
    }
    
    calculateStreak() {
        const records = this.state.state.workoutRecords;
        if (records.length === 0) return 0;
        
        let streak = 1;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const dates = [...new Set(records.map(r => {
            const d = new Date(r.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
        }))].sort((a, b) => b - a);
        
        for (let i = 0; i < dates.length - 1; i++) {
            const current = new Date(dates[i]);
            const next = new Date(dates[i + 1]);
            const diffDays = (current - next) / (1000 * 60 * 60 * 24);
            
            if (diffDays === 1) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    // ==================== 旅途页面功能 ====================
    selectVision(vision) {
        if (vision === 'custom') {
            this.showCustomVisionModal();
            return;
        }
        
        const visionTexts = {
            'climb': '陪孩子爬山',
            'marathon': '完成马拉松',
            'travel': '70岁独立旅行',
            'energy': '保持充沛精力'
        };
        
        this.state.updateUserProfile({ vision: visionTexts[vision] });
        this.renderJourneyContent();
    }
    
    showCustomVisionModal() {
        const modal = document.getElementById('custom-vision-modal');
        if (modal) {
            modal.style.display = 'flex';
            const input = document.getElementById('custom-vision-input');
            if (input) input.focus();
        }
    }
    
    saveCustomVision() {
        const input = document.getElementById('custom-vision-input');
        const visionText = input?.value?.trim();
        if (visionText) {
            this.state.updateUserProfile({ vision: visionText });
            this.hideCustomVisionModal();
            this.renderJourneyContent();
        }
    }
    
    hideCustomVisionModal() {
        const modal = document.getElementById('custom-vision-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    changeVision() {
        this.state.updateUserProfile({ vision: null });
        this.renderJourneyContent();
    }
    
    renderJourneyContent() {
        const visionCard = document.getElementById('vision-card');
        const journeyStats = document.getElementById('journey-stats');
        const { userProfile, workoutRecords } = this.state.state;
        
        const visionDisplay = document.getElementById('vision-display-value');
        const totalWorkouts = document.getElementById('total-workouts');
        const totalDistance = document.getElementById('total-distance');
        const streak = document.getElementById('streak');
        const totalCalories = document.getElementById('total-calories');
        
        if (userProfile.vision) {
            visionCard.style.display = 'none';
            journeyStats.style.display = 'block';
            
            if (visionDisplay) visionDisplay.textContent = userProfile.vision;
            if (totalWorkouts) totalWorkouts.textContent = workoutRecords.length;
            
            const totalDist = workoutRecords.reduce((sum, r) => sum + (r.distance || 0), 0);
            if (totalDistance) totalDistance.textContent = totalDist.toFixed(1);
            
            if (streak) streak.textContent = this.calculateStreak();
            
            const calories = workoutRecords.reduce((sum, r) => sum + (r.duration || 30) * 8, 0);
            if (totalCalories) totalCalories.textContent = calories;
            
            this.renderBodyAgeChart();
            this.renderHeatmap();
            this.renderTrendReport();
        } else {
            visionCard.style.display = 'block';
            journeyStats.style.display = 'none';
        }
    }
    
    renderBodyAgeChart() {
        const container = document.getElementById('body-age-chart');
        if (!container) return;
        
        const bodyAgeData = this.state.getBodyAgeEstimate();
        const months = 12;
        const dataPoints = [];
        let currentAge = bodyAgeData.actualAge;
        
        for (let i = months; i >= 0; i--) {
            const progress = (months - i) / months;
            const age = currentAge - (bodyAgeData.difference * progress * (0.8 + Math.random() * 0.4));
            dataPoints.push(age);
        }
        
        const chartWidth = container.clientWidth || 300;
        const chartHeight = 180;
        const padding = 30;
        const maxAge = bodyAgeData.actualAge + 2;
        const minAge = bodyAgeData.actualAge - bodyAgeData.difference - 2;
        
        const points = dataPoints.map((age, i) => {
            const x = padding + (i / (dataPoints.length - 1)) * (chartWidth - padding * 2);
            const y = padding + (1 - (age - minAge) / (maxAge - minAge)) * (chartHeight - padding * 2);
            return `${x},${y}`;
        }).join(' ');
        
        const areaPoints = `${padding},${chartHeight - padding} ${points} ${chartWidth - padding},${chartHeight - padding}`;
        
        container.innerHTML = `
            <svg width="100%" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}">
                <defs>
                    <linearGradient id="bodyAgeAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#1B4332;stop-opacity:0.3"/>
                        <stop offset="100%" style="stop-color:#1B4332;stop-opacity:0"/>
                    </linearGradient>
                </defs>
                <!-- Grid lines -->
                ${[0.25, 0.5, 0.75].map(pct => {
                    const y = padding + pct * (chartHeight - padding * 2);
                    return `<line x1="${padding}" y1="${y}" x2="${chartWidth - padding}" y2="${y}" stroke="#DDD5C8" stroke-width="1" stroke-dasharray="4"/>`;
                }).join('')}
                <polygon points="${areaPoints}" fill="url(#bodyAgeAreaGradient)"/>
                <polyline points="${points}" fill="none" stroke="#1B4332" stroke-width="2"/>
                <circle cx="${padding + ((dataPoints.length - 1) / (dataPoints.length - 1)) * (chartWidth - padding * 2)}" cy="${padding + (1 - (dataPoints[dataPoints.length - 1] - minAge) / (maxAge - minAge)) * (chartHeight - padding * 2)}" r="6" fill="#E8A838"/>
                <!-- Y-axis labels -->
                <text x="${padding - 5}" y="${padding}" text-anchor="end" fill="#757575" font-size="11">${maxAge.toFixed(0)}</text>
                <text x="${padding - 5}" y="${chartHeight - padding}" text-anchor="end" fill="#757575" font-size="11">${minAge.toFixed(0)}</text>
            </svg>
        `;
    }
    
    renderHeatmap() {
        const container = document.getElementById('heatmap-container');
        if (!container) return;
        
        const records = this.state.state.workoutRecords;
        const weeks = 52;
        const days = 7;
        const today = new Date();
        
        const activityDates = new Set(records.map(r => {
            const d = new Date(r.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
        }));
        
        let html = '<div class="heatmap-grid">';
        
        for (let w = weeks - 1; w >= 0; w--) {
            for (let d = 0; d < days; d++) {
                const date = new Date(today);
                date.setDate(date.getDate() - (w * 7 + d));
                date.setHours(0, 0, 0, 0);
                
                let level = 0;
                if (activityDates.has(date.getTime())) {
                    level = Math.min(4, 1 + Math.floor(Math.random() * 3));
                }
                
                html += `<div class="heatmap-cell ${level > 0 ? `level-${level}` : ''}" title="${date.toLocaleDateString('zh-CN')}"></div>`;
            }
        }
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    renderTrendReport() {
        const records = this.state.state.workoutRecords;
        if (records.length === 0) return;
        
        const reportFrequency = document.getElementById('report-frequency');
        const reportDuration = document.getElementById('report-duration');
        const reportTime = document.getElementById('report-time');
        const reportInsight = document.getElementById('report-insight');
        
        const weeklyCount = records.length > 7 ? Math.round(records.length / (Math.max(1, (records.length / 7)))) : records.length;
        const avgDuration = Math.round(records.reduce((sum, r) => sum + (r.duration || 30), 0) / records.length);
        
        if (reportFrequency) reportFrequency.textContent = `每周 ${weeklyCount} 次`;
        if (reportDuration) reportDuration.textContent = `${avgDuration} 分钟`;
        if (reportTime) reportTime.textContent = '早晨 7-9 点';
        
        if (reportInsight) {
            const insights = [
                '坚持运动，身体状态持续改善中！继续保持，十年愿景一定能够实现。',
                '你的运动习惯越来越好，身体正在发生积极变化，继续加油！',
                '每一次运动都是对未来的投资，坚持下去，你会感谢现在的自己。',
                '运动频率和时长都很稳定，这是长期健康的良好基础。'
            ];
            reportInsight.textContent = insights[Math.floor(Math.random() * insights.length)];
        }
    }
    
    shareJourney() {
        alert('正在生成"我的循迹之旅"分享海报...');
    }
    
    // ==================== 生命树页面功能 ====================
    renderTreeContent() {
        this.renderLifeTree();
        this.updateTreeInfo();
        this.setupTreeInteractions();
    }
    
    renderLifeTree(progress = 1.0) {
        const svg = document.getElementById('life-tree-svg');
        if (!svg) return;
        
        const records = this.state.state.workoutRecords;
        const recordCount = Math.floor(records.length * progress);
        const displayRecords = records.slice(0, recordCount);
        
        let svgContent = svg.innerHTML.split('</defs>')[0] + '</defs>';
        
        const trunkThickness = Math.min(20, 8 + Math.floor(recordCount / 3));
        svgContent += `<path class="tree-branch" d="M 200 480 L 200 ${380 - Math.min(80, recordCount * 2)}" stroke-width="${trunkThickness}"/>`;
        
        const branchCount = Math.min(12, 2 + Math.floor(recordCount / 2));
        const branches = [];
        
        for (let i = 0; i < branchCount; i++) {
            const isPrimary = i < 4;
            const startY = 360 - (i * 25);
            const side = i % 2 === 0 ? 1 : -1;
            const branchLength = isPrimary ? 60 + Math.random() * 40 : 35 + Math.random() * 25;
            const angle = (isPrimary ? 30 + Math.random() * 25 : 40 + Math.random() * 30) * (Math.PI / 180);
            const startX = 200 + side * (i > 1 ? 15 : 0);
            const endX = startX + side * Math.sin(angle) * branchLength;
            const endY = startY - Math.cos(angle) * branchLength;
            
            branches.push({ startX, startY, endX, endY, recordIndex: i });
            
            svgContent += `<path class="tree-branch tree-node" d="M ${startX} ${startY} L ${endX} ${endY}" stroke-width="${isPrimary ? 6 : 3}" data-record="${i}"/>`;
            
            const leafCount = Math.floor(Math.random() * 5) + 3;
            for (let j = 0; j < leafCount; j++) {
                const t = Math.random();
                const lx = startX + (endX - startX) * t;
                const ly = startY + (endY - startY) * t;
                const leafSize = 6 + Math.random() * 8;
                const leafAngle = Math.random() * Math.PI * 2;
                svgContent += `<ellipse class="tree-leaf" cx="${lx}" cy="${ly}" rx="${leafSize}" ry="${leafSize * 0.6}" transform="rotate(${leafAngle * 180 / Math.PI} ${lx} ${ly})"/>`;
            }
        }
        
        if (recordCount >= 5) {
            const fruitCount = Math.min(5, Math.floor(recordCount / 5));
            for (let i = 0; i < fruitCount; i++) {
                const branch = branches[i % branches.length];
                const t = 0.6 + Math.random() * 0.3;
                const fx = branch.startX + (branch.endX - branch.startX) * t;
                const fy = branch.startY + (branch.endY - branch.startY) * t;
                svgContent += `<circle class="tree-fruit tree-node" cx="${fx}" cy="${fy - 10}" r="8" data-fruit="${i}"/>`;
            }
        }
        
        if (recordCount >= 3) {
            const starCount = Math.min(8, Math.floor(recordCount / 3));
            for (let i = 0; i < starCount; i++) {
                const sx = 80 + Math.random() * 240;
                const sy = 80 + Math.random() * 200;
                svgContent += this.createStar(sx, sy, 6, i);
            }
        }
        
        svg.innerHTML = svgContent;
    }
    
    createStar(cx, cy, r, index) {
        const points = [];
        for (let i = 0; i < 10; i++) {
            const radius = i % 2 === 0 ? r : r / 2;
            const angle = (i * Math.PI / 5) - Math.PI / 2;
            points.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
        }
        return `<polygon class="tree-star tree-node" points="${points.join(' ')}" data-star="${index}"/>`;
    }
    
    updateTreeInfo() {
        const records = this.state.state.workoutRecords;
        const recordCount = records.length;
        
        const trunkThickness = document.getElementById('trunk-thickness');
        const branchCount = document.getElementById('branch-count');
        const leafDensity = document.getElementById('leaf-density');
        
        if (trunkThickness) {
            const levels = ['基础', '成长', '茁壮', '茂盛', '参天'];
            const level = Math.min(4, Math.floor(recordCount / 10));
            trunkThickness.textContent = levels[level];
        }
        
        if (branchCount) {
            branchCount.textContent = Math.min(12, 2 + Math.floor(recordCount / 2));
        }
        
        if (leafDensity) {
            const densities = ['稀疏', '中等', '茂密', '浓郁'];
            const density = Math.min(3, Math.floor(recordCount / 5));
            leafDensity.textContent = densities[density];
        }
    }
    
    setupTreeInteractions() {
        const container = document.getElementById('tree-svg-container');
        const slider = document.getElementById('timeline-slider');
        const helpBtn = document.getElementById('help-btn');
        const shareBtn = document.getElementById('share-tree-btn');
        
        if (slider) {
            slider.addEventListener('input', (e) => {
                const progress = e.target.value / 100;
                this.renderLifeTree(progress);
            });
        }
        
        if (helpBtn) {
            helpBtn.addEventListener('click', () => this.showHelpModal());
        }
        
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareTree());
        }
        
        if (container) {
            container.addEventListener('click', (e) => {
                const node = e.target.closest('.tree-node');
                if (node) {
                    this.handleTreeNodeClick(node);
                }
            });
        }
        
        let scale = 1;
        let rotation = 0;
        let isDragging = false;
        let startX, startY;
        
        if (container) {
            container.addEventListener('wheel', (e) => {
                e.preventDefault();
                scale = Math.max(0.5, Math.min(2, scale - e.deltaY * 0.001));
                container.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
            });
            
            container.addEventListener('mousedown', (e) => {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                const deltaX = e.clientX - startX;
                rotation += deltaX * 0.5;
                startX = e.clientX;
                container.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
            });
            
            document.addEventListener('mouseup', () => {
                isDragging = false;
            });
            
            container.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) {
                    isDragging = true;
                    startX = e.touches[0].clientX;
                }
            });
            
            container.addEventListener('touchmove', (e) => {
                if (isDragging && e.touches.length === 1) {
                    const deltaX = e.touches[0].clientX - startX;
                    rotation += deltaX * 0.5;
                    startX = e.touches[0].clientX;
                    container.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
                }
            });
            
            container.addEventListener('touchend', () => {
                isDragging = false;
            });
        }
    }
    
    handleTreeNodeClick(node) {
        const recordIndex = node.dataset.record;
        const fruitIndex = node.dataset.fruit;
        const starIndex = node.dataset.star;
        
        if (recordIndex !== undefined) {
            const records = this.state.state.workoutRecords;
            const record = records[parseInt(recordIndex)];
            if (record) {
                this.showRecordDetail(record.id);
            }
        } else if (fruitIndex !== undefined) {
            this.showModal('收获', `<div style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 16px;">🏆</div>
                <p style="color: var(--color-text-muted);">这是你坚持运动的见证！<br>每一颗果实都代表你的努力。</p>
            </div>`);
        } else if (starIndex !== undefined) {
            this.showModal('星星', `<div style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 16px;">⭐</div>
                <p style="color: var(--color-text-muted);">你的每一次高质量运动<br>都会点亮一颗星星！</p>
            </div>`);
        }
    }
    
    showHelpModal() {
        const helpContent = `
            <div style="padding: 10px 0;">
                <div style="margin-bottom: 20px;">
                    <h4 style="color: var(--color-primary); margin-bottom: 8px;">🌳 树干</h4>
                    <p style="font-size: 14px; color: var(--color-text-muted);">随着你使用的时间增长，树干会变得越来越粗壮</p>
                </div>
                <div style="margin-bottom: 20px;">
                    <h4 style="color: var(--color-primary); margin-bottom: 8px;">🌿 树枝</h4>
                    <p style="font-size: 14px; color: var(--color-text-muted);">每次运动都会长出新的枝条，点击可以查看对应记录</p>
                </div>
                <div style="margin-bottom: 20px;">
                    <h4 style="color: var(--color-primary); margin-bottom: 8px;">🍃 树叶</h4>
                    <p style="font-size: 14px; color: var(--color-text-muted);">运动越多越规律，树叶就越茂密</p>
                </div>
                <div style="margin-bottom: 20px;">
                    <h4 style="color: var(--color-primary); margin-bottom: 8px;">🍎 果实</h4>
                    <p style="font-size: 14px; color: var(--color-text-muted);">达成特殊成就时会长出果实</p>
                </div>
                <div>
                    <h4 style="color: var(--color-primary); margin-bottom: 8px;">✨ 星星</h4>
                    <p style="font-size: 14px; color: var(--color-text-muted);">高质量的运动可以获得星星</p>
                </div>
            </div>
        `;
        this.showModal('如何成长', helpContent);
    }
    
    shareTree() {
        alert('正在生成生命树分享海报...');
    }
    
    bindAdditionalEvents() {
        const customVisionOption = document.querySelector('[data-vision="custom"]');
        const cancelBtn = document.getElementById('cancel-custom-vision');
        const saveBtn = document.getElementById('save-custom-vision');
        const changeBtn = document.getElementById('change-vision-btn');
        const shareJourneyBtn = document.getElementById('share-journey-btn');
        
        if (customVisionOption) {
            customVisionOption.addEventListener('click', () => this.selectVision('custom'));
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideCustomVisionModal());
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveCustomVision());
        }
        
        if (changeBtn) {
            changeBtn.addEventListener('click', () => this.changeVision());
        }
        
        if (shareJourneyBtn) {
            shareJourneyBtn.addEventListener('click', () => this.shareJourney());
        }
        
        const customInput = document.getElementById('custom-vision-input');
        if (customInput) {
            customInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveCustomVision();
                }
            });
        }
    }
}

// ==================== Initialize App ====================
let appState;
let ui;

document.addEventListener('DOMContentLoaded', () => {
    appState = new AppState();
    ui = new UIController(appState);
    
    setTimeout(() => {
        ui.bindAdditionalEvents();
    }, 100);
    
    if (appState.state.userProfile.hasCompletedOnboarding) {
        appState.setCurrentView('main');
    }
});
