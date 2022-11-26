import { useRef } from 'preact/hooks'
import { batch, signal, useComputed, useSignal, useSignalEffect } from '@preact/signals'
import { SuggestionItem } from '@/lib/symspell'

import SearchIcon from '@/assets/icons/search.svg'
import CloseIcon from '@/assets/icons/x.svg'
import cx from './Home.module.css'

interface WorkerMessage {
  type: 'info' | 'data' | 'error'
  message?: string
  data?: any
}

const worker = signal(
  new Worker(new URL('./worker.ts', import.meta.url), {
    type: 'module',
  }),
)

export default function Home() {
  const searchInput = useRef<HTMLInputElement | null>(null)
  const search = useSignal('')
  const status = useSignal('')
  const words = useSignal<SuggestionItem[]>([])
  const topWords = useComputed(() => words.value.slice(0, 5))

  useSignalEffect(() => {
    worker.value.onmessage = (e: MessageEvent<WorkerMessage>) => {
      if (e.data.message) {
        status.value = e.data.message
      }
      if (e.data.type === 'data') {
        words.value = e.data.data
      }
    }
  })

  const onChangeSearch = (e: Event) => {
    const { value } = e.target as HTMLInputElement
    search.value = value
    worker.value.postMessage(value)
  }

  const onClickSuggestionItem = (word: string) => {
    console.log(word)
  }

  const onClickReset = () => {
    batch(() => {
      search.value = ''
      words.value = []
    })
    searchInput.current?.focus()
  }

  return (
    <>
      <section class={cx.searchContainer}>
        <div class={cx.searchAutocomplete}>
          <form class={cx.autocomplete}>
            <div class={cx.searchField}>
              <label for="searchInput" class="sr-only">
                Search
              </label>
              <input
                type="text"
                id="searchInput"
                name="searchInput"
                ref={searchInput}
                class={cx.searchInput}
                value={search.value}
                autocomplete="off"
                placeholder="Cari kata dalam kamus"
                onChange={onChangeSearch}
              />
            </div>
            {search.value ? (
              <button type="reset" class={cx.resetButton} onClick={onClickReset}>
                <p class="sr-only">Clear input search</p>
                <CloseIcon />
              </button>
            ) : null}
            <button type="submit" class={cx.searchSubmit}>
              <p class="sr-only">Search</p>
              <SearchIcon />
            </button>
          </form>
          {topWords.value.length > 0 ? (
            <div class={cx.result}>
              <ul class={cx.resultList}>
                {topWords.value.map((word) => (
                  <Item
                    key={word.term}
                    value={search.value}
                    word={word.term}
                    onClick={onClickSuggestionItem}
                  />
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>
      <div>{status}</div>
    </>
  )
}

interface ItemProps {
  value: string
  word: string
  onClick: (word: string) => void
}

function Item({ value, word, onClick }: ItemProps) {
  const splitWord = word.replace(value, '')
  const isHighlight = splitWord.length !== word.length

  return (
    <li class={cx.resultItem} onClick={() => onClick(word)}>
      {isHighlight ? (
        <>
          <strong>{value}</strong>
          {splitWord}
        </>
      ) : (
        <>{word}</>
      )}
    </li>
  )
}
