import { screen, within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import i18n from '../../i18n'

export type User = UserEvent

export const t = (key: string, options?: Record<string, unknown>) => i18n.t(key as never, options) as string

// visible to the user: not hidden by display/visibility anywhere up the tree
export function isShown(element: Element | null) {
    for (let el = element; el; el = el.parentElement) {
        const style = getComputedStyle(el)
        if (style.display === 'none' || style.visibility === 'hidden') return false
    }
    return !!element
}

export const textShown = (text: string) => screen.queryAllByText(text).some(isShown)

// <Input label=...>: the label text sits right next to its control
export function field(label: string, container: HTMLElement = document.body) {
    const section = within(container).getAllByText(label, { exact: true })
        .map(el => el.parentElement!)
        .find(el => el.querySelector('button, input, select'))
    if (!section) throw new Error(`no field labelled "${label}"`)
    return section
}

// list item whose first line reads `text` (navigation labels are not list items)
export function row(text: string, container: HTMLElement = document.body) {
    const matches = within(container).getAllByText(text, { exact: true }).filter(el => !el.closest('nav'))
    if (matches.length !== 1) throw new Error(`expected one row "${text}", found ${matches.length}`)
    return matches[0].parentElement!.parentElement!
}

export const checkbox = (container: HTMLElement) => within(container).getByRole('checkbox') as HTMLInputElement

export const fieldOptions = (label: string) =>
    within(field(label)).getAllByRole('button').map(b => b.textContent ?? '')

export async function chooseOption(user: User, label: string, option: string) {
    await user.click(within(field(label)).getByRole('button', { name: option }))
}
