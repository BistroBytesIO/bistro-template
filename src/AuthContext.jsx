// File: src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, signOut, fetchAuthSession } from 'aws-amplify/auth';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [customerProfile, setCustomerProfile] = useState(null);
    const [rewardsStatus, setRewardsStatus] = useState(null);

    // Check authentication status on app load
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            setIsLoading(true);
            const currentUser = await getCurrentUser();
            setUser(currentUser);

            // Get auth session and set API token
            const session = await fetchAuthSession();
            if (session.tokens?.idToken) {
                api.defaults.headers.common['Authorization'] = `Bearer ${session.tokens.idToken}`;

                // Fetch customer profile and rewards
                await fetchCustomerData();
            }
        } catch (error) {
            console.log('User not authenticated:', error);
            setUser(null);
            setCustomerProfile(null);
            setRewardsStatus(null);

            // Remove auth header
            delete api.defaults.headers.common['Authorization'];
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCustomerData = async () => {
        try {
            const [profileResponse, rewardsResponse] = await Promise.all([
                api.get('/auth/me'),
                api.get('/rewards/status')
            ]);

            setCustomerProfile(profileResponse.data);
            setRewardsStatus(rewardsResponse.data);
        } catch (error) {
            console.error('Error fetching customer data:', error);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            setUser(null);
            setCustomerProfile(null);
            setRewardsStatus(null);

            // Remove auth header
            delete api.defaults.headers.common['Authorization'];

            console.log('Successfully signed out');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const refreshRewardsStatus = async () => {
        if (user) {
            try {
                const response = await api.get('/rewards/status');
                setRewardsStatus(response.data);
            } catch (error) {
                console.error('Error refreshing rewards status:', error);
            }
        }
    };

    const value = {
        user,
        isLoading,
        customerProfile,
        rewardsStatus,
        checkAuthStatus,
        handleSignOut,
        fetchCustomerData,
        refreshRewardsStatus,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};