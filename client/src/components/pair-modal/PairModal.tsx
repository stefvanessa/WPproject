import { useEffect, useState, useCallback } from "react";
import QRCode from "react-qr-code";
import Modal from "../modal/Modal";
import { generatePairCode } from "../../api/pair";
import "./PairModal.scss";

interface PairModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PairModal({ open, onClose }: PairModalProps) {
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCode = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generatePairCode();
      setCode(data.code);
      setExpiresAt(new Date(data.expiresAt));
    } catch (err: any) {
      setError(err.message ?? "Failed to generate code");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchCode();
    else { setCode(null); setExpiresAt(null); setError(null); }
  }, [open, fetchCode]);

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const secs = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setSecondsLeft(secs);
      if (secs === 0) fetchCode();
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, fetchCode]);

  const formattedCode = code ? `${code.slice(0, 3)} ${code.slice(3)}` : "";
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <Modal open={open} onClose={onClose} title="Connect Mobile App">
      <div className="pair-modal">
        {loading && <div className="pair-loading">Generating code…</div>}
        {error && <p className="pair-error">{error}</p>}
        {code && !loading && (
          <>
            <p className="pair-instructions">
              Open the <strong>SnapFit</strong> mobile app, then enter the code
              or scan the QR below.
            </p>
            <div className="pair-qr">
              <QRCode value={code} size={160} fgColor="#1c1c1e" />
            </div>
            <div className="pair-code">{formattedCode}</div>
            <div className={`pair-timer${secondsLeft <= 30 ? " expiring" : ""}`}>
              Expires in {mins}:{secs.toString().padStart(2, "0")}
            </div>
            <button className="pair-refresh-btn" onClick={fetchCode}>
              Generate new code
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
