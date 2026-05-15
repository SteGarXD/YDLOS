'use strict';
/* eslint-disable no-console -- CLI build script */
const fs = require('fs');
const path = require('path');
// Фавикон: только 64 и 48 — 32 не копируем, чтобы браузер не подхватывал мелкий вариант
const favicornSizes = ['64x64', '48x48'];
const assetsDir = path.join(__dirname, '..', '..', '..', 'datalens', 'assets');
const publicDir = path.join(__dirname, '..', 'dist', 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, {recursive: true});
favicornSizes.forEach((size) => {
    const name = `favicorn.${size}.svg`;
    const src = path.join(assetsDir, name);
    const dest = path.join(publicDir, name);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log('Favicon copied:', name, '->', dest);
    } else {
        console.warn('Favicon not found:', src);
    }
});
// Лого для интерфейса (страница входа, шапка): PNG из datalens/assets
const logoPngSrc = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'datalens',
    'assets',
    'logo-aeronavigator.png',
);
const logoPngDest = path.join(__dirname, '..', 'dist', 'public', 'logo-aeronavigator.png');
if (fs.existsSync(logoPngSrc)) {
    const destDir = path.dirname(logoPngDest);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, {recursive: true});
    fs.copyFileSync(logoPngSrc, logoPngDest);
    console.log('Logo PNG copied: logo-aeronavigator.png ->', logoPngDest);
} else {
    console.warn('Logo PNG not found. Add datalens/assets/logo-aeronavigator.png for UI logo.');
}
// Метка кастомной сборки (Aeronavigator BI) — по ней проверяют, что в контейнере наша сборка
const buildDir = path.join(__dirname, '..', 'dist', 'public', 'build');
if (fs.existsSync(buildDir)) {
    const buildInfo = `Aeronavigator BI custom build\n${new Date().toISOString()}\n`;
    fs.writeFileSync(path.join(buildDir, 'build-info.txt'), buildInfo);
    console.log('Wrote dist/public/build/build-info.txt');
}
