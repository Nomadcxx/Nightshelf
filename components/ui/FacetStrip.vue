<template>
  <div class="w-full flex bg-bg border-y border-border">
    <div class="flex-none min-h-12 px-3 flex items-center border-r border-border bg-secondary font-mono text-xs uppercase tracking-[0.16em] text-chrome" aria-hidden="true">
      {{ prompt }}&gt;
    </div>
    <div class="min-w-0 flex flex-1 overflow-x-auto scrollbar-hide" role="group" :aria-label="ariaLabel">
      <button
        v-for="item in items"
        :key="item.value"
        type="button"
        class="relative flex-none min-h-12 max-w-[14rem] px-4 border-r border-border flex items-center font-mono text-xs uppercase tracking-[0.12em] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
        :class="item.value === value ? 'bg-chrome/10 text-chrome' : 'text-fg text-opacity-70'"
        :aria-pressed="item.value === value ? 'true' : 'false'"
        :title="item.label"
        @click="$emit('select', item.value)"
      >
        <span v-if="item.value === value" class="absolute inset-y-2 left-0 w-0.5 bg-success" aria-hidden="true" />
        <span class="block truncate">{{ item.label }}</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    prompt: {
      type: String,
      required: true
    },
    ariaLabel: {
      type: String,
      required: true
    },
    value: {
      type: String,
      default: 'all'
    },
    items: {
      type: Array,
      default: () => []
    }
  }
}
</script>
