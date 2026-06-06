const bcrypt = require('bcryptjs');

const hash = "$2a$12$1M.pynoM5b0sWDba0Okl5.Y4AEbiWxtdYzFpo1h/.VrI2oNwcPLXS";

async function run() {
  console.log("Tenant@123!:", await bcrypt.compare("Tenant@123!", hash));
  console.log("ResetPwd@8op5p9:", await bcrypt.compare("ResetPwd@8op5p9", hash));
  console.log("Admin@123:", await bcrypt.compare("Admin@123", hash));
}
run();
