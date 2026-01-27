import '../css/App.css'
import Header from './Header'
import Game from './Game'
import { useState } from 'react'

function App() {
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleHelpClick = () => {
    setShowHelpModal(true);
  };

  return (
    <>
      <Header onHelpClick={handleHelpClick}/>
      <Game showHelpModal={showHelpModal} onHelpModalClose={() => setShowHelpModal(false)}/>
    </>
  )
}

export default App
