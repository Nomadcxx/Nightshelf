<template>
  <modals-modal v-model="show" width="90%" height="100%">
    <div class="absolute inset-0 flex items-center justify-center overflow-hidden" @click="show = false">
      <section class="relative w-full max-w-md overflow-hidden border border-border bg-secondary" :aria-label="$strings.HeaderLibraryView" @click.stop>
        <div class="absolute inset-y-0 left-0 w-1 bg-success" aria-hidden="true" />
        <header class="min-h-14 pl-5 pr-4 flex items-center border-b border-border bg-bg">
          <p class="font-mono text-sm uppercase tracking-[0.16em] text-fg"><span class="text-success">VIEW&gt;</span> {{ $strings.HeaderLibraryView }}</p>
        </header>
        <ul class="pl-1" role="listbox" :aria-label="$strings.HeaderLibraryView">
          <li v-for="option in options" :key="option.value" role="option" :aria-selected="option.value === value ? 'true' : 'false'">
            <button type="button" class="relative w-full min-h-16 px-4 flex items-center gap-4 border-b border-border text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent" :class="option.value === value ? 'bg-success/10 text-success' : 'text-fg'" @click="select(option.value)">
              <span v-if="option.value === value" class="absolute inset-y-2 left-0 w-0.5 bg-success" aria-hidden="true" />
              <ui-ph-icon :name="option.icon" :size="24" class="flex-none" />
              <span class="min-w-0 flex-1">
                <span class="block font-mono text-xs uppercase tracking-[0.12em]">{{ option.label }}</span>
                <span class="mt-1 block text-xs leading-snug text-fg-muted">{{ option.description }}</span>
              </span>
              <ui-ph-icon v-if="option.value === value" name="check" :size="20" class="flex-none" />
            </button>
          </li>
        </ul>
      </section>
    </div>
  </modals-modal>
</template>

<script>
export default {
  props: {
    value: Boolean,
    mode: {
      type: String,
      default: 'rails'
    }
  },
  computed: {
    show: {
      get() {
        return this.value
      },
      set(value) {
        this.$emit('input', value)
      }
    },
    options() {
      return [
        { value: 'rails', icon: 'view_list', label: this.$strings.LabelCuratedRails, description: this.$strings.MessageCuratedRailsDescription },
        { value: 'grid', icon: 'grid_view', label: this.$strings.LabelCoverGrid, description: this.$strings.MessageCoverGridDescription },
        { value: 'compact', icon: 'format_list_bulleted', label: this.$strings.LabelCompactList, description: this.$strings.MessageCompactListDescription }
      ]
    }
  },
  methods: {
    select(mode) {
      this.$emit('select', mode)
      this.show = false
    }
  }
}
</script>
