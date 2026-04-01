import React from "react";
import { useRouteError } from "react-router-dom";
import './ErrorPage.css';

const ErrorPage = () => {
    const error = useRouteError();
    console.error("Route Error Caught:", error);

    const isChunkError = error?.message?.includes('Loading chunk') || 
                        error?.message?.includes('Failed to fetch dynamically imported module');

    const handleReload = () => {
        // Xóa cache và reload mạnh để lấy bản mới nhất
        window.location.reload(true);
    };

    return (
        <div className="error-container">
            <img
                src="/error.webp"
                alt="Error background"
                className="error-bg-image"
            />
            <div style={{ position: "relative", zIndex: 1, padding: '20px', background: 'rgba(255,255,255,0.8)', borderRadius: '12px' }}>
                <h1 className="error-title">
                    {isChunkError ? "Phiên bản đã cũ" : "Đã có lỗi xảy ra"}
                </h1>
                <p className="error-message">
                    {isChunkError 
                        ? "Hệ thống vừa có bản cập nhật mới. Vui lòng tải lại trang để tiếp tục sử dụng."
                        : "Chúng tôi xin lỗi vì sự bất tiện này. Vui lòng thử lại sau hoặc liên hệ hỗ trợ."}
                </p>
                
                {error?.message && (
                    <div style={{ margin: '10px 0', fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                        Chi tiết: {error.message}
                    </div>
                )}

                <button 
                    onClick={handleReload}
                    className="error-reload-btn"
                    style={{
                        marginTop: '20px',
                        padding: '10px 24px',
                        backgroundColor: '#1890ff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '16px'
                    }}
                >
                    Tải lại trang
                </button>
            </div>
        </div>
    );
};

export default ErrorPage;
