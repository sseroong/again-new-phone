<script setup lang="ts">
import { PRODUCT_GRADES, type ProductGrade } from '@phone-marketplace/shared';

const props = withDefaults(defineProps<{
  grade: ProductGrade | string;
  size?: 'sm' | 'md';
  linkable?: boolean;
}>(), {
  size: 'sm',
  linkable: false,
});

const gradeInfo = computed(() => {
  return PRODUCT_GRADES[props.grade as ProductGrade] || null;
});

const colorClasses: Record<string, string> = {
  NEW: 'bg-emerald-100 text-emerald-700',
  UNOPENED: 'bg-green-100 text-green-700',
  S_PLUS: 'bg-blue-100 text-blue-700',
  S: 'bg-sky-100 text-sky-700',
  A: 'bg-indigo-100 text-indigo-700',
  B_PLUS: 'bg-violet-100 text-violet-700',
  B: 'bg-purple-100 text-purple-700',
  C: 'bg-yellow-100 text-yellow-700',
  D: 'bg-orange-100 text-orange-700',
  E: 'bg-red-100 text-red-700',
};

const badgeColorClass = computed(() => {
  return colorClasses[props.grade] || 'bg-gray-100 text-gray-700';
});

const sizeClasses = computed(() => {
  return props.size === 'md'
    ? 'text-sm px-2.5 py-1'
    : 'text-xs px-1.5 py-0.5';
});
</script>

<template>
  <UTooltip v-if="gradeInfo" :text="gradeInfo.description">
    <NuxtLink
      v-if="linkable"
      to="/grade-guide"
      class="grade-badge inline-flex items-center rounded font-semibold cursor-pointer hover:opacity-80 transition-opacity"
      :class="[badgeColorClass, sizeClasses]"
    >
      {{ gradeInfo.label }}
    </NuxtLink>
    <span
      v-else
      class="grade-badge inline-flex items-center rounded font-semibold"
      :class="[badgeColorClass, sizeClasses]"
    >
      {{ gradeInfo.label }}
    </span>
  </UTooltip>
</template>
