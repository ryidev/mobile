import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onHide: () => void;
}

export function Toast({ message, type, visible, onHide }: ToastProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        hide();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 30, duration: 250, useNativeDriver: true }),
    ]).start(() => onHide());
  };

  if (!visible) return null;

  const bgColor =
    type === 'success' ? colors.success :
    type === 'error'   ? colors.error :
                         colors.accent;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: bgColor, opacity, transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity onPress={hide} activeOpacity={0.9} style={styles.inner}>
        <Text style={styles.icon}>
          {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
        </Text>
        <Text style={styles.message} numberOfLines={2}>{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

export function useToast() {
  const [state, setState] = useState<ToastState>({
    message: '',
    type: 'info',
    visible: false,
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setState({ message, type, visible: true });
  };

  const hideToast = () => {
    setState((prev) => ({ ...prev, visible: false }));
  };

  return { toast: state, showToast, hideToast };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    borderRadius: 16,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 12,
  },
  icon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  message: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    letterSpacing: 0.2,
  },
});
