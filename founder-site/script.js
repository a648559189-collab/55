document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // 1. Intro Animation
    setupIntro();

    // 2. Data Rendering
    loadUserProfile();
    loadDailyLog(LOG_DATA[0]); // Load latest
    renderGrowthChart();
    renderAttendanceCalendar();

    // 3. Event Listeners
    setupInteractions();
}

// --- 1. Epic Intro Sequence ---
function setupIntro() {
    const btnStart = document.getElementById('btn-start-dream');
    const timeline = document.querySelector('.timeline-container');
    const title = document.querySelector('.intro-title');
    const points = document.querySelectorAll('.timeline-point');
    
    // Stage 1: Timeline expands
    setTimeout(() => {
        timeline.style.width = '100%';
        setTimeout(() => {
            points.forEach(p => p.style.opacity = '1');
        }, 1000);
    }, 500);

    // Stage 2: Title & Button
    setTimeout(() => {
        title.style.opacity = '1';
        title.style.transform = 'translateY(0)';
        
        setTimeout(() => {
            btnStart.style.opacity = '1';
            btnStart.style.transform = 'scale(1)';
        }, 800);
    }, 2000);

    // Stage 3: Launch
    btnStart.addEventListener('click', () => {
        // Particle explosion effect could go here
        
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
        app.style.pointerEvents = 'auto'; // <--- 修复核心：恢复鼠标交互
        
        setTimeout(() => {
            intro.style.display = 'none';
            // Slide in elements
            sidebar.style.transform = 'translateX(0)';
            main.style.transform = 'translateX(0)';
        }, 600);
    });
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

function loadDailyLog(log) {
    // Date
    document.getElementById('current-date-display').innerText = log.date + ' · ' + log.weekday;

    // Tasks
    const taskList = document.getElementById('daily-tasks');
    taskList.innerHTML = '';
    log.tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.done ? 'done' : ''}`;
        li.innerHTML = `
            <div class="task-check"></div>
            <span>${task.text}</span>
        `;
        li.onclick = () => toggleTask(li);
        taskList.appendChild(li);
    });

    // Results & Reflection
    document.getElementById('daily-results').innerText = log.results;
    document.getElementById('daily-reflection').innerText = log.reflection;

    // Initialize Mindmap Section (Render List & Select Current)
    renderMindmapList(log.id);
}

function renderMindmapList(activeId) {
    const listContainer = document.getElementById('mindmap-list');
    listContainer.innerHTML = '';

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
    const btn = preview.querySelector('.btn-expand-map');
    preview.innerHTML = ''; 
    
    const iframe = document.createElement('iframe');
    iframe.src = log.mindmapUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.background = '#fff'; // Ensure visibility if transparent
    
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
    const container = document.getElementById('growth-chart');
    GROWTH_STATS.forEach(stat => {
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = stat.height + '%';
        bar.innerHTML = `<div class="bar-tooltip">${stat.tip}: ${stat.count}条</div>`;
        container.appendChild(bar);
    });
}

function renderAttendanceCalendar() {
    const container = document.getElementById('attendance-calendar');
    container.innerHTML = '';
    
    // Config: Current Month (Demo: Dec 2025)
    const currentYear = 2025;
    const currentMonth = 12; // Dec
    const daysInMonth = 31; 
    const restDays = [1, 2, 17, 18]; // Fixed rest days

    document.getElementById('cal-month-label').innerText = `${currentMonth}月`;

    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        const isRest = restDays.includes(i);
        
        // Format Date String for check: YYYY-MM-DD
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const isChecked = USER_PROFILE.attendanceLog && USER_PROFILE.attendanceLog.includes(dateStr);

        dayDiv.className = `cal-day ${isRest ? 'rest' : 'work'} ${isChecked ? 'checked' : ''}`;
        dayDiv.innerText = i;
        
        if (!isRest) {
            dayDiv.onclick = () => {
                dayDiv.classList.toggle('checked');
                // In real app: Update USER_PROFILE.attendanceLog
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
