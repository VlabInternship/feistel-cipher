import React, { useState, useEffect } from 'react';
import { Lock, Unlock, RotateCcw } from 'lucide-react';
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

  // Improved F-function with more complex operations
  const fFunction = (right, roundKey) => {
    const keyBinary = stringToBinary(roundKey);
    let result = '';
    
    // More complex mixing of bits
    for (let i = 0; i < right.length; i++) {
      const keyBit = keyBinary[i % keyBinary.length];
      // XOR with key bit and also mix with position
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

  // Improved round key generation with more variation
  const generateRoundKey = (baseKey, round) => {
    // Create more variation between rounds by rotating the key
    const rotateAmount = round % baseKey.length;
    return baseKey.slice(rotateAmount) + baseKey.slice(0, rotateAmount) + round.toString();
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
        formatted: binary.match(/.{8}/g)?.join(' ') || binary
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
        formattedBinary: cipherBinary.match(/.{8}/g)?.join(' ') || cipherBinary
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
        formatted: binary.match(/.{8}/g)?.join(' ') || binary
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
        formattedBinary: decryptedBinary.match(/.{8}/g)?.join(' ') || decryptedBinary
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
    setActiveRound(0);
    setAnimationStep(0);
    setIsAnimating(true);
    
    // Start animation sequence
    animateEncryptionProcess();
  };

  const animateEncryptionProcess = () => {
    const totalRounds = rounds;
    const stepsPerRound = 4; // Split, F-function, XOR, Swap
    
    let stepCounter = 0;
    
    const animate = () => {
      if (stepCounter >= totalRounds * stepsPerRound) {
        // Animation complete
        setIsAnimating(false);
        return;
      }
      
      const currentRound = Math.floor(stepCounter / stepsPerRound);
      const currentStep = stepCounter % stepsPerRound;
      
      setActiveRound(currentRound);
      setAnimationStep(currentStep + 1); // Steps start at 1
      
      stepCounter++;
      setTimeout(animate, 1500); // Delay between steps
    };
    
    animate();
  };

  const handleDecrypt = () => {
    if (!ciphertext || !key) return;
    
    const decryptResult = feistelDecrypt(ciphertext, key, rounds);
    setDecryptionResult(decryptResult);
    setActiveRound(0);
    setAnimationStep(0);
    setIsAnimating(true);
    
    // Start animation sequence
    animateDecryptionProcess();
  };

  const animateDecryptionProcess = () => {
    const totalRounds = rounds;
    const stepsPerRound = 4; // Split, F-function, XOR, Swap
    
    let stepCounter = 0;
    
    const animate = () => {
      if (stepCounter >= totalRounds * stepsPerRound) {
        // Animation complete
        setIsAnimating(false);
        return;
      }
      
      const currentRound = Math.floor(stepCounter / stepsPerRound);
      const currentStep = stepCounter % stepsPerRound;
      
      setActiveRound(currentRound);
      setAnimationStep(currentStep + 1); // Steps start at 1
      
      stepCounter++;
      setTimeout(animate, 1500); // Delay between steps
    };
    
    animate();
  };

  const reset = () => {
    setEncryptionResult(null);
    setDecryptionResult(null);
    setCiphertext('');
    setActiveRound(0);
    setAnimationStep(0);
    setIsAnimating(false);
  };

  const renderEncryptionAnimation = () => {
    if (!encryptionResult) return null;
    
    const { steps } = encryptionResult;
    const splitStep = steps.find(step => step.type === 'split');
    const roundSteps = steps.filter(step => step.type === 'round');
    
    return (
      <div className="animation-container">
        <div className="feistel-diagram">
          {/* Initial Plaintext Block */}
          <motion.div 
            className="plaintext-block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="block-label">Plaintext Block</div>
            <div className="block-content">{plaintext}</div>
            {animationStep >= 1 && (
              <motion.div 
                className="animation-arrow down"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                ↓
              </motion.div>
            )}
          </motion.div>

          {/* Split into L0 and R0 */}
          {animationStep >= 1 && (
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
              {animationStep >= 1 && activeRound === 0 && (
                <motion.div 
                  className="animation-arrow down"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  ↓
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Round Animations */}
          <AnimatePresence>
            {roundSteps.map((round, index) => (
              <React.Fragment key={`round-${index}`}>
                {/* Show round only when active */}
                {(activeRound >= index) && (
                  <motion.div
                    className="round-animation"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="round-header">
                      <h4>Round {index + 1}</h4>
                      <div className="round-key">K<sub>{index + 1}</sub>: {round.data.roundKey}</div>
                    </div>

                    <div className="round-steps">
                      {/* Show right block going to F function */}
                      {animationStep >= 2 && activeRound === index && (
                        <motion.div
                          className="f-function-input"
                          initial={{ x: 0 }}
                          animate={{ x: [0, 50, 0] }}
                          transition={{ duration: 1 }}
                        >
                          <div className="block right-block small">
                            <div className="block-label">R<sub>{index}</sub></div>
                            <div className="block-content">{round.data.fInput}</div>
                          </div>
                          <div className="animation-arrow right">→</div>
                        </motion.div>
                      )}

                      {/* F Function */}
                      {animationStep >= 2 && activeRound === index && (
                        <motion.div
                          className="f-function"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <div className="f-label">F(K<sub>{index + 1}</sub>, R<sub>{index}</sub>)</div>
                          <div className="f-output">{round.data.fOutput}</div>
                          {animationStep >= 2 && activeRound === index && (
                            <motion.div 
                              className="animation-arrow down"
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 }}
                            >
                              ↓
                            </motion.div>
                          )}
                        </motion.div>
                      )}

                      {/* XOR Operation */}
                      {animationStep >= 3 && activeRound === index && (
                        <motion.div
                          className="xor-operation"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <div className="block left-block small">
                            <div className="block-label">L<sub>{index}</sub></div>
                            <div className="block-content">{round.data.prevLeft}</div>
                          </div>
                          <div className="xor-symbol">⊕</div>
                          <div className="f-output small">{round.data.fOutput}</div>
                          <div className="animation-arrow right">→</div>
                          <div className="xor-result">
                            <div className="block-label">R<sub>{index + 1}</sub></div>
                            <div className="block-content">{round.data.newRight}</div>
                          </div>
                        </motion.div>
                      )}

                      {/* Block Swap */}
                      {animationStep >= 4 && activeRound === index && (
                        <motion.div
                          className="block-swap"
                          initial={{ y: 0 }}
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          <div className="blocks-row">
                            <div className="block left-block">
                              <div className="block-label">L<sub>{index + 1}</sub> = R<sub>{index}</sub></div>
                              <div className="block-content">{round.data.newLeft}</div>
                            </div>
                            <div className="block right-block">
                              <div className="block-label">R<sub>{index + 1}</sub></div>
                              <div className="block-content">{round.data.newRight}</div>
                            </div>
                          </div>
                          {(index < rounds - 1) && (
                            <motion.div 
                              className="animation-arrow down"
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 }}
                            >
                              ↓
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </AnimatePresence>

          {/* Final Ciphertext */}
          {activeRound >= rounds && (
            <motion.div
              className="final-blocks"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="blocks-row">
                <div className="block cipher-block">
                  <div className="block-label">L<sub>n</sub></div>
                  <div className="block-content">{encryptionResult.finalLeft}</div>
                </div>
                <div className="block cipher-block">
                  <div className="block-label">R<sub>n</sub></div>
                  <div className="block-content">{encryptionResult.finalRight}</div>
                </div>
              </div>
              <div className="animation-arrow down">↓</div>
              <div className="ciphertext-output">
                Ciphertext: {encryptionResult.ciphertext}
              </div>
            </motion.div>
          )}
        </div>

        {/* Animation Controls */}
        <div className="animation-controls">
          <button 
            className="btn control-btn"
            onClick={() => setIsAnimating(!isAnimating)}
            disabled={!encryptionResult}
          >
            {isAnimating ? 'Pause' : 'Play'} Animation
          </button>
          <button 
            className="btn control-btn"
            onClick={reset}
          >
            Reset
          </button>
        </div>
      </div>
    );
  };

  const renderDecryptionAnimation = () => {
    if (!decryptionResult) return null;
    
    const { steps } = decryptionResult;
    const splitStep = steps.find(step => step.type === 'split');
    const roundSteps = steps.filter(step => step.type === 'round');
    
    return (
      <div className="animation-container">
        <div className="feistel-diagram decrypt">
          {/* Initial Ciphertext Block */}
          <motion.div 
            className="plaintext-block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="block-label">Ciphertext Block</div>
            <div className="block-content">{ciphertext}</div>
            {animationStep >= 1 && (
              <motion.div 
                className="animation-arrow down"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                ↓
              </motion.div>
            )}
          </motion.div>

          {/* Split into L0 and R0 */}
          {animationStep >= 1 && (
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
              {animationStep >= 1 && activeRound === 0 && (
                <motion.div 
                  className="animation-arrow down"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  ↓
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Round Animations */}
          <AnimatePresence>
            {roundSteps.map((round, index) => (
              <React.Fragment key={`decrypt-round-${index}`}>
                {/* Show round only when active */}
                {(activeRound >= index) && (
                  <motion.div
                    className="round-animation"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="round-header">
                      <h4>Round {index + 1} (K<sub>{rounds - index}</sub>)</h4>
                      <div className="round-key">K<sub>{rounds - index}</sub>: {round.data.roundKey}</div>
                    </div>

                    <div className="round-steps">
                      {/* Show left block going to F function */}
                      {animationStep >= 2 && activeRound === index && (
                        <motion.div
                          className="f-function-input"
                          initial={{ x: 0 }}
                          animate={{ x: [0, 50, 0] }}
                          transition={{ duration: 1 }}
                        >
                          <div className="block left-block small">
                            <div className="block-label">L<sub>{index}</sub></div>
                            <div className="block-content">{round.data.fInput}</div>
                          </div>
                          <div className="animation-arrow right">→</div>
                        </motion.div>
                      )}

                      {/* F Function */}
                      {animationStep >= 2 && activeRound === index && (
                        <motion.div
                          className="f-function"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <div className="f-label">F(K<sub>{rounds - index}</sub>, L<sub>{index}</sub>)</div>
                          <div className="f-output">{round.data.fOutput}</div>
                          {animationStep >= 2 && activeRound === index && (
                            <motion.div 
                              className="animation-arrow down"
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 }}
                            >
                              ↓
                            </motion.div>
                          )}
                        </motion.div>
                      )}

                      {/* XOR Operation */}
                      {animationStep >= 3 && activeRound === index && (
                        <motion.div
                          className="xor-operation"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <div className="block right-block small">
                            <div className="block-label">R<sub>{index}</sub></div>
                            <div className="block-content">{round.data.prevRight}</div>
                          </div>
                          <div className="xor-symbol">⊕</div>
                          <div className="f-output small">{round.data.fOutput}</div>
                          <div className="animation-arrow right">→</div>
                          <div className="xor-result">
                            <div className="block-label">L<sub>{index + 1}</sub></div>
                            <div className="block-content">{round.data.newLeft}</div>
                          </div>
                        </motion.div>
                      )}

                      {/* Block Swap */}
                      {animationStep >= 4 && activeRound === index && (
                        <motion.div
                          className="block-swap"
                          initial={{ y: 0 }}
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          <div className="blocks-row">
                            <div className="block left-block">
                              <div className="block-label">L<sub>{index + 1}</sub></div>
                              <div className="block-content">{round.data.newLeft}</div>
                            </div>
                            <div className="block right-block">
                              <div className="block-label">R<sub>{index + 1}</sub> = L<sub>{index}</sub></div>
                              <div className="block-content">{round.data.newRight}</div>
                            </div>
                          </div>
                          {(index < rounds - 1) && (
                            <motion.div 
                              className="animation-arrow down"
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 }}
                            >
                              ↓
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </AnimatePresence>

          {/* Final Plaintext */}
          {activeRound >= rounds && (
            <motion.div
              className="final-blocks"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="blocks-row">
                <div className="block plaintext-block">
                  <div className="block-label">L<sub>n</sub></div>
                  <div className="block-content">{decryptionResult.finalLeft}</div>
                </div>
                <div className="block plaintext-block">
                  <div className="block-label">R<sub>n</sub></div>
                  <div className="block-content">{decryptionResult.finalRight}</div>
                </div>
              </div>
              <div className="animation-arrow down">↓</div>
              <div className="plaintext-output">
                Decrypted Text: {decryptionResult.decryptedText}
              </div>
              <div className={`verification ${
                decryptionResult.decryptedText === plaintext ? 'success' : 'error'
              }`}>
                {decryptionResult.decryptedText === plaintext ? '✅' : '❌'}
                <span>
                  {decryptionResult.decryptedText === plaintext 
                    ? 'Success! Decrypted text matches original plaintext.' 
                    : 'Error: Decrypted text does not match original plaintext.'
                  }
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Animation Controls */}
        <div className="animation-controls">
          <button 
            className="btn control-btn"
            onClick={() => setIsAnimating(!isAnimating)}
            disabled={!decryptionResult}
          >
            {isAnimating ? 'Pause' : 'Play'} Animation
          </button>
          <button 
            className="btn control-btn"
            onClick={reset}
          >
            Reset
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="feistel-app">
      <div className="cipher-container">
        {/* Header Card */}
        <div className="header-card">
          <h1>Feistel Cipher Implementation</h1>
          <p>Educational cryptography tool with step-by-step visualization</p>
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

              {/* Render the animation */}
              {renderEncryptionAnimation()}

              {/* Detailed Steps */}
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

              {/* Render the decryption animation */}
              {renderDecryptionAnimation()}

              {/* Detailed Steps */}
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
          max-width: 800px;
        }

        .header-card {
          background: linear-gradient(135deg, #6e8efb, #a777e3);
          color: white;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .header-card h1 {
          margin: 0;
          font-size: 24px;
        }

        .header-card p {
          margin: 10px 0 0;
          opacity: 0.9;
          font-size: 14px;
        }

        .input-card {
          background: white;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .input-group {
          margin-bottom: 15px;
        }

        .input-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        .input-group input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 14px;
        }

        .rounds-input {
          display: flex;
          align-items: center;
        }

        .rounds-input input {
          width: 60px;
          margin-right: 10px;
        }

        .rounds-input span {
          font-size: 12px;
          color: #666;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        .btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 10px 15px;
          border: none;
          border-radius: 5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .btn svg {
          stroke-width: 2.5;
        }

        .encrypt-btn {
          background-color: #4CAF50;
          color: white;
        }

        .encrypt-btn:hover {
          background-color: #3e8e41;
        }

        .decrypt-btn {
          background-color: #2196F3;
          color: white;
        }

        .decrypt-btn:hover {
          background-color: #0b7dda;
        }

        .decrypt-btn.disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }

        .reset-btn {
          background-color: #f44336;
          color: white;
        }

        .reset-btn:hover {
          background-color: #da190b;
        }

        .control-btn {
          background-color: #ff9800;
          color: white;
        }

        .control-btn:hover {
          background-color: #e68a00;
        }

        .ciphertext-display {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }

        .ciphertext-display label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        .result-card {
          background: white;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .result-header {
          padding-bottom: 15px;
          margin-bottom: 15px;
          border-bottom: 1px solid #eee;
        }

        .result-header h2 {
          margin: 0;
          font-size: 20px;
        }

        .result-header.decrypt {
          border-bottom-color: #2196F3;
        }

        .parameters {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }

        .parameters h3 {
          margin-top: 0;
          font-size: 16px;
          color: #555;
        }

        .param-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 10px;
        }

        .param-item {
          display: flex;
          font-size: 14px;
        }

        .param-label {
          font-weight: 600;
          margin-right: 5px;
          color: #555;
        }

        .param-value {
          color: #333;
        }

        .animation-container {
          margin: 20px 0;
          padding: 15px;
          background: #f0f4f8;
          border-radius: 8px;
          border: 1px solid #ddd;
        }

        .feistel-diagram {
          position: relative;
          padding: 20px 0;
        }

        .plaintext-block, .cipher-block {
          background: #e3f2fd;
          border: 1px solid #bbdefb;
          border-radius: 5px;
          padding: 10px;
          margin: 10px auto;
          max-width: 300px;
          text-align: center;
        }

        .block-label {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 5px;
          color: #1976d2;
        }

        .block-content {
          font-family: monospace;
          font-size: 12px;
          word-break: break-all;
        }

        .split-blocks {
          margin: 20px 0;
        }

        .blocks-row {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 10px;
        }

        .left-block {
          background: #e8f5e9;
          border: 1px solid #c8e6c9;
        }

        .left-block .block-label {
          color: #2e7d32;
        }

        .right-block {
          background: #fff3e0;
          border: 1px solid #ffe0b2;
        }

        .right-block .block-label {
          color: #e65100;
        }

        .block {
          padding: 10px;
          border-radius: 5px;
          min-width: 120px;
          text-align: center;
        }

        .block.small {
          min-width: 80px;
          padding: 5px;
          font-size: 11px;
        }

        .animation-arrow {
          text-align: center;
          font-size: 20px;
          color: #666;
          margin: 5px 0;
        }

        .animation-arrow.right {
          display: inline-block;
          margin: 0 10px;
        }

        .round-animation {
          margin: 20px 0;
          padding: 15px;
          background: white;
          border-radius: 8px;
          border: 1px solid #ddd;
        }

        .round-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding-bottom: 5px;
          border-bottom: 1px dashed #ddd;
        }

        .round-header h4 {
          margin: 0;
          font-size: 16px;
          color: #333;
        }

        .round-key {
          font-size: 12px;
          background: #f5f5f5;
          padding: 3px 6px;
          border-radius: 3px;
        }

        .f-function {
          background: #f3e5f5;
          border: 1px solid #ce93d8;
          border-radius: 5px;
          padding: 10px;
          margin: 10px auto;
          max-width: 200px;
          text-align: center;
        }

        .f-label {
          font-size: 12px;
          font-weight: 600;
          color: #7b1fa2;
          margin-bottom: 5px;
        }

        .f-output {
          font-family: monospace;
          font-size: 12px;
          word-break: break-all;
        }

        .f-output.small {
          font-size: 11px;
        }

        .xor-operation {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          margin: 10px 0;
          padding: 10px;
          background: #e1f5fe;
          border-radius: 5px;
        }

        .xor-symbol {
          font-size: 18px;
          color: #0288d1;
        }

        .xor-result {
          background: #e3f2fd;
          border: 1px solid #bbdefb;
          border-radius: 5px;
          padding: 5px 10px;
          font-family: monospace;
          font-size: 12px;
        }

        .block-swap {
          margin: 20px 0;
        }

        .final-blocks {
          margin-top: 30px;
          text-align: center;
        }

        .ciphertext-output, .plaintext-output {
          background: #e3f2fd;
          border: 1px solid #bbdefb;
          border-radius: 5px;
          padding: 10px;
          margin: 10px auto;
          max-width: 300px;
          font-family: monospace;
        }

        .plaintext-output {
          background: #e8f5e9;
          border: 1px solid #c8e6c9;
        }

        .animation-controls {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 20px;
        }

        .step {
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }

        .step:last-child {
          border-bottom: none;
        }

        .step h4 {
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 16px;
          color: #333;
        }

        .binary-output, .split-output {
          background: #f5f5f5;
          padding: 10px;
          border-radius: 5px;
          font-family: monospace;
          font-size: 13px;
          margin-top: 5px;
        }

        .split-output {
          display: flex;
          gap: 20px;
        }

        .split-output div {
          flex: 1;
        }

        .round-details {
          background: #f5f5f5;
          padding: 10px;
          border-radius: 5px;
          font-size: 14px;
        }

        .round-details div {
          margin-bottom: 5px;
        }

        .indent {
          margin-left: 20px;
        }

        .highlight {
          background: #fff9c4;
          padding: 2px 4px;
          border-radius: 3px;
        }

        .final-output {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
        }

        .text-output {
          margin-top: 10px;
          font-size: 14px;
        }

        .verification {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 10px;
          padding: 8px;
          border-radius: 5px;
          font-size: 14px;
        }

        .verification.success {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .verification.error {
          background: #ffebee;
          color: #c62828;
        }

        .note {
          background: #fff8e1;
          padding: 10px;
          border-radius: 5px;
          margin-bottom: 15px;
          font-size: 14px;
        }

        code {
          font-family: 'Courier New', Courier, monospace;
          background: rgba(0,0,0,0.05);
          padding: 2px 4px;
          border-radius: 3px;
        }

        @media (max-width: 768px) {
          .blocks-row {
            flex-direction: column;
            gap: 10px;
          }

          .param-grid {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            flex-direction: column;
          }

          .split-output {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default FeistelCipher;
