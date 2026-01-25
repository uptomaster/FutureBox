// src/components/CreateCapsuleForm.ts - 위치 조정 및 모바일 최적화 버전

import { supabase } from '../lib/supabase.ts'
import { loadCapsules } from '../main.ts'
import { getCurrentUser } from '../lib/auth.ts'
import { encrypt } from '../lib/crypto.ts'

export async function renderCreateCapsuleForm(container: HTMLElement) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultOpenAt = tomorrow.toISOString().slice(0, 16)

  container.innerHTML = `
    <div class="create-form-container" style="max-width: 600px; margin: 40px auto; padding: 40px 30px; 
      background: linear-gradient(145deg, rgba(30,25,60,0.96), rgba(55,40,120,0.92));
      border-radius: 24px; backdrop-filter: blur(24px); box-shadow: 0 20px 60px rgba(0,0,0,0.5); 
      border: 1px solid rgba(140,120,255,0.3); position: relative;">

      <h2 style="text-align:center; margin-bottom:32px; font-size:2rem; font-weight:900; 
        background: linear-gradient(90deg, #c084fc, #a78bfa, #60a5fa); 
        -webkit-background-clip:text; -webkit-text-fill-color:transparent; letter-spacing:-1px;">
        새 상자 봉인하기
      </h2>

      <form id="capsule-form" style="display:flex; flex-direction:column; gap:20px;">
        <div>
          <label for="title" style="display:block; color:#e0d7ff; margin-bottom:8px; 
            font-weight:700; font-size:1rem;">제목</label>
          <input id="title" type="text" placeholder="상자 제목을 입력하세요" required 
            style="width:100%; padding:14px 18px; border-radius:12px; border:none; font-size:1rem; 
            background:rgba(255,255,255,0.98); box-shadow:inset 0 2px 5px rgba(0,0,0,0.1);" />
        </div>

        <div>
          <label for="content" style="display:block; color:#e0d7ff; margin-bottom:8px; 
            font-weight:700; font-size:1rem;">내용</label>
          <textarea id="content" rows="6" placeholder="미래의 나에게 전하고 싶은 말..." required 
            style="width:100%; padding:14px 18px; border-radius:12px; border:none; font-size:1rem; 
            background:rgba(255,255,255,0.98); resize:vertical; line-height:1.5;"></textarea>
        </div>

        <div>
          <label for="open_at" style="display:block; color:#e0d7ff; margin-bottom:8px; 
            font-weight:700; font-size:1rem;">개봉 날짜</label>
          <input id="open_at" type="datetime-local" required min="${defaultOpenAt}" value="${defaultOpenAt}" 
            style="width:100%; padding:14px 18px; border-radius:12px; border:none; font-size:1rem; 
            background:rgba(255,255,255,0.98);" />
        </div>

        <button type="submit" id="submit-btn" 
          style="width:100%; padding:16px; background: linear-gradient(135deg, #7c3aed, #60a5fa); 
          color:white; border:none; border-radius:14px; font-size:1.15rem; font-weight:800; 
          cursor:pointer; transition:all 0.3s; box-shadow:0 8px 20px rgba(124,77,255,0.4);">
          상자 봉인하기
        </button>
      </form>

      <div style="display: flex; justify-content: flex-end; margin-top: 24px;">
        <button id="back-btn" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1); 
          border-radius: 10px; padding: 10px 16px; color: #ccc; font-size: 0.9rem; font-weight: 500; 
          cursor: pointer; transition: all 0.3s;">
          취소하고 돌아가기
        </button>
      </div>

      <p id="form-message" style="text-align:center; margin-top:20px; font-size:0.95rem; font-weight:600; min-height:24px;"></p>
    </div>

    <style>
      @media (max-width: 640px) {
        .create-form-container { margin: 20px 10px !important; padding: 25px 20px !important; }
        .create-form-container h2 { font-size: 1.6rem !important; }
        input, textarea, #submit-btn { font-size: 0.95rem !important; }
      }
    </style>
  `

  // 뒤로 가기 버튼 이벤트
  document.getElementById('back-btn')?.addEventListener('click', () => {
    loadCapsules()
  })

  const form = document.getElementById('capsule-form') as HTMLFormElement
  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement
  const messageEl = document.getElementById('form-message') as HTMLParagraphElement

  let isSubmitting = false

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (isSubmitting) return

    isSubmitting = true
    submitBtn.disabled = true
    submitBtn.innerHTML = '봉인 중...'
    messageEl.textContent = ''

    const title = (document.getElementById('title') as HTMLInputElement).value.trim()
    const content = (document.getElementById('content') as HTMLTextAreaElement).value.trim()
    const openAtStr = (document.getElementById('open_at') as HTMLInputElement).value

    try {
      const currentUser = getCurrentUser()
      if (!currentUser) throw new Error('로그인 상태가 아닙니다.')

      const { error } = await supabase
        .from('capsules')
        .insert({
          user_id: currentUser.id,
          title,
          content: encrypt(content),
          open_at: new Date(openAtStr).toISOString(),
          is_opened: false
        })

      if (error) throw error

      messageEl.style.color = '#34d399'
      messageEl.textContent = '상자가 성공적으로 봉인되었습니다! 🎉'

      setTimeout(() => {
        loadCapsules()
      }, 1500)

    } catch (err: any) {
      messageEl.style.color = '#ff6b6b'
      messageEl.textContent = err.message || '다시 시도해주세요'
      isSubmitting = false
      submitBtn.disabled = false
      submitBtn.innerHTML = '상자 봉인하기'
    }
  })
}