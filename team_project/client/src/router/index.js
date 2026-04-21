// index.js
import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
import Tables from '../views/Tables.vue';
import Billing from '../views/Billing.vue';
import RTL from '../views/Rtl.vue';
import Notifications from '../views/Notifications.vue';
import Profile from '../views/Profile.vue';
import SignIn from '../views/SignIn.vue';
import SignUp from '../views/SignUp.vue';
import Test from '../views/Test.vue';
import Sponsor from '../views/Sponsor/Sponsor.vue';
import SponsorProgramList from '../views/Sponsor/ProgramList.vue';
import EventList from '../views/EventList.vue';
import EventForm from '../views/EventForm.vue';
import EventInfo from '../views/EventInfo.vue';
import Organization from '../views/Organization.vue';
import { useMenuStore } from '@/store/sidebar';
import { sponsorMenu } from '@/config/menus';
import { eventMenu } from '@/config/menus';
import { surveyMenu } from '@/config/menus';
import { spportMenu } from '@/config/menus';
import { counselMenu } from '@/config/menus';
import { appReqMenu } from '@/config/menus';
import { historyMenu } from '@/config/menus';
import { infoMenu } from '@/config/menus';
import { pendingMenu } from '@/config/menus';
import PendingApproval from '../components/PendingApproval.vue';
import SponsorDetail from '@/components/Sponsor/Common/SponsorDetail.vue';
import PaymentPage from '@/components/Sponsor/User/PaymentPage.vue';
import { appStatusMenu } from '@/config/menus';
import UserInfo from '../views/UserInfo.vue';
import KakaoPayApprove from '../views/Sponsor/KakaoPayApprove.vue';
import SponsorActivity from '../views/Sponsor/SponsorActivity.vue';
import BudgetSummary from '../views/Sponsor/BudgetSummary.vue';
import MyGiving from '../views/Sponsor/MyGiving.vue';
import BudgetSummaryInfo from "../views/Sponsor/BudgetSummaryInfo.vue";
const router = createRouter({
  history: createWebHistory(),
  routes: [
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
    // 회원정보
    {
      path: "/userinfo",
      name: "UserInfo",
      component: UserInfo,
    },

    // 담당자 배정 목록
    {
      path: "/pendingapproval",
      name: "PendingApproval",
      component: PendingApproval,
    },
    {
      path: "/sponsor",
      name: "Sponsor",
      component: Sponsor,
    },
    {
      path: "/sponsorprogramlist",
      name: "SponsorProgramList",
      component: SponsorProgramList,
    },
    {
      path: "/sponsor/:programCode/plan-detail",
      name: "sponsorship-plan-detail",
      component: () => import("@/components/Sponsor/Common/ProgramAdd.vue"),
      props: (route) => ({
        programCode: Number(route.params.programCode),
        approvalMode: true,
        role: Number(route.query.role || 0),
      }),
    },
    {
      path: "/sponsordetail/:programCode",
      name: "SponsorDetail",
      component: SponsorDetail,
      props: true,
    },
    {
      path: "/paymentpage/:programCode",
      name: "PaymentPage",
      component: PaymentPage,
      props: true,
    },
    {
      path: "/kakaopayapprove",
      name: "KakaoPayApprove",
      component: KakaoPayApprove,
    },
    {
      path: "/activity",
      name: "SponsorActivity",
      component: SponsorActivity,
    },
    {
  path: '/budget-summary',
  name: 'BudgetSummary',
  component: BudgetSummary,
},
{
  path: '/budget-summary/:programCode',
  name: 'BudgetSummaryInfo',
  component: BudgetSummaryInfo,
  props: true,
},
    {
      path: "/mygiving",
      name: "MyGiving",
      component: MyGiving,
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
      path: "/sponsorshipResultApprovals",
      name: "SponsorshipResultApprovals",
      component: () => import("../views/SponsorshipResultApproval.vue"),
    },
    {
      path: "/historyList",
      name: "HistoryList",
      component: () => import("../views/HistoryList.vue"),
    },
    {
      path: "/authorityTransfer",
      name: "AuthorityTransfer",
      component: () => import("../views/AuthorityTransfer.vue"),
    },
    {
      path: "/applicationStatus",
      name: "ApplicationStatus",
      component: () => import("../views/ApplicationStatus.vue"),
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
    {
      path: "/rtl-page",
      name: "RTL",
      component: RTL,
    },
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
    // 지원계획 작성
    {
      path: "/plan/write/:submitcode",
      name: "plan-write",
      component: () => import("../views/PlanWrite.vue"),
      props: true,
    },
    //지원계획 수정
    {
      path: "/plan/edit/:planCode",
      name: "plan-edit",
      component: () => import("../views/PlanEdit.vue"),
      props: true,
    },
    // 지원계획 상세
    {
      path: "/plans/detail/:planCode",
      name: "planDetail",
      component: () => import("../views/PlanDetail.vue"),
    },
    // 지원결과 목록
    {
      path: "/result-list",
      name: "resultList",
      component: () => import("../views/ResultList.vue"),
    },
    // 지원결과 작성
    {
      path: "/result/write/:submitcode",
      name: "result-write",
      component: () => import("../views/ResultWrite.vue"),
      props: true,
    },
    //지원결과 수정
    {
      path: "/result/edit/:resultCode",
      name: "result-edit",
      component: () => import("../views/ResultEdit.vue"),
      props: true,
    },
    // 지원결과 상세
    {
      path: "/result/detail/:resultCode",
      name: "resultDetail",
      component: () => import("../views/ResultDetail.vue"),
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
    // 이벤트 상세 및 수정
    {
      path: "/event/info/:eventCode",
      name: "EventInfo",
      component: EventInfo,
      props: true,
    },
    // 이벤트 신청 내역
    {
      path: "/event/apply-list",
      name: "EventApplyList",
      component: () => import("../views/EventApplyList.vue"),
    },
    // 이벤트 신청 내역 상세보기
    {
      path: "/event/my-apply-info/:applyCode/:eventCode",
      name: "EventMyApplyInfo",
      component: () => import("../views/EventMyApplyInfo.vue"),
    },
    // 이벤트 결과보고서 등록
    {
      path: "/event/result-add",
      name: "EventResultAdd",
      component: () => import("../views/EventResultAdd.vue"),
    },
    // 이벤트 계획/결과 목록 (역할별)
    {
      path: "/event/apply-result",
      name: "EventApplyResult",
      component: () => import("../views/EventApplyResult.vue"),
    },
    // 이벤트 계획 상세 보기 (역할별)
    {
      path: "/event/apply-info/:eventCode",
      name: "EventApplyInfo",
      component: () => import("../views/EventApplyInfo.vue"),
    },
    // 이벤트 결과보고서 상세 보기 (역할별)
    {
      path: "/event/result-info/:resultCode",
      name: "EventResultInfo",
      component: () => import("../views/EventResultInfo.vue"),
    },
    // 이벤트 담당자 목록(역할별)
    {
      path: "/event/manager-list",
      name: "EventManagerList",
      component: () => import("../views/EventManagerList.vue"),
    },
    // 이벤트 담당자 상세 보기 및 수정(역할별)
    {
      path: "/event/manager-info",
      name: "EventManagerInfo",
      component: () => import("../views/EventManagerInfo.vue"),
    },
    // 이벤트 참가자 목록
    {
      path: "/event/attendance-list",
      name: "EventAttendanceList",
      component: () => import("../views/EventAttendanceList.vue"),
    },
    // 이벤트 참가자 상세 및 승인
    {
      path: "/event/attendance-info",
      name: "EventAttendanceInfo",
      component: () => import("../views/EventAttendanceInfo.vue"),
    },
  ],
  linkActiveClass: "active",
});

// const router1 = createRouter({
//   history: createWebHistory(process.env.BASE_URL),
//   routes,
//   linkActiveClass: "active",
// });

router.beforeEach((to, from, next) => {
  const menu = useMenuStore();

  // 후원 페이지 그룹
  const sponsorPages = [
    'Sponsor',
    'SponsorProgramList',
    'SponsorDetail',
    'PaymentPage',
    'SponsorActivity',
    'BudgetSummary',
    'MyGiving',
    'BudgetSummary',
    'BudgetSummaryInfo'
  ];

  // event 그룹
  const eventPages = [
    "EventList",
    "EventApplyList",
    "EventAdd",
    "EventResultAdd",
    "EventApplyResult",
    "EventManagerList",
    "EventAttendanceList",
  ];

  // 승인 요청 그룹
  const appReqPages = [
    "Organization",
    "ManagerApprovals",
    "StaffApprovals",
    "PriorityApprovals",
    "SupportPlanApprovals",
    "SupportResultApprovals",
    "EventPlanApprovals",
    "EventResultApprovals",
    "SponsorshipPlanApprovals",
    "SponsorshipResultApprovals",
    "AuthorityTransfer",
  ];

  // 히스토리 그룹
  const historyPages = ["HistoryList"];

  // 대기자 목록 그룹
  const pendingPages = ["PendingApproval"];

  // 신청현황 그룹
  const appStatusPages = ["ApplicationStatus"];

  // 신청현황 그룹 라우트일 경우 자동 메뉴 설정
  if (appStatusPages.includes(to.name)) {
    menu.setPageTitle("신청현황");
    menu.setMenu(appStatusMenu);
  }

  // 후원 그룹 라우트일 경우 자동 메뉴 설정
  if (sponsorPages.includes(to.name)) {
    menu.setPageTitle("후원 관리자 페이지");
    menu.setMenu(sponsorMenu);
  }

  // 이벤트 그룹 라우트일 경우 자동 메뉴 설정
  if (eventPages.includes(to.name)) {
    menu.setPageTitle("이벤트 페이지");
    menu.setMenu(eventMenu);
  }

  // 조사지 그룹
  const serveyPages = [
    "surveyVersion",
    "survey-new",
    "survey-write",
    "survey-edit",
    "surveyList",
    "surveySubmissionDetail",
    "surveySubmissionEdit",
    "survey-detail-by-ver",
  ];

  // 조사지 그룹 라우트일 경우 자동 메뉴 설정
  if (serveyPages.includes(to.name)) {
    menu.setPageTitle("조사지 페이지");
    menu.setMenu(surveyMenu);
  }

  // 상담 그룹
  const counselPages = [
    "counselList",
    "counsel-new",
    "counsel-edit",
    "counsel-detail",
  ];

  // 상담 그룹 라우트일 경우 자동 메뉴 설정
  if (counselPages.includes(to.name)) {
    menu.setPageTitle("상담 페이지");
    menu.setMenu(counselMenu);
  }

  // 지원 그룹
  const spportPages = [
    "planList",
    "plan-write",
    "plan-edit",
    "planDetail",
    "resultList",
    "result-write",
    "result-edit",
    "resultDetail",
  ];

  // 지원 그룹 라우트일 경우 자동 메뉴 설정
  if (spportPages.includes(to.name)) {
    menu.setPageTitle("지원 페이지");
    menu.setMenu(spportMenu);
  }

  // 승인 요청 그룹 라우트일 경우 자동 메뉴 설정
  if (appReqPages.includes(to.name)) {
    menu.setPageTitle("승인 요청 관리");
    menu.setMenu(appReqMenu);
  }

  // 회원 정보
  const infoPage = ["UserInfo"];
  if (infoPage.includes(to.name)) {
    menu.setPageTitle("마이 페이지");
    menu.setMenu(infoMenu);
  }

  // 히스토리 그룹 라우트일 경우 자동 메뉴 설정
  if (historyPages.includes(to.name)) {
    menu.setPageTitle("히스토리");
    menu.setMenu(historyMenu);
  }

  // 대기자 그룹
  if (pendingPages.includes(to.name)) {
    menu.setPageTitle("대기자 목록");
    menu.setMenu(pendingMenu);
  }

  next();
});

export default router;
