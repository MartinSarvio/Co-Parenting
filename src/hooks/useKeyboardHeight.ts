import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

/**
 * Returns the current on-screen keyboard height in pixels.
 * Uses Capacitor Keyboard plugin on native, visualViewport on web.
 */
export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const showListener = Keyboard.addListener('keyboardWillShow', (info) => {
        setKeyboardHeight(info.keyboardHeight);
      });
      const hideListener = Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardHeight(0);
      });

      return () => {
        showListener.then((h) => h.remove());
        hideListener.then((h) => h.remove());
      };
    }

    // Web fallback: use visualViewport
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      const diff = window.innerHeight - vv.height;
      setKeyboardHeight(diff > 50 ? diff : 0);
    };
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  return keyboardHeight;
}
