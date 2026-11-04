import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validCatalog, sameOrigin, endpoint } from '../lib/api.js';
const seed=JSON.parse(fs.readFileSync(new URL('../public/data/catalog.json',import.meta.url)));
test('catálogo importado passa a validação',()=>assert.equal(validCatalog(seed),true));
test('bloqueia URL de foto executável e IDs repetidos',()=>{
 const data=structuredClone(seed);data[0].photos=['javascript:alert(1)'];assert.equal(validCatalog(data),false);
 assert.equal(validCatalog([seed[0],seed[0]]),false);
});
test('bloqueia gravação de outra origem',()=>{
 assert.equal(sameOrigin({headers:{origin:'https://evil.test',host:'loja.test'}}),false);
 assert.equal(sameOrigin({headers:{origin:'https://loja.test',host:'loja.test'}}),true);
 assert.equal(sameOrigin({headers:{host:'loja.test'}}),false);
});
test('sem configuração, catálogo disponível e gravação bloqueada',async()=>{
 for(const method of ['GET','PUT']){
  const res={setHeader(){},end(text){this.data=JSON.parse(text)}};
  await endpoint('catalog')({method,headers:{host:'loja.test',origin:'https://loja.test'}},res);
  assert.equal(res.statusCode,method==='GET'?200:503);
 }
});
