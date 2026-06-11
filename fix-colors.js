const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'client');

const replaceRules = [
  { regex: /text-\[\#0F172A\](?!\s+dark:text-)/g, replacement: 'text-[#0F172A] dark:text-[#F9FAFB]' },
  { regex: /text-\[\#64748B\](?!\s+dark:text-)/g, replacement: 'text-[#64748B] dark:text-[#9CA3AF]' },
  { regex: /text-\[\#94A3B8\](?!\s+dark:text-)/g, replacement: 'text-[#94A3B8] dark:text-[#6B7280]' },
  { regex: /bg-slate-50(?!\s+dark:bg-)/g, replacement: 'bg-slate-50 dark:bg-[#161616]' },
  { regex: /border-slate-100(?!\s+dark:border-)/g, replacement: 'border-slate-100 dark:border-[#1f1f1f]' },
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      if (!file.includes('node_modules') && !file.includes('.next')) {
        results = results.concat(walk(file));
      }
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(directoryPath);
let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  replaceRules.forEach(rule => {
    content = content.replace(rule.regex, rule.replacement);
  });
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
  }
});

console.log(`Modified ${modifiedCount} files.`);
