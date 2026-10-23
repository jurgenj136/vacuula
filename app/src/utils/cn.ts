// Joins class names, skipping falsy ones: cn('a', on && 'b')
export const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ')
