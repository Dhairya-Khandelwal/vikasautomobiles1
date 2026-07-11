import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist');

console.log('Starting static build for GitHub Pages & Cloudflare Pages...');

// 1. Clean and recreate dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });
console.log('Cleaned dist/ directory.');

// 2. Copy directories
const foldersToCopy = ['js', 'css', 'assets'];
foldersToCopy.forEach(folder => {
  const src = path.join(__dirname, folder);
  const dest = path.join(distDir, folder);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
    console.log(`Successfully copied ${folder}/ to dist/${folder}/`);
  } else {
    console.warn(`Warning: Source folder "${folder}" does not exist.`);
  }
});

// 3. Copy root JSON config files needed at runtime
const jsonFiles = ['firebase-applet-config.json'];
jsonFiles.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Successfully copied ${file} to dist/${file}`);
  }
});

// 4. Copy root HTML files
const files = fs.readdirSync(__dirname);
let htmlCount = 0;
files.forEach(file => {
  if (file.endsWith('.html')) {
    const src = path.join(__dirname, file);
    const dest = path.join(distDir, file);
    fs.copyFileSync(src, dest);
    htmlCount++;
    console.log(`Successfully copied ${file} to dist/${file}`);
  }
});

console.log(`Build complete! Copied ${htmlCount} HTML pages and all asset directories to dist/.`);
