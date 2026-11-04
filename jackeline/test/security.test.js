import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { endpoint, validCatalog, sameOrigin } from '../lib/api.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../public/data/catalog.json',import.meta.url),'utf8'));
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v},end(s){this.data=JSON.parse(s)}}}
async function withService(run){
 const oldFetch=globalThis.fetch,env={...process.env};
 Object.assign(process.env,{SUPABASE_URL:'https://test.supabase.co',SUPABASE_ANON_KEY:'public-key',OWNER_EMAIL:'owner@test.invalid'});
 try{await run()}finally{globalThis.fetch=oldFetch;for(const k of Object.keys(process.env))if(!(k in env))delete process.env[k];Object.assign(process.env,env)}
}
const base={host:'loja.test',origin:'https://loja.test',cookie:'jc_session=session-token'};
test('validação impede vestido sem nome, sem fotos, URL insegura e cor nula',()=>{
 for(const change of [d=>d.name=' ',d=>d.photos=[],d=>d.photos=['javascript:alert(1)'],d=>d.colors=[null]]){
  const next=structuredClone(catalog);change(next[0]);assert.equal(validCatalog(next),false);
 }
 assert.equal(sameOrigin({headers:{host:'loja.test',origin:'not a URL'}}),false);
 assert.equal(sameOrigin({headers:{host:'loja.test',origin:'http://loja.test'}}),false);
});
test('logout revoga a sessão corrente no servidor antes de limpar o cookie',()=>withService(async()=>{
 let requested=false;globalThis.fetch=async(url,opts)=>{assert.match(url,/\/auth\/v1\/logout\?scope=local$/);assert.equal(opts.headers.Authorization,'Bearer session-token');requested=true;return new Response(null,{status:204})};
 const res=response();await endpoint('logout')({method:'POST',headers:base},res);
 assert.equal(requested,true);assert.equal(res.statusCode,200);assert.match(res.headers['Set-Cookie'],/Max-Age=0/);
}));
test('falha ao revogar a sessão mostra erro e mantém opção de tentar sair novamente',()=>withService(async()=>{
 globalThis.fetch=async()=>new Response(null,{status:503});const res=response();await endpoint('logout')({method:'POST',headers:base},res);
 assert.equal(res.statusCode,503);assert.equal(res.headers['Set-Cookie'],undefined);
}));
test('funcionária não pode administrar equipe, e sessão expirada não pode salvar',()=>withService(async()=>{
 globalThis.fetch=async url=>url.endsWith('/auth/v1/user')?Response.json({email:'staff@test.invalid',email_confirmed_at:'2026-01-01'}):Response.json('editor');
 const staff=response();await endpoint('access')({method:'POST',headers:base,body:{email:'other@test.invalid',role:'admin'}},staff);assert.equal(staff.statusCode,403);
 globalThis.fetch=async()=>new Response(null,{status:401});const expired=response();await endpoint('catalog')({method:'PUT',headers:base,body:catalog},expired);assert.equal(expired.statusCode,401);
}));
test('API responde 400 para JSON inválido ou corpo vazio',()=>withService(async()=>{
 globalThis.fetch=async url=>url.endsWith('/auth/v1/user')?Response.json({email:'owner@test.invalid',email_confirmed_at:'2026-01-01'}):Response.json('admin');
 for(const body of ['{broken',null,undefined]){const res=response();await endpoint('catalog')({method:'PUT',headers:base,body},res);assert.equal(res.statusCode,400)}
}));
test('upload multipart válido é enviado somente após confirmar permissão',()=>withService(async()=>{
 let uploaded=false;globalThis.fetch=async(url,opts)=>{
  if(url.endsWith('/auth/v1/user'))return Response.json({email:'staff@test.invalid',email_confirmed_at:'2026-01-01'});
  if(url.endsWith('/rpc/catalog_access'))return Response.json('editor');
  assert.match(url,/\/storage\/v1\/object\/dresses\/.*\.png$/);assert.equal(opts.headers.Authorization,'Bearer session-token');uploaded=true;return Response.json({Key:'photo'});
 };
 const form=new FormData();form.append('photo',new Blob([new Uint8Array([137,80,78,71,13,10,26,10,1])],{type:'image/png'}),'photo.png');const request=new Request('https://loja.test/api/upload',{method:'POST',body:form});const bytes=new Uint8Array(await request.arrayBuffer());
 const req={method:'POST',headers:{...base,'content-type':request.headers.get('content-type')},async *[Symbol.asyncIterator](){yield bytes}};
 const res=response();await endpoint('upload')(req,res);assert.equal(res.statusCode,200);assert.equal(uploaded,true);assert.match(res.data.url,/^https:\/\/test.supabase.co\/storage\/v1\/object\/public\/dresses\//);
}));
