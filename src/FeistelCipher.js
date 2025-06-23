import React, { useState } from 'react';
import './index.css';

const FeistelCipher = () => {
  const [plaintext, setPlaintext] = useState('HELLO');
  const [key, setKey] = useState('1010');
  const [rounds, setRounds] = useState(4);
  const [ciphertext, setCiphertext] = useState('');
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showSteps, setShowSteps] = useState(false);
  const [mode, setMode] = useState('encrypt');

  // Mixes two strings using XOR operation
  const mixStrings = (a, b) => {
    let result = '';
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      result += String.fromCharCode(a.charCodeAt(i) ^ b.charCodeAt(i));
    }
    return result;
  };

  const encrypt = () => {
    let text = plaintext;
    if (text.length % 2 !== 0) text += ' '; // Add space if odd length

    const encryptionSteps = [];
    let left = text.substring(0, text.length / 2);
    let right = text.substring(text.length / 2);

    // Step 0: Initial split
    encryptionSteps.push({
      step: 0,
      left,
      right,
      description: `We start by splitting "${text}" into two equal parts`,
      operation: 'Initial Split',
      roundKey: '',
      mixResult: ''
    });

    for (let i = 0; i < rounds; i++) {
      const roundKey = key;
      const mixResult = mixStrings(right, roundKey);
      const newLeft = right;
      const newRight = mixStrings(left, mixResult);

      encryptionSteps.push({
        step: i + 1,
        left: newLeft,
        right: newRight,
        description: `Round ${i + 1}: We mix the Right part with the Key, then combine with Left`,
        operation: `Round ${i + 1}`,
        roundKey,
        mixResult,
        action: `Mixed Right with Key → Combined with Left → Swapped sides`
      });

      left = newLeft;
      right = newRight;
    }

    // Final swap
    const finalCiphertext = right + left;
    encryptionSteps.push({
      step: rounds + 1,
      left: right,
      right: left,
      description: `After all rounds, we swap the two parts one final time`,
      operation: 'Final Swap',
      ciphertext: finalCiphertext,
      action: `Swapped Left and Right to get final ciphertext`
    });

    setCiphertext(finalCiphertext);
    setSteps(encryptionSteps);
    setShowSteps(true);
    setCurrentStep(0);
  };

  const decrypt = () => {
    let text = ciphertext;
    if (text.length % 2 !== 0) text += ' ';

    const decryptionSteps = [];
    let right = text.substring(0, text.length / 2);
    let left = text.substring(text.length / 2);

    // Step 0: Initial split
    decryptionSteps.push({
      step: 0,
      left,
      right,
      description: `We start by splitting the ciphertext into two parts`,
      operation: 'Initial Split',
      roundKey: '',
      mixResult: ''
    });

    for (let i = 0; i < rounds; i++) {
      const roundKey = key;
      const mixResult = mixStrings(left, roundKey);
      const newRight = left;
      const newLeft = mixStrings(right, mixResult);

      decryptionSteps.push({
        step: i + 1,
        left: newLeft,
        right: newRight,
        description: `Round ${i + 1}: We mix the Left part with the Key, then combine with Right`,
        operation: `Round ${i + 1}`,
        roundKey,
        mixResult,
        action: `Mixed Left with Key → Combined with Right → Swapped sides`
      });

      right = newRight;
      left = newLeft;
    }

    // Final swap
    const finalPlaintext = left + right;
    decryptionSteps.push({
      step: rounds + 1,
      left,
      right,
      description: `After all rounds, we combine the parts to get the original message`,
      operation: 'Final Combine',
      ciphertext: finalPlaintext,
      action: `Combined Left and Right to get original message`
    });

    setPlaintext(finalPlaintext);
    setSteps(decryptionSteps);
    setShowSteps(true);
    setCurrentStep(0);
  };

  const handleProcess = () => {
    if (mode === 'encrypt') {
      encrypt();
    } else {
      decrypt();
    }
  };

  return (
    <div className="feistel-container">
      <div className="feistel-header">
        <h1>Feistel Cipher Interactive Demo</h1>
        <p>See step-by-step how messages are encrypted and decrypted</p>
      </div>

      <div className="feistel-controls">
        <div className="form-group">
          <label>{mode === 'encrypt' ? 'Message to Encrypt' : 'Ciphertext to Decrypt'}</label>
          <input
            value={mode === 'encrypt' ? plaintext : ciphertext}
            onChange={(e) => mode === 'encrypt' ? setPlaintext(e.target.value) : setCiphertext(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Secret Key</label>
          <input value={key} onChange={(e) => setKey(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Number of Rounds: {rounds}</label>
          <input
            type="range"
            min="1"
            max="8"
            value={rounds}
            onChange={(e) => setRounds(+e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Action</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="encrypt">Encrypt Message</option>
            <option value="decrypt">Decrypt Message</option>
          </select>
        </div>

        <button className="process-button" onClick={handleProcess}>
          {mode === 'encrypt' ? 'Encrypt Now' : 'Decrypt Now'}
        </button>
      </div>

      {showSteps && (
        <div className="feistel-steps">
          <h2>
            Step {currentStep + 1}: {steps[currentStep].operation}
          </h2>
          
          <div className="step-description">
            <p>{steps[currentStep].description}</p>
            {steps[currentStep].action && <p className="action">{steps[currentStep].action}</p>}
          </div>

          <div className="block-display">
            <div className="block left">
              <div className="block-label">Left Part</div>
              <div className="block-value">"{steps[currentStep].left}"</div>
            </div>
            <div className="block right">
              <div className="block-label">Right Part</div>
              <div className="block-value">"{steps[currentStep].right}"</div>
            </div>
          </div>

          {steps[currentStep].roundKey && (
            <div className="step-detail">
              <strong>Key Used:</strong> "{steps[currentStep].roundKey}"
            </div>
          )}

          {steps[currentStep].mixResult && (
            <div className="step-detail">
              <strong>Mixed Result:</strong> "{steps[currentStep].mixResult}"
            </div>
          )}

          {steps[currentStep].ciphertext && (
            <div className="final-result">
              <strong>Final {mode === 'encrypt' ? 'Encrypted Message' : 'Decrypted Message'}:</strong>
              <div className="result-value">"{steps[currentStep].ciphertext}"</div>
            </div>
          )}

          <div className="step-navigation">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
            >
              ◀ Previous Step
            </button>
            <button
              onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
              disabled={currentStep === steps.length - 1}
            >
              Next Step ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeistelCipher;
