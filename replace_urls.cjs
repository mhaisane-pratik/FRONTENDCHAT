const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function replaceInFile(filepath) {
    const originalContent = fs.readFileSync(filepath, 'utf8');
    let newContent = originalContent;

    newContent = newContent.replace(
        /const API_URL = "https:\/\/zatbackend\.onrender\.com"; \/\/ ✅ Production API/g,
        'const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "https://zatbackend.onrender.com");'
    );
    newContent = newContent.replace(
        /const API_URL = "https:\/\/zatbackend\.onrender\.com";/g,
        'const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "https://zatbackend.onrender.com");'
    );
    newContent = newContent.replace(
        /export const API_URL = "https:\/\/zatbackend\.onrender\.com";/g,
        'export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "https://zatbackend.onrender.com");'
    );
    newContent = newContent.replace(
        /export const SOCKET_URL = "https:\/\/zatbackend\.onrender\.com";/g,
        'export const SOCKET_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "https://zatbackend.onrender.com");'
    );
    newContent = newContent.replace(
        /`https:\/\/zatbackend\.onrender\.com/g,
        '`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "https://zatbackend.onrender.com")}'
    );

    if (newContent !== originalContent) {
        fs.writeFileSync(filepath, newContent, 'utf8');
        console.log("Updated", filepath);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            walkDir(filepath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            replaceInFile(filepath);
        }
    }
}

walkDir(srcDir);
console.log("Done");
