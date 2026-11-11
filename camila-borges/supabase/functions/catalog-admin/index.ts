const AUTH='https://okgcraqgdgqnjbqijsfx.supabase.co', AUTH_KEY='sb_publishable_F7NRsVi3ZIXzob1CqMXmKA_1VCH62CE';
const text=(v,max=2048)=>typeof v==='string'&&v.length<=max;
const photo=(s,base)=>text(s)&&(/^assets\/[\w.-]+$/.test(s)||s.startsWith(base+'/storage/v1/object/public/camila-dresses/'));
Deno.serve(async req=>{
 const out=(value,status=200,version=null)=>Response.json(value,{status,headers:{'Cache-Control':'no-store',...(version?{'X-Catalog-Version':String(version)}:{})}});
 try{
 const token=req.headers.get('Authorization');if(!token||token.length>8100)return out({error:'Entre com seu e-mail e senha.'},401);
 const identity=await fetch(AUTH+'/auth/v1/user',{headers:{apikey:AUTH_KEY,Authorization:token}});if(!identity.ok)return out({error:'Sua sessão expirou. Entre novamente.'},401);
 const user=await identity.json();if(!user.email_confirmed_at)return out({error:'Confirme o e-mail da sua conta.'},403);
 const base=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 const headers={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
 const db=async(path,opts={})=>{const r=await fetch(base+'/rest/v1/'+path,{...opts,headers:{...headers,...opts.headers}});if(!r.ok)throw Error('database');return r.status===204?null:r.json()};
 const team=await db('camila_team?email=eq.'+encodeURIComponent(user.email.toLowerCase())+'&select=role');const role=team[0]?.role;
 const route=new URL(req.url).searchParams.get('route');
 if(route==='access'&&req.method==='GET'){const editors=role==='admin'?await db('camila_team?select=email,role&order=email'):[];return out({signedIn:true,allowed:!!role,isOwner:role==='admin',email:user.email,editors})}
 if(!role)return out({error:'Este e-mail não tem permissão para editar a Camila Borges.'},403);
 if(route==='access'&&req.method==='POST'){
 if(role!=='admin')return out({error:'Somente responsáveis podem alterar acessos.'},403);
 const input=await req.json(),email=String(input.email||'').trim().toLowerCase();
 if(!/^\S+@\S+\.\S+$/.test(email)||email.length>254||email==='gabibpacheco27@gmail.com'||email===user.email.toLowerCase())return out({error:'Informe outro e-mail válido.'},400);
 if(input.remove)await db('camila_team?email=eq.'+encodeURIComponent(email),{method:'DELETE'});else await db('camila_team?on_conflict=email',{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:JSON.stringify({email,role:input.role==='admin'?'admin':'editor'})});return out({ok:true})}
 if(route==='upload'&&req.method==='POST'){
 const bytes=new Uint8Array(await req.arrayBuffer()),type=req.headers.get('Content-Type');
 if(!['image/jpeg','image/png','image/webp'].includes(type)||bytes.length>4000000||!bytes.length)return out({error:'Use JPG, PNG ou WebP de até 4 MB.'},400);
 const magic=type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:type==='image/png'?[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v):new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP';
 if(!magic)return out({error:'Arquivo de imagem inválido.'},400);
 const path=crypto.randomUUID()+'.'+({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[type]);const r=await fetch(base+'/storage/v1/object/camila-dresses/'+path,{method:'POST',headers:{...headers,'Content-Type':type},body:bytes});if(!r.ok)throw Error('upload');return out({url:base+'/storage/v1/object/public/camila-dresses/'+path})}
 if(!['catalog','textos'].includes(route))return out({error:'Rota inválida.'},404);
 const row=(await db('camila_catalog?id=eq.1&select=content,revision'))[0];
 if(req.method==='GET')return out(route==='catalog'?row.content.models.map(m=>({...m,description:m.desc})):row.content.texts,200,row.revision);
 if(req.method!=='PUT')return out({error:'Método inválido.'},405);
 const version=Number(String(req.headers.get('X-Catalog-Version')||'').replaceAll('"',''));if(!Number.isSafeInteger(version)||version!==row.revision)return out({error:'Outra pessoa alterou o catálogo. Atualize a página antes de salvar.'},409);
 const data=await req.json();if(JSON.stringify(data).length>500000)return out({error:'Catálogo muito grande.'},400);
 if(route==='catalog'){
 if(!Array.isArray(data)||data.length>1000||new Set(data.map(d=>d.id)).size!==data.length||!data.every(d=>d&&text(d.id,100)&&d.id.trim()&&text(d.name,200)&&d.name.trim()&&text(d.description,5000)&&Array.isArray(d.photos)&&d.photos.length>0&&d.photos.length<=30&&d.photos.every(s=>photo(s,base))&&Array.isArray(d.colors)&&d.colors.length<=100&&d.colors.every(c=>text(c.name,80)&&/^#[a-f0-9]{6}$/i.test(c.hex))&&Array.isArray(d.sizes)&&d.sizes.length<=100&&d.sizes.every(s=>text(s,40))))return out({error:'Confira o nome, as fotos e as informações do vestido.'},400);
 row.content.models=data.map(d=>({id:d.id,name:d.name,desc:d.description,photos:d.photos,colors:d.colors,sizes:d.sizes}));
 }else{
 const keys=Object.keys(row.content.texts);if(!data||keys.some(k=>!text(data[k])||!data[k].trim())||!/^\d{10,15}$/.test(data.whatsapp)||!photo(data.heroImage,base))return out({error:'Confira os textos, a foto e o WhatsApp.'},400);
 const map=new URL(data.maps);if(map.protocol!=='https:'||!['www.google.com','google.com','maps.google.com','maps.app.goo.gl'].includes(map.hostname))return out({error:'Confira o link do Google Maps.'},400);
 row.content.texts=Object.fromEntries(keys.map(k=>[k,data[k].trim()]));
 }
 const updated=await db('camila_catalog?id=eq.1&revision=eq.'+version,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({content:row.content,revision:version+1,updated_at:new Date().toISOString()})});if(!updated.length)return out({error:'Outra pessoa alterou o catálogo. Atualize antes de salvar.'},409);return out({ok:true},200,version+1);
 }catch(e){return out({error:'Não foi possível concluir. Confira os dados e tente novamente.'},500)}
});
