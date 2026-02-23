import fs from 'fs';
import path from 'path';

function replaceInFiles(dir, searchValue, replaceValue) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInFiles(fullPath, searchValue, replaceValue);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes(searchValue)) {
                content = content.replaceAll(searchValue, replaceValue);
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

replaceInFiles('./src', 'indigo', 'orange');
replaceInFiles('./src', 'blue-500', 'orange-500');
replaceInFiles('./src', 'blue-400', 'orange-400');
replaceInFiles('./src', 'blue-600', 'orange-600');
