// 筑梦OS数据核心 v2.0

const USER_PROFILE = {
    name: "何铖博",
    role: "剪辑筑梦者",
    startDate: "2025-11-30",
    phone: "15992677659",
    totalProgress: 35, // Total progress %
    attendanceLog: ["2025-11-30", "2025-12-03", "2025-12-04"] // Example checked dates
};

const LOG_DATA = [
    {
        id: 6,
        date: "2025-12-04",
        weekday: "周四",
        title: "短语录剪辑实操 SOP",
        type: "sop",
        tags: ["语录剪辑", "音频处理", "对标"],
        tasks: [
            { text: "环境音降噪与人声分离处理", done: false },
            { text: "快手找对标，参考封面与BGM", done: false },
            { text: "制作一条短语录视频并应用德古拉滤镜", done: false }
        ],
        results: "整理了短语录剪辑的详细SOP，包含音频降噪、字幕参数及结尾特效。",
        reflection: "短语录核心在于音乐卡点和氛围感，结尾的留白处理很重要。",
        meetingMinutes: "1. 音频：室内降噪，环境音大人声分离。\n2. 画面：根据IP开磨皮，去头去敏。\n3. 节奏：慢节奏卡点，入场闪现出场渐隐。\n4. 结尾：视频关音量，BGM 15-20，加德古拉滤镜(70)。",
        mindmapUrl: "video_sop_short_quotes.html",
        mindmapImg: "https://images.unsplash.com/photo-1478737270239-2f02b77ac618?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    {
        id: 5,
        date: "2025-12-04",
        weekday: "周四",
        title: "12.4号运营脑图 & 剪辑对接 SOP",
        type: "study",
        tags: ["养号", "运营", "剪辑对接"],
        tasks: [
            { text: "前三天视频复盘，指出需改正之处", done: false },
            { text: "对接明天素材，下班前导出并命名", done: false },
            { text: "不同平台违规词删减，封面标注", done: false }
        ],
        results: "制定了12.4号运营脑图，明确了养号、选题及发文策略。",
        reflection: "需严格执行剪辑与运营的对接流程，保证素材及时交付与合规。",
        meetingMinutes: "1. 剪辑对接：\n- 前三天视频逐条复盘。\n- 每日下班前导出视频并命名发运营。\n- 根据平台要求删减违规词，封面标注平台。\n- 素材剩余1-2条时提前找运营。\n- 空闲多刷IP账号找网感。\n\n2. 素材对接：\n- 拍摄后素材上传电脑/网盘并命名。",
        mindmapUrl: "video_sop_12_4.html",
        mindmapImg: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    {
        id: 4,
        date: "2025-12-03",
        weekday: "周三",
        title: "二剪进阶 & 养号策略 (New)",
        type: "study",
        tags: ["二剪", "SOP", "会议记录"],
        tasks: [
            { text: "完善个人网站移动端，更新页面样式", done: true },
            { text: "学习剧情/口播二剪技巧 (SOP梳理)", done: true },
            { text: "参观学习拍摄技巧", done: true }
        ],
        results: "1. 下午两点半办入职\n2. 办手机卡四张\n3. 学完剩余课程\n4.注册五组号",
        reflection: "1. 完善个人网站移动端，更新页面样式。\n2. 学习了二剪技巧，重点在于差异化和高效去重。\n3. 参观学习了拍摄技巧，为后续实拍积累经验。",
        meetingMinutes: "1. 态度：带着相信自己能做好的态度去做。\n2. 养号：五组号养三天，约15条视频。没破千/万流量的号果断废弃，筛选2-3个最好的。\n3. 对标：养号阶段多刷对标账号。\n4. 违规：有违规或破万视频截图发给丹姐。\n5. 分工：燕姐剪辑发布以快手视频号为主。",
        mindmapUrl: "video_sop_editing_v2.html",
        mindmapImg: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    {
        id: 3,
        date: "2025-11-30",
        weekday: "周日",
        title: "剧情类短视频剪辑SOP", // Explicit Title
        type: "sop",
        tags: ["剧情剪辑", "风控"],
        tasks: [
            { text: "待更新", done: true }, 
            { text: "待更新", done: true },
            { text: "待更新", done: true },
            { text: "待更新", done: false }
        ],
        results: "做出了第一天学习总结，入职体验。\n搭建了个人复盘网站的1.0版本。",
        reflection: "11.30日第一天入职，最震撼的是公司的氛围环境和楼下的豪车，我更坚定了来到肖总团队的选择\n丹丹姐带我参观公司，超耐心负责温柔地跟我讲解工作安排，一步步地帮我解决入职，设备准备，等一些列问题，让我很快地融入这个大家庭，能踏实的开始第一天的剪辑学习\n身边的伙伴也都很有耐心地带我快速融入环境\n第一天看了肖总的企业文化课，懂得了感恩 利他 分享 共赢的公司文化    学习了口播剪辑 剧情剪辑的基础课，有了进一步的了解，做了思维脑图。\n虽然说第一天能学到的东西有限，但我却感受到了很好的工作环境，很友善的导师，伙伴，真的很荣幸\n瓦片也有翻身日，东风也有转南时！",
        meetingMinutes: "早会记录：\n1. 强调了团队协作的重要性。\n2. 新人入职流程优化讨论。\n\n夕会复盘：\n- 今日全员目标达成率 90%。\n- 明日重点：剧情账号的脚本打磨。",
        mindmapUrl: "logs/video_sop_drama_version.html",
        mindmapImg: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
    },
    {
        id: 2,
        date: "2025-11-29",
        weekday: "周六",
        title: "短视频剪辑SOP (全量细节版)", // Explicit Title
        type: "study",
        tags: ["基础SOP", "违禁词"],
        tasks: [
            { text: "观看3个大V的剪辑拆解视频", done: true },
            { text: "尝试模仿'微交互'动效", done: true }
        ],
        results: "整理了《短视频剪辑运营SOP (全量细节版)》，包含敏感词对照、违规话术及完整歌单。",
        reflection: "剪辑节奏还需要打磨，特别是音乐卡点。",
        mindmapUrl: "logs/video_sop_full_detail_v3.html",
        mindmapImg: "https://images.unsplash.com/photo-1535905557558-afc4877a26fc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    }
];

const GROWTH_STATS = [
    { week: 'W1', count: 2, height: 30, tip: '起步期：摸索软件' },
    { week: 'W2', count: 5, height: 50, tip: '加速期：熟悉快捷键' },
    { week: 'W3', count: 3, height: 40, tip: '瓶颈期：追求质量' },
    { week: 'W4', count: 7, height: 80, tip: '突破期：SOP化生产' },
    { week: 'W5', count: 0, height: 10, tip: '本周：暂无数据' } // Current
];
