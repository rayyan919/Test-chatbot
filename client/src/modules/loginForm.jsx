import { useState } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";

export default function LoginForm() {
    const [username, setUsername] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:3000/api/login', { username });
            const { token, user } = res.data.data;

            localStorage.setItem('token', token);
            localStorage.setItem('userId', user.id);

            navigate('/chat');
        } catch (err) {
            alert('Login failed');
        }
    };
    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-80">
            <h2 className="text-xl mb-4">Login</h2>
            <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border p-2 mb-4"
            />
            <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
                Login
            </button>
        </form>
    );
}