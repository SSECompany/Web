import { FileImageOutlined } from "@ant-design/icons";
import { uuidv4 } from "@antv/xflow-core";
import { Avatar, Button, Form, Image, Input, message as messageAPI, Select } from "antd";
import _ from "lodash";
import { useEffect, useRef, useState } from "react";
import { Column } from "react-base-table";
import { useHotkeys } from "react-hotkeys-hook";
import { useDispatch, useSelector } from "react-redux";
import { useDebouncedCallback } from "use-debounce";
import { filterKeyHelper } from "../../../../../../app/Functions/filterHelper";
import { getAllRowKeys, getAllValueByColumn, getAllValueByRow, getCellName, getRowKey, } from "../../../../../../app/Functions/getTableValue";
import { formatCurrency } from "../../../../../../app/hooks/dataFormatHelper";
import RenderPerformanceTableCell from "../../../../../../app/hooks/RenderPerformanceTableCell";
import SelectNotFound from "../../../../../../Context/SelectNotFound";
import { addRefundData, setTotal } from '../../../../../../store/reducers/refundSlice';
import { getUerSetting, getUserInfo } from "../../../../../../store/selectors/Selectors";
import { CHARTCOLORS } from "../../../../../../utils/constants";
import PerformanceTable from "../../../../../ReuseComponents/PerformanceTable/PerformanceTable";
import { multipleTablePutApi } from "../../../../../SaleOrder/API";
import { fetchRetailOderPromotion, modifyIsAddNewCustomer, modifyIsOpenPromotion, setRetailOrderScanning } from "../../../../Store/Actions/RetailOrderActions";
import { getRetailOrderState } from "../../../../Store/Selectors/RetailOrderSelectors";
import "../RetailOrderInfo";

var isDelete = false;
var globalIsCalVat = false;

const Refund = ({ dataRefund }) => {
    const dispatch = useDispatch();
    const [openItemInfo, setOpenItemInfo] = useState(false);
    const handleShowItemInfo = (value) => {
        setOpenItemInfo(true);
    }
    const KeyDownName = (event) => {
        event.preventDefault();
    }
    const rightClickName = (event) => {
        event.preventDefault();
    }
    const columns = [
        {
            title: "",
            width: 60,
            align: Column.Alignment.CENTER,
            resizable: false,

            cellRenderer: ({ cellData, rowData }) => {
                if (rowData.ck_yn) return null
                return <Button
                    className="default_button"
                    danger
                    onClick={() => RemoveTest(rowData)}
                >
                    <i className="pi pi-trash" style={{ fontWeight: "bold" }}></i>
                </Button>
            }
        },
        {
            key: "image",
            title: "Ảnh",
            dataKey: "image",
            width: 60,
            align: Column.Alignment.CENTER,
            resizable: false,

            cellRenderer: ({ cellData, rowData }) =>
                cellData ? (
                    <Image
                        className="border-circle"
                        title=""
                        style={{ height: 40 }}
                        src={cellData}
                        alt="SSE"
                    ></Image>
                ) : (
                    <Avatar style={{ background: rowData.ck_yn ? "red" : "#341b4d" }}>
                        {rowData.ck_yn ? (
                            <i className="pi pi-gift" style={{ fontSize: 40 }}></i>
                        ) : (
                            <FileImageOutlined
                                style={{
                                    fontSize: "40px",
                                }}
                            />
                        )}
                    </Avatar>
                ),
        },

        {
            key: "ten_vt",
            title: "Tên vật tư",
            dataKey: "ten_vt",
            className: "flex-1",
            headerClassName: "flex-1",
            width: 100,
            resizable: false,
            sortable: false,
            type: "TextArea",
            cellRenderer: ({ rowData, column, cellData }) => {
                return (
                    <Form.Item initialValue={cellData || null} name={`${rowData.id}_ten_vt`} style={{ width: "100%", margin: 0, }}
                    >
                        <Input.TextArea
                            onClick={() => { handleShowItemInfo(rowData) }}
                            autoSize={{ minRows: 1, maxRows: 2, }} style={{ resize: "none", transition: "none" }} variant={"borderless"}
                            className="p-0 Performance_table_span"
                            onKeyDown={KeyDownName}
                            onContextMenu={rightClickName}
                        />
                    </Form.Item>
                );
            },
        },

        {
            key: "barcode",
            title: "Barcode",
            dataKey: "barcode",
            width: 0,
            resizable: false,
            sortable: false,
            className: "p-0",
            headerClassName: "p-0",
            cellRenderer: ({ rowData, column, cellData }) => {
                return (
                    <RenderPerformanceTableCell
                        rowKey={rowData?.id}
                        column={column}
                        cellData={cellData}
                    />
                );
            },
        },

        {
            key: "ma_vt",
            title: "Mã vật tư",
            dataKey: "ma_vt",
            width: 0,
            resizable: false,
            sortable: false,
            className: "p-0",
            headerClassName: "p-0",
            cellRenderer: ({ rowData, column, cellData }) => {
                return (
                    <RenderPerformanceTableCell
                        rowKey={rowData?.id}
                        column={column}
                        cellData={cellData}
                    />
                );
            },
        },

        {
            key: "ma_kho",
            title: "Kho",
            dataKey: "ma_kho",
            width: 120,
            resizable: false,
            sortable: false,
            editable: true,
            controller: "dmkho_lookup",
            type: "AutoComplete",
            cellRenderer: ({ rowData, column, cellData }) => {
                return (
                    <RenderPerformanceTableCell
                        rowKey={rowData?.id}
                        column={column}
                        cellData={cellData}
                    />
                );
            },
        },
        {
            key: "thue_suat",
            title: "Vat",
            dataKey: "thue_suat",
            width: 80,
            resizable: false,
            sortable: false,
            editable: false,
            type: "Numeric",
            cellRenderer: ({ rowData, column, cellData }) => {
                return (
                    <RenderPerformanceTableCell
                        rowKey={rowData?.id}
                        column={column}
                        cellData={cellData}
                    />
                );
            },
        },
        {
            key: "thue_nt",
            title: "Vat Tiền",
            dataKey: "thue_nt",
            width: 0,
            resizable: false,
            sortable: false,
            editable: true,
            type: "Numeric",
            cellRenderer: ({ rowData, column, cellData }) => {
                return (
                    <RenderPerformanceTableCell
                        rowKey={rowData?.id}
                        column={column}
                        cellData={cellData}
                    />
                );
            },
        },

        {
            key: "dvt",
            title: "Đơn vị",
            dataKey: "dvt",
            width: 120,
            resizable: false,
            sortable: false,
            editable: true,
            type: "dvt",
            cellRenderer: ({ rowData, column, cellData }) => {
                return (
                    <RenderPerformanceTableCell
                        rowData={rowData}
                        rowKey={rowData?.id}
                        column={column}
                        cellData={cellData}
                    />
                );
            },
        },

        {
            key: "so_luong",
            title: "Số lượng",
            dataKey: "so_luong",
            width: 0,
            resizable: false,
            sortable: false,
            editable: true,
            type: "Numeric",
            cellRenderer: ({ rowData, column, cellData }) => {
                return (
                    <RenderPerformanceTableCell
                        rowKey={rowData?.id}
                        column={column}
                        cellData={cellData}
                        customShow={rowData?.ck_yn}
                    />
                );
            },
        },
        {
            key: "so_luong_tl",
            title: "Số lượng",
            dataKey: "so_luong_tl",
            width: 100,
            resizable: false,
            sortable: false,
            editable: true,
            type: "Numeric",
            cellRenderer: ({ rowData, column, cellData }) => {
                return (
                    <RenderPerformanceTableCell
                        rowKey={rowData?.id}
                        column={column}
                        cellData={cellData}
                        customShow={rowData?.ck_yn}
                    />
                );
            },
        },

        {
            key: "gia",
            title: "Đơn giá",
            dataKey: "gia",
            width: 110,
            resizable: false,
            sortable: false,
            editable: true,
            type: "don_gia",
            format: "0",
            cellRenderer: ({ rowData, column, cellData }) => {
                return (
                    <RenderPerformanceTableCell
                        rowKey={rowData?.id}
                        column={column}
                        cellData={cellData}
                        handleChangePrice={handleChangePrice}
                    />
                );
            },
        },

        {
            key: "don_gia_temp",
            title: "Thành tiền",
            dataKey: "don_gia_temp",
            width: 0,
            resizable: false,
            sortable: false,
            editable: true,
            format: "0",
            type: "Numeric",
            cellRenderer: ({ rowData, column, cellData }) => {
                return (
                    <RenderPerformanceTableCell
                        rowKey={rowData?.id}
                        column={column}
                        cellData={cellData}
                    />
                );
            },
        },


        {
            key: "thanh_tien",
            title: "Thành tiền",
            dataKey: "thanh_tien",
            width: 120,
            resizable: false,
            sortable: false,
            editable: true,
            format: "0",
            type: "Numeric",
            cellRenderer: ({ rowData, column, cellData }) => {
                return (
                    <RenderPerformanceTableCell
                        rowKey={rowData?.id}
                        column={column}
                        cellData={cellData}
                    />
                );
            },
        },


    ];
    const { isScanning } =
        useSelector(getRetailOrderState);
    var isGetBarCode = false;
    const [message] = messageAPI.useMessage();
    const [itemForm] = Form.useForm();
    const [data, setData] = useState([]);
    const [selectedRowkeys, setSelectedRowkeys] = useState([]);
    const [searchValue, setSearchValue] = useState("");
    const [searchOptions, setsearchOptions] = useState([]);
    const [searchColapse, setSearchColapse] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchOptionsFiltered, setsearchOptionsFiltered] = useState([]);
    const [paymentInfo, setPaymentInfo] = useState({
        ma_kh: "KVL",
        ten_kh: "Vãng lai",
        dien_thoai: null,
        diem: 0,
        diem_sd: 0,
        ma_nt: "VND",
        ty_gia: 1,
        quy_doi_diem: 1,
        tong_tien: 0,
        thue_suat: 0,
        tong_thue: 0,
        tong_sl: 0,
        ck: 0,
        ma_ck: "",
        tl_ck: 0,
        tong_ck: 0,
        voucher: "",
        tien_voucher: 0,
        tong_tt: 0,
        tien_mat: 0,
        tien_the: 0,
        dien_giai: '',
        chuyen_khoan: 0,
        t_diem_so: 0,
    });
    const searchInputRef = useRef(null);
    const { id: userId, storeId, unitId } = useSelector(getUserInfo);
    const [isCalVat, setIsCalVat] = useState(false);
    const { hs_quy_doi } = useSelector(getUerSetting);
    const [voucher, setVoucher] = useState({
        voucherId: "",
        tl_ck: 0,
        tien_ck: 0,
    });

    const handleChangePrice = async (discountType, percent, value, key, rowkey) => {
        const gia_ban = itemForm.getFieldValue([rowkey + '_don_gia_temp'])
        const so_luong = itemForm.getFieldValue([rowkey + '_so_luong_tl'])
        var gia_last = gia_ban;
        if (value > 0) {
            gia_last = value
        } else {
            if (percent > 0) {
                if (discountType == "%") gia_last = gia_ban * (100 - percent) / 100
                else gia_last = gia_ban - percent
            }
        }
        itemForm.setFieldsValue({
            [rowkey + '_' + key]: Math.max(gia_last, 0)
        });
        itemForm.setFieldsValue({
            [rowkey + '_thanh_tien']: Math.max(so_luong * gia_last, 0)
        });
        if (globalIsCalVat) {
            const thue = itemForm.getFieldValue([rowkey + '_thue_suat'])
            itemForm.setFieldsValue({
                [rowkey + '_thue_nt']: Math.max((so_luong * gia_last) * thue / 100, 0)
            });
        }
        const temp = await handleCalculatorPayment(paymentInfo, true, globalIsCalVat)
        setPaymentInfo(temp);

        const updateTotalInStore = () => {
            const thanhTienValues = getAllValueByColumn('thanh_tien', itemForm.getFieldsValue());
            const total = thanhTienValues.reduce((sum, value) => sum + parseFloat(value || 0), 0);
            dispatch(setTotal(total));
        };
        updateTotalInStore()
    }

    const handleResetPromotion = async () => {
        const changedValues = { ...itemForm.getFieldsValue() };
        const allKeys = getAllRowKeys(changedValues);

        var promotions = {};

        allKeys.map(async (key) => {
            promotions[`${key}_ma_ck`] = "";
            promotions[`${key}_tl_ck`] = 0;
            promotions[`${key}_ck`] = 0;
        });

        const rawData = data.filter((item) => !item.ck_yn);

        setData([...rawData]);

        await itemForm.setFieldsValue({
            ...promotions,
        });
        const temp = {
            ...paymentInfo,
            ma_ck: "",
            ck: 0,
            tl_ck: 0,
        };
        setPaymentInfo(await handleCalculatorPayment(temp));
    };

    //Tính thanh toán
    const handleCalculatorPayment = async (dataTemp, temp = false, useCal = false) => {
        var tempIsCalVat = isCalVat;
        if (temp) tempIsCalVat = useCal
        const changedValues = { ...itemForm.getFieldsValue() };

        const allData = getAllRowKeys(changedValues).map((item) => {
            return getAllValueByRow(item, changedValues);
        });

        const tong_sl = await getAllValueByColumn("so_luong", changedValues).reduce(
            (Sum, num) => Sum + num,
            0
        );

        const tong_tien = await parseFloat(
            allData.reduce((Sum, item) => {
                return (
                    Sum + parseFloat(item.so_luong || 0) * parseFloat(item.don_gia || 0)
                );
            }, 0)
        );

        const tong_ckvt = await parseFloat(
            allData.reduce((Sum, item) => {
                return Sum + parseFloat(item.ck || 0);
            }, 0)
        );

        const ck_tong_don =
            dataTemp.ma_ck || !dataTemp.tl_ck
                ? dataTemp.ck
                : (tong_tien * dataTemp.tl_ck) / 100;

        const tong_ck = parseFloat(tong_ckvt + ck_tong_don);

        var tong_thue = 0
        if (tempIsCalVat)
            tong_thue = await getAllValueByColumn("thue_nt", changedValues).reduce(
                (Sum, num) => Sum + num,
                0
            );
        var tien_voucher = 0;

        tien_voucher = Number(
            parseFloat(
                voucher?.tl_ck
                    ? (voucher?.tl_ck * (tong_tien + tong_thue - tong_ck)) / 100
                    : voucher?.tien_ck
            ).toFixed(2)
        );
        const tong_tt = parseFloat(tong_tien + tong_thue - tong_ck - dataTemp.diem_sd * (hs_quy_doi ? hs_quy_doi : 0) - tien_voucher);

        const cal = {
            ...dataTemp,
            tong_sl,
            tong_tien,
            tong_tt,
            tong_ck,
            tong_thue,
            tien_diem: dataTemp.diem_sd * (hs_quy_doi ? hs_quy_doi : 0),
            tien_voucher: tien_voucher
        };

        return cal
    };



    useEffect(() => {
        async function fetchData() {
            const temp = { ...paymentInfo, voucherId: voucher?.voucherId };
            setPaymentInfo(await handleCalculatorPayment(temp))
            return () => { };
        }
        fetchData();
    }, [voucher, dataRefund]);


    const recalPromotion = async (temp = false, useCal = false) => {
        //Reset
        return;
        var tempIsCalVat = isCalVat;
        if (temp) tempIsCalVat = useCal
        const changedValues = { ...itemForm.getFieldsValue() };
        const allKeys = getAllRowKeys(changedValues);
        var rawData = [...data].filter((row) => !row?.ck_yn);
        var listPromotion = [...data].filter((row) => row?.ck_yn);
        var promotions = {};
        allKeys.map(async (key) => {
            promotions[`${key}_ma_ck`] = "";
            promotions[`${key}_tl_ck`] = 0;
            promotions[`${key}_ck`] = 0;
        });

        //Recal
        const Tinhtrang = await fetchRetailOderPromotion(
            changedValues,
            paymentInfo.ma_kh
        ).then(async (result) => {
            //Chiết khấu chi tiết vật tư
            var ckvtObject = {};

            result?.ckvt?.map(async (ck) => {
                var temp = itemForm.getFieldValue(`${ck.rowKey}_so_luong`);
                var temp_thue_suat = itemForm.getFieldValue(`${ck.rowKey}_thue_suat`);

                if (ck.loai_ck == '08') {
                    ckvtObject[`${ck.rowKey}_gia`] = ck?.gia_nt2;
                    ckvtObject[`${ck.rowKey}_thanh_tien`] = ck?.gia_nt2 * temp;
                    if (tempIsCalVat) ckvtObject[`${ck.rowKey}_thue_nt`] = (ck?.gia_nt2 * temp * temp_thue_suat / 100);
                    else ckvtObject[`${ck.rowKey}_thue_nt`] = 0;

                }
                ckvtObject[`${ck.rowKey}_ma_ck`] = ck?.ma_ck;
                ckvtObject[`${ck.rowKey}_tl_ck`] = ck.tl_ck;
                ckvtObject[`${ck.rowKey}_ck`] = ck.ck;
                if (tempIsCalVat) ckvtObject[`${ck.rowKey}_thue_nt`] = (ck?.gia_nt2 * temp - ck.ck) * temp_thue_suat / 100;
                else ckvtObject[`${ck.rowKey}_thue_nt`] = 0;
            });

            itemForm.setFieldsValue({
                ...ckvtObject,
            });

            var check = false;
            if (listPromotion.length == result.ckth.length && result.ckth.length > 0) {
                listPromotion.forEach(d => {
                    let t = result.ckth.find(c => c.ma_vt.trim() == d.ma_vt.trim() && c.so_luong == d.so_luong)
                    if (!t) check = true;
                });
            } else if (!(result.ckth.length == 0 && listPromotion.length == 0)) check = true;
            if (check) {
                const tempzz = rawData
                result?.ckth?.forEach((ck) => {
                    tempzz.push({
                        id: uuidv4(),
                        ma_vt: ck.ma_vt,
                        ten_vt: ck.ten_vt,
                        ma_kho: ck.ma_kho,
                        image: "",
                        dvt: ck.dvt,
                        so_luong: ck.so_luong,
                        don_gia: "0",
                        thanh_tien: "0",
                        ck_yn: true,
                        ma_ck: ck.ma_ck,
                    });
                });
                setData(tempzz);
            }

            const cktdValues = _.first(result.cktd);

            const temp = {
                ...paymentInfo,
                ma_ck: cktdValues?.ma_ck || "",
                ck: cktdValues?.ck || 0,
                tl_ck: cktdValues?.tl_ck || 0,
                t_diem_so: cktdValues?.t_diem_so || 0
            };

            await setPaymentInfo(await handleCalculatorPayment(temp, true, tempIsCalVat));

            message.destroy();


        });

    }
    // Xử lý khi thu gọn tìm kiếm
    const handleCollapseOptions = (key) => {
        const currentCollaps = [...searchColapse];
        if (currentCollaps.includes(key)) {
            currentCollaps.splice(
                currentCollaps.findIndex((item) => item === key),
                1
            );
            setSearchColapse([...currentCollaps]);
        } else setSearchColapse([...currentCollaps, key]);
    };

    // Lấy data vật tư
    const fetchItemsNCustomers = ({ searchValue }) => {
        setsearchOptions([]);
        multipleTablePutApi({
            store: "Api_search_items_N_customers",
            param: {
                searchValue: filterKeyHelper(searchValue),
                unitId,
                storeId,
                userId,
            },
            data: {},
        }).then(async (res) => {
            if (res.responseModel?.isSucceded) {
                const results = [
                    {
                        key: "VT",
                        label: <span>Vật tư</span>,
                        title: "Vật tư",
                        options: [..._.first(res.listObject)],
                    }
                ];

                setSearchLoading(false);
                setsearchOptions([...results]);
            }
        });
    };


    // Lấy thông tin vật tư
    const handleFetchItemInfo = async ({ barcode, ma_vt, stock }) => {
        isGetBarCode = true;
        var results = {};
        await multipleTablePutApi({
            store: "Api_get_item_info",
            param: {
                barcode,
                ma_vt,
                StoreID: storeId,
                userId,
            },
            data: {},
        })
            .then((res) => {
                if (res.responseModel?.isSucceded) {
                    if (_.isEmpty(_.first(res.listObject))) {
                        message.warning("Barcode không tồn tại!");
                        return;
                    }

                    const { ma_vt, ten_vt, ma_kho, dvt, gia, thue_suat } = _.first(
                        _.first(res.listObject)
                    );

                    if (barcode) {
                        handleAddRowData({
                            barcode,
                            ma_vt,
                            ten_vt,
                            ma_kho,
                            image: "",
                            dvt,
                            so_luong: 1,
                            don_gia: gia || "0",
                            ck_yn: false,
                            thue_suat: thue_suat
                        });
                        return;
                    }
                    if (ma_vt) {
                        results = {
                            ma_vt,
                            ma_kho,
                            dvt,
                            gia,
                        };
                    }
                }
            })
            .finally(() => {
                isGetBarCode = false;
                searchInputRef.current.focus()
            });
        return results;
    };

    // Tìm kiếm thông tin khách hàng và vật tư
    const handleSearchValue = useDebouncedCallback((searchValue) => {
        fetchItemsNCustomers({ searchValue });
    }, 400);

    //Thêm dòng vật tư
    const handleAddRowData = async ({
        barcode = "",
        ma_vt,
        ten_vt,
        image,
        ma_kho,
        dvt,
        don_gia,
        ck_yn,
        thue_suat = 0,
        so_luong = 1,
    }) => {
        const rowID = uuidv4();
        dispatch(addRefundData({
            id: rowID,
            barcode: barcode || "",
            ma_vt,
            ten_vt,
            image,
            ma_kho,
            dvt,
            so_luong_tl: so_luong ? so_luong : 1,
            don_gia: don_gia || "0",
            don_gia_temp: don_gia || "0",
            thanh_tien: don_gia * 1 || "0",
            ck_yn: ck_yn || false,
            thue_suat: thue_suat,
            thue_nt: isCalVat ? (thue_suat * don_gia / 100) : 0,
            children: "",
        }));
    };

    const RemoveTest = async (d) => {
        if (isDelete) return;
        isDelete = true;
        const filteredData = await [...data].filter(
            (item) => (item?.id != d.id)
        );
        await setData(filteredData);

        if (_.isEmpty(filteredData)) {
            const temp = { ...paymentInfo };
            setPaymentInfo(await handleCalculatorPayment(temp));
            isDelete = false;
        }

    }

    const handleSelectedRowKeyChange = (keys) => {
        setSelectedRowkeys(keys);
    };

    const handleSelectChange = (key, params) => {
        if (params.data.type === "VT") {
            const { value, label, dvt, gia, ma_kho, image, thue_suat } = params.data;
            handleAddRowData({
                ma_vt: value,
                ten_vt: label,
                image: image || "https://pbs.twimg.com/media/FfgUqSqWYAIygwN.jpg",
                ma_kho: ma_kho,
                dvt,
                don_gia: gia,
                ck_yn: false,
                thue_suat: thue_suat,
            });

        }
        if (params.data.type === "DTVL") {
            modifyIsAddNewCustomer({ open: true, value: searchValue })
        }
    };

    const handleChangeValue = async (cellChanged, allCells) => {
        const cellName = getCellName(_.first(Object.keys(cellChanged)));
        const cellValue = _.first(Object.values(cellChanged));
        const changedRowKey = getRowKey(_.first(Object.keys(cellChanged)));
        const rowValues = getAllValueByRow(changedRowKey, allCells);

        const getCurRowValues = () => {
            return getAllValueByRow(changedRowKey, itemForm.getFieldsValue());
        };

        if (cellName === 'gia' || cellName === 'so_luong_tl') {
            const curRow = getCurRowValues();
            const gia = cellName === 'gia' ? cellValue : curRow.gia;
            const soLuongTl = cellName === 'so_luong_tl' ? cellValue : curRow.so_luong_tl;

            // Tính toán thanh_tien
            const thanhTien = gia * soLuongTl || 0;

            // Cập nhật giá trị thanh_tien
            itemForm.setFieldValue(`${changedRowKey}_thanh_tien`, thanhTien);
        }

        // Xử lý các trường hợp khác
        if (cellName === 'dvt' || cellName === 'ma_kho') {
            const params = {
                ma_vt: rowValues?.ma_vt,
                dvt: cellName === 'dvt' ? cellValue : rowValues?.dvt,
                ma_kho: cellName === 'ma_kho' ? cellValue : rowValues?.ma_kho,
            };

            const res = await multipleTablePutApi({
                store: "Web_GetPriceByDvt",
                param: params,
                data: {},
            });

            if (res.responseModel?.isSucceded) {
                if (res.listObject.length > 0 && res.listObject[0].length > 0 && res.listObject[0][0].t) {
                    itemForm.setFieldValue(`${changedRowKey}_gia`, parseInt(res.listObject[0][0].t));
                    itemForm.setFieldValue(`${changedRowKey}_don_gia_temp`, parseInt(res.listObject[0][0].t));
                }
            }
        }

        const updateTotalInStore = () => {
            const thanhTienValues = getAllValueByColumn('thanh_tien', itemForm.getFieldsValue());
            const total = thanhTienValues.reduce((sum, value) => sum + parseFloat(value || 0), 0);
            dispatch(setTotal(total));
        };
        updateTotalInStore()
    };


    // Search
    useEffect(() => {
        if (!_.isEmpty(searchOptions)) {
            const rawOptions = _.cloneDeep(searchOptions);

            const filteredOptions = rawOptions.map((item) => {
                if (searchColapse.includes(item.key)) {
                    item.options.length = 0;
                }
                return item;
            });

            setsearchOptionsFiltered([...filteredOptions] || []);
        }
        return () => { };
    }, [JSON.stringify(searchOptions), JSON.stringify(searchColapse)]);

    //Key map
    useHotkeys(
        "f8",
        (e) => {
            e.preventDefault();
            handleResetPromotion();
            modifyIsOpenPromotion(true);
        },
        { enableOnFormTags: ["input", "select", "textarea"] }
    );

    useHotkeys(
        "f10",
        (e) => {
            setsearchOptions([]);
            setsearchOptionsFiltered([]);
            if (!isScanning) setRetailOrderScanning(true)
            else setRetailOrderScanning(false);
            if (!isScanning) searchInputRef.current.focus();

            e.preventDefault();
        },
        { enableOnFormTags: ["input", "select", "textarea"] },
        [isScanning]
    );


    const handelKeyPress = (event) => {
        if (isScanning) {
            if (event.keyCode == 13) {
                handleFetchItemInfo({ barcode: searchValue, ma_vt: "", stock: "" })
                setSearchValue("")
            }
        }
    }

    return (
        <div
            className="h-full min-h-0 overflow-hidden border-round-md flex flex-column"
            style={{ background: "#fff" }}
        >
            <div
                className="w-full p-2 flex gap-5 align-items-center"
                style={{ background: "white" }}
            >
                <div
                    className="flex gap-2"
                    style={{
                        width: "28rem",
                        flexShrink: 0,
                    }}
                >
                    <Select
                        disabled={isGetBarCode}
                        ref={searchInputRef}
                        className="w-full"
                        value={null}
                        searchValue={searchValue}
                        popupMatchSelectWidth={false}
                        showSearch
                        placeholder="Tìm kiếm..."
                        allowClear
                        onDropdownVisibleChange={(value) => {
                            if (!value) setSearchColapse([]);
                        }}
                        notFoundContent={SelectNotFound(searchLoading, searchOptions)}
                        defaultActiveFirstOption={false}
                        suffixIcon={false}
                        filterOption={false}
                        onChange={handleSelectChange}
                        onFocus={() => {
                            if (!isScanning) {
                                setSearchLoading(true);
                                fetchItemsNCustomers({ searchValue: "" });
                            } else {
                                setsearchOptionsFiltered([]);
                                setSearchLoading(true);
                            }
                        }}
                        optionLabelProp="value"
                        onSearch={(e) => {
                            setSearchValue(e);
                            if (isScanning) {
                                setSearchLoading(true);
                                return;
                            }
                            setsearchOptionsFiltered([]);
                            setSearchLoading(true);
                            handleSearchValue(e);
                        }}
                        onKeyDown={handelKeyPress}
                        listHeight={500}
                    >
                        {!isScanning &&
                            searchOptionsFiltered.map((group, index) => {
                                return <Select.OptGroup
                                    key={index}
                                    label={
                                        <div className="flex justify-content-between align-items-center">
                                            <b className="primary_color">{group?.label}</b>
                                            <i
                                                className={`pi pi-angle-${searchColapse.includes(group.key) ? "down" : "up"
                                                    } cursor-pointer`}
                                                onClick={() => {
                                                    handleCollapseOptions(group.key);
                                                }}
                                            ></i>
                                        </div>
                                    }
                                >
                                    {group.options.map((item) => (
                                        <Select.Option
                                            key={`${group.key}-${item.value}`}
                                            value={`${group.key}-${item.value}`}
                                            label={item.label}
                                            className="px-2"
                                            data={item}
                                        >
                                            <div
                                                className="flex align-items-center gap-2"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                }}
                                            >
                                                <Avatar
                                                    style={{
                                                        background: CHARTCOLORS[item?.label?.charAt(0).toUpperCase()],

                                                        width: 30,
                                                        height: 30,
                                                    }}
                                                    src={item?.image}
                                                >
                                                    {item?.label?.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <div className="flex gap-3 w-full">
                                                    <div className="w-full">{item.label}</div>
                                                    {item?.type == "VT" && (
                                                        <div className="text-right ml-3">
                                                            <span className="ml-1 primary_bold_text">
                                                                {formatCurrency(item?.ton || 0)}
                                                            </span>
                                                        </div>
                                                    )}

                                                </div>
                                            </div>
                                        </Select.Option>
                                    ))}

                                </Select.OptGroup>
                            })}
                    </Select>
                </div>

            </div>

            <div className="h-full min-h-0 ">
                <Form
                    form={itemForm}
                    component={false}
                    initialValues={{}}
                    onValuesChange={handleChangeValue}
                >
                    <PerformanceTable
                        selectable
                        columns={columns}
                        data={dataRefund}
                        onSelectedRowKeyChange={handleSelectedRowKeyChange}
                    />
                </Form>
            </div>
        </div>
    )

}

export default Refund;