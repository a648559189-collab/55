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

function initApp() {
    // 1. Intro Animation (Gesture)
    setupGestureIntro();

    // 2. Data Rendering
    loadUserProfile();
    loadDailyLog(LOG_DATA[0]); // Load latest
    renderAttendanceCalendar();

    // 3. Event Listeners
    setupInteractions();
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
                    
                    // Adjust canvas resolution
                    canvas.width = videoElement.videoWidth;
                    canvas.height = videoElement.videoHeight;
                    
                    // Adjust container aspect ratio if needed (optional, but good for UI)
                    // For now let css handle visual size, but canvas internal res matches video

                    
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

async function processVideoFrame() {
    if (!isCameraRunning) return;
    
    const videoElement = document.getElementById('input_video');
    try {
        if (hands && videoElement && videoElement.readyState >= 2) {
            await hands.send({image: videoElement});
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

function onGestureResults(results) {
    if (isGesturing) return; 

    const canvasCtx = document.getElementById('output_canvas').getContext('2d');
    const canvasElement = document.getElementById('output_canvas');
    
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Mirror transform
    canvasCtx.translate(canvasElement.width, 0);
    canvasCtx.scale(-1, 1);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        // logToScreen("检测到手!"); // Spammy but useful for first detect
        const landmarks = results.multiHandLandmarks[0];
        
        // Draw Digital Skeleton
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00C2FF', lineWidth: 2});
        drawLandmarks(canvasCtx, landmarks, {color: '#FF6C37', lineWidth: 2, radius: 4});

        // Check for Thumbs Up
        if (detectThumbsUpSimplified(landmarks)) {
            logToScreen(">>> 识别成功: 大拇指!");
            triggerSuccess();
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

function renderGrowthChart() {
    // Removed
}

function renderAttendanceCalendar() {
    const container = document.getElementById('attendance-calendar');
    container.innerHTML = '';
    
    // Config: Current Month (Demo: Dec 2025)
    // Use Nov/Dec mix for demo since data is Nov 30
    const currentYear = 2025;
    const currentMonth = 11; // Showing Nov data primarily or Dec?
    // Let's stick to Dec view but maybe include prev days? 
    // Actually, user mentioned 11.30. Let's show Nov/Dec transition or just Nov?
    // The code had Dec (12). 11.30 is not in Dec.
    // Let's change to Nov for better demo alignment.
    const displayMonth = 11; 
    const displayYear = 2025;
    const daysInMonth = 30; 
    const restDays = [1, 2, 17, 18]; // Fixed rest days

    document.getElementById('cal-month-label').innerText = `${displayMonth}月`;

    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        const isRest = restDays.includes(i);
        
        // Format Date String for check: YYYY-MM-DD
        const dateStr = `${displayYear}-${String(displayMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        // Check if we have a log for this date
        const hasLog = LOG_DATA.some(l => l.date === dateStr);
        
        // Visual checkmark for "attendance"
        const isChecked = USER_PROFILE.attendanceLog && USER_PROFILE.attendanceLog.includes(dateStr);

        dayDiv.className = `cal-day ${isRest ? 'rest' : 'work'} ${isChecked ? 'checked' : ''}`;
        dayDiv.innerText = i;
        
        // Add indicator dot if there is a log
        if (hasLog) {
            dayDiv.style.borderBottom = '2px solid var(--accent-blue)';
        }
        
        if (!isRest) {
            dayDiv.onclick = () => {
                // Switch View
                switchDateView(dateStr);
                
                // Highlight selection
                document.querySelectorAll('.cal-day').forEach(d => d.style.background = '');
                dayDiv.style.background = 'rgba(0, 194, 255, 0.2)';
            };
        }

        container.appendChild(dayDiv);
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
