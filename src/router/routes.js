import { createBrowserRouter } from "react-router-dom";
import homeRoutes from "./home";

const routes = [...homeRoutes];
const router = createBrowserRouter(routes);

let homeRoute = routes.filter((item) => item.path == "/")[0].children;

const navbarObject = homeRoute;

export { routes, navbarObject };
export default router;
