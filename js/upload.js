/**
 * 循迹应用 - 上传与分析模块
 * 负责图片上传、OCR 识别、大模型分析、结果展示
 */

class AnalysisController {
    constructor() {
        this.currentFile = null;
        this.currentAnalysis = null; // 存储当前分析结果
        this.elements = {};
        this.init();
    }

    init() {
        console.log('[循迹] 分析模块初始化...');
        this.bindElements();
        this.bindEvents();
        console.log('[循迹] 分析模块就绪 ✅');
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
            
            analyzingSection: document.getElementById('analyzingSection'),
            analysisResultSection: document.getElementById('analysisResultSection'),
            
            stepOcr: document.getElementById('step-ocr'),
            stepExtract: document.getElementById('step-extract'),
            stepAnalyze: document.getElementById('step-analyze'),
            
            metricsDisplay: document.getElementById('metricsDisplay'),
            interpretationText: document.getElementById('interpretationText'),
            recommendationText: document.getElementById('recommendationText'),
            
            retryBtn: document.getElementById('retryBtn'),
            saveResultBtn: document.getElementById('saveResultBtn')
        };
    }

    bindEvents() {
        // 上传区域点击
        this.elements.uploadArea.addEventListener('click', (e) => {
            if (!this.elements.analysisResultSection.style.display || 
                this.elements.analysisResultSection.style.display === 'none') {
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

        // 开始分析
        this.elements.parseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.startAnalysis();
        });

        // 重新分析
        this.elements.retryBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.resetToUpload();
        });

        // 保存结果
        this.elements.saveResultBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.saveResult();
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
            window.showToast('图片已选择，点击开始分析');
            console.log('[循迹] 预览图片已加载');
        };
        reader.onerror = () => {
            window.showToast('图片加载失败', 'error');
        };
        reader.readAsDataURL(file);
    }

    async startAnalysis() {
        console.log('[循迹] 开始分析流程...');
        
        // 隐藏其他区域，显示分析中
        this.elements.previewSection.style.display = 'none';
        this.elements.analyzingSection.style.display = 'block';
        
        // 重置步骤状态
        this.resetSteps();
        
        try {
            // 步骤 1: OCR 识别文字
            await this.performOCR();
            
            // 步骤 2: 提取健康指标
            const metrics = await this.extractMetrics();
            
            // 步骤 3: 大模型分析与解读
            const analysis = await this.analyzeWithLLM(metrics);
            
            // 保存当前分析结果
            this.currentAnalysis = {
                metrics: metrics,
                interpretation: analysis.interpretation,
                recommendation: analysis.recommendation,
                timestamp: new Date().toISOString()
            };
            
            // 显示结果
            this.showAnalysisResult(this.currentAnalysis);
            
        } catch (error) {
            console.error('[循迹] 分析失败:', error);
            window.showToast('分析失败，请重试', 'error');
            this.resetToUpload();
        }
    }

    async performOCR() {
        console.log('[循迹] OCR 识别中...');
        this.setStepStatus('ocr', 'active', '正在识别文字...');
        await this.sleep(1500);
        
        // 模拟 OCR 识别结果
        const ocrText = this.simulateOCR();
        console.log('[循迹] OCR 识别结果:', ocrText.substring(0, 100) + '...');
        
        this.setStepStatus('ocr', 'completed', '识别完成');
        return ocrText;
    }

    async extractMetrics() {
        console.log('[循迹] 提取健康指标...');
        this.setStepStatus('extract', 'active', '正在提取指标...');
        await this.sleep(1200);
        
        // 模拟指标提取
        const metrics = this.simulateMetricsExtraction();
        console.log('[循迹] 提取的指标:', metrics);
        
        this.setStepStatus('extract', 'completed', '提取完成');
        return metrics;
    }

    async analyzeWithLLM(metrics) {
        console.log('[循迹] 大模型分析中...');
        this.setStepStatus('analyze', 'active', '大模型分析中...');
        await this.sleep(2000);
        
        // 模拟 LLM 分析
        const analysis = this.simulateLLMAnalysis(metrics);
        console.log('[循迹] 分析结果:', analysis);
        
        this.setStepStatus('analyze', 'completed', '分析完成');
        return analysis;
    }

    simulateOCR() {
        // 模拟 OCR 识别的文字内容
        return `户外跑步
今日运动
5.23 公里
45'32"
平均配速
8'39"/公里
平均速度
6.94 公里/小时
最快配速
7'52"/公里
平均心率
145 次/分钟
最大心率
168 次/分钟
运动时间
45分32秒
卡路里
345 千卡
最佳跑步记录
恢复时间建议
36小时`;
    }

    simulateMetricsExtraction() {
        // 模拟提取的指标
        const workoutTypes = ['跑步', '骑行', '游泳', '力量训练'];
        const randomType = workoutTypes[Math.floor(Math.random() * workoutTypes.length)];
        
        return {
            type: randomType,
            distance: (Math.random() * 15 + 2).toFixed(2), // 公里
            duration: Math.floor(Math.random() * 120 + 20), // 分钟
            avgHeartRate: Math.floor(Math.random() * 60 + 110),
            maxHeartRate: Math.floor(Math.random() * 40 + 140),
            avgPace: `${Math.floor(Math.random() * 4 + 5)}'${Math.floor(Math.random() * 60).toString().padStart(2, '0')}"`,
            calories: Math.floor(Math.random() * 400 + 150),
            date: new Date().toISOString().split('T')[0]
        };
    }

    simulateLLMAnalysis(metrics) {
        // 模拟大模型的大白话解读和建议
        const interpretations = [
            `这${metrics.duration}分钟的${metrics.type}练得真不错！平均心率${metrics.avgHeartRate}，说明强度刚刚好，属于有氧燃脂的黄金区间。${metrics.distance}公里的距离也很实在，能有效提升心肺功能。继续保持这个节奏，下个月你会发现爬楼都不喘气了！`,
            
            `今天这${metrics.type}干得漂亮！${metrics.distance}公里用了${metrics.duration}分钟，配速相当稳定。平均心率${metrics.avgHeartRate}，说明身体适应得很好。看这消耗的${metrics.calories}卡路里，今晚可以放心加个鸡腿了！`,
            
            `太棒了！${metrics.type}${metrics.distance}公里，平均心率控制在${metrics.avgHeartRate}，这个强度非常适合健康管理。运动后的恢复也很重要，记得今晚早点睡觉，给肌肉充分的休息时间。`
        ];

        const recommendations = [
            `下次锻炼建议：可以稍微增加一点距离，比如试试${(parseFloat(metrics.distance) + 1).toFixed(1)}公里，但注意不要把心率拉得太高，保持在${metrics.avgHeartRate - 5}到${metrics.avgHeartRate + 10}之间就好。运动前记得热身5分钟，运动后别忘了拉伸！`,
            
            `下次可以尝试变速跑：先快速冲1分钟，再慢跑2分钟，这样重复8-10组，比匀速跑更能提升耐力。记得最后放松走一圈，让心率慢慢降下来。`,
            
            `建议下次运动前先做一组动态拉伸（高抬腿、后踢腿各30秒），然后维持当前强度，但最后可以加个50米的冲刺，刺激一下心肺，会有更好的训练效果！`
        ];

        return {
            interpretation: interpretations[Math.floor(Math.random() * interpretations.length)],
            recommendation: recommendations[Math.floor(Math.random() * recommendations.length)]
        };
    }

    showAnalysisResult(analysis) {
        console.log('[循迹] 显示分析结果...');
        
        this.elements.analyzingSection.style.display = 'none';
        this.elements.analysisResultSection.style.display = 'block';
        
        // 显示指标
        this.renderMetrics(analysis.metrics);
        
        // 显示解读
        this.elements.interpretationText.textContent = analysis.interpretation;
        
        // 显示建议
        this.elements.recommendationText.textContent = analysis.recommendation;
        
        window.showToast('分析完成！', 'success');
    }

    renderMetrics(metrics) {
        const typeLabels = {
            '跑步': '🏃 跑步',
            '骑行': '🚴 骑行',
            '游泳': '🏊 游泳',
            '力量训练': '💪 力量训练'
        };
        
        const metricItems = [
            { label: '运动类型', value: typeLabels[metrics.type] || metrics.type },
            { label: '运动距离', value: `${metrics.distance} 公里` },
            { label: '运动时长', value: `${metrics.duration} 分钟` },
            { label: '平均心率', value: `${metrics.avgHeartRate} 次/分` },
            { label: '最大心率', value: `${metrics.maxHeartRate} 次/分` },
            { label: '消耗热量', value: `${metrics.calories} 千卡` }
        ];
        
        if (metrics.avgPace) {
            metricItems.splice(3, 0, { label: '平均配速', value: metrics.avgPace });
        }
        
        this.elements.metricsDisplay.innerHTML = metricItems.map(item => `
            <div class="metric-item">
                <div class="metric-value">${item.value}</div>
                <div class="metric-label">${item.label}</div>
            </div>
        `).join('');
    }

    setStepStatus(stepName, status, statusText) {
        const stepEl = this.elements[`step${stepName.charAt(0).toUpperCase() + stepName.slice(1)}`];
        if (!stepEl) return;
        
        const statusEl = stepEl.querySelector('.step-status');
        
        // 重置所有步骤
        ['ocr', 'extract', 'analyze'].forEach(name => {
            const el = this.elements[`step${name.charAt(0).toUpperCase() + name.slice(1)}`];
            if (el) {
                el.classList.remove('active', 'completed');
            }
        });
        
        // 设置当前步骤
        stepEl.classList.add(status);
        if (statusEl) {
            statusEl.textContent = statusText;
        }
        
        // 之前的步骤标记为完成
        const stepOrder = ['ocr', 'extract', 'analyze'];
        const currentIndex = stepOrder.indexOf(stepName);
        
        stepOrder.slice(0, currentIndex).forEach(name => {
            const el = this.elements[`step${name.charAt(0).toUpperCase() + name.slice(1)}`];
            if (el) {
                el.classList.remove('active');
                el.classList.add('completed');
                const s = el.querySelector('.step-status');
                if (s) s.textContent = '✓ 完成';
            }
        });
    }

    resetSteps() {
        ['ocr', 'extract', 'analyze'].forEach(name => {
            const el = this.elements[`step${name.charAt(0).toUpperCase() + name.slice(1)}`];
            if (el) {
                el.classList.remove('active', 'completed');
                const s = el.querySelector('.step-status');
                if (s) {
                    const defaultText = name === 'ocr' ? '正在识别...' : '等待中...';
                    s.textContent = defaultText;
                }
            }
        });
    }

    saveResult() {
        if (!this.currentAnalysis) {
            window.showToast('没有可保存的结果', 'error');
            return;
        }
        
        // 保存到状态管理
        if (window.app && window.app.state) {
            const workoutData = {
                date: this.currentAnalysis.metrics.date,
                type: this.currentAnalysis.metrics.type,
                distance: parseFloat(this.currentAnalysis.metrics.distance),
                duration: this.currentAnalysis.metrics.duration,
                avgHeartRate: this.currentAnalysis.metrics.avgHeartRate,
                maxHeartRate: this.currentAnalysis.metrics.maxHeartRate,
                calories: this.currentAnalysis.metrics.calories,
                avgPace: this.currentAnalysis.metrics.avgPace,
                notes: this.currentAnalysis.interpretation,
                recommendation: this.currentAnalysis.recommendation,
                metrics: this.currentAnalysis.metrics
            };
            
            const saved = window.app.state.addWorkout(workoutData);
            if (saved) {
                window.showToast('记录保存成功！', 'success');
                this.resetToUpload();
                
                // 通知记录列表更新
                const event = new CustomEvent('workout:saved', { detail: saved });
                document.dispatchEvent(event);
            } else {
                window.showToast('保存失败，请重试', 'error');
            }
        }
    }

    resetToUpload() {
        this.currentFile = null;
        this.currentAnalysis = null;
        this.elements.fileInput.value = '';
        this.elements.uploadPrompt.style.display = 'block';
        this.elements.previewSection.style.display = 'none';
        this.elements.analyzingSection.style.display = 'none';
        this.elements.analysisResultSection.style.display = 'none';
        console.log('[循迹] 已重置为上传状态');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 初始化分析控制器
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!window.analysisController && document.getElementById('uploadArea')) {
            window.analysisController = new AnalysisController();
        }
    }, 100);
});
