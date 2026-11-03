import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, normalizeState, readState, saveState, STORAGE_KEY, canGive, grindOnce, inkReaction, pickQuote, CircularGesture, GivingRitual } from '../core.js';
import { BOOKS, QUOTES, quoteById } from '../quotes.js';
const storageMock = () => { const map = new Map(); return { getItem:k=>map.get(k)??null, setItem:(k,v)=>map.set(k,v), map }; };

test('blank notes are rejected; Korean, emoji and long notes are accepted', () => {
  for (const text of ['', ' \t\n', null]) assert.equal(canGive(text),false);
  for (const text of ['가','😔','긴 문장\n'.repeat(10000)]) assert.equal(canGive(text),true);
});
test('failed giving preserves the exact original while success removes it', () => {
  const r = new GivingRitual(), text = '  속상해요\n<script>태그</script> 😔';
  let token = r.begin(text); assert.equal(r.begin('중복'),null);
  assert.equal(r.fail(token),text); assert.equal(r.draft,'');
  token = r.begin(text); assert.equal(r.complete(token),true); assert.equal(r.draft,''); assert.equal(r.status,'done');
  assert.equal(r.complete(token),false); assert.equal(r.fail(token),null);
});
test('backgrounding invalidates callbacks and clears text, including during an animation', () => {
  const r = new GivingRitual(), old = r.begin('원문'); r.clear();
  const newer = r.begin('새 원문');
  assert.equal(r.complete(old),false); assert.equal(r.fail(old),null);
  assert.equal(r.draft,'새 원문'); assert.equal(r.complete(newer),true);
});
test('only non-sensitive progress and preferences may be persisted', () => {
  const storage = storageMock();
  saveState(storage,{ ...initialState(), turns:37, draft:'비밀 원문', count:50, date:'today', letter:'편지' });
  assert.deepEqual(JSON.parse(storage.map.get(STORAGE_KEY)),{ version:1, turns:37, collection:[], book:'random', sound:false });
});
test('invalid storage is bounded and unknown cards/books are discarded', () => {
  assert.deepEqual(normalizeState({version:2,turns:90}),initialState());
  for (const turns of [-1,100,NaN,'40',1.2]) assert.equal(normalizeState({version:1,turns}).turns,0);
  assert.deepEqual(normalizeState({version:1,collection:['ta-1','<img>',null],book:'unknown'}).collection,['ta-1']);
  const storage = storageMock(); storage.setItem(STORAGE_KEY,'broken json'); assert.equal(readState(storage).status,'invalid');
});
test('unavailable storage and quota failures do not throw', () => {
  assert.equal(readState(undefined).status,'unavailable');
  const broken = { setItem() { throw Error('quota'); } };
  assert.equal(saveState(broken,initialState()),false);
});
test('99 turns give no card; the 100th awards exactly one and resets progress', () => {
  let state = initialState();
  for (let i=1;i<=99;i++) { const result = grindOnce(state); state=result.state; assert.equal(result.quote,null); assert.equal(state.turns,i); }
  const result = grindOnce(state,()=>0); assert.equal(result.state.turns,0); assert.equal(result.state.collection.length,1);
  assert.equal(result.quote.id,result.state.collection[0]); assert.equal(state.turns,99);
  assert.equal(grindOnce(result.state).state.turns,1);
});
test('haechi reactions follow saved progress and reset after a card', () => {
  for (const [turns,stage] of [[0,0],[19,0],[20,20],[39,20],[40,40],[59,40],[60,60],[80,60],[99,60]]) {
    assert.equal(inkReaction(turns).stage,stage);
  }
  assert.match(inkReaction(80).message,/거의 다 왔어요/);
  assert.equal(inkReaction(grindOnce({...initialState(),turns:99}).state.turns).stage,0);
});
test('progress and collection survive a reload without dates or visit counters', () => {
  const storage = storageMock(), state = {...initialState(),turns:37,collection:['ta-1'],book:'tao',sound:true};
  assert.ok(saveState(storage,state)); assert.deepEqual(readState(storage).state,state);
});
test('every selectable book has sourced excerpts; fixed books work after exhaustion', () => {
  assert.equal(new Set(QUOTES.map(q=>q.id)).size,QUOTES.length);
  for (const book of BOOKS.filter(b=>b.id!=='random')) {
    let state = {...initialState(),book:book.id};
    const choices = QUOTES.filter(q=>q.book===book.id); assert.ok(choices.length>=2);
    for (let i=0;i<6;i++) {
      const quote = pickQuote(state,()=>0); assert.equal(quote.book,book.id); assert.ok(quote.source.startsWith('https://'));
      assert.notEqual(quote.id,state.collection.at(-1)); state.collection.push(quote.id);
    }
  }
});
test('random selection avoids repeating until all 12 cards have appeared', () => {
  const state=initialState();
  for (let i=0;i<QUOTES.length;i++) state.collection.push(pickQuote(state,()=>0).id);
  assert.equal(new Set(state.collection).size,QUOTES.length);
  assert.ok(quoteById(pickQuote(state,()=>1).id));
});
test('each completed random cycle reshuffles, without repeating at the boundary', () => {
  const state = initialState();
  for (let i=0;i<QUOTES.length;i++) state.collection.push(pickQuote(state,()=>0).id);
  const first = [...state.collection];
  for (let i=0;i<QUOTES.length;i++) {
    const quote = pickQuote(state,()=>.999);
    assert.notEqual(quote.id,state.collection.at(-1));
    state.collection.push(quote.id);
  }
  const second = state.collection.slice(QUOTES.length);
  assert.equal(new Set(second).size,QUOTES.length);
  assert.notDeepEqual(second,first);
});
function circle(g, direction=1) { let count=0; for(let i=0;i<=64;i++) { const angle=direction*i/64*2*Math.PI; count+=g.move(Math.cos(angle)*.65,Math.sin(angle)*.65); } return count; }
test('both directions and the angle seam count exactly one full revolution', () => {
  assert.equal(circle(new CircularGesture(),1),1); assert.equal(circle(new CircularGesture(),-1),1);
});
test('a hand-drawn circle may finish slightly short without awarding extra turns over time', () => {
  for (const direction of [1,-1]) {
    const g = new CircularGesture(); let count=0;
    for(let i=0;i<=96;i++) {
      const angle=direction*i/96*Math.PI*1.94;
      count+=g.move(Math.cos(angle)*.65,Math.sin(angle)*.65);
    }
    assert.equal(count,1);
    g.reset(); count=0;
    for(let i=0;i<=64*100;i++) {
      const angle=direction*i/64*Math.PI*2;
      count+=g.move(Math.cos(angle)*.65,Math.sin(angle)*.65);
    }
    assert.equal(count,100,'Closing tolerance must not shorten every subsequent turn');
    g.reset(); count=0;
    for(let i=0;i<=48;i++) {const angle=direction*i/64*Math.PI*2;count+=g.move(Math.cos(angle)*.65,Math.sin(angle)*.65);}
    assert.equal(count,0,'Three quarters of a circle is not a full turn');
  }
});
test('scrubbing, center movements, pointer resets and teleports do not award turns', () => {
  const g = new CircularGesture(); let count=0;
  for(let i=0;i<500;i++) count+=g.move(Math.cos(i%2)*.6,Math.sin(i%2)*.6);
  assert.equal(count,0);
  for(let i=0;i<50;i++) { count+=g.move(.02,.03); count+=g.move(-.02,-.03); }
  assert.equal(count,0);
  g.reset(); for(let i=0;i<100;i++) count+=g.move(i%2?.7:-.7,0); assert.equal(count,0);
  g.reset(); for(let i=0;i<31;i++) g.move(Math.cos(i/64*2*Math.PI)*.6,Math.sin(i/64*2*Math.PI)*.6);
  g.reset(); for(let i=31;i<64;i++) count+=g.move(Math.cos(i/64*2*Math.PI)*.6,Math.sin(i/64*2*Math.PI)*.6);
  assert.equal(count,0);
});
