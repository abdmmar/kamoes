import { render } from 'preact'
import Main from './main'
import './index.css'

render(<Main />, document.getElementById('app') as HTMLElement)
