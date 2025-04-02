import React from "react";
import './ErrorPage.css';

const ErrorPage = () => {
    return (
        <div className="error-container">
            <img
                src="/error.webp"
                alt="Error background"
                className="error-bg-image"
            />
            <div style={{ position: "relative", zIndex: 1 }}>
                <h1 className="error-title">Oops! Something Went Wrong</h1>
                <p className="error-message">
                    We're sorry, but something went wrong. Please try again later or contact support if the issue continues.
                </p>
            </div>
        </div>
    );
};

export default ErrorPage;
