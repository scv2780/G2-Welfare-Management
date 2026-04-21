<template>
  <div class="card">
    <div class="card-body p-3">
      <div class="row">
        <div class="col-8">
          <div class="numbers">
            <p class="text-sm mb-0 text-capitalize font-weight-bold">
              {{ title }}
            </p>
            <h5 class="font-weight-bolder mb-0">
              {{ value }}
              <span class="text-sm text-success font-weight-bolder">{{
                description
              }}</span>
            </h5>
          </div>
        </div>
        <div class="col-4 text-end">
          <div
            class="icon icon-shape text-center shadow border-radius-md"
            :class="`bg-gradient-${color}`"
          >
            <i class="material-icons opacity-10 text-white">{{ icon }}</i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "MiniStatisticsCard",
  props: {
    title: String,
    value: String,
    description: String,
    icon: String,
    color: {
      type: String,
      default: "primary",
    },
  },
};
</script>

<style scoped>
.card {
  border-radius: 1rem;
}
.icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
