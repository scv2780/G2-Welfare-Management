export const sponsorMenu = [
  {
    label: "후원 프로그램 목록",
    path: "/sponsorProgramList",
    collapseRef: "sponsorProgramList",
    role: ["AA0", "AA1", "AA2", "AA3"],
  },
  {
    label: "후원 프로그램 관리",
    path: "/sponsor",
    collapseRef: "sponsor",
    role: ["AA2", "AA3"],
  },
  {
    label: "전체 후원 내역",
    path: "/mygiving",
    collapseRef: "mygiving",
    role: ["AA2", "AA3"],
  },
  {
    label: "활동 보고서",
    path: "/activity",
    collapseRef: "SponsorActivity",
    role: ["AA0", "AA1", "AA2", "AA3"],
  },
  {
    label: "후원 예산 총괄표",
    path: "/budget-summary",
    collapseRef: "BudgetSummary",
    role: ["AA0", "AA1", "AA2", "AA3", "AA4"],
  },
];

export const eventMenu = [
  {
    label: "이벤트 목록",
    path: "/event/list",
    collapseRef: "EventList",
    role: ["AA1", "AA2", "AA3"],
  },
  {
    label: "이벤트 신청 내역",
    path: "/event/apply-list",
    collapseRef: "EventApplyList",
    role: ["AA1"],
  },
  {
    label: "이벤트 등록",
    path: "/event/add",
    collapseRef: "EventAdd",
    role: ["AA2"],
  },
  {
    label: "결과보고서 등록",
    path: "/event/result-add",
    collapseRef: "EventResultAdd",
    role: ["AA2"],
  },
  {
    label: "내 요청 목록",
    path: "/event/apply-result",
    collapseRef: "EventApplyResult",
    role: ["AA2"],
  },
  {
    label: "승인 요청 관리",
    path: "/event/apply-result",
    collapseRef: "EventApplyResult",
    role: ["AA3"],
  },
  // {
  //   label: '담당자 목록',
  //   path: '/event/manager-list',
  //   collapseRef: 'EventManagerList',
  //   role: ['AA2', 'AA3'],
  // },
  {
    label: "참가자 목록",
    path: "/event/attendance-list",
    collapseRef: "EventAttendanceList",
    role: ["AA2"],
  },
];

export const appReqMenu = [
  {
    label: "가입 기관 관리",
    path: "/organization",
    collapseRef: "Organization",
    role: ["AA4"],
  },
  {
    label: "기관 관리자 승인",
    path: "/managerApprovals",
    collapseRef: "ManagerApprovals",
    role: ["AA4"],
  },
  {
    label: "기관 담당자 승인",
    path: "/staffApprovals",
    collapseRef: "StaffApprovals",
    role: ["AA3", "AA4"],
  },
  {
    label: "우선순위 승인",
    path: "/priorityApprovals",
    collapseRef: "PriorityApprovals",
    role: ["AA3", "AA4"],
  },
  {
    label: "지원 계획 승인",
    path: "/supportPlanApprovals",
    collapseRef: "SupportPlanApprovals",
    role: ["AA3", "AA4"],
  },
  {
    label: "지원 결과 승인",
    path: "/supportResultApprovals",
    collapseRef: "SupportResultApprovals",
    role: ["AA3", "AA4"],
  },
  {
    label: "이벤트 계획 승인",
    path: "/eventPlanApprovals",
    collapseRef: "EventPlanApprovals",
    role: ["AA3", "AA4"],
  },
  {
    label: "이벤트 결과 승인",
    path: "/eventResultApprovals",
    collapseRef: "EventResultApprovals",
    role: ["AA3", "AA4"],
  },
  {
    label: "후원 계획 승인",
    path: "/sponsorshipPlanApprovals",
    collapseRef: "SponsorshipPlanApprovals",
    role: ["AA3", "AA4"],
  },
  // {
  //   label: "후원 결과 승인",
  //   path: "/sponsorshipResultApprovals",
  //   collapseRef: "SponsorshipResultApprovals",
  //   role: ["AA3", "AA4"],
  // },
  {
    label: "권한 이전",
    path: "/authorityTransfer",
    collapseRef: "AuthorityTransfer",
    role: ["AA3"],
  },
];

export const surveyMenu = [
  {
    label: "조사지 목록",
    path: "/survey-list",
    collapseRef: "Survey",
    role: ["AA1", "AA2", "AA3", "AA4"],
  },
  {
    label: "버전별 조사지 목록",
    path: "/survey-version",
    collapseRef: "Survey",
    role: ["AA4"],
  },
];

export const spportMenu = [
  {
    label: "지원계획 목록",
    path: "/plan-list",
    collapseRef: "Plan",
    role: ["AA1", "AA2", "AA3", "AA4"],
  },
  {
    label: "지원결과 목록",
    path: "/result-list",
    collapseRef: "Result",
    role: ["AA1", "AA2", "AA3", "AA4"],
  },
];

export const counselMenu = [
  {
    label: "상담 목록",
    path: "/counsel-list",
    collapseRef: "Counsel",
    role: ["AA2", "AA3", "AA4"],
  },
];

export const infoMenu = [
  {
    label: "회원 정보 관리",
    path: "/userinfo",
    collapseRef: "UserInfo",
    role: ["AA1", "AA2", "AA3"],
  },
];

export const historyMenu = [
  {
    label: "히스토리",
    path: "/historyList",
    collapseRef: "HistoryList",
    role: ["AA3", "AA4"],
  },
];

export const pendingMenu = [
  {
    label: "담당자 배정 목록",
    path: "/pendingapproval",
    collapseRef: "PendingApproval",
    role: ["AA2", "AA3", "AA4"],
  },
];

export const appStatusMenu = [
  {
    label: "신청현황",
    path: "/applicationStatus",
    collapseRef: "ApplicationStatus",
    role: ["AA1"],
  },
];
