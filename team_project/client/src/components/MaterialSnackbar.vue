<template>
  <div class="toast fade show p-2 mt-2" :class="getColor(color)">
    <div class="toast-header bg-transparent border-0">
      <i class="material-icons me-2" :class="getIcon(icon.color)">
        {{ icon.component }}
      </i>

      <!-- 🔹 simple 모드면 description(또는 title)만 표시 -->
      <span class="me-auto font-weight-bold" :class="getTextColor(color)">
        {{ simple ? description || title : title }}
      </span>

      <!-- 날짜는 simple 모드에선 안 쓰도록 -->
      <small v-if="!simple" :class="getTextColor(color)">{{ date }}</small>

      <i
        class="fas fa-times text-md ms-3 cursor-pointer"
        :class="getTextColor(color)"
        @click="closeHandler"
      />
    </div>

    <!-- 🔹 simple 모드에서는 hr + body 안 보이게 -->
    <template v-if="!simple">
      <hr class="horizontal dark m-0" :class="getHrColor(color)" />
      <div class="toast-body" :class="getTextColor(color)">
        {{ description }}
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: "MaterialSnackbar",
  props: {
    title: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    icon: {
      type: Object,
      component: String,
      color: String,
      default: () => ({}),
    },
    color: {
      type: String,
      default: "success",
    },
    closeHandler: {
      type: Function,
      default: () => {},
    },
    // 🔥 추가: 심플 모드 (한 줄짜리 스낵바)
    simple: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    getColor: (color) => {
      if (color === "white") return "bg-white";
      return `bg-gradient-${color}`;
    },
    getIcon: (iconColor) => (iconColor ? `text-${iconColor}` : null),
    getTextColor: (color) => (color === "white" ? "text-dark" : "text-white"),
    getHrColor: (color) => (color === "white" ? "dark" : "light"),
  },
};
</script>
