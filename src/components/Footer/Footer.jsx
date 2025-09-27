import { useState } from "react";
import "./Footer.css";

const Footer = () => {
  const [footer_detail, setFooterDetail] = useState(false);

  return (
    <div className="Footer" style={{ display: "none" }}>
      {/* Footer bị ẩn để hiển thị full trang */}
    </div>
  );
};

export default Footer;
