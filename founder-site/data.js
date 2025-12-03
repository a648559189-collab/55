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
