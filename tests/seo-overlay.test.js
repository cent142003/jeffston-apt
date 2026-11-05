const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.resolve(__dirname,'../vercel-seo-overlay');
const read=(f)=>fs.readFileSync(path.join(dir,f),'utf8');
test('Vercel overlay serves local SEO resources before preserving existing apartment app',()=>{
 const cfg=JSON.parse(read('vercel.json'));
 assert.ok(cfg.routes.some(x=>x.handle==='filesystem'));
 assert.ok(cfg.routes.some(x=>x.src==='/(.*)'&&String(x.dest).startsWith('https://jeffston-court-apartments.cent142003.chatgpt.site/')));
 assert.ok(!fs.existsSync(path.join(dir,'index.html')),'Never replace live booking index');
});
test('robots exposes original sitemap and additional guide sitemap',()=>{
 const robots=read('robots.txt');
 assert.match(robots,/Allow:\s*\//);
 assert.match(robots,/https:\/\/jeffston-court-apartments.vercel.app\/sitemap.xml/);
 assert.match(robots,/https:\/\/jeffston-court-apartments.vercel.app\/sitemap-seo.xml/);
});
test('new apartment landing pages are descriptive and honest without fabricated prices',()=>{
 const routes=['corporate-stays-north-kaneshie.html','short-stay-apartments-accra.html'];
 const xml=read('sitemap-seo.xml');
 for(const route of routes){
   const h=read(route);
   assert.match(h,/<html lang="en-GH">/);
   assert.match(h,/<meta name="description" content="[^"]{75,200}"/);
   assert.match(h,/<h1\b/i);
   assert.ok(h.includes('https://jeffston-court-apartments.vercel.app/'+route));
   assert.ok(xml.includes('<loc>https://jeffston-court-apartments.vercel.app/'+route+'</loc>'));
   assert.match(h,/(?:North Kaneshie|Accra)/);
   assert.match(h,/(?:2-bedroom|3-bedroom)/);
   assert.match(h,/jeffston-court-apartments.vercel.app/);
   assert.doesNotMatch(h,/(?:GH₵|GHS|₵)\s*\d{2,}/);
   const schemas=[...h.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)];
   assert.ok(schemas.length);
   schemas.forEach(m=>JSON.parse(m[1]));
 }
});
