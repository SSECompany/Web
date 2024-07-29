import CheckinReport from "../components/Report/Pages/CheckinReport/CheckinReport";
import LocationReport from "../components/Report/Pages/LocationReport/LocationReport";
import ReportLayout from "../components/Report/Pages/ReportLayout/ReportLayout";

const reportsRoute = [
  {
    label: "Báo cáo",
    claims: "Permissions.reports",
    path: "reports",
    element: <ReportLayout />,
    children: [
      {
        label: "Báo cáo viếng thăm",
        claims: "Permissions.reports.checkinReport",
        path: "checkin",
        children: [],
        element: <CheckinReport />,
      },
      {
        label: "Báo cáo vị trí",
        claims: "Permissions.reports.locationReport",
        path: "locationReport",
        children: [],
        element: <LocationReport />,
      },
    ],
  },
];

export default reportsRoute;
