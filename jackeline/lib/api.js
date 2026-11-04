import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

const configured = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_ANON_KEY);
const owner = () => (process.env.OWNER_EMAIL || '').trim().toLowerCase();
export function validCatalog(data) {
  return Array.isArray(data) && data.length <= 1000 && data.every(d => d && typeof d.id === 'string' && typeof d.name === 'string' && d.name.length <= 200 && typeof d.description === 'string' && d.description.length <= 5000 && Array.isArray(d.sizes) && d.sizes.every(s => typeof s === 'string' && s.length <= 40) && Array.isArray(d.colors) && d.colors.every(c => typeof c.name === 'string' && c.name.length <= 80 && /^#[a-f0-9]{6}$/i.test(c.hex)) && Array.isArray(d.photos) && d.photos.every(s => typeof s === 'string' && (/^\/dresses\/[\w.-]+$/.test(s) || (s.startsWith(process.env.SUPABASE_URL + '/storage/v1/object/public/dresses/') && /^https:\/\//.test(s))))) && new Set(data.map(d => d.id)).size === data.length;
}
function headers(key) { return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }; }
async function db(path, options = {}) {
  const result = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { ...headers(process.env.SUPABASE_SERVICE_ROLE_KEY), ...options.headers } });
  if (!result.ok) throw new Error('storage');
  return result.status === 204 ? null : result.json();
}
async function identity(req) {
  const token = req.headers.cookie?.split(';').map(x => x.trim()).find(x => x.startsWith('jc_session='))?.slice(11);
  if (!token || token.length > 8000) return null;
  const result = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, { headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } });
  if (!result.ok) return null;
  const user = await result.json();
  if (!user.email_confirmed_at) return null;
  const email = user.email?.toLowerCase();
  if (email && email === owner()) return { email, role: 'admin', owner: true };
  const rows = await db(`editors?email=eq.${encodeURIComponent(email || '')}&select=role`);
  return rows[0] ? { email, role: rows[0].role, owner: false } : { email, role: null };
}
export function sameOrigin(req) {
  const origin = req.headers.origin;
  return Boolean(origin && new URL(origin).host === req.headers.host);
}
function body(req) { return typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
function send(res, status, data) { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); }
function fallback(name) { return JSON.parse(fs.readFileSync(new URL(`../public/data/${name}.json`, import.meta.url), 'utf8')); }
export function endpoint(route) { return async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (!['GET', 'POST', 'PUT'].includes(req.method)) return send(res, 405, { error: 'Método não permitido.' });
    if (req.method !== 'GET' && !sameOrigin(req)) return send(res, 403, { error: 'Origem inválida.' });
    const publicRead = req.method === 'GET' && ['catalog','textos'].includes(route);
    if (!configured()) {
      if (publicRead) return send(res, 200, fallback(route === 'catalog' ? 'catalog' : 'textos'));
      if (route === 'access' && req.method === 'GET') return send(res,200,{signedIn:false,allowed:false,configured:false});
      return send(res,503,{error:'O painel aguarda a configuração do banco de dados e do login na Vercel.'});
    }
    if (route === 'login' && req.method === 'POST') {
      const {email,password} = body(req) || {};
      if (typeof email !== 'string' || typeof password !== 'string' || email.length > 254 || password.length > 200) return send(res,400,{error:'Informe e-mail e senha.'});
      const r=await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:'POST',headers:headers(process.env.SUPABASE_ANON_KEY),body:JSON.stringify({email,password})});
      if(!r.ok)return send(res,r.status===429?429:401,{error:r.status===429?'Muitas tentativas. Aguarde e tente novamente.':'Confira seu e-mail, senha e a confirmação do cadastro.'});
      const session=await r.json();
      res.setHeader('Set-Cookie',`jc_session=${session.access_token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${Math.min(session.expires_in || 3600,3600)}`);
      return send(res,200,{ok:true});
    }
    if(route==='logout'&&req.method==='POST'){
      res.setHeader('Set-Cookie','jc_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');return send(res,200,{ok:true});
    }
    const user=publicRead?null:await identity(req);
    if(route==='access' && req.method==='GET'){
      if(!user)return send(res,200,{signedIn:false,allowed:false});
      const editors=user.role==='admin'?await db('editors?select=email,role&order=email'):[];
      return send(res,200,{signedIn:true,allowed:!!user.role,isOwner:user.role==='admin',email:user.email,editors});
    }
    if(!publicRead && !user?.role)return send(res,403,{error:'Sem permissão. Entre com um e-mail autorizado.'});
    if(['catalog','textos'].includes(route)){
      const id=route==='catalog'?'main':'texts';
      if(req.method==='GET'){
        const rows=await db(`catalog?id=eq.${id}&select=data,version`);
        if(!rows[0])throw new Error('missing_seed');
        res.setHeader('ETag',`"${rows[0].version}"`);return send(res,200,rows[0].data);
      }
      if(req.method!=='PUT')return send(res,405,{error:'Método não permitido.'});
      const data=body(req);
      if(JSON.stringify(data).length>500000)return send(res,400,{error:'Catálogo muito grande.'});
      const keys=Object.keys(fallback('textos'));
      if(route==='catalog'?!validCatalog(data):(!data || keys.some(k=>typeof data[k]!=='string'||!data[k].trim()||data[k].length>500)))return send(res,400,{error:'Confira os campos preenchidos.'});
      const version=Number(String(req.headers['if-match']||'').replaceAll('"',''));
      if(!Number.isSafeInteger(version)||version<1)return send(res,409,{error:'Atualize a página antes de salvar.'});
      const clean=route==='textos'?Object.fromEntries(keys.map(k=>[k,data[k].trim()])):data;
      const updated=await db(`catalog?id=eq.${id}&version=eq.${version}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({data:clean,version:version+1})});
      if(!updated.length)return send(res,409,{error:'Outra pessoa alterou o catálogo. Atualize a página antes de salvar.'});
      res.setHeader('ETag',`"${version+1}"`);return send(res,200,{ok:true});
    }
    if(route==='access'&&req.method==='POST'){
      if(user.role!=='admin')return send(res,403,{error:'Somente responsáveis podem alterar acessos.'});
      const input=body(req)||{}; const email=String(input.email||'').trim().toLowerCase();
      if(!/^\S+@\S+\.\S+$/.test(email)||email.length>254||email===owner()||email===user.email)return send(res,400,{error:'Informe outro e-mail válido.'});
      if(input.remove)await db(`editors?email=eq.${encodeURIComponent(email)}`,{method:'DELETE'});
      else await db('editors?on_conflict=email',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({email,role:input.role==='admin'?'admin':'editor'})});
      return send(res,200,{ok:true});
    }
    if(route==='upload'&&req.method==='POST'){
      const chunks=[];let length=0;
      for await(const chunk of req){length+=chunk.length;if(length>4200000)return send(res,413,{error:'Escolha uma foto de até 4 MB.'});chunks.push(chunk)}
      const form=await new Response(Buffer.concat(chunks),{headers:{'Content-Type':req.headers['content-type']}}).formData();const file=form.get('photo');
      if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>4000000)return send(res,400,{error:'Escolha JPG, PNG ou WebP de até 4 MB.'});
      const bytes=Buffer.from(await file.arrayBuffer());
      const magic=file.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:file.type==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
      if(!magic)return send(res,400,{error:'Arquivo de imagem inválido.'});
      const key=randomUUID()+'.'+({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type]);
      const r=await fetch(`${process.env.SUPABASE_URL}/storage/v1/object/dresses/${key}`,{method:'POST',headers:{...headers(process.env.SUPABASE_SERVICE_ROLE_KEY),'Content-Type':file.type},body:bytes});if(!r.ok)throw Error('upload');
      return send(res,200,{url:`${process.env.SUPABASE_URL}/storage/v1/object/public/dresses/${key}`});
    }
    return send(res,405,{error:'Método não permitido.'});
  }catch{return send(res,500,{error:'Não foi possível concluir. Confira a configuração do serviço e tente novamente.'})}
}; }
