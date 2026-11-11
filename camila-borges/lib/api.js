const AUTH='https://okgcraqgdgqnjbqijsfx.supabase.co', KEY='sb_publishable_F7NRsVi3ZIXzob1CqMXmKA_1VCH62CE';
const BRIDGE='https://okgcraqgdgqnjbqijsfx.supabase.co/functions/v1/camila-catalog-admin';
const session=req=>req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('cb_session='))?.slice(11);
const headers={apikey:KEY,'Content-Type':'application/json'};
function sameOrigin(req){try{const u=new URL(req.headers.origin);return u.protocol==='https:'&&u.host===req.headers.host}catch{return false}}
function send(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data))}
export function endpoint(route){return async(req,res)=>{res.setHeader('Cache-Control','no-store');try{
 if(!['GET','POST','PUT'].includes(req.method))return send(res,405,{error:'Método não permitido.'});if(req.method!=='GET'&&!sameOrigin(req))return send(res,403,{error:'Origem inválida.'});
 if(route==='login'&&req.method==='POST'){
 const b=typeof req.body==='string'?JSON.parse(req.body):req.body;if(typeof b?.email!=='string'||typeof b.password!=='string'||b.email.length>254||b.password.length>200)return send(res,400,{error:'Informe e-mail e senha.'});
 const r=await fetch(AUTH+'/auth/v1/token?grant_type=password',{method:'POST',headers,body:JSON.stringify({email:b.email.trim().toLowerCase(),password:b.password})});if(!r.ok)return send(res,r.status===429?429:401,{error:r.status===429?'Muitas tentativas. Aguarde um pouco.':'Confira o e-mail e a senha que você usa nos outros painéis.'});const s=await r.json();
 const access=await fetch(BRIDGE+'?route=access',{headers:{Authorization:'Bearer '+s.access_token}});const a=access.ok?await access.json():null;if(!a?.allowed)return send(res,403,{error:'Este e-mail não está autorizado para a Camila Borges.'});
 res.setHeader('Set-Cookie',`cb_session=${s.access_token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${Math.min(s.expires_in||3600,3600)}`);return send(res,200,{ok:true})}
 const token=session(req);if(route==='logout'&&req.method==='POST'){if(token)await fetch(AUTH+'/auth/v1/logout?scope=local',{method:'POST',headers:{...headers,Authorization:'Bearer '+token}});res.setHeader('Set-Cookie','cb_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');return send(res,200,{ok:true})}
 if(!token){if(route==='access'&&req.method==='GET')return send(res,200,{signedIn:false,allowed:false});return send(res,401,{error:'Entre no painel para continuar.'})}
 let body;const h={Authorization:'Bearer '+token};if(req.method!=='GET'){
 if(route==='upload'){const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>4200000)return send(res,413,{error:'Escolha uma foto de até 4 MB.'});chunks.push(chunk)}const f=await new Response(Buffer.concat(chunks),{headers:{'Content-Type':req.headers['content-type']}}).formData();const file=f.get('photo');if(!file||file.size>4000000)return send(res,400,{error:'Escolha uma foto de até 4 MB.'});body=Buffer.from(await file.arrayBuffer());h['Content-Type']=file.type;
 }else{body=JSON.stringify(typeof req.body==='string'?JSON.parse(req.body):req.body);h['Content-Type']='application/json';h['X-Catalog-Version']=req.headers['x-catalog-version']||''}}
 const r=await fetch(BRIDGE+'?route='+route,{method:req.method,headers:h,body});if(r.headers.get('X-Catalog-Version'))res.setHeader('X-Catalog-Version',r.headers.get('X-Catalog-Version'));return send(res,r.status,await r.json());
 }catch{return send(res,500,{error:'Não foi possível concluir. Tente novamente.'})}}}
