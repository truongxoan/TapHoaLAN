import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const ManagerPinModal = () => {
  const {
    pinModalOpen,
    setPinModalOpen,
    pinTargetAction,
    unlockManagerPin,
    showToast,
  } = useStore();

  const [pinInput, setPinInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!pinModalOpen) return null;

  const handleKeyPress = (num) => {
    if (pinInput.length < 6) {
      const next = pinInput + num;
      setPinInput(next);
      setErrorMsg('');
      if (next.length === 4) {
        verifyPin(next);
      }
    }
  };

  const handleDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPinInput('');
    setErrorMsg('');
  };

  const verifyPin = async (enteredPin) => {
    const success = await unlockManagerPin(enteredPin);
    if (success) {
      setPinInput('');
      setErrorMsg('');
      setPinModalOpen(false);
      if (pinTargetAction) {
        pinTargetAction();
      }
      showToast('Đã mở khóa quyền Chủ Tiệm!', 'success');
    } else {
      setErrorMsg('Mã PIN không đúng! Vui lòng thử lại.');
      setPinInput('');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    verifyPin(pinInput);
  };

  return (
    <div className="modal-overlay" onClick={() => setPinModalOpen(false)}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '360px', textAlign: 'center' }}
      >
        <div className="modal-header" style={{ justifyContent: 'center', position: 'relative' }}>
          <div className="modal-title" style={{ color: 'var(--primary)' }}>
            <Lock size={20} />
            <span>Mã PIN Bảo Mật Chủ Tiệm</span>
          </div>
          <button
            className="btn btn-secondary btn-icon"
            style={{ position: 'absolute', right: '12px', top: '12px' }}
            onClick={() => setPinModalOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem 1rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Khu vực bảo mật (Doanh thu, Giá vốn, Sổ nợ, Chốt ca). Vui lòng nhập mã PIN chủ tiệm:
          </p>

          {/* PIN Input Display */}
          <form onSubmit={handleFormSubmit}>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                style={{
                  fontSize: '1.75rem',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  fontWeight: 900,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--primary)',
                  padding: '0.5rem 2rem',
                }}
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                autoFocus
                placeholder="••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </form>

          {errorMsg && (
            <div style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              {errorMsg}
            </div>
          )}

          {/* Numeric Touch Keypad */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              maxWidth: '260px',
              margin: '0 auto 1rem',
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                type="button"
                className="btn btn-secondary btn-lg"
                style={{ fontSize: '1.25rem', fontWeight: 800, padding: '0.75rem 0', fontFamily: 'var(--font-mono)' }}
                onClick={() => handleKeyPress(n.toString())}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', fontWeight: 700 }}
              onClick={handleClear}
            >
              Xóa hết
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              style={{ fontSize: '1.25rem', fontWeight: 800, padding: '0.75rem 0', fontFamily: 'var(--font-mono)' }}
              onClick={() => handleKeyPress('0')}
            >
              0
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--danger)' }}
              onClick={handleDelete}
            >
              ← Xóa
            </button>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            onClick={() => verifyPin(pinInput)}
          >
            <Unlock size={16} />
            <span>Mở Khóa Bảo Mật</span>
          </button>
        </div>
      </div>
    </div>
  );
};
