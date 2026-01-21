// src/components/CreateCapsuleForm.ts - 최종 버전

import { supabase } from '../lib/supabase.ts'
import { loadCapsules } from '../main.ts'
import { getCurrentUser } from '../lib/auth.ts'
import { encrypt } from '../lib/crypto.ts'  // 암호화 추가

export async function renderCreateCapsuleForm(container: HTMLElement) {
  container.innerHTML = `
    <div class="create-form-container" style="max-width: 600px; margin: 80px auto; padding: 40px; background: rgba(255,255,255,0.2); border-radius: 24px; backdrop-filter: blur(12px); box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
      <h2 style="text-align:center; color:white; margin-bottom:32px; font-size:2.2rem;">새로운 캡슐 봉인하기</h2>
      
      <form id="capsule-form">
        <div style="margin-bottom:24px;">
          <label for="title" style="display:block; color:white; margin-bottom:8px; font-weight:600;">제목</label>
          <input id="title" type="text" placeholder="캡슐 제목을 입력하세요" required style="width:100%; padding:14px; border-radius:12px; border:none; font-size:1.1rem;" />
        </div>

        <div style="margin-bottom:24px;">
          <label for="content" style="display:block; color:white; margin-bottom:8px; font-weight:600;">내용 (봉인될 메시지)</label>
          <textarea id="content" rows="6" placeholder="미래의 나에게, 혹은 소중한 사람에게 전하고 싶은 말..." required style="width:100%; padding:14px; border-radius:12px; border:none; font-size:1.1rem; resize:vertical;"></textarea>
        </div>

        <div style="margin-bottom:32px;">
          <label for="open_at" style="display:block; color:white; margin-bottom:8px; font-weight:600;">이 캡슐을 열 날짜</label>
          <input id="open_at" type="datetime-local" required min="${new Date().toISOString().slice(0,16)}" style="width:100%; padding:14px; border-radius:12px; border:none; font-size:1.1rem;" />
        </div>

        <button type="submit" id="submit-btn" style="width:100%; padding:16px; background:#4f46e5; color:white; border:none; border-radius:12px; font-size:1.2rem; font-weight:600; cursor:pointer; transition:all 0.2s;">
          캡슐 봉인하기
        </button>
      </form>

      <p id="form-message" style="text-align:center; margin-top:20px; color:#ff6b6b; font-weight:600;"></p>
    </div>
  `

  const form = document.getElementById('capsule-form') as HTMLFormElement
  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement
  const messageEl = document.getElementById('form-message') as HTMLParagraphElement

  let isSubmitting = false  // 중복 제출 방지 플래그

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    if (isSubmitting) return  // 이미 제출 중이면 무시

    isSubmitting = true
    submitBtn.disabled = true
    submitBtn.innerHTML = '봉인 중... <span style="margin-left:10px;">⏳</span>'  // 로딩 표시
    messageEl.textContent = ''
    messageEl.style.color = '#fff'

    const title = (document.getElementById('title') as HTMLInputElement).value.trim()
    const content = (document.getElementById('content') as HTMLTextAreaElement).value.trim()
    const openAtStr = (document.getElementById('open_at') as HTMLInputElement).value

    if (!title || !content || !openAtStr) {
      messageEl.style.color = '#ff6b6b'
      messageEl.textContent = '모든 항목을 입력해주세요!'
      resetButton()
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
          content: encrypt(content),  // 암호화해서 저장
          open_at: openAt,
          is_opened: false
        })

      if (error) throw error

      messageEl.style.color = '#34d399'
      messageEl.textContent = '캡슐이 성공적으로 봉인되었습니다! 🎉'

      // 2초 후 폼 초기화 & 리스트로 돌아가기
      setTimeout(() => {
        resetButton()
        loadCapsules()
      }, 2000)

    } catch (err: any) {
      messageEl.style.color = '#ff6b6b'
      messageEl.textContent = '오류: ' + (err.message || '다시 시도해주세요')
      resetButton()
    }
  })

  function resetButton() {
    isSubmitting = false
    submitBtn.disabled = false
    submitBtn.innerHTML = '캡슐 봉인하기'
  }
}