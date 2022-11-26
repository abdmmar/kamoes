import SymSpell from '@/lib/symspell';

const symSpell = new SymSpell()

interface WorkerMessage {
  type: 'info' | 'data' | 'error',
  message?: string,
  data?: any,
}

const createMessage = (options: WorkerMessage) => ({...options})

postMessage(createMessage({type: 'info', message:'🚀 Fetching words...'}));

fetch('https://cdn.statically.io/gh/abdmmar/playground/main/src/kbbi-autocomplete/kbbi.json')
  .then((response) => response.json())
  .then((words: string[]) => {
    postMessage(createMessage({type: 'info', message:'📖 Adding words to dictionary...'}));
    for (const word of words) {
      symSpell.add(word)
    }
  })
  .finally(() => {
    postMessage(createMessage({type: 'info', message:'✅ Initialization complete'}));
    setTimeout(() => postMessage(''), 500);
  })
  .catch((e) => {
    postMessage(e);
  });

onmessage = (event) => {
  const result = symSpell.search(event.data);
  postMessage(createMessage({type: 'data', data: result}));
};