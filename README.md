# GitHub文件管理器 - Cloudflare Worker

一个基于Cloudflare Worker的GitHub文件管理工具，支持通过网页界面上传、下载、预览和删除GitHub仓库中的文件，具备完整的用户认证系统。

## 功能特性

### 核心功能
- 📁 查看GitHub仓库指定文件夹的文件列表
- ⬆️ 多文件上传（支持批量上传和进度显示）
- 👁️ 文件预览（图片、文档等直接在浏览器中查看）
- ⬇️ 文件下载
- 🗑️ 文件删除
- 🔐 用户登录认证系统
- 🌐 基于Web的友好界面
- 🔒 通过GitHub Token进行安全认证

### 高级特性
- 🔄 动态路径管理（支持任意数量GitHub文件夹）
- 📊 多文件上传进度条
- 🔍 文件筛选和选择管理
- 🎯 智能文件类型检测
- 📱 响应式设计，支持移动设备

## 环境配置

### 基础配置

在项目根目录创建 `.env` 文件（已存在）：

```env
# GitHub API配置
GITHUB_TOKEN=ghp_your_token_here
GITHUB_OWNER=your_username
GITHUB_REPO=your_repository
GITHUB_BRANCH=main

# 登录认证配置
LOGIN_USERNAME=admin
LOGIN_PASSWORD=your_secure_password
SESSION_SECRET=your_unique_session_secret
SESSION_MAX_AGE=3600

# 动态路径配置（支持任意数量）
GITHUB_PATH1=docs/images
GITHUB_PATH1_NAME=文档图片
GITHUB_PATH2=assets/files
GITHUB_PATH2_NAME=资源文件
GITHUB_PATH3=uploads
GITHUB_PATH3_NAME=上传文件
# 可以继续添加更多路径...
```
或者直接修改 `wrangler.toml` 文件
```wrangler.toml
[vars]
GITHUB_TOKEN = "ghp_token"
GITHUB_OWNER = "github_username"
GITHUB_REPO = "repo"
GITHUB_BRANCH = "main"
GITHUB_PATH1 = "1"
GITHUB_PATH1_NAME = "1路径描述"
GITHUB_PATH2 = "2"
GITHUB_PATH2_NAME = "2路径描述"
```

### Cloudflare环境变量

在Cloudflare Dashboard中设置以下环境变量：

**GitHub配置**
- `GITHUB_TOKEN`: GitHub个人访问令牌
- `GITHUB_OWNER`: 仓库所有者用户名
- `GITHUB_REPO`: 仓库名称
- `GITHUB_BRANCH`: 分支名称（默认：main）

**登录认证配置**
- `LOGIN_USERNAME`: 登录用户名（默认：admin）
- `LOGIN_PASSWORD`: 登录密码
- `SESSION_SECRET`: 会话密钥（用于Cookie加密）
- `SESSION_MAX_AGE`: 会话有效期（秒，默认3600）

**动态路径配置**
- `GITHUB_PATH1`, `GITHUB_PATH2`, ...: 仓库内的文件夹路径
- `GITHUB_PATH1_NAME`, `GITHUB_PATH2_NAME`, ...: 路径的显示名称（可选）

## GitHub Token权限

确保您的GitHub Token具有以下权限：
- `repo` (完全控制私有仓库)
- 或者 `public_repo` (仅公开仓库)

## 安装和部署

### 1. 安装依赖

```bash
npm install
```

### 2. 本地开发

```bash
npm run dev
```

### 3. 部署到Cloudflare

## 使用说明

### 登录系统

1. **首次访问**: 访问任何页面将自动重定向到登录页面
2. **输入凭据**: 使用配置的用户名和密码登录
3. **会话管理**: 登录后保持会话，可随时登出
4. **安全保护**: 所有管理页面都需要登录才能访问

### 动态路径管理

项目支持任意数量的GitHub文件夹路径：

1. **访问根路径** (`/`): 显示路径选择界面，列出所有配置的路径
2. **访问具体路径** (`/path1`, `/path2`, `/path3`, ...): 进入对应路径的文件管理界面
3. **路径切换**: 通过页面顶部的导航按钮在不同路径间切换

### 文件操作

#### 文件上传
- **单文件上传**: 可选择文件并自定义文件名
- **多文件上传**: 支持批量选择多个文件
- **进度显示**: 实时显示每个文件的上传进度
- **文件管理**: 显示已选择文件列表，支持筛选和删除

#### 文件预览
- **支持格式**: JPG、PNG、GIF、BMP、WebP、SVG、PDF、TXT、MD、HTML、XML、JSON、CSV、LOG
- **预览方式**: 点击"查看"按钮在新标签页中打开文件
- **自适应显示**: 图片和文档自动适应浏览器窗口

#### 文件下载和删除
- **下载**: 点击"下载"按钮保存文件到本地
- **删除**: 点击"删除"按钮从GitHub仓库移除文件

### 界面功能

#### 文件列表管理
- **自动刷新**: 页面加载时自动获取文件列表
- **操作按钮**: 每个文件提供查看、下载、删除操作
- **智能显示**: 仅对可预览文件显示查看按钮

#### 上传界面
- **文件选择**: 支持多文件选择和拖拽（浏览器支持）
- **文件名管理**: 单文件可自定义文件名，多文件保持原名称
- **进度监控**: 实时显示上传进度和状态
- **文件筛选**: 可对已选择文件进行搜索筛选



## 安全特性

### 认证安全
- **会话管理**: 使用HttpOnly Cookie存储会话令牌
- **密码保护**: 所有管理操作需要登录认证
- **会话超时**: 可配置的会话有效期
- **安全登出**: 彻底清除会话信息

### 数据安全
- **GitHub Token保护**: 通过环境变量安全存储
- **输入验证**: 服务器端验证所有用户输入
- **XSS防护**: 所有动态内容都进行HTML转义
- **路径安全**: 防止路径遍历攻击

### 操作安全
- **文件类型验证**: 限制可上传的文件类型
- **大小限制**: 遵守GitHub API的文件大小限制
- **错误处理**: 完善的错误处理和用户提示

## 文件结构

```
├── index.js          # Cloudflare Worker主文件（包含所有功能）
├── wrangler.toml     # Wrangler配置文件
├── package.json      # 项目依赖配置
├── .env              # 环境变量（本地开发）
└── README.md         # 项目说明
```

## 技术栈

- **Cloudflare Workers**: 无服务器计算平台
- **GitHub REST API**: 文件操作接口
- **HTML5/CSS3/JavaScript**: 现代化前端界面
- **Wrangler**: Cloudflare Workers开发工具

## 故障排除

### 常见问题

1. **401错误（认证失败）**
   - 检查GitHub Token是否有效
   - 验证Token权限是否足够
   - 确认仓库、分支、路径是否存在

2. **登录问题**
   - 检查登录凭据是否正确
   - 验证环境变量配置
   - 清除浏览器Cookie后重试

3. **文件上传失败**
   - 检查文件大小（GitHub API限制）
   - 验证文件类型是否支持
   - 检查网络连接

4. **预览功能问题**
   - 确认文件类型是否支持预览
   - 检查浏览器是否支持该文件类型
   - 验证文件内容是否完整

### 调试技巧

- 使用浏览器开发者工具查看网络请求
- 检查Cloudflare Worker日志
- 验证环境变量配置是否正确


## 浏览器兼容性

- **桌面浏览器**: Chrome、Firefox、Safari、Edge（最新版本）
- **移动浏览器**: iOS Safari、Android Chrome
- **技术要求**: 支持ES6+ JavaScript、Fetch API、FormData

## 更新日志

### v2.0 新增功能
- 🔐 完整的用户登录认证系统
- 👁️ 文件预览功能（图片、文档等）
- 📦 多文件上传支持
- 📊 上传进度条显示
- 🔍 文件筛选和管理功能
- 🎯 智能文件类型检测
- 📱 响应式界面优化

### v1.0 基础功能
- 📁 基础文件管理（上传、下载、删除）
- 🔄 动态路径支持
- 🌐 Web界面

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。