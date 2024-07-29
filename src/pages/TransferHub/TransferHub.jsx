import { Carousel, Modal } from "antd";
import React, { useEffect, useState } from "react";
import useLocalStorage from "use-local-storage";
import OrderModal from "./Modal/OrderModal";
import "./TransferHub.css";

const bannerList = [
  "https://img.freepik.com/free-photo/sunset-silhouettes-trees-mountains-generative-ai_169016-29371.jpg?size=626&ext=jpg&ga=GA1.1.2008272138.1713139200&semt=ais",
  "https://wallpapers.com/images/featured/ultra-hd-wazf67lzyh5q7k32.jpg",
  "https://wallpaperaccess.com/full/1216501.jpg",
  "https://e0.pxfuel.com/wallpapers/181/273/desktop-wallpaper-minimal-k-fox-illustration-sunset.jpg",
];

const TransferHub = () => {
  const [state, setstate] = useState("");
  const [qrSource, setQrSource] = useLocalStorage("QRimg", "");
  const [isTransfering, setIsTransfering] = useState(false);
  const [isSucceded, setIsSucceded] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleCloseModal = () => {
    setIsTransfering(false);
    setIsSucceded(false);
    setQrSource("");
  };

  const handleFullScreen = () => {
    if (
      (document.fullScreenElement !== undefined &&
        document.fullScreenElement === null) ||
      (document.msFullscreenElement !== undefined &&
        document.msFullscreenElement === null) ||
      (document.mozFullScreen !== undefined && !document.mozFullScreen) ||
      (document.webkitIsFullScreen !== undefined &&
        !document.webkitIsFullScreen)
    ) {
      if (document.body.requestFullScreen) {
        document.body.requestFullScreen();
      } else if (document.body.mozRequestFullScreen) {
        document.body.mozRequestFullScreen();
      } else if (document.body.webkitRequestFullScreen) {
        document.body.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
      } else if (document.body.msRequestFullscreen) {
        document.body.msRequestFullscreen();
      }
      setIsFullScreen(true);
    } else {
      if (document.cancelFullScreen || !document.fullscreenElement) {
        document.cancelFullScreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullScreen(false);
    }
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
    return () => {};
  }, [qrSource]);

  useEffect(() => {
    if (!isTransfering && isSucceded) {
      setTimeout(() => {
        handleCloseModal();
      }, 500);
    }
    return () => {};
  }, [isTransfering]);

  useEffect(() => {
    return () => {
      setQrSource("");
    };
  }, []);

  return (
    <div onClick={handleFullScreen} className="relative">
      <div
        className={`transfer_fullScreen_warning ${
          isFullScreen ? "opacity-0" : "opacity-100"
        }`}
      >
        <span>Click vào trang để mở toàn màn hình</span>
      </div>

      <Carousel
        fade
        pauseOnHover={false}
        pauseOnDotsHover={false}
        pauseOnFocus={false}
        infinite
        adaptiveHeight={"100vh"}
        dotPosition={"right"}
        autoplay
        autoplaySpeed={5000}
      >
        {bannerList.map((item, index) => (
          <div key={index}>
            <img src={item} className="h-screen w-screen" />
          </div>
        ))}
      </Carousel>

      <Modal
        zIndex={5000}
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
        styles={{
          body: {
            position: "relative",
          },
        }}
      >
        {!isSucceded ? (
          <img
            onLoad={(e) => {
              setIsTransfering(true);
            }}
            src={qrSource}
          />
        ) : (
          <div className="success-animation text-center">
            <svg
              className="checkmark mb-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 52 52"
            >
              <circle
                className="checkmark__circle"
                cx="26"
                cy="26"
                r="25"
                fill="none"
              />
              <path
                className="checkmark__check"
                fill="none"
                d="M14.1 27.2l7.1 7.2 16.7-16.8"
              />
            </svg>

            <b className="success_text_color default_header_label">
              Thanh toán thành công !
            </b>
          </div>
        )}
      </Modal>

      <OrderModal />
    </div>
  );
};

export default TransferHub;
