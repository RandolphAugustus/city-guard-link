"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { Contract } from "ethers";
import { keccak256, toUtf8Bytes } from "ethers";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { CityGuardAddresses } from "@/abi/CityGuardAddresses";
import { CityGuardABI } from "@/abi/CityGuardABI";
import { chacha20Decrypt } from "@/utils/chacha20";
import { hexToBytes, bytesToUtf8 } from "@/utils/bytes";
import { FileText, Lock, Unlock, AlertCircle, RefreshCw } from "lucide-react";

function deriveKeyFromPasswordAddress(passwordAddress: string): Uint8Array {
  const hash = keccak256(toUtf8Bytes(passwordAddress.toLowerCase()));
  const key = new Uint8Array(32);
  for (let i = 0; i < 32; i++) key[i] = parseInt(hash.slice(2 + i * 2, 4 + i * 2), 16);
  return key;
}

const STATUS_LABELS = ["Pending", "Reviewed", "Resolved"];
const STATUS_CLASSES = ["pending", "reviewed", "resolved"];

interface ReportMeta {
  id: bigint;
  reporter: string;
  title: string;
  createdAt: bigint;
  status: number;
}

export function ReportList() {
  const { address } = useAccount();
  const {
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const { instance, status: fhevmStatus, refresh: refreshFhevm } = useFhevm({
    provider: typeof window !== 'undefined' ? window.ethereum : undefined,
    chainId,
    initialMockChains,
    enabled: !!chainId && !!address,
  });

  const [reports, setReports] = useState<ReportMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get contract address for current chain
  const contractAddress = chainId
    ? CityGuardAddresses[chainId.toString() as keyof typeof CityGuardAddresses]?.address
    : undefined;

  // Fetch reports with useCallback to prevent unnecessary re-renders
  const fetchReports = useCallback(async () => {
    if (!address || !contractAddress || !ethersReadonlyProvider) return;

    setLoading(true);
    setError(null);

    try {
      const contract = new Contract(contractAddress, CityGuardABI.abi, ethersReadonlyProvider);
      const ids: bigint[] = await contract.getReportIdsByReporter(address);

      const reportData: ReportMeta[] = [];
      for (const id of ids) {
        const [reporter, title, createdAt, status] = await contract.getReportMeta(id);
        reportData.push({
          id,
          reporter,
          title,
          createdAt,
          status: Number(status),
        });
      }

      // Sort by newest first
      reportData.sort((a, b) => Number(b.createdAt - a.createdAt));
      setReports(reportData);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch reports";
      if (errorMessage.includes("network") || errorMessage.includes("timeout")) {
        setError("Network error: Please check your connection and try again");
      } else if (errorMessage.includes("user rejected")) {
        setError("Transaction was rejected by user");
      } else {
        setError("Failed to fetch reports. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }, [address, contractAddress, ethersReadonlyProvider]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  if (!address) {
    return (
      <div className="empty-state">
        <Lock size={64} className="mx-auto mb-4 text-gray-400" />
        <h3>Connect Your Wallet</h3>
        <p>Please connect your wallet to view your encrypted reports.</p>
      </div>
    );
  }

  if (!contractAddress) {
    return (
      <div className="empty-state">
        <AlertCircle size={64} className="mx-auto mb-4 text-red-400" />
        <h3>Contract Not Deployed</h3>
        <p>The CityGuard contract is not deployed on this network (Chain ID: {chainId}).</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="empty-state">
        <div className="loading-spinner mx-auto mb-4" style={{ width: 48, height: 48 }} />
        <h3>Loading Reports...</h3>
        <p>Fetching your encrypted reports from the blockchain.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <AlertCircle size={64} className="mx-auto mb-4 text-red-400" />
        <h3>Error</h3>
        <p>{error}</p>
        <button className="btn-secondary mt-4" onClick={fetchReports}>
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="empty-state">
        <FileText size={64} className="mx-auto mb-4 text-gray-400" />
        <h3>No Reports Yet</h3>
        <p>Start by submitting your first encrypted report using the &quot;Submit Report&quot; tab.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">My Reports</h2>
          <p className="text-gray-400 text-sm">{reports.length} report{reports.length !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn-secondary flex items-center gap-2" onClick={fetchReports}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="report-list">
        {reports.map((report) => (
          <ReportItem
            key={report.id.toString()}
            report={report}
            contractAddress={contractAddress}
            instance={instance}
            ethersSigner={ethersSigner}
            fhevmStatus={fhevmStatus}
            refreshFhevm={refreshFhevm}
          />
        ))}
      </div>
    </div>
  );
}

interface ReportItemProps {
  report: ReportMeta;
  contractAddress: string;
  instance: ReturnType<typeof useFhevm>["instance"];
  ethersSigner: ReturnType<typeof useMetaMaskEthersSigner>["ethersSigner"];
  fhevmStatus: string;
  refreshFhevm: () => void;
}

function ReportItem({ report, contractAddress, instance, ethersSigner, fhevmStatus, refreshFhevm }: ReportItemProps) {
  const { ethersReadonlyProvider } = useMetaMaskEthersSigner();
  const [decrypted, setDecrypted] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createdAt = useMemo(() => {
    const date = new Date(Number(report.createdAt) * 1000);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [report.createdAt]);

  const decrypt = async () => {
    if (!instance || !ethersSigner || !ethersReadonlyProvider) {
      setError("Missing wallet or encryption instance");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const contract = new Contract(contractAddress, CityGuardABI.abi, ethersReadonlyProvider);

      // Get encrypted data and key handle
      const encryptedData = await contract.getReportData(report.id);
      const encKeyHandle = await contract.getEncryptedKey(report.id);

      // Request user decryption of password (address)
      const keypair = instance.generateKeypair();
      const handleContractPairs = [{ handle: encKeyHandle, contractAddress }];
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = "7";
      const contractAddresses = [contractAddress];
      const eip712 = instance.createEIP712(keypair.publicKey, contractAddresses, startTimeStamp, durationDays);

      const signature = await ethersSigner.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );

      const result = await instance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace("0x", ""),
        contractAddresses,
        ethersSigner.address,
        startTimeStamp,
        durationDays
      );

      const passwordAddress = result[encKeyHandle] as string;
      if (!passwordAddress || !passwordAddress.startsWith("0x")) {
        throw new Error("Invalid decrypted password");
      }

      // Decrypt with ChaCha20
      const allBytes = hexToBytes(encryptedData);
      const nonce = allBytes.slice(0, 12);
      const ct = allBytes.slice(12);
      const key = deriveKeyFromPasswordAddress(passwordAddress);
      const pt = chacha20Decrypt(key, nonce, ct);
      const text = bytesToUtf8(pt);
      setDecrypted(text);
    } catch (err) {
      console.error("Decrypt failed", err);
      setError(err instanceof Error ? err.message : "Decrypt failed");
    } finally {
      setBusy(false);
    }
  };

  const canDecrypt = !!instance && !!ethersSigner && fhevmStatus === "ready" && !busy;

  return (
    <div className="report-item">
      <div className="report-meta">
        <div>
          <h3 className="report-title">{report.title || "Untitled"}</h3>
          <p className="report-time">{createdAt}</p>
        </div>
        <span className={`report-status ${STATUS_CLASSES[report.status]}`}>
          {STATUS_LABELS[report.status]}
        </span>
      </div>

      {!decrypted ? (
        <div className="flex items-center gap-4">
          <button
            className="btn-secondary flex items-center gap-2"
            onClick={decrypt}
            disabled={!canDecrypt}
          >
            {busy ? (
              <>
                <div className="loading-spinner" style={{ width: 16, height: 16 }} />
                Decrypting...
              </>
            ) : (
              <>
                <Unlock size={16} />
                Decrypt Content
              </>
            )}
          </button>
          {error && <span className="text-red-400 text-sm">{error}</span>}
          {!canDecrypt && fhevmStatus !== "ready" && (
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 text-sm">
                FHEVM Status: {fhevmStatus}
              </span>
              {fhevmStatus === "error" && (
                <button
                  className="text-blue-400 text-sm underline"
                  onClick={refreshFhevm}
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="decrypted-content">
          <div className="decrypted-content-title">Decrypted Content</div>
          <div className="decrypted-content-text">{decrypted}</div>
          <button
            className="btn-secondary mt-4 flex items-center gap-2"
            onClick={() => setDecrypted("")}
          >
            <Lock size={16} />
            Hide Content
          </button>
        </div>
      )}
    </div>
  );
}
