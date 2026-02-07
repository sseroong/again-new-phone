<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: number;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}>(), {
  readonly: false,
  size: 'md',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

const hoverValue = ref(0);

const sizeClasses: Record<string, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const iconSize = computed(() => sizeClasses[props.size]);

function setRating(value: number) {
  if (!props.readonly) {
    emit('update:modelValue', value);
  }
}

function onHover(value: number) {
  if (!props.readonly) {
    hoverValue.value = value;
  }
}

function onLeave() {
  hoverValue.value = 0;
}

const displayValue = computed(() => hoverValue.value || props.modelValue);
</script>

<template>
  <div
    class="flex gap-0.5"
    :class="{ 'cursor-pointer': !readonly }"
    @mouseleave="onLeave"
  >
    <button
      v-for="i in 5"
      :key="i"
      type="button"
      :disabled="readonly"
      class="focus:outline-none disabled:cursor-default"
      @click="setRating(i)"
      @mouseenter="onHover(i)"
    >
      <UIcon
        :name="i <= displayValue ? 'i-heroicons-star-solid' : 'i-heroicons-star'"
        :class="[iconSize, i <= displayValue ? 'text-yellow-400' : 'text-gray-200']"
      />
    </button>
  </div>
</template>
