"use client";

import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { Contract } from "ethers";
import { keccak256, toUtf8Bytes } from "ethers";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { CityGuardAddresses } from "@/abi/CityGuardAddresses";
import { CityGuardABI } from "@/abi/CityGuardABI";
import { chacha20Encrypt } from "@/utils/chacha20";
import { utf8ToBytes, bytesToHex, randomBytes, concatBytes } from "@/utils/bytes";
import { Shield, Lock, CheckCircle, AlertCircle } from "lucide-react";

function deriveKeyFromPasswordAddress(passwordAddress: string): Uint8Array {
  const hash = keccak256(toUtf8Bytes(passwordAddress.toLowerCase()));
  const key = new Uint8Array(32);
  for (let i = 0; i < 32; i++) key[i] = parseInt(hash.slice(2 + i * 2, 4 + i * 2), 16);
  return key;
}

function generateRandomAddress(): string {
  const bytes = randomBytes(20);
  return "0x" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function ReportSubmit() {
  const { address } = useAccount();
  const {
    chainId,
    ethersSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const { instance, status: fhevmStatus } = useFhevm({
    provider: typeof window !== 'undefined' ? window.ethereum : undefined,
    chainId,
    initialMockChains,
    enabled: !!chainId && !!address,
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Get contract address for current chain with proper type safety
  const contractAddress = useMemo(() => {
    if (!chainId) return undefined;
    const chainKey = chainId.toString() as keyof typeof CityGuardAddresses;
    return CityGuardAddresses[chainKey]?.address;
  }, [chainId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!instance || !address || !ethersSigner || !contractAddress) {
      setError("Please connect your wallet first");
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError("Please enter both title and content");
      return;
    }

    setIsSubmitting(true);
    setSuccess(false);
    setError(null);

    try {
      // 1) Generate password (address-like), derive 32-byte key, random 12-byte nonce
      const password = generateRandomAddress();
      const key = deriveKeyFromPasswordAddress(password);
      const nonce = randomBytes(12);

      // 2) Encrypt the content using ChaCha20 (nonce || ciphertext)
      const ptBytes = utf8ToBytes(content);
      const ct = chacha20Encrypt(key, nonce, ptBytes);
      const data = concatBytes(nonce, ct);

      // 3) Prepare Zama encrypted input (password as address type)
      const input = instance.createEncryptedInput(contractAddress, address);
      input.addAddress(password);
      const encryptedInput = await input.encrypt();

      // 4) Submit on-chain
      const contract = new Contract(contractAddress, CityGuardABI.abi, ethersSigner);

      setIsConfirming(true);
      const tx = await contract.submitReport(
        title,
        bytesToHex(data),
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );
      await tx.wait();

      setSuccess(true);
      setTitle("");
      setContent("");
      setRetryCount(0); // Reset retry count on success
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to submit report";
      
      // Check if it's a network error and allow retry
      if (errorMessage.includes("network") || errorMessage.includes("timeout") || errorMessage.includes("connection")) {
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          setError(`Network error (attempt ${retryCount + 1}/3). Retrying...`);
          // Retry after a delay
          setTimeout(() => handleSubmit(e), 2000);
          return;
        } else {
          setError("Network error: Maximum retry attempts reached. Please try again later.");
        }
      } else {
        setError(errorMessage);
      }
      setRetryCount(0);
    } finally {
      setIsConfirming(false);
      setIsSubmitting(false);
    }
  };

  const isLoading = fhevmStatus === "loading";
  // Allow typing in form fields when wallet is connected and contract exists
  const canEdit = !!address && !!contractAddress;
  // Only allow submit when FHEVM instance is ready
  const canSubmit = canEdit && !!instance && !isSubmitting && !isLoading;

  return (
    <div className="form-container">
      <div className="form-header">
        <Shield size={64} className="mx-auto mb-4 text-indigo-400" />
        <h2 className="form-title">Submit Encrypted Report</h2>
        <p className="form-description">
          Your report will be encrypted using Fully Homomorphic Encryption (FHE) 
          and stored securely on the blockchain. Only you can decrypt it.
        </p>
      </div>

      {!address && (
        <div className="status-message status-info">
          <AlertCircle size={40} className="text-blue-400" />
          <div className="status-content">
            <div className="status-title">Connect Your Wallet</div>
            <p className="status-description">
              Please connect your wallet using the button in the top right corner to submit reports.
            </p>
          </div>
        </div>
      )}

      {address && !contractAddress && (
        <div className="status-message status-error">
          <AlertCircle size={40} className="text-red-400" />
          <div className="status-content">
            <div className="status-title">Contract Not Deployed</div>
            <p className="status-description">
              The CityGuard contract is not deployed on this network (Chain ID: {chainId}).
              Please switch to a supported network.
            </p>
          </div>
        </div>
      )}

      {address && contractAddress && (
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label className="form-label">Report Title</label>
            <input
              className="form-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title for your report"
              required
              disabled={!canEdit}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Report Content</label>
            <textarea
              className="form-input form-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter the sensitive information you want to encrypt and store securely"
              required
              rows={6}
              disabled={!canEdit}
            />
          </div>

          <button className="btn-primary" type="submit" disabled={!canSubmit}>
            {isLoading ? (
              <>
                <div className="loading-spinner" />
                Initializing encryption...
              </>
            ) : isSubmitting ? (
              <>
                <div className="loading-spinner" />
                Encrypting your report...
              </>
            ) : isConfirming ? (
              <>
                <div className="loading-spinner" />
                Confirming transaction...
              </>
            ) : (
              <>
                <Lock size={20} />
                Submit Report Securely
              </>
            )}
          </button>
        </form>
      )}

      {error && (
        <div className="status-message status-error">
          <AlertCircle size={40} className="text-red-400" />
          <div className="status-content">
            <div className="status-title">Error</div>
            <p className="status-description">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="status-message status-success">
          <CheckCircle size={40} className="text-green-400" />
          <div className="status-content">
            <div className="status-title">Report Submitted Successfully!</div>
            <p className="status-description">
              Your encrypted report has been securely stored on the blockchain.
              You can view and decrypt it in the &quot;My Reports&quot; tab.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
