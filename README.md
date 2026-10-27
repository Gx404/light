# Light

一个可独立部署的静态主页模板：流体背景、透色标题、简洁导航、手机布局，以及减少动态效果和 WebGL 不可用时的静态回退。无需后端、数据库、第三方字体或统计服务。

仓库仅包含主页模板、通用部署示例和相关测试。默认名称为 **Light**，所有导航使用 `example.com` 示例地址，备案信息默认不显示。

## 快速开始

```sh
git clone https://github.com/Gx404/light.git
cd light
node preview.mjs
```

打开 `http://127.0.0.1:4173/`。也可以直接把 `dist/` 全部上传到静态托管平台，不需要运行 Node.js。

## 自定义

编辑 [`dist/site.config.js`](dist/site.config.js)：

| 配置 | 用途 |
| --- | --- |
| `name`、`title` | 页面名称与浏览器标题 |
| `tagline`、`intro`、`description` | 页面文案与分享描述 |
| `siteUrl` | 可选正式地址，填写后生成 canonical 与分享 URL |
| `links` | 导航名称、完整 HTTP/HTTPS 地址、图标 |
| `icp` | 可选备案信息；默认 `null`，不显示备案号或分隔点 |

可用图标：`grid`、`book`、`user`、`mail`。替换 `dist/favicon.svg` 可以更换站点图标。

`dist/index.html` 中保留了无 JavaScript 时的示例名称、文案和导航。如果需要无脚本访客也看到自定义内容，请同步修改这些回退内容。

## Docker 部署

```sh
docker compose up -d --build
```

默认地址为 `http://127.0.0.1:8080/`，健康检查地址为 `/healthz`。绑定域名、使用预构建镜像、挂载自定义配置、更新和回退见 [部署说明](docs/DEPLOYMENT.md)。

[`deploy/Caddyfile`](deploy/Caddyfile) 是只服务一个域名的通用 HTTPS 示例。仓库不会部署导航链接所指向的其他网站。

## 检查

```sh
node --check dist/app.js
node --check dist/site.config.js
node --check dist/vendor/fluid.js
node --test tests/*.test.cjs
```

容器工作流会先运行检查和容器冒烟测试，再将镜像发布至 `ghcr.io/<owner>/<repository>`。Fork 后使用自己的镜像地址；镜像是否可匿名拉取取决于 GHCR 的包可见性。

第三方流体引擎的来源与 MIT 许可证见 [THIRD_PARTY.md](THIRD_PARTY.md)。
