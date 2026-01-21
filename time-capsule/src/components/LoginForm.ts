// src/components/LoginForm.ts
import { signUp, signIn } from '../lib/auth.ts'
import { loadCapsules } from '../main.ts'  // 여기에다 import 추가함 (에러 해결)

export function renderLoginForm(container: HTMLElement) {
  container.innerHTML = `
    <div class="login-container" style="max-width: 420px; margin: 120px auto; padding: 48px 32px; background: rgba(255,255,255,0.15); border-radius: 24px; backdrop-filter: blur(12px); text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
      <h2 style="margin-bottom: 24px; font-size: 2.2rem; color: white;">FutureBox</h2>
      
      <!-- 🔒 강력한 프라이버시 보장 문구 -->
      <div style="margin-bottom: 24px; padding: 12px 16px; background: rgba(0,0,0,0.3); border-radius: 12px; border: 1px solid rgba(255,255,255,0.2);">
        <p style="font-size: 0.95rem; color: #fbbf24; font-weight: 600; margin-bottom: 6px;">
          🔐 완벽한 비밀 보장
        </p>
        <p style="font-size: 0.85rem; color: rgba(255,255,255,0.85); line-height: 1.5;">
          관리자를 포함한 그 누구도<br/>
          당신의 메시지를 볼 수 없습니다
        </p>
      </div>

      <div class="tabs" style="margin-bottom: 32px;">
        <button id="login-tab" class="tab active" style="padding: 12px 24px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 12px 0 0 12px; cursor: pointer; font-weight: 600;">로그인</button>
        <button id="signup-tab" class="tab" style="padding: 12px 24px; background: rgba(255,255,255,0.1); border: none; color: white; border-radius: 0 12px 12px 0; cursor: pointer; font-weight: 600;">회원가입</button>
      </div>

      <form id="auth-form" style="display: flex; flex-direction: column; gap: 16px;">
        <input 
          id="email" 
          type="email" 
          placeholder="이메일 주소" 
          required 
          style="padding: 16px; border-radius: 12px; border: none; font-size: 1.1rem; background: rgba(255,255,255,0.9);"
        />
        <input 
          id="password" 
          type="password" 
          placeholder="비밀번호" 
          required 
          style="padding: 16px; border-radius: 12px; border: none; font-size: 1.1rem; background: rgba(255,255,255,0.9);"
        />
        <button 
          id="submit-btn" 
          type="submit" 
          style="padding: 16px; background: #4f46e5; color: white; border: none; border-radius: 12px; font-size: 1.1rem; font-weight: 600; cursor: pointer;"
        >
          로그인
        </button>
      </form>

      <p id="auth-message" style="margin-top: 24px; font-weight: 600;"></p>
    </div>
  `

  const tabs = document.querySelectorAll('.tab')
  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement
  const message = document.getElementById('auth-message') as HTMLParagraphElement
  let isLoginMode = true

  // 탭 전환
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      isLoginMode = tab.id === 'login-tab'
      submitBtn.textContent = isLoginMode ? '로그인' : '회원가입'

      // 탭 스타일 약간 변경
      if (isLoginMode) {
        (tabs[0] as HTMLElement).style.background = 'rgba(255,255,255,0.2)'
          ; (tabs[1] as HTMLElement).style.background = 'rgba(255,255,255,0.1)'
      } else {
        ; (tabs[0] as HTMLElement).style.background = 'rgba(255,255,255,0.1)'
          ; (tabs[1] as HTMLElement).style.background = 'rgba(255,255,255,0.2)'
      }
    })
  })

  // 폼 제출
  document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    message.textContent = ''
    message.style.color = ''

    const email = (document.getElementById('email') as HTMLInputElement).value.trim()
    const password = (document.getElementById('password') as HTMLInputElement).value

    if (!email || !password) {
      message.style.color = '#ff6b6b'
      message.textContent = '모든 항목을 입력해주세요.'
      return
    }

    try {
      let user
      if (isLoginMode) {
        user = await signIn(email, password)
        console.log('로그인된 사용자:', user)  // ← 여기서 user 사용
        message.style.color = '#34d399'
        message.textContent = '로그인 성공! 잠시만 기다려주세요...'
      } else {
        user = await signUp(email, password)
        message.style.color = '#34d399'
        message.textContent = '회원가입 성공! 자동 로그인되었습니다.'
      }

      // 성공 후 1초 뒤 리스트 새로고침
      setTimeout(() => {
        loadCapsules()
      }, 1000)
    } catch (err: any) {
      message.style.color = '#ff6b6b'
      message.textContent = err.message || '오류가 발생했습니다.'
    }
  })
}