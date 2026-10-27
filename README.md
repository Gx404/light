一个纯静态导航页面，展示摄影、会员看板、服务器探针和文件互传四个独立子站。页面支持彩色 WebGL 流体、移动端布局和减少动态效果偏好。
## 容器部署

仓库提供通用 Nginx 容器和 Compose 配置：

```sh
git clone https://github.com/Gx404/light.git gx404-home
cd gx404-home
docker compose up -d --build
```

默认端口是 `8080`，健康检查地址是 `/healthz`。也可以使用 GHCR 预构建镜像：

```sh
docker compose -f docker-compose.yml -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.yml -f docker-compose.ghcr.yml up -d
```

完整的端口、HTTPS、更新和回滚说明见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。主分支由 [.github/workflows/container.yml](.github/workflows/container.yml) 发布 `ghcr.io/gx404/gx404-home`。

## 生产反向代理

容器只提供主站静态页面。需要绑定域名时，在自己的 Caddy、Nginx 或其他反向代理中把 HTTPS 流量转发到容器端口。仓库中的 `deploy/Caddyfile` 是 Gx404 现网路由示例，包含专用子站上游，不应原样复制到其他服务器。

摄影、会员、VPS 和互传继续作为独立子域名运行，不会被主站容器合并。

## 已验证

- 桌面端和 390 × 844、320 × 640 手机布局通过。
- 点击、拖动背景和减少动态效果偏好通过。
- `app.js` 与 `dist/vendor/fluid.js` 通过语法检查。
- 容器首页返回 `Gx404-首页`，`/healthz` 返回 `ok`。

## 当前上海生产配置（2026-10-27）

主站实际由宿主机 Caddy 提供 `/home/gx404/apps/gx404-home/dist`，并非上文通用 Nginx 容器；不要在上海机器直接执行通用 Compose，它的 8080 端口已由会员前端使用。

生产域名为 gx404.com / www.gx404.com、ph.gx404.com、vip.gx404.com、vps.gx404.com、ios.gx404.com；Bark 保留 bark.gx404.cn。`deploy/Caddyfile` 与当前 `/etc/caddy/Caddyfile` 对齐；其中 .cn 兼容块与 Bark 块是有意保留。

`deploy/photography.compose.yml` 仅为公开域名覆盖层，不是独立部署文件。下一次摄影与会员发布以 `/home/gx404/ops/production-current/manifest.json` 及同目录 Compose 为入口，先运行同目录 `validate.py`。这些服务器专用 Compose 含私密环境，禁止提交。

`vip-manager-releases/*/compose.production.json` 和 `DEPLOYMENT_CURRENT.txt` 的历史记录不能覆盖当前生产配置。只更新目标应用服务；保留现行镜像的应用启动方式、回环地址绑定、资源限制及原命名数据卷，禁止为了页面修复执行数据库初始化或 seed。

仓库旧地址 `https://github.com/Gx404/Gx404` 已由 GitHub 301 跳转到 `https://github.com/Gx404/light`；两者为同一仓库的旧、新地址。
