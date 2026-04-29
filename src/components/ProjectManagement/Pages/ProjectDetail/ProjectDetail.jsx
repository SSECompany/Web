import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { getUserInfo } from "../../../../store/selectors/Selectors";
import {
  Card,
  Descriptions,
  Tag,
  Space,
  Tabs,
  Row,
  Col,
  Button,
  Table,
  Avatar,
  Typography,
  Progress,
  List,
  Upload,
  Input,
  InputNumber,
  Form,
  Mentions,
  Timeline,
  Select,
  Modal,
  notification,
  Statistic,
  Tooltip,
  Empty,
  Spin,
} from "antd";
import {
  FileTextOutlined,
  TeamOutlined,
  MessageOutlined,
  PaperClipOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  HistoryOutlined,
  PushpinOutlined,
  LikeOutlined,
  CommentOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileWordOutlined,
  FileUnknownOutlined,
  FileExcelOutlined,
  FilterOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { apiGetProject } from "../../API";
import {
  getWorkflowProjectDetail,
  getWorkflowProjectDocuments,
  createWorkflowProjectDocument,
  deleteWorkflowProjectDocument,
  downloadWorkflowProjectDocument,
  getWorkflowProjectPosts,
  createWorkflowProjectPost,
  getWorkflowProjectMembers,
  createWorkflowProjectMember,
  deleteWorkflowProjectMember,
  getWorkflowProjectDashboard,
  getWorkflowProjectUsers,
  getWorkflowProjectTasks,
  getWorkflowProjectTaskStats,
  getWorkflowRelationsProjectDashboard,
  getWorkflowDropdownProjectManagers,
  deleteWorkflowProject,
  getWorkflowProjectActivities,
} from "../../../WorkflowApp/API/workflowApi";
import axiosInstanceRootApi from "../../../../utils/axiosInstanceRootApi";
import ModalAddProject from "../../Modals/ModalAddProject/ModalAddProject";
import "./ProjectDetail.css";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Dragger } = Upload;
const { Option } = Select;
const { Text, Title, Paragraph } = Typography;

const activityTypeLabels = {
  // Activity types từ API - chỉ giữ các loại liên quan đến dự án
  TASK_CREATED: "Tạo công việc",
  TASK_UPDATED: "Cập nhật công việc",
  TASK_ASSIGNED: "Giao việc",
  TASK_DELETED: "Xóa công việc",
  DOCUMENT_UPLOADED: "Tải lên tài liệu",
  DOCUMENT_DELETED: "Xóa tài liệu",
  POST_CREATED: "Tạo bài đăng",
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const userInfo = useSelector(getUserInfo);
  
  // Detect if we're in workflow context
  const isInWorkflow = location.pathname.includes('/workflow');
  
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || "overview");
  const [postForm] = Form.useForm();
  const [memberForm] = Form.useForm();
  const [documentFilter, setDocumentFilter] = useState("ALL");
  const [postFilter, setPostFilter] = useState("ALL");
  const [logTypeFilter, setLogTypeFilter] = useState("ALL");
  const [logUserFilter, setLogUserFilter] = useState("ALL");
  const [logSearchKeyword, setLogSearchKeyword] = useState("");

  // Data for tabs - sẽ được load từ API sau
  const [documents, setDocuments] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postAttachments, setPostAttachments] = useState([]);
  const [resources, setResources] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projectActivities, setProjectActivities] = useState([]);
  const [openAddMemberModal, setOpenAddMemberModal] = useState(false);
  const [projectManagers, setProjectManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [openEditProjectModal, setOpenEditProjectModal] = useState(false);
  const [currentProjectRecord, setCurrentProjectRecord] = useState(null);
  
  // State cho các modal xác nhận xóa
  const [deleteDocumentModal, setDeleteDocumentModal] = useState({ visible: false, documentId: null, documentName: '' });
  const [deleteMemberModal, setDeleteMemberModal] = useState({ visible: false, memberId: null, memberName: '' });

  useEffect(() => {
    if (id) {
      loadProject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isInWorkflow]);

  // Load documents ngay khi project đã load để có count chính xác cho tab
  useEffect(() => {
    if (id && project && isInWorkflow) {
      loadDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, project, isInWorkflow]);

  useEffect(() => {
    if (id && project) {
      // Load dữ liệu cho các tab khi project đã load
      // Documents đã được load ở useEffect trên để có count chính xác
      if (activeTab === "tasks") {
        loadTasks();
      } else if (activeTab === "documents") {
        // Documents đã được load ở useEffect trên, không cần reload
        // Chỉ reload nếu user thực hiện action (upload/delete) - sẽ được xử lý trong handler
      } else if (activeTab === "posts") {
        loadPosts();
      } else if (activeTab === "resources") {
        loadMembers();
      } else if (activeTab === "logs" || activeTab === "activities") {
        loadActivities();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, activeTab, project, isInWorkflow]);

  // Refresh tasks khi có activity TASK_CREATED (nếu đang ở tab tasks)
  useEffect(() => {
    if (projectActivities && projectActivities.length > 0 && activeTab === "tasks") {
      // Kiểm tra xem có activity TASK_CREATED mới không (trong 10 giây gần đây)
      const recentTaskCreated = projectActivities.find(activity => 
        activity.type === 'TASK_CREATED' && 
        activity.createdDate
      );
      
      if (recentTaskCreated) {
        // Refresh tasks sau 1 giây để đảm bảo task đã được lưu vào DB
        const timeoutId = setTimeout(() => {
          console.log("[ProjectDetail] Detected TASK_CREATED activity, refreshing task list...");
          loadTasks();
        }, 1000);
        
        return () => clearTimeout(timeoutId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectActivities, activeTab]);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state?.activeTab]);

  const loadProject = async () => {
    if (!id) {
      notification.error({
        message: "Lỗi",
        description: "Không tìm thấy ID dự án",
      });
      navigate(isInWorkflow ? "/workflow/project-management" : "/project-management");
      return;
    }

    setLoading(true);
    try {
      if (isInWorkflow) {
        // Gọi API workflow
        const workflowData = await getWorkflowProjectDetail({
          projectId: parseInt(id),
          companyCode: "DVCS01",
        });
        
        if (workflowData) {
          // Map dữ liệu từ API workflow sang format component đang dùng
          setProject({
            id: workflowData.Id || workflowData.id,
            code: workflowData.ProjectCode || workflowData.projectCode,
            name: workflowData.ProjectName || workflowData.projectName || "",
            status: workflowData.Status || workflowData.status || "",
            priority: workflowData.Priority || workflowData.priority || "",
            manager: workflowData.ProjectManagerName || workflowData.projectManagerName || "",
            managerId: workflowData.ProjectManagerId || workflowData.projectManagerId,
            managerEmail: workflowData.ProjectManagerEmail || workflowData.projectManagerEmail,
            managerPhone: workflowData.ProjectManagerPhone || workflowData.projectManagerPhone,
            progress: workflowData.Progress || workflowData.progress || 0,
            startDate: workflowData.StartDate || workflowData.startDate,
            endDate: workflowData.EndDate || workflowData.endDate,
            description: workflowData.Description || workflowData.description || "",
            budget: workflowData.Budget || workflowData.budget || 0,
            spentBudget: workflowData.BudgetUsed || workflowData.budgetUsed || 0,
            clientName: workflowData.ClientName || workflowData.clientName || "",
            healthStatus: workflowData.HealthStatus || workflowData.healthStatus || "",
            orgUnitId: workflowData.OrgUnitId || workflowData.orgUnitId,
            orgUnitName: workflowData.OrgUnitName || workflowData.orgUnitName || "",
            orgUnitCode: workflowData.OrgUnitCode || workflowData.orgUnitCode || "",
            createdBy: workflowData.CreatedBy || workflowData.createdBy,
            updatedBy: workflowData.UpdatedBy || workflowData.updatedBy,
            createdDate: workflowData.datetime0 || workflowData.createdDate,
            updatedDate: workflowData.datetime2 || workflowData.updatedDate,
          });
          
          // Load thêm dữ liệu từ các API relations
          try {
            const now = new Date();
            const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
            
            // Load project users
            const projectUsersResponse = await getWorkflowProjectUsers({
              companyCode: "DVCS01",
              projectId: parseInt(id),
            });
            if (projectUsersResponse && Array.isArray(projectUsersResponse)) {
              // Map vào resources nếu cần
              setResources(projectUsersResponse.map(user => ({
                id: user.Id || user.id,
                name: user.FullName || user.fullName || "",
                email: user.Email || user.email || "",
                role: user.Role || user.role || "",
                avatar: user.Avatar || user.avatar,
              })));
            }
            
            // Load project tasks
            // Sử dụng getWorkflowProjectTasks để lấy TẤT CẢ tasks của project (không filter theo userId)
            const projectTasksResponse = await getWorkflowProjectTasks({
              companyCode: "DVCS01",
              yyyymm: yyyymm,
              projectId: parseInt(id),
              pageIndex: 1,
              pageSize: 100,
            });
            
            if (projectTasksResponse && Array.isArray(projectTasksResponse)) {
              const mappedTasks = projectTasksResponse.map(task => ({
                id: task.Id || task.id,
                code: task.TaskCode || task.taskCode || "",
                title: task.TaskName || task.taskName || task.Name || task.name || "",
                name: task.TaskName || task.taskName || task.Name || task.name || "",
                status: task.Status || task.status || "PENDING",
                priority: task.Priority || task.priority || "MEDIUM",
                progress: task.Progress || task.progress || 0,
                assignee: task.AssignedToName || task.assignedToName || task.AssignedTo || "",
                assignedTo: task.AssignedToName || task.assignedToName || task.AssignedTo || "",
                dueDate: task.DueDate || task.dueDate,
              }));
              setTasks(mappedTasks);
              console.log("[loadProject] Loaded tasks:", mappedTasks);
            }
            
            // Load project task stats
            const projectTaskStatsResponse = await getWorkflowProjectTaskStats({
              companyCode: "DVCS01",
              yyyymm: yyyymm,
              projectId: parseInt(id),
            });
            // Có thể sử dụng stats để hiển thị trong overview tab
            
            // Load project dashboard
            const projectDashboardResponse = await getWorkflowRelationsProjectDashboard({
              companyCode: "DVCS01",
              projectId: parseInt(id),
              yyyymm: yyyymm,
            });
            // Có thể sử dụng dashboard data để hiển thị trong overview tab
          } catch (error) {
            // Không block nếu các API này fail
          }
        } else {
          notification.warning({
            message: "Không tìm thấy dự án",
            description: "Dự án không tồn tại hoặc đã bị xóa",
          });
          navigate(isInWorkflow ? "/workflow/project-management" : "/project-management");
        }
      } else {
        // Gọi API cũ nếu không ở trong workflow context
        const response = await apiGetProject({ projectId: id });
        if (response?.data) {
          setProject(response.data);
        } else {
          notification.warning({
            message: "Không tìm thấy dự án",
            description: "Dự án không tồn tại hoặc đã bị xóa",
          });
          navigate("/project-management");
        }
      }
    } catch (error) {
      console.error("Error loading project:", error);
      notification.error({
        message: "Lỗi",
        description: "Không thể tải thông tin dự án. Vui lòng thử lại sau.",
      });
      navigate(isInWorkflow ? "/workflow/project-management" : "/project-management");
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    if (!id || !isInWorkflow) return;
    
    try {
      const now = new Date();
      const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      // Sử dụng getWorkflowProjectTasks để lấy TẤT CẢ tasks của project (không filter theo userId)
      // Vì tab "Công việc" cần hiển thị tất cả tasks, không chỉ tasks của user hiện tại
      const projectTasksResponse = await getWorkflowProjectTasks({
        companyCode: "DVCS01",
        yyyymm: yyyymm,
        projectId: parseInt(id),
        pageIndex: 1,
        pageSize: 100,
      });
      
      if (projectTasksResponse && Array.isArray(projectTasksResponse)) {
        const mappedTasks = projectTasksResponse.map(task => ({
          id: task.Id || task.id,
          code: task.TaskCode || task.taskCode || "",
          title: task.TaskName || task.taskName || task.Name || task.name || "",
          name: task.TaskName || task.taskName || task.Name || task.name || "",
          status: task.Status || task.status || "PENDING",
          priority: task.Priority || task.priority || "MEDIUM",
          progress: task.Progress || task.progress || 0,
          assignee: task.AssignedToName || task.assignedToName || task.AssignedTo || "",
          assignedTo: task.AssignedToName || task.assignedToName || task.AssignedTo || "",
          dueDate: task.DueDate || task.dueDate,
        }));
        setTasks(mappedTasks);
        console.log("[loadTasks] Loaded tasks:", mappedTasks);
      } else {
        console.log("[loadTasks] No tasks found or invalid response:", projectTasksResponse);
        setTasks([]);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      setTasks([]);
    }
  };

  const loadDocuments = async () => {
    if (!id || !isInWorkflow) return;
    
    try {
      const result = await getWorkflowProjectDocuments({
        projectId: parseInt(id),
        companyCode: "DVCS01",
      });
      
      // Map dữ liệu từ API sang format component
      const mappedDocuments = Array.isArray(result) ? result.map((doc) => ({
        id: doc.Id || doc.id,
        name: doc.FileName || doc.fileName || "",
        size: doc.FileSize ? `${(doc.FileSize / 1024 / 1024).toFixed(2)} MB` : "0 MB",
        uploadedBy: doc.UploadedByName || doc.uploadedByName || "",
        uploadedDate: doc.UploadedDate || doc.uploadedDate || dayjs().format("YYYY-MM-DD"),
        type: doc.FileType || doc.fileType || "other",
        filePath: doc.FilePath || doc.filePath || "",
        fileSize: doc.FileSize || doc.fileSize || 0,
      })) : [];
      
      setDocuments(mappedDocuments);
    } catch (error) {
      console.error("Error loading documents:", error);
    }
  };

  const loadPosts = async () => {
    if (!id || !isInWorkflow) return;
    
    setLoadingPosts(true);
    try {
      const result = await getWorkflowProjectPosts({
        projectId: parseInt(id),
        companyCode: "DVCS01",
        pageIndex: 1,
        pageSize: 100,
      });
      
      console.log("Posts API response:", result);
      
      // Map dữ liệu từ API sang format component
      const mappedPosts = Array.isArray(result) ? result.map((post) => {
        // Parse MentionsJson - xử lý cả string và JSON
        let mentions = [];
        if (post.MentionsJson) {
          try {
            // Nếu là string JSON hợp lệ
            if (typeof post.MentionsJson === 'string' && post.MentionsJson.trim().startsWith('[')) {
              mentions = JSON.parse(post.MentionsJson);
            } else if (typeof post.MentionsJson === 'string' && post.MentionsJson !== 'string' && post.MentionsJson.trim() !== '') {
              // Nếu là string nhưng không phải "string", thử parse
              mentions = JSON.parse(post.MentionsJson);
            } else if (Array.isArray(post.MentionsJson)) {
              mentions = post.MentionsJson;
            }
          } catch (e) {
            // Nếu parse lỗi, để mảng rỗng
            console.warn("Error parsing MentionsJson:", e, post.MentionsJson);
            mentions = [];
          }
        }
        
        return {
          id: post.Id || post.id,
          author: post.CreatedByName || post.createdByName || "Unknown",
          content: post.Content || post.content || "",
          mentions: mentions,
          attachments: [],
          createdDate: post.CreatedDate ? dayjs(post.CreatedDate).format("DD/MM/YYYY HH:mm") : dayjs().format("DD/MM/YYYY HH:mm"),
          likes: post.LikesCount || post.likesCount || 0,
          comments: post.CommentsCount || post.commentsCount || 0,
          isPinned: post.IsPinned || post.isPinned || false,
        };
      }) : [];
      
      console.log("Mapped posts:", mappedPosts);
      setPosts(mappedPosts);
    } catch (error) {
      console.error("Error loading posts:", error);
      notification.error({
        message: "Lỗi",
        description: "Không thể tải danh sách bài viết. Vui lòng thử lại sau.",
      });
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadActivities = async () => {
    if (!id || !isInWorkflow) return;
    
    try {
      const result = await getWorkflowProjectActivities({
        projectId: parseInt(id),
        companyCode: "DVCS01",
        pageIndex: 1,
        pageSize: 100,
      });
      
      // Map dữ liệu từ API sang format component
      const mappedActivities = Array.isArray(result) ? result.map((activity) => ({
        id: activity.Id || activity.id,
        type: activity.ActivityType || activity.activityType || "unknown",
        user: activity.TriggeredByName || activity.triggeredByName || activity.TriggeredBy || "Unknown",
        action: activity.Description || activity.description || "",
        target: activity.EntityName || activity.entityName || activity.EntityCode || activity.entityCode || "",
        timestamp: activity.datetime0 || activity.ActivityDate || activity.activityDate || new Date(),
        details: activity.Description || activity.description || "",
        entityType: activity.EntityType || activity.entityType || "PROJECT",
        entityId: activity.EntityId || activity.entityId,
        entityCode: activity.EntityCode || activity.entityCode,
      })) : [];
      
      setProjectActivities(mappedActivities);
    } catch (error) {
      console.error("Error loading activities:", error);
      // Nếu API chưa có, giữ mảng rỗng
      setProjectActivities([]);
    }
  };

  const loadMembers = async () => {
    if (!id || !isInWorkflow) return;
    
    try {
      const result = await getWorkflowProjectMembers({
        projectId: parseInt(id),
        companyCode: "DVCS01",
      });
      
      // Map dữ liệu từ API sang format component
      let mappedMembers = Array.isArray(result) ? result.map((member) => ({
        id: member.Id || member.id || member.MemberId || member.memberId || member.UserId || member.userId,
        memberId: member.MemberId || member.memberId || member.Id || member.id,
        userId: member.UserId || member.userId,
        name: member.UserName || member.userName || member.FullName || member.fullName || "",
        role: member.Role || member.role || "MEMBER",
        allocation: member.Allocation || member.allocation || 0,
        startDate: member.StartDate || member.startDate,
        endDate: member.EndDate || member.endDate,
        email: member.Email || member.email || "",
      })) : [];
      
      // Thêm PM chính vào đầu danh sách nếu có
      if (project && project.managerId) {
        const pmExists = mappedMembers.some(m => m.userId === project.managerId);
        if (!pmExists) {
          mappedMembers = [{
            id: `pm-${project.managerId}`,
            memberId: null, // PM chính không có trong WorkflowProjectMembers
            userId: project.managerId,
            name: project.manager || "PM Chính",
            role: "PROJECT_MANAGER",
            allocation: 100,
            startDate: project.startDate,
            endDate: project.endDate,
            email: project.managerEmail || "",
            isPrimaryManager: true, // Đánh dấu là PM chính
          }, ...mappedMembers];
        } else {
          // Nếu PM chính đã có trong members, đảm bảo role đúng
          mappedMembers = mappedMembers.map(m => 
            m.userId === project.managerId 
              ? { ...m, role: "PROJECT_MANAGER", isPrimaryManager: true }
              : m
          );
        }
      }
      
      // Sắp xếp: PM chính ở đầu, sau đó CO-PM, cuối cùng là thành viên
      mappedMembers.sort((a, b) => {
        const getRolePriority = (role) => {
          if (role === "PROJECT_MANAGER" || role === "PM") return 1;
          if (role === "CO_PROJECT_MANAGER" || role === "CO_PM") return 2;
          return 3;
        };
        return getRolePriority(a.role) - getRolePriority(b.role);
      });
      
      console.log("[loadMembers] Mapped members:", mappedMembers);
      
      setResources(mappedMembers);
    } catch (error) {
      console.error("Error loading members:", error);
    }
  };

  const handleCreatePost = async (values) => {
    if (!id || !isInWorkflow) {
      notification.warning({
        message: "Thông báo",
        description: "Chức năng này chỉ hoạt động trong workflow context",
      });
      return;
    }

    try {
      const postData = {
        companyCode: "DVCS01",
        projectId: parseInt(id),
        content: values.content || "",
        isPinned: false,
        mentionsJson: values.mentions ? JSON.stringify(values.mentions) : "[]",
        createdBy: 1, // TODO: Lấy từ userInfo
      };

      const result = await createWorkflowProjectPost(postData);
      
      // Reload posts
      await loadPosts();
      
      setPostAttachments([]);
      postForm.resetFields();
      notification.success({
        message: "Đã đăng bài",
        description: "Nội dung trao đổi đã được chia sẻ với dự án.",
      });
    } catch (error) {
      console.error("Error creating post:", error);
      notification.error({
        message: "Lỗi",
        description: "Không thể đăng bài. Vui lòng thử lại sau.",
      });
    }
  };

  const handleRemoveAttachment = (file) => {
    setPostAttachments((prev) => prev.filter((item) => item.uid !== file.uid));
  };

  const handleBeforeUpload = (file) => {
    setPostAttachments((prev) => [...prev, file]);
    return false;
  };

  const mentionOptions = resources.map((member) => ({
    label: member.name,
    value: member.name,
  }));

  const currentUserName = "Nguyễn Văn A";

  const documentTypeOptions = useMemo(() => {
    const uniqueTypes = Array.from(
      new Set(documents.map((doc) => (doc.type || "OTHER").toUpperCase()))
    );
    return ["ALL", ...uniqueTypes];
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    if (documentFilter === "ALL") {
      return documents;
    }
    return documents.filter(
      (doc) => (doc.type || "OTHER").toUpperCase() === documentFilter
    );
  }, [documents, documentFilter]);

  const documentStats = useMemo(() => {
    const stats = documents.reduce((acc, doc) => {
      const key = (doc.type || "OTHER").toUpperCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const totalSize = documents.reduce((sum, doc) => {
      const numeric = parseFloat(doc.size);
      if (!Number.isFinite(numeric)) {
        return sum;
      }
      if (doc.size?.toUpperCase().includes("KB")) {
        return sum + numeric / 1024;
      }
      return sum + numeric;
    }, 0);

    return { stats, totalSize };
  }, [documents]);

  const postFilterOptions = [
    { value: "ALL", label: "Tất cả" },
    { value: "PINNED", label: "Đang ghim" },
    { value: "MENTIONED", label: "Có tag tôi" },
  ];

  const orderedPosts = useMemo(() => {
    let data = [...posts].sort(
      (a, b) => Number(b.isPinned) - Number(a.isPinned)
    );

    if (postFilter === "PINNED") {
      data = data.filter((post) => post.isPinned);
    } else if (postFilter === "MENTIONED") {
      data = data.filter((post) =>
        post.mentions?.some((mention) => mention === currentUserName)
      );
    }

    return data;
  }, [posts, postFilter, currentUserName]);

  const postStats = useMemo(
    () => ({
      total: posts.length,
      pinned: posts.filter((post) => post.isPinned).length,
      mentions: posts.reduce(
        (acc, post) => acc + (post.mentions?.length || 0),
        0
      ),
    }),
    [posts]
  );

  const logTypeOptions = useMemo(
    () => [
      { value: "ALL", label: "Tất cả hành động" },
      ...Object.entries(activityTypeLabels).map(([value, label]) => ({
        value,
        label,
      })),
    ],
    []
  );

  const logUserOptions = useMemo(() => {
    const uniqueUsers = Array.from(
      new Set(projectActivities.map((activity) => activity.user).filter(Boolean))
    );
    return ["ALL", ...uniqueUsers];
  }, [projectActivities]);

  const filteredLogs = useMemo(() => {
    return projectActivities.filter((activity) => {
      const matchType =
        logTypeFilter === "ALL" || activity.type === logTypeFilter;
      const matchUser =
        logUserFilter === "ALL" || activity.user === logUserFilter;
      const matchKeyword =
        !logSearchKeyword ||
        activity.target
          ?.toLowerCase()
          .includes(logSearchKeyword.toLowerCase()) ||
        activity.action
          ?.toLowerCase()
          .includes(logSearchKeyword.toLowerCase());
      return matchType && matchUser && matchKeyword;
    });
  }, [projectActivities, logTypeFilter, logUserFilter, logSearchKeyword]);

  const logSummary = useMemo(() => {
    // Tính toán thống kê dựa trên ActivityType thực tế từ API
    const activityCounts = {};
    
    // Đếm số lượng cho mỗi ActivityType
    projectActivities.forEach((activity) => {
      const activityType = activity.type;
      if (activityType) {
        activityCounts[activityType] = (activityCounts[activityType] || 0) + 1;
      }
    });
    
    // Tạo summary từ các ActivityType có trong dữ liệu và có label
    return Object.entries(activityCounts)
      .map(([key, count]) => ({
        key,
        label: activityTypeLabels[key] || key,
        count,
      }))
      .filter((item) => activityTypeLabels[item.key]) // Chỉ hiển thị các loại có label
      .sort((a, b) => b.count - a.count); // Sắp xếp theo count giảm dần
  }, [projectActivities]);

  const handleDocumentUpload = async (file) => {
    if (!id || !isInWorkflow) {
      notification.warning({
        message: "Thông báo",
        description: "Chức năng này chỉ hoạt động trong workflow context",
      });
      return false;
    }

    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "other";
      const documentData = {
        companyCode: "DVCS01",
        projectId: parseInt(id),
        fileName: file.name,
        filePath: `/documents/${id}/${file.name}`, // TODO: Upload file thực sự và lấy path
        fileType: extension,
        fileSize: file.size,
        tags: extension,
        uploadedBy: 1, // TODO: Lấy từ userInfo
      };

      await createWorkflowProjectDocument(documentData);
      
      // Reload documents
      await loadDocuments();
      
      notification.success({
        message: "Tải lên thành công",
        description: `${file.name} đã được thêm vào dự án.`,
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      notification.error({
        message: "Lỗi",
        description: "Không thể tải lên tài liệu. Vui lòng thử lại sau.",
      });
    }
    return false;
  };

  const handleDeleteDocument = async (docId) => {
    if (!id || !isInWorkflow) {
      notification.warning({
        message: "Thông báo",
        description: "Chức năng này chỉ hoạt động trong workflow context",
      });
      return;
    }

    try {
      await deleteWorkflowProjectDocument({
        documentId: docId,
        companyCode: "DVCS01",
        deletedBy: 1, // TODO: Lấy từ userInfo
      });
      
      // Reload documents
      await loadDocuments();
      
      // Đóng modal
      setDeleteDocumentModal({ visible: false, documentId: null, documentName: '' });
      
      notification.success({
        message: "Đã xóa tài liệu",
        description: "Tài liệu đã bị loại khỏi dự án.",
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      notification.error({
        message: "Lỗi",
        description: "Không thể xóa tài liệu. Vui lòng thử lại sau.",
      });
    }
  };

  const handleDownloadDocument = async (record) => {
    if (!record || !record.id) {
      notification.error({
        message: "Lỗi",
        description: "Không tìm thấy thông tin tài liệu để tải xuống",
      });
      return;
    }

    if (!isInWorkflow) {
      notification.warning({
        message: "Thông báo",
        description: "Chức năng này chỉ hoạt động trong workflow context",
      });
      return;
    }

    try {
      await downloadWorkflowProjectDocument({
        documentId: record.id,
        companyCode: "DVCS01",
        filePath: record.filePath || "",
        fileName: record.name || `document_${record.id}`,
      });
      
      notification.success({
        message: "Đã tải xuống",
        description: `Đã tải xuống tài liệu: ${record.name}`,
      });
    } catch (error) {
      console.error("Error downloading document:", error);
      notification.error({
        message: "Lỗi",
        description: error?.response?.data?.message || "Không thể tải xuống tài liệu. Vui lòng thử lại sau.",
      });
    }
  };

  const getDocumentIcon = (type) => {
    const normalized = type?.toLowerCase();
    if (normalized === "pdf") return <FilePdfOutlined style={{ color: "#ff4d4f" }} />;
    if (["png", "jpg", "jpeg", "gif", "fig"].includes(normalized))
      return <FileImageOutlined style={{ color: "#1890ff" }} />;
    if (["doc", "docx"].includes(normalized))
      return <FileWordOutlined style={{ color: "#2f54eb" }} />;
    if (["xls", "xlsx", "csv"].includes(normalized))
      return <FileExcelOutlined style={{ color: "#52c41a" }} />;
    return <FileUnknownOutlined style={{ color: "#8c8c8c" }} />;
  };

  const handleTogglePin = (postId) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, isPinned: !post.isPinned } : post
      )
    );
  };

  const handleReactPost = (postId) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, likes: (post.likes || 0) + 1 } : post
      )
    );
  };

  const handleCommentPost = (postId) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, comments: (post.comments || 0) + 1 } : post
      )
    );
    notification.info({
      message: "Thêm bình luận",
      description: "Tính năng bình luận chi tiết sẽ được kết nối API sau.",
    });
  };

  const documentColumns = [
    {
      title: "Tên file",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          {getDocumentIcon(record.type)}
          <Space direction="vertical" size={0}>
            <a>{text}</a>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.uploadedBy} · {record.uploadedDate}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: "Kích thước",
      dataIndex: "size",
      key: "size",
      width: 120,
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type) => (
        <Tag color="blue">{(type || "OTHER").toUpperCase()}</Tag>
      ),
    },
    {
      title: "Người tải lên",
      dataIndex: "uploadedBy",
      key: "uploadedBy",
      width: 150,
    },
    {
      title: "Ngày tải lên",
      dataIndex: "uploadedDate",
      key: "uploadedDate",
      width: 130,
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadDocument(record)}
          >
            Tải xuống
          </Button>
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => {
              setDeleteDocumentModal({
                visible: true,
                documentId: record.id,
                documentName: record.name,
              });
            }}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  const loadProjectManagers = async () => {
    setLoadingManagers(true);
    try {
      const result = await getWorkflowDropdownProjectManagers({
        companyCode: "DVCS01",
      });
      
      // Map dữ liệu từ API sang format cho Select
      const mappedManagers = Array.isArray(result) ? result.map((manager) => ({
        value: manager.value || manager.id,
        label: manager.label || manager.fullName || manager.name || "",
        email: manager.Email || manager.email || "",
      })) : [];
      
      setProjectManagers(mappedManagers);
    } catch (error) {
      console.error("Error loading project managers:", error);
      notification.error({
        message: "Lỗi",
        description: "Không thể tải danh sách người dùng. Vui lòng thử lại sau.",
      });
    } finally {
      setLoadingManagers(false);
    }
  };

  const handleAddMember = () => {
    if (!isInWorkflow) {
      notification.warning({
        message: "Thông báo",
        description: "Chức năng này chỉ hoạt động trong workflow context",
      });
      return;
    }
    memberForm.resetFields();
    setOpenAddMemberModal(true);
    loadProjectManagers();
  };

  const handleRemoveMember = async (memberId) => {
    if (!id || !isInWorkflow) {
      notification.warning({
        message: "Thông báo",
        description: "Chức năng này chỉ hoạt động trong workflow context",
      });
      return;
    }

    // Kiểm tra nếu đang xóa PM chính
    const memberToDelete = resources.find(r => (r.memberId || r.id) === memberId);
    if (memberToDelete && (memberToDelete.role === "PROJECT_MANAGER" || memberToDelete.isPrimaryManager)) {
      notification.warning({
        message: "Thông báo",
        description: "Không thể xóa PM chính. PM chính được thiết lập khi tạo dự án và chỉ có thể thay đổi bằng cách chỉnh sửa dự án.",
      });
      return;
    }

    console.log("[handleRemoveMember] Starting delete member:", { projectId: id, memberId });

    try {
      const deleteParams = {
        projectId: parseInt(id),
        memberId: memberId,
        companyCode: "DVCS01",
        removedBy: 1, // TODO: Lấy từ userInfo
      };
      
      console.log("[handleRemoveMember] Calling API with params:", deleteParams);
      
      await deleteWorkflowProjectMember(deleteParams);
      
      console.log("[handleRemoveMember] API call successful");
      
      // Reload members
      await loadMembers();
      
      notification.success({
        message: "Đã xóa thành viên",
        description: "Thành viên đã bị loại khỏi dự án.",
      });
    } catch (error) {
      console.error("[handleRemoveMember] Error removing member:", error);
      console.error("[handleRemoveMember] Error response:", error?.response);
      
      // Kiểm tra response error từ API
      const errorResponse = error?.response?.data;
      if (Array.isArray(errorResponse) && errorResponse.length > 0) {
        const errorItem = errorResponse[0];
        notification.warning({
          message: "Thông báo",
          description: errorItem.message || "Không thể xóa thành viên",
        });
        return;
      }
      
      notification.error({
        message: "Lỗi",
        description: error?.response?.data?.message || "Không thể xóa thành viên. Vui lòng thử lại sau.",
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!id || !isInWorkflow) {
      notification.warning({
        message: "Thông báo",
        description: "Chức năng này chỉ hoạt động trong workflow context",
      });
      return;
    }

    setDeleting(true);
    try {
      await deleteWorkflowProject({
        projectId: parseInt(id),
        companyCode: "DVCS01",
        deletedBy: 1,
      });

      notification.success({
        message: "Thành công",
        description: "Đã xóa dự án thành công",
      });

      // Navigate về trang danh sách dự án
      navigate(isInWorkflow ? "/workflow/project-management" : "/project-management");
    } catch (error) {
      console.error("Error deleting project:", error);
      
      // Kiểm tra response error từ API
      const errorResponse = error?.response?.data;
      if (Array.isArray(errorResponse) && errorResponse.length > 0) {
        const errorItem = errorResponse[0];
        notification.warning({
          message: "Thông báo",
          description: errorItem.message || "Không thể xóa dự án",
        });
      } else {
        notification.error({
          message: "Lỗi",
          description: error?.response?.data?.message || "Không thể xóa dự án. Vui lòng thử lại sau.",
        });
      }
    } finally {
      setDeleting(false);
      setIsDeleteModalVisible(false);
    }
  };

  const handleEditProject = () => {
    if (!project) return;
    
    // Set current project record để truyền vào modal
    setCurrentProjectRecord({
      id: project.id,
      Id: project.id,
      projectId: project.id,
      ...project,
    });
    
    // Mở modal chỉnh sửa
    setOpenEditProjectModal(true);
  };

  const handleCloseEditModal = () => {
    setOpenEditProjectModal(false);
    setCurrentProjectRecord(null);
  };

  const handleSubmitMember = async () => {
    if (!id || !isInWorkflow) {
      notification.warning({
        message: "Thông báo",
        description: "Chức năng này chỉ hoạt động trong workflow context",
      });
      return;
    }

    try {
      const values = await memberForm.validateFields();
      
      // Validation: Không cho phép thêm PROJECT_MANAGER (PM chính đã được set trong ProjectManagerId)
      if (values.role === "PROJECT_MANAGER") {
        notification.warning({
          message: "Thông báo",
          description: "PM chính đã được thiết lập khi tạo dự án. Chỉ có thể thêm CO-PM hoặc thành viên.",
        });
        return;
      }
      
      // Lấy giờ hiện tại theo múi giờ địa phương và format thành ISO string
      const now = dayjs().format("YYYY-MM-DDTHH:mm:ss.SSS");
      const payload = {
        companyCode: "DVCS01",
        projectId: parseInt(id),
        userId: values.userId,
        role: values.role || "MEMBER",
        allocation: values.allocation ?? 0,
        startDate: now,
        endDate: now,
        addedBy: 1, // Hardcode theo yêu cầu
      };

      // Gọi API trực tiếp với format đúng theo curl command
      const endpoint = `workflow/projects/${payload.projectId}/members`;
      
      const response = await axiosInstanceRootApi.post(endpoint, payload, {
        headers: {
          'accept': 'text/plain',
          'Content-Type': 'application/json',
        },
      });

      // Kiểm tra response từ API (trường hợp API trả về 200 nhưng có error message trong body)
      const responseData = response.data;
      if (Array.isArray(responseData) && responseData.length > 0) {
        const errorItem = responseData[0];
        if (errorItem.status === 400) {
          notification.warning({
            message: "Thông báo",
            description: errorItem.message || "Thành viên đã tồn tại trong dự án",
          });
          return;
        }
      }

      await loadMembers();
      setOpenAddMemberModal(false);
      notification.success({
        message: "Thành công",
        description: "Đã thêm thành viên vào dự án",
      });
    } catch (error) {
      console.error("Error adding member:", error);
      if (error?.errorFields) {
        return; // validation error
      }
      
      // Xử lý lỗi từ API (status 400, 500, etc.)
      const errorResponse = error?.response?.data;
      
      // Kiểm tra nếu response là array với format [{"message":"...","status":400}]
      if (Array.isArray(errorResponse) && errorResponse.length > 0) {
        const errorItem = errorResponse[0];
        if (errorItem.status === 400) {
          notification.warning({
            message: "Thông báo",
            description: errorItem.message || "Thành viên đã tồn tại trong dự án",
          });
          return;
        }
      }
      
      // Nếu không phải format trên, thử lấy message từ error response
      const errorMessage = errorResponse?.message || 
                           (Array.isArray(errorResponse) && errorResponse[0]?.message) ||
                           error?.message ||
                           "Không thể thêm thành viên. Vui lòng thử lại sau.";
      
      notification.error({
        message: "Lỗi",
        description: errorMessage,
      });
    }
  };

  const resourceColumns = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <Space>
          <Avatar>{text[0]}</Avatar>
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      width: 200,
      render: (role) => {
        if (role === "PROJECT_MANAGER" || role === "PM") {
          return <Tag color="red">PM Chính</Tag>;
        } else if (role === "CO_PROJECT_MANAGER" || role === "CO_PM") {
          return <Tag color="orange">CO-PM</Tag>;
        } else {
          return <Tag color="blue">Thành viên</Tag>;
        }
      },
    },
    {
      title: "Phân bổ",
      dataIndex: "allocation",
      key: "allocation",
      width: 150,
      render: (allocation) => (
        <Progress percent={allocation} size="small" status="active" />
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      render: (_, record) => {
        // Không hiển thị nút xóa cho PM chính
        if (record.role === "PROJECT_MANAGER" || record.isPrimaryManager) {
          return <Text type="secondary" style={{ fontSize: 12 }}>PM chính</Text>;
        }
        
        console.log("[Delete Button] Record:", record);
        return (
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              console.log("[Delete Button] Clicked, record:", record);
              setDeleteMemberModal({
                visible: true,
                memberId: record.memberId || record.id,
                memberName: record.name,
              });
            }}
          >
            Xóa
          </Button>
        );
      },
    },
    {
      title: "Thời gian",
      key: "period",
      render: (_, record) => (
        <Text>
          {record.startDate ? dayjs(record.startDate).format("DD/MM/YYYY - HH:mm") : "-"}
        </Text>
      ),
    },
  ];

  const taskColumns = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      fixed: "left",
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Công việc",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <a onClick={() => navigate(`/workflow/task-management/task/${record.id}`)}>
          {text}
        </a>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        const statusConfig = {
          COMPLETED: { color: "success", text: "Hoàn thành" },
          IN_PROGRESS: { color: "processing", text: "Đang thực hiện" },
          PENDING: { color: "default", text: "Chờ xử lý" },
        };
        const config = statusConfig[status] || statusConfig.PENDING;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Người thực hiện",
      dataIndex: "assignee",
      key: "assignee",
      width: 150,
    },
    {
      title: "Tiến độ",
      dataIndex: "progress",
      key: "progress",
      width: 150,
      render: (progress) => <Progress percent={progress} size="small" />,
    },
  ];

  if (!project || loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        width: '100%'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="project-detail-container">
      <Card
        title={
          <Space>
            <Title level={3} style={{ margin: 0 }}>
              {project.name}
            </Title>
            <Tag color="processing">{project.status}</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<EditOutlined />} onClick={handleEditProject}>
              Chỉnh sửa
            </Button>
          </Space>
        }
        loading={loading}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "overview",
              label: "Tổng quan",
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={16}>
                    <Descriptions bordered column={2}>
                      <Descriptions.Item label="Mã dự án">
                        {project.code}
                      </Descriptions.Item>
                      <Descriptions.Item label="Tên dự án">
                        {project.name}
                      </Descriptions.Item>
                      <Descriptions.Item label="Trạng thái">
                        <Tag color="processing">Đang thực hiện</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Độ ưu tiên">
                        <Tag color="orange">Cao</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Quản lý dự án">
                        {project.manager}
                      </Descriptions.Item>
                      <Descriptions.Item label="Tiến độ">
                        <Progress percent={project.progress} />
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngày bắt đầu">
                        {project.startDate}
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngày kết thúc">
                        {project.endDate}
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngân sách" span={2}>
                        {project.budget
                          ? `${(project.budget / 1000000).toFixed(0)}M VNĐ`
                          : "-"}
                      </Descriptions.Item>
                    </Descriptions>

                    {project.description && (
                      <Card title="Mô tả" style={{ marginTop: 16 }}>
                        <Paragraph>{project.description}</Paragraph>
                      </Card>
                    )}
                  </Col>
                  <Col xs={24} lg={8}>
                    <Card title="Thống kê">
                      <Space direction="vertical" style={{ width: "100%" }}>
                        <div>
                          <Text type="secondary">Tổng công việc: </Text>
                          <Text strong>{tasks.length}</Text>
                        </div>
                        <div>
                          <Text type="secondary">Hoàn thành: </Text>
                          <Text strong>
                            {tasks.filter((t) => t.status === "COMPLETED").length}
                          </Text>
                        </div>
                        <div>
                          <Text type="secondary">Đang thực hiện: </Text>
                          <Text strong>
                            {tasks.filter((t) => t.status === "IN_PROGRESS").length}
                          </Text>
                        </div>
                        <div>
                          <Text type="secondary">Thành viên: </Text>
                          <Text strong>{resources.length}</Text>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: "tasks",
              label: "Công việc",
              children: (
                tasks.length > 0 ? (
                  <Table
                    columns={taskColumns}
                    dataSource={tasks}
                    rowKey="id"
                    pagination={false}
                  />
                ) : (
                  <Empty description="Chưa có công việc nào" />
                )
              ),
            },
            {
              key: "documents",
              label: (
                <Space>
                  <FileTextOutlined />
                  <span>Tài liệu ({documents.length})</span>
                </Space>
              ),
              children: (
                <Space direction="vertical" style={{ width: "100%" }} size="large">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <Card size="small">
                        <Statistic title="Tổng tài liệu" value={documents.length} />
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card size="small">
                        <Statistic
                          title="Dung lượng đã dùng"
                          value={`${documentStats.totalSize.toFixed(2)} MB`}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card size="small">
                        <Statistic
                          title="Loại phổ biến"
                          value={
                            Object.entries(documentStats.stats)
                              .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"
                          }
                        />
                      </Card>
                    </Col>
                  </Row>
                  <Space wrap>
                    <Select
                      value={documentFilter}
                      style={{ minWidth: 200 }}
                      onChange={setDocumentFilter}
                    >
                      {documentTypeOptions.map((type) => (
                        <Option key={type} value={type}>
                          {type === "ALL" ? "Tất cả" : type}
                        </Option>
                      ))}
                    </Select>
                    <Button
                      icon={<FilterOutlined />}
                      onClick={() => setDocumentFilter("ALL")}
                    >
                      Bỏ lọc
                    </Button>
                    <Space size={[4, 4]} wrap>
                      {Object.entries(documentStats.stats).map(([type, count]) => (
                        <Tag key={type} color="blue">
                          {type}: {count}
                        </Tag>
                      ))}
                    </Space>
                  </Space>
                  <Dragger
                    multiple
                    showUploadList={false}
                    beforeUpload={handleDocumentUpload}
                  >
                    <p className="ant-upload-drag-icon">
                      <FileTextOutlined />
                    </p>
                    <p className="ant-upload-text">
                      Kéo thả hoặc bấm để tải tài liệu mới
                    </p>
                    <p className="ant-upload-hint">
                      Hỗ trợ PDF, hình ảnh, tài liệu văn bản và bảng tính
                    </p>
                  </Dragger>
                  {filteredDocuments.length > 0 ? (
                    <Table
                      columns={documentColumns}
                      dataSource={filteredDocuments}
                      rowKey="id"
                      pagination={false}
                    />
                  ) : (
                    <Empty description="Chưa có tài liệu nào" />
                  )}
                </Space>
              ),
            },
            {
              key: "posts",
              label: (
                <Space>
                  <MessageOutlined />
                  <span>Trao đổi (Post)</span>
                </Space>
              ),
              children: (
                <Space direction="vertical" style={{ width: "100%" }} size="large">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <Card size="small">
                        <Statistic title="Tất cả bài đăng" value={postStats.total} />
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card size="small">
                        <Statistic title="Bài đang ghim" value={postStats.pinned} />
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card size="small">
                        <Statistic title="Lượt mention" value={postStats.mentions} />
                      </Card>
                    </Col>
                  </Row>
                  <Space wrap>
                    <Select
                      value={postFilter}
                      onChange={setPostFilter}
                      style={{ minWidth: 200 }}
                    >
                      {postFilterOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                    <Tag color="magenta">
                      {orderedPosts.length} bài hiển thị
                    </Tag>
                  </Space>
                  <Card title="Tạo trao đổi mới">
                    <Form
                      form={postForm}
                      layout="vertical"
                      onFinish={handleCreatePost}
                    >
                      <Form.Item
                        name="content"
                        label="Nội dung"
                        rules={[
                          { required: true, message: "Vui lòng nhập nội dung" },
                        ]}
                      >
                        <Mentions
                          rows={4}
                          placeholder="Chia sẻ cập nhật... sử dụng @ để tag thành viên"
                        >
                          {mentionOptions.map((option) => (
                            <Mentions.Option key={option.value} value={option.value}>
                              {option.label}
                            </Mentions.Option>
                          ))}
                        </Mentions>
                      </Form.Item>
                      <Form.Item name="mentions" label="Tag thành viên">
                        <Select
                          mode="multiple"
                          placeholder="Chọn thành viên cần thông báo"
                          allowClear
                        >
                          {mentionOptions.map((option) => (
                            <Option key={option.value} value={option.value}>
                              {option.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Upload
                        multiple
                        fileList={postAttachments}
                        beforeUpload={handleBeforeUpload}
                        onRemove={handleRemoveAttachment}
                      >
                        <Button icon={<PaperClipOutlined />}>
                          Đính kèm tài liệu
                        </Button>
                      </Upload>
                      <Space style={{ marginTop: 16 }}>
                        <Button type="primary" htmlType="submit">
                          Share
                        </Button>
                      </Space>
                    </Form>
                  </Card>
                  {loadingPosts ? (
                    <Spin size="large" style={{ display: 'block', textAlign: 'center', padding: '40px' }} />
                  ) : orderedPosts.length ? (
                    <List
                      dataSource={orderedPosts}
                      renderItem={(item) => (
                        <List.Item
                          key={item.id}
                          actions={[
                            <Tooltip title="Thả tim" key="like">
                              <Button
                                type="text"
                                icon={<LikeOutlined />}
                                onClick={() => handleReactPost(item.id)}
                              >
                                {item.likes}
                              </Button>
                            </Tooltip>,
                            <Tooltip title="Thêm bình luận" key="comment">
                              <Button
                                type="text"
                                icon={<CommentOutlined />}
                                onClick={() => handleCommentPost(item.id)}
                              >
                                {item.comments}
                              </Button>
                            </Tooltip>,
                            <Tooltip
                              title={item.isPinned ? "Bỏ ghim" : "Ghim bài"}
                              key="pin"
                            >
                              <Button
                                type={item.isPinned ? "primary" : "text"}
                                icon={<PushpinOutlined />}
                                onClick={() => handleTogglePin(item.id)}
                              />
                            </Tooltip>,
                          ]}
                        >
                          <List.Item.Meta
                            avatar={<Avatar>{(item.author && item.author.length > 0) ? item.author[0] : '?'}</Avatar>}
                            title={
                              <Space direction="vertical" size={0}>
                                <Space>
                                  <Text strong>{item.author}</Text>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {item.createdDate}
                                  </Text>
                                  {item.isPinned && (
                                    <Tag color="gold" icon={<PushpinOutlined />}>
                                      Đang ghim
                                    </Tag>
                                  )}
                                </Space>
                                {item.mentions?.length > 0 && (
                                  <Space size={[4, 4]} wrap>
                                    {item.mentions.map((mention) => (
                                      <Tag key={mention} color="blue">
                                        @{mention}
                                      </Tag>
                                    ))}
                                  </Space>
                                )}
                              </Space>
                            }
                            description={
                              <Space direction="vertical" style={{ width: "100%" }}>
                                <Paragraph style={{ marginBottom: 8 }}>
                                  {item.content}
                                </Paragraph>
                                {item.attachments?.length > 0 && (
                                  <Space wrap>
                                    {item.attachments.map((file) => (
                                      <Tag
                                        key={file.name}
                                        icon={<PaperClipOutlined />}
                                        color="purple"
                                      >
                                        {file.name}
                                      </Tag>
                                    ))}
                                  </Space>
                                )}
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="Không có bài viết phù hợp bộ lọc" />
                  )}
                </Space>
              ),
            },
            {
              key: "resources",
              label: (
                <Space>
                  <TeamOutlined />
                  <span>Nguồn lực ({resources.length})</span>
                </Space>
              ),
              children: (
                <Space direction="vertical" style={{ width: "100%" }} size="large">
                  <div style={{ textAlign: "right" }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMember}>
                      Thêm nguồn lực
                    </Button>
                  </div>
                  {resources.length > 0 ? (
                    <Table
                      columns={resourceColumns}
                      dataSource={resources}
                      rowKey="id"
                      pagination={false}
                    />
                  ) : (
                    <Empty description="Chưa có nguồn lực nào" />
                  )}
                </Space>
              ),
            },
            {
              key: "logs",
              label: (
                <Space>
                  <HistoryOutlined />
                  <span>Hoạt động (Logs)</span>
                </Space>
              ),
              children: (
                <Space direction="vertical" style={{ width: "100%" }} size="large">
                  <Row gutter={[16, 16]}>
                    {logSummary.map((item) => (
                      <Col xs={24} md={8} key={item.key}>
                        <Card size="small">
                          <Statistic title={item.label} value={item.count} />
                        </Card>
                      </Col>
                    ))}
                  </Row>
                  <Space wrap>
                    <Select
                      value={logTypeFilter}
                      onChange={setLogTypeFilter}
                      style={{ minWidth: 220 }}
                    >
                      {logTypeOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                    <Select
                      value={logUserFilter}
                      onChange={setLogUserFilter}
                      style={{ minWidth: 200 }}
                    >
                      {logUserOptions.map((user) => (
                        <Option key={user} value={user}>
                          {user === "ALL" ? "Tất cả thành viên" : user}
                        </Option>
                      ))}
                    </Select>
                    <Input
                      placeholder="Tìm kiếm hoạt động"
                      value={logSearchKeyword}
                      allowClear
                      onChange={(e) => setLogSearchKeyword(e.target.value)}
                      style={{ width: 240 }}
                    />
                  </Space>
                  <Card>
                    {filteredLogs.length ? (
                      <Timeline>
                        {filteredLogs.map((activity) => (
                          <Timeline.Item key={activity.id}>
                            <Space direction="vertical" size={0} style={{ width: "100%" }}>
                              <Space>
                                <Text strong>{activity.user}</Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {dayjs(activity.timestamp).format("DD/MM/YYYY HH:mm")}
                                </Text>
                              </Space>
                              <Text>
                                {activity.action} - {activity.target}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {activityTypeLabels[activity.type] || activity.type}
                              </Text>
                              {activity.details && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {activity.details}
                                </Text>
                              )}
                            </Space>
                          </Timeline.Item>
                        ))}
                      </Timeline>
                    ) : (
                      <Empty description="Không có hoạt động phù hợp bộ lọc" />
                    )}
                  </Card>
                </Space>
              ),
            },
          ]}
        />
        <Modal
          title="Thêm thành viên"
          open={openAddMemberModal}
          onCancel={() => setOpenAddMemberModal(false)}
          onOk={handleSubmitMember}
          okText="Lưu"
          cancelText="Hủy"
          confirmLoading={loading}
          destroyOnClose
        >
          <Form layout="vertical" form={memberForm} preserve={false}>
            <Form.Item
              label="Người dùng"
              name="userId"
              rules={[{ required: true, message: "Vui lòng chọn người dùng" }]}
            >
              <Select
                style={{ width: "100%" }}
                placeholder="Chọn người dùng"
                loading={loadingManagers}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
                options={projectManagers}
              />
            </Form.Item>
            <Form.Item label="Vai trò" name="role" initialValue="MEMBER">
              <Select>
                <Option value="CO_PROJECT_MANAGER">CO-PM (Phó Quản lý Dự án)</Option>
                <Option value="MEMBER">MEMBER (Thành viên)</Option>
              </Select>
            </Form.Item>
            <Form.Item 
              label="Phân bổ (%)" 
              name="allocation" 
              rules={[{ required: true, message: "Vui lòng nhập phân bổ (%)" }]}
            >
              <InputNumber 
                min={0} 
                max={100} 
                style={{ width: "100%" }} 
                controls={false}
                placeholder="Nhập phân bổ (%)"
              />
            </Form.Item>
          </Form>
        </Modal>
        {/* Modal xác nhận xóa dự án */}
        <Modal
          title="Xác nhận xóa dự án"
          open={isDeleteModalVisible}
          onCancel={() => setIsDeleteModalVisible(false)}
          onOk={handleDeleteProject}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
          confirmLoading={deleting}
        >
          <p>Bạn có chắc chắn muốn xóa dự án <strong>{project?.name}</strong> không?</p>
          <p style={{ color: "#ff4d4f" }}>Hành động này không thể hoàn tác.</p>
        </Modal>
        
        {/* Modal xác nhận xóa tài liệu */}
        <Modal
          title="Xác nhận xóa tài liệu"
          open={deleteDocumentModal.visible}
          onCancel={() => setDeleteDocumentModal({ visible: false, documentId: null, documentName: '' })}
          onOk={() => handleDeleteDocument(deleteDocumentModal.documentId)}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <p>Bạn có chắc chắn muốn xóa tài liệu <strong>{deleteDocumentModal.documentName}</strong> không?</p>
          <p style={{ color: "#ff4d4f" }}>Hành động này không thể hoàn tác.</p>
        </Modal>
        
        {/* Modal xác nhận xóa nguồn lực */}
        <Modal
          title="Xác nhận xóa nguồn lực"
          open={deleteMemberModal.visible}
          onCancel={() => setDeleteMemberModal({ visible: false, memberId: null, memberName: '' })}
          onOk={() => handleRemoveMember(deleteMemberModal.memberId)}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <p>Bạn có chắc chắn muốn xóa nguồn lực <strong>{deleteMemberModal.memberName}</strong> khỏi dự án không?</p>
          <p style={{ color: "#ff4d4f" }}>Hành động này không thể hoàn tác.</p>
        </Modal>
        <ModalAddProject
          openModalAddProjectState={openEditProjectModal}
          handleCloseModal={handleCloseEditModal}
          openModalType="EDIT"
          currentRecord={currentProjectRecord}
          refreshData={loadProject}
        />
      </Card>
    </div>
  );
};

export default ProjectDetail;
