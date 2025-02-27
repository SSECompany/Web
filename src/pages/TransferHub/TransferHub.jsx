import React, { useEffect, useState } from "react";
import useLocalStorage from "use-local-storage";
import OrderModal from "./Modal/OrderModal";
import "./TransferHub.css";

const TransferHub = () => {
  const [qrSource, setQrSource] = useLocalStorage("QRimg", "");
  const [isTransfering, setIsTransfering] = useState(false);
  const [isSucceded, setIsSucceded] = useState(false);
  const [isSecondaryScreen, setIsSecondaryScreen] = useState(false);

  useEffect(() => {
    if (window.opener) {
      setIsSecondaryScreen(true);
    }
    console.log("Window opened from:", window.opener ? "Secondary Screen" : "Primary Screen");
  }, []);

  const handleCloseModal = () => {
    setIsTransfering(false);
    setIsSucceded(false);
    setQrSource("");
  };

  useEffect(() => {
    if (qrSource) {
      setIsTransfering(false);
      setTimeout(() => {
        setIsSucceded(true);
        setTimeout(() => {
          setIsTransfering(false);
        }, 3000);
      }, 5000);
    }
    return () => { };
  }, [qrSource]);

  useEffect(() => {
    if (!isTransfering && isSucceded) {
      setTimeout(() => {
        handleCloseModal();
      }, 500);
    }
    return () => { };
  }, [isTransfering]);

  useEffect(() => {
    return () => {
      setQrSource("");
    };
  }, []);

  return (
    <div className="relative">
      <OrderModal />
    </div>
  );
};

export default TransferHub;
