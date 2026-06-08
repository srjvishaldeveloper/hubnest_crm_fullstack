const fs = require('fs');
const files = [
  'server/src/modules/super-admin/superAdmin.routes.js',
  'client/app/super-admin/users/page.tsx',
  'client/app/super-admin/crm/page.tsx',
  'client/app/super-admin/profile/page.tsx'
];
files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    // Replace \` with `
    let newContent = content.replace(/\\\`/g, '`');
    // Replace \$ with $
    newContent = newContent.replace(/\\\$/g, '$');
    
    if (content !== newContent) {
      fs.writeFileSync(f, newContent);
      console.log('Fixed:', f);
    }
  }
});
