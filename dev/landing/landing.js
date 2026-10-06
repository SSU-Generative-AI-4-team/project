import { createVideoCutscene } from './burn-video.js';
const $ = id => document.getElementById(id);
const worry = $('worry'), burn = $('burn'), ritual = $('ritual'), status = $('demoNote');
const effect = createVideoCutscene(worry.parentElement, '/assets/burn-cutscene.mp4');
let busy = false, run = 0;
worry.addEventListener('input', () => burn.disabled = busy || !worry.value.trim());
burn.addEventListener('click', async () => {
  if (busy || !worry.value.trim()) return;
  const current = ++run;
  busy = true; burn.disabled = worry.disabled = true;
  burn.textContent = '태우는 중…';
  status.textContent = '글이 타고 있어요.';
  ritual.setAttribute('aria-busy', 'true');
  ritual.classList.add('burning');
  let completed = false;
  try { completed = await effect.start(); }
  catch { /* Preserve the input if the cutscene cannot play. */ }
  finally {
    if (current === run) {
      effect.cancel();
      if (completed) worry.value = '';
      ritual.classList.remove('burning');
      ritual.removeAttribute('aria-busy');
      worry.disabled = false; busy = false;
      burn.textContent = '이 글 태우기';
      burn.disabled = !worry.value.trim();
      status.textContent = completed ? '다 태웠어요. 원문은 남지 않아요.' : '불이 잘 붙지 않았어요. 쓴 글은 그대로 있으니 한 번 더 눌러 주세요.';
    }
  }
});
addEventListener('pagehide', () => {
  run++; effect.cancel(); worry.value = '';
  ritual.classList.remove('burning'); ritual.removeAttribute('aria-busy');
  worry.disabled = false; busy = false; burn.disabled = true;
  burn.textContent = '이 글 태우기';
  status.textContent = '여기 적은 글은 서버로 보내거나 저장하지 않아요.';
});
const form = $('reserve'), note = $('formNote');
form.addEventListener('submit', async e => {
  e.preventDefault(); if (!form.reportValidity()) return;
  const button = form.querySelector('button'); if (button.disabled) return;
  button.disabled = true; button.textContent = '신청 중…'; note.textContent = '';
  try {
    const response = await fetch('/api/reserve', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({email:form.email.value.trim()}) });
    if (!response.ok) throw new Error('Reservation failed');
    form.reset(); note.textContent = '신청됐어요. 출시 소식을 이메일로 전해드릴게요.';
  } catch { note.textContent = '신청이 되지 않았어요. 이메일은 그대로 있으니, 잠시 뒤 다시 눌러 주세요.'; }
  finally { button.disabled = false; button.textContent = '출시 소식 받기'; }
});
