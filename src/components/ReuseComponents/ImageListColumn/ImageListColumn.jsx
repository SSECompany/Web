import { Button, Image, Popover, Skeleton } from "antd";
import React, { useState } from "react";
import { apiGetImagesByCode } from "../../DMS/API";
import LoadingComponents from "../../Loading/LoadingComponents";

const ImageListColumn = ({ keys }) => {
  const [imageList, setImageList] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleOpenChange = async (value) => {
    if (value) {
      setLoading(true);
      await apiGetImagesByCode(keys).then((res) => {
        setImageList([...res]);
        setLoading(false);
      });
    } else {
      setImageList([]);
    }
  };

  const popoverContent = () => {
    return (
      <div
        className="flex gap-3 relative"
        style={{ minWidth: 60, minHeight: 60 }}
      >
        <LoadingComponents text={"Loading..."} loading={loading} />
        {imageList.map((item, index) => (
          <Image
            key={index}
            placeholder={
              <Skeleton.Image style={{ width: 60, height: 60 }} active={true} />
            }
            className="object_fit_cover image_list_column_item"
            width={60}
            height={60}
            src={item?.src}
            alt="SSE.net.vn"
          />
        ))}
      </div>
    );
  };

  return (
    <Popover
      onOpenChange={handleOpenChange}
      destroyTooltipOnHide={true}
      placement="bottom"
      content={popoverContent()}
      trigger="click"
    >
      <Button className="default_button">
        <i
          className="pi pi-images sub_text_color"
          style={{ fontWeight: "bold" }}
        ></i>
      </Button>
    </Popover>
  );
};

export default ImageListColumn;
