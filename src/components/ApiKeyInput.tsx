import React, { useState, useEffect } from 'react';
import { getMapTilerKey, setMapTilerKey } from '../config';

const ApiKeyInput: React.FC = () => {
  const [key, setKey] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const currentKey = getMapTilerKey();
    if (!currentKey) {
      setIsOpen(true);
    }
  }, []);

  const handleSave = () => {
    if (key.trim()) {
      setMapTilerKey(key.trim());
      setIsOpen(false);
      window.location.reload(); // Reload to apply key
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '400px' }}>
        <h2>Enter MapTiler API Key</h2>
        <p>Please provide your MapTiler API key to continue.</p>
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="API Key"
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
        />
        <button onClick={handleSave} style={{ padding: '0.5rem 1rem' }}>Save & Reload</button>
      </div>
    </div>
  );
};

export default ApiKeyInput;
