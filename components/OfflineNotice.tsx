import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import NetInfo from '@react-native-community/netinfo';

export function OfflineNotice() {
  const [isOnline, setIsOnline] = useState(true);
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    // Listener para mudanças de conectividade
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected === true && state.isInternetReachable === true;
      setIsOnline(online);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isOnline) {
      // Mostra o aviso
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Esconde o aviso
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline]);

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.content}>
        <WifiOff size={16} color="#ffffff" />
        <Text style={styles.text}>
          Modo offline - Os dados serão sincronizados quando a conexão for restabelecida
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#dc2626',
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 1000,
    elevation: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
});