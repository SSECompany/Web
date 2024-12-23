import { Modal } from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";
import useLocalStorage from "use-local-storage";
const Test = () => {
  const [state, setstate] = useState("");
  const [qrSource, setQrSource] = useLocalStorage("QRimg", "");
  const [isTransfering, setIsTransfering] = useState(false);

  useEffect(() => {
    if (qrSource) {
      setIsTransfering(false);
      console.log("Storage Changed:", qrSource);
    }
    return () => {};
  }, [qrSource]);

  useEffect(() => {
    axios
      .post(
        "https://app82.faceworks.vn/app/MPV/API/gettoken.php?action=generate",
        {
          username: "admin_sse",
          password: "sse132faceworks@api",
        },
        {
          headers: {
            Authorization: "Basic YWRtaW5fc3NlOnNzZTEzMmZhY2V3b3Jrc0BhcGk=",
            "Content-Type": "application/json",
          },
        }
      )
      .then((res) => {
        console.log(res);
      });

    return () => {
      setQrSource("");
    };
  }, []);

  return (
    <div>
      <span>Mạch</span>
      <Modal
        forceRender
        closable={false}
        footer
        centered
        onCancel={() => {
          setIsTransfering(false);
        }}
        open={isTransfering}
        okButtonProps={{ style: { display: "none" } }}
        cancelButtonProps={{ style: { display: "none" } }}
      >
        <img
          onLoad={(e) => {
            setIsTransfering(true);
          }}
          src={qrSource}
        />
      </Modal>
    </div>
  );
};

export default Test;
