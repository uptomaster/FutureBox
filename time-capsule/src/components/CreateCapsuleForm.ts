// src/components/CreateCapsuleForm.ts - 뒤로 가기 버튼 추가 + 사용자 친화적으로 완성

import { supabase } from '../lib/supabase.ts'
import { loadCapsules } from '../main.ts'
import { getCurrentUser } from '../lib/auth.ts'
import { encrypt } from '../lib/crypto.ts'

export async function renderCreateCapsuleForm(container: HTMLElement) {
  // 오늘 날짜 + 1일 기본값 설정
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultOpenAt = tomorrow.toISOString().slice(0, 16)

  container.innerHTML = `
    <div class="create-form-container" style="max-width: 720px; margin: 80px auto; padding: 56px 48px; 
      background: linear-gradient(145deg, rgba(30,25,60,0.94), rgba(55,40,120,0.88), rgba(80,60,180,0.82));
      border-radius: 32px; backdrop-filter: blur(24px); box-shadow: 0 24px 80px rgba(0,0,0,0.6); 
      border: 1px solid rgba(140,120,255,0.35); position: relative;">

      <!-- 뒤로 가기 버튼 -->
      <button id="back-btn" style="position: absolute; top: 32px; left: 32px; 
        background: rgba(255,255,255,0.12); border: none; border-radius: 12px; 
        padding: 12px 20px; color: #e0d7ff; font-size: 1.05rem; font-weight: 600; 
        cursor: pointer; display: flex; align-items: center; gap: 8px; 
        transition: all 0.3s; backdrop-filter: blur(8px);">
        <span style="font-size: 1.4rem;">←</span> 뒤로 가기
      </button>

      <h2 style="text-align:center; margin-bottom:48px; font-size:2.8rem; font-weight:900; 
        background: linear-gradient(90deg, #c084fc, #a78bfa, #60a5fa); 
        -webkit-background-clip:text; -webkit-text-fill-color:transparent; letter-spacing:-1px;">
        새 상자 봉인하기
      </h2>

      <form id="capsule-form" style="display:flex; flex-direction:column; gap:32px;">
        <!-- 제목 -->
        <div>
          <label for="title" style="display:block; color:#e0d7ff; margin-bottom:10px; 
            font-weight:700; font-size:1.15rem; letter-spacing:-0.3px;">제목</label>
          <input id="title" type="text" placeholder="상자 제목을 입력하세요" required 
            style="width:100%; padding:18px 24px; border-radius:16px; border:none; font-size:1.18rem; 
            background:rgba(255,255,255,0.98); box-shadow:inset 0 2px 10px rgba(0,0,0,0.12); 
            transition:all 0.3s; letter-spacing:-0.2px;" />
        </div>

        <!-- 내용 -->
        <div>
          <label for="content" style="display:block; color:#e0d7ff; margin-bottom:10px; 
            font-weight:700; font-size:1.15rem; letter-spacing:-0.3px;">내용</label>
          <textarea id="content" rows="8" placeholder="미래의 나에게, 혹은 소중한 사람에게 전하고 싶은 말..." required 
            style="width:100%; padding:18px 24px; border-radius:16px; border:none; font-size:1.18rem; 
            background:rgba(255,255,255,0.98); box-shadow:inset 0 2px 10px rgba(0,0,0,0.12); 
            transition:all 0.3s; resize:vertical; letter-spacing:-0.15px; line-height:1.6;"></textarea>
        </div>

        <!-- 개봉 날짜 -->
        <div>
          <label for="open_at" style="display:block; color:#e0d7ff; margin-bottom:10px; 
            font-weight:700; font-size:1.15rem; letter-spacing:-0.3px;">개봉 날짜</label>
          <input id="open_at" type="datetime-local" required min="${defaultOpenAt}" value="${defaultOpenAt}" 
            style="width:100%; padding:18px 24px; border-radius:16px; border:none; font-size:1.18rem; 
            background:rgba(255,255,255,0.98); box-shadow:inset 0 2px 10px rgba(0,0,0,0.12); 
            transition:all 0.3s; letter-spacing:-0.2px;" />
        </div>

        <!-- 제출 버튼 -->
        <button type="submit" id="submit-btn" 
          style="width:100%; padding:20px; background: linear-gradient(135deg, #a78bfa, #7c3aed, #60a5fa, #34d399); 
          color:white; border:none; border-radius:20px; font-size:1.35rem; font-weight:800; 
          cursor:pointer; transition:all 0.4s cubic-bezier(0.22,1,0.36,1); 
          box-shadow:0 12px 36px rgba(124,77,255,0.55); letter-spacing:-0.4px;">
          상자 봉인하기
        </button>
      </form>

      <p id="form-message" style="text-align:center; margin-top:32px; font-size:1.15rem; font-weight:600; min-height:32px;"></p>
    </div>
  `

  // 뒤로 가기 버튼 이벤트
  document.getElementById('back-btn')?.addEventListener('click', () => {
    loadCapsules() // 메인 화면으로 돌아가기
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
    submitBtn.innerHTML = '봉인 중... <span style="margin-left:12px; animation: spin 1s linear infinite;">⏳</span>'
    messageEl.textContent = ''
    messageEl.style.color = '#fff'

    const title = (document.getElementById('title') as HTMLInputElement).value.trim()
    const content = (document.getElementById('content') as HTMLTextAreaElement).value.trim()
    const openAtStr = (document.getElementById('open_at') as HTMLInputElement).value

    if (!title || !content || !openAtStr) {
      messageEl.style.color = '#ff6b6b'
      messageEl.textContent = '모든 항목을 입력해주세요!'
      isSubmitting = false
      submitBtn.disabled = false
      submitBtn.innerHTML = '상자 봉인하기'
      return
    }

    const openAt = new Date(openAtStr).toISOString()

    try {
      const currentUser = getCurrentUser()
      if (!currentUser) throw new Error('로그인 상태가 아닙니다.')

      const { error } = await supabase
        .from('capsules')
        .insert({
          user_id: currentUser.id,
          title,
          content: encrypt(content),
          open_at: openAt,
          is_opened: false
        })

      if (error) throw error

      messageEl.style.color = '#34d399'
      messageEl.textContent = '상자가 성공적으로 봉인되었습니다! 🎉'

      setTimeout(() => {
        isSubmitting = false
        submitBtn.disabled = false
        submitBtn.innerHTML = '상자 봉인하기'
        loadCapsules()
      }, 2200)

    } catch (err: any) {
      messageEl.style.color = '#ff6b6b'
      messageEl.textContent = '오류: ' + (err.message || '다시 시도해주세요')
      isSubmitting = false
      submitBtn.disabled = false
      submitBtn.innerHTML = '상자 봉인하기'
    }
  })
}