const fs = require('fs');
const path = require('path');
const readline = require('readline');

const dataPath = path.join(__dirname, 'data.json');

// Create Readline Interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.log("\n🚀 筑梦OS 日志更新程序 v1.0");
    console.log("=================================");

    // 1. Read Data
    let data;
    try {
        const fileContent = fs.readFileSync(dataPath, 'utf8');
        data = JSON.parse(fileContent);
    } catch (e) {
        console.error("❌ 读取 data.json 失败:", e.message);
        process.exit(1);
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const weekdayMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const currentWeekday = weekdayMap[new Date().getDay()];

    console.log(`\n📅 默认日期: ${today} (${currentWeekday})`);
    
    // 2. Get User Input
    const dateInput = await ask(`输入日期 (直接回车使用默认): `);
    const targetDate = dateInput.trim() || today;
    
    // Check if log exists
    let logIndex = data.logs.findIndex(l => l.date === targetDate);
    let logEntry;

    if (logIndex !== -1) {
        console.log(`\n✅ 找到 ${targetDate} 的日志，正在更新...`);
        logEntry = data.logs[logIndex];
    } else {
        console.log(`\n🆕 创建 ${targetDate} 的新日志...`);
        logEntry = {
            id: data.logs.length + 10, // Simple ID gen
            date: targetDate,
            weekday: weekdayMap[new Date(targetDate).getDay()] || currentWeekday,
            title: `运营复盘 ${targetDate.slice(5)}`,
            type: "study",
            tags: ["日常复盘"],
            tasks: [],
            results: "",
            reflection: "",
            meetingMinutes: "",
            mindmapUrl: "",
            mindmapImg: ""
        };
        // Add to beginning
        data.logs.unshift(logEntry);
        logIndex = 0;
    }

    console.log("\n请填写以下板块 (输入 'skip' 跳过该项修改):");
    
    const reflection = await ask(`\n💡 每日总结 (Reflection) [当前: ${logEntry.reflection.slice(0, 20)}...]:\n> `);
    if (reflection.trim() !== 'skip' && reflection.trim() !== '') logEntry.reflection = reflection;

    const progress = await ask(`\n📝 今日进度/工作 (Results) [当前: ${logEntry.results.slice(0, 20)}...]:\n> `);
    if (progress.trim() !== 'skip' && progress.trim() !== '') logEntry.results = progress;

    const plan = await ask(`\n🚀 明日规划/会议记录 (Meeting/Plan) [当前: ${logEntry.meetingMinutes.slice(0, 20)}...]:\n> `);
    if (plan.trim() !== 'skip' && plan.trim() !== '') logEntry.meetingMinutes = plan;

    // 3. Save
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 4), 'utf8');
    console.log("\n💾 数据已保存至 data.json");

    // 4. Handle Deployment (Mock)
    console.log("\n🌐 提示: 若要让其他人看到更新，请执行部署 (Deploy)。");
    const deploy = await ask("是否尝试自动部署? (y/n): ");
    
    if (deploy.toLowerCase() === 'y') {
        console.log("正在调用部署命令...");
        // Here we would call a shell command. Since this is running in Node, we can spawn a process.
        // But user environment might differ.
        console.log("⚠️ 注意: 请确保在 Windsurf 中点击 'Deploy Web App' 或运行 'netlify deploy --prod'");
    }

    rl.close();
}

main();
