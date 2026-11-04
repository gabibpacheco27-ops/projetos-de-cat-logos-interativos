import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parseVersion, endpoint } from '../lib/api.js';

test('aceita versões numéricas e ETags fortes ou fracas da CDN',()=>{
 for(const value of ['1','"1"','W/"1"'])assert.equal(parseVersion(value),1);
 for(const value of [null,'','0','-1','1abc','W/"NaN"','9007199254740992'])assert.equal(parseVersion(value),null);
});
test('painel conserva versão ao ler resposta comprimida e após salvar',async()=>{
 const html=fs.readFileSync(new URL('../public/editar.html',import.meta.url),'utf8');
 const helper=html.slice(html.indexOf('const revisions={};'),html.indexOf('async function start()'));
 const calls=[];
 const responses=[new Response('[]',{headers:{ETag:'W/"1"'}}),new Response('{"ok":true}',{headers:{'X-Catalog-Version':'2',ETag:'W/"2"'}}),new Response('{"ok":true}',{headers:{'X-Catalog-Version':'3'}})];
 const ctx=vm.createContext({fetch:async(url,opts)=>{calls.push({url,opts});return responses.shift()}});
 vm.runInContext(helper+';globalThis.callApi=api;',ctx);
 await ctx.callApi('/api/catalog');
 await ctx.callApi('/api/catalog',{method:'PUT',headers:{'Content-Type':'application/json'},body:'[]'});
 await ctx.callApi('/api/catalog',{method:'PUT',headers:{'Content-Type':'application/json'},body:'[]'});
 assert.equal(calls[1].opts.headers['X-Catalog-Version'],'W/"1"');
 assert.equal(calls[2].opts.headers['X-Catalog-Version'],'2');
});
test('API aceita ETag fraca e mantém o bloqueio de alterações concorrentes',async()=>{
 const originalFetch=globalThis.fetch;
 const saved={...process.env};
 Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'test',OWNER_EMAIL:'owner@example.invalid'});
 let version=1;
 globalThis.fetch=async(url,opts)=>{
  if(url.endsWith('/auth/v1/user'))return Response.json({email:'owner@example.invalid',email_confirmed_at:'2026-01-01'});
  if(opts.method==='PATCH'){
   const expected=Number(new URL(url).searchParams.get('version').slice(3));
   if(expected!==version)return Response.json([]);
   assert.equal(opts.headers.Authorization,'Bearer test-session');
   version=JSON.parse(opts.body).version;return Response.json([{version}]);
  }
  throw Error('Unexpected fetch '+url);
 };
 try {
  for(const [header,status] of [['W/"1"',200],['W/"1"',409],['2',200]]){
   const res={headers:{},setHeader(k,v){this.headers[k]=v},end(v){this.data=JSON.parse(v)}};
   await endpoint('catalog')({method:'PUT',body:[],headers:{host:'loja.test',origin:'https://loja.test',cookie:'jc_session=test-session','if-match':header}},res);
   assert.equal(res.statusCode,status);
   if(status===200)assert.equal(res.headers['X-Catalog-Version'],String(version));
  }
  assert.equal(version,3);
 }finally{globalThis.fetch=originalFetch;for(const k of Object.keys(process.env))if(!(k in saved))delete process.env[k];Object.assign(process.env,saved)}
});
