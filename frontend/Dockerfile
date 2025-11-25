# 使用官方Node.js镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 设置环境变量启用热更新
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true

# 暴露端口
EXPOSE 3000

# 启动开发服务器
CMD ["npm", "start"]
