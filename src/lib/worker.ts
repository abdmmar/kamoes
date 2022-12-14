export interface WorkerMessage<T = any> {
  type: 'info' | 'data' | 'error',
  message?: string,
  data?: T,
}

export const createMessage = <TData = any>(options: WorkerMessage<TData>) => ({...options})

type PostMessage = {
  type: string,
  message: any,
}

export class Manager {
  worker: Worker
  path: Array<string> = []

  constructor(worker: Worker){
    this.worker = worker
  }

  createMessage(path: string, message: any): PostMessage {
    return {type: path, message}
  }

  post(path: string, message: any, options?: StructuredSerializeOptions){
    const path_ = this.addPath(path)
    const message_ = this.createMessage(path_, message)
    this.worker.postMessage(message_, options)
  }

  get(path: string, handler: (e: MessageEvent) => void){
    this.worker.onmessage = (e: MessageEvent<PostMessage>) => {
      const {type} = e.data
      const path_ = this.addPath(path)
      
      if(path_ === type) {
        handler(e)
      }
    }
  }

  addPath(path: string){
    if(!this.path.includes(path)){
      this.path.push(path)
      return path
    } else {
      return path
    }
  }
}