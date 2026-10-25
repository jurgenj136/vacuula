import { screen, within } from '@testing-library/react'
import { t, type User } from './common'

export const busy = () => screen.queryByRole('main')?.getAttribute('aria-busy') === 'true'

const toastElement = () => [...screen.queryAllByRole('status'), ...screen.queryAllByRole('alert')].find(el => el.getAttribute('aria-atomic') === 'true')

export const toast = (): { kind: 'success' | 'error', text: string } | undefined => {
    const el = toastElement()
    if (!el) return undefined
    return { kind: el.getAttribute('role') === 'alert' ? 'error' : 'success', text: el.querySelector('p')?.textContent ?? '' }
}

const errorToast = () => {
    const el = toastElement()
    if (el?.getAttribute('role') !== 'alert') throw new Error('no error toast')
    return el
}
export const retry = (user: User) => user.click(within(errorToast()).getByRole('button', { name: t('feedback.retry') }))
export const dismiss = (user: User) => user.click(within(errorToast()).getByRole('button', { name: t('feedback.dismiss') }))
