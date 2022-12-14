import { useRef } from 'preact/hooks'
import { batch, useComputed, useSignal, useSignalEffect } from '@preact/signals'

import { createMessage, Manager, WorkerMessage } from '@/lib/worker'
import SearchIcon from '@/assets/icons/search.svg'
import CloseIcon from '@/assets/icons/x.svg'
import cx from './Home.module.css'

const worker = new Manager(
  new Worker(new URL('./worker.ts', import.meta.url), {
    type: 'module',
  }),
)

export default function Home() {
  const searchInput = useRef<HTMLInputElement | null>(null)
  const search = useSignal('')
  const status = useSignal<string | undefined>('')
  const words = useSignal<string[]>([])
  const topWords = useComputed(() => words.value?.slice(0, 5) || [])

  useSignalEffect(() => {
    worker.get<WorkerMessage<string[]>>('words', (e, { type, message, data }) => {
      status.value = message
      if (type === 'data') {
        words.value = data || []
      }
    })

    worker.get('suffix', (e, data) => {
      console.log(data)
    })
  })

  const onChangeSearch = (e: Event) => {
    const { value } = e.target as HTMLInputElement
    search.value = value.toLowerCase()
    worker.post<WorkerMessage<string>>(
      'words',
      createMessage({ type: 'data', data: value.toLowerCase() }),
    )
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
          {topWords.value.length > 0 && search.value ? (
            <div class={cx.result}>
              <ul class={cx.resultList}>
                {topWords.value.map((word) => (
                  <Item
                    key={word}
                    value={search.value}
                    word={word}
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

  return (
    <li class={cx.resultItem} onClick={() => onClick(word)}>
      <strong>{value}</strong>
      {splitWord}
    </li>
  )
}
