// index.js
import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../views/Dashboard.vue";
import Tables from "../views/Tables.vue";
import Billing from "../views/Billing.vue";
// import RTL from "../views/Rtl.vue";
import Notifications from "../views/Notifications.vue";
import Profile from "../views/Profile.vue";
import SignIn from "../views/SignIn.vue";
import SignUp from "../views/SignUp.vue";
import Test from "../views/Test.vue";
import Sponsor from "../views/Sponsor/Sponsor.vue";
import SponsorProgramList from "../views/Sponsor/ProgramList.vue";
import EventMain from "../views/EventMain.vue";
import EventList from "../views/EventList.vue";
import EventForm from "../views/EventForm.vue";
import EventInfo from "../views/EventInfo.vue";
import Organization from "../views/Organization.vue";

const routes = [
  {
    path: "/",
    name: "dashboard",
    redirect: "/dashboard",
  },
  {
    path: "/test",
    name: "Test",
    component: Test,
  },
  {
    path: "/sponsorprogramlist",
    name: "SponsorProgramList",
    component: SponsorProgramList,
  },
  {
    path: "/sponsor",
    name: "Sponsor",
    component: Sponsor,
  },
  {
    path: "/organization",
    name: "Organization",
    component: Organization,
  },
  {
    path: "/managerApprovals",
    name: "ManagerApprovals",
    component: () => import("../views/ManagerApprovals.vue"),
  },
  {
    path: "/staffApprovals",
    name: "StaffApprovals",
    component: () => import("../views/StaffApprovals.vue"),
  },
  {
    path: "/priorityApprovals",
    name: "PriorityApprovals",
    component: () => import("../views/PriorityApproval.vue"),
  },
  {
    path: "/supportPlanApprovals",
    name: "SupportPlanApprovals",
    component: () => import("../views/SupportPlanApproval.vue"),
  },
  {
    path: "/supportResultApprovals",
    name: "SupportResultApprovals",
    component: () => import("../views/SupportResultApproval.vue"),
  },
  {
    path: "/eventPlanApprovals",
    name: "EventPlanApprovals",
    component: () => import("../views/EventPlanApproval.vue"),
  },
  {
    path: "/eventResultApprovals",
    name: "EventResultApprovals",
    component: () => import("../views/EventResultApproval.vue"),
  },
  {
    path: "/sponsorshipPlanApprovals",
    name: "SponsorshipPlanApprovals",
    component: () => import("../views/SponsorshipPlanApproval.vue"),
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: Dashboard,
  },
  {
    path: "/tables",
    name: "Tables",
    component: Tables,
  },
  {
    path: "/billing",
    name: "Billing",
    component: Billing,
  },
  // {
  //   path: "/rtl-page",
  //   name: "RTL",
  //   component: RTL,
  // },
  {
    path: "/notifications",
    name: "Notifications",
    component: Notifications,
  },
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
  },
  {
    path: "/sign-in",
    name: "SignIn",
    component: SignIn,
  },
  {
    path: "/sign-up",
    name: "SignUp",
    component: SignUp,
  },
  // 조사지 버전 목록
  {
    path: "/survey-version",
    name: "surveyVersion",
    component: () => import("../views/SurveyVersion.vue"),
  },

  // 조사지 추가 (제작)
  {
    path: "/survey/new",
    name: "survey-new",
    component: () => import("../views/SurveyNew.vue"),
  },

  // 조사지 작성 (최신 템플릿으로 응답 작성)
  {
    path: "/survey/write",
    name: "survey-write",
    component: () => import("../views/SurveyWrite.vue"),
  },
  // 조사지 버전 수정
  {
    path: "/survey/edit/:id",
    name: "survey-edit",
    component: () => import("../views/SurveyEdit.vue"),
    props: true,
  },

  // 제출본 목록 (역할별)
  {
    path: "/survey-list",
    name: "surveyList",
    component: () => import("../views/SurveyList.vue"),
  },

  // 제출본 상세
  {
    path: "/survey/submission/:submitCode",
    name: "surveySubmissionDetail",
    component: () => import("../views/SurveySubmissionDetail.vue"),
    props: true,
  },

  // 제출본 수정
  {
    path: "/survey/submission/:submitCode/edit",
    name: "surveySubmissionEdit",
    component: () => import("../views/SurveySubmissionEdit.vue"),
    props: true,
  },

  // 담당자 배정
  {
    path: "/assign-manager/:submitCode",
    name: "assignManager",
    component: () => import("../views/AssignManager.vue"),
    props: true,
  },
  //조사지 버전 상세보기
  {
    path: "/survey/detail/ver/:templateVerCode",
    name: "survey-detail-by-ver",
    component: () => import("../views/SurveyDetail.vue"),
    props: true,
  },
  // 상담 목록
  {
    path: "/counsel-list",
    name: "counselList",
    component: () => import("../views/CounselList.vue"),
  },
  // 상담 작성
  {
    path: "/counsel/new/:submitCode",
    name: "counsel-new",
    component: () => import("../views/CounselNew.vue"),
    props: true,
  },
  //상담 수정
  {
    path: "/counsel/edit/:submitCode",
    name: "counsel-edit",
    component: () => import("../views/CounselEdit.vue"),
    props: true,
  },
  //상담 상세
  {
    path: "/counsel/detail/:submitCode",
    name: "counsel-detail",
    component: () => import("../views/CounselDetail.vue"),
    props: true,
  },
  // 지원계획목록
  {
    path: "/plan-list",
    name: "planList",
    component: () => import("../views/PlanList.vue"),
  },
  // 이벤트 메인페이지
  {
    path: "/event",
    name: "EventMain",
    component: EventMain,
  },
  // 이벤트 목록
  {
    path: "/event/list",
    name: "EventList",
    component: EventList,
  },
  // 이벤트 등록
  {
    path: "/event/add",
    name: "EventAdd",
    component: EventForm,
  },
  // 이벤트 상세
  {
    path: "/event/info",
    name: "EventInfo",
    component: EventInfo,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  linkActiveClass: "active",
});

export default router;
