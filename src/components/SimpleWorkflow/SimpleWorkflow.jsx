import { useEffect } from "react";
import "./SimpleWorkflow.css";

const SimpleWorkflow = () => {
  useEffect(() => {
    // Đảm bảo title được cập nhật đúng
    document.title = "WORKFLOW";

    // Thêm class để đảm bảo styling đúng
    document.body.classList.add("workflow-page");

    // Function để update navbar
    const updateNavbar = () => {
      // Thay đổi text của system selector từ "DMS" thành "Workflow"
      const systemSelector = document.querySelector(".system_selector");
      if (systemSelector) {
        const textNode = systemSelector.childNodes[0];
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          textNode.textContent = "Workflow";
        }
      }

      // Tìm và highlight workflow menu item
      const workflowItems = document.querySelectorAll("span");
      workflowItems.forEach((span) => {
        if (span.textContent.includes("Workflow")) {
          span.style.color = "#1677ff";
          span.style.fontWeight = "bold";
          // Thêm active class cho parent nếu có
          const parent =
            span.closest("li") || span.closest(".navbar_route_item");
          if (parent) {
            parent.classList.add("active");
          }
        }
      });
    };

    // Gọi ngay lập tức
    updateNavbar();

    // Gọi lại sau 100ms để đảm bảo
    const timer1 = setTimeout(updateNavbar, 100);

    // Gọi lại sau 500ms để đảm bảo chắc chắn
    const timer2 = setTimeout(updateNavbar, 500);

    // Lắng nghe sự kiện DOMContentLoaded để đảm bảo navbar đã render
    document.addEventListener("DOMContentLoaded", updateNavbar);

    // Cleanup khi component unmount
    return () => {
      document.body.classList.remove("workflow-page");
      clearTimeout(timer1);
      clearTimeout(timer2);
      document.removeEventListener("DOMContentLoaded", updateNavbar);

      // Khôi phục lại "DMS" khi rời khỏi trang workflow
      const systemSelector = document.querySelector(".system_selector");
      if (systemSelector) {
        const textNode = systemSelector.childNodes[0];
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          textNode.textContent = "DMS";
        }
      }
    };
  }, []);
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "24px",
      }}
    >
      {/* Header Section */}
      <div
        style={{
          background: "#fff",
          padding: "24px 0",
          textAlign: "center",
          borderBottom: "1px solid #f0f0f0",
          marginBottom: "32px",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "600",
            color: "#262626",
            margin: "0 0 16px 0",
          }}
        >
          🎯 WORKFLOW
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "#8c8c8c",
            margin: "0 0 16px 0",
            fontWeight: "400",
          }}
        >
          Chào mừng bạn đến với hệ thống quản lý dự án và công việc
        </p>
        <a
          href="/workflow/dashboard"
          style={{
            display: "inline-block",
            background: "#1890ff",
            color: "white",
            padding: "8px 16px",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          📊 Vào Dashboard Workflow
        </a>
      </div>

      {/* Main Content */}
      <div style={{ padding: "0" }}>
        <div
          className="workflow-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "24px",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {/* Project Management Card */}
          <div
            className="workflow-card"
            style={{
              background: "#fff",
              borderRadius: "8px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              border: "1px solid #f0f0f0",
              transition: "box-shadow 0.2s ease",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  background: "#1890ff",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  fontSize: "24px",
                  color: "#fff",
                }}
              >
                📊
              </div>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#262626",
                  margin: "0 0 8px 0",
                }}
              >
                Quản lý dự án
              </h2>
              <p style={{ color: "#8c8c8c", margin: "0", fontSize: "14px" }}>
                Quản lý toàn diện các dự án từ khởi tạo đến hoàn thành
              </p>
            </div>

            <div style={{ marginBottom: "24px" }}>
              {[
                "Thêm mới/sửa/xóa/xem/in dự án",
                "Quản lý tài liệu dự án",
                "Quản lý trao đổi về dự án",
                "Quản lý nguồn lực nhân sự dự án",
                "Báo cáo tiến độ/khối lượng/chi phí/KPI",
              ].map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: index < 4 ? "1px solid #f1f5f9" : "none",
                  }}
                >
                  <span
                    style={{
                      color: "#10b981",
                      marginRight: "12px",
                      fontSize: "16px",
                    }}
                  >
                    ✅
                  </span>
                  <span style={{ color: "#475569", fontSize: "14px" }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <a
              href="/workflow/project-management/projects"
              style={{
                display: "block",
                background: "#1890ff",
                color: "white",
                padding: "10px 16px",
                borderRadius: "6px",
                textDecoration: "none",
                textAlign: "center",
                fontWeight: "500",
                fontSize: "14px",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => (e.target.style.background = "#40a9ff")}
              onMouseLeave={(e) => (e.target.style.background = "#1890ff")}
            >
              Xem danh sách dự án
            </a>
          </div>

          {/* Task Management Card */}
          <div
            className="workflow-card"
            style={{
              background: "#fff",
              borderRadius: "8px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              border: "1px solid #f0f0f0",
              transition: "box-shadow 0.2s ease",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  background: "#52c41a",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  fontSize: "24px",
                  color: "#fff",
                }}
              >
                📋
              </div>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#262626",
                  margin: "0 0 8px 0",
                }}
              >
                Quản lý công việc
              </h2>
              <p style={{ color: "#8c8c8c", margin: "0", fontSize: "14px" }}>
                Theo dõi và quản lý hiệu quả các công việc hàng ngày
              </p>
            </div>

            <div style={{ marginBottom: "24px" }}>
              {[
                "Thêm mới/sửa/xóa/xem/in công việc",
                "Giao việc cho nhân viên",
                "Nhắc việc tự động",
                "Báo cáo tiến độ công việc",
                "Báo cáo KPI hoàn thành công việc",
              ].map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: index < 4 ? "1px solid #f1f5f9" : "none",
                  }}
                >
                  <span
                    style={{
                      color: "#10b981",
                      marginRight: "12px",
                      fontSize: "16px",
                    }}
                  >
                    ✅
                  </span>
                  <span style={{ color: "#475569", fontSize: "14px" }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <a
              href="/workflow/task-management/tasks"
              style={{
                display: "block",
                background: "#52c41a",
                color: "white",
                padding: "10px 16px",
                borderRadius: "6px",
                textDecoration: "none",
                textAlign: "center",
                fontWeight: "500",
                fontSize: "14px",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => (e.target.style.background = "#73d13d")}
              onMouseLeave={(e) => (e.target.style.background = "#52c41a")}
            >
              Xem danh sách công việc
            </a>
          </div>
        </div>

        {/* Quick Links Section */}
        <div
          style={{
            maxWidth: "1200px",
            margin: "32px auto 0",
            background: "#fff",
            borderRadius: "8px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            border: "1px solid #f0f0f0",
          }}
        >
          <h3
            style={{
              textAlign: "center",
              fontSize: "18px",
              fontWeight: "600",
              color: "#262626",
              marginBottom: "24px",
            }}
          >
            🔗 Truy cập nhanh
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "16px",
            }}
          >
            {[
              {
                href: "/workflow/dashboard",
                icon: "📊",
                title: "Dashboard Workflow",
                color: "#667eea",
              },
              {
                href: "/workflow/project-management/projects",
                icon: "📊",
                title: "Danh sách dự án",
                color: "#667eea",
              },
              {
                href: "/workflow/project-management/reports/progress",
                icon: "📈",
                title: "Báo cáo tiến độ dự án",
                color: "#764ba2",
              },
              {
                href: "/workflow/task-management/tasks",
                icon: "📋",
                title: "Danh sách công việc",
                color: "#667eea",
              },
              {
                href: "/workflow/task-management/assignment",
                icon: "👤",
                title: "Giao việc",
                color: "#764ba2",
              },
              {
                href: "/workflow/task-management/reminders",
                icon: "🔔",
                title: "Nhắc việc",
                color: "#667eea",
              },
              {
                href: "/workflow/task-management/reports/progress",
                icon: "📊",
                title: "Báo cáo tiến độ công việc",
                color: "#764ba2",
              },
            ].map((link, index) => (
              <a
                key={index}
                href={link.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  background: "#fafafa",
                  borderRadius: "6px",
                  textDecoration: "none",
                  color: "#262626",
                  transition: "all 0.2s ease",
                  border: "1px solid #f0f0f0",
                  fontSize: "14px",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#f0f0f0";
                  e.target.style.color = "#1890ff";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#fafafa";
                  e.target.style.color = "#262626";
                }}
              >
                <span style={{ fontSize: "16px", marginRight: "8px" }}>
                  {link.icon}
                </span>
                <span style={{ fontWeight: "400" }}>{link.title}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleWorkflow;
