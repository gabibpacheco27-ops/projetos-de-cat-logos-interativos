import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const js=fs.readFileSync(new URL('../public/catalog.js',import.meta.url),'utf8');
const refreshCode=js.slice(js.indexOf('let loading=false;'),js.indexOf('const style='));
function context(){const state={version:1,renders:0,fail:false};const ctx=vm.createContext({fetch:async url=>Response.json(url.includes('textos')?{collectionTitle:'Coleção '+state.version}:[{id:'1',name:'Modelo '+state.version}],{status:state.fail?503:200}),applyTexts:()=>{},filters:()=>{},render:()=>state.renders++,renderModal:()=>{},dialog:{open:false},grid:{innerHTML:''},$:()=>null});vm.runInContext('let products=[],texts={};'+refreshCode+';globalThis.refresh=refresh;globalThis.data=()=>({products,texts});',ctx);return {state,ctx}}
test('catálogo aberto recebe novos vestidos e textos sem recarregar',async()=>{const {state,ctx}=context();await ctx.refresh();assert.equal(ctx.data().texts.collectionTitle,'Coleção 1');state.version=2;await ctx.refresh();assert.equal(ctx.data().products[0].name,'Modelo 2');assert.equal(ctx.data().texts.collectionTitle,'Coleção 2');assert.equal(state.renders,2);await ctx.refresh();assert.equal(state.renders,2)});
test('erro temporário mantém os dados já carregados',async()=>{const {state,ctx}=context();await ctx.refresh();state.fail=true;await ctx.refresh();assert.equal(ctx.data().products[0].name,'Modelo 1');assert.equal(state.renders,1);assert.equal(ctx.grid.innerHTML,'')});
