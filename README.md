# G2 장애인 지원 프로그램
<img width="1889" height="948" alt="메인" src="https://github.com/user-attachments/assets/6a214a16-b317-49a8-8e57-175bf7408ab2" />

## 📑 바로가기

<p align="center">
  <a href="#프로젝트-개요"><kbd>📘 프로젝트 개요</kbd></a>
  &nbsp;&nbsp;
  <a href="#기관-관리-파트"><kbd>🧩 내 파트 (기관 관리)</kbd></a>
  &nbsp;&nbsp;
  <a href="#프로젝트-소감"><kbd>📝 프로젝트 소감</kbd></a>
  &nbsp;&nbsp;
  <a href="#Project-Structure"><kbd>📁 Project Structure</kbd></a>
</p>

## 프로젝트 개요

본 프로젝트는 **Vue + Express 기반의 장애인 지원 복지 프로그램**으로,  
흩어져 있는 복지 정보를 하나의 플랫폼으로 통합하여  
**장애인과 적합한 지원 프로그램을 자동으로 연결**하는 것을 목표로 합니다.

조사지 작성부터 상담, 지원 계획 수립, 승인까지의 전 과정을  
**One-Stop으로 통합 관리**하며,  
찾아가는 복지가 아닌 **필요한 사람에게 먼저 다가가는 맞춤형 연결 시스템**을 제공합니다.

### 개발 일정
- **2025.10.31 ~ 2025.11.25**

### 메인 링크
- 🔗 https://github.com/scv2780/G2

### 활용 방안

- 지자체 복지 포털 및 장애인복지관의  
  **업무 효율화를 위한 실무 도구로 즉시 활용 가능**
- 민간 기업의 **CSR 프로그램 및 후원 매칭 플랫폼**으로 확장 가능
- 수집된 데이터를 활용한  
  **증거 기반(Evidence-based) 복지 정책 수립 지원**

### 기대 효과

- 복지 사각지대에 놓인 장애인을  
  **실질적인 지원 프로그램과 연결**하여 사회 참여 기회 확대
- 정보 통합 및 프로세스 자동화를 통한  
  **행정 효율성 향상 및 중복 지원 방지**
- 노인·아동·자립 청년 등  
  **다양한 취약계층 지원 분야로 플랫폼 모델 확장 가능**

<!--
팀 소개 방법 들 일반/테이블/이미지테이블
팀 :  도우서, 정재은, 성찬혁, 권수민, 송승일
이름 : 도우서
직책 : 팀장
역할 : 후원
### 팀 구성 및 역할
| 이름 | 담당 역할 |
|------|-----------|
| 홍길동 | 프로젝트 총괄, 기획 |
| 김철수 | 프론트엔드 UI 구현 |
| 이영희 | 백엔드 API 개발 |
| **본인** | DB 설계 및 ○○ 기능 담당 |
-->
## 팀 구성 및 역할

<table border="1" cellpadding="12" cellspacing="0" align="center" >
  <tr>
    <th align="center">도우서</th>
    <th align="center">정재은</th>
    <th align="center">성찬혁</th>
    <th align="center">송승일</th>
    <th align="center">권수민</th>
  </tr>
  <tr>
    <td align="center">
      <img width="120" alt="male" src="https://github.com/user-attachments/assets/4c713a36-ac69-4107-bf2e-e7de21af0f90" />
    </td>
    <td align="center">
      <img width="120" alt="female" src="https://github.com/user-attachments/assets/8d5708ba-b9f8-41e6-bd47-7c5e777a0088" />
    </td>
    <td align="center">
      <img width="120" alt="male" src="https://github.com/user-attachments/assets/4c713a36-ac69-4107-bf2e-e7de21af0f90" />
    </td>
    <td align="center">
      <img width="120" alt="male" src="https://github.com/user-attachments/assets/4c713a36-ac69-4107-bf2e-e7de21af0f90" />
    </td>
    <td align="center">
      <img width="120" alt="female" src="https://github.com/user-attachments/assets/8d5708ba-b9f8-41e6-bd47-7c5e777a0088" />
    </td>
  </tr>
  <tr>
    <td align="center">팀장 </br> 후원</td>
    <td align="center">부팀장 </br> 조사지, 상담, 지원</td>
    <td align="center">Git 관리 </br> 기관, 승인요청,</br> 히스토리 관리</td>
    <td align="center">개발환경 구축 </br> 회원, 담당자 배정</td>
    <td align="center">DB 관리 </br> 이벤트 </td>
  </tr>
</table>


## 개발 환경
```
[FRONT]    JavaScript, Vue.js, HTML, CSS
[BACK]     Express.js, Node.js
[DATABASE] MariaDB
[TOOL]     Git, Github Action, NAVER Cloud Platform, Visual Studio Code
```

---

<p align="center">
  <a href="#프로젝트-개요"><kbd>📘 프로젝트 개요</kbd></a>
  &nbsp;&nbsp;
  <a href="#기관-관리-파트"><kbd>🧩 내 파트 (기관 관리)</kbd></a>
  &nbsp;&nbsp;
  <a href="#프로젝트-소감"><kbd>📝 프로젝트 소감</kbd></a>
  &nbsp;&nbsp;
  <a href="#Project-Structure"><kbd>📁 Project Structure</kbd></a>
</p>

---

# 기관 관리 파트 

본 프로젝트의 **기관 관리 시스템**은 복지 서비스 제공의 주체인 기관을 등록하고,  
시스템 관리자가 **기관을 관리**할 수 있으며,
각 기관으로의 관리자/담당자 회원가입 **요청을 승인/반려**할 수 있습니다.
 
지원관련 변경 이력은 **히스토리 시스템**을 통해 데이터의 투명성을 보장합니다.

## 주요 페이지 별 기능

### 기관 관리
<p align="center">
  <img width="1920" height="921" alt="가입 기관 관리" src="https://github.com/user-attachments/assets/1379f98e-8ebe-4db9-99f7-e84b10c95821" />
</p>

+ 시스템에 등록된 모든 복지 기관의 상태(운영/임시중단/종료)를 한눈에 파악할 수 있습니다.
+ **Priority Mapping:** 특정 상태 코드를 가독성 있는 라벨로 즉시 치환하는 유틸리티 함수를 적용하여 관리 편의성을 높였습니다.

### 승인 요청 관리
<p align="center">
 <img width="500" alt="기관 관리자 승인" src="https://github.com/user-attachments/assets/e67ddb97-505f-46fb-923b-844f2d63c91a" />
 <img width="500" alt="기관 담당자 승인" src="https://github.com/user-attachments/assets/c36c648c-76dd-4158-8737-92bd4e35dbea" />
</p>

+ 기관 관리자와 기관 담당자의 회원가입 신청 건의 상태(요청/승인/반려)를 리스트로 확인 가능합니다.
+ 각 요청건에 대해 시스템 관리자와 기관 관리자가 승인 또는 반려 처리를 수행하며, 반려 시 사유를 기록하여 메일로 피드백을 전달합니다.

### 권한 이전
<p align="center">
  <img width="1920" height="920" alt="권한 이전" src="https://github.com/user-attachments/assets/e22b7ba3-9556-415a-bb42-488dd860890d" />
</p>

+ 기관 관리자가 접근 가능하며 담당자를 선택해 담당하고 있는 이용자를 조회하고 선택하여 담당자를 변경 가능합니다.

### 히스토리
<p align="center">
  <img width="1920" height="920" alt="히스토리" src="https://github.com/user-attachments/assets/5cb1edd5-d95f-4c90-b26b-21949129564b" />
</p>

+ 시스템 관리자, 기관 관리자가 접근 가능하며 수정이력을 확인 가능합니다.
+ **데이터 매핑 로직:** DB의 복잡한 JSON 변경 이력 데이터를 파싱하여 사용자에게 직관적인 한글 컬럼명(예: status → 상태)으로 변환해 제공합니다.



---

<p align="center">
  <a href="#프로젝트-개요"><kbd>📘 프로젝트 개요</kbd></a>
  &nbsp;&nbsp;
  <a href="#기관-관리-파트"><kbd>🧩 내 파트 (기관 관리)</kbd></a>
  &nbsp;&nbsp;
  <a href="#프로젝트-소감"><kbd>📝 프로젝트 소감</kbd></a>
  &nbsp;&nbsp;
  <a href="#Project-Structure"><kbd>📁 Project Structure</kbd></a>
</p>

# 프로젝트 소감

이번 프로젝트에서 **Git 관리자**이자 **기관 관리 시스템 개발자**로서 팀의 기술적 기반을 다지는 경험을 할 수 있었습니다.  
특히 DB에서 넘어오는 원시 데이터를 사용자 친화적인 정보로 가공하는 **데이터 매핑 로직**을 구현하며 백엔드와 프론트엔드 사이의 데이터 흐름을 깊이 있게 이해하게 되었습니다.

협업 측면에서는 다수의 팀원이 동시에 작업하며 발생하는 **코드 충돌을 조율하고 해결**하면서, 명확한 브랜치 전략과 컨벤션의 중요성을 체감했습니다. 빌드 환경과 배포 환경 간의 차이로 인한 이슈를 해결하는 과정에서 시스템 인프라에 대한 시야도 넓힐 수 있었습니다.

아쉬운 점은 일정 관리 문제로 인해 기관 데이터 통계 시각화 기능을 충분히 구현하지 못한 것입니다. 추후에는 **대시보드 형태의 통계 기능**을 추가하여 운영자가 기관 현황을 더 정교하게 분석할 수 있도록 개선하고 싶습니다. 이번 프로젝트는 단순한 기능 구현을 넘어, **협업의 가치와 견고한 시스템 설계의 중요성**을 배운 소중한 시간이었습니다.

<p align="center">
  <a href="#프로젝트-개요"><kbd>📘 프로젝트 개요</kbd></a>
  &nbsp;&nbsp;
  <a href="#기관-관리-파트"><kbd>🧩 내 파트 (기관 관리)</kbd></a>
  &nbsp;&nbsp;
  <a href="#프로젝트-소감"><kbd>📝 프로젝트 소감</kbd></a>
  &nbsp;&nbsp;
  <a href="#Project-Structure"><kbd>📁 Project Structure</kbd></a>
</p>

## Project Structure

### Client / Server Architecture

<div align="center">
  <table>
    <tr>
      <td align="center" valign="top">
        <b>Client</b><br/>
        <img src="https://github.com/user-attachments/assets/c612559b-fe89-497b-a3d1-659f40ba0ff4" width="420"/>
      </td>
      <td align="center" valign="top">
        <b>Server</b><br/>
        <img src="https://github.com/user-attachments/assets/69b9f5c4-bed8-4193-9b16-2818175a7161" width="420"/>
      </td>
    </tr>
  </table>
</div>

### MY Client

```text
client
 └── src
      └── views (프론트엔드 핵심 화면 전담)
          ├── 📄 ApplicationStatus.vue                // 신청현황
          ├── 📄 AuthorityTransfer.vue                // 담당자 권한 이전
          ├── 📄 EventPlanApproval.vue                // 이벤트 계획 승인 요청 목록
          ├── 📄 EventResultApproval.vue              // 이벤트 결과 승인 요청 목록
          ├── 📄 HistoryList.vue                      // 히스토리
          ├── 📄 ManagerApprovals.vue                 // 관리자 승인 요청 목록
          ├── 📄 Organization.vue                     // 기관관리
          ├── 📄 PriorityApproval.vue                 // 우선순위 승인 요청 목록
          ├── 📄 SponsorshipPlanApproval.vue          // 후원계획 승인 요청 목록
          ├── 📄 SponsorshipResultApproval.vue        // 후원 결과 승인 요청 목록
          ├── 📄 StaffApprovals.vue                   // 담당자 승인 요청 목록
          ├── 📄 SupportPlanApproval.vue              // 지원계획 승인 요청 목록
          └── 📄 SupportResultApproval.vue            // 지원결과 승인 요청 목록
```

### MY Server Architecture

```text
server
├── mappers
│    ├── 📄approvalMapper.js                // 승인관련 매퍼
│    ├── 📄authorityTransferMapper.js       // 권한이전 매퍼
│    ├── 📄historyMapper.js                 // 히스토리 매퍼
│    ├── 📄managerMapper.js                 // 신청현황 매퍼
│    └── 📄orgMapper.js                     // 기관관리 매퍼
└── routes
│    ├── 📄approvalRoute.js                 // 승인관련 라우팅
│    ├── 📄authorityTransferRoute.js        // 권한이전 라우팅
│    ├── 📄historyRoute.js                  // 히스토리 라우팅
│    ├── 📄managerRoute.js                  // 신청현황 라우팅
│    └── 📄orgRoute.js                      // 기관관리 라우팅
└── services
│    ├── 📄approvalService.js               // 승인관련 서비스
│    ├── 📄authorityTransferService.js      // 권한이전 서비스
│    ├── 📄historyService.js                // 히스토리 서비스
│    ├── 📄managerService.js                // 신청현황 서비스
│    └── 📄orgService.js                    // 기관관리 서비스
└── sql
     ├── 📄approvalSQL.js                   // 승인관련 쿼리
     ├── 📄authorityTransferSQL.js          // 권한이전 쿼리
     ├── 📄historySQL.js                    // 히스토리 쿼리
     ├── 📄managerSQL.js                    // 신청현황 쿼리
     └── 📄orgSQL.js                        // 기관관리 쿼리
```
