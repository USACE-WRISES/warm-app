// @vitest-environment happy-dom
// The pages as people use them: every calculator page renders, loads its worked example and shows the
// expected result; the many-sites grid computes its rows; the finder ranks; and no page shows a
// placeholder word (undefined, NaN, null) or a long dash.
import { beforeEach, describe, expect, it } from 'vitest'
import { CALCULATORS, calculator } from '../src/calculators'
import { calculatorPage } from '../src/views/calculator'
import { finderPage } from '../src/views/finder'
import { guidePage } from '../src/views/guide'
import { homePage } from '../src/views/home'

const DASHES = [String.fromCharCode(0x2014), String.fromCharCode(0x2013)]

function mount(el: HTMLElement): HTMLElement {
  document.body.replaceChildren(el)
  return el
}

function clean(el: HTMLElement, where: string): void {
  const text = el.textContent ?? ''
  expect(text, where).not.toMatch(/\bundefined\b|\bNaN\b|\bnull\b|\[object /)
  for (const d of DASHES) expect(text.includes(d), `${where}: a long dash`).toBe(false)
}

const click = (el: HTMLElement, label: string) => {
  const b = [...el.querySelectorAll('button')].find((x) => x.textContent?.includes(label))
  if (!b) throw new Error(`no button "${label}"`)
  b.click()
}

beforeEach(() => {
  localStorage.clear()
  document.body.replaceChildren()
})

describe('calculator pages', () => {
  const expected: Record<string, string> = {
    chatfield: '0.337', cottonwood: '0.590', 'lower-willamette': '0.609', mink: '0.701', resaca: '0.392', smurf: '0.501',
    skokomish: '0.840', 'upper-mississippi': '0.330',
  }
  for (const spec of CALCULATORS) {
    it(`${spec.name}: renders, and its example gives the expected result`, () => {
      const page = mount(calculatorPage(spec))
      expect(page.querySelector('h1')?.textContent).toBe(spec.name)
      expect(page.querySelector('.wa-result-value')?.textContent).toBe('n/a')
      clean(page, spec.id)
      if (spec.example) {
        click(page, 'Example')
        expect(page.querySelector('.wa-result-value')?.textContent, spec.id).toBe(expected[spec.id])
        clean(page, `${spec.id} with its example`)
      }
    })
  }

  it('the form updates the result as an input is typed, and flags an invalid one', () => {
    const page = mount(calculatorPage(calculator('skokomish')!))
    click(page, 'Example')
    const v1 = page.querySelector<HTMLInputElement>('#f-V1')!
    v1.value = '1.5'
    v1.dispatchEvent(new Event('input'))
    expect(page.querySelector('.wa-result-value')?.textContent).toBe('n/a')
    expect(page.querySelector('#f-V1-err')?.textContent).toContain('from 0 to 1')
    v1.value = '0.72'
    v1.dispatchEvent(new Event('input'))
    expect(page.querySelector('.wa-result-value')?.textContent).toBe('0.840')
  })

  it('the setup choice shows its own inputs', () => {
    const page = mount(calculatorPage(calculator('bosque')!))
    expect(page.querySelector('#f-DEPTHGW')).toBeNull()
    const cover = page.querySelector<HTMLSelectElement>('select#f-cover')!
    cover.value = '6'
    cover.dispatchEvent(new Event('change'))
    expect(page.querySelector('#f-CANSEDGE')).not.toBeNull()
    expect(page.querySelector('#f-DEPTHOM')).toBeNull()
  })

  it('"Next empty input" moves to the first input still to fill', () => {
    const page = mount(calculatorPage(calculator('upper-mississippi')!))
    click(page, 'Next empty input')
    expect(document.activeElement?.id).toBe('f-canopy')
    const canopy = page.querySelector<HTMLInputElement>('#f-canopy')!
    canopy.value = '50'
    canopy.dispatchEvent(new Event('input'))
    click(page, 'Next empty input')
    expect(document.activeElement?.id).toBe('f-forest')
  })

  it('an input\'s (i) opens its help and curve, and Escape closes it; the help stays linked to the input', () => {
    const page = mount(calculatorPage(calculator('upper-mississippi')!))
    const info = page.querySelector<HTMLButtonElement>('[data-id="regen"] .wa-info')!
    const pop = page.querySelector<HTMLElement>('#f-regen-pop')!
    expect(pop.hidden).toBe(true)
    info.click()
    expect(pop.hidden).toBe(false)
    expect(info.getAttribute('aria-expanded')).toBe('true')
    expect(pop.textContent).toContain('Stocking above the target scores 1.0.')
    expect(pop.querySelector('svg')).not.toBeNull()
    info.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(pop.hidden).toBe(true)
    const described = page.querySelector('#f-regen')!.getAttribute('aria-describedby')!.split(' ')
    expect(described.map((id) => page.querySelector(`#${id}`)?.textContent ?? '').join(' ')).toContain('Stocking above the target')
  })

  it('the inputs are kept between visits', () => {
    const first = mount(calculatorPage(calculator('upper-mississippi')!))
    click(first, 'Example')
    const again = mount(calculatorPage(calculator('upper-mississippi')!))
    expect(again.querySelector('.wa-result-value')?.textContent).toBe('0.330')
  })

  it('many sites: the site moves into the grid, and each row computes', () => {
    const page = mount(calculatorPage(calculator('cottonwood')!))
    click(page, 'Example')
    click(page, 'Many sites')
    const rows = page.querySelectorAll('.wa-grid tbody tr')
    expect(rows.length).toBe(1)
    expect(rows[0].querySelector('td[data-o="eri"]')?.textContent).toBe('0.590')
    // a young stand has no use for DEPTHGW
    const age = page.querySelector<HTMLInputElement>('input[data-r="0"][data-c="age"]')!
    age.value = '10'
    age.dispatchEvent(new Event('input', { bubbles: true }))
    expect(rows[0].querySelector('td[data-c="DEPTHGW"]')?.classList.contains('is-na')).toBe(true)
    clean(page, 'cottonwood grid')
  })
})

describe('the other pages', () => {
  it('home lists the nine calculators', () => {
    const page = mount(homePage())
    expect(page.querySelectorAll('.wa-calc-card').length).toBe(9)
    clean(page, 'home')
  })
  it('the finder ranks by criteria and narrows by keyword', () => {
    const page = mount(finderPage())
    expect(page.querySelectorAll('.wa-model').length).toBe(14)
    const search = page.querySelector<HTMLInputElement>('input[type=search]')!
    search.value = 'Missouri'
    search.dispatchEvent(new Event('input'))
    expect(page.querySelectorAll('.wa-model').length).toBe(1)
    expect(page.querySelector('.wa-model mark')?.textContent).toBe('Missouri')
    clean(page, 'finder')
  })
  for (const section of ['about', 'use', 'models', 'changes', 'methods']) {
    it(`the guide: ${section}`, () => {
      const page = mount(guidePage(section))
      expect(page.querySelector('.wa-doc h1')).not.toBeNull()
      clean(page, `guide ${section}`)
    })
  }
})
