import PropTypes from "prop-types";
import React from "react";

const PremiumLock = ({ children, isPremium }) => {
  return (
    <div className="relative h-full">
      {isPremium ? (
        children
      ) : (
        <>
          <div className="premium_lock">
            <i className="pi pi-lock" style={{ fontSize: "3rem" }}></i>
            <span>Vui lòng nạp lần đầu để mở khoá chức năng này</span>
          </div>
          {children}
        </>
      )}
    </div>
  );
};
export default PremiumLock;

PremiumLock.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.element),
    PropTypes.element.isRequired,
  ]),
  isPremium: PropTypes.bool.isRequired,
};
