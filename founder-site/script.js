document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

let camera = null; // Not used as object anymore, but as stream flag
let cameraStream = null;
let hands = null;
let isGesturing = false;
let isCameraRunning = false;

// Debug Logger
function logToScreen(msg) {
    const el = document.getElementById('debug-log');
    if (el) {
        el.innerHTML += `> ${msg}<br>`;
        el.scrollTop = el.scrollHeight;
    }
    console.log(msg);
}

// --- Audio Manager (Synthetic SFX + BGM) ---
const AudioManager = {
    ctx: null,
    bgm: null,
    isMuted: true, // Start assumed muted/paused until played

    init: function() {
        this.bgm = document.getElementById('bg-music');
        this.bgm.volume = 0.2; 
        
        // Setup Toggle Button Immediately
        const btn = document.getElementById('audio-toggle');
        if (btn) {
            btn.onclick = (e) => {
                e.stopPropagation(); // Prevent bubbling
                this.toggleBGM();
            };
        }

        // Try Auto-play immediately
        this.tryAutoPlay();
    },

    tryAutoPlay: function() {
        // Attempt to play
        const p = this.bgm.play();
        if (p !== undefined) {
            p.then(() => {
                this.onPlaySuccess();
            }).catch(() => {
                console.log("Auto-play blocked. Waiting for interaction.");
                // Fallback: Play on first interaction
                document.addEventListener('click', () => {
                    if (this.bgm.paused) {
                        this.bgm.play().then(() => this.onPlaySuccess());
                    }
                }, { once: true });
            });
        }
    },

    onPlaySuccess: function() {
        this.isMuted = false;
        const icon = document.getElementById('audio-icon');
        const btn = document.getElementById('audio-toggle');
        if(icon) icon.innerText = '🎵';
        if(btn) btn.style.boxShadow = '0 0 20px var(--accent-blue)';
        
        // Init SFX Context lazily if needed
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },

    toggleBGM: function() {
        // Ensure SFX context is ready
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const icon = document.getElementById('audio-icon');
        const btn = document.getElementById('audio-toggle');

        if (this.bgm.paused) {
            this.bgm.play().then(() => {
                this.isMuted = false;
                icon.innerText = '🎵';
                btn.style.boxShadow = '0 0 20px var(--accent-blue)';
            });
        } else {
            this.bgm.pause();
            this.isMuted = true;
            icon.innerText = '🔇';
            btn.style.boxShadow = 'none';
        }
    },

    playClick: function() {
        if (!this.ctx) return; // Silent if no context (user hasn't interacted)
        // Heal Sound: Gentle Sine Wave
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    },
    
    playUnlock: function() {
        // Ensure context exists
        if (!this.ctx) {
             this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        // Force resume if suspended (browser policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const t = this.ctx.currentTime;
        
        // Layer 1: High Pitch "Ping" (Sine)
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, t); // A5
        osc1.frequency.exponentialRampToValueAtTime(1760, t + 0.1); // Slide up
        
        gain1.gain.setValueAtTime(0.3, t);
        gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        
        osc1.start(t);
        osc1.stop(t + 0.8);

        // Layer 2: Impact Bass (Square)
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(220, t);
        osc2.frequency.exponentialRampToValueAtTime(55, t + 0.4); // Slide down
        
        gain2.gain.setValueAtTime(0.1, t);
        gain2.gain.linearRampToValueAtTime(0, t + 0.4);

        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        
        osc2.start(t);
        osc2.stop(t + 0.4);
    }
};


function initApp() {
    // 1. Intro Animation (Gesture)
    setupGestureIntro();

    // 2. Data Rendering
    loadUserProfile();
    loadDailyLog(LOG_DATA[0]); // Load latest
    renderAttendanceCalendar(); // Default to current month

    // 3. Event Listeners
    setupInteractions();
    
    // 4. Audio Init (Immediate)
    AudioManager.init();
}

function renderAttendanceCalendar_OLD() {
    // Removed
}

// --- 1. Epic Gesture Intro ---
function setupGestureIntro() {
    const statusText = document.getElementById('gesture-status');
    const manualBtn = document.getElementById('btn-manual-start');
    
    logToScreen("正在初始化...");

    // 0. Cleanup first
    stopCamera();

    // 1. Timeout Guard (8s)
    const timeoutId = setTimeout(() => {
        if (!isCameraRunning) {
            statusText.innerHTML = '<span class="text-orange">连接超时，请使用下方手动模式</span>';
            manualBtn.style.opacity = 1;
            manualBtn.classList.add('blink');
            logToScreen("超时：相机未启动");
        }
    }, 8000);

    // Initialize MediaPipe Hands
    try {
        logToScreen("加载 AI 模型...");
        hands = new Hands({locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }});

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 0, // Lite
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        hands.onResults(onGestureResults);

        // Start Camera (Native getUserMedia for Mobile Front Cam)
        const videoElement = document.getElementById('input_video');
        
        // Simplify constraints for maximum mobile compatibility
        const constraints = {
            video: {
                facingMode: 'user'
            }
        };

        statusText.innerHTML = '<span class="blink">●</span> 正在调用视觉传感器...';

        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                logToScreen("摄像头授权成功");
                cameraStream = stream;
                videoElement.srcObject = stream;
                // Wait for metadata to resize canvas
                videoElement.onloadedmetadata = () => {
                    logToScreen(`视频尺寸: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
                    
                    // Resize Canvas to match video
                    const canvas = document.getElementById('output_canvas');
                    const container = document.querySelector('.gesture-container');
                    
                    // 1. Match internal canvas resolution
                    canvas.width = videoElement.videoWidth;
                    canvas.height = videoElement.videoHeight;
                    
                    // 2. FIX ASPECT RATIO (Mobile Portrait)
                    // Calculate display height based on fixed width (320px)
                    // aspect = h / w
                    const aspectRatio = videoElement.videoHeight / videoElement.videoWidth;
                    const newHeight = 320 * aspectRatio;
                    
                    container.style.height = `${newHeight}px`;
                    container.style.width = '320px'; // Keep width fixed
                    logToScreen(`调整容器: 320x${Math.round(newHeight)}`);

                    videoElement.play();
                    isCameraRunning = true;
                    clearTimeout(timeoutId);
                    statusText.innerHTML = '<span class="text-blue">● 视觉系统上线. 正在扫描...</span>';
                    logToScreen("开始处理视频流...");
                    
                    // Start Processing Loop
                    requestAnimationFrame(processVideoFrame);
                };
            })
            .catch(err => {
                console.error('Camera Error:', err);
                logToScreen(`摄像头错误: ${err.name} - ${err.message}`);
                clearTimeout(timeoutId);
                statusText.innerHTML = '<span class="text-orange">! 无法访问摄像头</span>';
                manualBtn.style.opacity = 1;
            });

    } catch (e) {
        console.error('Init Failed', e);
        logToScreen(`初始化异常: ${e.message}`);
        clearTimeout(timeoutId);
        statusText.innerText = '系统初始化失败，请使用手动模式';
        manualBtn.style.opacity = 1;
    }

    // Manual Fallback
    manualBtn.onclick = () => {
        stopCamera();
        launchSystem();
    };
}

let hasLoggedFrame = false;
async function processVideoFrame() {
    if (!isCameraRunning) return;
    
    const videoElement = document.getElementById('input_video');
    try {
        if (hands && videoElement && videoElement.readyState >= 2) {
            await hands.send({image: videoElement});
            if (!hasLoggedFrame) {
                logToScreen("✅ AI正在逐帧分析中...");
                hasLoggedFrame = true;
            }
        }
    } catch (e) {
        // logToScreen("帧处理错误: " + e.message); // Don't spam
    }
    
    if (isCameraRunning) {
        requestAnimationFrame(processVideoFrame);
    }
}

function stopCamera() {
    isCameraRunning = false;
    try {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        const videoElement = document.getElementById('input_video');
        if (videoElement) {
            videoElement.srcObject = null;
        }
        logToScreen("摄像头已关闭");
    } catch(e) {
        console.log('Stop camera error:', e);
    }
}

let detectionStartTime = 0;
const REQUIRED_HOLD_DURATION = 1500; // 1.5 seconds

function onGestureResults(results) {
    if (isGesturing) return; 

    const canvasCtx = document.getElementById('output_canvas').getContext('2d');
    const canvasElement = document.getElementById('output_canvas');
    const statusText = document.getElementById('gesture-status');
    
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Mirror transform
    canvasCtx.translate(canvasElement.width, 0);
    canvasCtx.scale(-1, 1);

    // 1. Draw Video Background
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    // 2. Draw Overlay/HUD
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        // Draw Digital Skeleton
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00C2FF', lineWidth: 2});
        drawLandmarks(canvasCtx, landmarks, {color: '#FF6C37', lineWidth: 2, radius: 4});

        // Check for Thumbs Up
        if (detectThumbsUpSimplified(landmarks)) {
            if (detectionStartTime === 0) {
                detectionStartTime = Date.now(); // Start timer
            }
            
            const elapsed = Date.now() - detectionStartTime;
            const progress = Math.min(elapsed / REQUIRED_HOLD_DURATION, 1);

            // Visual Feedback: Draw Progress Circle around thumb tip
            const thumbTip = landmarks[4];
            const x = thumbTip.x * canvasElement.width;
            const y = thumbTip.y * canvasElement.height;
            
            canvasCtx.beginPath();
            canvasCtx.arc(x, y, 30, 0, 2 * Math.PI * progress);
            canvasCtx.lineWidth = 5;
            canvasCtx.strokeStyle = '#00C2FF'; // Cyan
            canvasCtx.stroke();

            // Status Update
            if (statusText) {
                statusText.innerHTML = `<span class="text-blue">身份确认中... ${Math.round(progress * 100)}%</span>`;
            }

            if (elapsed >= REQUIRED_HOLD_DURATION) {
                logToScreen(">>> 识别确认: 蓄力完成!");
                triggerSuccess();
            }
        } else {
            // Lost gesture, reset timer
            detectionStartTime = 0;
            if (statusText && !isGesturing) {
                statusText.innerHTML = '<span class="text-blue">● 视觉系统上线. 正在扫描...</span>';
            }
        }
    } else {
        // No hand, reset timer
        detectionStartTime = 0;
        if (statusText && !isGesturing) {
            statusText.innerHTML = '<span class="text-blue">● 视觉系统上线. 正在扫描...</span>';
        }
    }
    canvasCtx.restore();
}

function detectThumbsUpSimplified(landmarks) {
    // Points: Thumb Tip (4), Index Tip (8), Middle Tip (12)...
    const thumbTip = landmarks[4];
    const thumbIP = landmarks[3];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    // Logic 1: Thumb Tip must be "higher" (smaller Y) than Thumb Joint (IP)
    const isThumbUp = thumbTip.y < thumbIP.y;

    // Logic 2: Thumb Tip must be the HIGHEST point among all fingertips (roughly)
    // allowing some margin for error.
    // Y increases downwards. So Smallest Y = Highest point.
    const isThumbHighest = 
        thumbTip.y < indexTip.y &&
        thumbTip.y < middleTip.y &&
        thumbTip.y < ringTip.y &&
        thumbTip.y < pinkyTip.y;

    // Return true if both conditions met
    return isThumbUp && isThumbHighest;
}

function triggerSuccess() {
    if (isGesturing) return;
    isGesturing = true;

    // Play SFX
    AudioManager.playUnlock();

    // Visual Feedback
    const container = document.querySelector('.gesture-container');
    const status = document.getElementById('gesture-status');
    
    container.classList.add('success');
    status.innerHTML = '<span class="text-orange" style="font-size:1.2rem; font-weight:bold;">Access Granted</span>';

    // Stop Camera
    setTimeout(() => {
        stopCamera();
        launchSystem();
    }, 1000);
}

function launchSystem() {
    const intro = document.getElementById('intro-layer');
    const app = document.getElementById('app-container');
    const sidebar = document.querySelector('aside');
    const main = document.querySelector('main');

    // Fade out intro
    intro.style.transition = 'all 0.8s ease';
    intro.style.opacity = '0';
    intro.style.transform = 'scale(1.1)';

    // Reveal App
    app.style.opacity = '1';
    app.style.pointerEvents = 'auto'; 
    
    setTimeout(() => {
        intro.style.display = 'none';
        // Slide in elements
        sidebar.style.transform = 'translateX(0)';
        main.style.transform = 'translateX(0)';
        
        // CLEANUP
        setTimeout(() => {
            sidebar.style.transform = '';
            main.style.transform = '';
        }, 1000);
    }, 600);
}

// --- 2. Data Rendering ---
function loadUserProfile() {
    // Calculate days since start
    const start = new Date(USER_PROFILE.startDate);
    const now = new Date();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    document.getElementById('days-count').innerText = diff;

    // Progress Bar
    document.getElementById('lbl-total-progress').innerText = USER_PROFILE.totalProgress + '%';
    document.getElementById('bar-total-progress').style.width = USER_PROFILE.totalProgress + '%';
}

function switchDateView(dateStr) {
    // Find log for this date
    const log = LOG_DATA.find(l => l.date === dateStr);
    
    if (log) {
        loadDailyLog(log);
    } else {
        // Mock empty log
        const emptyLog = {
            id: -1,
            date: dateStr,
            weekday: getWeekday(dateStr),
            tasks: [],
            results: "暂无记录",
            reflection: "暂无记录",
            meetingMinutes: "暂无记录",
            mindmapUrl: "", // Hide or empty
            title: "无 SOP 数据"
        };
        loadDailyLog(emptyLog);
    }
}

function getWeekday(dateStr) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[new Date(dateStr).getDay()];
}

function loadDailyLog(log) {
    // Date
    document.getElementById('current-date-display').innerText = log.date + ' · ' + (log.weekday || '');

    // Results & Reflection & Meeting
    document.getElementById('daily-results').innerText = log.results || '';
    document.getElementById('daily-reflection').innerText = log.reflection || '';
    
    const meetingDiv = document.getElementById('meeting-minutes');
    if (meetingDiv) meetingDiv.innerText = log.meetingMinutes || '暂无记录';

    // Initialize Mindmap Section
    // If valid ID, render list. If empty log, maybe clear list or show all but inactive.
    if (log.id !== -1) {
        renderMindmapList(log.id);
    } else {
        // Clear preview or show default
        document.getElementById('mindmap-preview').innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;">本日无 SOP 数据</div>';
        document.getElementById('mindmap-info').innerText = '';
    }
}

function renderMindmapList(activeId) {
    const listContainer = document.getElementById('mindmap-list');
    listContainer.innerHTML = '';

    // Always show full list of available SOPs so user can browse even if looking at a past date
    LOG_DATA.forEach(log => {
        if (!log.mindmapUrl) return;

        const li = document.createElement('li');
        li.className = `mindmap-item ${log.id === activeId ? 'active' : ''}`;
        
        // Use explicit title, fallback to tags, fallback to ID
        const title = log.title ? log.title : (log.tags ? log.tags.join(' / ') : `SOP #${log.id}`);
        
        li.innerHTML = `
            <span class="mindmap-item-date">${log.date}</span>
            <span>${title}</span>
        `;
        
        li.onclick = () => {
            // Update UI active state
            document.querySelectorAll('.mindmap-item').forEach(el => el.classList.remove('active'));
            li.classList.add('active');
            // Switch Content
            switchMindmap(log);
        };

        listContainer.appendChild(li);
        
        // If this is the active log, trigger the switch immediately to load initial view
        if (log.id === activeId) {
            switchMindmap(log);
        }
    });
}

function switchMindmap(log) {
    // Update Preview Area (Now using Iframe)
    const preview = document.getElementById('mindmap-preview');
    // Clear old content but save button ref
    // const btn = preview.querySelector('.btn-expand-map'); // Don't save, recreate
    preview.innerHTML = ''; 
    
    const iframe = document.createElement('iframe');
    iframe.src = log.mindmapUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.background = '#fff'; // Ensure visibility if transparent
    
    const btn = document.createElement('button');
    btn.className = 'btn-expand-map';
    btn.innerText = '🔍 全息展开';
    btn.style.position = 'absolute';
    btn.style.bottom = '10px';
    btn.style.right = '10px';
    btn.style.top = 'auto';
    btn.style.left = 'auto';
    btn.style.transform = 'none';
    
    preview.appendChild(iframe);
    preview.appendChild(btn); // Re-append button (now overlaying iframe)
    
    // Reset button style for overlay
    btn.style.opacity = '0.8'; // Visible by default on iframe
    btn.onmouseover = () => btn.style.opacity = '1';
    btn.onmouseout = () => btn.style.opacity = '0.8';

    // Update Info Text
    const info = document.getElementById('mindmap-info');
    // Use explicit title
    const displayTitle = log.title ? log.title : (log.tags ? log.tags[0] : 'SOP');
    info.innerText = `当前浏览：${log.date} · ${displayTitle}`;

    // Update Modal Action
    btn.onclick = () => openMindmap(log.mindmapUrl);
}

// --- Calendar Logic (New) ---
let currentCalendarDate = new Date();

window.changeMonth = (delta) => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderAttendanceCalendar();
};

function renderAttendanceCalendar() {
    const calendar = document.getElementById('attendance-calendar');
    const monthTitle = document.getElementById('cal-month-title');
    if (!calendar) return;

    calendar.innerHTML = '';
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // Update Title
    if (monthTitle) {
        monthTitle.innerText = `${year}年 ${month + 1}月`;
    }

    // Calendar Logic
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0 = Sunday

    // Headers
    const weekDays = ['日','一','二','三','四','五','六'];
    weekDays.forEach(d => {
        const el = document.createElement('div');
        el.innerText = d;
        el.style.fontSize = '0.7rem';
        el.style.color = '#666';
        el.style.textAlign = 'center';
        calendar.appendChild(el);
    });

    // Empty slots for start
    for (let i = 0; i < startingDay; i++) {
        const el = document.createElement('div');
        calendar.appendChild(el);
    }

    // Days
    const todayStr = new Date().toISOString().split('T')[0];
    
    for (let i = 1; i <= totalDays; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'cal-day work';
        dayDiv.innerText = i;
        
        // Format YYYY-MM-DD
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        
        // Check if attended
        if (USER_PROFILE.attendanceLog.includes(dateStr)) {
            dayDiv.classList.add('checked');
            dayDiv.title = "已筑梦";
        }

        // Future check
        if (dateStr > todayStr) {
            dayDiv.classList.remove('work');
            dayDiv.classList.add('rest');
            dayDiv.style.opacity = '0.3';
        } else {
            dayDiv.onclick = () => switchDateView(dateStr);
        }

        calendar.appendChild(dayDiv);
    }
}

// --- 3. Interaction Logic ---
function toggleTask(el) {
    el.classList.toggle('done');
    // In a real app, this would save to DB
}

function lockTasks() {
    const btn = document.querySelector('.task-lock-btn');
    btn.innerText = '🔒 已锁定 (Goals Locked)';
    btn.style.background = 'rgba(255, 108, 55, 0.2)';
    btn.style.borderColor = 'var(--accent-orange)';
    btn.style.color = 'var(--accent-orange)';
    
    // Pulse effect
    btn.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.05)' },
        { transform: 'scale(1)' }
    ], { duration: 300 });
}

function openMindmap(url) {
    const modal = document.getElementById('mindmap-modal');
    const iframe = document.getElementById('modal-iframe');
    iframe.src = url;
    modal.style.display = 'flex';
}

function setupInteractions() {
    // Global UI Sound
    document.addEventListener('click', (e) => {
        const target = e.target.closest('button, .nav-item, .tech-card, .cal-day.work, .mindmap-item');
        if (target) {
            AudioManager.playClick();
        }
    });

    // Nav Clicking
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const tab = e.currentTarget.dataset.tab;
            
            // UI Active State
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            e.currentTarget.classList.add('active');

            // View Switching
            const dashboard = document.getElementById('dashboard-content');
            const historyView = document.getElementById('history-view');

            if (tab === 'history') {
                dashboard.style.display = 'none';
                historyView.style.display = 'grid'; // Grid layout
                renderHistoryTimeline(); // Refresh list
            } else if (tab === 'daily') {
                dashboard.style.display = 'grid';
                historyView.style.display = 'none';
            } else {
                // Placeholder for other tabs
                alert('功能开发中：' + tab);
                // Revert to active
                return; 
            }
        });
    });

    // Modal Close
    document.querySelector('.modal-close').onclick = () => {
        document.getElementById('mindmap-modal').style.display = 'none';
        document.getElementById('modal-iframe').src = '';
    };
    
    // Close modal on outside click
    document.getElementById('mindmap-modal').onclick = (e) => {
        if(e.target.id === 'mindmap-modal') {
            e.target.style.display = 'none';
            document.getElementById('modal-iframe').src = '';
        }
    };

    // --- Mobile Menu Logic ---
    const menuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('aside');
    const mainContent = document.querySelector('main');

    if (menuBtn) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent immediate close
            sidebar.classList.toggle('active');
            menuBtn.innerText = sidebar.classList.contains('active') ? '✕' : '☰';
        });

        // Close sidebar when clicking main content
        mainContent.addEventListener('click', () => {
            if (sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                menuBtn.innerText = '☰';
            }
        });

        // Close sidebar when clicking a nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                    menuBtn.innerText = '☰';
                }
            });
        });
    }
}

// --- 4. History View Logic ---
function renderHistoryTimeline() {
    const container = document.getElementById('history-timeline');
    container.innerHTML = '';

    LOG_DATA.forEach(log => {
        const card = document.createElement('div');
        card.className = 'tech-card mindmap-item'; // Reuse styles
        card.style.cursor = 'pointer';
        
        const tags = log.tags ? log.tags.map(t => `<span style="font-size:0.7em; border:1px solid #333; padding:2px 4px; margin-right:4px; color:#888;">#${t}</span>`).join('') : '';
        
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span class="text-orange" style="font-family:monospace;">${log.date}</span>
                <span style="font-size:0.8rem;">${log.weekday}</span>
            </div>
            <div style="font-weight:bold; margin-bottom:5px;">${log.type === 'sop' ? '🎬 SOP建构' : '📝 学习复盘'}</div>
            <div>${tags}</div>
        `;

        card.onclick = () => showHistoryDetail(log);
        container.appendChild(card);
    });
}

function showHistoryDetail(log) {
    // UI State
    document.getElementById('hist-preview-content').style.display = 'none';
    document.getElementById('hist-detail-box').style.display = 'block';
    document.getElementById('hist-date-tag').innerText = log.date;

    // Content
    document.getElementById('hist-summary').innerText = log.results;
    document.getElementById('hist-reflection').innerText = log.reflection;
    
    // Image
    const thumb = document.getElementById('hist-mindmap-thumb');
    // Remove old img
    const oldImg = thumb.querySelector('img');
    if(oldImg) oldImg.remove();
    
    const img = document.createElement('img');
    img.src = log.mindmapImg;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.opacity = '0.8';
    
    thumb.insertBefore(img, thumb.firstChild);

    // Button Action
    document.getElementById('hist-btn-expand').onclick = () => openMindmap(log.mindmapUrl);
}
