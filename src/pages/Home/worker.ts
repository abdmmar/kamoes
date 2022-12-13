import Trie from '@/lib/trie';
import localforage from 'localforage';

const trie = new Trie();

interface WorkerMessage {
  type: 'info' | 'data' | 'error',
  message?: string,
  data?: any,
}

const createMessage = (options: WorkerMessage) => ({...options})

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

const main = async () => {
  const [words, error] = await initDB()
  
  if(error || !words) {
    return postMessage(createMessage({type: 'error', message: error?.message || '❌ Tidak ada entri'}));
  }
  
  for (const word of words) {
    trie.insert(word.toLowerCase());
  }
}

main().then(() => {
  postMessage(createMessage({type: 'info', message:'✅ Inisialisasi selesai'}));
  setTimeout(() => postMessage(createMessage({type: 'info', message:''})), 500);
})

onmessage = (event) => {
  const result = trie.autocomplete(event.data)
  postMessage(createMessage({type: 'data', data: result}));
};