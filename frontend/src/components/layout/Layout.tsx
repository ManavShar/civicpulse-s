import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MainContent } from "./MainContent";

export function Layout() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <MainContent>
          <Outlet />
        </MainContent>
      </div>
    </div>
  );
}
