# DNS 解析问题解决方案

## 问题现象

错误信息：
```
queryA ETIMEOUT smtp.qq.com
code: 'EDNS'
```

## 问题原因

DNS 服务器无法解析 `smtp.qq.com` 的 IP 地址，可能的原因：
1. DNS 服务器配置问题
2. 网络防火墙阻止 DNS 查询
3. 本地网络 DNS 解析超时
4. 网络代理配置问题

## 解决方案

### 方案1：使用 IP 地址直接连接（推荐）

如果 DNS 解析有问题，可以尝试使用自定义 SMTP 配置，直接指定 IP 地址或使用备用 SMTP 服务器。

**QQ 邮箱 SMTP 信息：**
- 服务器：smtp.qq.com
- 端口：587（推荐）或 465
- 安全连接：TLS（端口 587）或 SSL（端口 465）

**配置 `.env` 文件：**

```env
EMAIL_SERVICE=custom
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=你的QQ号@qq.com
EMAIL_PASS=你的授权码
EMAIL_FROM_NAME=打卡系统
```

### 方案2：更换 DNS 服务器

如果 DNS 解析有问题，可以尝试更换 DNS 服务器：

**Windows 系统：**
1. 打开"网络和共享中心"
2. 更改适配器设置
3. 右键网络连接 → 属性
4. 选择"Internet 协议版本 4 (TCP/IPv4)" → 属性
5. 选择"使用下面的 DNS 服务器地址"
6. 设置为：
   - 首选 DNS：114.114.114.114
   - 备用 DNS：8.8.8.8
7. 点击确定，重启网络连接

### 方案3：使用 163 邮箱（备选）

如果 QQ 邮箱 DNS 解析有问题，可以尝试使用 163 邮箱：

**配置 `.env` 文件：**

```env
EMAIL_SERVICE=163
EMAIL_USER=你的邮箱@163.com
EMAIL_PASS=你的授权码
EMAIL_FROM_NAME=打卡系统
```

**163 邮箱 SMTP 信息：**
- 服务器：smtp.163.com
- 端口：465（SSL）或 25
- 需要授权码

### 方案4：检查网络连接

1. **测试 DNS 解析**：
   ```bash
   nslookup smtp.qq.com
   ```
   如果无法解析，说明 DNS 有问题

2. **测试网络连接**：
   ```bash
   ping smtp.qq.com
   ```
   如果无法 ping 通，说明网络连接有问题

3. **检查防火墙**：
   - 确保防火墙允许 Node.js 访问网络
   - 检查是否阻止了端口 587 或 465

### 方案5：使用企业邮箱或其他邮件服务

如果上述方案都不行，可以尝试：
- 企业邮箱（如果有）
- 其他支持 SMTP 的邮箱服务
- 使用邮件服务提供商（如 SendGrid、阿里云邮件推送等）

## 推荐的配置

### QQ 邮箱配置（使用自定义 SMTP）

```env
EMAIL_SERVICE=custom
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=你的QQ号@qq.com
EMAIL_PASS=你的授权码
EMAIL_FROM_NAME=打卡系统
```

### 163 邮箱配置

```env
EMAIL_SERVICE=163
EMAIL_USER=你的邮箱@163.com
EMAIL_PASS=你的授权码
EMAIL_FROM_NAME=打卡系统
```

## 快速测试

配置完成后：

1. **重启服务器**
2. **测试 DNS 解析**（在命令行）：
   ```bash
   nslookup smtp.qq.com
   ```
3. **发送测试邮件**（通过前端界面）

## 常见问题

### Q: 为什么 QQ 邮箱也会 DNS 超时？

A: 这通常是本地网络或 DNS 服务器配置问题，不是 QQ 邮箱服务的问题。

### Q: 更换 DNS 服务器后还是不行？

A: 可以尝试：
1. 使用 `EMAIL_SERVICE=custom` 配置
2. 使用 163 邮箱
3. 检查网络代理设置
4. 联系网络管理员

### Q: 可以使用 VPN 吗？

A: 如果网络环境允许，可以使用 VPN，但通常不需要，因为 QQ 邮箱和 163 邮箱都可以正常访问。

## 验证步骤

1. 检查 `.env` 文件配置是否正确
2. 重启服务器
3. 通过前端界面测试发送邮件
4. 查看服务器日志确认是否有其他错误
