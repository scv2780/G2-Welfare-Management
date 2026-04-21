# G2 장애인 지원 복지 프로그램

<p align="center">
<img width="1889" alt="메인 화면" src="https://github.com/user-attachments/assets/6a214a16-b317-49a8-8e57-175bf7408ab2"/>
</p>

---

## 📑 바로가기

<p align="center">
  <a href="#프로젝트-개요"><kbd>📘 프로젝트 개요</kbd></a>
  &nbsp;&nbsp;
  <a href="#개발-환경"><kbd>⚙️ 개발 환경</kbd></a>
  &nbsp;&nbsp;
  <a href="#데이터-베이스"><kbd>🗄️ 데이터 베이스</kbd></a>
  &nbsp;&nbsp;
  <a href="#프로세스-흐름도"><kbd>🔄 프로세스 흐름도</kbd></a>
  &nbsp;&nbsp;
  <a href="#프로젝트-소감"><kbd>📝 프로젝트 소감</kbd></a>
</p>

<p align="center">
  <a href="#회원관리-파트"><kbd>🧩 회원 관리</kbd></a>
  &nbsp;&nbsp;
  <a href="#상담관리-파트"><kbd>🧩 상담 관리</kbd></a>
  &nbsp;&nbsp;
  <a href="#기관관리-파트"><kbd>🧩 기관 관리</kbd></a>
  &nbsp;&nbsp;
  <a href="#후원관리-파트"><kbd>🧩 후원 관리</kbd></a>
  &nbsp;&nbsp;
  <a href="#이벤트관리-파트"><kbd>🧩 이벤트 관리</kbd></a>
</p>

---

# 프로젝트 개요

G2 장애인 지원 프로그램은 장애인 복지 지원 과정을 효율적으로 관리하기 위해 개발된 웹 기반 복지 관리 시스템입니다.

지원 신청, 상담 관리, 기관 승인, 후원 및 이벤트 기능을 하나의 시스템에서 통합적으로 관리하여 복지 지원 업무의 효율성을 높이는 것을 목표로 개발되었습니다.

### 개발 일정
- **2025.10.31 ~ 2025.12.01 (약 4주)**

---

# 팀 구성 및 역할

<table border="1" cellpadding="12" cellspacing="0" align="center">
<tr>
<th align="center">도우서</th>
<th align="center">정재은</th>
<th align="center">성찬혁</th>
<th align="center">송승일</th>
<th align="center">권수민</th>
</tr>

<tr>
<td align="center">
<img width="120" src="https://github.com/user-attachments/assets/fd2ed4de-b16c-4339-a6f7-bc8f4d846d29"/>
</td>

<td align="center">
<img width="120" src="https://github.com/user-attachments/assets/8d5708ba-b9f8-41e6-bd47-7c5e777a0088"/>
</td>

<td align="center">
<img width="120" src="https://github.com/user-attachments/assets/4c713a36-ac69-4107-bf2e-e7de21af0f90"/>
</td>

<td align="center">
<img width="120" src="https://github.com/user-attachments/assets/6856563a-b344-4d2c-81ad-2698f3a3f51c"/>
</td>

<td align="center">
<img width="120" src="https://github.com/user-attachments/assets/8d5708ba-b9f8-41e6-bd47-7c5e777a0088"/>
</td>
</tr>

<tr>
<td align="center">팀장<br>후원 기능</td>
<td align="center">부팀장<br>조사지 / 상담 / 지원</td>
<td align="center">기관 관리<br>승인 요청 / 히스토리<br>Git 관리</td>
<td align="center">회원 관리<br>배정 목록<br>개발 환경 구축</td>
<td align="center">이벤트 관리<br>DB 관리</td>
</tr>
</table>

---

# 개발 환경
```
[FRONTEND] Vue, Pinia  
[BACKEND] Express, Nodemon  
[DATABASE] MySQL, MariaDB  
[SERVER] NAVER Cloud  
[DEVOPS] GitHub Actions  
[TOOL] VSCode  
[COLLABORATION] Discord, GitHub  
```
---

# 데이터 베이스

<p align="center">
<img width="900" src="https://github.com/user-attachments/assets/16af864c-6498-4189-b915-a187f6d5b208"/>
</p>

---

# 프로세스 흐름도

<p align="center">
<img width="900" src="https://github.com/user-attachments/assets/88cd4e25-d6ec-4b88-9d79-3887b57bccd3"/>
</p>

지원 신청 → 상담 및 조사 → 기관 승인 → 후원 및 지원 진행

---

# 회원관리 파트

회원 가입 및 로그인 기능을 제공하며 사용자 정보를 관리합니다.

- 회원 가입 및 로그인
- 사용자 정보 관리
- 사용자 역할 관리

---

# 상담관리 파트

지원 신청자에 대한 상담 및 조사 업무를 관리합니다.

- 상담 기록 관리
- 조사 결과 등록
- 지원 대상 관리

---

# 기관관리 파트

복지 기관 관련 정보 및 승인 요청을 관리합니다.

- 기관 정보 관리
- 지원 승인 요청 관리
- 승인 이력 관리

---

# 후원관리 파트
🔗 [GitHub 개인 Repository 바로가기](https://github.com/Peinoi/G2)<br>
후원 프로그램 운영과 후원금 결제 기능을 제공합니다.  
사용자는 진행 중인 후원 프로그램을 확인하고 후원 금액을 선택하여 결제할 수 있으며,  
후원 내역과 활동 보고서를 통해 후원금 사용 내역을 확인할 수 있습니다.

---

## 주요 기능

- 후원 프로그램 등록 및 관리 (기관 담당자)
- 후원 프로그램 승인 요청 및 승인 관리
- 카카오페이 API 기반 후원 결제 기능
- 후원 내역 조회 및 관리
- 후원 활동 보고서 작성 및 열람 (CKEditor5 적용)

---

## 프로그램 관리

<p align="center">
 <img width="400" alt="후원 프로그램 관리" src="https://github.com/user-attachments/assets/9d7f1ab0-aadd-42f2-878c-248be270f3d2" />
 <img width="400" alt="후원 프로그램 등록" src="https://github.com/user-attachments/assets/70111fa3-a085-4af6-ad0c-760ecb8ee46f" />
</p>

---

## 후원 결제

<p align="center">
 <img width="600" alt="후원 프로그램 결제" src="https://github.com/user-attachments/assets/b9fcd6d2-6d98-47ef-a7f8-491d28751685" />
</p>

---

## 후원 활동 보고서

<p align="center">
  <img width="400" alt="활동 보고서" src="https://github.com/user-attachments/assets/67c7e7a6-1de8-487b-b299-4371ee11fe0b" />
  <img width="400" alt="활동 보고서 등록" src="https://github.com/user-attachments/assets/3204b0d7-92cf-4514-9f3a-4b1d805e2e59" />
</p>

---

# 이벤트관리 파트

복지 이벤트 및 지원 프로그램을 관리합니다.

- 이벤트 등록
- 이벤트 참여 관리

---

# 시연 영상

https://www.youtube.com/watch?v=_MJcozV6HFE

---

# 프로젝트 소감

본 프로젝트를 통해 복지 지원 업무 프로세스를 이해하고 이를 시스템으로 구현하는 경험을 할 수 있었습니다.

특히 사용자 역할에 따른 기능 분리와 데이터 관리 구조를 설계하는 과정에서 웹 서비스 설계에 대한 이해를 높일 수 있었습니다.
