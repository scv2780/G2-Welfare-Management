<template>
  <div class="container-fluid py-4">
    <!-- 🎞 상단 슬라이드 배너 -->
    <div class="row mb-5">
      <div class="col-12">
        <div
          id="bannerCarousel"
          class="carousel slide shadow-sm rounded-4 overflow-hidden"
          data-bs-ride="carousel"
          data-bs-interval="5000"
        >
          <div class="carousel-inner">
            <!-- ✅ 이벤트 + 후원 합친 배너 사용 -->
            <template v-if="bannerSlides.length">
              <div
                v-for="(item, idx) in bannerSlides"
                :key="item._bannerKey || item.event_code || item.program_code"
                class="carousel-item"
                :class="{ active: idx === 0 }"
                @click="handleBannerClick(item)"
                style="cursor: pointer"
              >
                <div class="banner-ratio">
                  <img
                    :src="item.file_path"
                    :alt="item.title || item.event_name || item.program_name"
                  />
                </div>
              </div>
            </template>

            <!-- ❌ 배너가 하나도 없을 때: 기본 이미지 -->
            <template v-else>
              <div class="carousel-item active">
                <div class="banner-ratio">
                  <img src="@/assets/img/banner/1.png" alt="이벤트 배너" />
                </div>
              </div>
              <div class="carousel-item">
                <div class="banner-ratio">
                  <img src="@/assets/img/banner/2.png" alt="후원 배너" />
                </div>
              </div>
              <div class="carousel-item">
                <div class="banner-ratio">
                  <img src="@/assets/img/banner/3.png" alt="공지 배너" />
                </div>
              </div>
            </template>
          </div>

          <button
            class="carousel-control-prev"
            type="button"
            data-bs-target="#bannerCarousel"
            data-bs-slide="prev"
          >
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Previous</span>
          </button>
          <button
            class="carousel-control-next"
            type="button"
            data-bs-target="#bannerCarousel"
            data-bs-slide="next"
          >
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Next</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 📊 하단 2x2 그리드 -->
    <div class="summary-grid">
      <!-- (1,1) 신청 현황 -->
      <div class="summary-item summary-item--apply">
        <dashboard-table-card
          title="신청 현황"
          icon="assignment"
          color="success"
          :columns="[
            { label: 'NO', field: 'no', align: 'left' },
            { label: '지원자', field: 'child_name', align: 'left' },
            { label: '신청일', field: 'survey_date', align: 'left' },
            { label: '상태', field: 'status_label', align: 'right' },
          ]"
          :rows="applyRows"
          :maxRows="4"
          :user-role="userRole"
          @row-click="goApplicationStatus"
        />
      </div>

      <!-- (1,2) 이벤트 카드 (테이블) -->
      <div class="summary-item summary-item--event">
        <dashboard-table-card
          title="이벤트"
          icon="event"
          color="info"
          :columns="[
            { label: 'NO', field: 'no', align: 'left' },
            { label: '이벤트명', field: 'event_name', align: 'left' },
            { label: '기간', field: 'period', align: 'left' },
          ]"
          :rows="eventRows || []"
          :maxRows="4"
          empty-message-override="등록된 이벤트가 없습니다."
          @row-click="goEventDetail"
        />
      </div>

      <!-- (2,1) 동글동글 퀵 버튼 -->
      <div class="summary-item summary-item--actions">
        <div class="quick-actions-inline">
          <button class="quick-action-btn" @click="handleSurveyClick">
            <span class="quick-action-label">{{ surveyMainText }}</span>
            <span class="quick-action-sub">{{ surveySubText }}</span>
          </button>
          <button class="quick-action-btn" @click="goEvent">
            <span class="quick-action-label">이벤트</span>
            <span class="quick-action-sub">바로가기</span>
          </button>
          <button class="quick-action-btn" @click="goSupport">
            <span class="quick-action-label">후원</span>
            <span class="quick-action-sub">바로가기</span>
          </button>
        </div>
      </div>

      <!-- (2,2) 후원 카드 (테이블) -->
      <div class="summary-item summary-item--donation">
        <dashboard-table-card
          title="후원 프로그램"
          icon="volunteer_activism"
          color="primary"
          :columns="[
            { label: 'NO', field: 'no', align: 'left' },
            { label: '후원명', field: 'program_name', align: 'left' },
            { label: '기간', field: 'period', align: 'left' },
          ]"
          :rows="sponsorRows || []"
          :maxRows="4"
          empty-message-override="등록된 후원 프로그램이 없습니다."
          @row-click="goSponsorDetail"
        />
      </div>
    </div>
  </div>
</template>

<script>
import DashboardTableCard from "@/components/DashboardTableCard.vue";
import axios from "axios";

export default {
  name: "Dashboard",
  components: { DashboardTableCard },
  data() {
    return {
      userRole: null,
      applyRows: [],
      eventRows: [],
      sponsorRows: [],
      loadingApply: false,
      loadingEvent: false,
      loadingSponsor: false,
      // 배너용 이벤트
      bannerEvents: [],
      // 배너용 후원
      bannerSponsors: [],
    };
  },
  created() {
    // 로그인 정보에서 role 세팅
    const userStr = localStorage.getItem("user");

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userRole = user.role || null;
      } catch (e) {
        console.error("[Dashboard] user 파싱 실패:", e);
        this.userRole = null;
      }
    }

    // AA1~AA4는 모두 신청 현황 조회
    if (["AA1", "AA2", "AA3", "AA4"].includes(this.userRole)) {
      this.fetchApplyStats();
    }

    // 이벤트 / 후원 목록 조회
    this.fetchEventList();
    this.fetchSponsorList();
  },
  computed: {
    surveyMainText() {
      if (this.userRole === "AA0" || !this.userRole) return "로그인";
      return "조사지";
    },
    surveySubText() {
      if (this.userRole === "AA0" || !this.userRole) return "로그인 하러가기";
      if (this.userRole === "AA1") return "작성하기";
      if (["AA2", "AA3", "AA4"].includes(this.userRole)) return "목록 바로가기";
      return "";
    },
    bannerSlides() {
      const merged = [...this.bannerEvents, ...this.bannerSponsors];
      if (!merged.length) return [];

      // 새로고침마다 랜덤 섞고, 첫 번째만 active 표시
      const shuffled = [...merged].sort(() => Math.random() - 0.5);
      return shuffled.map((item, idx) => ({
        ...item,
        _active: idx === 0,
      }));
    },
  },
  methods: {
    // ───────────────── 신청 관련 ─────────────────
    handleSurveyClick() {
      const role = this.userRole;

      if (role === "AA1") {
        this.$router.push("/survey/write");
      } else if (["AA2", "AA3", "AA4"].includes(role)) {
        this.$router.push("/survey-list");
      } else {
        this.$router.push("/sign-in");
      }
    },

    // ───────────────── 라우팅 ─────────────────
    goEvent() {
      this.$router.push("/event/list");
    },
    goSupport() {
      this.$router.push("/sponsorprogramlist");
    },
    goEventDetail({ row }) {
      if (row.event_code) {
        this.$router.push(`/event/info/${row.event_code}`);
      }
    },
    goSponsorDetail({ row }) {
      if (row.program_code) {
        this.$router.push(`/sponsordetail/${row.program_code}`);
      }
    },
    goApplicationStatus() {
      if (this.userRole === "AA1") {
        this.$router.push({
          name: "ApplicationStatus",
        });
      }
    },

    // ───────────────── 신청 현황 조회 ─────────────────
    async fetchApplyStats() {
      const userStr = localStorage.getItem("user");

      if (!userStr) {
        this.applyRows = [];
        return;
      }

      let loginId = null;
      try {
        const user = JSON.parse(userStr);
        // 백엔드 WHERE parent.user_id = ? 이면 user_id 사용
        loginId = user.user_id;
      } catch (e) {
        console.error("[Dashboard] user 파싱 실패:", e);
        this.applyRows = [];
        return;
      }

      if (!loginId) {
        this.applyRows = [];
        return;
      }

      this.loadingApply = true;

      try {
        const res = await axios.get("/api/applications/mine", {
          params: { loginId, role: this.userRole },
        });

        const raw = res.data?.data ?? [];
        const list = Array.isArray(raw) ? raw : raw ? [raw] : [];

        const sorted = list
          .filter((row) => row && row.submit_code)
          .sort(
            (a, b) =>
              new Date(b.survey_date || b.submit_at || 0) -
              new Date(a.survey_date || a.submit_at || 0)
          )
          .slice(0, 4);

        this.applyRows = sorted.map((row, idx) => {
          const dateStr = row.survey_date
            ? String(row.survey_date).substring(0, 10)
            : "-";

          return {
            no: idx + 1,
            child_name: row.child_name || row.name,
            survey_date: dateStr,
            status_label: this.buildDashboardStatus(row),
          };
        });
      } catch (err) {
        console.error("[Dashboard] 신청 현황 조회 실패:", err);
        this.applyRows = [];
      } finally {
        this.loadingApply = false;
      }
    },

    // ───────────────── 상태 유틸 ─────────────────
    normalizeStatusList(raw) {
      if (Array.isArray(raw)) return raw;
      if (!raw) return [];
      return String(raw)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    },

    // ⭐ Dashboard 카드용 상태 요약
    //   - 계획: 들어온 상태 개수 그대로 count
    //   - 결과: CD4, CD5, CD6, CD7 만 "결과"로 인정 (CD3는 절대 결과로 안침)
    buildDashboardStatus(row) {
      const planList = this.normalizeStatusList(
        row.plan_status_list || row.plan_status
      );
      const resultList = this.normalizeStatusList(
        row.result_status_list || row.result_status
      );

      const planCount = planList.length;

      // ✅ 여기서 CD3는 아예 빼고 세는 부분
      const realResultCount = resultList.filter((code) =>
        ["CD4", "CD5", "CD6", "CD7"].includes(code)
      ).length;

      const parts = [];
      if (planCount > 0) parts.push(`계획 ${planCount}건`);
      if (realResultCount > 0) parts.push(`결과 ${realResultCount}건`);

      if (parts.length > 0) return parts.join(" / ");

      // 둘 다 없으면 상담 유무 확인
      if (row.counsel_status) return "상담 진행중";

      return "접수 완료";
    },

    // ───────────────── 이벤트 / 후원 데이터 ─────────────────
    async fetchEventList() {
      this.loadingEvent = true;
      try {
        const res = await axios.get("/api/event/list");
        const raw = res.data?.data ?? [];

        this.setupBannerEvents(raw);

        const sorted = raw
          .sort((a, b) => b.event_code - a.event_code)
          .slice(0, 4);

        this.eventRows = sorted.map((row, idx) => ({
          no: idx + 1,
          event_code: row.event_code,
          event_name: row.event_name,
          period: `${String(row.event_start_date).substring(0, 10)} ~ ${String(
            row.event_end_date
          ).substring(0, 10)}`,
        }));
      } catch (e) {
        console.error("[Dashboard] 이벤트 목록 조회 실패:", e);
        this.eventRows = [];
        this.bannerEvents = [];
      } finally {
        this.loadingEvent = false;
      }
    },

    async fetchSponsorList() {
      this.loadingSponsor = true;
      try {
        const res = await axios.get("/api/sponsor");
        const raw = res.data?.serviceSponsor ?? [];

        await this.setupBannerSponsors(raw);

        const sorted = raw
          .sort((a, b) => b.program_code - a.program_code)
          .slice(0, 4);

        this.sponsorRows = sorted.map((row, idx) => ({
          no: idx + 1,
          program_code: row.program_code,
          program_name: row.program_name,
          period: `${String(row.start_date).substring(0, 10)} ~ ${String(
            row.end_date
          ).substring(0, 10)}`,
        }));
      } catch (e) {
        console.error("[Dashboard] 후원 프로그램 조회 실패:", e);
        this.sponsorRows = [];
      } finally {
        this.loadingSponsor = false;
      }
    },

    // 배너용 헬퍼 - 이벤트
    setupBannerEvents(events) {
      if (!Array.isArray(events)) {
        this.bannerEvents = [];
        return;
      }

      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const todayDate = new Date(todayStr + "T00:00:00");

      const parseDateOnly = (str) => {
        if (!str) return null;
        const datePart = String(str).split(" ")[0];
        return new Date(datePart + "T00:00:00");
      };

      const candidates = events.filter((e) => {
        if (!e.file_path) return false;

        const recruitStart = parseDateOnly(e.recruit_start_date);
        const recruitEnd = parseDateOnly(e.recruit_end_date);
        if (!recruitStart || !recruitEnd) return false;

        const isUpcoming = todayDate < recruitStart; // 모집 예정
        const isRecruiting =
          todayDate >= recruitStart && todayDate <= recruitEnd; // 모집 중

        return isUpcoming || isRecruiting;
      });

      if (!candidates.length) {
        this.bannerEvents = [];
        return;
      }

      const shuffled = [...candidates].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 2);

      this.bannerEvents = selected.map((item) => ({
        ...item,
        _bannerType: "event",
        _bannerKey: `event-${item.event_code}`,
        title: item.event_name,
      }));
    },

    // 배너용 헬퍼 - 후원 (상세 API 호출해서 file_path 채우기)
    async setupBannerSponsors(programs) {
      if (!Array.isArray(programs)) {
        this.bannerSponsors = [];
        return;
      }

      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const todayDate = new Date(todayStr + "T00:00:00");

      const parseDateOnly = (str) => {
        if (!str) return null;
        const datePart = String(str).split(" ")[0];
        return new Date(datePart + "T00:00:00");
      };

      // 1) 날짜 기준으로 "진행중/예정"만 먼저 필터링
      const timeFiltered = programs.filter((p) => {
        const start = parseDateOnly(p.start_date);
        const end = parseDateOnly(p.end_date);
        if (!start || !end) return false;

        const isUpcoming = todayDate < start; // 진행 예정
        const isOngoing = todayDate >= start && todayDate <= end; // 진행 중
        return isUpcoming || isOngoing;
      });

      if (!timeFiltered.length) {
        this.bannerSponsors = [];
        return;
      }

      // 2) 상위 몇 개만 상세 조회 (예: 5개)
      const targetForDetail = timeFiltered.slice(0, 5);

      // 3) 각 프로그램에 대해 상세 API 호출해서 file_path 있는 것만 추림
      const detailResults = await Promise.all(
        targetForDetail.map(async (p) => {
          try {
            const res = await axios.get(`/api/sponsor/${p.program_code}`);

            const detail =
              res.data?.serviceSponsor || res.data?.data || res.data || {};

            const attachments =
              detail.attachments || detail.attachmentList || detail.files || [];
            const first = Array.isArray(attachments) ? attachments[0] : null;

            const filePath =
              first?.file_path || first?.filePath || first?.path || null;

            if (!filePath) {
              return null;
            }

            return {
              ...p,
              file_path: filePath,
            };
          } catch (e) {
            console.error(
              "[Dashboard] 후원 배너 상세 조회 실패:",
              p.program_code,
              e
            );
            return null;
          }
        })
      );

      const withImage = detailResults.filter(Boolean);

      if (!withImage.length) {
        this.bannerSponsors = [];
        return;
      }

      const shuffled = [...withImage].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 2);

      this.bannerSponsors = selected.map((item) => ({
        ...item,
        _bannerType: "sponsor",
        _bannerKey: `sponsor-${item.program_code}`,
        title: item.program_name,
      }));
    },

    // 배너 클릭 핸들러
    handleBannerClick(item) {
      if (!item) return;

      if (item._bannerType === "event") {
        if (!item.event_code) return;
        this.$router.push(`/event/info/${item.event_code}`);
      } else if (item._bannerType === "sponsor") {
        if (!item.program_code) return;
        this.$router.push(`/sponsordetail/${item.program_code}`);
      }
    },
  },
};
</script>

<style scoped>
.container-fluid {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

@media (min-width: 992px) {
  .container-fluid {
    padding: 0 60px; /* 가운데 여백 */
  }
}

/* 배너 비율 유지 */
.banner-ratio {
  width: 100%;
  aspect-ratio: 21 / 9;
  border-radius: 16px;
  overflow: hidden;
}

.banner-ratio > img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #ffffff;
}

/* 카드와 배너 간격 */
.row + .row {
  margin-top: 2rem;
}

/* 📊 그리드 기본(모바일): 1열 + 순서 지정 */
.summary-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-top: 0.5rem;
  grid-template-areas:
    "apply"
    "event"
    "donation"
    "actions";
}

/* 영역 매핑 */
.summary-item--apply {
  grid-area: apply;
}
.summary-item--event {
  grid-area: event;
}
.summary-item--donation {
  grid-area: donation;
}
.summary-item--actions {
  grid-area: actions;
}

/* 큰 화면(>=768px): 2x2 레이아웃 */
@media (min-width: 768px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: minmax(0, auto);
    grid-template-areas:
      "apply event"
      "actions donation";
  }
}

/* 🔘 퀵액션 버튼 */
.quick-actions-inline {
  display: flex;
  justify-content: space-evenly;
  gap: 1rem;
}

.quick-action-btn {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border: none;
  background: #ffffff;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #111827;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease;
}

.quick-action-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.16);
  background-color: #f9fafb;
}

.quick-action-label {
  font-size: 13px;
  font-weight: 700;
}

.quick-action-sub {
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
}
</style>
