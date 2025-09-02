/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      typography: () => ({

        mauve: {
          css: {
            '--tw-prose-body': 'var(--color-ctp-mauve-800)',
            '--tw-prose-headings': 'var(--color-ctp-mauve-900)',
            '--tw-prose-lead': 'var(--color-ctp-mauve-700)',
            '--tw-prose-links': 'var(--color-ctp-mauve-900)',
            '--tw-prose-bold': 'var(--color-ctp-mauve-900)',
            '--tw-prose-counters': 'var(--color-ctp-mauve-600)',
            '--tw-prose-bullets': 'var(--color-ctp-mauve-400)',
            '--tw-prose-hr': 'var(--color-ctp-mauve-300)',
            '--tw-prose-quotes': 'var(--color-ctp-mauve-900)',
            '--tw-prose-quote-borders': 'var(--color-ctp-mauve-300)',
            '--tw-prose-captions': 'var(--color-ctp-mauve-700)',
            '--tw-prose-code': 'var(--color-ctp-mauve-900)',
            '--tw-prose-pre-code': 'var(--color-ctp-mauve-100)',
            '--tw-prose-pre-bg': 'var(--color-ctp-mauve-900)',
            '--tw-prose-th-borders': 'var(--color-ctp-mauve-300)',
            '--tw-prose-td-borders': 'var(--color-ctp-mauve-200)',
            '--tw-prose-invert-body': 'var(--color-ctp-mauve-200)',
            '--tw-prose-invert-headings': 'var(--color-white)',
            '--tw-prose-invert-lead': 'var(--color-ctp-mauve-300)',
            '--tw-prose-invert-links': 'var(--color-white)',
            '--tw-prose-invert-bold': 'var(--color-white)',
            '--tw-prose-invert-counters': 'var(--color-ctp-mauve-400)',
            '--tw-prose-invert-bullets': 'var(--color-ctp-mauve-600)',
            '--tw-prose-invert-hr': 'var(--color-ctp-mauve-700)',
            '--tw-prose-invert-quotes': 'var(--color-ctp-mauve-100)',
            '--tw-prose-invert-quote-borders': 'var(--color-ctp-mauve-700)',
            '--tw-prose-invert-captions': 'var(--color-ctp-mauve-400)',
            '--tw-prose-invert-code': 'var(--color-white)',
            '--tw-prose-invert-pre-code': 'var(--color-ctp-mauve-100)',
            '--tw-prose-invert-pre-bg': 'rgb(0 0 0 / 50%)',
            '--tw-prose-invert-th-borders': 'var(--color-ctp-mauve-600)',
            '--tw-prose-invert-td-borders': 'var(--color-ctp-mauve-700)',
          },
        },
      }),
    },
  },
}
