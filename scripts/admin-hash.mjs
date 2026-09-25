// npm run admin:hash -- "my-password"  → bcrypt hash to put into ADMIN_PASSWORD
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password || password.length < 8) {
  console.error('Использование: npm run admin:hash -- "пароль-не-короче-8-символов"');
  process.exit(1);
}
console.log(await bcrypt.hash(password, 12));
