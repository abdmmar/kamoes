export interface WorkerMessage<T = any> {
  type: 'info' | 'data' | 'error',
  message?: string,
  data?: T,
}

export const createMessage = <TData = any>(options: WorkerMessage<TData>) => ({...options})

type PostMessage<T = any> = {
  path: string,
  message: T,
}

export class Manager {
  worker: Worker | Window & typeof globalThis
  path: Map<string, any> = new Map()

  constructor(worker: Worker | Window & typeof globalThis){
    this.worker = worker
  }

  createMessage<TMessage = any>(path: string, message: TMessage): PostMessage<TMessage> {
    return {path, message}
  }

  post<TMessage = any>(path: string, message: TMessage, options?: StructuredSerializeOptions){
    const {path: path_} = this.addPath(path)
    const message_ = this.createMessage<TMessage>(path_, message)
    this.worker.postMessage(message_, options)
  }

  get<TData = any>(path: string, handler: (e: MessageEvent<TData>, data: TData) => void){
    this.addPath(path, handler)

    this.worker.onmessage = (e: MessageEvent<PostMessage<TData>>) => {
      const {path: path__, message} = e.data
      const handler_ = this.path.get(path__)
      handler_(e, message)
    }   
  }

  addPath(path: string, value?: any){
    if(!this.path.has(path)){
      this.path.set(path, value)
      return {path, handler: this.path.get(path)}
    } else {
      return {path, handler: this.path.get(path)}
    }
  }
}