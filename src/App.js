import './App.css';
import Preconfig from './Components/Preconfig';
import Config from './Components/Config';
import { Route, Routes } from 'react-router-dom';

function App() {
  return (
    <div className="App">      
        <Routes>
          <Route path='/' element={<Preconfig />} />
          <Route path='/config' element={<Config />} />
        </Routes>
    </div>
  );
}

export default App;
