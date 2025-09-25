(function(){
  'use strict';

  // Helper: query selector
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // Mobile nav toggle
  const navToggle = $('#navToggle');
  const primaryNav = $('#primaryNav');
  navToggle && navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    primaryNav.classList.toggle('open');
  });

  // Set year in footer
  const yearEl = $('#year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // Contact form handling
  const form = $('#contactForm');
  const status = $('#formStatus');
  const mailtoBtn = $('#mailtoBtn');

  // Basic email regex (simple & safe) - do not rely solely on this for security
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateForm(data){
    // Single Responsibility: this fn only validates and returns {ok, messages}
    const messages = [];
    if(!data.get('name') || data.get('name').trim().length < 2) messages.push('กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร');
    const email = data.get('email') || '';
    if(!emailRe.test(email)) messages.push('กรุณากรอกอีเมลให้ถูกต้อง');
    if(!data.get('subject') || data.get('subject').trim().length < 3) messages.push('Subject สั้นไป');
    if(!data.get('message') || data.get('message').trim().length < 10) messages.push('Message สั้นไป (อย่างน้อย 10 ตัวอักษร)');
    return {ok: messages.length === 0, messages};
  }

  async function sendToFormspree(formData){
    // Replace URL in HTML if using Netlify Forms or others
    try{
      const resp = await fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData
      });
      if(resp.ok){
        return {ok:true};
      }
      const json = await resp.json().catch(()=>null);
      return {ok:false, error: json || 'Server error'};
    }catch(err){
      return {ok:false, error: err.message};
    }
  }

  function buildMailto(formData){
    const to = 'your.email@example.com'; // placeholder: เปลี่ยนเป็นอีเมลจริง
    const subject = encodeURIComponent(formData.get('subject'));
    const body = encodeURIComponent(`Name: ${formData.get('name')}\nEmail: ${formData.get('email')}\n\n${formData.get('message')}`);
    return `mailto:${to}?subject=${subject}&body=${body}`;
  }

  if(form){
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.textContent = 'Sending...';
      const fd = new FormData(form);
      const val = validateForm(fd);
      if(!val.ok){
        status.textContent = val.messages.join(' | ');
        return;
      }
      // Try sending to Formspree
      const result = await sendToFormspree(fd);
      if(result.ok){
        status.textContent = 'Message sent — ขอบคุณครับ!';
        form.reset();
      }else{
        // Fallback: open mail client with prefilled content
        status.textContent = 'ไม่สามารถส่งผ่าน server ได้ — เปิด default mail client เป็น fallback';
        window.location.href = buildMailto(fd);
      }
    });
  }

  if(mailtoBtn){
    mailtoBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      const val = validateForm(fd);
      if(!val.ok){
        status.textContent = val.messages.join(' | ');
        return;
      }
      window.location.href = buildMailto(fd);
    });
  }

  /*
    # Self-check:
    - Syntax checks:
      * Run ESLint (recommended config) on app.js and styles (stylelint) before deploy.
      * Example: eslint --fix app.js
    - Accessibility checks:
      * Run Lighthouse / axe accessibility to verify color contrast and aria attributes.
    - Unit tests (suggested):
      * For validation logic, write a small Jest test for validateForm():
        test('valid form passes', () => {
          const fd = new FormData();
          fd.set('name','Balm');fd.set('email','a@b.com');fd.set('subject','Hi');fd.set('message','Hello world 123');
          expect(validateForm(fd).ok).toBe(true);
        });
      * test for invalid emails, short messages.
    - Manual tests to run now:
      1) Try submitting with empty fields -> expect validation error messages.
      2) Fill valid data and disconnect network -> expect fallback mailto to open.

    Predicted sample outputs for manual tests:
      - Empty form: status shows: "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร | กรุณากรอกอีเมลให้ถูกต้อง | Subject สั้นไป | Message สั้นไป"
      - Valid form and Formspree reachable: status shows: "Message sent — ขอบคุณครับ!"
      - Valid form but Formspree unreachable: status shows: "ไม่สามารถส่งผ่าน server ได้ — เปิด default mail client เป็น fallback" and mail client opens.
  */

})();