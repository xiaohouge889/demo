# Gmail 连接超时问题解决方案

## 问题现象

错误信息：
```
queryA ETIMEOUT smtp.gmail.com
code: 'EDNS'
```

## 问题原因

**网络无法访问 Gmail SMTP 服务器**，这通常发生在中国大陆的网络环境中，因为 Gmail 服务可能无法直接访问。

## 解决方案：使用 QQ 邮箱（推荐）

### 步骤 1：获取 QQ 邮箱授权码

1. **登录 QQ 邮箱**
   - 访问：https://mail.qq.com/
   - 使用您的 QQ 账号登录

2. **开启 SMTP 服务**
   - 点击页面右上角的"设置"
   - 选择"账户"标签
   - 找到"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"
   - 开启"POP3/SMTP服务"或"IMAP/SMTP服务"

3. **生成授权码**
   - 点击"生成授权码"按钮
   - 按提示发送短信验证（发送到 1069 0700 699）
   - 复制生成的授权码（16位字符，例如：`abcdefghijklmnop`）

### 步骤 2：修改配置文件

在 `backend` 目录下编辑或创建 `.env` 文件：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=checkin_app

# 服务器配置
PORT=3000
CORS_ORIGIN=http://localhost:5173

# 邮件服务配置（QQ邮箱）
EMAIL_SERVICE=qq
EMAIL_USER=你的QQ号@qq.com
EMAIL_PASS=你的授权码  # 16位授权码，不是QQ密码
EMAIL_FROM_NAME=打卡系统
```

**重要提示**：
- `EMAIL_USER` 填写完整的QQ邮箱地址，例如：`123456789@qq.com`
- `EMAIL_PASS` 填写刚才获取的授权码，**不是QQ密码**
- 授权码是16位字符，不需要空格

### 步骤 3：重启服务器

保存配置文件后，重启服务器：

```bash
# 停止当前服务器（按 Ctrl+C）
# 然后重新启动
npm run dev
```

### 步骤 4：测试邮件发送

1. 访问前端：http://localhost:5173
2. 进入"设置"页面
3. 输入紧急联系人邮箱地址
4. 点击"发送测试邮件"按钮
5. 检查邮箱是否收到测试邮件

## 备选方案：163 邮箱

如果不想使用 QQ 邮箱，也可以使用 163 邮箱：

### 163 邮箱配置步骤

1. **登录 163 邮箱**：https://mail.163.com/
2. **开启 SMTP 服务**：
   - 设置 → POP3/SMTP/IMAP
   - 开启"POP3/SMTP服务"或"IMAP/SMTP服务"
3. **获取授权码**：
   - 点击"生成授权码"
   - 按提示发送短信验证
   - 复制授权码

4. **配置 `.env` 文件**：
```env
EMAIL_SERVICE=163
EMAIL_USER=你的邮箱@163.com
EMAIL_PASS=你的授权码
EMAIL_FROM_NAME=打卡系统
```

## 为什么 Gmail 无法使用？

- Gmail 是 Google 的服务，在中国大陆可能无法直接访问
- 这是网络环境的限制，不是配置错误
- 使用 QQ 邮箱或 163 邮箱可以避免这个问题

## 验证配置

配置完成后，重启服务器。如果配置正确，您应该能够成功发送测试邮件，不会再出现连接超时的错误。

## 常见问题

### Q: QQ邮箱授权码在哪里获取？

A: 登录 QQ 邮箱 → 设置 → 账户 → 生成授权码

### Q: 授权码和QQ密码有什么区别？

A: 
- **QQ密码**：登录QQ的密码，不能用于SMTP
- **授权码**：专门用于第三方应用访问邮箱的16位密码，需要单独生成

### Q: 发送测试邮件还是失败怎么办？

A: 
1. 检查授权码是否正确（16位字符）
2. 确认已开启SMTP服务
3. 检查 `.env` 文件格式是否正确
4. 重启服务器
5. 查看服务器日志了解具体错误

### Q: 可以继续使用 Gmail 吗？

A: 如果您的网络环境可以访问 Gmail（例如使用VPN），可以继续使用 Gmail。否则建议使用 QQ 邮箱或 163 邮箱。
