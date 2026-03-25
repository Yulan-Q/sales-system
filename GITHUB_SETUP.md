# 🚀 推送到 GitHub 指南

## 步骤 1: 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名：`ai-sales-system`（或其他你喜欢的名字）
3. 描述：`企业级 AI 外销系统 - 线索挖掘、智能评分、邮件生成、邮件追踪、CRM 管理`
4. 选择 **Public**（公开）或 **Private**（私有）
5. **不要** 勾选 "Initialize this repository with a README"（我们已经有了）
6. 点击 "Create repository"

---

## 步骤 2: 添加远程仓库并推送

创建好仓库后，GitHub 会显示推送命令。执行以下命令（替换 YOUR_USERNAME 为你的 GitHub 用户名）：

```bash
# 进入项目目录
cd /home/admin/openclaw/workspace/delivery/企业级 AI 外销系统

# 添加远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/ai-sales-system.git

# 或者使用 SSH（如果你配置了 SSH key）
# git remote add origin git@github.com:YOUR_USERNAME/ai-sales-system.git

# 推送到 GitHub
git push -u origin main
```

---

## 步骤 3: 验证推送

推送成功后，访问你的 GitHub 仓库：
```
https://github.com/YOUR_USERNAME/ai-sales-system
```

应该能看到所有文件！

---

## 步骤 4: 后续更新

以后每次修改后：

```bash
# 查看更改
git status

# 添加更改
git add .

# 提交（写上清晰的提交信息）
git commit -m "✨ 新增：邮件追踪功能"

# 推送到 GitHub
git push
```

---

## 🔐 使用 SSH（推荐）

如果你经常使用 git，建议配置 SSH key：

```bash
# 生成 SSH key（如果还没有）
ssh-keygen -t ed25519 -C "your_email@example.com"

# 查看公钥
cat ~/.ssh/id_ed25519.pub

# 复制公钥内容，添加到 GitHub:
# Settings → SSH and GPG keys → New SSH key
```

然后使用 SSH 地址：
```bash
git remote add origin git@github.com:YOUR_USERNAME/ai-sales-system.git
git push -u origin main
```

---

## 📝 推荐的提交信息格式

```
✨ 新增：邮件追踪功能
🐛 修复：线索评分计算错误
📝 文档：更新 README
🎨 样式：优化 UI 布局
🚀 性能：优化数据库查询
🔒 安全：加强 JWT 认证
```

---

## 🎯 下一步

推送成功后：

1. 更新 README.md 中的 GitHub 链接
2. 添加项目截图到 docs/ 目录
3. 在 GitHub 上添加项目标签（topics）
4. 邀请协作者（如果有）

---

**干就完了！** 💪🔥
