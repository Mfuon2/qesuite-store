<template>
  <footer class="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-8 pb-24 md:pb-8">
    <div class="max-w-5xl mx-auto px-4 py-8">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <!-- Store info -->
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 text-white text-sm font-bold flex items-center justify-center"
              :style="{ backgroundColor: 'var(--color-primary)' }"
            >
              {{ storeName.charAt(0) }}
            </div>
            <span class="font-bold text-gray-900 dark:text-white">{{ storeName }}</span>
          </div>

          <div v-if="phone" class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <PhoneIcon class="w-4 h-4 flex-shrink-0" />
            <a :href="`tel:${phone}`" class="hover:text-gray-900 dark:hover:text-white transition-colors">
              {{ phone }}
            </a>
          </div>

          <div v-if="address" class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPinIcon class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{{ address }}</span>
          </div>
        </div>

        <!-- Links -->
        <div class="space-y-2.5">
          <a
            v-if="whatsappUrl"
            :href="whatsappUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {{ $t('footer.whatsapp') }}
          </a>

          <RouterLink
            :to="`/${slug}/track/:code`"
            class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <TruckIcon class="w-4 h-4" />
            {{ $t('nav.track') }}
          </RouterLink>
        </div>
      </div>

      <!-- Powered by -->
      <div class="mt-8 pt-5 border-t border-gray-200 dark:border-gray-800 text-center">
        <p class="text-xs text-gray-400 dark:text-gray-600">
          {{ $t('footer.powered_by') }}
          <a
            href="https://store.qesuite.com"
            target="_blank"
            rel="noopener noreferrer"
            class="font-semibold hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
          >
            QeSuite
          </a>
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { PhoneIcon, MapPinIcon, TruckIcon } from '@heroicons/vue/24/outline'
import { useStorefrontStore } from '@/stores/store'

const store = useStorefrontStore()
const storeName = computed(() => store.storeName)
const phone = computed(() => store.config?.tenant.phone)
const address = computed(() => store.config?.tenant.address)
const slug = computed(() => store.slug)
const whatsappNumber = computed(() => store.whatsappNumber)

const whatsappUrl = computed(() => {
  if (!whatsappNumber.value) return null
  const num = whatsappNumber.value.replace(/[^0-9]/g, '')
  return `https://wa.me/${num}`
})
</script>
