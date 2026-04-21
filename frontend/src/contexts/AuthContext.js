import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

     const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const data = response.data;
            
            // 🔍 AFFICHAGE POUR DÉBOGUER
            console.log('📦 RÉPONSE COMPLÈTE:', data);
            console.log('📋 CLÉS DISPONIBLES:', Object.keys(data));
            
            // ✅ Extraction des données (version simple et robuste)
            const token = data.token;
            const userData = {
                id: data._id || data.id || data.userId,
                email: data.email,
                role: data.role,
                prenom: data.prenom || '',
                nom: data.nom || ''
            };
            
            // ✅ VÉRIFICATION
            if (!token) {
                console.error('❌ Token manquant dans la réponse');
                return { success: false, message: 'Token manquant' };
            }
            if (!userData.role) {
                console.error('❌ Rôle manquant dans la réponse');
                return { success: false, message: 'Rôle manquant' };
            }
            
            // ✅ STOCKAGE
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            console.log('✅ Connexion réussie:', userData);
            return { success: true };
            
        } catch (error) {
            console.error('❌ Erreur login:', error.response?.data || error.message);
            
            const backendMessage = error.response?.data?.message || 
                                  error.response?.data?.error ||
                                  error.message || 
                                  'Erreur de connexion';
            
            return { success: false, message: backendMessage };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};