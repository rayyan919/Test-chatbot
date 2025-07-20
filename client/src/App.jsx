import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Chat from './pages/Chat.jsx';

const isLoggedIn = () => {
  return localStorage.getItem('token');
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/chat" element={isLoggedIn() ? <Chat /> : <Navigate to="/login" />} />
    </Routes>
  );
}
