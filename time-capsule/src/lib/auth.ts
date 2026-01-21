// src/lib/auth.ts
import { supabase } from './supabase.ts'
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

// 회원가입
export async function signUp(email: string, password: string) {
  // 이미 존재하는 이메일인지 확인
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (existing) {
    throw new Error('이미 사용 중인 이메일입니다.')
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      password_hash: passwordHash
    })
    .select()
    .single()

  if (error) throw error

  // 세션 저장 (로컬스토리지에 사용자 ID 저장)
  localStorage.setItem('capsule_user_id', data.id)
  localStorage.setItem('capsule_user_email', email)

  return data
}

// 로그인
export async function signIn(email: string, password: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, password_hash')
    .eq('email', email)
    .single()

  if (error || !user) {
    throw new Error('이메일 또는 비밀번호가 일치하지 않습니다.')
  }

  const isMatch = await bcrypt.compare(password, user.password_hash)
  if (!isMatch) {
    throw new Error('이메일 또는 비밀번호가 일치하지 않습니다.')
  }

  localStorage.setItem('capsule_user_id', user.id)
  localStorage.setItem('capsule_user_email', user.email)

  return user
}

// 로그아웃
export function signOut() {
  localStorage.removeItem('capsule_user_id')
  localStorage.removeItem('capsule_user_email')
}

// 현재 로그인된 사용자 가져오기
export function getCurrentUser() {
  const userId = localStorage.getItem('capsule_user_id')
  const email = localStorage.getItem('capsule_user_email')
  return userId ? { id: userId, email } : null
}