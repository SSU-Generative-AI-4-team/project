import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const port=process.env.TEST_PORT || '4176', base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['server.mjs'],{cwd:fileURLToPath(new URL('..',import.meta.url)),env:{...process.env,PORT:port},stdio:'pipe'});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const macChrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const artifacts=process.env.QA_OUTPUT || join(tmpdir(),'hatcheat-browser-qa'); mkdirSync(artifacts,{recursive:true});
let browser, cases=0;
async function check(name,fn,options={}) {
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',...options});
  const page=await context.newPage(), errors=[]; page.on('pageerror',error=>errors.push(error.message));
  try { await fn(page,context); assert.deepEqual(errors,[]); cases++; console.log(`PASS ${name}`); }
  finally { await context.close(); }
}
const visible=(page,id)=>page.locator(id).waitFor({state:'visible'});
const tab=(page,name)=>page.locator(`.tabbar [data-view="${name}"]`).click();
async function observeSound(page) {
  await page.addInitScript(() => {
    window.playedSounds = []; window.stoppedSounds = 0;
    const OriginalContext = window.AudioContext;
    window.AudioContext = class extends OriginalContext {
      constructor(...args) { super(...args); window.testAudioContext = this; }
    };
    const start = AudioBufferSourceNode.prototype.start, stop = AudioBufferSourceNode.prototype.stop;
    AudioBufferSourceNode.prototype.start = function(...args) {
      const samples = this.buffer.getChannelData(0);
      window.playedSounds.push({duration:this.buffer.duration,peak:samples.reduce((peak,v)=>Math.max(peak,Math.abs(v)),0),state:this.context.state,loop:this.loop});
      return start.apply(this,args);
    };
    AudioBufferSourceNode.prototype.stop = function(...args) { window.stoppedSounds++; return stop.apply(this,args); };
  });
}
try {
  for(let i=0;i<50;i++) { try { if((await fetch(base)).ok) break; } catch {} await delay(100); }
  browser=await chromium.launch({headless:true,...((process.env.BROWSER_PATH || existsSync(macChrome))?{executablePath:process.env.BROWSER_PATH || macChrome}:{})});
  await check('effects start on, use real quiet PCM, and follow the giving phases',async page=>{
    await observeSound(page); await page.goto(base); await tab(page,'ink'); await page.locator('#grind-once').click();
    await page.waitForFunction(()=>window.playedSounds.some(sound=>sound.loop));
    await page.locator('#settings-open').click(); assert.ok(await page.locator('#sound-toggle').isChecked());
    await page.locator('#settings-dialog .button.close-dialog').click(); await tab(page,'write');
    await page.locator('#draft').fill('효과음 검증용 가상 문장');
    await page.evaluate(()=>{window.playedSounds=[];}); await page.locator('#give').click(); await visible(page,'#done-view');
    await page.waitForFunction(()=>window.playedSounds.length>=6);
    const played=await page.evaluate(()=>window.playedSounds);
    assert.deepEqual(played.map(s=>Number(s.duration.toFixed(2))),[.62,.44,.19,.19,.19,.85]);
    // Decoding to the device sample rate can overshoot the file's 0.18 peak slightly.
    assert.ok(played.every(s=>s.peak>0.1&&s.peak<.22&&s.state==='running'),JSON.stringify(played));
    assert.equal(await page.locator('#draft').inputValue(),'');
  });
  await check('backgrounding cancels pending cues; disabling effects stops active playback',async page=>{
    await observeSound(page); await page.goto(base); await tab(page,'ink'); await page.locator('#grind-once').click();
    await page.waitForFunction(()=>window.playedSounds.length>0);
    await page.locator('#settings-open').click(); assert.ok(await page.locator('#sound-toggle').isChecked());
    await page.locator('#sound-toggle').uncheck();
    await page.waitForFunction(()=>window.testAudioContext.state==='suspended');
    assert.ok(await page.evaluate(()=>window.stoppedSounds>0));
    await page.locator('#sound-toggle').check(); await page.locator('#settings-dialog .button.close-dialog').click(); await tab(page,'write');
    await page.locator('#draft').fill('배경 전환 중 멈출 가상 문장');
    await page.evaluate(()=>{window.playedSounds=[];}); await page.locator('#give').click();
    await page.waitForFunction(()=>window.playedSounds.length>0);
    await page.evaluate(()=>window.dispatchEvent(new Event('hatcheat:background')));
    const count=await page.evaluate(()=>window.playedSounds.length);
    await page.waitForTimeout(5300);
    assert.equal(await page.evaluate(()=>window.playedSounds.length),count);
    assert.equal(await page.evaluate(()=>window.testAudioContext.state),'suspended');
    assert.equal(await page.locator('#draft').inputValue(),''); assert.ok(await page.locator('#done-view').isHidden());
    assert.equal(await page.evaluate(()=>document.getAnimations().length),0);
    await tab(page,'ink'); await page.locator('#grind-once').click();
    await page.waitForFunction(n=>window.playedSounds.length>n,count);
  });
  await check('missing sound assets never block giving or awarding a card',async page=>{
    await page.route('**/assets/audio/**',route=>route.abort());
    await page.goto(base); await page.locator('#settings-open').click(); await page.locator('#sound-toggle').check();
    await page.locator('#settings-dialog .button.close-dialog').click();
    await page.locator('#draft').fill('소리가 없어도 건네는 가상 문장'); await page.locator('#give').click(); await visible(page,'#done-view');
    await tab(page,'ink'); await page.evaluate(()=>{for(let i=0;i<100;i++) document.getElementById('grind-once').click();});
    await visible(page,'#quote-dialog');
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('hatcheat.progress.v1')).collection.length),1);
  },{reducedMotion:'reduce'});
  await check('grinding sound follows hand movement and stops when motion stops',async page=>{
    await observeSound(page); await page.goto(base);
    await page.locator('#settings-open').click(); await page.locator('#sound-toggle').check();
    await page.locator('#settings-dialog .button.close-dialog').click(); await tab(page,'ink');
    const r=await page.locator('#grinding-surface').boundingBox();
    const point=a=>({x:r.x+r.width/2+Math.cos(a)*r.width*.32,y:r.y+r.height/2+Math.sin(a)*r.height*.32});
    await page.evaluate(()=>{window.playedSounds=[];window.stoppedSounds=0;});
    await page.mouse.move(point(0).x,point(0).y); await page.mouse.down();
    await page.waitForTimeout(180);
    assert.equal(await page.evaluate(()=>window.playedSounds.some(s=>s.loop)),false,'Holding still must stay quiet');
    for(let i=1;i<=8;i++){const p=point(i/16*Math.PI);await page.mouse.move(p.x,p.y);}
    await page.waitForFunction(()=>window.playedSounds.some(s=>s.loop));
    await page.waitForTimeout(220);
    assert.ok(await page.evaluate(()=>window.stoppedSounds>0),'Pausing the hand must stop grinding sound');
    for(let i=9;i<=16;i++){const p=point(i/16*Math.PI);await page.mouse.move(p.x,p.y);}
    await page.waitForFunction(()=>window.playedSounds.filter(s=>s.loop).length>=2);
    const stopped=await page.evaluate(()=>window.stoppedSounds); await page.mouse.up();
    await page.waitForFunction(n=>window.stoppedSounds>n,stopped);
  });
  await check('haechi changes expression at 20, 40 and 60 turns and restores it on reload',async page=>{
    await page.addInitScript(()=>{if(!localStorage.getItem('hatcheat.progress.v1')) localStorage.setItem('hatcheat.progress.v1',JSON.stringify({version:1,turns:19,collection:[],book:'random',sound:false}));});
    await page.goto(base); await tab(page,'ink');
    for(const [count,stage] of [[1,20],[20,40],[20,60]]) {
      await page.evaluate(n=>{for(let i=0;i<n;i++) document.getElementById('grind-once').click();},count);
      assert.equal(await page.locator('#turn-count').textContent(),String(stage));
      assert.match(await page.locator('#ink-haechi').getAttribute('src'),new RegExp(`grind_${stage}`));
      assert.ok((await page.locator('#ink-reaction').textContent()).length>5);
    }
    const message=await page.locator('#ink-reaction').textContent();
    await page.locator('#grind-once').click();
    assert.equal(await page.locator('#ink-reaction').textContent(),message,'A message stays put within its milestone');
    await page.reload(); await tab(page,'ink');
    assert.match(await page.locator('#ink-haechi').getAttribute('src'),/grind_60/);
    await page.evaluate(()=>{for(let i=0;i<19;i++) document.getElementById('grind-once').click();});
    assert.match(await page.locator('#ink-reaction').textContent(),/거의 다 왔어요/);
  });
  await check('new cards unfold and stamp; reduced motion cancels every decorative effect',async page=>{
    await page.addInitScript(()=>localStorage.setItem('hatcheat.progress.v1',JSON.stringify({version:1,turns:99,collection:[],book:'random',sound:false})));
    await page.goto(base); await tab(page,'ink'); await page.locator('#grind-once').click(); await visible(page,'#quote-dialog');
    assert.ok(await page.locator('.seal').evaluate(el=>el.getAnimations().length>0));
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(()=>document.getAnimations().length===0);
    await page.locator('#quote-library').click(); assert.equal(await page.locator('.library-card').count(),1);
  });
  await check('hand-drawn circles count across the edge and include the release position',async page=>{
    await page.goto(base); await tab(page,'ink'); await page.evaluate(()=>document.fonts.ready);
    const r=await page.locator('#grinding-surface').boundingBox();
    const point=(a,radius)=>({x:r.x+r.width/2+Math.cos(a)*r.width/2*radius,y:r.y+r.height/2+Math.sin(a)*r.height/2*radius});
    for(const direction of [1,-1]) {
      let p=point(0,.9); await page.mouse.move(p.x,p.y); await page.mouse.down();
      for(let i=1;i<=96;i++){const a=direction*i/96*Math.PI*2;p=point(a,.9+.15*Math.sin(3*a));await page.mouse.move(p.x,p.y);}
      await page.mouse.up();
    }
    assert.equal(await page.locator('#turn-count').textContent(),'2','A brief excursion across the edge must not discard the whole circle');
    const p=point(0,.65); await page.mouse.move(p.x,p.y); await page.mouse.down();
    for(let i=1;i<=80;i++){const q=point(i/96*Math.PI*2,.65);await page.mouse.move(q.x,q.y);}
    assert.equal(await page.locator('#turn-count').textContent(),'2','An incomplete 300-degree arc must not count');
    // Touch hardware may deliver the last position only in pointerup.
    const end=point(Math.PI*1.94,.65);
    await page.locator('#inkstone').dispatchEvent('pointerup',{pointerId:1,clientX:end.x,clientY:end.y,isPrimary:true,button:0});
    await page.mouse.up();
    assert.equal(await page.locator('#turn-count').textContent(),'3','The release position closes the hand-drawn circle');
    await page.waitForTimeout(400); assert.equal(await page.locator('#turn-count').textContent(),'3','Animation settling must not add another turn');
    await page.reload(); await tab(page,'ink'); assert.equal(await page.locator('#turn-count').textContent(),'3');
  });
  await check('touch circles with imperfect edges and closure award the 100th card once',async(page,context)=>{
    await page.addInitScript(()=>{
      if(!localStorage.getItem('hatcheat.progress.v1')) localStorage.setItem('hatcheat.progress.v1',JSON.stringify({version:1,turns:98,collection:[],book:'tao',sound:false}));
    });
    await page.goto(base); await tab(page,'ink'); await page.evaluate(()=>document.fonts.ready);
    const r=await page.locator('#grinding-surface').boundingBox(),cdp=await context.newCDPSession(page);
    const point=a=>{const radius=.9+.15*Math.sin(a*3);return {x:r.x+r.width/2+Math.cos(a)*r.width/2*radius,y:r.y+r.height/2+Math.sin(a)*r.height/2*radius};};
    for(const direction of [1,-1]) {
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(0)]});
      for(let i=1;i<=64;i++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(direction*i/64*Math.PI*1.94)]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      assert.equal(await page.locator('#turn-count').textContent(),direction===1?'99':'0');
    }
    await visible(page,'#quote-dialog'); assert.match(await page.locator('#quote-book').textContent(),/도덕경/);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('hatcheat.progress.v1')).collection.length),1);
    await page.reload(); await tab(page,'library'); assert.equal(await page.locator('.library-card').count(),1);
  },{hasTouch:true,isMobile:true});
  await check('ink follows without snapping on pickup or freezing at the edge',async page=>{
    await page.goto(base); await tab(page,'ink'); await page.evaluate(()=>document.fonts.ready);
    const r=await page.locator('#grinding-surface').boundingBox();
    const point=(angle,radius)=>({x:r.x+r.width/2+Math.cos(angle)*r.width/2*radius,y:r.y+r.height/2+Math.sin(angle)*r.height/2*radius});
    await page.evaluate(()=>{
      const stone=document.getElementById('inkstone'),stick=document.getElementById('ink-stick');
      let before; window.inkInputJumps=[];
      for(const name of ['pointerdown','pointermove']) {
        stone.addEventListener(name,()=>{before=stick.getBoundingClientRect();},{capture:true});
        stone.addEventListener(name,()=>{const after=stick.getBoundingClientRect();window.inkInputJumps.push(Math.hypot(after.x-before.x,after.y-before.y));});
      }
    });
    await page.mouse.move(point(0,.7).x,point(0,.7).y); await page.mouse.down();
    assert.ok(await page.evaluate(()=>Math.max(...window.inkInputJumps)<1),'Picking up the ink must not teleport it');
    await page.mouse.move(point(0,1.1).x,point(0,1.1).y); await page.waitForTimeout(300);
    const outside=await page.locator('#ink-stick').boundingBox();
    await page.mouse.move(point(.9,1.1).x,point(.9,1.1).y); await page.waitForTimeout(300);
    const moved=await page.locator('#ink-stick').boundingBox();
    assert.ok(Math.hypot(moved.x-outside.x,moved.y-outside.y)>20,'Ink should follow the edge while the pointer is outside');
    await page.mouse.move(point(.9,.7).x,point(.9,.7).y); await page.mouse.up();
    assert.ok(await page.evaluate(()=>Math.max(...window.inkInputJumps)<1),'Re-entry must not teleport the ink');
    assert.equal(await page.locator('#turn-count').textContent(),'0','Smoothed motion must not invent turns');
  });
  await check('ink dragging does not recalculate layout for each pointer sample',async(page,context)=>{
    await page.goto(base); await tab(page,'ink'); await page.evaluate(()=>document.fonts.ready);
    const r=await page.locator('#grinding-surface').boundingBox();
    const point=a=>({x:r.x+r.width/2+Math.cos(a)*r.width*.3,y:r.y+r.height/2+Math.sin(a)*r.height*.3});
    const cdp=await context.newCDPSession(page); await cdp.send('Performance.enable');
    const metric=async()=> (await cdp.send('Performance.getMetrics')).metrics.find(m=>m.name==='LayoutCount').value;
    await page.mouse.move(point(0).x,point(0).y); const before=await metric(); await page.mouse.down();
    for(let i=1;i<=64;i++){const p=point(i/64*Math.PI*2);await page.mouse.move(p.x,p.y);} await page.mouse.up();
    const layouts=(await metric())-before;
    assert.ok(layouts<8,`A circle caused ${layouts} layouts`);
    assert.equal(await page.locator('#turn-count').textContent(),'1');
  });
  await check('rapid ink buttons share one continuous motion and settle after the last press',async page=>{
    await page.goto(base); await tab(page,'ink'); await page.waitForTimeout(50);
    const result=await page.evaluate(async()=>{
      const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window);
      const pending=new Set(); let peak=0,jump=0;
      window.requestAnimationFrame=callback=>{const id=request(time=>{pending.delete(id);callback(time);});pending.add(id);peak=Math.max(peak,pending.size);return id;};
      window.cancelAnimationFrame=id=>{pending.delete(id);cancel(id);};
      const stick=document.getElementById('ink-stick'),button=document.getElementById('grind-once');
      for(let i=0;i<5;i++) {
        const before=stick.getBoundingClientRect();button.click();const after=stick.getBoundingClientRect();
        jump=Math.max(jump,Math.hypot(after.x-before.x,after.y-before.y));
        await new Promise(resolve=>setTimeout(resolve,35));
      }
      const before=stick.getBoundingClientRect();await new Promise(resolve=>setTimeout(resolve,180));const after=stick.getBoundingClientRect();
      await new Promise(resolve=>setTimeout(resolve,1400));
      return {jump,peak,pending:pending.size,travel:Math.hypot(after.x-before.x,after.y-before.y),animations:stick.getAnimations().length};
    });
    assert.ok(result.jump<1,'Repeated presses must not reset the position'); assert.equal(result.peak,1);
    assert.ok(result.travel>10,'Button presses should produce a visible circular motion');
    assert.equal(result.pending,0); assert.equal(result.animations,0); assert.equal(await page.locator('#turn-count').textContent(),'5');
    assert.ok(!(await page.locator('#inkstone').evaluate(el=>el.classList.contains('is-grinding'))));
  });
  await check('ink motion stops on leaving, settings, background, resize and reduced motion',async page=>{
    await page.goto(base); await tab(page,'ink');
    for(const action of ['settings','tab','hidden','resize','reduce']) {
      await page.locator('#grind-once').click(); await page.waitForTimeout(80);
      assert.ok(await page.locator('#inkstone').evaluate(el=>el.classList.contains('is-grinding')));
      if(action==='settings') await page.locator('#settings-open').click();
      if(action==='tab') await tab(page,'write');
      if(action==='hidden') await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});document.dispatchEvent(new Event('visibilitychange'));delete document.visibilityState;});
      if(action==='resize') await page.setViewportSize({width:320,height:568});
      if(action==='reduce') await page.emulateMedia({reducedMotion:'reduce'});
      await page.waitForFunction(()=>!document.getElementById('inkstone').classList.contains('is-grinding'));
      const transform=await page.locator('#ink-stick').evaluate(el=>el.style.transform); await page.waitForTimeout(120);
      assert.equal(await page.locator('#ink-stick').evaluate(el=>el.style.transform),transform,action);
      if(action==='settings') await page.keyboard.press('Escape');
      if(action==='tab') await tab(page,'ink');
    }
    await page.locator('#grind-once').click(); assert.equal(await page.locator('#turn-count').textContent(),'6');
    assert.ok(!(await page.locator('#inkstone').evaluate(el=>el.classList.contains('is-grinding'))));
  });
  await check('giving animation, deletion, no original in storage or network',async page=>{
    const requests=[]; page.on('request',r=>requests.push(r.url()+' '+(r.postData()||'')));
    await page.goto(base); assert.ok(await page.locator('#give').isDisabled());
    await page.locator('#draft').fill('SENSITIVE-NOTE-7392 <script>alert(1)</script>\n두 번째 줄');
    await page.locator('#give').click(); await visible(page,'#giving-view'); assert.ok(await page.locator('#settings-open').isDisabled());
    await visible(page,'#done-view'); assert.equal(await page.locator('#draft').inputValue(),'');
    assert.ok(!JSON.stringify(await page.evaluate(()=>({...localStorage}))).includes('SENSITIVE-NOTE-7392'));
    assert.ok(requests.every(r=>!r.includes('SENSITIVE-NOTE-7392'))); assert.equal(await page.locator('#turn-count').textContent(),'0');
    await page.locator('#finish').click(); assert.ok(await page.locator('#give').isDisabled());
  });
  await check('animation failure preserves the note, retry succeeds',async page=>{
    await page.goto(base); await page.evaluate(()=>{window.oldAnimate=Element.prototype.animate;Element.prototype.animate=function(...a){if(this.id==='folded-paper')throw Error('renderer failure');return window.oldAnimate.apply(this,a);};});
    await page.locator('#draft').fill('실패해도 남아 있어야 하는 글'); await page.locator('#give').click(); await visible(page,'#write-error');
    assert.equal(await page.locator('#draft').inputValue(),'실패해도 남아 있어야 하는 글');
    await page.evaluate(()=>{Element.prototype.animate=window.oldAnimate;}); await page.locator('#give').click(); await visible(page,'#done-view');
  });
  await check('failed image loading can be retried without reloading or losing the note',async page=>{
    await page.route('**/haechi_eat.png',route=>route.abort());
    await page.goto(base); await page.locator('#draft').fill('그림이 없어도 남겨 둔 글');
    await page.locator('#give').click(); await visible(page,'#write-error');
    assert.equal(await page.locator('#draft').inputValue(),'그림이 없어도 남겨 둔 글');
    await page.unroute('**/haechi_eat.png'); await page.locator('#give').click(); await visible(page,'#done-view');
    assert.equal(await page.locator('#draft').inputValue(),'');
  });
  await check('ending editing restores navigation and keeps the note only in memory',async page=>{
    await page.goto(base); await page.locator('#draft').fill('아직 건네지 않은 글');
    await page.locator('#writing-done').click(); await tab(page,'ink'); await tab(page,'write');
    assert.equal(await page.locator('#draft').inputValue(),'아직 건네지 않은 글');
    assert.ok(await page.locator('.tabbar').isVisible());
    await page.locator('#draft').focus(); await page.locator('#draft').press('Escape');
    assert.ok(await page.locator('.tabbar').isVisible());
    await page.locator('#draft').focus(); await page.locator('#settings-open').click();
    await page.locator('#settings-dialog .button.close-dialog').click();
    assert.ok(await page.locator('.tabbar').isVisible());
    assert.ok(!JSON.stringify(await page.evaluate(()=>({...localStorage}))).includes('아직 건네지 않은 글'));
  });
  await check('backgrounding clears text and invalidates the in-flight completion',async page=>{
    await page.goto(base); await page.locator('#draft').fill('사라질 원문'); await page.locator('#give').click(); await visible(page,'#giving-view');
    await page.waitForFunction(()=>document.getElementById('folded-paper').getAnimations().length>0);
    await page.evaluate(()=>document.getAnimations().filter(a=>a.effect?.target?.closest('#giving-scene')).forEach(a=>{a.pause();a.currentTime=3500;}));
    await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});document.dispatchEvent(new Event('visibilitychange'));});
    await visible(page,'#write-view'); assert.equal(await page.locator('#draft').inputValue(),'');
    assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.effect?.target?.closest('#giving-scene')).length),0);
    await page.waitForTimeout(5100); assert.ok(await page.locator('#done-view').isHidden());
  });
  await check('stale image timeout cannot cancel a newer giving animation',async page=>{
    await page.goto(base); await page.locator('#eating-haechi').evaluate(img=>img.decode());
    await page.evaluate(()=>Object.defineProperty(document.getElementById('eating-haechi'),'complete',{configurable:true,get:()=>false}));
    await page.locator('#draft').fill('먼저 쓴 글'); await page.locator('#give').click(); await visible(page,'#giving-view');
    await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});document.dispatchEvent(new Event('visibilitychange'));delete document.visibilityState;delete document.getElementById('eating-haechi').complete;});
    await page.waitForTimeout(1500); await page.locator('#draft').fill('새로 쓴 글'); await page.locator('#give').click();
    await visible(page,'#done-view'); assert.equal(await page.locator('#draft').inputValue(),'');
  });
  await check('keyboard submit and reduced motion',async page=>{
    await page.goto(base); await page.locator('#draft').fill('키보드로 건네요'); await page.locator('#draft').press('Control+Enter');
    await visible(page,'#done-view'); assert.equal(await page.locator('#draft').inputValue(),'');
  },{reducedMotion:'reduce'});
  await check('a partial scene startup failure cancels every layer and preserves the note',async page=>{
    await page.goto(base);
    await page.evaluate(()=>{window.originalAnimate=Element.prototype.animate;Element.prototype.animate=function(...args){if(this.id==='ritual-actor')throw Error('actor renderer unavailable');return window.originalAnimate.apply(this,args);};});
    await page.locator('#draft').fill('모든 연출이 성공해야 지워질 글'); await page.locator('#give').click(); await visible(page,'#write-error');
    assert.equal(await page.locator('#draft').inputValue(),'모든 연출이 성공해야 지워질 글');
    assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.effect?.target?.closest('#giving-scene')).length),0);
    await page.evaluate(()=>{Element.prototype.animate=window.originalAnimate;});
    await page.emulateMedia({reducedMotion:'reduce'}); await page.locator('#give').click(); await visible(page,'#done-view');
  });
  await check('motion preference changes finish the whole scene without leaving animations',async page=>{
    await page.goto(base); await page.locator('#draft').fill('도중에 동작 줄이기'); await page.locator('#give').click();
    await page.waitForFunction(()=>document.getElementById('folded-paper').getAnimations().length>0);
    await page.emulateMedia({reducedMotion:'reduce'}); await visible(page,'#done-view');
    assert.equal(await page.locator('#draft').inputValue(),'');
    assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.effect?.target?.closest('#giving-scene')).length),0);
  });
  await check('paper reaches the mouth after folding, including after a viewport resize',async page=>{
    await page.goto(base); await page.evaluate(()=>document.fonts.ready);
    await page.locator('#draft').fill('SENSITIVE-SCENE-512'); await page.locator('#give').click();
    await page.waitForFunction(()=>document.getElementById('folded-paper').getAnimations().length>0);
    await page.evaluate(()=>{window.sceneAnimations=document.getAnimations().filter(a=>a.effect?.target?.closest('#giving-scene'));window.sceneAnimations.forEach(a=>{a.pause();a.currentTime=2496;});});
    for(const [width,height] of [[390,844],[320,568],[667,375]]) {
      await page.setViewportSize({width,height});
      const result=await page.evaluate(()=>{
        const mouth=document.getElementById('mouth-target').getBoundingClientRect(),paper=document.querySelector('.paper-lower').getBoundingClientRect();
        return {distance:Math.hypot(mouth.x-paper.x-paper.width/2,mouth.y-paper.y-paper.height/2),bottom:document.getElementById('giving-scene').getBoundingClientRect().bottom,nav:document.querySelector('.tabbar').getBoundingClientRect().top};
      });
      assert.ok(result.distance<8,`Paper missed the mouth at ${width}: ${result.distance}`);
      assert.ok(result.bottom<result.nav,`Scene overlapped navigation at ${width}`);
    }
    assert.ok(!(await page.locator('#giving-scene').textContent()).includes('SENSITIVE-SCENE-512'));
    assert.equal(await page.locator('#draft').inputValue(),'SENSITIVE-SCENE-512');
    await page.evaluate(()=>window.sceneAnimations.forEach(a=>a.finish())); await visible(page,'#done-view');
    assert.equal(await page.locator('#draft').inputValue(),'');
  });
  await check('100 turns, fixed book, persistent collection and empty state',async page=>{
    await page.goto(base); await tab(page,'library'); await visible(page,'#library-empty');
    await page.locator('#settings-open').click(); await page.locator('input[value=tao]').check(); await page.locator('#settings-dialog .button.close-dialog').click();
    await tab(page,'ink'); for(let i=0;i<37;i++) await page.locator('#grind-once').click();
    await page.reload(); await tab(page,'ink'); assert.equal(await page.locator('#turn-count').textContent(),'37'); assert.equal(await page.locator('#current-book').textContent(),'도덕경');
    for(let i=37;i<100;i++) await page.locator('#grind-once').click();
    await visible(page,'#quote-dialog'); assert.match(await page.locator('#quote-book').textContent(),/도덕경/); assert.equal(await page.locator('#turn-count').textContent(),'0');
    await page.screenshot({path:join(artifacts,'quote.png')});
    await page.locator('#quote-library').click(); assert.equal(await page.locator('.library-card').count(),1);
    await page.reload(); await tab(page,'library'); assert.equal(await page.locator('.library-card').count(),1);
    await page.locator('.library-card').click(); await visible(page,'#quote-dialog');
    const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('hatcheat.progress.v1'))); assert.equal(state.collection.length,1); assert.equal(state.turns,0);
  });
  await check('mouse circle counts once; short scrubbing does not',async page=>{
    await page.goto(base); await tab(page,'ink'); const r=await page.locator('#grinding-surface').boundingBox();
    const point=a=>({x:r.x+r.width/2+Math.cos(a)*r.width*.3,y:r.y+r.height/2+Math.sin(a)*r.height*.3});
    await page.mouse.move(point(0).x,point(0).y); await page.mouse.down();
    for(let i=0;i<=64;i++){const p=point(i/64*2*Math.PI);await page.mouse.move(p.x,p.y);} await page.mouse.up();
    assert.equal(await page.locator('#turn-count').textContent(),'1'); await page.mouse.down();
    for(let i=0;i<40;i++){const p=point(i%2*.4);await page.mouse.move(p.x,p.y);} await page.mouse.up(); assert.equal(await page.locator('#turn-count').textContent(),'1');
  });
  await check('storage failure shows a warning while progress still works',async page=>{
    await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Quota exceeded','QuotaExceededError');};});
    await page.goto(base); await tab(page,'ink'); await page.locator('#grind-once').click(); assert.equal(await page.locator('#turn-count').textContent(),'1'); await visible(page,'#storage-notice');
  });
  await check('corrupt storage opens a fresh notebook',async page=>{
    await page.addInitScript(()=>localStorage.setItem('hatcheat.progress.v1','{bad-json')); await page.goto(base); await visible(page,'#storage-notice'); await tab(page,'library'); await visible(page,'#library-empty');
  });
  for(const [width,height] of [[320,568],[375,667],[414,896],[768,1024],[1280,900],[667,375]]) {
    await check(`responsive ${width}x${height}`,async page=>{
      await page.goto(base); await page.evaluate(()=>document.fonts.ready);
      for(const name of ['write','ink','library']) {
        await tab(page,name); assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name);
        if(name==='ink') await page.locator('#grind-once').click();
        await page.screenshot({path:join(artifacts,`${name}-${width}.png`),fullPage:true});
      }
      await tab(page,'write'); await page.locator('#draft').fill('긴 글 한 줄\n'.repeat(120)); await page.locator('#give').click(); await visible(page,'#done-view');
      if (height>=568 && width<768) {
        const action=await page.locator('.end-actions [data-view=ink]').boundingBox(),nav=await page.locator('.tabbar').boundingBox();
        assert.ok(action.y+action.height<=nav.y+1,'Completion actions are visible above navigation');
      }
      await page.locator('#settings-open').click(); await visible(page,'#settings-dialog'); assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.keyboard.press('Escape'); assert.ok(await page.locator('#settings-dialog').isHidden());
    },{viewport:{width,height},reducedMotion:'reduce'});
  }
  await check('offline reload and core flow after installation',async(page,context)=>{
    await observeSound(page);
    await page.goto(base); await page.evaluate(()=>navigator.serviceWorker.ready); await page.waitForFunction(()=>navigator.serviceWorker.controller);
    await context.setOffline(true); await page.reload(); await visible(page,'#write-view'); await page.locator('#draft').fill('오프라인에서도');
    await page.locator('#give').click(); await visible(page,'#done-view'); await tab(page,'ink'); await page.locator('#grind-once').click();
    assert.equal(await page.locator('#turn-count').textContent(),'1'); assert.ok(await page.locator('#eating-haechi').evaluate(img=>img.complete&&img.naturalWidth>0));
    await page.waitForFunction(()=>window.playedSounds.length>0);
    await page.locator('#settings-open').click(); assert.ok(await page.locator('#sound-toggle').isChecked());
    assert.ok(await page.evaluate(()=>window.playedSounds[0].peak>0.1));
  },{serviceWorkers:'allow'});
  await check('failed offline installation is reported and can recover without a reload',async(page,context)=>{
    let failInstall=true;
    const fixture=createServer(async(request,response)=>{
      try {
        if(request.url==='/install-check') { response.writeHead(failInstall?503:200).end('install check'); return; }
        if(request.url==='/sw.js') {
          const source=readFileSync(new URL('../sw.js',import.meta.url),'utf8').replace('const ASSETS = [',"const ASSETS = ['./install-check',");
          response.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-cache'}).end(source); return;
        }
        const upstream=await fetch(base+request.url);
        response.writeHead(upstream.status,{'Content-Type':upstream.headers.get('content-type') || 'application/octet-stream'});
        response.end(Buffer.from(await upstream.arrayBuffer()));
      } catch { response.writeHead(500).end(); }
    });
    await new Promise(resolve=>fixture.listen(0,'127.0.0.1',resolve));
    try {
      await page.goto(`http://127.0.0.1:${fixture.address().port}`);
      await page.locator('#settings-open').click(); await visible(page,'#offline-retry');
      assert.match(await page.locator('#offline-status').textContent(),/마치지 못했어요/);
      failInstall=false; await page.locator('#offline-retry').click();
      await page.waitForFunction(()=>document.getElementById('offline-status').textContent.includes('준비가 됐어요'));
      await page.waitForFunction(()=>navigator.serviceWorker.controller);
      await context.setOffline(true); await page.reload(); await visible(page,'#write-view');
    } finally { fixture.closeAllConnections(); await new Promise(resolve=>fixture.close(resolve)); }
  },{serviceWorkers:'allow',reducedMotion:'reduce'});
  console.log(`\n${cases} browser checks passed. Screenshots: ${artifacts}`);
} finally { await browser?.close(); server.kill(); }
