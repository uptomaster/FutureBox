// src/components/LoginForm.ts
import { signUp, signIn } from '../lib/auth.ts'
import { loadCapsules } from '../main.ts'

export function renderLoginForm(container: HTMLElement) {
  // 1. intro 섹션 비우기 (공간 잡아먹는 문제 해결)
  const introSection = document.getElementById('intro-section')
  if (introSection) {
    introSection.innerHTML = '' // intro 내용 완전히 지움
  }

  // 2. 로그인 폼 렌더링 (기존 스타일 그대로, 밝고 세련되게 유지)
  container.innerHTML = `
    <div class="login-container" style="max-width: 460px; margin: 140px auto; padding: 52px 40px; 
      background: linear-gradient(135deg, rgba(79,70,229,0.25), rgba(167,139,250,0.18)); 
      border-radius: 28px; backdrop-filter: blur(20px); text-align: center; 
      box-shadow: 0 20px 80px rgba(0,0,0,0.4); border: 1px solid rgba(167,139,250,0.3);">
      
      <h2 style="margin-bottom: 32px; font-size: 2.8rem; font-weight: 900; 
        background: linear-gradient(90deg, #a78bfa, #7c3aed, #60a5fa); 
        -webkit-background-clip: text; -webkit-text-fill-color: transparent; 
        letter-spacing: -1px; text-shadow: 0 4px 12px rgba(0,0,0,0.3);">
        FutureBox
      </h2>
      
      <!-- 프라이버시 강조 박스 -->
      <div style="margin-bottom: 36px; padding: 20px 24px; 
        background: rgba(167,139,250,0.15); border-radius: 20px; 
        border: 1px solid rgba(167,139,250,0.3); backdrop-filter: blur(8px);">
        <p style="font-size: 1.1rem; color: #fbbf24; font-weight: 800; margin-bottom: 12px;">
          🔒 완전 비밀 보장
        </p>
        <p style="font-size: 0.95rem; color: #e0d7ff; line-height: 1.6;">
          관리자도, 누구도<br/>당신의 메시지를 볼 수 없습니다
        </p>
      </div>

      <!-- 탭 -->
      <div class="tabs" style="margin-bottom: 40px; display: flex; justify-content: center; 
        background: rgba(167,139,250,0.15); border-radius: 20px; padding: 6px; 
        width: fit-content; margin-left: auto; margin-right: auto; backdrop-filter: blur(8px);">
        <button id="login-tab" class="tab active" style="padding: 14px 40px; background: transparent; border: none; 
          color: #e0d7ff; font-size: 1.15rem; font-weight: 800; cursor: pointer; border-radius: 14px; 
          transition: all 0.35s;">
          로그인
        </button>
        <button id="signup-tab" class="tab" style="padding: 14px 40px; background: transparent; border: none; 
          color: #e0d7ff; font-size: 1.15rem; font-weight: 700; cursor: pointer; border-radius: 14px; 
          transition: all 0.35s;">
          회원가입
        </button>
      </div>

      <!-- 폼 -->
      <form id="auth-form" style="display: flex; flex-direction: column; gap: 24px;">
        <input 
          id="email" 
          type="email" 
          placeholder="이메일 주소" 
          required 
          style="padding: 18px 24px; border-radius: 16px; border: none; font-size: 1.15rem; 
          background: rgba(255,255,255,0.98); box-shadow: inset 0 2px 10px rgba(0,0,0,0.12);
          transition: all 0.3s;"
        />
        <input 
          id="password" 
          type="password" 
          placeholder="비밀번호" 
          required 
          style="padding: 18px 24px; border-radius: 16px; border: none; font-size: 1.15rem; 
          background: rgba(255,255,255,0.98); box-shadow: inset 0 2px 10px rgba(0,0,0,0.12);
          transition: all 0.3s;"
        />
        <button 
          id="submit-btn" 
          type="submit" 
          style="padding: 18px; background: linear-gradient(135deg, #7c3aed, #4f46e5, #6366f1); 
          color: white; border: none; border-radius: 16px; font-size: 1.25rem; font-weight: 800; 
          cursor: pointer; transition: all 0.4s; box-shadow: 0 10px 30px rgba(124,77,255,0.5);"
        >
          로그인
        </button>
      </form>

      <p id="auth-message" style="margin-top: 32px; font-size: 1.05rem; font-weight: 600; min-height: 28px;"></p>
    </div>
  `

  // 나머지 로직은 그대로 (탭 전환, 포커스, 제출 등)
  const tabs = document.querySelectorAll('.tab')
  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement
  const message = document.getElementById('auth-message') as HTMLParagraphElement
  let isLoginMode = true

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      isLoginMode = tab.id === 'login-tab'
      submitBtn.textContent = isLoginMode ? '로그인' : '회원가입'

      if (isLoginMode) {
        (tabs[0] as HTMLElement).style.background = 'rgba(167,139,250,0.35)'
        ;(tabs[1] as HTMLElement).style.background = 'transparent'
      } else {
        ;(tabs[0] as HTMLElement).style.background = 'transparent'
        ;(tabs[1] as HTMLElement).style.background = 'rgba(167,139,250,0.35)'
      }
    })
  })

  const inputs = document.querySelectorAll('input')
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      input.style.boxShadow = '0 0 0 3px rgba(124,77,255,0.4)'
    })
    input.addEventListener('blur', () => {
      input.style.boxShadow = 'inset 0 2px 10px rgba(0,0,0,0.12)'
    })
  })

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
      submitBtn.disabled = true
      submitBtn.innerHTML = '처리 중... <span style="margin-left:10px; animation: spin 1s linear infinite;">⏳</span>'

      let user
      if (isLoginMode) {
        user = await signIn(email, password)
        message.style.color = '#34d399'
        message.textContent = '로그인 성공! 잠시만 기다려주세요...'
      } else {
        user = await signUp(email, password)
        message.style.color = '#34d399'
        message.textContent = '회원가입 성공! 자동 로그인되었습니다.'
      }

      setTimeout(() => {
        loadCapsules()
      }, 1200)
    } catch (err: any) {
      message.style.color = '#ff6b6b'
      message.textContent = err.message || '오류가 발생했습니다.'
      submitBtn.disabled = false
      submitBtn.innerHTML = isLoginMode ? '로그인' : '회원가입'
    }
  })
}