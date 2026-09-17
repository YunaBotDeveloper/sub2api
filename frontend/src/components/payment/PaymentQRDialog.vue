<template>
  <BaseDialog :show="show" :title="dialogTitle" width="narrow" @close="handleClose">
    <!-- QR Code + Polling State: scan part of the stub -->
    <div v-if="!success" class="flex flex-col items-center gap-4">
      <!-- QR Code mode -->
      <template v-if="qrUrl">
        <div class="border border-border-strong bg-white p-3">
          <canvas ref="qrCanvas" class="mx-auto"></canvas>
        </div>
        <p v-if="scanHint" class="text-center text-body text-fg-muted">
          {{ scanHint }}
        </p>
      </template>
      <!-- Popup window waiting mode (no QR code) -->
      <template v-else>
        <div class="flex flex-col items-center py-4">
          <div class="spinner h-8 w-8 text-accent"></div>
          <p class="mt-4 text-body text-fg-muted">{{ t('payment.qr.payInNewWindowHint') }}</p>
          <button v-if="payUrl" class="btn btn-secondary mt-3" @click="reopenPopup">
            {{ t('payment.qr.openPayWindow') }}
          </button>
        </div>
      </template>
      <div class="stub-perforation w-full" />
      <!-- Countdown -->
      <div v-if="expired" class="text-center">
        <span class="badge badge-danger px-2.5 py-1 text-label">{{ t('payment.qr.expired') }}</span>
      </div>
      <div
        v-else
        class="flex w-full items-baseline justify-between gap-3 border border-border px-3 py-2"
        :class="remainingSeconds > 0 && remainingSeconds <= 60 ? 'bg-meter-weak text-meter-ink' : ''"
      >
        <span class="text-meta font-medium" :class="remainingSeconds > 0 && remainingSeconds <= 60 ? '' : 'text-fg-muted'">
          {{ qrUrl ? t('payment.qr.expiresIn') : t('payment.qr.waitingPayment') }}
        </span>
        <span class="text-h2 font-bold tabular-nums">{{ countdownDisplay }}</span>
      </div>
      <p v-if="!expired && qrUrl" class="text-meta text-fg-subtle">{{ t('payment.qr.waitingPayment') }}</p>
    </div>
    <!-- Success State: receipt with stamp -->
    <div v-else class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-h3 font-bold text-accent-strong">{{ t('payment.result.success') }}</p>
        <span class="badge badge-success px-2.5 py-1 text-label">
          <Icon name="check" size="sm" />
          {{ t('payment.status.paid') }}
        </span>
      </div>
      <dl v-if="paidOrder" class="divide-y divide-border border-y border-border text-body">
        <div class="flex justify-between gap-4 py-2">
          <dt class="text-fg-muted">{{ t('payment.orders.orderId') }}</dt>
          <dd class="font-mono text-fg">#{{ paidOrder.id }}</dd>
        </div>
        <div class="flex justify-between gap-4 py-2">
          <dt class="text-fg-muted">{{ t('payment.orders.amount') }}</dt>
          <dd class="tabular-nums text-fg">{{ formatCreditedAmount(paidOrder.amount) }}</dd>
        </div>
        <div class="flex justify-between gap-4 py-2">
          <dt class="text-fg-muted">{{ t('payment.orders.payAmount') }}</dt>
          <dd class="font-bold tabular-nums text-fg">{{ formatOrderAmount(paidOrder.pay_amount, paidOrder.currency) }}</dd>
        </div>
      </dl>
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <button v-if="!success && !expired" class="btn btn-secondary" :disabled="cancelling" @click="handleCancel">
          {{ cancelling ? t('common.processing') : t('payment.qr.cancelOrder') }}
        </button>
        <button v-if="success" class="btn btn-primary" @click="handleDone">
          {{ t('common.confirm') }}
        </button>
        <button v-if="expired" class="btn btn-primary" @click="handleClose">
          {{ t('payment.result.backToRecharge') }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseDialog from '@/components/common/BaseDialog.vue'
import Icon from '@/components/icons/Icon.vue'
import { usePaymentStore } from '@/stores/payment'
import { useAppStore } from '@/stores'
import { paymentAPI } from '@/api/payment'
import { extractI18nErrorMessage } from '@/utils/apiError'
import { getPaymentPopupFeatures } from '@/components/payment/providerConfig'
import type { PaymentOrder } from '@/types/payment'
import { formatPaymentAmount } from '@/components/payment/currency'
import QRCode from 'qrcode'

const props = defineProps<{
  show: boolean
  orderId: number
  qrCode: string
  expiresAt: string
  paymentType: string
  /** URL for reopening the payment popup window */
  payUrl?: string
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const i18n = useI18n()
const { t } = i18n
// i18n.locale 在部分测试替身里不存在；格式化不该因为拿不到语言而炸掉整块渲染。
const localeCode = computed(() => String(i18n.locale?.value ?? 'en'))
const paymentStore = usePaymentStore()
const appStore = useAppStore()

const qrCanvas = ref<HTMLCanvasElement | null>(null)
const qrUrl = ref('')
const remainingSeconds = ref(0)
const expired = ref(false)
const cancelling = ref(false)
const success = ref(false)
const paidOrder = ref<PaymentOrder | null>(null)
// 支付金额按订单币种格式化：VND 等零小数币种不能出现 .00。
function formatOrderAmount(value: number, currency?: string | null): string {
  return formatPaymentAmount(value, currency, localeCode.value)
}

// 入账余额始终是 USD，与网关币种无关。
function formatCreditedAmount(value: number): string {
  return formatPaymentAmount(value, 'USD', localeCode.value)
}

let pollTimer: ReturnType<typeof setInterval> | null = null
let countdownTimer: ReturnType<typeof setInterval> | null = null
let verifyAttempts = 0
let lastVerifyAt = 0

const VERIFY_RETRY_INTERVAL_MS = 15000
const VERIFY_RETRY_MAX_ATTEMPTS = 6

const dialogTitle = computed(() => {
  if (success.value) return t('payment.result.success')
  if (!qrUrl.value) return t('payment.qr.payInNewWindow')
  return t('payment.qr.scanToPay')
})

const scanHint = computed(() => {
  return ''
})

const countdownDisplay = computed(() => {
  const m = Math.floor(remainingSeconds.value / 60)
  const s = remainingSeconds.value % 60
  return m.toString().padStart(2, '0') + ':' + s.toString().padStart(2, '0')
})

function getLogoForType(): string | null {
  return null
}


function reopenPopup() {
  if (props.payUrl) {
    window.open(props.payUrl, 'paymentPopup', getPaymentPopupFeatures())
  }
}

async function renderQR() {
  await nextTick()
  if (!qrCanvas.value || !qrUrl.value) return
  const logoSrc = getLogoForType()
  await QRCode.toCanvas(qrCanvas.value, qrUrl.value, {
    width: 220,
    margin: 2,
    errorCorrectionLevel: logoSrc ? 'M' : 'L',
  })
  if (!logoSrc) return
  const canvas = qrCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const img = new Image()
  img.src = logoSrc
  img.onload = () => {
    const logoSize = 40
    const x = (canvas.width - logoSize) / 2
    const y = (canvas.height - logoSize) / 2
    const pad = 4
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    const r = 5
    ctx.moveTo(x - pad + r, y - pad)
    ctx.arcTo(x + logoSize + pad, y - pad, x + logoSize + pad, y + logoSize + pad, r)
    ctx.arcTo(x + logoSize + pad, y + logoSize + pad, x - pad, y + logoSize + pad, r)
    ctx.arcTo(x - pad, y + logoSize + pad, x - pad, y - pad, r)
    ctx.arcTo(x - pad, y - pad, x + logoSize + pad, y - pad, r)
    ctx.fill()
    ctx.drawImage(img, x, y, logoSize, logoSize)
  }
}

async function pollStatus() {
  if (!props.orderId) return
  let order = await paymentStore.pollOrderStatus(props.orderId)
  if (!order) return
  order = await tryRecoverPendingOrder(order)
  if (order.status === 'COMPLETED' || order.status === 'PAID') {
    cleanup()
    paidOrder.value = order
    success.value = true
    emit('success')
  } else if (order.status === 'EXPIRED' || order.status === 'CANCELLED' || order.status === 'FAILED') {
    cleanup()
    expired.value = true
  }
}

// The gateway can miss a callback, so a still-PENDING order is re-verified
// against the upstream a few times before we give up on this poll cycle.
async function tryRecoverPendingOrder(order: PaymentOrder): Promise<PaymentOrder> {
  const outTradeNo = String(order.out_trade_no || '').trim()
  if (!outTradeNo) return order
  const normalizedStatus = String(order.status || '').trim().toUpperCase()
  if (normalizedStatus !== 'PENDING') return order
  const now = Date.now()
  if (verifyAttempts >= VERIFY_RETRY_MAX_ATTEMPTS || now - lastVerifyAt < VERIFY_RETRY_INTERVAL_MS) {
    return order
  }

  lastVerifyAt = now
  verifyAttempts += 1
  try {
    const result = await paymentAPI.verifyOrder(outTradeNo)
    return result.data ?? order
  } catch {
    return order
  }
}

function startCountdown(seconds: number) {
  remainingSeconds.value = Math.max(0, seconds)
  if (remainingSeconds.value <= 0) {
    expired.value = true
    return
  }
  countdownTimer = setInterval(() => {
    remainingSeconds.value--
    if (remainingSeconds.value <= 0) {
      expired.value = true
      cleanup()
    }
  }, 1000)
}

async function handleCancel() {
  if (!props.orderId || cancelling.value) return
  cancelling.value = true
  try {
    await paymentAPI.cancelOrder(props.orderId)
    cleanup()
    emit('close')
  } catch (err: unknown) {
    appStore.showError(extractI18nErrorMessage(err, t, 'payment.errors', t('common.error')))
  } finally {
    cancelling.value = false
  }
}

function handleClose() {
  cleanup()
  emit('close')
}

function handleDone() {
  cleanup()
  emit('close')
}

function cleanup() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
}

function init() {
  // Reset state
  success.value = false
  paidOrder.value = null
  expired.value = false
  cancelling.value = false
  qrUrl.value = props.qrCode
  verifyAttempts = 0
  lastVerifyAt = 0

  let seconds = 30 * 60
  if (props.expiresAt) {
    const expiresAt = new Date(props.expiresAt)
    seconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000)
  }
  startCountdown(seconds)
  pollTimer = setInterval(pollStatus, 3000)
  renderQR()
}

// Watch for dialog open/close
watch(() => props.show, (isOpen) => {
  if (isOpen) {
    init()
  } else {
    cleanup()
  }
})

watch(qrUrl, () => renderQR())

onUnmounted(() => cleanup())
</script>
