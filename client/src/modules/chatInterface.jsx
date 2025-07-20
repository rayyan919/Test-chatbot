import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ChatInterface() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);

    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    console.log('userId:', userId, typeof userId);


    useEffect(() => {
        const introduce = async () => {
            try {
                const res = await axios.post('http://localhost:3000/api/chat', {
                    user_id: userId,
                    message: '__intro__'
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                console.log('Bot raw response:', res?.data);

                const { reply, history } = res.data.data;

                // if (history?.length) {
                //     const restoredMessages = history.map(m => ({
                //         sender: m.sender === 'bot' ? 'bot' : 'user',
                //         text: m.message
                //     }));
                //     setMessages(restoredMessages);
                // }

                // if (reply) {
                //     const botMessage = { sender: 'bot', text: reply };
                //     setMessages(prev => [...prev, botMessage]);
                // }
                const restoredMessages = [];

                if (Array.isArray(history)) {
                    for (const m of history) {
                        if (m.message && m.sender) {
                            restoredMessages.push({
                                sender: m.sender === 'bot' ? 'bot' : 'user',
                                text: m.message
                            });
                        }
                    }
                }
                if (reply && (!restoredMessages.length || restoredMessages[restoredMessages.length - 1].text !== reply)) {
                    restoredMessages.push({ sender: 'bot', text: reply });
                }

                setMessages(restoredMessages);
            } catch (err) {
                console.error('Intro failed', err);
            }
        };

        introduce();
    }, []);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);

        try {
            const res = await axios.post('http://localhost:3000/api/chat', {
                user_id: userId,
                message: input
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Bot raw response:', res?.data);

            const botMessage = { sender: 'bot', text: res.data.data.reply };
            setMessages(prev => [...prev, botMessage]);
        } catch (err) {
            console.error('Chat request failed:', err);
            setMessages(prev => [...prev, { sender: 'bot', text: 'Error processing message.' }]);
        }

        setInput('');
    };


    return (
        <div className="max-w-xl mx-auto bg-white p-4 shadow rounded">
            <div className="h-96 overflow-y-auto mb-4 border p-2">
                {messages
                    .filter(msg => msg.text)
                    .map((msg, idx) => (
                        <div key={idx} className={`mb-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                            <span className="inline-block px-3 py-1 rounded bg-gray-200">{msg.text}</span>
                        </div>
                    ))}
            </div>
            <div className="flex gap-2">
                <input
                    className="flex-1 border p-2 rounded"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter compound input (CID/SMILES/Name)"
                />
                <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={sendMessage}>
                    Send
                </button>
            </div>
        </div>
    );
}
