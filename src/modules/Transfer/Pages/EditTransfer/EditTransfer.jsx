import { memo } from "react";
import EditTransferInfo from './EditTransferInfo/EditTransferInfo';

const EditTransfer = () => {


  return (
    <div className="p-2 h-full flex flex-column align-items-stretch">
      <div className="w-full mt-2 mb-5 shadow-2 title_component p-3 flex justify-content-between gap-2 align-items-center  ">
        <h3>Đề nghị xuất điều chuyển</h3>
      </div>
      <EditTransferInfo />
    </div>

  );
};

export default memo(EditTransfer);
