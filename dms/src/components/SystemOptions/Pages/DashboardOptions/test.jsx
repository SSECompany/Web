// import { Button, Checkbox, Divider, notification, Popover, Select } from "antd";
// import React, { useState } from "react";
// import SimpleCharts from "../../../../pages/Dashboard/Pages/SimpleCharts/SimpleCharts";
// import Statistics from "../../../../pages/Dashboard/Pages/Statistics/Statistics";
// import { SIMPLECHARTS, STATISTICS_ICONS } from "../../../../utils/constants";
// import jwt from "../../../../utils/jwt";
// import HeaderTableBar from "../../../ReuseComponents/HeaderTableBar";
// import "./DashboardOptions.css";
// import TransferForm from "./Transfer/TransferForm";

// const DashboardOptions = () => {
//   const [statisticSelected, setstatisticSelected] = useState(
//     jwt.getStatistictboardSetting()
//   );
//   const [simpleChartSelected, setSimpleChartSelected] = useState(
//     jwt.getSimpleChartboardSetting()
//   );

//   const [reportSelected, setReportSelected] = useState(
//     jwt.getDashboardReport() || "SOReport"
//   );

//   const content = (type) => {
//     return (
//       <div className="Dashboard__options__image__popover">
//         <img
//           src={
//             type == "totaly"
//               ? require("../../../../media/Images/totaly_infos.png")
//               : type == "simpleChart"
//               ? require("../../../../media/Images/simple_chart.png")
//               : ""
//           }
//           alt="123"
//         />
//       </div>
//     );
//   };

//   const handleSelect = (checked, item) => {
//     if (checked) {
//       setstatisticSelected([...statisticSelected, item]);
//     } else {
//       setstatisticSelected(
//         statisticSelected.filter((selected) => selected !== item)
//       );
//     }
//   };

//   const handleSimpleChartSelect = (checked, item) => {
//     if (checked) {
//       setSimpleChartSelected([...simpleChartSelected, item]);
//     } else {
//       setSimpleChartSelected(
//         simpleChartSelected.filter((selected) => selected !== item)
//       );
//     }
//   };

//   const handleSave = () => {
//     jwt.setStatisticboardSetting(statisticSelected);
//     jwt.setSimpleChartboardSetting(simpleChartSelected);
//     jwt.setDashboardReport(reportSelected);

//     notification.success({
//       message: `Thực hiện thành công`,
//     });
//   };

//   return (
//     <div>
//       <Popover content={content("totaly")} trigger="hover">
//         <div className="w-fit mb-2">
//           <HeaderTableBar
//             name={"Thông tin tổng hợp"}
//             title={
//               <span>
//                 Thông tin tổng hợp (
//                 <span className="primary_bold_text">
//                   {statisticSelected.length}
//                 </span>
//                 /4)
//               </span>
//             }
//           />
//         </div>
//       </Popover>

//       <div className="Dashboard__statistics_list">
//         {Object.keys(STATISTICS_ICONS).map((item, index) => (
//           <div
//             key={index}
//             className={`p-2 Dashboard__statistics ${
//               statisticSelected.findIndex((arr) => item == arr) >= 0
//                 ? "Dashboard__statistics__selected"
//                 : ""
//             }`}
//           >
//             <div className="flex justify-content-between align-items-center">
//               <span className="primary_bold_text">
//                 {STATISTICS_ICONS[item].title}
//               </span>
//               <Checkbox
//                 defaultChecked={
//                   jwt
//                     .getStatistictboardSetting()
//                     .findIndex((arr) => item == arr) >= 0
//                 }
//                 disabled={
//                   statisticSelected.findIndex((arr) => item == arr) < 0 &&
//                   statisticSelected.length >= 4
//                 }
//                 onChange={(checkbox) => {
//                   handleSelect(checkbox.target.checked, item);
//                 }}
//               ></Checkbox>
//             </div>
//             <Divider className="mb-2" style={{ margin: "5px 0px" }} />
//             <Statistics type={item} />
//           </div>
//         ))}
//       </div>

//       <Popover content={content("simpleChart")} trigger="hover">
//         <div className="w-fit mb-2">
//           <HeaderTableBar
//             name={"Số liệu chung"}
//             title={
//               <span>
//                 Số liệu chung (
//                 <span className="primary_bold_text">
//                   {simpleChartSelected.length}
//                 </span>
//                 /4)
//               </span>
//             }
//           />
//         </div>
//       </Popover>

//       <div className="Dashboard__simple__chart__list">
//         {Object.keys(SIMPLECHARTS).map((item, index) => (
//           <div
//             key={index}
//             className={`p-2 Dashboard__statistics ${
//               simpleChartSelected.findIndex((arr) => item == arr) >= 0
//                 ? "Dashboard__statistics__selected"
//                 : ""
//             }`}
//           >
//             <div className="flex justify-content-between align-items-center">
//               <span className="primary_bold_text">
//                 {SIMPLECHARTS[item].title}
//               </span>
//               <Checkbox
//                 defaultChecked={
//                   jwt
//                     .getSimpleChartboardSetting()
//                     .findIndex((arr) => item == arr) >= 0
//                 }
//                 disabled={
//                   simpleChartSelected.findIndex((arr) => item == arr) < 0 &&
//                   simpleChartSelected.length >= 4
//                 }
//                 onChange={(checkbox) => {
//                   handleSimpleChartSelect(checkbox.target.checked, item);
//                 }}
//               ></Checkbox>
//             </div>
//             <Divider className="mb-2" style={{ margin: "5px 0px" }} />
//             <SimpleCharts
//               type={SIMPLECHARTS[item].type}
//               title={SIMPLECHARTS[item].title}
//               key={SIMPLECHARTS[item].store}
//             />
//           </div>
//         ))}
//       </div>

//       <div className="w-fit mb-2">
//         <HeaderTableBar name={"Báo cáo"} title={<span>Báo cáo</span>} />
//       </div>

//       <div className="dashboard__simple__chart__items__container">
//         <div
//           className="p-2"
//           style={{
//             gridColumn: "1/4",
//             borderRadius: "12px",
//             background: "white",
//           }}
//         >
//           <img
//             style={{ borderRadius: "6px", background: "white" }}
//             src={require("../../../../media/Images/dashboard_report.png")}
//             alt=""
//           />
//         </div>
//         <div>
//           <p className="default_header_label">Loại báo cáo</p>

//           <Select
//             className="w-full mt-3"
//             defaultValue={reportSelected}
//             onSelect={(selected) => {
//               setReportSelected(selected);
//             }}
//             options={[
//               { value: "SOReport", label: "Báo cáo bán hàng" },
//               { value: "POReport", label: "Báo cáo mua hàng" },
//               { value: "NXTReport", label: "Tổng hợp nhập xuất tồn" },
//             ]}
//           />
//         </div>
//       </div>

//       <div className="w-full text-center">
//         <Button onClick={handleSave} className="mt-2" type={"primary"}>
//           Lưu
//         </Button>
//       </div>

//       <TransferForm />
//     </div>
//   );
// };

// export default DashboardOptions;
