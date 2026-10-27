# 部署 Light

`dist/` 是完整的静态网站。可直接静态托管，也可以通过仓库的 Nginx 容器运行。导航地址只是可编辑的链接，不包含目标网站的应用或部署逻辑。

## 直接静态部署

将 `dist/` 内全部文件上传至静态托管平台或自己的 Web 目录，保留 `vendor/` 子目录。资源使用相对路径，也可部署在子目录。无须 Node.js、数据库或构建步骤。

本地预览需要 Node.js 18 或更新版本：

```sh
node preview.mjs
```

默认只监听 `127.0.0.1:4173`。

## 使用 Docker Compose

安装 Docker 与 Compose 后：

```sh
git clone https://github.com/Gx404/light.git
cd light
docker compose up -d --build
docker compose ps
curl http://127.0.0.1:8080/healthz
```

健康接口应返回 `ok`。默认仅绑定回环地址 `127.0.0.1:8080`，适合由反向代理提供 HTTPS。端口可通过 `PORT` 环境变量修改。Linux / macOS 示例：

```sh
PORT=9090 docker compose up -d --build
```

PowerShell 中先设置 `$env:PORT = "9090"` 再运行 Compose。需要直接对外提供 HTTP 时可设置 `BIND_ADDRESS=0.0.0.0`；实际开放的端口由你自己的网络设置决定。

查看日志：

```sh
docker compose logs -f home
```

## 绑定域名和 HTTPS

将域名解析到自己的服务器，并让 Caddy 使用 [`deploy/Caddyfile`](../deploy/Caddyfile)。把 `example.com` 改为自己的域名：

```caddyfile
example.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:8080
}
```

示例针对 Caddy 与容器运行于同一宿主机的场景。若反向代理也运行在容器中，应按自己的 Docker 网络调整上游地址；容器内的 `127.0.0.1` 指向容器自身。

## 使用预构建镜像

本仓库的容器工作流发布 `ghcr.io/gx404/light`；Fork 后工作流自动使用 Fork 的所有者和仓库名。使用自己确认可访问的镜像地址：

```sh
LIGHT_IMAGE=ghcr.io/your-account/light:latest docker compose -f docker-compose.yml -f docker-compose.ghcr.yml pull
LIGHT_IMAGE=ghcr.io/your-account/light:latest docker compose -f docker-compose.yml -f docker-compose.ghcr.yml up -d
```

也可以在 `.env` 中填写 `LIGHT_IMAGE`，再运行上面的 Compose 命令。私有包需要先 `docker login ghcr.io`；公开仓库不代表包一定已设为公开。

预构建镜像包含模板默认内容。想使用自己的名称和链接，可重新构建镜像，或创建本地覆盖文件 `compose.custom.yml`：

```yaml
services:
  home:
    volumes:
      - ./dist/site.config.js:/usr/share/nginx/html/site.config.js:ro
```

将此文件作为最后一层应用：

```sh
docker compose -f docker-compose.yml -f docker-compose.ghcr.yml -f compose.custom.yml up -d
```

如需同步无脚本回退文案、图标或其他页面内容，优先从修改后的源码构建。配置脚本使用 `no-cache`，浏览器可重新验证它；替换整个配置文件时，重新创建容器可确保文件挂载指向新内容。

## 更新与回退

源码部署：拉取更新后重新执行 `docker compose up -d --build`。更新前将自己的公开配置单独保留；遇到 Git 合并冲突时先核对变更。

镜像部署：生产环境可将 `LIGHT_IMAGE` 固定为工作流生成的 SHA 标签或镜像摘要。更新时执行 `pull` 与 `up -d`；回退时恢复上一版镜像引用，再执行 `up -d`。模板不保存业务数据。

## 自定义名称、导航与备案

配置入口为 `dist/site.config.js`。将 `siteUrl` 设为自己的正式地址可生成 canonical 和 Open Graph URL；默认留空，不会指向模板作者的网站。自定义后同步更新 `dist/index.html`，可让无脚本访客也看到自己的内容。

备案字段默认 `null`。有自己的备案信息时可填写：

```js
icp: { label: '你的备案号', url: 'https://beian.miit.gov.cn/' },
```

不要沿用他人的备案信息。导航、正式地址和备案地址只接受完整 HTTP/HTTPS URL。
