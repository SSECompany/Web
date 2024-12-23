import { Button, Input, List, Skeleton } from "antd";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { filterKeyHelper } from "../../../../app/Functions/filterHelper";
import { formStatus } from "../../../../utils/constants";
import { SoFuckingUltimateGetApi } from "../../../DMS/API";
import HeaderTableBar from "../../../ReuseComponents/HeaderTableBar";
import UnitPermissionsDrawer from "./Drawer/UnitPermissionsDrawer";

const UnitPermissions = () => {
  // initials
  const [open, setOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState({});
  const [tableParams, setTableParams] = useState({
    searchValue: "",
  });
  const [pagination, setPagination] = useState({
    pageindex: 1,
    pageSize: 10,
  });
  const [totalRecord, setTotalRecord] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [actions, setActions] = useState(formStatus.VIEW);

  const listContainer = useRef(0);

  //Functions

  const showDrawer = useCallback(
    (item) => {
      setOpen(true);
      setCurrentItem({ ...item });
    },
    [currentItem, open]
  );

  const handleClose = useCallback(() => {
    setOpen(false);
    setActions(formStatus.VIEW);
  }, []);

  const getdata = useCallback(() => {
    setLoading(true);
    SoFuckingUltimateGetApi({
      store: "get_Units_List",
      data: { ...tableParams },
    }).then((res) => {
      setLoading(false);
      setDataSource(res.data);
      setTotalRecord(res?.pagegination?.totalRecord);
      listContainer.current.scrollTo(0, 0);
    });
  }, [tableParams]);

  const handlePaginationChange = (pageIndex, pageSize) => {
    setPagination({ ...pagination, pageindex: pageIndex });
  };

  const handleFilterInput = useDebouncedCallback((e) => {
    setTableParams({
      ...tableParams,
      searchValue: filterKeyHelper(e.target.value.trim()),
    });
  }, 600);

  //Effect

  useEffect(() => {
    getdata();
  }, [pagination, tableParams]);

  return (
    <div
      className="w-full flex gap-2 flex-column min-h-0 h-full relative"
      style={{ paddingBottom: "21px" }}
    >
      <HeaderTableBar
        name={"Đơn vị cơ sở"}
        title={"Danh sách đơn vị"}
        totalResults={totalRecord}
        refreshEvent={getdata}
        // deleteItems={{
        //   delete: handleOpenDeleteDialog,
        //   count: selectedRowKeys.length,
        // }}
      />
      <div className="flex justify-content-between align-items-center">
        <Input
          onInput={handleFilterInput}
          className="w-auto"
          placeholder="Tìm kiếm..."
        />
      </div>
      <div
        ref={listContainer}
        className="w-full list__user__container hidden_scroll_bar mb-3"
        style={{
          scrollBehavior: "smooth",
        }}
      >
        <List
          itemLayout="horizontal"
          dataSource={dataSource}
          renderItem={(item, index) => (
            <List.Item
              className="item_in_list"
              actions={[
                <Button
                  shape="circle"
                  type="primary"
                  onClick={(e) => {
                    showDrawer(item);
                    setActions(formStatus.EDIT);
                  }}
                  style={{ background: "var(--light_blue)" }}
                >
                  <i className="pi pi-ellipsis-h"></i>
                </Button>,
              ]}
            >
              <Skeleton avatar title={false} loading={loading} active>
                <List.Item.Meta
                  title={`Mã đơn vị: ${item?.ma_dvcs}`}
                  description={
                    <div>
                      <p>
                        Tên đơn vị:{" "}
                        <span className="sub_text_color">
                          {item?.ten_dvcs?.trim()}
                        </span>
                      </p>
                      <p>
                        Tên khác:{" "}
                        <span className="sub_text_color">
                          {item?.ten_dvcs2?.trim()}
                        </span>
                      </p>

                      <p>
                        Trạng thái:{" "}
                        <span className="sub_text_color">{item?.status}</span>
                      </p>
                    </div>
                  }
                />
              </Skeleton>
            </List.Item>
          )}
        />
      </div>

      {/* <Pagination
        total={totalRecord}
        pageSize={10}
        showSizeChanger={false}
        className="default_pagination_bar"
        onChange={handlePaginationChange}
      ></Pagination> */}

      <UnitPermissionsDrawer
        currentItem={currentItem}
        handleClose={handleClose}
        refreshData={getdata}
        openState={open}
        actions={actions}
      />
    </div>
  );
};

export default UnitPermissions;
