import './yk-player.ts'
import type { YkPlayer } from './yk-player.ts'

const player = document.querySelector<YkPlayer>('yk-player')!

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-src]')) {
  button.addEventListener('click', () => {
    player.src = button.dataset.src!
    for (const b of document.querySelectorAll('[data-src]')) {
      b.classList.toggle('active', b === button)
    }
  })
}

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-lang]')) {
  button.addEventListener('click', () => {
    player.lang = button.dataset.lang!
    for (const b of document.querySelectorAll('[data-lang]')) {
      b.classList.toggle('active', b === button)
    }
  })
}
