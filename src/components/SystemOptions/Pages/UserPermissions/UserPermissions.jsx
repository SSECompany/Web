import { Avatar, Button, Input, List, Pagination, Skeleton } from "antd";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { filterKeyHelper } from "../../../../app/Functions/filterHelper";
import { SoFuckingUltimateGetApi } from "../../../DMS/API";
import HeaderTableBar from "../../../ReuseComponents/HeaderTableBar";
import UserPermissionsDrawer from "./Drawer/UserPermissionsDrawer";
import "./UserPermissions.css";

const UserPermissions = () => {
  // initials
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({});
  const [tableParams, setTableParams] = useState({
    SearchKey: "",
  });
  const [pagination, setPagination] = useState({
    pageindex: 1,
    pageSize: 10,
  });
  const [totalRecord, setTotalRecord] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);

  const userContainer = useRef(0);

  //Functions

  const refreshData = () => {
    setPagination({ ...pagination, pageindex: 1 });
    if (pagination.pageindex === 1) {
      setLoading(false);
    }
  };

  const showDrawer = (user) => {
    setOpen(true);
    setCurrentUser({ ...user });
  };

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const getdata = () => {
    setLoading(true);
    SoFuckingUltimateGetApi({
      store: "api_Get_Users",
      data: {
        ...tableParams,
        pageindex: pagination.pageindex,
        pageSize: pagination.pageSize,
      },
    }).then((res) => {
      setLoading(false);
      setDataSource(res.data);
      setTotalRecord(res?.pagegination?.totalRecord);
    });
  };

  const handlePaginationChange = (pageIndex, pageSize) => {
    setPagination({ ...pagination, pageindex: pageIndex });
  };

  const handleFilterInput = useDebouncedCallback((e) => {
    setTableParams({
      ...tableParams,
      SearchKey: filterKeyHelper(e.target.value.trim()),
    });
  }, 600);

  //Effect

  useEffect(() => {
    setLoading(true);
    getdata();
  }, [pagination, tableParams]);

  return (
    <div
      className="w-full flex gap-2 flex-column min-h-0 h-full relative"
      style={{ paddingBottom: "21px" }}
    >
      <HeaderTableBar
        name={"tài khoản"}
        title={"Danh sách tài khoản"}
        totalResults={totalRecord}
        refreshEvent={refreshData}
      />

      <div className="flex justify-content-between align-items-center">
        <Input
          onInput={handleFilterInput}
          className="w-auto"
          placeholder="Tìm kiếm..."
        />
      </div>
      <div
        ref={userContainer}
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
                  }}
                  style={{ background: "var(--light_blue)" }}
                >
                  <i className="pi pi-ellipsis-h"></i>
                </Button>,
              ]}
            >
              <Skeleton avatar title={false} loading={loading} active>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={`https://xsgames.co/randomusers/avatar.php?g=pixel&key=${index}`}
                    />
                  }
                  title={item?.user_name?.trim()}
                  description={
                    <div>
                      <p>
                        Tên đầy đủ:{" "}
                        <span className="sub_text_color">
                          {item?.full_name?.trim()}
                        </span>
                      </p>
                      <p>
                        SDT:{" "}
                        <span className="sub_text_color">
                          {item?.dien_thoai?.trim()
                            ? item?.dien_thoai?.trim()
                            : "Không có SDT"}
                        </span>
                      </p>
                      <p>
                        Email:{" "}
                        <span className="sub_text_color">
                          {item?.e_mail?.trim()
                            ? item?.e_mail?.trim()
                            : "Không có Email"}
                        </span>
                      </p>
                      <p>
                        Trạng thái:{" "}
                        <span className="sub_text_color">
                          {item?.status == "1" ? "Hoạt động" : "Không sử dụng"}
                        </span>
                      </p>
                    </div>
                  }
                />
              </Skeleton>
            </List.Item>
          )}
        />
      </div>

      <Pagination
        total={totalRecord}
        pageSize={10}
        current={pagination.pageindex}
        showSizeChanger={false}
        className="default_pagination_bar"
        onChange={handlePaginationChange}
      ></Pagination>

      <UserPermissionsDrawer
        currentUser={currentUser}
        handleClose={handleClose}
        openState={open}
      />
    </div>
  );
};

export default UserPermissions;
