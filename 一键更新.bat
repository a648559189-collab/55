@echo off
chcp 65001
echo ==========================================
echo       自动部署脚本 (Auto Deploy)
echo ==========================================
echo.

:: 检查是否有远程仓库
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] 尚未关联 GitHub 远程仓库
    echo 请去 https://github.com/new 创建一个空仓库
    echo.
    set /p repo_url="请输入 GitHub 仓库地址 (例如 https://github.com/username/repo.git): "
    git remote add origin %repo_url%
    git branch -M main
    echo.
    echo 正在推送到远程仓库...
    git push -u origin main
    echo.
    echo [OK] 关联成功！以后修改代码后，直接双击本脚本即可更新。
    echo.
    pause
    exit
)

echo [1/3] 正在添加文件...
git add .

echo [2/3] 正在提交更改...
set /p commit_msg="请输入更新说明 (直接回车默认为 Update): "
if "%commit_msg%"=="" set commit_msg=Update
git commit -m "%commit_msg%"

echo [3/3] 正在推送到云端...
git push

echo.
echo [SUCCESS] 更新已推送! 
echo Netlify 将在几秒钟内自动捕获更新并发布。
echo.
pause
