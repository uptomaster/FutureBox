// src/main.ts - FutureBox 최종 완성본 (텍스트 크기 최적화 버전)

import { supabase } from './lib/supabase.ts'
import { renderLoginForm } from './components/LoginForm.ts'
import { renderCreateCapsuleForm } from './components/CreateCapsuleForm.ts'
import { getCurrentUser, signOut } from './lib/auth.ts'
import { decrypt } from './lib/crypto.ts'

const capsuleList = document.getElementById('capsule-list') as HTMLDivElement | null
const introSection = document.getElementById('intro-section') as HTMLElement | null
const ITEMS_PER_PAGE = 6

function maskEmail(email: string): string {
  if (!email) return '익명'
  const [local, domain] = email.split('@')
  if (local.length <= 2) return email
  return `${local.slice(0, 2)}${'*'.repeat(local.length - 2)}@${domain}`
}

// 공개 상자 불러오기
async function loadPublicCapsules(page = 1) {
  const currentUser = getCurrentUser()

  let query = supabase
    .from('capsules')
    .select(`
      id,
      user_id,
      open_at,
      created_at,
      is_opened,
      users (email)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1)

  if (currentUser) {
    query = query.neq('user_id', currentUser.id)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('공개 상자 오류:', error)
    return { capsules: [], total: 0 }
  }

  const capsules = data.map((c: any) => ({
    ...c,
    email: c.users?.email || '익명'
  }))

  return { capsules, total: count || 0 }
}

export async function loadCapsules(publicPage = 1) {
  if (!capsuleList || !introSection) return

  const currentUser = getCurrentUser()

  // 인트로 섹션 렌더링 - 폰트 사이즈 살짝 축소
  if (!currentUser) {
    introSection.innerHTML = `
      <h2 style="font-size: 1.8rem;">미래의 나에게 메시지를 보내세요</h2>
      <p style="font-size: 1rem; opacity: 0.8;">FutureBox는 당신의 추억을 안전하게 봉인합니다. 지정한 날짜에만 열 수 있어요!</p>
    `
  } else {
    introSection.innerHTML = `
      <h2 style="font-size: 1.8rem;">환영합니다, ${currentUser.email?.split('@')[0] ?? '사용자'}님!</h2>
      <p style="font-size: 1rem; opacity: 0.8;">새로운 상자를 만들거나, 기존 상자를 확인해보세요.</p>
    `
  }

  // 헤더 사용자 메뉴 업데이트
  const userMenu = document.getElementById('user-menu')
  if (userMenu) {
    if (currentUser) {
      userMenu.innerHTML = `
        <span class="user-email" style="font-size: 0.95rem;">${currentUser.email}</span>
        <button class="logout-btn" id="logout-btn" style="padding: 8px 16px; font-size: 0.85rem;">로그아웃</button>
      `
      document.getElementById('logout-btn')?.addEventListener('click', () => {
        signOut()
        loadCapsules(publicPage)
        alert('로그아웃되었습니다.')
      })
    } else {
      userMenu.innerHTML = ''
    }
  }

  if (!currentUser) {
    renderLoginForm(capsuleList)
    return
  }

  let html = `
    <section class="public-section fade-in">
      <h2 class="section-title" style="font-size: 1.6rem; margin-bottom: 24px;">다른 사람들의 상자들</h2>
      <div class="capsule-grid">
  `

  const { capsules: publicCapsules, total: totalPublic } = await loadPublicCapsules(publicPage)

  if (publicCapsules.length === 0) {
    html += '<p class="empty-message">아직 공개된 상자가 없어요...</p>'
  } else {
    html += publicCapsules.map(capsule => {
      const maskedEmail = maskEmail(capsule.email)
      const openAtDate = new Date(capsule.open_at)
      const isOpenable = !capsule.is_opened && openAtDate <= new Date()
      const statusClass = capsule.is_opened ? 'unlocked' : 'locked'

      let messageText = ''
      let messageColor = ''

      if (capsule.is_opened) {
        messageText = '이미 열렸어요!'
        messageColor = '#34d399'
      } else if (isOpenable) {
        messageText = '지금 열 수 있어요!'
        messageColor = '#fbbf24'
      } else {
        messageText = '아직 열 수 없습니다...'
        messageColor = '#9ca3af'
      }

      return `
        <div class="capsule-card ${statusClass} hover-scale">
          <div class="card-content" style="padding: 24px;">
            <h2 class="card-title" style="font-size: 1.3rem;">비밀 상자</h2>
            <p class="card-author" style="font-size: 0.85rem;">by ${maskedEmail}</p>
            <p class="card-date" style="font-size: 0.85rem; opacity: 0.7;">
              ${capsule.is_opened ? '개봉됨' : '열림 예정: ' + openAtDate.toLocaleDateString('ko-KR')}
            </p>
            <p class="card-message" style="white-space: pre-line; color: ${messageColor}; font-size: 0.95rem; min-height: auto; margin-top: 12px;">
              ${messageText}
            </p>
          </div>
        </div>
      `
    }).join('')
  }

  html += '</div>'

  // 페이지네이션 - 버튼 크기 축소
  if (totalPublic > ITEMS_PER_PAGE) {
    const totalPages = Math.ceil(totalPublic / ITEMS_PER_PAGE)
    html += '<div class="pagination" style="margin: 30px 0;">'
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="${i === publicPage ? 'active' : ''}" data-page="${i}" style="padding: 8px 14px; font-size: 0.85rem;">${i}</button>`
    }
    html += '</div>'
  }

  html += '<div class="section-divider" style="margin: 40px 0;"></div>'

  // 나의 상자 섹션
  html += `
    <section class="my-section fade-in">
      <div class="my-header" style="margin-bottom: 24px;">
        <h2 class="section-title" style="font-size: 1.6rem; margin: 0;">나의 상자</h2>
        <button id="create-new-btn" class="create-btn" style="padding: 10px 20px; font-size: 0.95rem;">새 상자 만들기</button>
      </div>
      <div class="capsule-grid">
  `

  const { data: myCapsules, error: myError } = await supabase
    .from('capsules')
    .select('id, title, open_at, created_at, is_opened, opened_at')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false })

  if (myError) {
    html += '<p class="error-message">나의 상자를 불러오는 중 오류가 발생했습니다.</p>'
  } else if (myCapsules.length === 0) {
    html += '<p class="empty-message" style="font-size: 1rem;">아직 만든 상자가 없어요. 새 상자를 만들어 보세요!</p>'
  } else {
    html += myCapsules.map(capsule => {
      const openAtDate = new Date(capsule.open_at)
      const now = new Date()
      const isOpenable = !capsule.is_opened && openAtDate <= now
      const statusClass = capsule.is_opened ? 'unlocked' : 'locked'

      let dateText = capsule.is_opened
        ? `개봉됨: ${new Date(capsule.opened_at).toLocaleString('ko-KR', {
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })}`
        : `열림 예정: ${openAtDate.toLocaleDateString('ko-KR')}`

      let messageText = ''
      let messageColor = ''

      if (capsule.is_opened) {
        messageText = '이 상자는 이미 열렸습니다!'
        messageColor = '#34d399'
      } else if (isOpenable) {
        messageText = '지금 열 수 있어요!'
        messageColor = '#fbbf24'
      } else {
        messageText = '아직 열 수 없습니다...'
        messageColor = '#9ca3af'
      }

      const openBtn = (capsule.is_opened || isOpenable)
        ? `<button class="open-btn" data-id="${capsule.id}" style="padding: 10px 20px; font-size: 0.9rem;">열기</button>`
        : ''

      const deleteBtn = `<button class="delete-btn" data-id="${capsule.id}" style="padding: 10px 20px; font-size: 0.9rem; margin-left: 8px;">삭제</button>`

      return `
        <div class="capsule-card ${statusClass} hover-scale" data-id="${capsule.id}">
          <div class="card-content" style="padding: 24px;">
            <h2 class="card-title" style="font-size: 1.3rem; margin-bottom: 8px;">${capsule.title || '(제목 없음)'}</h2>
            <p class="card-date" style="font-size: 0.85rem; opacity: 0.7;">${dateText}</p>
            <p class="card-message" style="white-space: pre-line; color: ${messageColor}; font-size: 0.95rem; margin: 12px 0; min-height: auto;">
              ${messageText}
            </p>
            <div style="margin-top: 16px;">
              ${openBtn}
              ${deleteBtn}
            </div>
          </div>
        </div>
      `
    }).join('')
  }

  html += '</div></section>'

  capsuleList.innerHTML = html

  setTimeout(() => {
    const sections = document.querySelectorAll('.fade-in')
    sections.forEach(s => s.classList.add('visible'))
  }, 100)

  // 이벤트 리스너들
  document.getElementById('create-new-btn')?.addEventListener('click', () => {
    if (capsuleList && currentUser) {
      renderCreateCapsuleForm(capsuleList)
    }
  })

  document.querySelectorAll('.pagination button').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt((btn as HTMLButtonElement).dataset.page || '1')
      loadCapsules(page)
    })
  })

  // 열기 버튼 이벤트
  document.querySelectorAll('.open-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLButtonElement
      const id = target.dataset.id

      if (!id) return

      try {
        const currentUser = getCurrentUser()
        if (!currentUser) {
          alert('로그인 후 이용해주세요.')
          return
        }

        const { data: capsule, error: fetchError } = await supabase
          .from('capsules')
          .select('title, content, open_at, created_at, is_opened, opened_at')
          .eq('id', id)
          .eq('user_id', currentUser.id)
          .single()

        if (fetchError || !capsule) {
          alert('상자를 불러올 수 없습니다.')
          return
        }

        const decryptedContent = decrypt(capsule.content)

        const modal = document.createElement('div')
        modal.className = 'modal fade-in'
        modal.innerHTML = `
          <div class="modal-content" style="padding: 30px;">
            <button id="close-modal" class="close-btn" style="font-size: 1.8rem; top: 15px; right: 20px;">×</button>
            <h2 style="font-size: 1.5rem; margin-bottom: 20px;">${capsule.title || '(제목 없음)'}</h2>
            <div class="modal-message" style="white-space: pre-line; font-size: 1rem; line-height: 1.6;">${decryptedContent}</div>
            <p class="modal-time" style="font-size: 0.85rem; margin-top: 24px; opacity: 0.7;">
              봉인일: ${new Date(capsule.created_at).toLocaleDateString('ko-KR')} • 
              개봉 시각: ${capsule.is_opened
            ? new Date(capsule.opened_at).toLocaleString('ko-KR', {
              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })
            : '아직 개봉되지 않음'}
            </p>
          </div>
        `

        document.body.appendChild(modal)

        const closeModal = () => {
          modal.classList.remove('fade-in')
          modal.classList.add('fade-out')
          setTimeout(() => modal.remove(), 400)
        }

        modal.querySelector('#close-modal')?.addEventListener('click', closeModal)
        modal.addEventListener('click', (ev) => {
          if (ev.target === modal) closeModal()
        })
      } catch (err) {
        console.error(err)
        alert('오류가 발생했습니다. 다시 시도해주세요.')
      }
    })
  })

  // 삭제 버튼 이벤트
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLButtonElement
      const id = target.dataset.id

      if (!id) return

      const confirmModal = document.createElement('div')
      confirmModal.className = 'modal fade-in'
      confirmModal.innerHTML = `
        <div class="modal-content confirm-modal" style="max-width: 360px; padding: 30px;">
          <h2 style="color: #ef4444; font-size: 1.4rem;">정말 삭제하시겠어요?</h2>
          <p style="color: #666; margin: 16px 0; font-size: 0.95rem;">삭제된 상자는 복구할 수 없습니다.</p>
          <div style="display: flex; gap: 16px; justify-content: center;">
            <button id="cancel-delete" class="btn-secondary" style="padding: 10px 24px; font-size: 0.9rem;">취소</button>
            <button id="confirm-delete" class="btn-danger" style="padding: 10px 24px; font-size: 0.9rem;">삭제</button>
          </div>
        </div>
      `

      document.body.appendChild(confirmModal)

      confirmModal.querySelector('#cancel-delete')?.addEventListener('click', () => {
        confirmModal.classList.add('fade-out')
        setTimeout(() => confirmModal.remove(), 400)
      })

      confirmModal.querySelector('#confirm-delete')?.addEventListener('click', async () => {
        try {
          const { error } = await supabase
            .from('capsules')
            .delete()
            .eq('id', id)
            .eq('user_id', currentUser.id)

          if (error) throw error

          confirmModal.classList.add('fade-out')
          setTimeout(() => confirmModal.remove(), 400)
          alert('상자가 삭제되었습니다.')
          loadCapsules(publicPage)
        } catch (err) {
          console.error(err)
          alert('삭제 중 오류가 발생했습니다.')
          confirmModal.remove()
        }
      })
    })
  })
}

// 초기 로드
loadCapsules(1)

// 스토리지 변화 감지
window.addEventListener('storage', (e) => {
  if (e.key === 'capsule_user_id') {
    loadCapsules(1)
  }
})