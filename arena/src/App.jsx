import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/pages/Home';
import Events from './components/pages/Events';
import Teams from './components/pages/Teams';
import Challenges from './components/pages/Challenges';
import Cohorts from './components/pages/Cohorts';
import Profile from './components/pages/Profile';
import styles from './App.module.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className={styles.app}>
        <Navbar />
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/cohorts" element={<Cohorts />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
