import React, { createContext, useState, useEffect } from 'react';
import api from './services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
            } catch (error) {
                console.error("Error parsing stored user data, clearing localStorage.");
                localStorage.removeItem('user');
            }
        }
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            console.log("Login response:", response.data);
    
            // Ensure the role is stored correctly
            response.data.role = response.data.role.trim().toUpperCase();  
            
            localStorage.setItem('user', JSON.stringify(response.data));
            setUser(response.data);
        } catch (error) {
            throw new Error('Invalid credentials');
        }
    };
    

    const logout = (navigate) => {
        setUser(null);
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
