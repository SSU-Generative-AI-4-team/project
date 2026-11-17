import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile, stat } from 'node:fs/promises';

test('every precached resource exists; worker handles only public app assets offline', async () => {
  const listeners={}, stored=new Map(), deleted=[];
  const cache = { addAll:async urls=>{ for(const url of urls) {
    const path=new URL(url).pathname.replace('/app/','');
    const asset=new URL('../'+(path||'index.html'),import.meta.url);
    assert.ok((await stat(asset)).isFile(),path); stored.set(url,new Response(await readFile(asset)));
  } }, match:async url=>stored.get(url)?.clone() };
  const scope='https://example.test/app/';
  vm.runInNewContext(await readFile(new URL('../sw.js',import.meta.url),'utf8'),{
    self:{registration:{scope},clients:{claim:async()=>{}},addEventListener:(n,cb)=>listeners[n]=cb},
    caches:{open:async()=>cache,keys:async()=>['emotion-incinerator-v6','hatcheat-old','unrelated-app'],delete:async key=>deleted.push(key)},
    URL,Response,fetch:async()=>{throw Error('offline');}
  });
  let pending; listeners.install({waitUntil:work=>pending=work}); await pending;
  assert.ok(stored.has(scope+'assets/haechi/haechi_eat.png')); assert.ok(stored.has(scope+'quotes.js'));
  listeners.activate({waitUntil:work=>pending=work}); await pending;
  assert.deepEqual(deleted,['emotion-incinerator-v6','hatcheat-old']);
  let response; listeners.fetch({request:{method:'GET',url:scope},respondWith:work=>response=work});
  assert.match(await (await response).text(),/해칫/);
  for(const request of [{method:'POST',url:scope},{method:'GET',url:scope+'private-note'},{method:'GET',url:scope+'?draft=secret'},{method:'GET',url:'https://elsewhere.test/'}]) {
    let intercepted=false; listeners.fetch({request,respondWith:()=>intercepted=true}); assert.equal(intercepted,false);
  }
});
