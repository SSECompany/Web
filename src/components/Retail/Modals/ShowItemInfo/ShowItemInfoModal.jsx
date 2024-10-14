import {
  Button,
  DatePicker,
  Input,
  Modal,Avatar,Image,
  Pagination,
  Popover,
  Skeleton,
  Tag,
  Tooltip,
} from "antd";
import { FileImageOutlined } from "@ant-design/icons";
import _ from "lodash";
import React, { memo,  useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getUserInfo } from "../../../../store/selectors/Selectors";
import {multipleTablePutApi} from 'api'
import "./ShowItemInfoModal.css";

const ShowItemInfoModal = ({ isOpen, onClose,ma_vt}) => {
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCombo,setIsCombo]=useState(false);
  const [item,setItem]=useState({});
  const [listItemCombo,setListItemCombo]=useState({});

  const { userName, id: userId, storeId, unitId } = useSelector(getUserInfo);


  // functions
  const fetchData = async () => {
    setIsLoading(true);
    const result = await  multipleTablePutApi({
      store: "Api_get_item_info",
      param: {
        ma_vt,
        userId,
      },
      data: {},
    }).then(res=>{
      if (res.responseModel?.isSucceded) {
        const temp_item= _.first(_.first(res.listObject));
        setItem(temp_item);
        setListItemCombo(_.last(res.listObject));
        setIsCombo(item.IsCombo == 1 ? true :false)
        console.log(temp_item);
        console.log(_.last(res.listObject));
      }
    })
    setIsLoading(false);
  };

  useEffect(() => {
    console.log(ma_vt,isOpen);
    if (isOpen) {
      fetchData();
    }
    return () => {};
  }, [ma_vt]);




  return (
    <Modal
    open={isOpen}
    width={"80%"}
    title="Thông tin sản phẩm"
    destroyOnClose={true}
    onCancel={onClose}
    cancelText="Đóng"
    centered
    okButtonProps={{ style: { display: "none" } }}
    cancelButtonProps={{ style: { display: "none" } }}
    >
      <div className={`retail__promotion__container p-2 relative`}  >
        <div>
          <div className="retail__promotion__Selection">
          <Image
            className="border-circle"
            title=""
            style={{ height: 120,width:120 }}
            src={item.image}
            alt="SSE"
            onError={({ currentTarget }) => {
              currentTarget.onerror = null; 
              currentTarget.src="https://pbs.twimg.com/media/FfgUqSqWYAIygwN.jpg";
            }}
          ></Image>
        
          </div>
        </div>
        <div>
          <span className="primary_bold_text line-height-4">
            Chiết khấu tặng hàng
          </span>

          <div className="retail__promotion__Selection">
            xyz
          </div>
        </div>
        
      </div>
    </Modal>
  );
};

export default memo(ShowItemInfoModal);
