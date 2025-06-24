import React, { useState } from 'react';
import { Lock, Unlock, RotateCcw } from 'lucide-react';

const FeistelCipher = () => {
  const [plaintext, setPlaintext] = useState('Hello123');
  const [key, setKey] = useState('secretkey');
  const [rounds, setRounds] = useState(4);
  const [encryptionResult, setEncryptionResult] = useState(null);
  const [decryptionResult, setDecryptionResult] = useState(null);
  const [ciphertext, setCiphertext] = useState('');

  // Convert string to binary
  const stringToBinary = (str) => {
    return str.split('').map(char => 
      char.charCodeAt(0).toString(2).padStart(8, '0')
    ).join('');
  };

  // Convert binary to string
  const binaryToString = (binary) => {
    const chars = [];
    for (let i = 0; i < binary.length; i += 8) {
      const byte = binary.substr(i, 8);
      chars.push(String.fromCharCode(parseInt(byte, 2)));
    }
    return chars.join('');
  };

  // Simple F-function (XOR with key)
  const fFunction = (right, roundKey) => {
    const keyBinary = stringToBinary(roundKey);
    let result = '';
    
    // XOR with key (repeat key if needed)
    for (let i = 0; i < right.length; i++) {
      const keyBit = keyBinary[i % keyBinary.length];
      result += (parseInt(right[i]) ^ parseInt(keyBit)).toString();
    }
    
    return result;
  };

  // XOR two binary strings
  const xorBinary = (a, b) => {
    let result = '';
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      result += (parseInt(a[i]) ^ parseInt(b[i])).toString();
    }
    return result;
  };

  // Generate round key
  const generateRoundKey = (baseKey, round) => {
    return baseKey + round.toString();
  };

  // Feistel encryption
  const feistelEncrypt = (plaintext, key, rounds) => {
    const steps = [];
    
    // Step 1: Convert to binary
    const binary = stringToBinary(plaintext);
    steps.push({
      type: 'conversion',
      description: 'Convert to Binary',
      data: {
        plaintext: plaintext,
        binary: binary,
        formatted: binary.match(/.{8}/g).join(' ')
      }
    });

    // Pad to even length if needed
    const paddedBinary = binary.length % 2 === 0 ? binary : binary + '0';
    
    // Step 2: Split into L₀ and R₀
    const halfLength = Math.floor(paddedBinary.length / 2);
    let left = paddedBinary.slice(0, halfLength);
    let right = paddedBinary.slice(halfLength);
    
    steps.push({
      type: 'split',
      description: 'Split into L₀ and R₀',
      data: {
        L0: left,
        R0: right
      }
    });

    // Feistel rounds
    for (let round = 1; round <= rounds; round++) {
      const roundKey = generateRoundKey(key, round);
      const fOutput = fFunction(right, roundKey);
      const newLeft = right;
      const newRight = xorBinary(left, fOutput);
      
      steps.push({
        type: 'round',
        round: round,
        description: `Round ${round}`,
        data: {
          roundKey: roundKey,
          fInput: right,
          fOutput: fOutput,
          prevLeft: left,
          prevRight: right,
          newLeft: newLeft,
          newRight: newRight,
          xorOperation: `${left} XOR ${fOutput} = ${newRight}`
        }
      });
      
      left = newLeft;
      right = newRight;
    }

    const cipherBinary = left + right;
    const ciphertext = binaryToString(cipherBinary);
    
    steps.push({
      type: 'final',
      description: 'Final Result',
      data: {
        finalLeft: left,
        finalRight: right,
        cipherBinary: cipherBinary,
        ciphertext: ciphertext,
        formattedBinary: cipherBinary.match(/.{8}/g).join(' ')
      }
    });

    return { steps, ciphertext, cipherBinary };
  };

  // Feistel decryption
  const feistelDecrypt = (ciphertext, key, rounds) => {
    const steps = [];
    
    const binary = stringToBinary(ciphertext);
    steps.push({
      type: 'conversion',
      description: 'Convert Ciphertext to Binary',
      data: {
        ciphertext: ciphertext,
        binary: binary,
        formatted: binary.match(/.{8}/g).join(' ')
      }
    });

    const halfLength = Math.floor(binary.length / 2);
    let left = binary.slice(0, halfLength);
    let right = binary.slice(halfLength);
    
    steps.push({
      type: 'split',
      description: 'Split Ciphertext',
      data: {
        L0: left,
        R0: right
      }
    });

    // Reverse the round keys for decryption
    for (let round = rounds; round >= 1; round--) {
      const roundKey = generateRoundKey(key, round);
      const fOutput = fFunction(left, roundKey);
      const newRight = left;
      const newLeft = xorBinary(right, fOutput);
      
      steps.push({
        type: 'round',
        round: rounds - round + 1,
        description: `Decryption Round ${rounds - round + 1} (using K${round})`,
        data: {
          roundKey: roundKey,
          fInput: left,
          fOutput: fOutput,
          prevLeft: left,
          prevRight: right,
          newLeft: newLeft,
          newRight: newRight,
          xorOperation: `${right} XOR ${fOutput} = ${newLeft}`
        }
      });
      
      left = newLeft;
      right = newRight;
    }

    const decryptedBinary = left + right;
    const decryptedText = binaryToString(decryptedBinary);
    
    steps.push({
      type: 'final',
      description: 'Decryption Result',
      data: {
        finalLeft: left,
        finalRight: right,
        decryptedBinary: decryptedBinary,
        decryptedText: decryptedText,
        formattedBinary: decryptedBinary.match(/.{8}/g).join(' ')
      }
    });

    return { steps, decryptedText, decryptedBinary };
  };

  const handleEncrypt = () => {
    if (!plaintext || !key) return;
    
    const encryptResult = feistelEncrypt(plaintext, key, rounds);
    setEncryptionResult(encryptResult);
    setCiphertext(encryptResult.ciphertext);
    setDecryptionResult(null);
  };

  const handleDecrypt = () => {
    if (!ciphertext || !key) return;
    
    const decryptResult = feistelDecrypt(ciphertext, key, rounds);
    setDecryptionResult(decryptResult);
  };

  const reset = () => {
    setEncryptionResult(null);
    setDecryptionResult(null);
    setCiphertext('');
  };

  return (
    <div className="feistel-app">
      <div className="cipher-container">
        {/* Header Card */}
        <div className="header-card">
          <h1>Feistel Cipher Implementation</h1>
        </div>

        {/* Input Card */}
        <div className="input-card">
          <div className="input-group">
            <label>Plaintext</label>
            <input
              type="text"
              value={plaintext}
              onChange={(e) => setPlaintext(e.target.value)}
              placeholder="Enter plaintext"
            />
          </div>

          <div className="input-group">
            <label>Secret Key</label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter key"
            />
          </div>

          <div className="input-group">
            <label>Rounds</label>
            <div className="rounds-input">
              <input
                type="number"
                value={rounds}
                onChange={(e) => setRounds(parseInt(e.target.value) || 4)}
                min="1"
                max="16"
              />
              <span>1-16 rounds (recommended: 4-8)</span>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn encrypt-btn" onClick={handleEncrypt}>
              <Lock size={16} />
              Encrypt Message
            </button>
            <button 
              className={`btn decrypt-btn ${!ciphertext ? 'disabled' : ''}`}
              onClick={handleDecrypt}
              disabled={!ciphertext}
            >
              <Unlock size={16} />
              Decrypt Message
            </button>
            <button 
              className="btn reset-btn"
              onClick={reset}
            >
              <RotateCcw size={16} />
              Reset All
            </button>
          </div>

          {encryptionResult && (
            <div className="ciphertext-display">
              <label>Generated Ciphertext:</label>
              <input
                type="text"
                value={ciphertext}
                onChange={(e) => setCiphertext(e.target.value)}
                readOnly
              />
            </div>
          )}
        </div>

        {/* Encryption Results */}
        {encryptionResult && !decryptionResult && (
          <div className="result-card">
            <div className="result-header">
              <h2>Encryption Process Step-by-Step</h2>
            </div>
            <div className="result-content">
              <div className="parameters">
                <h3>Encryption Parameters</h3>
                <div className="param-grid">
                  <div className="param-item">
                    <span className="param-label">Plaintext:</span> 
                    <span className="param-value">"{plaintext}" ({plaintext.length} bytes/{plaintext.length * 8} bits)</span>
                  </div>
                  <div className="param-item">
                    <span className="param-label">Key:</span> 
                    <span className="param-value">"{key}"</span>
                  </div>
                  <div className="param-item">
                    <span className="param-label">Rounds:</span> 
                    <span className="param-value">{rounds}</span>
                  </div>
                  <div className="param-item">
                    <span className="param-label">Block size:</span> 
                    <span className="param-value">{plaintext.length * 8} bits</span>
                  </div>
                </div>
              </div>

              {encryptionResult.steps.map((step, index) => (
                <div key={index} className="step">
                  {step.type === 'conversion' && (
                    <div className="step-content">
                      <h4>Step 1: {step.description}</h4>
                      <div className="binary-output">
                        <div>Plaintext "{step.data.plaintext}" → Binary:</div>
                        <code>{step.data.formatted}</code>
                      </div>
                    </div>
                  )}
                  
                  {step.type === 'split' && (
                    <div className="step-content">
                      <h4>Step 2: {step.description}</h4>
                      <div className="split-output">
                        <div>
                          <span>L₀:</span> 
                          <code>{step.data.L0}</code>
                        </div>
                        <div>
                          <span>R₀:</span> 
                          <code>{step.data.R0}</code>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {step.type === 'round' && (
                    <div className="step-content">
                      <h4>{step.description}</h4>
                      <div className="round-details">
                        <div>
                          <span>1. F(R₀, K{step.round}):</span>
                          <div className="indent">
                            <div>K{step.round} = "{step.data.roundKey}" (key + round number)</div>
                            <div>
                              F output: <code className="highlight">{step.data.fOutput}</code>
                            </div>
                          </div>
                        </div>
                        <div>
                          <span>2. L{step.round} = R₀ =</span>
                          <code>{step.data.newLeft}</code>
                        </div>
                        <div>
                          <span>3. R{step.round} = L₀ XOR F(R₀,K{step.round}) =</span>
                          <code>{step.data.newRight}</code>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {step.type === 'final' && (
                    <div className="step-content">
                      <h4>Final Ciphertext</h4>
                      <div className="final-output">
                        <div className="binary-output">
                          <div>Binary:</div>
                          <code>{step.data.formattedBinary}</code>
                        </div>
                        <div className="text-output">
                          <div>Ciphertext:</div>
                          <strong>"{step.data.ciphertext}"</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Decryption Results */}
        {decryptionResult && (
          <div className="result-card">
            <div className="result-header decrypt">
              <h2>Decryption Process Step-by-Step</h2>
            </div>
            <div className="result-content">
              <div className="note">
                <strong>Note:</strong> Decryption uses the same algorithm but with reversed round keys
              </div>

              {decryptionResult.steps.map((step, index) => (
                <div key={index} className="step">
                  {step.type === 'conversion' && (
                    <div className="step-content">
                      <h4>Step 1: {step.description}</h4>
                      <div className="binary-output">
                        <div>Ciphertext "{step.data.ciphertext}" → Binary:</div>
                        <code>{step.data.formatted}</code>
                      </div>
                    </div>
                  )}
                  
                  {step.type === 'split' && (
                    <div className="step-content">
                      <h4>Step 2: {step.description}</h4>
                      <div className="split-output">
                        <div>
                          <span>L₀:</span> 
                          <code>{step.data.L0}</code>
                        </div>
                        <div>
                          <span>R₀:</span> 
                          <code>{step.data.R0}</code>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {step.type === 'round' && (
                    <div className="step-content">
                      <h4>{step.description}</h4>
                      <div className="round-details">
                        <div>
                          <span>1. F(L₀, K{step.round}):</span>
                          <div className="indent">
                            <div>K{step.round} = "{step.data.roundKey}"</div>
                            <div>
                              F output: <code className="highlight">{step.data.fOutput}</code>
                            </div>
                          </div>
                        </div>
                        <div>
                          <span>2. R{step.round} = L₀ =</span>
                          <code>{step.data.newRight}</code>
                        </div>
                        <div>
                          <span>3. L{step.round} = R₀ XOR F(L₀,K{step.round}) =</span>
                          <code>{step.data.newLeft}</code>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {step.type === 'final' && (
                    <div className="step-content">
                      <h4>Decryption Result</h4>
                      <div className="final-output">
                        <div className="binary-output">
                          <div>Binary:</div>
                          <code>{step.data.formattedBinary}</code>
                        </div>
                        <div className="text-output">
                          <div>Decrypted Text:</div>
                          <strong>"{step.data.decryptedText}"</strong>
                        </div>
                        <div className={`verification ${
                          step.data.decryptedText === plaintext ? 'success' : 'error'
                        }`}>
                          {step.data.decryptedText === plaintext ? '✅' : '❌'}
                          <span>
                            {step.data.decryptedText === plaintext 
                              ? 'Success! Decrypted text matches original plaintext.' 
                              : 'Error: Decrypted text does not match original plaintext.'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .feistel-app {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f5f5f5;
          min-height: 100vh;
          padding: 20px;
          display: flex;
          justify-content: center;
        }

        .cipher-container {
          width: 100%;
          max-width: 500px;
        }

        .header-card {
          background-color: #fff;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .header-card h1 {
          font-size: 1.5rem;
          color: #333;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .header-card p {
          color: #666;
          font-size: 0.9rem;
        }

        .input-card {
          background-color: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          margin-bottom: 20px;
        }

        .input-group {
          margin-bottom: 20px;
        }

        .input-group label {
          display: block;
          font-weight: 500;
          color: #444;
          margin-bottom: 8px;
          font-size: 0.9rem;
        }

        .input-group input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.95rem;
        }

        .input-group input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0,123,255,0.1);
        }

        .rounds-input {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .rounds-input input {
          width: 60px;
        }

        .rounds-input span {
          font-size: 0.8rem;
          color: #777;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
          margin-top: 25px;
        }

        .btn {
          flex: 1;
          padding: 12px;
          border-radius: 6px;
          border: none;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
        }

        .encrypt-btn {
          background-color: #007bff;
          color: white;
        }

        .encrypt-btn:hover {
          background-color: #0069d9;
        }

        .decrypt-btn {
          background-color: #28a745;
          color: white;
        }

        .decrypt-btn:hover:not(.disabled) {
          background-color: #218838;
        }

        .decrypt-btn.disabled {
          background-color: #e9ecef;
          color: #adb5bd;
          cursor: not-allowed;
        }

        .reset-btn {
          background-color: #6c757d;
          color: white;
        }

        .reset-btn:hover {
          background-color: #5a6268;
        }

        .ciphertext-display {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }

        .ciphertext-display label {
          display: block;
          font-weight: 500;
          color: #444;
          margin-bottom: 8px;
          font-size: 0.9rem;
        }

        .ciphertext-display input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-family: monospace;
          font-size: 0.9rem;
          background-color: #f8f9fa;
        }

        /* Results styling */
        .result-card {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          margin-bottom: 20px;
          overflow: hidden;
        }

        .result-header {
          background-color: #007bff;
          padding: 15px 20px;
          color: white;
        }

        .result-header.decrypt {
          background-color: #28a745;
        }

        .result-header h2 {
          font-size: 1.2rem;
          font-weight: 600;
        }

        .result-content {
          padding: 20px;
        }

        .parameters {
          background-color: #f8f9fa;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .parameters h3 {
          font-size: 1.1rem;
          margin-bottom: 10px;
          color: #333;
        }

        .param-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
        }

        .param-item {
          background-color: white;
          padding: 10px;
          border-radius: 4px;
          border: 1px solid #eee;
        }

        .param-label {
          font-weight: 500;
          color: #555;
        }

        .param-value {
          color: #333;
        }

        .step {
          background-color: #f8f9fa;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 15px;
          border-left: 4px solid #007bff;
        }

        .step-content h4 {
          font-size: 1.1rem;
          color: #333;
          margin-bottom: 10px;
        }

        .binary-output, .split-output, .round-details, .final-output {
          background-color: white;
          border-radius: 4px;
          padding: 12px;
          border: 1px solid #eee;
          margin-top: 10px;
        }

        .binary-output div, .split-output div, .round-details div {
          margin-bottom: 8px;
        }

        .split-output div {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .round-details div {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          align-items: center;
        }

        .indent {
          margin-left: 20px;
          margin-top: 5px;
        }

        code {
          font-family: 'Courier New', Courier, monospace;
          background-color: #f1f1f1;
          padding: 2px 4px;
          border-radius: 3px;
          font-size: 0.9rem;
        }

        .highlight {
          background-color: #e7f5ff;
          color: #0056b3;
          font-weight: 500;
        }

        .text-output {
          margin-top: 15px;
        }

        .text-output strong {
          display: inline-block;
          margin-top: 5px;
          font-size: 1.1rem;
          color: #0056b3;
        }

        .verification {
          padding: 10px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 15px;
          font-size: 0.9rem;
        }

        .verification.success {
          background-color: #e6ffed;
          color: #28a745;
        }

        .verification.error {
          background-color: #ffecec;
          color: #dc3545;
        }

        .note {
          background-color: #e7f5ff;
          color: #0056b3;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-size: 0.9rem;
        }

        @media (max-width: 480px) {
          .action-buttons {
            flex-direction: column;
          }
          
          .param-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default FeistelCipher;
