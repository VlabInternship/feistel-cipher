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
  const [mode, setMode] = useState('encrypt'); // 'encrypt' or 'decrypt'

  const xorStrings = (a, b) => {
    let result = '';
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      result += String.fromCharCode(a.charCodeAt(i) ^ b.charCodeAt(i));
    }
    return result;
  };

  const roundFunction = (text, key) => xorStrings(text, key);

  const encrypt = () => {
    let text = plaintext;
    if (text.length % 2 !== 0) text += ' ';

    const encryptionSteps = [];
    let left = text.substring(0, text.length / 2);
    let right = text.substring(text.length / 2);

    encryptionSteps.push({
      step: 0,
      left,
      right,
      operation: 'Initial split',
      roundKey: '',
      fResult: ''
    });

    for (let i = 0; i < rounds; i++) {
      const roundKey = key;
      const fResult = roundFunction(right, roundKey);
      const newLeft = right;
      const newRight = xorStrings(left, fResult);

      encryptionSteps.push({
        step: i + 1,
        left: newLeft,
        right: newRight,
        operation: `Round ${i + 1}`,
        roundKey,
        fResult
      });

      left = newLeft;
      right = newRight;
    }

    const finalCiphertext = right + left;
    encryptionSteps.push({
      step: rounds + 1,
      left: right,
      right: left,
      operation: 'Final swap',
      roundKey: '',
      fResult: '',
      ciphertext: finalCiphertext
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
    let right = text.substring(0, text.length / 2); // reverse of final swap
    let left = text.substring(text.length / 2);

    decryptionSteps.push({
      step: 0,
      left,
      right,
      operation: 'Initial split (from ciphertext)',
      roundKey: '',
      fResult: ''
    });

    for (let i = 0; i < rounds; i++) {
      const roundKey = key;
      const fResult = roundFunction(left, roundKey);
      const newRight = left;
      const newLeft = xorStrings(right, fResult);

      decryptionSteps.push({
        step: i + 1,
        left: newLeft,
        right: newRight,
        operation: `Round ${i + 1}`,
        roundKey,
        fResult
      });

      right = newRight;
      left = newLeft;
    }

    const finalPlaintext = left + right;
    decryptionSteps.push({
      step: rounds + 1,
      left,
      right,
      operation: 'Final swap (to get plaintext)',
      roundKey: '',
      fResult: '',
      ciphertext: finalPlaintext
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
        <p>Visualize Feistel {mode === 'encrypt' ? 'encryption' : 'decryption'} step-by-step.</p>
      </div>

      <div className="feistel-controls">
        <div className="form-group">
          <label>Plaintext</label>
          <input
            value={plaintext}
            onChange={(e) => setPlaintext(e.target.value)}
            disabled={mode === 'decrypt'}
          />
        </div>

        <div className="form-group">
          <label>Ciphertext</label>
          <input
            value={ciphertext}
            onChange={(e) => setCiphertext(e.target.value)}
            disabled={mode === 'encrypt'}
          />
        </div>

        <div className="form-group">
          <label>Key</label>
          <input value={key} onChange={(e) => setKey(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Rounds: {rounds}</label>
          <input
            type="range"
            min="1"
            max="8"
            value={rounds}
            onChange={(e) => setRounds(+e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Mode</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="encrypt">Encrypt</option>
            <option value="decrypt">Decrypt</option>
          </select>
        </div>

        <div className="form-group">
          <button onClick={handleProcess}>
            {mode === 'encrypt' ? 'Encrypt Now' : 'Decrypt Now'}
          </button>
        </div>
      </div>

      {showSteps && (
        <div className="feistel-steps">
          <h2>
            Step {currentStep + 1}: {steps[currentStep].operation}
          </h2>

          <div className="block-display">
            <div className="block left">
              L{steps[currentStep].step}: {steps[currentStep].left}
            </div>
            <div className="block right">
              R{steps[currentStep].step}: {steps[currentStep].right}
            </div>
          </div>

          {steps[currentStep].roundKey && (
            <p>
              <strong>Round Key:</strong> {steps[currentStep].roundKey}
            </p>
          )}

          {steps[currentStep].fResult && (
            <p>
              <strong>F(R, K):</strong> {steps[currentStep].fResult}
            </p>
          )}

          {steps[currentStep].ciphertext && (
            <p>
              <strong>Final {mode === 'encrypt' ? 'Ciphertext' : 'Plaintext'}:</strong>{' '}
              {steps[currentStep].ciphertext}
            </p>
          )}

          <div className="step-navigation">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
              disabled={currentStep === steps.length - 1}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeistelCipher;
