import React, { useState, useEffect } from 'react';
import { Lock, Unlock, RotateCcw, Play, Pause, StepForward, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FeistelCipher = () => {
  const [plaintext, setPlaintext] = useState('Hello123');
  const [key, setKey] = useState('secretkey');
  const [rounds, setRounds] = useState(4);
  const [encryptionResult, setEncryptionResult] = useState(null);
  const [decryptionResult, setDecryptionResult] = useState(null);
  const [ciphertext, setCiphertext] = useState('');
  const [activeRound, setActiveRound] = useState(0);
  const [animationStep, setAnimationStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

  // F-function
  const fFunction = (right, roundKey) => {
    const keyBinary = stringToBinary(roundKey);
    let result = '';
    
    for (let i = 0; i < right.length; i++) {
      const keyBit = keyBinary[i % keyBinary.length];
      const mixedBit = (parseInt(right[i]) ^ parseInt(keyBit)) ^ (i % 2);
      result += mixedBit.toString();
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

  // Round key generation
  const generateRoundKey = (baseKey, round) => {
    const rotateAmount = round % baseKey.length;
    return baseKey.slice(rotateAmount) + baseKey.slice(0, rotateAmount) + round.toString();
  };

  // Validate inputs
  const validateInputs = () => {
    if (!plaintext || !key) {
      setErrorMessage('Please provide both plaintext and key');
      return false;
    }
    if (rounds < 1 || rounds > 16) {
      setErrorMessage('Rounds must be between 1 and 16');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  // Feistel encryption
  const feistelEncrypt = (plaintext, key, rounds) => {
    const steps = [];
    let validationErrors = [];
    
    const binary = stringToBinary(plaintext);
    steps.push({
      type: 'conversion',
      description: 'Convert to Binary',
      data: {
        plaintext: plaintext,
        binary: binary,
        formatted: binary.match(/.{8}/g)?.join(' ') || binary,
        isValid: true
      }
    });

    const paddedBinary = binary.length % 2 === 0 ? binary : binary + '0';
    if (binary.length !== paddedBinary.length) {
      validationErrors.push('Input was padded with 0 to make even length');
    }
    
    const halfLength = Math.floor(paddedBinary.length / 2);
    let left = paddedBinary.slice(0, halfLength);
    let right = paddedBinary.slice(halfLength);
    
    steps.push({
      type: 'split',
      description: 'Split into L₀ and R₀',
      data: {
        L0: left,
        R0: right,
        isValid: true
      }
    });

    for (let round = 1; round <= rounds; round++) {
      const roundKey = generateRoundKey(key, round);
      const fOutput = fFunction(right, roundKey);
      const newLeft = right;
      const newRight = xorBinary(left, fOutput);
      
      const roundValid = newRight.length === right.length && 
                        newLeft.length === left.length;
      
      if (!roundValid) {
        validationErrors.push(`Error in round ${round}`);
      }
      
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
          xorOperation: `${left} XOR ${fOutput} = ${newRight}`,
          isValid: roundValid
        }
      });
      
      left = newLeft;
      right = newRight;
    }

    const cipherBinary = left + right;
    const ciphertext = binaryToString(cipherBinary);
    
    const finalValid = cipherBinary.length === paddedBinary.length;
    if (!finalValid) {
      validationErrors.push('Final ciphertext length mismatch');
    }
    
    steps.push({
      type: 'final',
      description: 'Final Result',
      data: {
        finalLeft: left,
        finalRight: right,
        cipherBinary: cipherBinary,
        ciphertext: ciphertext,
        formattedBinary: cipherBinary.match(/.{8}/g)?.join(' ') || cipherBinary,
        isValid: finalValid,
        validationErrors: validationErrors.length > 0 ? validationErrors : null
      }
    });

    return { steps, ciphertext, cipherBinary };
  };

  // Feistel decryption
  const feistelDecrypt = (ciphertext, key, rounds) => {
    const steps = [];
    let validationErrors = [];
    
    const binary = stringToBinary(ciphertext);
    steps.push({
      type: 'conversion',
      description: 'Convert Ciphertext to Binary',
      data: {
        ciphertext: ciphertext,
        binary: binary,
        formatted: binary.match(/.{8}/g)?.join(' ') || binary,
        isValid: true
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
        R0: right,
        isValid: true
      }
    });

    for (let round = rounds; round >= 1; round--) {
      const roundKey = generateRoundKey(key, round);
      const fOutput = fFunction(left, roundKey);
      const newRight = left;
      const newLeft = xorBinary(right, fOutput);
      
      const roundValid = newLeft.length === left.length && 
                        newRight.length === right.length;
      
      if (!roundValid) {
        validationErrors.push(`Error in decryption round ${rounds - round + 1}`);
      }
      
      steps.push({
        type: 'round',
        round: rounds - round + 1,
        description: `Decryption Round ${rounds - round + 1}`,
        data: {
          roundKey: roundKey,
          fInput: left,
          fOutput: fOutput,
          prevLeft: left,
          prevRight: right,
          newLeft: newLeft,
          newRight: newRight,
          xorOperation: `${right} XOR ${fOutput} = ${newLeft}`,
          isValid: roundValid
        }
      });
      
      left = newLeft;
      right = newRight;
    }

    const decryptedBinary = left + right;
    const decryptedText = binaryToString(decryptedBinary);
    
    const finalValid = decryptedBinary.length === binary.length;
    if (!finalValid) {
      validationErrors.push('Final decrypted text length mismatch');
    }
    
    const matchesOriginal = decryptedText === plaintext;
    if (!matchesOriginal) {
      validationErrors.push('Decrypted text does not match original plaintext');
    }
    
    steps.push({
      type: 'final',
      description: 'Decryption Result',
      data: {
        finalLeft: left,
        finalRight: right,
        decryptedBinary: decryptedBinary,
        decryptedText: decryptedText,
        formattedBinary: decryptedBinary.match(/.{8}/g)?.join(' ') || decryptedBinary,
        isValid: finalValid && matchesOriginal,
        validationErrors: validationErrors.length > 0 ? validationErrors : null
      }
    });

    return { steps, decryptedText, decryptedBinary };
  };

  const handleEncrypt = () => {
    if (!validateInputs()) return;
    
    try {
      const encryptResult = feistelEncrypt(plaintext, key, rounds);
      setEncryptionResult(encryptResult);
      setCiphertext(encryptResult.ciphertext);
      setDecryptionResult(null);
      setActiveRound(0);
      setAnimationStep(0);
      setIsAnimating(true);
      
      setSuccessMessage(`Encryption successful! Ciphertext: ${encryptResult.ciphertext}`);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(`Encryption failed: ${error.message}`);
      setSuccessMessage('');
    }
  };

  useEffect(() => {
    if (isAnimating && encryptionResult) {
      const totalSteps = rounds + 2; // Initial + rounds + final
      let currentStep = 0;

      const animate = () => {
        if (!isAnimating || currentStep >= totalSteps) {
          setIsAnimating(false);
          return;
        }

        if (currentStep === 0) {
          // Initial step
          setActiveRound(0);
        } else if (currentStep <= rounds) {
          // Round steps
          setActiveRound(currentStep);
        } else {
          // Final step
          setActiveRound(rounds + 1);
        }

        currentStep++;
        setTimeout(animate, 2000);
      };

      animate();
    }
  }, [isAnimating, encryptionResult, rounds]);

  useEffect(() => {
    if (isAnimating && decryptionResult) {
      const totalSteps = rounds + 2; // Initial + rounds + final
      let currentStep = 0;

      const animate = () => {
        if (!isAnimating || currentStep >= totalSteps) {
          setIsAnimating(false);
          return;
        }

        if (currentStep === 0) {
          // Initial step
          setActiveRound(0);
        } else if (currentStep <= rounds) {
          // Round steps
          setActiveRound(currentStep);
        } else {
          // Final step
          setActiveRound(rounds + 1);
        }

        currentStep++;
        setTimeout(animate, 2000);
      };

      animate();
    }
  }, [isAnimating, decryptionResult, rounds]);

  const handleDecrypt = () => {
    if (!validateInputs()) return;
    if (!ciphertext) {
      setErrorMessage('Please encrypt a message first');
      return;
    }
    
    try {
      const decryptResult = feistelDecrypt(ciphertext, key, rounds);
      setDecryptionResult(decryptResult);
      setActiveRound(0);
      setAnimationStep(0);
      setIsAnimating(true);
      
      setSuccessMessage(`Decryption successful! Plaintext: ${decryptResult.decryptedText}`);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(`Decryption failed: ${error.message}`);
      setSuccessMessage('');
    }
  };

  const reset = () => {
    setEncryptionResult(null);
    setDecryptionResult(null);
    setCiphertext('');
    setActiveRound(0);
    setAnimationStep(0);
    setIsAnimating(false);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const renderRoundValidation = (step) => {
    if (!step.data.isValid) {
      return (
        <div className="validation-error">
          <X size={16} color="#c62828" />
          <span>Error in this step</span>
        </div>
      );
    }
    return (
      <div className="validation-success">
        <Check size={16} color="#2e7d32" />
        <span>Step completed successfully</span>
      </div>
    );
  };

  const renderEncryptionAnimation = () => {
    if (!encryptionResult) return null;
    
    const { steps } = encryptionResult;
    const splitStep = steps.find(step => step.type === 'split');
    const roundSteps = steps.filter(step => step.type === 'round');
    const finalStep = steps.find(step => step.type === 'final');
    
    return (
      <div className="animation-container">
        <div className="animation-header">
          <h3>Encryption Process</h3>
          <div className="step-indicator">
            {activeRound === 0 && "Initial Plaintext"}
            {activeRound > 0 && activeRound <= rounds && `Round ${activeRound}`}
            {activeRound > rounds && "Final Ciphertext"}
          </div>
        </div>

        <div className="feistel-diagram">
          {/* Initial Plaintext Block */}
          {activeRound === 0 && (
            <motion.div 
              className="plaintext-block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="block-label">Plaintext Block</div>
              <div className="block-content">{plaintext}</div>
            </motion.div>
          )}

          {/* Round Animations */}
          {activeRound > 0 && activeRound <= rounds && (
            <motion.div
              className="round-animation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="feistel-round-diagram">
                <div className="round-header">
                  <h4>Round {activeRound}</h4>
                </div>

                <div className="round-content">
                  <div className="left-block">
                    <div className="block-label">L<sub>{activeRound-1}</sub></div>
                    <div className="block-content">
                      {roundSteps[activeRound-1].data.prevLeft}
                    </div>
                  </div>

                  <div className="right-block">
                    <div className="block-label">R<sub>{activeRound-1}</sub></div>
                    <div className="block-content">
                      {roundSteps[activeRound-1].data.prevRight}
                    </div>
                  </div>

                  <div className="f-function-block">
                    <div className="f-function-label">F(K,R)</div>
                    <div className="f-function-content">
                      {roundSteps[activeRound-1].data.fOutput}
                    </div>
                    <div className="round-key">
                      K<sub>{activeRound}</sub>: {roundSteps[activeRound-1].data.roundKey}
                    </div>
                  </div>

                  <div className="xor-arrow">⊕</div>

                  <div className="next-left-block">
                    <div className="block-label">L<sub>{activeRound}</sub></div>
                    <div className="block-content">
                      {roundSteps[activeRound-1].data.newLeft}
                    </div>
                  </div>

                  <div className="next-right-block">
                    <div className="block-label">R<sub>{activeRound}</sub></div>
                    <div className="block-content">
                      {roundSteps[activeRound-1].data.newRight}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Final Ciphertext */}
          {activeRound > rounds && (
            <motion.div
              className="final-blocks"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="final-step">
                <div className="block-label">Ciphertext Block</div>
                <div className="block-content">{finalStep.data.ciphertext}</div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  const renderDecryptionAnimation = () => {
    if (!decryptionResult) return null;
    
    const { steps } = decryptionResult;
    const splitStep = steps.find(step => step.type === 'split');
    const roundSteps = steps.filter(step => step.type === 'round');
    const finalStep = steps.find(step => step.type === 'final');
    
    return (
      <div className="animation-container">
        <div className="animation-header">
          <h3>Decryption Process</h3>
          <div className="step-indicator">
            {activeRound === 0 && "Initial Ciphertext"}
            {activeRound > 0 && activeRound <= rounds && `Round ${activeRound}`}
            {activeRound > rounds && "Final Plaintext"}
          </div>
        </div>

        <div className="feistel-diagram decrypt">
          {/* Initial Ciphertext Block */}
          {activeRound === 0 && (
            <motion.div 
              className="plaintext-block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="block-label">Ciphertext Block</div>
              <div className="block-content">{ciphertext}</div>
            </motion.div>
          )}

          {/* Round Animations */}
          {activeRound > 0 && activeRound <= rounds && (
            <motion.div
              className="round-animation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="feistel-round-diagram">
                <div className="round-header">
                  <h4>Round {activeRound}</h4>
                </div>

                <div className="round-content">
                  <div className="left-block">
                    <div className="block-label">L<sub>{activeRound-1}</sub></div>
                    <div className="block-content">
                      {roundSteps[activeRound-1].data.prevLeft}
                    </div>
                  </div>

                  <div className="right-block">
                    <div className="block-label">R<sub>{activeRound-1}</sub></div>
                    <div className="block-content">
                      {roundSteps[activeRound-1].data.prevRight}
                    </div>
                  </div>

                  <div className="f-function-block">
                    <div className="f-function-label">F(K,L)</div>
                    <div className="f-function-content">
                      {roundSteps[activeRound-1].data.fOutput}
                    </div>
                    <div className="round-key">
                      K<sub>{rounds - activeRound + 1}</sub>: {roundSteps[activeRound-1].data.roundKey}
                    </div>
                  </div>

                  <div className="xor-arrow">⊕</div>

                  <div className="next-left-block">
                    <div className="block-label">L<sub>{activeRound}</sub></div>
                    <div className="block-content">
                      {roundSteps[activeRound-1].data.newLeft}
                    </div>
                  </div>

                  <div className="next-right-block">
                    <div className="block-label">R<sub>{activeRound}</sub></div>
                    <div className="block-content">
                      {roundSteps[activeRound-1].data.newRight}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Final Plaintext */}
          {activeRound > rounds && (
            <motion.div
              className="final-blocks"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="final-step">
                <div className="block-label">Plaintext Block</div>
                <div className="block-content">{finalStep.data.decryptedText}</div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="feistel-cipher-container">
      <h2>Feistel Cipher Demonstration</h2>
      
      <div className="input-section">
        <div className="input-group">
          <label htmlFor="plaintext">Plaintext:</label>
          <input
            type="text"
            id="plaintext"
            value={plaintext}
            onChange={(e) => setPlaintext(e.target.value)}
            placeholder="Enter plaintext"
          />
        </div>

        <div className="input-group">
          <label htmlFor="key">Key:</label>
          <input
            type="text"
            id="key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Enter encryption key"
          />
        </div>

        <div className="input-group">
          <label htmlFor="rounds">Rounds:</label>
          <input
            type="number"
            id="rounds"
            min="1"
            max="16"
            value={rounds}
            onChange={(e) => setRounds(parseInt(e.target.value))}
          />
        </div>

        <div className="button-group">
          <button className="btn encrypt-btn" onClick={handleEncrypt}>
            <Lock size={16} />
            Encrypt
          </button>
          <button 
            className="btn decrypt-btn" 
            onClick={handleDecrypt}
            disabled={!ciphertext}
          >
            <Unlock size={16} />
            Decrypt
          </button>
          <button className="btn reset-btn" onClick={reset}>
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="message success">
          <Check size={16} />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="message error">
          <X size={16} />
          {errorMessage}
        </div>
      )}

      <div className="results-section">
        {encryptionResult && !decryptionResult && renderEncryptionAnimation()}
        {decryptionResult && renderDecryptionAnimation()}
      </div>

      <style jsx>{`
        .feistel-cipher-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #333;
        }
        
        h2 {
          text-align: center;
          color: #2c3e50;
          margin-bottom: 30px;
          font-size: 28px;
        }
        
        .input-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        
        .input-group {
          margin-bottom: 15px;
        }
        
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #495057;
        }
        
        input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 16px;
        }
        
        input:focus {
          outline: none;
          border-color: #80bdff;
          box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
        }
        
        .button-group {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        
        .btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .encrypt-btn {
          background-color: #28a745;
          color: white;
        }
        
        .encrypt-btn:hover {
          background-color: #218838;
        }
        
        .decrypt-btn {
          background-color: #17a2b8;
          color: white;
        }
        
        .decrypt-btn:hover {
          background-color: #138496;
        }
        
        .decrypt-btn:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
        
        .reset-btn {
          background-color: #dc3545;
          color: white;
        }
        
        .reset-btn:hover {
          background-color: #c82333;
        }
        
        .message {
          padding: 10px 15px;
          border-radius: 4px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        
        .results-section {
          margin-top: 30px;
        }
        
        .animation-container {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .animation-header {
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
        
        .animation-header h3 {
          margin: 0;
          color: #2c3e50;
        }
        
        .step-indicator {
          margin-top: 10px;
          font-size: 14px;
          color: #6c757d;
          font-style: italic;
        }
        
        .feistel-diagram {
          position: relative;
          min-height: 300px;
        }
        
        .plaintext-block, .round-animation, .final-blocks {
          background: #f8f9fa;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 20px;
          border: 1px solid #dee2e6;
        }
        
        .block-label {
          font-weight: 500;
          margin-bottom: 5px;
          color: #495057;
        }
        
        .block-content {
          font-family: 'Courier New', Courier, monospace;
          background: white;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #dee2e6;
          word-break: break-all;
        }
        
        .feistel-round-diagram {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .round-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: auto auto auto;
          gap: 15px;
          position: relative;
        }

        .left-block, .right-block {
          padding: 10px;
          border-radius: 4px;
          border: 1px solid #dee2e6;
          background: #f8f9fa;
        }

        .left-block {
          grid-column: 1;
          grid-row: 1;
          border-left: 4px solid #3498db;
        }

        .right-block {
          grid-column: 2;
          grid-row: 1;
          border-left: 4px solid #e74c3c;
        }

        .f-function-block {
          grid-column: 2;
          grid-row: 2;
          padding: 10px;
          background: #e9ecef;
          border-radius: 4px;
          text-align: center;
          position: relative;
        }

        .f-function-label {
          font-weight: bold;
          margin-bottom: 5px;
        }

        .f-function-content {
          font-family: 'Courier New', Courier, monospace;
          background: white;
          padding: 5px;
          border-radius: 3px;
          margin-bottom: 5px;
        }

        .round-key {
          font-size: 0.9em;
          color: #6c757d;
        }

        .xor-arrow {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          font-size: 24px;
          background: white;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 1px solid #dee2e6;
          z-index: 2;
        }

        .next-left-block, .next-right-block {
          padding: 10px;
          border-radius: 4px;
          border: 1px solid #dee2e6;
          background: #e8f5e9;
        }

        .next-left-block {
          grid-column: 1;
          grid-row: 3;
        }

        .next-right-block {
          grid-column: 2;
          grid-row: 3;
        }

        .validation-success, .validation-error {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 14px;
          margin-top: 10px;
        }
        
        .validation-success {
          color: #2e7d32;
        }
        
        .validation-error {
          color: #c62828;
        }
        
        .final-step {
          background: #e8f5e9;
          border-color: #c8e6c9;
        }
        
        .feistel-diagram.decrypt .final-step {
          background: #e3f2fd;
          border-color: #bbdefb;
        }
      `}</style>
    </div>
  );
};

export default FeistelCipher;
