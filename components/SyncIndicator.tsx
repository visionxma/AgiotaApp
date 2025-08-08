import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react-native';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '@/contexts/AuthContext';

export function SyncIndicator() {
  const { syncData } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Listener para mudanças de conectividade
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected === true && state.isInternetReachable === true;
      setIsOnline(online);
    });

    return unsubscribe;
  }, []);

  const handleSync = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      await syncData();
    } catch (error) {
      console.error('Erro na sincronização:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, !isOnline && styles.offlineContainer]} 
      onPress={handleSync}
      disabled={!isOnline || isSyncing}
    >
      <View style={styles.content}>
        {isSyncing ? (
          <RefreshCw size={16} color={isOnline ? "#059669" : "#dc2626"} />
        ) : isOnline ? (
          <Wifi size={16} color="#059669" />
        ) : (
          <WifiOff size={16} color="#dc2626" />
        )}
        <Text style={[styles.text, !isOnline && styles.offlineText]}>
          {isSyncing ? 'Sincronizando...' : isOnline ? 'Online' : 'Offline'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  offlineContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  offlineText: {
    color: '#dc2626',
  },
});