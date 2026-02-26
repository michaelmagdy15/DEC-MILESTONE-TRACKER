import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, '../public');
const versionFilePath = path.join(publicDir, 'version.json');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// Generate an object with universally unique timestamp
const versionData = {
    version: Date.now().toString()
};

fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2), 'utf-8');

console.log(`[Cache Buster] Generated version.json with timestamp: ${versionData.version}`);
