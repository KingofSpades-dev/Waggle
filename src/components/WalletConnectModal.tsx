'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, CheckCircle2, ChevronDown, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';
import { ROBINHOOD_CHAIN_ID } from '@/lib/viemClient';

interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
}

export default function WalletConnectModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Check if wallet is already connected on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            ethereum
              .request({ method: 'eth_chainId' })
              .then((hexChainId: string) => {
                setWallet({
                  address: accounts[0],
                  chainId: parseInt(hexChainId, 16),
                  isConnected: true,
                });
              });
          }
        })
        .catch(() => {});

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setWallet(prev => ({ ...prev, address: accounts[0], isConnected: true }));
        } else {
          setWallet({ address: null, chainId: null, isConnected: false });
        }
      };

      const handleChainChanged = (hexChainId: string) => {
        setWallet(prev => ({ ...prev, chainId: parseInt(hexChainId, 16) }));
      };

      ethereum.on?.('accountsChanged', handleAccountsChanged);
      ethereum.on?.('chainChanged', handleChainChanged);

      return () => {
        ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
        ethereum.removeListener?.('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert('No Web3 wallet detected. Please install Rainbow, MetaMask, or Coinbase Wallet.');
      return;
    }

    try {
      setIsConnecting(true);
      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const hexChainId = await ethereum.request({ method: 'eth_chainId' });

      setWallet({
        address: accounts[0],
        chainId: parseInt(hexChainId, 16),
        isConnected: true,
      });
      setIsOpen(false);
    } catch (err: any) {
      console.warn('Wallet connection cancelled or failed:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWallet({ address: null, chainId: null, isConnected: false });
    setIsOpen(false);
  };

  const copyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const isRobinhoodChain = wallet.chainId === ROBINHOOD_CHAIN_ID;

  return (
    <>
      {/* Trigger Button */}
      {!wallet.isConnected ? (
        <button
          className="connect-wallet-btn"
          onClick={() => setIsOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '7px 14px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#0f172a',
            background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#94a3b8')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#cbd5e1')}
        >
          <Wallet size={14} style={{ color: '#2563eb' }} />
          <span>Connect</span>
        </button>
      ) : (
        <button
          className="connected-wallet-btn"
          onClick={() => setIsOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#0f172a',
            background: '#f8fafc',
            border: `1px solid ${isRobinhoodChain ? '#10b981' : '#cbd5e1'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isRobinhoodChain ? '#10b981' : '#f59e0b',
              boxShadow: isRobinhoodChain ? '0 0 6px rgba(16,185,129,0.5)' : undefined
            }}
          />
          <span style={{ fontFamily: 'monospace' }}>
            {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
          </span>
          <ChevronDown size={12} style={{ color: '#64748b' }} />
        </button>
      )}

      {/* Modal Backdrop & Dialog */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 380,
              background: '#ffffff',
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              animation: 'modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wallet size={18} style={{ color: '#2563eb' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                  {wallet.isConnected ? 'Connected Wallet' : 'Connect Wallet'}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2rem',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 4,
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px' }}>
              {!wallet.isConnected ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                    Connect your Web3 wallet to authorize gasless <b>x402 payments</b> via USDG on Robinhood Chain or Base USDC.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                    <button
                      onClick={connectWallet}
                      disabled={isConnecting}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        cursor: 'pointer',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        color: '#0f172a',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#2563eb';
                        e.currentTarget.style.background = '#f0f7ff';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.background = '#f8fafc';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '1.2rem' }}>🌈</span>
                        <span>Browser Wallet (MetaMask / Rainbow)</span>
                      </div>
                      <ArrowRight size={14} style={{ color: '#94a3b8' }} />
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.74rem',
                      color: '#059669',
                      background: 'rgba(16, 185, 129, 0.08)',
                      padding: '8px 12px',
                      borderRadius: 8,
                      marginTop: 4
                    }}
                  >
                    <ShieldCheck size={14} />
                    <span>EIP-3009 Gasless: You never pay gas fees.</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Account Info Card */}
                  <div
                    style={{
                      padding: '14px 16px',
                      background: '#f8fafc',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Active Address
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                        {wallet.address?.slice(0, 10)}...{wallet.address?.slice(-8)}
                      </span>
                      <button
                        onClick={copyAddress}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: 6,
                          padding: '4px 8px',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          color: copySuccess ? '#059669' : '#475569'
                        }}
                      >
                        {copySuccess ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* Network Status */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: isRobinhoodChain ? 'rgba(16, 185, 129, 0.06)' : 'rgba(245, 158, 11, 0.06)',
                      border: `1px solid ${isRobinhoodChain ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: isRobinhoodChain ? '#10b981' : '#f59e0b'
                        }}
                      />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
                        {isRobinhoodChain ? 'Robinhood Chain (4663)' : `Chain ID: ${wallet.chainId}`}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>Active</span>
                  </div>

                  {/* Disconnect Button */}
                  <button
                    onClick={disconnectWallet}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '10px',
                      background: '#ffffff',
                      border: '1px solid #fee2e2',
                      borderRadius: 8,
                      color: '#dc2626',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginTop: 4
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
                  >
                    <LogOut size={14} />
                    <span>Disconnect Wallet</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
