import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../public/catalog.html',import.meta.url),'utf8');
const loadCode=html.slice(html.indexOf("let loading=false"),html.indexOf('function populate()'));
function context(){
 const titleNode={dataset:{text:'collectionTitle'},textContent:''};
 const color={value:'Azul',options:[{value:''},{value:'Azul'}]},size={value:'M',options:[{value:''},{value:'M'}]};
 const state={renders:0,requests:0,version:1,fail:false};
 const ctx=vm.createContext({color,size,grid:{innerHTML:''},selected:null,modal:{classList:{contains:()=>false}},document:{querySelectorAll:()=>[titleNode]},populate:()=>{color.value='';size.value=''},render:()=>state.renders++,fetch:async url=>{state.requests++;return Response.json(url.includes('textos')?{brand:'Loja',brandSubtitle:'Festa',collectionTitle:'Coleção '+state.version}:[{id:'1',name:'Modelo '+state.version}],{status:state.fail?503:200})}});
 vm.runInContext("let dresses=[],siteTexts={};"+loadCode+";globalThis.refresh=load;",ctx);
 return {ctx,state,color,size,titleNode};
}
test('aba aberta recebe novas edições e mantém filtros escolhidos',async()=>{
 const {ctx,state,color,size,titleNode}=context();await ctx.refresh();
 assert.equal(titleNode.textContent,'Coleção 1');
 state.version=2;await ctx.refresh();
 assert.equal(titleNode.textContent,'Coleção 2');assert.equal(state.renders,2);
 assert.equal(color.value,'Azul');assert.equal(size.value,'M');
 await ctx.refresh();assert.equal(state.renders,2);
});
test('falha temporária de sincronização mantém o catálogo carregado',async()=>{
 const {ctx,state,titleNode}=context();await ctx.refresh();state.fail=true;await ctx.refresh();
 assert.equal(titleNode.textContent,'Coleção 1');assert.equal(state.renders,1);assert.equal(ctx.grid.innerHTML,'');
});
test('retorno à aba e intervalo visível acionam a sincronização',()=>{
 assert.match(html,/setInterval\(\(\)=>\{if\(!document.hidden\)load\(\)\},15000\)/);
 assert.match(html,/window.addEventListener\('focus',load\)/);
 assert.match(html,/document.addEventListener\('visibilitychange'/);
});
