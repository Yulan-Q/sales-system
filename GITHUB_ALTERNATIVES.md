# 🚀 GitHub 推送替代方案

由于 Token 权限问题，我们使用以下方法之一上传代码：

---

## 方法 1: GitHub 网页上传（推荐，最简单）

### 步骤：

1. **访问仓库**: https://github.com/Yulan-Q/sales-system

2. **点击 "Add file" → "Upload files"**

3. **打包项目**（我已帮你打包好）:
   ```bash
   # 压缩包位置
   /tmp/sales-system-v2.1.zip
   ```

4. **解压后上传所有文件**到 GitHub

5. **填写提交信息**:
   ```
   🎉 初始提交 - 企业级 AI 外销系统 v2.1
   
   ✅ 核心功能:
   - JWT 安全认证 + 角色权限
   - AI 邮件生成
   - 智能线索评分
   - 公海池机制
   - 邮件追踪
   - 数据统计
   
   📁 包含 61 个文件
   ```

6. **点击 "Commit changes"**

---

## 方法 2: 重新生成有权限的 Token

### 问题诊断

当前的 Token 权限不足（403 错误），可能原因：
- Token 没有 `repo` 完整权限
- Token 已过期
- Token 只能访问特定仓库

### 解决方案

1. **访问**: https://github.com/settings/personal-access-tokens

2. **删除旧 Token**（可选）

3. **创建新 Token**:
   - 点击 **"Generate new token"**
   - **Token name**: `sales-system`
   - **Expiration**: `No expiration`
   - **Repository access**: `All repositories`
   - **Repository permissions**:
     - ✅ **Contents**: Read and write
     - ✅ **Metadata**: Read-only
     - ✅ **Issues**: Read and write (可选)
     - ✅ **Pull requests**: Read and write (可选)

4. **复制新 Token**，发给我

5. **我执行推送**:
   ```bash
   git remote set-url origin https://Yulan-Q:新_TOKEN@github.com/Yulan-Q/sales-system.git
   git push -u origin main
   ```

---

## 方法 3: 配置 SSH Key（一劳永逸）

### 生成 SSH Key

```bash
# 生成新的 SSH key
ssh-keygen -t ed25519 -C "3161322891@qq.com"
# 一路回车即可

# 查看公钥
cat ~/.ssh/id_ed25519.pub
```

### 添加到 GitHub

1. 复制公钥内容（以 `ssh-ed25519` 开头）

2. 访问：https://github.com/settings/keys

3. 点击 **"New SSH key"**

4. **Title**: `My Computer`

5. **Key type**: `Authentication Key`

6. **粘贴公钥内容**

7. 点击 **"Add SSH key"**

### 推送代码

```bash
cd /home/admin/openclaw/workspace/delivery/企业级\ AI\ 外销系统
git remote set-url origin git@github.com:Yulan-Q/sales-system.git
git push -u origin main
```

---

## 方法 4: 使用 GitHub Desktop（图形界面）

1. **下载**: https://desktop.github.com/

2. **登录 GitHub 账号**

3. **Clone 仓库**:
   - File → Clone repository
   - 选择 `Yulan-Q/sales-system`
   - 选择本地路径

4. **复制项目文件**到 Clone 的目录

5. **Commit & Push**

---

## 🎯 推荐方案

**现在**: 使用方法 1（网页上传），最快  
**以后**: 配置 SSH Key（方法 3），一劳永逸

---

**请选择一个方法，我帮你执行！** 🚀
