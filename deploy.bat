@echo off
REM Cross-Border Sales Agent - Windows 部署脚本

echo ========================================
echo Cross-Border Sales Agent - Windows 部署
echo ========================================
echo.

REM 检查 Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker 未安装
    echo 请先安装 Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [OK] Docker 检查通过
echo.

REM 检查配置文件
if not exist .env.production (
    echo [WARN] .env.production 不存在，从模板复制
    copy .env.production.example .env.production
    
    echo.
    echo 请编辑 .env.production 文件，填入必要的配置
    echo 必须配置：APIFY_TOKEN, BREVO_API_KEY, JWT_SECRET
    echo.
    pause
)

REM 创建目录
if not exist nginx\ssl mkdir nginx\ssl
if not exist database mkdir database
if not exist logs mkdir logs
if not exist uploads mkdir uploads

echo.
echo [INFO] 构建 Docker 镜像...
docker-compose build

echo.
echo [INFO] 启动服务...
docker-compose up -d

echo.
echo [INFO] 等待服务启动...
timeout /t 15 /nobreak >nul

echo.
echo ========================================
echo 部署完成！
echo ========================================
echo.
echo 访问地址：http://localhost
echo API 地址：http://localhost/api/v1
echo.
echo 默认管理员账号:
echo   邮箱：admin@demo.com
echo   密码：123456
echo.
echo 常用命令:
echo   查看日志：docker-compose logs -f app
echo   重启服务：docker-compose restart
echo   停止服务：docker-compose down
echo.

pause
