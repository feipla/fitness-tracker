/**
 * 循迹应用 - 记录列表模块
 * 负责运动记录的显示、编辑、删除
 */

class RecordsController {
    constructor() {
        this.elements = {};
        this.workouts = [];
        this.init();
    }

    init() {
        console.log('[循迹] 记录模块初始化...');
        
        this.bindElements();
        this.loadWorkouts();
        this.bindEvents();
        this.render();
        
        console.log('[循迹] 记录模块就绪 ✅');
    }

    bindElements() {
        this.elements = {
            recordsList: document.getElementById('recordsList'),
            recordsCount: document.getElementById('recordsCount'),
            emptyState: document.getElementById('emptyState')
        };
    }

    bindEvents() {
        // 监听运动记录保存事件
        document.addEventListener('workout:saved', () => {
            console.log('[循迹] 收到记录保存事件，刷新列表');
            this.loadWorkouts();
            this.render();
        });

        // 监听应用状态变化
        document.addEventListener('app:ready', () => {
            this.loadWorkouts();
            this.render();
        });
    }

    loadWorkouts() {
        if (window.app && window.app.state) {
            this.workouts = window.app.state.getWorkouts();
            console.log('[循迹] 加载了', this.workouts.length, '条运动记录');
        } else {
            console.warn('[循迹] 应用状态未就绪，无法加载记录');
        }
    }

    render() {
        if (this.workouts.length === 0) {
            this.renderEmptyState();
        } else {
            this.renderRecords();
        }
        this.updateCount();
    }

    renderEmptyState() {
        this.elements.recordsList.innerHTML = '';
        this.elements.recordsList.appendChild(this.elements.emptyState);
        this.elements.emptyState.style.display = 'block';
    }

    renderRecords() {
        this.elements.recordsList.innerHTML = '';
        
        this.workouts.forEach(workout => {
            const card = this.createRecordCard(workout);
            this.elements.recordsList.appendChild(card);
        });
    }

    createRecordCard(workout) {
        const card = document.createElement('div');
        card.className = 'record-card';
        card.dataset.id = workout.id;
        
        const typeIcons = {
            running: '🏃',
            cycling: '🚴',
            swimming: '🏊',
            walking: '🚶',
            yoga: '🧘',
            strength: '💪',
            other: '🎯'
        };
        
        const typeNames = {
            running: '跑步',
            cycling: '骑行',
            swimming: '游泳',
            walking: '徒步',
            yoga: '瑜伽',
            strength: '力量训练',
            other: '其他'
        };
        
        const icon = typeIcons[workout.type] || '🎯';
        const typeName = typeNames[workout.type] || '其他';
        
        let detailsHTML = '';
        
        if (workout.distance) {
            detailsHTML += `
                <div class="record-detail">
                    <div class="detail-value">${workout.distance} km</div>
                    <div class="detail-label">距离</div>
                </div>
            `;
        }
        
        if (workout.duration) {
            detailsHTML += `
                <div class="record-detail">
                    <div class="detail-value">${workout.duration} 分</div>
                    <div class="detail-label">时长</div>
                </div>
            `;
        }
        
        if (workout.heartRate) {
            detailsHTML += `
                <div class="record-detail">
                    <div class="detail-value">${workout.heartRate} bpm</div>
                    <div class="detail-label">心率</div>
                </div>
            `;
        }
        
        let notesHTML = '';
        if (workout.notes) {
            notesHTML = `<p class="record-notes">${this.escapeHtml(workout.notes)}</p>`;
        }
        
        const dateDisplay = this.formatDate(workout.date);
        
        card.innerHTML = `
            <div class="record-header">
                <div>
                    <div class="record-icon">${icon}</div>
                    <div class="record-type">${typeName}</div>
                </div>
                <div class="record-actions">
                    <button class="btn btn-secondary btn-small" data-action="edit" data-id="${workout.id}">编辑</button>
                    <button class="btn btn-secondary btn-small" data-action="delete" data-id="${workout.id}">删除</button>
                </div>
            </div>
            <div class="record-details">
                ${detailsHTML}
            </div>
            ${notesHTML}
            <div class="record-meta">
                <span class="record-date">${dateDisplay}</span>
            </div>
        `;
        
        // 绑定按钮事件
        const editBtn = card.querySelector('[data-action="edit"]');
        const deleteBtn = card.querySelector('[data-action="delete"]');
        
        editBtn.addEventListener('click', () => this.editRecord(workout.id));
        deleteBtn.addEventListener('click', () => this.deleteRecord(workout.id));
        
        return card;
    }

    updateCount() {
        const count = this.workouts.length;
        this.elements.recordsCount.textContent = `${count} 条`;
    }

    editRecord(id) {
        const workout = this.workouts.find(w => w.id === id);
        if (!workout) {
            window.showToast('找不到该记录', 'error');
            return;
        }
        
        // 这里可以实现编辑功能
        window.showToast('编辑功能即将上线', 'info');
    }

    deleteRecord(id) {
        if (!confirm('确定要删除这条运动记录吗？')) {
            return;
        }
        
        if (window.app && window.app.state) {
            const success = window.app.state.deleteWorkout(id);
            if (success) {
                window.showToast('记录已删除', 'success');
                this.loadWorkouts();
                this.render();
            } else {
                window.showToast('删除失败', 'error');
            }
        }
    }

    formatDate(dateStr) {
        if (!dateStr) return '';
        
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const workoutDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            
            const diffDays = Math.floor((today - workoutDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
                return '今天';
            } else if (diffDays === 1) {
                return '昨天';
            } else if (diffDays < 7) {
                return `${diffDays} 天前`;
            } else {
                return date.toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            }
        } catch (e) {
            return dateStr;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!window.recordsController && document.getElementById('recordsList')) {
            window.recordsController = new RecordsController();
        }
    }, 200);
});

// 如果有 app 就绪事件，也监听
document.addEventListener('app:ready', () => {
    if (!window.recordsController && document.getElementById('recordsList')) {
        window.recordsController = new RecordsController();
    }
});
