import React, { useState, useEffect } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Address } from '@ton/core';
import {
  initJettonUtils,
  formatJettonAmount,
  parseJettonAmount,
  estimateJettonTransferFee,
  CUSTOM_JETTON_ADDRESS
} from '../utils/jettonUtils';
import { trackUserAction } from '../utils/analytics';
import './JettonFunding.css';

function JettonFunding({
  pollId,
  pollContractAddress,
  onFundingComplete,
  onClose,
  minAmount = '1'
}) {
  const [tonConnectUI] = useTonConnectUI();
  const [webApp, setWebApp] = useState(null);

  // Jetton state
  const [jettonUtils, setJettonUtils] = useState(null);
  const [jettonInfo, setJettonInfo] = useState(null);
  const [userBalance, setUserBalance] = useState(0n);
  const [isLoading, setIsLoading] = useState(true);

  // Funding state
  const [fundingAmount, setFundingAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
    }

    initializeJetton();
  }, [tonConnectUI]);

  const initializeJetton = async () => {
    try {
      setIsLoading(true);
      setError('');

      const utils = initJettonUtils();
      setJettonUtils(utils);

      // Get jetton metadata
      const info = await utils.getJettonInfo();
      setJettonInfo(info);

      // Get user balance if wallet is connected
      if (tonConnectUI.account?.address) {
        const userAddress = Address.parse(tonConnectUI.account.address);
        const balance = await utils.getUserJettonBalance(userAddress);
        setUserBalance(balance);
      }

      trackUserAction('jetton_funding_modal_opened', {
        jettonAddress: CUSTOM_JETTON_ADDRESS,
        pollId: pollId
      });

    } catch (error) {
      console.error('Error initializing jetton:', error);
      setError('Failed to load jetton information');
      trackUserAction('jetton_funding_error', {
        error: 'initialization_failed',
        message: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;

    // Allow only numbers and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFundingAmount(value);
      setError('');
    }
  };

  const validateAmount = () => {
    if (!fundingAmount || parseFloat(fundingAmount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    const minAmountNum = parseFloat(minAmount);
    if (parseFloat(fundingAmount) < minAmountNum) {
      setError(`Minimum funding amount is ${minAmount} tokens`);
      return false;
    }

    const decimals = jettonInfo?.metadata?.decimals ? parseInt(jettonInfo.metadata.decimals) : 9;
    const amountBigInt = parseJettonAmount(fundingAmount, decimals);

    if (amountBigInt > userBalance) {
      setError('Insufficient jetton balance');
      return false;
    }

    return true;
  };

  const handleFund = async () => {
    if (!validateAmount() || !jettonUtils || !tonConnectUI.account) {
      return;
    }

    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
    }

    setIsSubmitting(true);
    setError('');

    try {
      const userAddress = Address.parse(tonConnectUI.account.address);
      const pollContract = Address.parse(pollContractAddress);
      const decimals = jettonInfo?.metadata?.decimals ? parseInt(jettonInfo.metadata.decimals) : 9;
      const amount = parseJettonAmount(fundingAmount, decimals);

      // Get user's jetton wallet address
      const jettonWalletAddress = await jettonUtils.getUserJettonWallet(userAddress);

      // Create funding message
      const transferBody = jettonUtils.createFundingMessage(
        pollId,
        amount,
        pollContract,
        userAddress
      );

      // Estimate fees
      const transferFee = estimateJettonTransferFee();

      // Create transaction
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
        messages: [
          {
            address: jettonWalletAddress.toString(),
            amount: transferFee.toString(),
            payload: transferBody.toBoc().toString('base64')
          }
        ]
      };

      trackUserAction('jetton_funding_submitted', {
        pollId: pollId,
        amount: fundingAmount,
        jettonAddress: CUSTOM_JETTON_ADDRESS
      });

      // Send transaction
      await tonConnectUI.sendTransaction(transaction);

      trackUserAction('jetton_funding_success', {
        pollId: pollId,
        amount: fundingAmount,
        jettonAddress: CUSTOM_JETTON_ADDRESS
      });

      if (webApp) {
        webApp.showAlert(`Successfully funded poll with ${fundingAmount} tokens!`);
      }

      // Call completion callback
      if (onFundingComplete) {
        onFundingComplete({
          pollId,
          amount: fundingAmount,
          tokenAddress: CUSTOM_JETTON_ADDRESS,
          tokenSymbol: jettonInfo?.metadata?.symbol || 'JETTON'
        });
      }

      // Close modal
      if (onClose) {
        onClose();
      }

    } catch (error) {
      console.error('Error funding with jetton:', error);
      setError(`Funding failed: ${error.message}`);

      trackUserAction('jetton_funding_error', {
        error: 'transaction_failed',
        message: error.message,
        pollId: pollId
      });

      if (webApp) {
        webApp.showAlert(`Funding failed: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }

    trackUserAction('jetton_funding_modal_closed', { pollId });

    if (onClose) {
      onClose();
    }
  };

  const decimals = jettonInfo?.metadata?.decimals ? parseInt(jettonInfo.metadata.decimals) : 9;
  const formattedBalance = formatJettonAmount(userBalance, decimals);
  const tokenSymbol = jettonInfo?.metadata?.symbol || 'JETTON';
  const tokenName = jettonInfo?.metadata?.name || 'Custom Token';

  return (
    <div className="jetton-funding-modal-overlay" onClick={handleClose}>
      <div className="jetton-funding-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Fund with {tokenSymbol}</h3>
          <button className="close-btn" onClick={handleClose}>✕</button>
        </div>

        <div className="modal-content">
          {isLoading ? (
            <div className="loading-section">
              <div className="loading-spinner"></div>
              <p>Loading jetton information...</p>
            </div>
          ) : (
            <>
              {/* Jetton Info */}
              <div className="jetton-info">
                <div className="jetton-details">
                  <h4>{tokenName}</h4>
                  <p className="jetton-address">
                    {CUSTOM_JETTON_ADDRESS.slice(0, 8)}...{CUSTOM_JETTON_ADDRESS.slice(-6)}
                  </p>
                </div>

                <div className="balance-info">
                  <span className="balance-label">Your Balance:</span>
                  <span className="balance-amount">
                    {formattedBalance} {tokenSymbol}
                  </span>
                </div>
              </div>

              {/* Funding Input */}
              <div className="funding-section">
                <label htmlFor="jetton-amount">Funding Amount</label>
                <div className="amount-input-container">
                  <input
                    id="jetton-amount"
                    type="text"
                    inputMode="decimal"
                    value={fundingAmount}
                    onChange={handleAmountChange}
                    placeholder={`Min: ${minAmount}`}
                    className={`amount-input ${error ? 'error' : ''}`}
                    disabled={isSubmitting}
                  />
                  <span className="token-symbol">{tokenSymbol}</span>
                </div>

                {error && (
                  <div className="error-message">{error}</div>
                )}

                <div className="funding-info">
                  <div className="info-item">
                    <span>Min. Amount:</span>
                    <span>{minAmount} {tokenSymbol}</span>
                  </div>
                  <div className="info-item">
                    <span>Network Fee:</span>
                    <span>~0.1 TON</span>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="funding-benefits">
                <h5>Funding Benefits:</h5>
                <ul>
                  <li>🎁 Share in poll rewards</li>
                  <li>🗳️ Priority access to results</li>
                  <li>📊 Detailed analytics</li>
                  <li>🏆 Contributor recognition</li>
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="modal-actions">
          <button
            className="cancel-btn"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="fund-btn"
            onClick={handleFund}
            disabled={
              isLoading ||
              isSubmitting ||
              !fundingAmount ||
              parseFloat(fundingAmount) <= 0 ||
              !tonConnectUI.account
            }
          >
            {isSubmitting ? 'Processing...' : `Fund with ${tokenSymbol}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default JettonFunding;