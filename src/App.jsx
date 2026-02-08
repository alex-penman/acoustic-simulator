import { PhoneticsStudio } from './PhoneticsStudio'
import './App.css'

function App() {
  // Demo mode - no authentication needed
  const user = {
    name: 'Phonetician',
    firstName: 'Alex'
  }

  const handleLogout = () => {
    window.location.reload()
  }

  return (
    <PhoneticsStudio user={user} onLogout={handleLogout} />
  )
}

export default App
