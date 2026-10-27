# Light template maintenance

- This repository is a standalone, reusable static homepage template. Keep personal domains, subsite routes, registration numbers, server addresses, production paths, and operational records out of it.
- Source repository: https://github.com/Gx404/light. Validate changes and synchronize them to this repository when requested; a GitHub push does not deploy anyone's existing website.
- Runtime files live in `dist/`. The page needs no backend, database, installation, or build step. `dist/site.config.js` contains public customization options; keep `dist/index.html` useful without JavaScript.
- Default branding is `Light`, links use reserved example domains, and registration information is optional and empty by default. Do not add another person's deployed configuration as an example.
- Preserve the WebGL fluid background, pointer interaction, opening animation, reduced-motion support, background pause/resume, and static fallback when WebGL is unavailable.
- Keep navigation icons visually consistent. Verify desktop and 390 px / 320 px layouts when browser tooling supports actual viewport changes; report unverified cases honestly.
- `dist/vendor/fluid.js` derives from Pavel Dobryakov's MIT-licensed project. Preserve its license and `THIRD_PARTY.md` attribution.
- `deploy/` contains generic single-site server examples only. Never copy a real multi-service gateway or a private deployment overlay into this repository.
- Run JavaScript syntax checks and `node --test tests/*.test.cjs`. Validate the Docker health endpoint when changing container configuration.
- Do not commit credentials, environment files, server data, private configuration, backups, or test screenshots.
