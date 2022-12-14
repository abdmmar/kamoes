import Trie from '@/lib/trie';
import localforage from 'localforage';
import { WorkerMessage, createMessage, Manager } from '@/lib/worker';

const trie = new Trie();
const worker = new Manager(self)

const initDB = async (): Promise<[Array<string> | null, Error | null]> => {
  try {
    const kbbi: string | null = await localforage.getItem('kbbi')
    
    if(!kbbi) {
      const words_ = await import('../../data/words.json');
      await localforage.setItem('kbbi', JSON.stringify(words_.default));
      return [words_.default, null]
    }

    return [JSON.parse(kbbi), null]
  } catch (err) {
    return [null, err as Error]
  }
}

(async function main() {
  const [words, error] = await initDB()
  
  if(error || !words) {
    return worker.post<WorkerMessage>('words', createMessage({type: 'error', message: error?.message || '❌ Tidak ada entri'}))
  }
  
  for (const word of words) {
    trie.insert(word.toLowerCase());
  }

  worker.post<WorkerMessage>('words', createMessage({type: 'info', message:'✅ Inisialisasi selesai'}))
  setTimeout(() => worker.post<WorkerMessage>('words',createMessage({type: 'info', message:''})), 500);
})()

worker.get<WorkerMessage<string>>('words', (e, {data}) => {
  const result = trie.autocomplete(data || '')
  worker.post<WorkerMessage>('words', createMessage({type: 'data', data: result}))
})


const suffixWordsCache = new Map()
let suffixList: Array<string> = []

const getSuffixWords = async (suffix: string) => {
  const cacheSuffix = suffixWordsCache.get(suffix)
  
  if(cacheSuffix) return cacheSuffix

  if(!suffixList) suffixList = await import('../../data/suffix.json')
  
  if(!suffixList.includes(suffix)) return

  const kbbi: string | null = await localforage.getItem('kbbi')

  if(!kbbi) return
  
  const words = JSON.parse(kbbi)
  const suffixWords = []

  for (const word of words) {
    if (word.endsWith(suffix)) {
      suffixWords.push(word)
    }
  }

  suffixWordsCache.set(suffix, suffixWords)
  
  return suffixWords
}

worker.get('suffix', (e, data) => {
  worker.post<WorkerMessage>('suffix', createMessage({type: 'data', data: data.data.toUpperCase()}))
})