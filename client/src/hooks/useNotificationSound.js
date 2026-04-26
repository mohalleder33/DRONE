import { useCallback } from 'react';
import useLocalStorage from './useLocalStorage';
const useNotificationSound = () => {
  const [soundEnabled] = useLocalStorage('notificationSound', true);
  const playSound = useCallback(() => { if(soundEnabled){ new Audio('/notification.mp3').play().catch(e=>console.log('no sound')); } }, [soundEnabled]);
  return { playSound, soundEnabled };
};
export default useNotificationSound;