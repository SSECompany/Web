import { Button, Image, Modal, Skeleton } from "antd";
import React, { useEffect, useState } from "react";
import "./ModalDetailImages.css";

import dayjs from "dayjs";
import { useSelector } from "react-redux";
import LoadingComponents from "../../../Loading/LoadingComponents";
import { setCurrentImageIndex } from "../../Store/Sagas/Sagas";
import {
  getCurrentImageIndex,
  getCurrentImagesList,
} from "../../Store/Selector/Selectors";

const ModalDetailImages = (props) => {
  const mapStyled = {
    padding: "0px 15px 0px 0px",
    display: "flex",
    flexDirection: "column",
    flex: "unset",
  };

  const directionStyled = {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: "unset",
    padding: "10px 0px",
    gap: "20px",
  };

  const currentListImages = useSelector(getCurrentImagesList);
  const currentImageIndex = useSelector(getCurrentImageIndex);

  const [isOpenModal, setOpenModal] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [currentRecord, setCurrentRecord] = useState({});

  const handleCancelModal = () => {
    setOpenModal(false);
    props.handleCloseModal(false);
  };

  const getDataEdit = (id) => {
    setIsLoading(true);
    setIsLoading(false);
  };

  const handleNextImage = () => {
    const nextImages = currentListImages.filter(
      (item, index) => index == currentImageIndex + 1
    );

    if (nextImages.length > 0) {
      setCurrentRecord(nextImages[0]);
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePreviousImage = () => {
    const nextImages = currentListImages.filter(
      (item, index) => index == currentImageIndex - 1
    );

    if (nextImages.length > 0) {
      setCurrentRecord(nextImages[0]);
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  useEffect(() => {
    setOpenModal(props.openModalState);
    if (props.currentRecord && props.openModalState) {
      setCurrentRecord({ ...props.currentRecord });
    }
  }, [JSON.stringify(props)]);

  useEffect(() => {
    getDataEdit(currentRecord);
  }, [JSON.stringify(currentRecord)]);

  return (
    <Modal
      className="default_modal detail__image__modal"
      style={{ height: "88vh" }}
      open={isOpenModal}
      onCancel={handleCancelModal}
      closable={false}
      centered
      okButtonProps={{ style: { display: "none" } }}
      cancelButtonProps={{ style: { display: "none" } }}
      width={1000}
    >
      <LoadingComponents text={"Đang tải..."} size={50} loading={isLoading} />

      <div className="default_modal_container p-0">
        <div className="image__detail_container">
          <Image
            preview={{ maskClassName: "image__detail__mask" }}
            style={{ flex: "0.6" }}
            src={currentRecord.path_l}
            alt={currentRecord.ma_album}
          />
          <div className="image__detail__info">
            <Skeleton active loading={isLoading}>
              <div>
                <p>
                  Tên khách hàng:{" "}
                  <span className="primary_bold_text">
                    {currentRecord.ten_kh}
                  </span>
                </p>
                <p>
                  Hình thức:{" "}
                  <span className="primary_bold_text">
                    {currentRecord.hinh_thuc
                      ? currentRecord.hinh_thuc
                      : "Không có dữ liệu"}
                  </span>
                </p>
                <p>
                  Phân loại:{" "}
                  <span className="primary_bold_text">
                    {currentRecord.phan_loai
                      ? currentRecord.phan_loai
                      : "Không có dữ liệu"}
                  </span>
                </p>
                <p>
                  Địa chỉ:{" "}
                  <span className="primary_bold_text">
                    {currentRecord.dia_chi
                      ? currentRecord.dia_chi
                      : "Không có dữ liệu"}
                  </span>
                </p>
                <p>
                  Album:{" "}
                  <span className="primary_bold_text">
                    {currentRecord.album
                      ? currentRecord.album
                      : "Không có dữ liệu"}
                  </span>
                </p>
                <p>
                  Chụp bởi:{" "}
                  <span className="primary_bold_text">
                    {currentRecord.comment}
                  </span>
                </p>
                <p>
                  Thời gian tạo:{" "}
                  <span className="primary_bold_text">
                    {dayjs(currentRecord.create_date).format(
                      "DD/MM/YYYY HH:mm"
                    )}
                  </span>
                </p>
              </div>
            </Skeleton>
            <div style={mapStyled} className="h-full">
              <iframe
                src={`https://maps.google.com/maps?q=20.996257312359095, 105.80254243742307&z=15&output=embed`}
                title="google map projection 1"
                className="gg__map__embed"
              ></iframe>
              <div style={directionStyled}>
                <Button
                  className="default_subsidiary_button"
                  onClick={handlePreviousImage}
                >
                  Quay lại
                </Button>

                <Button
                  className="default_primary_button"
                  onClick={handleNextImage}
                >
                  Tiếp theo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ModalDetailImages;
