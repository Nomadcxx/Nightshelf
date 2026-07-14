<template>
  <div :key="bookmark.time" :id="`bookmark-row-${bookmark.time}`" class="flex items-center px-1 py-4 justify-start relative" :class="highlight ? 'bg-bg bg-opacity-60' : ' bg-opacity-20'" @click="click">
    <div class="flex-grow overflow-hidden px-2">
      <div class="flex items-center mb-0.5">
        <ui-ph-icon name="bookmark" :size="18" class="pr-1" :class="highlight ? 'text-success' : 'text-fg-muted'" :weight="highlight ? 'fill' : 'regular'" />
        <p class="truncate text-sm">
          {{ bookmark.title }}
        </p>
      </div>
      <p class="text-sm font-mono text-fg-muted flex items-center"><ui-ph-icon name="schedule" :size="16" class="pr-1" />{{ $secondsToTimestamp(bookmark.time / playbackRate) }}</p>
    </div>
    <div class="h-full flex items-center justify-end transform w-16 pr-2" @click.stop>
      <ui-ph-icon name="edit" :size="22" class="mr-2 text-fg" @click.native.stop="editClick" />
      <ui-ph-icon name="delete" :size="22" class="text-fg" @click.native.stop="deleteClick" />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    bookmark: {
      type: Object,
      default: () => {}
    },
    highlight: Boolean,
    playbackRate: Number
  },
  data() {
    return {}
  },
  computed: {},
  methods: {
    click() {
      this.$emit('click', this.bookmark)
    },
    deleteClick() {
      this.$emit('delete', this.bookmark)
    },
    editClick() {
      this.$emit('edit', this.bookmark)
    }
  }
}
</script>
