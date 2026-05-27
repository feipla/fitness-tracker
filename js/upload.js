/**
 * 循迹应用 - 上传与解析模块
 * 负责图片上传、预览、模拟解析
 */

class UploadController {
    constructor() {
        this.currentFile = null;
        this.elements = {};
        this.parsingSteps = [
            '正在识别运动数据...',
            '正在提取距离和时长...',
            '正在分析心率...',
            '正在生成运动报告...'
        ];
        
        this.init();
    }

    init() {
        console.log('[循迹] 上传模块初始化...');
        
        this.bindElements();
        this.bindEvents();
        
        console.log('[循迹] 上传模块就绪 ✅');
    }

    bindElements() {
        this.elements = {
            uploadArea: document.getElementById('uploadArea'),
            fileInput: document.getElementById('fileInput'),
            uploadPrompt: document.getElementById('uploadPrompt'),
            previewSection: document.getElementById('previewSection'),
            previewImage: document.getElementById('previewImage'),
            removeBtn: document.getElementById('removeBtn'),
            parseBtn: document.getElementById('parseBtn'),
            parsingSection: document.getElementById('parsingSection'),
            parsingText: document.getElementById('parsingText'),
            confirmSection: document.getElementById('confirmSection'),
            confirmForm: document.getElementById('confirmForm'),
            workoutType: document.getElementById('workoutType'),
            workoutDistance: document.getElementById('workoutDistance'),
            workoutDuration: document.getElementById('workoutDuration'),
            workoutHeartRate: document.getElementById('workoutHeartRate'),
            workoutNotes: document.getElementById('workoutNotes'),
            cancelBtn: document.getElementById('cancelBtn')
        };
    }

    bindEvents() {
        // 上传区域点击
        this.elements.uploadArea.addEventListener('click', (e) => {
            if (!this.elements.confirmSection.style.display || 
                this.elements.confirmSection.style.display === 'none') {
                this.elements.fileInput.click();
            }
        });

        // 拖拽事件
        this.elements.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.uploadArea.classList.add('dragover');
        });

        this.elements.uploadArea.addEventListener('dragleave', () => {
            this.elements.uploadArea.classList.remove('dragover');
        });

        this.elements.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });

        // 文件选择
        this.elements.fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });

        // 重新选择
        this.elements.removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.resetToUpload();
        });

        // 开始解析
        this.elements.parseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.startParsing();
        });

        // 取消确认
        this.elements.cancelBtn.addEventListener('click', () => {
            this.resetToUpload();
        });

        // 保存表单
        this.elements.confirmForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveWorkout();
        });
    }

    handleFileSelect(file) {
        console.log('[循迹] 收到文件:', file.name);

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            window.showToast('请上传图片文件', 'error');
            return;
        }

        // 验证文件大小 (限制 10MB)
        if (file.size > 10 * 1024 * 1024) {
            window.showToast('图片大小不能超过 10MB', 'error');
            return;
        }

        this.currentFile = file;

        // 显示预览
        const reader = new FileReader();
        reader.onload = (e) => {
            this.elements.previewImage.src = e.target.result;
            this.elements.uploadPrompt.style.display = 'none';
            this.elements.previewSection.style.display = 'block';
            window.showToast('图片已选择');
            console.log('[循迹] 预览图片已加载');
        };
        reader.onerror = () => {
            window.showToast('图片加载失败', 'error');
        };
        reader.readAsDataURL(file);
    }

    async startParsing() {
        console.log('[循迹] 开始解析...');

        this.elements.previewSection.style.display = 'none';
        this.elements.parsingSection.style.display = 'block';

        // 模拟解析过程
        for (let i = 0; i < this.parsingSteps.length; i++) {
            this.elements.parsingText.textContent = this.parsingSteps[i];
            await this.sleep(600);
        }

        // 生成模拟数据
        this.fillMockData();

        this.elements.parsingSection.style.display = 'none';
        this.elements.confirmSection.style.display = 'block';
        console.log('[循迹] 解析完成 ✅');
        window.showToast('解析成功，请确认信息');
    }

    fillMockData() {
        // 随机运动类型
        const types = ['running', 'cycling', 'swimming', 'walking'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        this.elements.workoutType.value = randomType;

        // 随机运动数据
        this.elements.workoutDistance.value = (Math.random() * 15 + 1).toFixed(1);
        this.elements.workoutDuration.value = Math.floor(Math.random() * 120 + 20);
        this.elements.workoutHeartRate.value = Math.floor(Math.random() * 60 + 110);
        
        // 日期设为今天
        const today = new Date().toISOString().split('T')[0];
        if (!this.elements.workoutDate) {
            // 动态添加日期字段
            const dateInput = document.createElement('input');
            dateInput.type = 'hidden';
            dateInput.id = 'workoutDate';
            dateInput.value = today;
            this.elements.confirmForm.appendChild(dateInput);
        }
    }

    saveWorkout() {
        console.log('[循迹] 正在保存运动记录...');

        const workoutData = {
            date: document.getElementById('workoutDate')?.value || new Date().toISOString().split('T')[0],
            type: this.elements.workoutType.value,
            distance: parseFloat(this.elements.workoutDistance.value) || 0,
            duration: parseInt(this.elements.workoutDuration.value) || 0,
            heartRate: parseInt(this.elements.workoutHeartRate.value) || null,
            notes: this.elements.workoutNotes.value.trim() || null
        };

        if (!workoutData.duration) {
            window.showToast('请填写运动时长', 'warning');
            return;
        }

        // 保存到状态
        if (window.app && window.app.state) {
            const saved = window.app.state.addWorkout(workoutData);
            if (saved) {
                window.showToast('运动记录已保存 ✅', 'success');
                this.resetToUpload();
                
                // 通知记录列表更新
                const event = new CustomEvent('workout:saved', { detail: saved });
                document.dispatchEvent(event);
            } else {
                window.showToast('保存失败，请重试', 'error');
            }
        } else {
            window.showToast('应用状态未就绪', 'error');
        }
    }

    resetToUpload() {
        this.currentFile = null;
        this.elements.fileInput.value = '';
        this.elements.uploadPrompt.style.display = 'block';
        this.elements.previewSection.style.display = 'none';
        this.elements.parsingSection.style.display = 'none';
        this.elements.confirmSection.style.display = 'none';
        
        // 清空表单
        this.elements.confirmForm.reset();
        
        console.log('[循迹] 已重置为上传状态');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 等待 DOM 就绪
document.addEventListener('app:ready', () => {
    if (!window.uploadController) {
        window.uploadController = new UploadController();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // 延迟初始化，等 app 先启动
    setTimeout(() => {
        if (!window.uploadController && document.getElementById('uploadArea')) {
            window.uploadController = new UploadController();
        }
    }, 100);
});
