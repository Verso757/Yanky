import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'src/pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

for (const f of files) {
  const filePath = path.join(pagesDir, f);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace <DialogTrigger asChild> \n <Button ...> ... </Button> \n </DialogTrigger>
  content = content.replace(/<DialogTrigger asChild>\s*<Button([^>]*)>([\s\S]*?)<\/Button>\s*<\/DialogTrigger>/gm, 
    '<DialogTrigger render={<Button$1 />}>$2</DialogTrigger>');

  // Also catch <Button asChild> <Link ...> ... </Link> </Button>
  content = content.replace(/<Button([^>]*) asChild>\s*<Link([^>]*)>([\s\S]*?)<\/Link>\s*<\/Button>/gm,
    '<Button$1 render={<Link$2 />}>$3</Button>');

  fs.writeFileSync(filePath, content);
}
console.log("Fixes applied");
