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
      const totalSteps = rounds * 4 + 2; // 4 steps per round + initial + final
      let currentStep = 0;

      const animate = () => {
        if (!isAnimating || currentStep >= totalSteps) {
          setIsAnimating(false);
          return;
        }

        if (currentStep === 0) {
          // Initial conversion step
          setAnimationStep(1);
          setActiveRound(0);
        } else if (currentStep === 1) {
          // Split step
          setAnimationStep(1);
          setActiveRound(0);
        } else {
          // Round steps
          const round = Math.ceil((currentStep - 1) / 4);
          const stepInRound = (currentStep - 1) % 4;
          
          if (round <= rounds) {
            setActiveRound(round);
            setAnimationStep(stepInRound + 1);
          } else {
            // Final step
            setActiveRound(rounds + 1);
            setAnimationStep(1);
          }
        }

        currentStep++;
        setTimeout(animate, 1500);
      };

      animate();
    }
  }, [isAnimating, encryptionResult, rounds]);

  useEffect(() => {
    if (isAnimating && decryptionResult) {
      const totalSteps = rounds * 4 + 2; // 4 steps per round + initial + final
      let currentStep = 0;

      const animate = () => {
        if (!isAnimating || currentStep >= totalSteps) {
          setIsAnimating(false);
          return;
        }

        if (currentStep === 0) {
          // Initial conversion step
          setAnimationStep(1);
          setActiveRound(0);
        } else if (currentStep === 1) {
          // Split step
          setAnimationStep(1);
          setActiveRound(0);
        } else {
          // Round steps
          const round = Math.ceil((currentStep - 1) / 4);
          const stepInRound = (currentStep - 1) % 4;
          
          if (round <= rounds) {
            setActiveRound(round);
            setAnimationStep(stepInRound + 1);
          } else {
            // Final step
            setActiveRound(rounds + 1);
            setAnimationStep(1);
          }
        }

        currentStep++;
        setTimeout(animate, 1500);
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
            {activeRound === 0 && animationStep === 1 && "Converting plaintext to binary"}
            {activeRound === 0 && animationStep === 2 && "Splitting into blocks"}
            {activeRound > 0 && activeRound <= rounds && animationStep === 1 && `Round ${activeRound}: Preparing`}
            {activeRound > 0 && activeRound <= rounds && animationStep === 2 && `Round ${activeRound}: F-function`}
            {activeRound > 0 && activeRound <= rounds && animationStep === 3 && `Round ${activeRound}: XOR`}
            {activeRound > 0 && activeRound <= rounds && animationStep === 4 && `Round ${activeRound}: Swap`}
            {activeRound > rounds && "Final ciphertext"}
          </div>
        </div>

        <div className="feistel-diagram">
          {/* Initial Plaintext Block */}
          {(activeRound === 0 && animationStep <= 2) && (
            <motion.div 
              className="plaintext-block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="block-label">Plaintext</div>
              <div className="block-content">{plaintext}</div>
              <motion.div 
                className="animation-arrow down"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                ↓
              </motion.div>
            </motion.div>
          )}

          {/* Split into L0 and R0 */}
          {(activeRound === 0 && animationStep >= 2) && (
            <motion.div
              className="split-blocks"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="blocks-row">
                <div className="block left-block">
                  <div className="block-label">L<sub>0</sub></div>
                  <div className="block-content">{splitStep.data.L0}</div>
                </div>
                <div className="block right-block">
                  <div className="block-label">R<sub>0</sub></div>
                  <div className="block-content">{splitStep.data.R0}</div>
                </div>
              </div>
              {renderRoundValidation(splitStep)}
            </motion.div>
          )}

          {/* Round Animations */}
          <AnimatePresence>
            {roundSteps.map((round, index) => (
              <React.Fragment key={`round-${index}`}>
                {(activeRound === index + 1) && (
                  <motion.div
                    className="round-animation"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="round-header">
                      <h4>Round {index + 1}</h4>
                    </div>

                    <div className="round-steps">
                      {/* F Function */}
                      {animationStep >= 2 && (
                        <motion.div
                          className="step-container"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <div className="step-content">
                            <motion.div
                              className="f-function"
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.5 }}
                            >
                              <div className="f-output">{round.data.fOutput}</div>
                            </motion.div>
                          </div>
                        </motion.div>
                      )}

                      {/* XOR Operation */}
                      {animationStep >= 3 && (
                        <motion.div
                          className="step-container"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <div className="step-content">
                            <div className="xor-result">
                              <div className="block-label">R<sub>{index + 1}</sub></div>
                              <div className="block-content">{round.data.newRight}</div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Block Swap */}
                      {animationStep >= 4 && (
                        <motion.div
                          className="step-container"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <div className="step-content">
                            <div className="blocks-row">
                              <div className="block left-block">
                                <div className="block-label">L<sub>{index + 1}</sub></div>
                                <div className="block-content">{round.data.newLeft}</div>
                              </div>
                              <div className="block right-block">
                                <div className="block-label">R<sub>{index + 1}</sub></div>
                                <div className="block-content">{round.data.newRight}</div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </AnimatePresence>

          {/* Final Ciphertext */}
          {activeRound > rounds && (
            <motion.div
              className="final-blocks"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="final-step">
                <div className="step-content">
                  <div className="ciphertext-output">
                    <strong>Ciphertext:</strong> {finalStep.data.ciphertext}
                  </div>
                </div>
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
            {activeRound === 0 && animationStep === 1 && "Converting ciphertext to binary"}
            {activeRound === 0 && animationStep === 2 && "Splitting into blocks"}
            {activeRound > 0 && activeRound <= rounds && animationStep === 1 && `Round ${activeRound}: Preparing`}
            {activeRound > 0 && activeRound <= rounds && animationStep === 2 && `Round ${activeRound}: F-function`}
            {activeRound > 0 && activeRound <= rounds && animationStep === 3 && `Round ${activeRound}: XOR`}
            {activeRound > 0 && activeRound <= rounds && animationStep === 4 && `Round ${activeRound}: Swap`}
            {activeRound > rounds && "Final plaintext"}
          </div>
        </div>

        <div className="feistel-diagram decrypt">
          {/* Initial Ciphertext Block */}
          {(activeRound === 0 && animationStep <= 2) && (
            <motion.div 
              className="plaintext-block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="block-label">Ciphertext</div>
              <div className="block-content">{ciphertext}</div>
              <motion.div 
                className="animation-arrow down"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                ↓
              </motion.div>
            </motion.div>
          )}

          {/* Split into L0 and R0 */}
          {(activeRound === 0 && animationStep >= 2) && (
            <motion.div
              className="split-blocks"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="blocks-row">
                <div className="block left-block">
                  <div className="block-label">L<sub>0</sub></div>
                  <div className="block-content">{splitStep.data.L0}</div>
                </div>
                <div className="block right-block">
                  <div className="block-label">R<sub>0</sub></div>
                  <div className="block-content">{splitStep.data.R0}</div>
                </div>
              </div>
              {renderRoundValidation(splitStep)}
            </motion.div>
          )}

          {/* Round Animations */}
          <AnimatePresence>
            {roundSteps.map((round, index) => (
              <React.Fragment key={`decrypt-round-${index}`}>
                {(activeRound === index + 1) && (
                  <motion.div
                    className="round-animation"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="round-header">
                      <h4>Round {index + 1}</h4>
                    </div>

                    <div className="round-steps">
                      {/* F Function */}
                      {animationStep >= 2 && (
                        <motion.div
                          className="step-container"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <div className="step-content">
                            <motion.div
                              className="f-function"
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.5 }}
                            >
                              <div className="f-output">{round.data.fOutput}</div>
                            </motion.div>
                          </div>
                        </motion.div>
                      )}

                      {/* XOR Operation */}
                      {animationStep >= 3 && (
                        <motion.div
                          className="step-container"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <div className="step-content">
                            <div className="xor-result">
                              <div className="block-label">L<sub>{index + 1}</sub></div>
                              <div className="block-content">{round.data.newLeft}</div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Block Swap */}
                      {animationStep >= 4 && (
                        <motion.div
                          className="step-container"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <div className="step-content">
                            <div className="blocks-row">
                              <div className="block left-block">
                                <div className="block-label">L<sub>{index + 1}</sub></div>
                                <div className="block-content">{round.data.newLeft}</div>
                              </div>
                              <div className="block right-block">
                                <div className="block-label">R<sub>{index + 1}</sub></div>
                                <div className="block-content">{round.data.newRight}</div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </AnimatePresence>

          {/* Final Plaintext */}
          {activeRound > rounds && (
            <motion.div
              className="final-blocks"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="final-step">
                <div className="step-content">
                  <div className="plaintext-output">
                    <strong>Decrypted Text:</strong> {finalStep.data.decryptedText}
                  </div>
                </div>
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
        
        .plaintext-block, .split-blocks, .round-animation, .final-blocks {
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
        
        .blocks-row {
          display: flex;
          gap: 15px;
          margin-bottom: 10px;
        }
        
        .left-block, .right-block {
          flex: 1;
        }
        
        .left-block {
          border-left: 4px solid #3498db;
        }
        
        .right-block {
          border-left: 4px solid #e74c3c;
        }
        
        .animation-arrow {
          text-align: center;
          font-size: 20px;
          color: #6c757d;
          margin: 10px 0;
        }
        
        .round-header {
          margin-bottom: 15px;
        }
        
        .round-header h4 {
          margin: 0;
          color: #2c3e50;
        }
        
        .round-steps {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .step-container {
          background: white;
          border-radius: 6px;
          padding: 10px;
          border: 1px solid #dee2e6;
        }
        
        .f-function {
          background: #e9ecef;
          padding: 10px;
          border-radius: 4px;
          text-align: center;
          font-family: 'Courier New', Courier, monospace;
        }
        
        .xor-result {
          padding: 10px;
          background: #e9ecef;
          border-radius: 4px;
          font-family: 'Courier New', Courier, monospace;
        }
        
        .ciphertext-output, .plaintext-output {
          font-family: 'Courier New', Courier, monospace;
          padding: 10px;
          background: #e9ecef;
          border-radius: 4px;
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
