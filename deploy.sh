#!/bin/bash

# Cross-Border Sales Agent - 一键部署脚本
# 使用方法：./deploy.sh

set -e

echo "🚀 Cross-Border Sales Agent - 一键部署"
echo "======================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker 未安装，请先安装 Docker${NC}"
        echo "https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${YELLOW}⚠️  docker-compose 未安装，尝试使用 docker compose${NC}"
        DOCKER_COMPOSE_CMD="docker compose"
    else
        DOCKER_COMPOSE_CMD="docker-compose"
    fi
    
    echo -e "${GREEN}✅ Docker 检查通过${NC}"
}

# 检查配置文件
check_config() {
    if [ ! -f .env.production ]; then
        echo -e "${YELLOW}⚠️  .env.production 不存在，从模板复制${NC}"
        cp .env.production.example .env.production
        echo -e "${YELLOW}请编辑 .env.production 文件，填入必要的配置${NC}"
        echo -e "${YELLOW}必须配置：APIFY_TOKEN, BREVO_API_KEY, JWT_SECRET${NC}"
        echo ""
        read -p "按回车键继续..."
    fi
    
    echo -e "${GREEN}✅ 配置文件检查通过${NC}"
}

# 创建必要目录
create_directories() {
    echo "📁 创建必要目录..."
    mkdir -p nginx/ssl
    mkdir -p database
    mkdir -p logs
    mkdir -p uploads
    
    # 设置权限
    chmod 755 nginx/ssl database logs uploads
    
    echo -e "${GREEN}✅ 目录创建完成${NC}"
}

# 生成 JWT Secret（如果未设置）
generate_jwt_secret() {
    if grep -q "JWT_SECRET=change_this" .env.production; then
        echo "🔐 生成 JWT Secret..."
        JWT_SECRET=$(openssl rand -hex 32)
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=${JWT_SECRET}/" .env.production
        echo -e "${GREEN}✅ JWT Secret 已生成${NC}"
    fi
}

# 构建镜像
build_images() {
    echo "🔨 构建 Docker 镜像..."
    $DOCKER_COMPOSE_CMD build
    
    echo -e "${GREEN}✅ 镜像构建完成${NC}"
}

# 启动服务
start_services() {
    echo "🚀 启动服务..."
    $DOCKER_COMPOSE_CMD up -d
    
    echo -e "${GREEN}✅ 服务启动完成${NC}"
}

# 等待服务就绪
wait_for_services() {
    echo "⏳ 等待服务启动..."
    sleep 10
    
    # 检查应用健康状态
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 服务健康检查通过${NC}"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ 服务启动超时${NC}"
    return 1
}

# 创建初始数据
create_initial_data() {
    echo "📝 创建初始数据..."
    
    # 获取应用容器 ID
    CONTAINER_ID=$(docker ps -q -f name=cross-border-sales-app)
    
    if [ -n "$CONTAINER_ID" ]; then
        # 执行数据库初始化脚本
        docker exec $CONTAINER_ID node scripts/create-demo-data.js 2>/dev/null || true
        echo -e "${GREEN}✅ 初始数据创建完成${NC}"
    fi
}

# 显示部署信息
show_info() {
    echo ""
    echo "======================================="
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo "======================================="
    echo ""
    echo "📍 访问地址：http://localhost"
    echo "📍 API 地址：http://localhost/api/v1"
    echo ""
    echo "👤 默认管理员账号："
    echo "   邮箱：admin@demo.com"
    echo "   密码：123456"
    echo ""
    echo "🔧 常用命令："
    echo "   查看日志：docker-compose logs -f app"
    echo "   重启服务：docker-compose restart"
    echo "   停止服务：docker-compose down"
    echo "   更新服务：./deploy.sh --update"
    echo ""
    echo "📖 文档：https://github.com/your-repo/cross-border-sales-agent"
    echo ""
}

# 更新服务
update_services() {
    echo "🔄 更新服务..."
    
    # 拉取最新代码
    git pull origin main 2>/dev/null || true
    
    # 重新构建并启动
    $DOCKER_COMPOSE_CMD down
    $DOCKER_COMPOSE_CMD build --no-cache
    $DOCKER_COMPOSE_CMD up -d
    
    echo -e "${GREEN}✅ 更新完成${NC}"
}

# 主函数
main() {
    case "${1:-}" in
        --update)
            update_services
            ;;
        --stop)
            docker-compose down
            echo -e "${GREEN}✅ 服务已停止${NC}"
            ;;
        --restart)
            docker-compose restart
            echo -e "${GREEN}✅ 服务已重启${NC}"
            ;;
        --logs)
            docker-compose logs -f app
            ;;
        --help)
            echo "使用方法：./deploy.sh [选项]"
            echo ""
            echo "选项:"
            echo "  --update    更新服务到最新版本"
            echo "  --stop      停止服务"
            echo "  --restart   重启服务"
            echo "  --logs      查看日志"
            echo "  --help      显示帮助"
            echo ""
            ;;
        *)
            check_docker
            check_config
            generate_jwt_secret
            create_directories
            build_images
            start_services
            wait_for_services
            create_initial_data
            show_info
            ;;
    esac
}

main "$@"
