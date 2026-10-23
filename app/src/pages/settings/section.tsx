import type { ReactNode } from 'react'
import { SectionHeading } from '../../components/list/list'
import { cn } from '../../utils/cn'

interface SectionProps {
    heading: ReactNode
    children: ReactNode
    className?: string
}

export const Section = ({ heading, children, className }: SectionProps) => (
    <section className={cn('flex flex-col gap-2', className)}>
        <SectionHeading>{heading}</SectionHeading>
        {children}
    </section>
)
