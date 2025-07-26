import * as signalR from "@microsoft/signalr";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { api_countPrintStatus_ByDate } from "../../../api";
import jwt from "../../../utils/jwt";
import SyncFastLogViewer from "./SyncFastLogViewer";

const LogViewerButton = ({ isInNavbar = false }) => {
  const [isLogViewerOpen, setIsLogViewerOpen] = useState(false);
  // State để nhận số lượng lỗi từ LogViewer
  const [totalFailed, setTotalFailed] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  // Lấy userId từ Redux hoặc localStorage
  const rawToken = localStorage.getItem("access_token");
  const claims =
    rawToken && rawToken.split(".").length === 3 ? jwt.getClaims?.() || {} : {};
  const userId = claims?.id || claims?.Id;

  // Hàm gọi API countPrintStatus
  const fetchPrintStatusCount = async () => {
    try {
      const today = dayjs().format("YYYY-MM-DD");
      const res = await api_countPrintStatus_ByDate(today);
      let failed = 0,
        pending = 0;
      if (
        res &&
        res.listObject &&
        Array.isArray(res.listObject) &&
        res.listObject[0]?.[0]
      ) {
        failed = res.listObject[0][0].total_failed;
        pending = res.listObject[0][0].total_pending;
      }
      setTotalFailed(failed);
      setTotalPending(pending);
    } catch (e) {
      setTotalFailed(0);
      setTotalPending(0);
    }
  };

  // Gọi API đếm lỗi in khi load trang
  useEffect(() => {
    fetchPrintStatusCount();
  }, []);

  // SignalR connection riêng để luôn lắng nghe message báo in
  useEffect(() => {
    if (!userId) return;
    let connection;
    let isUnmounted = false;

    const handlePrintResult = (printData) => {
      // Cập nhật countPrintStatus khi có message báo in
      fetchPrintStatusCount();
    };

    connection = new signalR.HubConnectionBuilder()
      .withUrl(`${process.env.REACT_APP_ROOT_API}Hub/orderHub`)
      .withAutomaticReconnect()
      .build();

    connection.on("ReceivePrintResult", handlePrintResult);

    const startConnection = async () => {
      try {
        await connection.start();
        await connection.invoke("AddToGroup", `printResult_${userId}`);
      } catch (err) {
        setTimeout(startConnection, 5000);
      }
    };
    startConnection();

    return () => {
      isUnmounted = true;
      if (connection) {
        connection.off("ReceivePrintResult", handlePrintResult);
        connection.stop();
      }
    };
  }, [userId]);

  // Hàm callback khi có message báo in thành công/thất bại
  const handlePrintResultChange = () => {
    // Gọi lại API countPrintStatus khi có thay đổi
    fetchPrintStatusCount();
  };

  // Kiểm tra xem có phải tài khoản pos-mini không
  const roleWeb = claims?.RoleWeb;

  // Ẩn monitor in nếu là pos-mini
  if (roleWeb === "isPosMini") {
    return null;
  }

  const handleOpenPrintOrders = () => {
    setIsLogViewerOpen(true);
    // Gọi lại API countPrintStatus khi mở LogViewer để đảm bảo dữ liệu mới nhất
    fetchPrintStatusCount();
  };

  // Hàm callback nhận số lượng lỗi từ SyncFastLogViewer
  const handleTotalFailedChange = (failed) => {
    setTotalFailed(failed);
  };

  return (
    <>
      {/* Chỉ giữ lại nút máy in */}
      <button
        className={`print-orders-fab${
          totalFailed > 0 || totalPending > 0 ? " blink" : ""
        }`}
        onClick={handleOpenPrintOrders}
        title="Monitor In đơn"
        style={
          isInNavbar
            ? {
                position: "static",
                top: "auto",
                right: "auto",
                transform: "none",
                margin: "0 0 0 8px",
                width: "auto",
                minWidth: "60px",
                height: "28px",
                fontSize: "12px",
                zIndex: "auto",
                padding: "0 8px",
              }
            : {
                position: "fixed",
                top: "15px",
                right: "220px",
                width: "80px",
                height: "32px",
              }
        }
      >
        <div
          className="main-icons"
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span role="img" aria-label="printer" style={{ fontSize: "16px" }}>
            🖨️
          </span>
          {/* Hiển thị số lượng pending (góc trái ngoài cùng của button) */}
          {totalPending > 0 && (
            <span
              style={{
                position: "absolute",
                top: -10,
                left: -20,
                background: "#ffc107",
                color: "white",
                borderRadius: "50%",
                padding: "2px 7px",
                fontSize: 12,
                fontWeight: 700,
                border: "2px solid white",
                boxShadow: "0 0 4px #ffc107",
                zIndex: 2,
              }}
            >
              {totalPending}
            </span>
          )}
          {/* Hiển thị số lượng failed (góc phải ngoài cùng của button) */}
          {totalFailed > 0 && (
            <span
              style={{
                position: "absolute",
                top: -10,
                right: -20,
                background: "#dc3545",
                color: "white",
                borderRadius: "50%",
                padding: "2px 7px",
                fontSize: 12,
                fontWeight: 700,
                border: "2px solid white",
                boxShadow: "0 0 4px #dc3545",
                zIndex: 2,
              }}
            >
              {totalFailed}
            </span>
          )}
        </div>
      </button>

      <SyncFastLogViewer
        isOpen={isLogViewerOpen}
        onClose={() => setIsLogViewerOpen(false)}
        onPrintResultChange={handlePrintResultChange}
      />

      <style jsx>{`
        .print-orders-fab {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
          z-index: 999;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 14px;
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          gap: 4px;
        }
        .print-orders-fab:hover {
          transform: translateY(-1px) scale(1.1);
          box-shadow: 0 6px 16px rgba(255, 107, 107, 0.5);
          background: linear-gradient(135deg, #ee5a24 0%, #ff6b6b 100%);
        }
        .print-orders-fab:active {
          transform: translateY(0) scale(0.95);
          box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
        }
        /* Nhấp nháy khi có lỗi */
        .print-orders-fab.blink {
          animation: blink-red 1s infinite;
        }
        @keyframes blink-red {
          0%,
          100% {
            box-shadow: 0 0 8px 2px #dc3545;
          }
          50% {
            box-shadow: 0 0 16px 6px #fff, 0 0 24px 8px #dc3545;
          }
        }
      `}</style>
    </>
  );
};

export default LogViewerButton;
