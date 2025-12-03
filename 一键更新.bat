@echo off
setlocal enabledelayedexpansion
chcp 65001
cls
echo ==========================================
echo       自动部署脚本 (Auto Deploy) v2.1
echo ==========================================
echo.

:: 1. 检查 Git 环境
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] 未检测到 Git，请先安装 Git！
    pause
    exit
)

:: 2. 检查是否有远程仓库关联
git remote get-url origin >nul 2>&1
if %errorlevel% equ 0 goto :start_deploy

echo [!] 尚未关联 GitHub 远程仓库
echo.
echo 请去 https://github.com/new 创建一个空仓库
echo 提示：创建时【不要】勾选 "Initialize with a README"
echo.

:input_url
set /p repo_url="请输入 GitHub 仓库地址 (例如 https://github.com/username/repo.git): "

:: 去除可能存在的引号
set repo_url=!repo_url:"=!
:: 去除空格 (简单的处理，防止用户误输入空格)
set repo_url=!repo_url: =!

if "!repo_url!"=="" (
    echo [!] 地址不能为空，请重新输入！
    goto :input_url
)

echo.
echo 正在关联仓库: !repo_url!
git remote add origin !repo_url!

if %errorlevel% neq 0 (
    echo [!] 关联失败，请检查地址格式是否正确。
    echo 如果提示 "remote origin already exists"，请先运行: git remote remove origin
    pause
    exit
)
echo [OK] 仓库关联成功！
echo.

:start_deploy
:: 3. 提交代码
echo [1/3] 正在添加文件...
git add .

echo [2/3] 正在提交更改...
git commit -m "Update site content"

:: 4. 推送代码
echo [3/3] 正在推送到云端...
:: 确保本地分支名为 main
git branch -M main
:: 强制推送到远程 main 分支
git push -u origin main --force

if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo [SUCCESS] 更新已成功推送到 GitHub! 
    echo Netlify 将在 15-30 秒内自动捕获并发布。
    echo ==========================================
) else (
    echo.
    echo [!] 推送失败。
    echo 可能的原因：
    echo 1. 网络连接问题
    echo 2. GitHub 权限问题 (尚未登录)
    echo.
    echo 请尝试在命令行运行 'git push' 查看详细错误。
)

echo.
pause
