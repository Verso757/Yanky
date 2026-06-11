import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'src/pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

for (const f of files) {
  const filePath = path.join(pagesDir, f);
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/import axios from "@\/lib\/api";/g, 'import axios from "@/src/lib/api";');
  fs.writeFileSync(filePath, content);
}
console.log("Axios imports fixed in pages.");

const authCtxPath = path.join(process.cwd(), 'src/context/AuthContext.tsx');
let authCtxContent = fs.readFileSync(authCtxPath, 'utf-8');
authCtxContent = authCtxContent.replace(/import axios from "@\/lib\/api";/g, 'import axios from "@/src/lib/api";');
fs.writeFileSync(authCtxPath, authCtxContent);
console.log("Axios imports fixed in AuthContext.");
