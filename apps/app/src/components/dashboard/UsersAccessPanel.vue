<template>
  <div class="overflow-hidden rounded-xl border border-slate-200 bg-white xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
    <div class="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2">
      <div class="relative min-w-48 flex-1">
        <MagnifyingGlassIcon class="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input v-model="search" class="owner-input !min-h-8 !rounded-lg !py-1.5 !pl-8 !text-xs" placeholder="Search people or invitations" />
      </div>
      <div class="flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-bold">
        <button type="button" class="rounded-md px-2.5 py-1.5" :class="listFilter === 'all' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'" @click="listFilter = 'all'">All {{ totalCount }}</button>
        <button type="button" class="rounded-md px-2.5 py-1.5" :class="listFilter === 'active' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'" @click="listFilter = 'active'">Active {{ activeCount }}</button>
        <button type="button" class="rounded-md px-2.5 py-1.5" :class="listFilter === 'pending' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'" @click="listFilter = 'pending'">Pending {{ pendingCount }}</button>
      </div>
      <button type="button" class="owner-primary-action !min-h-8 !rounded-lg !px-3 !py-1.5 !text-xs" @click="startInvitation">
        <UserPlusIcon class="h-4 w-4" /> Invite user
      </button>
    </div>

    <div v-if="accessStore.loading && !accessStore.catalog" class="grid h-80 place-items-center text-xs text-slate-500 xl:h-auto xl:min-h-0 xl:flex-1">Loading access controls…</div>
    <div v-else class="grid h-[min(68vh,700px)] min-h-[470px] md:grid-cols-[260px_minmax(0,1fr)] xl:h-auto xl:min-h-0 xl:flex-1">
      <aside class="min-w-0 overflow-y-auto border-b border-slate-100 bg-slate-50/60 md:border-b-0 md:border-r">
        <button
          v-for="member in filteredMembers"
          :key="member.id"
          type="button"
          class="flex w-full items-center gap-2.5 border-b border-slate-100 px-3 py-2 text-left transition"
          :class="selection?.kind === 'member' && selection.id === member.id ? 'bg-white shadow-[inset_3px_0_0_var(--color-primary)]' : 'hover:bg-white/80'"
          @click="selectMember(member)"
        >
          <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-black" :class="member.role === 'owner' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'">{{ initials(member.name) }}</span>
          <span class="min-w-0 flex-1">
            <span class="flex items-center gap-1.5">
              <span class="truncate text-xs font-bold text-slate-900">{{ member.name }}</span>
              <span v-if="member.role === 'owner'" class="rounded bg-emerald-50 px-1 py-0.5 text-[8px] font-black uppercase text-emerald-700">Owner</span>
            </span>
            <span class="mt-0.5 block truncate text-[10px] text-slate-500">{{ member.job_title || member.email || 'Staff member' }}</span>
          </span>
          <span class="h-2 w-2 shrink-0 rounded-full" :class="member.is_active ? 'bg-emerald-500' : 'bg-slate-300'" />
        </button>

        <button
          v-for="invitation in filteredInvitations"
          :key="invitation.id"
          type="button"
          class="flex w-full items-center gap-2.5 border-b border-slate-100 px-3 py-2 text-left transition"
          :class="selection?.kind === 'invitation' && selection.id === invitation.id ? 'bg-white shadow-[inset_3px_0_0_#f59e0b]' : 'hover:bg-white/80'"
          @click="selectInvitation(invitation)"
        >
          <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-xs font-black text-amber-700">{{ initials(invitation.name) }}</span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-xs font-bold text-slate-900">{{ invitation.name }}</span>
            <span class="mt-0.5 block truncate text-[10px] text-slate-500">{{ invitation.email }}</span>
          </span>
          <span class="rounded-full px-1.5 py-0.5 text-[9px] font-bold capitalize" :class="invitation.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'">{{ invitation.status }}</span>
        </button>

        <p v-if="!filteredMembers.length && !filteredInvitations.length" class="px-4 py-10 text-center text-xs text-slate-400">No matching users</p>
      </aside>

      <section class="min-w-0 overflow-y-auto">
        <div v-if="mode === 'invitation'" class="flex min-h-full flex-col">
          <div class="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div><p class="text-sm font-black text-slate-950">Invite a store user</p><p class="text-[11px] text-slate-500">Their account activates only after they accept the secure link.</p></div>
            <button type="button" class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" @click="closeDraft"><XMarkIcon class="h-4 w-4" /></button>
          </div>
          <AccessEditor v-model="draft" :catalog="accessStore.catalog" :saving="saving" submit-label="Create invitation" @submit="createInvitation" @preset="applyPreset" />
        </div>

        <div v-else-if="selectedMember" class="flex min-h-full flex-col">
          <div class="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3">
            <span class="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-xs font-black text-slate-700">{{ initials(selectedMember.name) }}</span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-black text-slate-950">{{ selectedMember.name }}</p>
              <p class="truncate text-[11px] text-slate-500">{{ selectedMember.email || selectedMember.phone }}</p>
            </div>
            <label v-if="selectedMember.role === 'staff'" class="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-600">
              <input v-model="draftActive" type="checkbox" class="h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-primary" @change="updateStatus" />
              {{ draftActive ? 'Active' : 'Suspended' }}
            </label>
            <span v-else class="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Full access</span>
          </div>
          <div v-if="selectedMember.role === 'owner'" class="grid flex-1 place-items-center p-8 text-center">
            <div class="max-w-sm">
              <ShieldCheckIcon class="mx-auto h-10 w-10 text-emerald-600" />
              <p class="mt-3 text-sm font-black text-slate-950">Protected owner account</p>
              <p class="mt-1 text-xs leading-5 text-slate-500">The store owner always has full access and cannot be suspended, removed, or restricted by staff controls.</p>
            </div>
          </div>
          <AccessEditor v-else v-model="draft" :catalog="accessStore.catalog" :saving="saving" submit-label="Save access" @submit="saveMember" @preset="applyPreset" />
        </div>

        <div v-else-if="selectedInvitation" class="p-4">
          <div class="flex items-start gap-3">
            <span class="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-sm font-black text-amber-700">{{ initials(selectedInvitation.name) }}</span>
            <div class="min-w-0 flex-1"><p class="text-sm font-black text-slate-950">{{ selectedInvitation.name }}</p><p class="text-xs text-slate-500">{{ selectedInvitation.email }}</p></div>
            <span class="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold capitalize text-amber-700">{{ selectedInvitation.status }}</span>
          </div>
          <dl class="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div class="rounded-xl bg-slate-50 p-2.5"><dt class="text-[10px] text-slate-400">Job title</dt><dd class="mt-0.5 truncate font-bold text-slate-700">{{ selectedInvitation.job_title || 'Staff' }}</dd></div>
            <div class="rounded-xl bg-slate-50 p-2.5"><dt class="text-[10px] text-slate-400">Permissions</dt><dd class="mt-0.5 font-bold text-slate-700">{{ selectedInvitation.permissions.length }}</dd></div>
            <div class="rounded-xl bg-slate-50 p-2.5"><dt class="text-[10px] text-slate-400">Created</dt><dd class="mt-0.5 font-bold text-slate-700">{{ shortDate(selectedInvitation.created_at) }}</dd></div>
            <div class="rounded-xl bg-slate-50 p-2.5"><dt class="text-[10px] text-slate-400">Expires</dt><dd class="mt-0.5 font-bold text-slate-700">{{ shortDate(selectedInvitation.expires_at) }}</dd></div>
          </dl>
          <div v-if="latestInviteUrl" class="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p class="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Secure invitation link</p>
            <div class="mt-1.5 flex gap-2"><input :value="latestInviteUrl" readonly class="owner-input !min-h-8 flex-1 !py-1.5 !text-[11px]" /><button type="button" class="owner-primary-action !min-h-8 !px-3 !py-1.5 !text-xs" @click="copyInvite">Copy</button></div>
            <p class="mt-1 text-[10px] text-emerald-700">For security, this link is shown only when created or renewed.</p>
          </div>
          <div v-if="selectedInvitation.status !== 'accepted'" class="mt-4 flex gap-2">
            <button type="button" class="owner-secondary-action !min-h-8 !px-3 !py-1.5 !text-xs" :disabled="saving" @click="renewInvitation">Renew link</button>
            <button v-if="selectedInvitation.status === 'pending'" type="button" class="rounded-lg px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50" :disabled="saving" @click="revokeInvitation">Revoke</button>
          </div>
        </div>

        <div v-else class="grid h-full place-items-center p-8 text-center text-xs text-slate-400">Select a user to manage their access.</div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref, watch } from 'vue'
import { MagnifyingGlassIcon, ShieldCheckIcon, UserPlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import type { StaffInvitation, StoreMember } from '@qesuite/types'
import type { PermissionCatalog, StaffAccessInput } from '@/api/access'
import { useAccessStore } from '@/stores/access'
import { useToast } from '@/composables/useToast'

type Draft = StaffAccessInput & { preset: string }

const AccessEditor = defineComponent({
  props: {
    modelValue: { type: Object as () => Draft, required: true },
    catalog: { type: Object as () => PermissionCatalog | null, default: null },
    saving: Boolean,
    submitLabel: { type: String, required: true },
  },
  emits: ['update:modelValue', 'submit', 'preset'],
  setup(props, { emit }) {
    const update = (field: keyof Draft, value: unknown) => emit('update:modelValue', { ...props.modelValue, [field]: value })
    const groupChecked = (permissions: Array<{ key: string }>) => permissions.every(item => props.modelValue.permissions.includes(item.key))
    const toggleGroup = (permissions: Array<{ key: string }>) => {
      const keys = permissions.map(item => item.key)
      const values = new Set(props.modelValue.permissions)
      if (keys.every(key => values.has(key))) keys.forEach(key => values.delete(key))
      else keys.forEach(key => values.add(key))
      update('permissions', [...values])
    }
    return () => h('form', { class: 'flex min-h-0 flex-1 flex-col', onSubmit: (event: Event) => { event.preventDefault(); emit('submit') } }, [
      h('div', { class: 'grid gap-2 border-b border-slate-100 p-3 sm:grid-cols-4' }, [
        h('input', { value: props.modelValue.name, required: true, maxlength: 120, placeholder: 'Full name', class: 'owner-input !min-h-8 !rounded-lg !py-1.5 !text-xs', onInput: (e: Event) => update('name', (e.target as HTMLInputElement).value) }),
        h('input', { value: props.modelValue.email, required: true, maxlength: 320, type: 'email', placeholder: 'Login email', class: 'owner-input !min-h-8 !rounded-lg !py-1.5 !text-xs', onInput: (e: Event) => update('email', (e.target as HTMLInputElement).value) }),
        h('input', { value: props.modelValue.phone ?? '', maxlength: 20, type: 'tel', placeholder: 'Phone (optional)', class: 'owner-input !min-h-8 !rounded-lg !py-1.5 !text-xs', onInput: (e: Event) => update('phone', (e.target as HTMLInputElement).value) }),
        h('input', { value: props.modelValue.job_title ?? '', maxlength: 80, placeholder: 'Job title', class: 'owner-input !min-h-8 !rounded-lg !py-1.5 !text-xs', onInput: (e: Event) => update('job_title', (e.target as HTMLInputElement).value) }),
      ]),
      h('div', { class: 'flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2' }, [
        h('div', [h('p', { class: 'text-xs font-black text-slate-900' }, 'Menus and operations'), h('p', { class: 'text-[10px] text-slate-500' }, `${props.modelValue.permissions.length} permissions selected`)]),
        h('select', { value: props.modelValue.preset, class: 'owner-input !min-h-8 max-w-40 !rounded-lg !py-1.5 !text-xs', onChange: (e: Event) => { const value = (e.target as HTMLSelectElement).value; update('preset', value); emit('preset', value) } }, [
          h('option', { value: '' }, 'Apply preset…'),
          h('option', { value: 'owner' }, 'Owner'), h('option', { value: 'manager' }, 'Manager'),
          h('option', { value: 'cashier' }, 'Cashier'), h('option', { value: 'stock_controller' }, 'Stock Controller'),
          h('option', { value: 'accountant' }, 'Accountant'),
        ]),
      ]),
      h('div', { class: 'grid min-h-0 flex-1 auto-rows-max gap-2 overflow-y-auto p-3 lg:grid-cols-2 2xl:grid-cols-3' }, props.catalog?.groups.map(group =>
        h('fieldset', { class: 'rounded-xl border border-slate-200 p-2.5' }, [
          h('div', { class: 'mb-2 flex items-start gap-2' }, [
            h('input', { type: 'checkbox', checked: groupChecked(group.permissions), class: 'mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-primary', onChange: () => toggleGroup(group.permissions) }),
            h('div', { class: 'min-w-0' }, [h('legend', { class: 'text-xs font-black text-slate-900' }, group.label), h('p', { class: 'truncate text-[9px] text-slate-400' }, group.description)]),
          ]),
          h('div', { class: 'space-y-1' }, group.permissions.map(permission => h('label', { class: 'flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-50' }, [
            h('input', { type: 'checkbox', value: permission.key, checked: props.modelValue.permissions.includes(permission.key), class: 'h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-primary', onChange: (e: Event) => { const values = new Set(props.modelValue.permissions); (e.target as HTMLInputElement).checked ? values.add(permission.key) : values.delete(permission.key); update('permissions', [...values]) } }),
            h('span', { class: 'min-w-0 flex-1 truncate text-[11px] font-medium text-slate-600' }, permission.label),
            h('span', { class: 'rounded bg-slate-100 px-1 py-0.5 text-[8px] font-bold uppercase text-slate-400' }, permission.operation),
          ]))),
        ])
      ) ?? []),
      h('div', { class: 'flex justify-end border-t border-slate-100 bg-white px-3 py-2' }, [h('button', { type: 'submit', disabled: props.saving, class: 'owner-primary-action !min-h-8 !rounded-lg !px-3 !py-1.5 !text-xs' }, props.saving ? 'Saving…' : props.submitLabel)]),
    ])
  },
})

const accessStore = useAccessStore()
const { showToast } = useToast()
const search = ref('')
const listFilter = ref<'all' | 'active' | 'pending'>('all')
const selection = ref<{ kind: 'member' | 'invitation'; id: string } | null>(null)
const mode = ref<'view' | 'invitation'>('view')
const saving = ref(false)
const latestInviteUrl = ref('')
const draftActive = ref(true)
const draft = ref<Draft>({ name: '', email: '', phone: '', job_title: '', permissions: [], preset: '' })

const selectedMember = computed(() => selection.value?.kind === 'member' ? accessStore.members.find(member => member.id === selection.value?.id) ?? null : null)
const selectedInvitation = computed(() => selection.value?.kind === 'invitation' ? accessStore.invitations.find(invitation => invitation.id === selection.value?.id) ?? null : null)
const visibleInvitationRecords = computed(() => accessStore.invitations.filter(invitation => invitation.status !== 'accepted'))
const activeCount = computed(() => accessStore.members.filter(member => member.is_active).length)
const pendingCount = computed(() => visibleInvitationRecords.value.filter(invitation => invitation.status === 'pending').length)
const totalCount = computed(() => accessStore.members.length + visibleInvitationRecords.value.length)
const query = computed(() => search.value.trim().toLowerCase())
const filteredMembers = computed(() => accessStore.members.filter(member => {
  if (listFilter.value === 'pending') return false
  if (listFilter.value === 'active' && !member.is_active) return false
  return !query.value || [member.name, member.email, member.phone, member.job_title].some(value => value?.toLowerCase().includes(query.value))
}))
const filteredInvitations = computed(() => visibleInvitationRecords.value.filter(invitation => {
  if (listFilter.value === 'active') return false
  if (listFilter.value === 'pending' && invitation.status !== 'pending') return false
  return !query.value || [invitation.name, invitation.email, invitation.phone, invitation.job_title].some(value => value?.toLowerCase().includes(query.value))
}))

watch(selectedMember, member => {
  if (!member) return
  draft.value = { name: member.name, email: member.email ?? '', phone: member.phone ?? '', job_title: member.job_title ?? '', permissions: [...member.permissions], preset: '' }
  draftActive.value = member.is_active
})

function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || '?' }
function shortDate(value: string) { return new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) }
function selectMember(member: StoreMember) { mode.value = 'view'; latestInviteUrl.value = ''; selection.value = { kind: 'member', id: member.id } }
function selectInvitation(invitation: StaffInvitation) { mode.value = 'view'; latestInviteUrl.value = ''; selection.value = { kind: 'invitation', id: invitation.id } }
function startInvitation() { mode.value = 'invitation'; selection.value = null; latestInviteUrl.value = ''; draft.value = { name: '', email: '', phone: '', job_title: '', permissions: [], preset: '' } }
function closeDraft() { mode.value = 'view'; if (accessStore.members[0]) selectMember(accessStore.members[0]) }
function applyPreset(name: string) { const values = accessStore.catalog?.presets[name]; if (values) draft.value.permissions = [...values] }

async function createInvitation() {
  saving.value = true
  try {
    const result = await accessStore.createInvitation(draft.value)
    const invitation = accessStore.invitations.find(item => item.id === result.id)
    if (invitation) selectInvitation(invitation)
    latestInviteUrl.value = result.invite_url
    showToast('Invitation created. Copy the secure link to the staff member.', 'success')
  } catch (reason) { showToast(reason instanceof Error ? reason.message : 'Failed to create invitation', 'error') }
  finally { saving.value = false }
}

async function saveMember() {
  if (!selectedMember.value) return
  saving.value = true
  try { await accessStore.updateMember(selectedMember.value.id, draft.value); showToast('Staff access updated', 'success') }
  catch (reason) { showToast(reason instanceof Error ? reason.message : 'Failed to save access', 'error') }
  finally { saving.value = false }
}

async function updateStatus() {
  if (!selectedMember.value) return
  saving.value = true
  try { await accessStore.setMemberStatus(selectedMember.value.id, draftActive.value); showToast(draftActive.value ? 'Staff account activated' : 'Staff account suspended', 'success') }
  catch (reason) { draftActive.value = !draftActive.value; showToast(reason instanceof Error ? reason.message : 'Failed to update status', 'error') }
  finally { saving.value = false }
}

async function renewInvitation() {
  if (!selectedInvitation.value) return
  saving.value = true
  try { const result = await accessStore.renewInvitation(selectedInvitation.value.id); latestInviteUrl.value = result.invite_url; showToast('Invitation link renewed', 'success') }
  catch (reason) { showToast(reason instanceof Error ? reason.message : 'Failed to renew invitation', 'error') }
  finally { saving.value = false }
}

async function revokeInvitation() {
  if (!selectedInvitation.value) return
  saving.value = true
  try { await accessStore.revokeInvitation(selectedInvitation.value.id); selection.value = null; showToast('Invitation revoked', 'success') }
  catch (reason) { showToast(reason instanceof Error ? reason.message : 'Failed to revoke invitation', 'error') }
  finally { saving.value = false }
}

async function copyInvite() {
  await navigator.clipboard.writeText(latestInviteUrl.value)
  showToast('Invitation link copied', 'success')
}

onMounted(async () => {
  try { await accessStore.fetchManagement(); if (accessStore.members[0]) selectMember(accessStore.members[0]) }
  catch (reason) { showToast(reason instanceof Error ? reason.message : 'Failed to load staff access', 'error') }
})
</script>
