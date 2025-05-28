import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';

const useWebSocket = (baseUrl, onMessage, enabled = true) => {
    const clientRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        if (!enabled) return;

        // Prevent multiple connections in React StrictMode
        if (clientRef.current && clientRef.current.connected) {
            console.log('🔌 WebSocket already connected, skipping...');
            return;
        }

        console.log('🔌 Starting WebSocket connection...');

        // Clean up any existing connection
        if (clientRef.current) {
            try {
                clientRef.current.deactivate();
            } catch (e) {
                // Ignore cleanup errors
            }
            clientRef.current = null;
        }

        // Use native WebSocket URL for stability
        const wsUrl = baseUrl
            .replace('http://', 'ws://')
            .replace('https://', 'wss://')
            .replace('/api', '') + '/ws-orders/websocket';

        console.log('📡 Connecting to:', wsUrl);

        const client = new Client({
            brokerURL: wsUrl,

            connectHeaders: {},

            onConnect: (frame) => {
                if (!mountedRef.current) return; // Component unmounted

                console.log('✅ WebSocket Connected!', frame);
                setIsConnected(true);
                setConnectionError(null);

                // Subscribe to order notifications
                try {
                    const subscription = client.subscribe('/topic/orders', (message) => {
                        if (!mountedRef.current) return; // Component unmounted

                        console.log('📨 Received message:', message.body);
                        try {
                            const notification = JSON.parse(message.body);
                            onMessage(notification);
                        } catch (parseError) {
                            console.error('❌ Error parsing message:', parseError);
                        }
                    });

                    console.log('📡 Successfully subscribed to /topic/orders');
                } catch (subscribeError) {
                    console.error('❌ Failed to subscribe:', subscribeError);
                }
            },

            onDisconnect: (frame) => {
                if (!mountedRef.current) return;
                console.log('❌ WebSocket Disconnected');
                setIsConnected(false);
            },

            onStompError: (frame) => {
                if (!mountedRef.current) return;
                console.error('❌ STOMP Error:', frame);
                setConnectionError(frame.headers?.message || 'STOMP connection error');
                setIsConnected(false);
            },

            onWebSocketError: (error) => {
                if (!mountedRef.current) return;
                console.error('❌ WebSocket Error:', error);
                setConnectionError('WebSocket connection failed');
                setIsConnected(false);
            },

            onWebSocketClose: (event) => {
                if (!mountedRef.current) return;
                console.log(`🔌 WebSocket Closed: ${event.code} ${event.reason || 'Normal closure'}`);
                setIsConnected(false);

                // Only set error for unexpected closures
                if (event.code !== 1000 && event.code !== 1001) {
                    setConnectionError(`Connection closed unexpectedly (${event.code})`);
                }
            },

            // Disable automatic reconnection to prevent loops in development
            reconnectDelay: 0,
            heartbeatIncoming: 0,
            heartbeatOutgoing: 0,

            // Minimal debug logging
            debug: function (str) {
                // Only log important connection events
                if (str.includes('CONNECT') && !str.includes('heart-beat')) {
                    console.log('🔍 STOMP:', str);
                }
            }
        });

        clientRef.current = client;

        try {
            client.activate();
            console.log('🚀 WebSocket client activated');
        } catch (error) {
            console.error('❌ Failed to activate WebSocket client:', error);
            if (mountedRef.current) {
                setConnectionError(`Activation failed: ${error.message}`);
            }
        }

        // Cleanup function
        return () => {
            console.log('🔌 Cleaning up WebSocket connection...');
            mountedRef.current = false;

            if (clientRef.current) {
                try {
                    clientRef.current.deactivate();
                } catch (e) {
                    // Ignore cleanup errors
                }
                clientRef.current = null;
            }
        };
    }, [baseUrl, enabled]); // Remove onMessage from dependencies to prevent reconnections

    // Update mounted status
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const testConnection = async () => {
        try {
            const testUrl = `${baseUrl.replace('/api', '')}/api/websocket/test`;
            console.log('🧪 Testing WebSocket via:', testUrl);

            const response = await fetch(testUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('🧪 Test result:', result);
            return result;
        } catch (error) {
            console.error('❌ Test failed:', error);
            throw new Error(`Test failed: ${error.message}`);
        }
    };

    const resetConnection = () => {
        console.log('🔄 Manually resetting WebSocket connection...');
        setConnectionError(null);
        setIsConnected(false);

        if (clientRef.current) {
            try {
                clientRef.current.deactivate();
            } catch (e) {
                // Ignore cleanup errors
            }
            clientRef.current = null;
        }

        // Force a small delay then reconnect
        setTimeout(() => {
            if (mountedRef.current) {
                window.location.reload(); // Simple but effective reset
            }
        }, 100);
    };

    return {
        isConnected,
        connectionError,
        testConnection,
        resetConnection
    };
};

export default useWebSocket;