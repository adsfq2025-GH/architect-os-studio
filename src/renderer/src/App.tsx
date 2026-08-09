import { useEffect } from 'react'
import { useApp } from './store'
import { TitleBar, Sidebar } from './components/Chrome'
import Dashboard from './screens/Dashboard'
import NewProject from './screens/NewProject'
import Upload from './screens/Upload'
import Analysis from './screens/Analysis'
import Blueprint from './screens/Blueprint'
import Generate from './screens/Generate'
import QA from './screens/QA'
import Output from './screens/Output'
import Settings from './screens/Settings'
import Diagnostics from './screens/Diagnostics'

export default function App() {
  const { route, bootstrap } = useApp()
  useEffect(() => { bootstrap() }, [])

  const screen = (() => {
    switch (route.name) {
      case 'dashboard': return <Dashboard />
      case 'new': return <NewProject />
      case 'upload': return <Upload projectId={route.projectId} />
      case 'analysis': return <Analysis projectId={route.projectId} />
      case 'blueprint': return <Blueprint projectId={route.projectId} />
      case 'generate': return <Generate projectId={route.projectId} />
      case 'qa': return <QA projectId={route.projectId} />
      case 'output': return <Output projectId={route.projectId} />
      case 'settings': return <Settings />
      case 'diagnostics': return <Diagnostics />
    }
  })()

  return (
    <div className="app-shell">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main key={route.name + ('projectId' in route ? route.projectId : '')} className="flex-1 overflow-auto animate-fade-in">
          {screen}
        </main>
      </div>
    </div>
  )
}
