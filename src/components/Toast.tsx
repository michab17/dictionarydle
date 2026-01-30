import '../css/Toast.css';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

function Toast({ message, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="toast">
      <span className="toast-icon">✅</span>
      <span className="toast-message">{message}</span>
    </div>
  );
}

export default Toast;
