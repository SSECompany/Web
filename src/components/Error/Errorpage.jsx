import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Errorpage.css";

const Errorpage = () => {
  const [Count, setCount] = useState(5);
  const navigate = useNavigate();
  useEffect((e) => {
    setInterval(() => {
      setCount((old) => {
        if (old == 1) return navigate("/");
        return (old = old - 1);
      });
    }, 1000);
    return () => {
      clearInterval();
    };
  }, []);

  return (
    <div className="ErrorPage">
      <div className="ErrorPage_Container">
        <img
          alt=""
          src="https://s3.getstickerpack.com/storage/uploads/sticker-pack/genshin-impact-raiden/sticker_9.png?67fc9883f541e2a868e2b7ffee590d65"
        />
        <h1 style={{ color: "#aa7eee" }}>
          <span style={{ fontSize: "25px", color: "#6333ae" }}>Bonk...</span>{" "}
          đang đi quá xa rồi đấy, Ngươi sẽ được quay lại sau{" "}
          <span style={{ color: "#FE6244" }}>{Count}</span> giây.
        </h1>
      </div>
    </div>
  );
};

export default Errorpage;
