// 获取所有路径配置
function getPathConfig(env) {
  const paths = [];
  
  // 基础路径（兼容旧版本）
  if (env.GITHUB_PATH) {
    paths.push({
      name: 'default',
      displayName: '默认路径',
      path: env.GITHUB_PATH
    });
  }
  
  // 动态路径配置
  let i = 1;
  while (true) {
    const pathKey = `GITHUB_PATH${i}`;
    const nameKey = `GITHUB_PATH${i}_NAME`;
    
    if (!env[pathKey]) break;
    
    paths.push({
      name: `path${i}`,
      displayName: env[nameKey] || `路径${i}`,
      path: env[pathKey]
    });
    i++;
  }
  
  // 如果没有配置任何路径，使用默认值
  if (paths.length === 0) {
    paths.push({
      name: 'default',
      displayName: '默认路径',
      path: ''
    });
  }
  
  return paths;
}

// 简单的会话管理（使用Cookie）
function generateSessionToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// 验证会话
function verifySession(request, env) {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return false;
  
  const cookies = new Map(cookieHeader.split(';').map(c => {
    const [key, value] = c.trim().split('=');
    return [key, value];
  }));
  
  const sessionToken = cookies.get('session_token');
  const expectedToken = env.SESSION_SECRET || 'default-session-secret';
  
  return sessionToken === expectedToken;
}

// 设置会话Cookie
function setSessionCookie(response, env) {
  const sessionToken = env.SESSION_SECRET || 'default-session-secret';
  const maxAge = parseInt(env.SESSION_MAX_AGE) || 3600;
  
  response.headers.set('Set-Cookie', `session_token=${sessionToken}; Max-Age=${maxAge}; HttpOnly; Path=/`);
  return response;
}

// 清除会话Cookie
function clearSessionCookie(response) {
  response.headers.set('Set-Cookie', 'session_token=; Max-Age=0; HttpOnly; Path=/');
  return response;
}

// 登录页面HTML
function getLoginHTML(error = '') {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitHub文件管理器 - 登录</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
        }
        .login-header {
            text-align: center;
            margin-bottom: 30px;
        }
        .login-header h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .login-header p {
            color: #666;
            font-size: 14px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #333;
            font-weight: bold;
        }
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
        }
        .error-message {
            color: #e74c3c;
            font-size: 14px;
            margin-bottom: 15px;
            text-align: center;
            display: ${error ? 'block' : 'none'};
        }
        .login-btn {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .login-btn:hover {
            transform: translateY(-2px);
        }
        .login-btn:active {
            transform: translateY(0);
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-header">
            <h1>GitHub文件管理器</h1>
            <p>请输入用户名和密码登录系统</p>
        </div>
        
        <div class="error-message" id="errorMessage">${error}</div>
        
        <form id="loginForm" method="POST" action="/api/login">
            <div class="form-group">
                <label for="username">用户名</label>
                <input type="text" id="username" name="username" required>
            </div>
            
            <div class="form-group">
                <label for="password">密码</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <button type="submit" class="login-btn">登录</button>
        </form>
    </div>
    
    <script>
        // 显示错误信息
        const errorMessage = '${error}';
        if (errorMessage) {
            document.getElementById('errorMessage').style.display = 'block';
        }
        
        // 表单提交处理
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (!username || !password) {
                e.preventDefault();
                alert('请输入用户名和密码');
            }
        });
    </script>
</body>
</html>
  `;
}

// 登录处理函数
async function handleLogin(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  
  try {
    const formData = await request.formData();
    const username = formData.get('username');
    const password = formData.get('password');
    
    const expectedUsername = env.LOGIN_USERNAME || 'admin';
    const expectedPassword = env.LOGIN_PASSWORD || 'password123';
    
    if (username === expectedUsername && password === expectedPassword) {
      // 登录成功，设置会话Cookie并重定向到主页
      const response = new Response(null, {
        status: 302,
        headers: { 'Location': '/' }
      });
      return setSessionCookie(response, env);
    } else {
      // 登录失败，返回登录页面并显示错误信息
      return new Response(getLoginHTML('用户名或密码错误'), {
        status: 401,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
  } catch (error) {
    return new Response(getLoginHTML('登录请求格式错误'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

// 登出处理函数
async function handleLogout(request, env) {
  const response = new Response(null, {
    status: 302,
    headers: { 'Location': '/login' }
  });
  return clearSessionCookie(response);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathConfigs = getPathConfig(env);
    
    // 登录页面（不需要认证）
    if (url.pathname === '/login') {
      return new Response(getLoginHTML(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    
    // 登录API（不需要认证）
    if (url.pathname === '/api/login') {
      return await handleLogin(request, env);
    }
    
    // 登出API（需要认证）
    if (url.pathname === '/api/logout') {
      if (!verifySession(request, env)) {
        return new Response(null, {
          status: 302,
          headers: { 'Location': '/login' }
        });
      }
      return await handleLogout(request, env);
    }
    
    // 检查会话认证（除了登录相关页面）
    if (!verifySession(request, env)) {
      // 未登录，重定向到登录页面
      return new Response(null, {
        status: 302,
        headers: { 'Location': '/login' }
      });
    }
    
    // 处理根路径，显示路径选择界面
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(getPathSelectionHTML(pathConfigs), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    
    // 处理具体路径的界面
    const pathMatch = url.pathname.match(/^\/(path\d+|default)(\.html)?$/);
    if (pathMatch) {
      const pathName = pathMatch[1];
      const pathConfig = pathConfigs.find(p => p.name === pathName);
      
      if (pathConfig) {
        return new Response(getFileManagerHTML(pathConfig, pathConfigs, env), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
    }
    
    // 处理API请求
    const apiMatch = url.pathname.match(/^\/api\/files(?:\/(path\d+|default))?$/);
    if (apiMatch) {
      const pathName = apiMatch[1] || 'default';
      const pathConfig = pathConfigs.find(p => p.name === pathName);
      
      if (pathConfig) {
        if (request.method === 'GET') {
          return await getFiles(env, pathConfig);
        } else if (request.method === 'POST') {
          return await uploadFile(request, env, pathConfig);
        } else if (request.method === 'DELETE') {
          return await deleteFile(request, env, pathConfig);
        } else if (request.method === 'PUT') {
          return await updateFile(request, env, pathConfig);
        }
      }
    }
    
    // 处理编辑页面
    if (url.pathname === '/edit') {
      const filename = url.searchParams.get('filename');
      const sha = url.searchParams.get('sha');
      const filePath = url.searchParams.get('path');
      
      if (!filename || !sha || !filePath) {
        return new Response('缺少必要参数', { status: 400 });
      }
      
      return new Response(getEditFileHTML(filename, sha, filePath, env), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    
    // 处理下载代理请求
    if (url.pathname === '/api/download') {
      return await downloadProxy(request, env);
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

// 获取文件列表
async function getFiles(env, pathConfig) {
  try {
    const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } = env;
    const path = pathConfig.path || '';
    
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Cloudflare-Worker'
      }
    });
    
    if (!response.ok) {
      return new Response(JSON.stringify({ 
        error: `GitHub API错误: ${response.status}` 
      }), { 
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const files = await response.json();
    
    // 过滤出文件（排除文件夹）
    const fileList = Array.isArray(files) 
      ? files.filter(item => item.type === 'file').map(item => ({
          name: item.name,
          path: item.path,
          size: item.size,
          download_url: item.download_url,
          sha: item.sha
        }))
      : [];
    
    return new Response(JSON.stringify({ files: fileList }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: `服务器错误: ${error.message}` 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 上传文件
async function uploadFile(request, env, pathConfig) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const filename = formData.get('filename') || file.name;
    
    if (!file) {
      return new Response(JSON.stringify({ error: '未选择文件' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } = env;
    const basePath = pathConfig.path || '';
    const filePath = basePath ? `${basePath}/${filename}` : filename;
    
    // 正确编码文件路径
    const encodedFilePath = encodeURIComponent(filePath);
    
    // 读取文件内容并编码为Base64
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
    }
    const content = btoa(binaryString);
    
    // 检查文件是否已存在
    const checkUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodedFilePath}`;
    const checkResponse = await fetch(checkUrl, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Cloudflare-Worker'
      }
    });
    
    let sha = null;
    if (checkResponse.status === 200) {
      const existingFile = await checkResponse.json();
      sha = existingFile.sha;
    }
    
    // 上传文件
    const uploadUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodedFilePath}`;
    const uploadData = {
      message: `Upload file: ${filename}`,
      content: content,
      branch: GITHUB_BRANCH
    };
    
    if (sha) {
      uploadData.sha = sha;
    }
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Cloudflare-Worker'
      },
      body: JSON.stringify(uploadData)
    });
    
    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.text();
      return new Response(JSON.stringify({ 
        error: `上传失败: ${uploadResponse.status}` 
      }), { 
        status: uploadResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: '文件上传成功' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: `上传错误: ${error.message}` 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 删除文件
async function deleteFile(request, env, pathConfig) {
  try {
    const { filename, sha } = await request.json();
    
    if (!filename || !sha) {
      return new Response(JSON.stringify({ error: '缺少必要参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } = env;
    
    // 构建完整的文件路径
    const basePath = pathConfig.path || '';
    const filePath = basePath ? basePath + '/' + filename : filename;
    
    // 正确编码文件路径
    const encodedFilePath = encodeURIComponent(filePath);
    const url = 'https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/contents/' + encodedFilePath;
    
    const deleteData = {
      message: `Delete file: ${filename}`,
      sha: sha,
      branch: GITHUB_BRANCH
    };
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Cloudflare-Worker'
      },
      body: JSON.stringify(deleteData)
    });
    
    if (!response.ok) {
      return new Response(JSON.stringify({ 
        error: `删除失败: ${response.status}` 
      }), { 
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: '文件删除成功' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: `删除错误: ${error.message}` 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 修改文件
async function updateFile(request, env, pathConfig) {
  try {
    const { filename, sha, content, message } = await request.json();
    
    if (!filename || !sha || !content) {
      return new Response(JSON.stringify({ error: '缺少必要参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } = env;
    
    // 构建完整的文件路径
    const basePath = pathConfig.path || '';
    const filePath = basePath ? basePath + '/' + filename : filename;
    
    // 正确编码文件路径
    const encodedFilePath = encodeURIComponent(filePath);
    const url = 'https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/contents/' + encodedFilePath;
    
    // 将内容转换为Base64（正确处理中文）
    const encoder = new TextEncoder();
    const bytes = encoder.encode(content);
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
    }
    const contentBase64 = btoa(binaryString);
    
    const updateData = {
      message: message || `Update file: ${filename}`,
      content: contentBase64,
      sha: sha,
      branch: GITHUB_BRANCH
    };
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Cloudflare-Worker'
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      return new Response(JSON.stringify({ 
        error: `修改失败: ${response.status}` 
      }), { 
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: '文件修改成功' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: `修改错误: ${error.message}` 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 下载代理
async function downloadProxy(request, env) {
  try {
    const url = new URL(request.url);
    const filePath = url.searchParams.get('path');
    const previewMode = url.searchParams.get('preview') === 'true';
    
    if (!filePath) {
      return new Response('缺少文件路径参数', { status: 400 });
    }
    
    const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } = env;
    
    // 使用GitHub API获取文件内容
    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(filePath)}?ref=${GITHUB_BRANCH}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'Cloudflare-Worker'
      }
    });
    
    if (!response.ok) {
      return new Response(`下载失败: ${response.status}`, { 
        status: response.status 
      });
    }
    
    const data = await response.json();
    
    if (!data.content) {
      return new Response('文件内容为空', { status: 404 });
    }
    
    // 根据文件扩展名设置正确的Content-Type
    const getContentType = (filename) => {
      const extension = filename.split('.').pop().toLowerCase();
      const typeMap = {
        // 图片文件
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        // 文档文件
        'pdf': 'application/pdf',
        'txt': 'text/plain',
        'md': 'text/markdown',
        'html': 'text/html',
        'htm': 'text/html',
        'xml': 'application/xml',
        'json': 'application/json',
        'csv': 'text/csv',
        'log': 'text/plain'
      };
      return typeMap[extension] || 'application/octet-stream';
    };
    
    const filename = filePath.split('/').pop();
    const contentType = getContentType(filename);
    
    // 解码Base64内容并转换为正确的格式
    const base64Content = data.content.replace(/\s/g, '');
    
    // 对于图片文件，需要转换为二进制格式
    const isImageFile = contentType.startsWith('image/');
    
    let responseContent;
    let contentLength;
    
    if (isImageFile) {
      // 图片文件：转换为Uint8Array
      const binaryString = atob(base64Content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      responseContent = bytes;
      contentLength = bytes.length.toString();
    } else {
      // 文本文件：正确处理中文的Base64解码
      const binaryString = atob(base64Content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      // 使用TextDecoder将字节转换为UTF-8字符串
      const decoder = new TextDecoder('utf-8');
      responseContent = decoder.decode(bytes);
      contentLength = (new TextEncoder().encode(responseContent)).length.toString();
    }
    
    // 设置响应头
    const headers = {
      'Content-Type': contentType,
      'Content-Length': contentLength
    };
    
    if (previewMode) {
      // 预览模式：内联显示，不下载
      headers['Content-Disposition'] = 'inline';
    } else {
      // 下载模式：强制下载，正确处理中文文件名
      // 使用更兼容的方法：只使用URL编码的文件名
      const encodedFilename = encodeURIComponent(filename);
      headers['Content-Disposition'] = `attachment; filename="${encodedFilename}"`;
    }
    
    // 返回文件内容
    return new Response(responseContent, { headers });
    
  } catch (error) {
    return new Response(`下载错误: ${error.message}`, { status: 500 });
  }
}

// 路径选择界面
function getPathSelectionHTML(pathConfigs) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitHub文件管理器 - 选择路径</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
        .header { background: #2c3e50; color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; text-align: center; position: relative; }
        .logout-btn { position: absolute; top: 20px; right: 20px; background: #e74c3c; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; text-decoration: none; }
        .logout-btn:hover { background: #c0392b; }
        .path-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .path-card { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; transition: transform 0.2s; }
        .path-card:hover { transform: translateY(-5px); }
        .path-card h3 { margin-bottom: 15px; color: #2c3e50; }
        .path-card p { color: #7f8c8d; margin-bottom: 20px; }
        .btn { background: #3498db; color: white; border: none; padding: 12px 25px; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn:hover { background: #2980b9; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>GitHub文件管理器</h1>
            <p>请选择要管理的文件夹路径</p>
            <button class="logout-btn" onclick="logout()">登出</button>
        </div>
        
        <div class="path-grid">
            ${pathConfigs.map(config => `
                <div class="path-card">
                    <h3>${config.displayName}</h3>
                    <p>路径: ${config.path || '根目录'}</p>
                    <a href="/${config.name}" class="btn">进入管理</a>
                </div>
            `).join('')}
        </div>
    </div>
    
    <script>
        // 登出函数
        function logout() {
            if (confirm('确定要登出吗？')) {
                fetch('/api/logout', {
                    method: 'POST'
                }).then(() => {
                    window.location.href = '/login';
                }).catch(error => {
                    console.error('登出失败:', error);
                    window.location.href = '/login';
                });
            }
        }
    </script>
</body>
</html>`;
}

// 文件编辑页面
function getEditFileHTML(filename, sha, filePath, env) {
  // 根据文件路径自动识别正确的路径配置
  const pathConfigs = getPathConfig(env);
  let pathName = 'default';
  
  // 查找文件所属的路径配置
  for (const config of pathConfigs) {
    if (config.path && filePath.startsWith(config.path)) {
      pathName = config.name;
      break;
    }
  }
  
  const apiBase = '/api/files/' + pathName;
  
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>编辑文件 - ${filename}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; position: relative; }
        .back-btn { position: absolute; top: 20px; left: 20px; background: #95a5a6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; text-decoration: none; }
        .back-btn:hover { background: #7f8c8d; }
        .edit-section { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .btn { background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; }
        .btn:hover { background: #2980b9; }
        .btn-success { background: #27ae60; }
        .btn-success:hover { background: #229954; }
        .btn-warning { background: #f39c12; }
        .btn-warning:hover { background: #e67e22; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input[type="text"], textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        textarea { font-family: monospace; height: 400px; resize: vertical; }
        .message { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .loading { display: none; text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <button class="back-btn" onclick="goBack()">← 返回</button>
            <h1 style="text-align: center; margin: 0;">编辑文件: ${filename}</h1>
        </div>
        
        <div class="edit-section">
            <div id="message"></div>
            <div class="loading" id="loading">加载中...</div>
            
            <div class="form-group">
                <label for="editMessage">提交信息:</label>
                <input type="text" id="editMessage" value="Update file: ${filename}">
            </div>
            
            <div class="form-group">
                <label for="editContent">文件内容:</label>
                <textarea id="editContent" placeholder="正在加载文件内容..."></textarea>
            </div>
            
            <div style="text-align: right;">
                <button class="btn btn-success" onclick="saveFileChanges()">保存修改</button>
                <button class="btn" onclick="goBack()">取消</button>
            </div>
        </div>
    </div>
    
    <script>
        const filename = '${filename}';
        const sha = '${sha}';
        const filePath = '${filePath}';
        const apiBase = '${apiBase}';
        
        // 页面加载时获取文件内容
        window.addEventListener('DOMContentLoaded', async function() {
            await loadFileContent();
        });
        
        // 加载文件内容
        async function loadFileContent() {
            const loading = document.getElementById('loading');
            const editContent = document.getElementById('editContent');
            
            loading.style.display = 'block';
            
            try {
                const response = await fetch('/api/download?path=' + encodeURIComponent(filePath));
                
                if (response.ok) {
                    const content = await response.text();
                    editContent.value = content;
                    showMessage('文件内容加载成功', 'success');
                } else {
                    showMessage('获取文件内容失败: ' + response.status, 'error');
                }
            } catch (error) {
                showMessage('加载错误: ' + error.message, 'error');
            } finally {
                loading.style.display = 'none';
            }
        }
        
        // 保存文件修改
        async function saveFileChanges() {
            const message = document.getElementById('editMessage').value;
            const content = document.getElementById('editContent').value;
            
            if (!message.trim()) {
                showMessage('请输入提交信息', 'warning');
                return;
            }
            
            if (!content.trim()) {
                showMessage('文件内容不能为空', 'warning');
                return;
            }
            
            const loading = document.getElementById('loading');
            loading.style.display = 'block';
            
            try {
                const response = await fetch(apiBase, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename, sha, content, message })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showMessage('文件修改成功', 'success');
                    setTimeout(() => {
                        goBack();
                    }, 2000);
                } else {
                    showMessage('修改失败: ' + (data.error || response.status), 'error');
                }
            } catch (error) {
                showMessage('保存错误: ' + error.message, 'error');
            } finally {
                loading.style.display = 'none';
            }
        }
        
        // 显示消息
        function showMessage(message, type) {
            const messageDiv = document.getElementById('message');
            messageDiv.innerHTML = '<div class="message ' + type + '">' + message + '</div>';
            setTimeout(() => messageDiv.innerHTML = '', 5000);
        }
        
        // 返回上一页
        function goBack() {
            window.history.back();
        }
    </script>
</body>
</html>
  `;
}

// 文件管理界面
function getFileManagerHTML(currentPathConfig, allPathConfigs, env) {
  const apiBase = `/api/files/${currentPathConfig.name}`;
  const title = `GitHub文件管理器 - ${currentPathConfig.displayName}`;
  const { GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } = env;
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script>
        // 从后端传递的环境变量
        const GITHUB_OWNER = '${GITHUB_OWNER}';
        const GITHUB_REPO = '${GITHUB_REPO}';
        const GITHUB_BRANCH = '${GITHUB_BRANCH}';
        
        // 检测文件类型是否支持预览
        function isPreviewableFile(filename) {
            const previewableExtensions = [
                // 图片文件
                'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg',
                // 文档文件
                'pdf', 'txt', 'md', 'html', 'htm', 'xml', 'json',
                // 其他可预览文件
                'csv', 'log'
            ];
            
            const extension = filename.split('.').pop().toLowerCase();
            return previewableExtensions.includes(extension);
        }
        
        // 检测文件类型是否支持编辑
        function isEditableFile(filename) {
            const editableExtensions = [
                // 文本文件
                'txt', 'md', 'html', 'htm', 'xml', 'json', 'js', 'css', 'ts',
                // 配置文件
                'yml', 'yaml', 'ini', 'conf', 'properties', 'env', 'toml',
                // 数据文件
                'csv', 'log', 'sql'
            ];
            
            const extension = filename.split('.').pop().toLowerCase();
            return editableExtensions.includes(extension);
        }
        
        // 获取文件预览URL
        function getPreviewUrl(filePath) {
            return '/api/download?path=' + encodeURIComponent(filePath) + '&preview=true';
        }
        
        // 预览文件
        function previewFile(filePath) {
            const previewUrl = getPreviewUrl(filePath);
            // 直接在新标签页打开预览URL
            window.open(previewUrl, '_blank');
        }
        
        // 下载文件
        async function downloadFile(filePath) {
            try {
                // 使用后端代理下载文件
                const response = await fetch('/api/download?path=' + encodeURIComponent(filePath));
                
                if (response.ok) {
                    // 获取文件内容和文件名
                    const blob = await response.blob();
                    
                    // 解析Content-Disposition头中的文件名
                    const contentDisposition = response.headers.get('Content-Disposition');
                    let filename = filePath.split('/').pop();
                    
                    if (contentDisposition) {
                        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
                        if (filenameMatch) {
                            // 解码URL编码的文件名
                            filename = decodeURIComponent(filenameMatch[1]);
                        }
                    }
                    
                    // 创建Blob URL
                    const blobUrl = URL.createObjectURL(blob);
                    
                    // 创建下载链接
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = filename;
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    a.click();
                    
                    // 清理资源
                    setTimeout(function() {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(blobUrl);
                    }, 100);
                    
                    showMessage('正在下载: ' + filename, 'success');
                } else {
                    const errorData = await response.text();
                    showMessage('下载失败: ' + (errorData || response.status), 'error');
                }
            } catch (error) {
                showMessage('下载错误: ' + error.message, 'error');
            }
        }
    </script>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; position: relative; }
        .logout-btn { position: absolute; top: 20px; right: 20px; background: #e74c3c; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; text-decoration: none; }
        .logout-btn:hover { background: #c0392b; }
        .upload-section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .file-list { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .btn { background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; }
        .btn:hover { background: #2980b9; }
        .btn-danger { background: #e74c3c; }
        .btn-danger:hover { background: #c0392b; }
        .btn-success { background: #27ae60; }
        .btn-success:hover { background: #229954; }
        input[type="file"] { margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: bold; }
        .message { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .loading { display: none; text-align: center; margin: 20px 0; }
        
        /* 上传进度样式 */
        .file-progress {
            margin: 10px 0;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background-color: white;
        }
        
        .file-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        
        .filename {
            font-weight: bold;
            color: #333;
        }
        
        .file-size {
            color: #666;
            font-size: 0.9em;
        }
        
        .progress-container {
            width: 100%;
            height: 20px;
            background-color: #f0f0f0;
            border-radius: 10px;
            overflow: hidden;
            margin: 5px 0;
        }
        
        .progress-bar {
            position: relative;
            height: 100%;
            width: 100%;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #45a049);
            border-radius: 10px;
            transition: width 0.3s ease;
            width: 0%;
        }
        
        .progress-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #333;
            font-size: 12px;
            font-weight: bold;
        }
        
        .status {
            font-size: 0.9em;
            margin-top: 5px;
            padding: 3px 8px;
            border-radius: 3px;
            display: inline-block;
        }
        
        .status.uploading { background-color: #d1ecf1; color: #0c5460; }
        .status.success { background-color: #d4edda; color: #155724; }
        .status.error { background-color: #f8d7da; color: #721c24; }
        .path-nav { margin-top: 15px; }
        .path-nav .btn { background: #95a5a6; margin: 0 5px; }
        
        /* 编辑模态框样式 */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        
        .modal-content {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            width: 80%;
            max-width: 800px;
            max-height: 90%;
            display: flex;
            flex-direction: column;
        }
        
        .modal-header {
            padding: 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-header h3 {
            margin: 0;
            color: #2c3e50;
        }
        
        .close-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #7f8c8d;
        }
        
        .close-btn:hover {
            color: #e74c3c;
        }
        
        .modal-body {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
        }
        
        .modal-footer {
            padding: 20px;
            border-top: 1px solid #eee;
            text-align: right;
        }
        
        .btn-warning {
            background: #f39c12;
            color: white;
        }
        
        .btn-warning:hover {
            background: #e67e22;
        }
        
        .path-nav .btn.active { background: #3498db; }
        .path-nav .btn:hover { background: #7f8c8d; }
        .path-nav .btn.active:hover { background: #2980b9; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
            <p>通过Cloudflare Worker管理GitHub仓库文件</p>
            <button class="logout-btn" onclick="logout()">登出</button>
            <div class="path-nav">
                <a href="/" class="btn">返回路径选择</a>
                ${allPathConfigs.map(config => `
                    <a href="/${config.name}" class="btn ${currentPathConfig.name === config.name ? 'active' : ''}">
                        ${config.displayName}
                    </a>
                `).join('')}
            </div>
        </div>
        
        <div class="upload-section">
            <h2>上传文件</h2>
            <input type="file" id="fileInput" accept="*/*" multiple>
            <input type="text" id="filenameInput" placeholder="自定义文件名（可选）" style="width: 300px; padding: 8px; margin: 10px 0;">
            <button class="btn btn-success" onclick="uploadFiles()">上传文件</button>
            
            <!-- 已选择文件列表 -->
            <div id="selectedFiles" style="margin-top: 15px; display: none;">
                <h4>已选择文件 (<span id="fileCount">0</span>个)</h4>
                <div style="margin-bottom: 10px;">
                    <input type="text" id="fileFilter" placeholder="筛选文件名..." style="width: 300px; padding: 6px; margin-right: 10px;">
                    <button class="btn" onclick="clearSelectedFiles()" style="padding: 6px 12px;">清空列表</button>
                </div>
                <div id="fileList" style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; padding: 10px;"></div>
            </div>
            
            <div id="uploadProgress" style="margin-top: 10px; display: none;"></div>
        </div>
        
        <div class="file-list">
            <h2>文件列表</h2>
            <div style="margin-bottom: 15px;">
                <button class="btn" onclick="loadFiles()">刷新列表</button>
                <button class="btn btn-success" onclick="batchDownloadFiles()" id="batchDownloadBtn" style="display: none;">批量下载选中文件</button>
                <button class="btn btn-danger" onclick="batchDeleteFiles()" id="batchDeleteBtn" style="display: none;">批量删除选中文件</button>
                <span id="selectedCount" style="margin-left: 10px; color: #666; display: none;">已选择 <span id="count">0</span> 个文件</span>
            </div>
            <div id="message"></div>
            <div class="loading" id="loading">加载中...</div>
            <table id="fileTable">
                <thead>
                    <tr>
                        <th style="width: 40px;"><input type="checkbox" id="selectAll" onchange="toggleSelectAll(this.checked)"></th>
                        <th>文件名</th>
                        <th>大小</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="fileTableBody"></tbody>
            </table>
        </div>
    </div>

    <script>
        // HTML转义函数
        function escapeHtml(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;'
            };
            return text.replace(/[&<>"']/g, function(m) { return map[m]; });
        }

        // 显示消息
        function showMessage(message, type) {
            const messageDiv = document.getElementById('message');
            messageDiv.innerHTML = '<div class="message ' + escapeHtml(type) + '">' + escapeHtml(message) + '</div>';
            setTimeout(() => messageDiv.innerHTML = '', 5000);
        }

        // 更新选择状态
        function updateSelection() {
            const checkboxes = document.querySelectorAll('.file-checkbox:checked');
            const selectedCount = checkboxes.length;
            const batchDownloadBtn = document.getElementById('batchDownloadBtn');
            const batchDeleteBtn = document.getElementById('batchDeleteBtn');
            const selectedCountSpan = document.getElementById('selectedCount');
            const countSpan = document.getElementById('count');
            
            if (selectedCount > 0) {
                batchDownloadBtn.style.display = 'inline-block';
                batchDeleteBtn.style.display = 'inline-block';
                selectedCountSpan.style.display = 'inline-block';
                countSpan.textContent = selectedCount;
            } else {
                batchDownloadBtn.style.display = 'none';
                batchDeleteBtn.style.display = 'none';
                selectedCountSpan.style.display = 'none';
            }
        }
        
        // 全选/取消全选
        function toggleSelectAll(checked) {
            const checkboxes = document.querySelectorAll('.file-checkbox');
            checkboxes.forEach(function(checkbox) {
                checkbox.checked = checked;
            });
            updateSelection();
        }

        // 批量下载文件
        async function batchDownloadFiles() {
            const checkboxes = document.querySelectorAll('.file-checkbox:checked');
            
            if (checkboxes.length === 0) {
                showMessage('请先选择要下载的文件', 'warning');
                return;
            }
            
            if (!confirm('确定要下载选中的 ' + checkboxes.length + ' 个文件吗？')) {
                return;
            }
            
            showMessage('开始批量下载 ' + checkboxes.length + ' 个文件...', 'success');
            
            // 逐个下载文件
            for (let i = 0; i < checkboxes.length; i++) {
                const checkbox = checkboxes[i];
                const filePath = checkbox.getAttribute('data-path');
                
                try {
                    // 使用后端代理下载文件
                    const response = await fetch('/api/download?path=' + encodeURIComponent(filePath));
                    
                    if (response.ok) {
                        // 获取文件内容和文件名
                        const blob = await response.blob();
                        
                        // 解析Content-Disposition头中的文件名
                        const contentDisposition = response.headers.get('Content-Disposition');
                        let filename = filePath.split('/').pop();
                        
                        if (contentDisposition) {
                            const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
                            if (filenameMatch) {
                                // 解码URL编码的文件名
                                filename = decodeURIComponent(filenameMatch[1]);
                            }
                        }
                        
                        // 创建Blob URL
                        const blobUrl = URL.createObjectURL(blob);
                        
                        // 创建下载链接
                        const a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = filename;
                        a.style.display = 'none';
                        document.body.appendChild(a);
                        a.click();
                        
                        // 清理资源
                        setTimeout(function() {
                            document.body.removeChild(a);
                            URL.revokeObjectURL(blobUrl);
                        }, 100);
                        
                        showMessage('正在下载: ' + filename, 'success');
                    } else {
                        showMessage('下载失败: ' + filePath, 'error');
                    }
                } catch (error) {
                    showMessage('下载错误: ' + error.message, 'error');
                }
                
                // 添加延迟避免同时下载过多文件
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            showMessage('批量下载完成', 'success');
        }
        
        // 批量删除文件
        async function batchDeleteFiles() {
            const checkboxes = document.querySelectorAll('.file-checkbox:checked');
            
            if (checkboxes.length === 0) {
                showMessage('请先选择要删除的文件', 'warning');
                return;
            }
            
            if (!confirm('确定要删除选中的 ' + checkboxes.length + ' 个文件吗？此操作不可撤销！')) {
                return;
            }
            
            showMessage('开始批量删除 ' + checkboxes.length + ' 个文件...', 'success');
            
            let successCount = 0;
            let errorCount = 0;
            
            // 逐个删除文件
            for (let i = 0; i < checkboxes.length; i++) {
                const checkbox = checkboxes[i];
                const filename = checkbox.value;
                const sha = checkbox.getAttribute('data-sha');
                
                try {
                    const response = await fetch('${apiBase}', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filename, sha })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        successCount++;
                        showMessage('删除成功: ' + filename, 'success');
                    } else {
                        errorCount++;
                        showMessage('删除失败: ' + filename + ': ' + (data.error || response.status), 'error');
                    }
                } catch (error) {
                    errorCount++;
                    showMessage('删除错误: ' + filename + ': ' + error.message, 'error');
                }
                
                // 添加延迟避免API限制
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // 显示最终结果
            let resultMessage = '批量删除完成: ';
            if (successCount > 0) {
                resultMessage += successCount + ' 个文件删除成功';
            }
            if (errorCount > 0) {
                resultMessage += (successCount > 0 ? ', ' : '') + errorCount + ' 个文件删除失败';
            }
            
            showMessage(resultMessage, successCount > 0 && errorCount === 0 ? 'success' : 'warning');
            
            // 刷新文件列表
            loadFiles();
        }

        // 加载文件列表
        async function loadFiles() {
            const loading = document.getElementById('loading');
            const tableBody = document.getElementById('fileTableBody');
            
            loading.style.display = 'block';
            tableBody.innerHTML = '';
            
            try {
                const response = await fetch('${apiBase}');
                const data = await response.json();
                
                if (response.ok) {
                    if (data.files && data.files.length > 0) {
                        data.files.forEach(file => {
                            const row = tableBody.insertRow();
                            
                            // 选择复选框
                            const selectCell = row.insertCell();
                            const checkbox = document.createElement('input');
                            checkbox.type = 'checkbox';
                            checkbox.className = 'file-checkbox';
                            checkbox.value = file.name;
                            checkbox.setAttribute('data-sha', file.sha);
                            checkbox.setAttribute('data-path', file.path);
                            checkbox.onchange = function() { updateSelection(); };
                            selectCell.appendChild(checkbox);
                            
                            // 安全地创建DOM元素，避免innerHTML的XSS风险
                            const nameCell = row.insertCell();
                            nameCell.textContent = file.name;
                            
                            const sizeCell = row.insertCell();
                            sizeCell.textContent = formatFileSize(file.size);
                            
                            const actionCell = row.insertCell();
                            
                            // 查看按钮（仅对可预览文件显示）
                            if (isPreviewableFile(file.name)) {
                                const viewBtn = document.createElement('button');
                                viewBtn.className = 'btn btn-success';
                                viewBtn.textContent = '查看';
                                viewBtn.onclick = function() { previewFile(file.path); };
                                actionCell.appendChild(viewBtn);
                            }
                            
                            // 下载按钮
                            const downloadBtn = document.createElement('button');
                            downloadBtn.className = 'btn';
                            downloadBtn.textContent = '下载';
                            downloadBtn.onclick = function() { downloadFile(file.path); };
                            actionCell.appendChild(downloadBtn);
                            
                            // 修改按钮（仅对可编辑文件显示）
                            if (isEditableFile(file.name)) {
                                const editBtn = document.createElement('button');
                                editBtn.className = 'btn btn-warning';
                                editBtn.textContent = '修改';
                                editBtn.onclick = function() { editFile(file.name, file.sha, file.path); };
                                actionCell.appendChild(editBtn);
                            }
                            
                            // 删除按钮
                            const deleteBtn = document.createElement('button');
                            deleteBtn.className = 'btn btn-danger';
                            deleteBtn.textContent = '删除';
                            deleteBtn.onclick = function() { deleteFile(escapeHtml(file.name), escapeHtml(file.sha)); };
                            actionCell.appendChild(deleteBtn);
                        });
                    } else {
                        tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">暂无文件</td></tr>';
                    }
                } else {
                    showMessage('加载失败: ' + (data.error || response.status), 'error');
                }
            } catch (error) {
                showMessage('网络错误: ' + error.message, 'error');
            } finally {
                loading.style.display = 'none';
            }
        }

        // 多文件上传
        async function uploadFiles() {
            const fileInput = document.getElementById('fileInput');
            const filenameInput = document.getElementById('filenameInput');
            const uploadProgress = document.getElementById('uploadProgress');
            
            if (!fileInput.files.length) {
                showMessage('请选择要上传的文件', 'error');
                return;
            }
            
            // 显示上传进度区域
            uploadProgress.style.display = 'block';
            uploadProgress.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;"><h3 style="margin: 0;">上传进度</h3><button id="closeProgress" class="btn btn-danger" style="padding: 4px 8px; font-size: 12px;">关闭</button></div>';
            
            const files = Array.from(fileInput.files);
            let successCount = 0;
            let errorCount = 0;
            
            // 为每个文件创建进度条
            const progressBars = {};
            files.forEach((file, index) => {
                const progressId = 'progress-' + index;
                progressBars[file.name] = progressId;
                uploadProgress.innerHTML += '<div class="file-progress"><div class="file-info"><span class="filename">' + escapeHtml(file.name) + '</span><span class="file-size">(' + formatFileSize(file.size) + ')</span></div><div class="progress-container"><div class="progress-bar" id="' + progressId + '"><div class="progress-fill"></div><span class="progress-text">0%</span></div></div><div class="status" id="status-' + index + '">等待上传...</div></div>';
            });
            
            // 逐个上传文件
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const progressId = progressBars[file.name];
                const statusElement = document.getElementById('status-' + i);
                
                try {
                    // 更新状态
                    statusElement.textContent = '上传中...';
                    statusElement.className = 'status uploading';
                    
                    // 构建文件名
                    let finalFilename = file.name;
                    if (filenameInput.value && !filenameInput.disabled) {
                        // 单文件上传：使用用户输入的文件名
                        finalFilename = filenameInput.value;
                        // 确保文件名有正确的扩展名
                        const originalExtension = file.name.split('.').pop();
                        if (!finalFilename.includes('.')) {
                            finalFilename = finalFilename + '.' + originalExtension;
                        }
                    } else if (files.length > 1) {
                        // 多文件上传：保持原文件名
                        finalFilename = file.name;
                    }
                    
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('filename', finalFilename);
                    
                    // 使用fetch API上传文件，模拟进度条
                        const response = await fetch('${apiBase}', {
                        method: 'POST',
                        body: formData
                    });
                    
                    // 模拟进度条更新（由于fetch API不支持进度监听，我们使用模拟进度）
                    let progress = 0;
                    const progressInterval = setInterval(() => {
                        if (progress < 90) {
                            progress += 10;
                            updateProgressBar(progressId, progress);
                        }
                    }, 200);
                    
                    // 上传完成
                    if (response.ok) {
                        clearInterval(progressInterval);
                        updateProgressBar(progressId, 100);
                        successCount++;
                        statusElement.textContent = '上传成功';
                        statusElement.className = 'status success';
                    } else {
                        clearInterval(progressInterval);
                        updateProgressBar(progressId, 100);
                        errorCount++;
                        statusElement.textContent = '上传失败';
                        statusElement.className = 'status error';
                    }
                    
                    // 检查是否所有文件都处理完毕
                    if (successCount + errorCount === files.length) {
                        if (errorCount === 0) {
                            showMessage('所有文件上传成功 (' + successCount + '个)', 'success');
                            fileInput.value = '';
                            filenameInput.value = '';
                            loadFiles();
                        } else {
                            showMessage('上传完成: ' + successCount + '个成功, ' + errorCount + '个失败', 'warning');
                        }
                    }
                    
                } catch (error) {
                    errorCount++;
                    statusElement.textContent = '上传异常';
                    statusElement.className = 'status error';
                    
                    if (successCount + errorCount === files.length) {
                            showMessage('上传完成: ' + successCount + '个成功, ' + errorCount + '个失败', 'warning');
                        }
                }
            }
        }
        
        // 更新进度条
        function updateProgressBar(progressId, percent) {
            const progressBar = document.getElementById(progressId);
            if (progressBar) {
                const progressFill = progressBar.querySelector('.progress-fill');
                const progressText = progressBar.querySelector('.progress-text');
                progressFill.style.width = percent + '%';
                progressText.textContent = percent + '%';
            }
        }
        
        // 格式化文件大小
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        // 删除文件
        async function deleteFile(filename, sha) {
            if (!confirm('确定要删除这个文件吗？')) {
                return;
            }
            
            try {
                const response = await fetch('${apiBase}', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename, sha })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showMessage('文件删除成功', 'success');
                    loadFiles();
                } else {
                    showMessage('删除失败: ' + (data.error || response.status), 'error');
                }
            } catch (error) {
                showMessage('删除错误: ' + error.message, 'error');
            }
        }

        // 格式化文件大小
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        
        // 编辑文件 - 跳转到编辑页面
        function editFile(filename, sha, filePath) {
            // 跳转到编辑页面，使用URL参数传递文件信息
            const editUrl = '/edit?filename=' + encodeURIComponent(filename) + 
                          '&sha=' + encodeURIComponent(sha) + 
                          '&path=' + encodeURIComponent(filePath);
            window.location.href = editUrl;
        }
        
        // 登出函数
        function logout() {
            if (confirm('确定要登出吗？')) {
                fetch('/api/logout', {
                    method: 'POST'
                }).then(() => {
                    window.location.href = '/login';
                }).catch(error => {
                    console.error('登出失败:', error);
                    window.location.href = '/login';
                });
            }
        }
        
        // 删除单个文件
        function removeSelectedFile(index) {
            const fileInput = document.getElementById('fileInput');
            const files = Array.from(fileInput.files);
            
            // 从文件列表中移除指定文件
            files.splice(index, 1);
            
            // 更新文件输入框
            const newFileList = new DataTransfer();
            files.forEach(file => newFileList.items.add(file));
            fileInput.files = newFileList.files;
            
            // 触发change事件更新界面
            fileInput.dispatchEvent(new Event('change'));
        }
        
        // 清空文件列表
        function clearSelectedFiles() {
            const fileInput = document.getElementById('fileInput');
            fileInput.value = '';
            fileInput.dispatchEvent(new Event('change'));
        }
        
        // 筛选文件列表
        function filterSelectedFiles() {
            const filterText = document.getElementById('fileFilter').value.toLowerCase();
            const fileItems = document.querySelectorAll('.selected-file-item');
            
            fileItems.forEach(function(item) {
                const fileName = item.querySelector('.file-name').textContent.toLowerCase();
                if (fileName.includes(filterText)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        }
        
        // 更新已选择文件列表
        function updateSelectedFilesList(files) {
            const selectedFilesDiv = document.getElementById('selectedFiles');
            const fileCountSpan = document.getElementById('fileCount');
            const fileListDiv = document.getElementById('fileList');
            
            // 显示文件列表区域
            selectedFilesDiv.style.display = 'block';
            
            // 更新文件数量
            fileCountSpan.textContent = files.length;
            
            // 生成文件列表HTML
            let fileListHTML = '';
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                fileListHTML += '<div class="selected-file-item" style="display: flex; justify-content: space-between; align-items: center; padding: 5px; border-bottom: 1px solid #eee;">';
                fileListHTML += '<div>';
                fileListHTML += '<span class="file-name" style="font-weight: bold;">' + escapeHtml(file.name) + '</span>';
                fileListHTML += '<span class="file-size" style="color: #666; margin-left: 10px;">(' + formatFileSize(file.size) + ')</span>';
                fileListHTML += '</div>';
                fileListHTML += '<button class="btn btn-danger" onclick="removeSelectedFile(' + i + ')" style="padding: 2px 6px; font-size: 12px;">删除</button>';
                fileListHTML += '</div>';
            }
            
            fileListDiv.innerHTML = fileListHTML;
        }
        
        // 页面加载时自动获取文件列表
        document.addEventListener('DOMContentLoaded', function() {
            loadFiles();
            
            // 监听文件选择变化
            const fileInput = document.getElementById('fileInput');
            const filenameInput = document.getElementById('filenameInput');
            
            fileInput.addEventListener('change', function() {
                const files = fileInput.files;
                
                if (files.length === 0) {
                    // 没有选择文件
                    filenameInput.placeholder = '自定义文件名（可选）';
                    filenameInput.disabled = false;
                    filenameInput.value = '';
                    // 隐藏已选择文件列表
                    document.getElementById('selectedFiles').style.display = 'none';
                } else if (files.length === 1) {
                    // 单个文件：提供完整文件名修改
                    filenameInput.placeholder = '自定义文件名（可选）';
                    filenameInput.disabled = false;
                    filenameInput.value = files[0].name;
                    // 显示已选择文件列表
                    updateSelectedFilesList(files);
                } else {
                    // 多个文件：禁用文件名修改
                    filenameInput.placeholder = '多文件上传时不可修改文件名';
                    filenameInput.disabled = true;
                    filenameInput.value = '';
                    // 显示已选择文件列表
                    updateSelectedFilesList(files);
                }
            });
            
            // 监听关闭按钮点击事件（动态添加）
            document.addEventListener('click', function(e) {
                if (e.target && e.target.id === 'closeProgress') {
                    const uploadProgress = document.getElementById('uploadProgress');
                    uploadProgress.style.display = 'none';
                    uploadProgress.innerHTML = '';
                }
            });
            
            // 监听文件筛选输入
            document.getElementById('fileFilter').addEventListener('input', function() {
                filterSelectedFiles();
            });
        });
    </script>
</body>
</html>`;
}