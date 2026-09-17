<template>
  <div class="flex min-h-screen items-start justify-center bg-surface-sunken p-4 sm:items-center sm:p-8">
    <div class="w-full max-w-3xl border border-border bg-surface" style="border-top: 4px solid rgb(var(--accent))">
      <!-- Title band -->
      <div class="border-b border-border px-5 py-5 sm:px-8">
        <h1 class="text-h1 font-bold text-accent-strong">{{ t('setup.title') }}</h1>
        <p class="mt-1 text-body text-fg-muted">{{ t('setup.description') }}</p>
      </div>

      <!-- Step register: the sequence is real, so steps are numbered -->
      <ol class="meter border-x-0 border-t-0" style="grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr))">
        <li
          v-for="(step, index) in steps"
          :key="step.id"
          class="meter-cell"
          :class="{ 'meter-cell-current': currentStep === index }"
          :aria-current="currentStep === index ? 'step' : undefined"
        >
          <span class="flex items-center gap-1.5 text-meta font-semibold tabular-nums" :class="currentStep > index ? 'text-success' : currentStep === index ? 'text-meter-ink' : 'text-fg-subtle'">
            <Icon v-if="currentStep > index" name="check" size="xs" :stroke-width="2.5" />
            {{ String(index + 1).padStart(2, '0') }}
          </span>
          <span class="truncate text-body font-semibold" :class="currentStep >= index ? 'text-fg' : 'text-fg-subtle'">
            {{ step.title }}
          </span>
        </li>
      </ol>

      <!-- Step Content -->
      <div class="px-5 py-6 sm:px-8">
        <!-- Step 1: Database -->
        <div v-if="currentStep === 0" class="space-y-6">
          <div class="border-b-2 border-accent pb-2">
            <h2 class="text-h2 font-bold text-accent-strong">
              {{ t('setup.database.title') }}
            </h2>
            <p class="mt-1 text-body text-fg-muted">
              {{ t('setup.database.description') }}
            </p>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="input-label">{{ t('setup.database.host') }}</label>
              <input
                v-model="formData.database.host"
                type="text"
                class="input"
                placeholder="localhost"
              />
            </div>
            <div>
              <label class="input-label">{{ t('setup.database.port') }}</label>
              <input
                v-model.number="formData.database.port"
                type="number"
                class="input"
                placeholder="5432"
              />
            </div>
          </div>

          <div class="flex items-center justify-between gap-4 border-y border-border py-3">
            <div>
              <p class="text-body font-medium text-fg">
                {{ t("setup.redis.enableTls") }}
              </p>
              <p class="text-meta text-fg-muted">
                {{ t("setup.redis.enableTlsHint") }}
              </p>
            </div>
            <Toggle v-model="formData.redis.enable_tls" />
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="input-label">{{ t('setup.database.username') }}</label>
              <input
                v-model="formData.database.user"
                type="text"
                class="input"
                placeholder="postgres"
              />
            </div>
            <div>
              <label class="input-label">{{ t('setup.database.password') }}</label>
              <input
                v-model="formData.database.password"
                type="password"
                class="input"
                :placeholder="t('setup.database.passwordPlaceholder')"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="input-label">{{ t('setup.database.databaseName') }}</label>
              <input
                v-model="formData.database.dbname"
                type="text"
                class="input"
                placeholder="sub2api"
              />
            </div>
            <div>
              <label class="input-label">{{ t('setup.database.sslMode') }}</label>
              <Select
                v-model="formData.database.sslmode"
                :options="[
                  { value: 'disable', label: t('setup.database.ssl.disable') },
                  { value: 'require', label: t('setup.database.ssl.require') },
                  { value: 'verify-ca', label: t('setup.database.ssl.verifyCa') },
                  { value: 'verify-full', label: t('setup.database.ssl.verifyFull') }
                ]"
              />
            </div>
          </div>

          <button
            @click="testDatabaseConnection"
            :disabled="testingDb"
            class="btn btn-secondary w-full"
          >
            <svg
              v-if="testingDb"
              class="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <Icon v-else-if="dbConnected" name="check" size="md" class="text-success" :stroke-width="2" />
            {{
              testingDb
                ? t('setup.status.testing')
                : dbConnected
                  ? t('setup.status.success')
                  : t('setup.status.testConnection')
            }}
          </button>
        </div>

        <!-- Step 2: Redis -->
        <div v-if="currentStep === 1" class="space-y-6">
          <div class="border-b-2 border-accent pb-2">
            <h2 class="text-h2 font-bold text-accent-strong">
              {{ t('setup.redis.title') }}
            </h2>
            <p class="mt-1 text-body text-fg-muted">
              {{ t('setup.redis.description') }}
            </p>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="input-label">{{ t('setup.redis.host') }}</label>
              <input
                v-model="formData.redis.host"
                type="text"
                class="input"
                placeholder="localhost"
              />
            </div>
            <div>
              <label class="input-label">{{ t('setup.redis.port') }}</label>
              <input
                v-model.number="formData.redis.port"
                type="number"
                class="input"
                placeholder="6379"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="input-label">{{ t('setup.redis.username') }}</label>
              <input
                v-model="formData.redis.username"
                type="text"
                class="input"
                :placeholder="t('setup.redis.usernamePlaceholder')"
              />
            </div>
            <div>
              <label class="input-label">{{ t('setup.redis.password') }}</label>
              <input
                v-model="formData.redis.password"
                type="password"
                class="input"
                :placeholder="t('setup.redis.passwordPlaceholder')"
              />
            </div>
            <div>
              <label class="input-label">{{ t('setup.redis.database') }}</label>
              <input
                v-model.number="formData.redis.db"
                type="number"
                class="input"
                placeholder="0"
              />
            </div>
          </div>

          <div class="flex items-center justify-between gap-4 border-y border-border py-3">
            <div>
              <p class="text-body font-medium text-fg">
                {{ t("setup.redis.enableTls") }}
              </p>
              <p class="text-meta text-fg-muted">
                {{ t("setup.redis.enableTlsHint") }}
              </p>
            </div>
            <Toggle v-model="formData.redis.enable_tls" />
          </div>

          <button
            @click="testRedisConnection"
            :disabled="testingRedis"
            class="btn btn-secondary w-full"
          >
            <svg
              v-if="testingRedis"
              class="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <Icon
              v-else-if="redisConnected"
              name="check"
              size="md"
              class="text-success"
              :stroke-width="2"
            />
            {{
              testingRedis
                ? t('setup.status.testing')
                : redisConnected
                  ? t('setup.status.success')
                  : t('setup.status.testConnection')
            }}
          </button>
        </div>

        <!-- Step 3: Admin -->
        <div v-if="currentStep === 2" class="space-y-6">
          <div class="border-b-2 border-accent pb-2">
            <h2 class="text-h2 font-bold text-accent-strong">
              {{ t('setup.admin.title') }}
            </h2>
            <p class="mt-1 text-body text-fg-muted">
              {{ t('setup.admin.description') }}
            </p>
          </div>

          <div>
            <label class="input-label">{{ t('setup.admin.email') }}</label>
            <input
              v-model="formData.admin.email"
              type="email"
              class="input"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label class="input-label">{{ t('setup.admin.password') }}</label>
            <input
              v-model="formData.admin.password"
              type="password"
              class="input"
              :placeholder="t('setup.admin.passwordPlaceholder')"
            />
          </div>

          <div>
            <label class="input-label">{{ t('setup.admin.confirmPassword') }}</label>
            <input
              v-model="confirmPassword"
              type="password"
              class="input"
              :placeholder="t('setup.admin.confirmPasswordPlaceholder')"
            />
            <p
              v-if="confirmPassword && formData.admin.password !== confirmPassword"
              class="input-error-text"
            >
              {{ t('setup.admin.passwordMismatch') }}
            </p>
          </div>
        </div>

        <!-- Step 4: Complete -->
        <div v-if="currentStep === 3" class="space-y-6">
          <div class="border-b-2 border-accent pb-2">
            <h2 class="text-h2 font-bold text-accent-strong">
              {{ t('setup.ready.title') }}
            </h2>
            <p class="mt-1 text-body text-fg-muted">
              {{ t('setup.ready.description') }}
            </p>
          </div>

          <dl class="divide-y divide-border border-y border-border">
            <div class="grid gap-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
              <dt class="text-meta font-medium text-fg-muted">{{ t('setup.ready.database') }}</dt>
              <dd class="break-all font-mono text-label text-fg">
                {{ formData.database.user }}@{{ formData.database.host }}:{{
                  formData.database.port
                }}/{{ formData.database.dbname }}
              </dd>
            </div>
            <div class="grid gap-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
              <dt class="text-meta font-medium text-fg-muted">{{ t('setup.ready.redis') }}</dt>
              <dd class="break-all font-mono text-label text-fg">
                {{ formData.redis.host }}:{{ formData.redis.port }}
              </dd>
            </div>
            <div class="grid gap-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
              <dt class="text-meta font-medium text-fg-muted">{{ t('setup.ready.adminEmail') }}</dt>
              <dd class="break-all text-body text-fg">{{ formData.admin.email }}</dd>
            </div>
          </dl>
        </div>

        <!-- Error Message -->
        <div
          v-if="errorMessage"
          class="mt-6 border border-danger/60 bg-danger-weak px-4 py-3"
        >
          <div class="flex items-start gap-3">
            <Icon name="exclamationCircle" size="md" class="flex-shrink-0 text-danger" />
            <p class="text-body text-danger-strong">{{ errorMessage }}</p>
          </div>
        </div>

        <!-- Success Message -->
        <div
          v-if="installSuccess"
          class="mt-6 border border-success/60 bg-success-weak px-4 py-3"
        >
          <div class="flex items-start gap-3">
            <svg
              v-if="!serviceReady"
              class="h-5 w-5 flex-shrink-0 animate-spin text-success"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <Icon v-else name="checkCircle" size="md" class="flex-shrink-0 text-success" />
            <div>
              <p class="text-body font-medium text-success-strong">
                {{ t('setup.status.completed') }}
              </p>
              <p class="mt-1 text-body text-success-strong">
                {{
                  serviceReady
                    ? t('setup.status.redirecting')
                    : t('setup.status.restarting')
                }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div class="flex justify-between gap-3 border-t border-border bg-surface-sunken px-5 py-4 sm:px-8">
          <button
            v-if="currentStep > 0 && !installSuccess"
            @click="currentStep--"
            class="btn btn-secondary"
          >
            <Icon name="chevronLeft" size="sm" :stroke-width="2" />
            {{ t('common.back') }}
          </button>
          <div v-else></div>

          <button
            v-if="currentStep < 3"
            @click="nextStep"
            :disabled="!canProceed"
            class="btn btn-primary"
          >
            {{ t('common.next') }}
            <Icon name="chevronRight" size="sm" :stroke-width="2" />
          </button>

          <button
            v-else-if="!installSuccess"
            @click="performInstall"
            :disabled="installing"
            class="btn btn-primary"
          >
            <svg
              v-if="installing"
              class="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {{ installing ? t('setup.status.installing') : t('setup.status.completeInstallation') }}
          </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { testDatabase, testRedis, install, type InstallRequest } from '@/api/setup'
import { buildGatewayUrl } from '@/api/client'
import Select from '@/components/common/Select.vue'
import Toggle from '@/components/common/Toggle.vue'
import Icon from '@/components/icons/Icon.vue'

const { t } = useI18n()

const steps = computed(() => [
  { id: 'database', title: t('setup.database.title') },
  { id: 'redis', title: t('setup.redis.title') },
  { id: 'admin', title: t('setup.admin.title') },
  { id: 'complete', title: t('setup.ready.title') }
])

const currentStep = ref(0)
const errorMessage = ref('')
const installSuccess = ref(false)

// Connection test states
const testingDb = ref(false)
const testingRedis = ref(false)
const dbConnected = ref(false)
const redisConnected = ref(false)
const installing = ref(false)
const confirmPassword = ref('')
const serviceReady = ref(false)

// Default server port
const getCurrentPort = (): number => {
  const port = window.location.port
  if (port) {
    return parseInt(port, 10)
  }

  return window.location.protocol === 'https:' ? 443 : 80
}

const formData = reactive<InstallRequest>({
  database: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '',
    dbname: 'sub2api',
    sslmode: 'disable'
  },
  redis: {
    host: 'localhost',
    port: 6379,
    username: '',
    password: '',
    db: 0,
    enable_tls: false
  },
  admin: {
    email: '',
    password: ''
  },
  server: {
    host: '0.0.0.0',
    port: getCurrentPort(), // Use current port from browser
    mode: 'release'
  }
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0:
      return dbConnected.value
    case 1:
      return redisConnected.value
    case 2:
      return (
        formData.admin.email &&
        formData.admin.password.length >= 8 &&
        formData.admin.password === confirmPassword.value
      )
    default:
      return true
  }
})

async function testDatabaseConnection() {
  testingDb.value = true
  errorMessage.value = ''
  dbConnected.value = false

  try {
    await testDatabase(formData.database)
    dbConnected.value = true
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string }
    errorMessage.value =
      err.response?.data?.detail || err.response?.data?.message || err.message || 'Connection failed'
  } finally {
    testingDb.value = false
  }
}

async function testRedisConnection() {
  testingRedis.value = true
  errorMessage.value = ''
  redisConnected.value = false

  try {
    await testRedis(formData.redis)
    redisConnected.value = true
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string }
    errorMessage.value =
      err.response?.data?.detail || err.response?.data?.message || err.message || 'Connection failed'
  } finally {
    testingRedis.value = false
  }
}

function nextStep() {
  if (canProceed.value) {
    errorMessage.value = ''
    currentStep.value++
  }
}

async function performInstall() {
  installing.value = true
  errorMessage.value = ''

  try {
    await install(formData)
    installSuccess.value = true
    // Start polling for service restart
    waitForServiceRestart()
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string }
    errorMessage.value =
      err.response?.data?.detail || err.response?.data?.message || err.message || 'Installation failed'
  } finally {
    installing.value = false
  }
}

// Wait for service to restart and become available
async function waitForServiceRestart() {
  const maxAttempts = 60 // Increase to 60 attempts, ~60 seconds max
  const interval = 1000 // 1 second between attempts

  // Wait a moment for the service to start restarting
  await new Promise((resolve) => setTimeout(resolve, 3000))

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Use setup status endpoint as it tells us the real mode
      // Service might return 404 or connection refused while restarting
      const response = await fetch(buildGatewayUrl('/setup/status'), {
        method: 'GET',
        cache: 'no-store'
      })

      if (response.ok) {
        const data = await response.json()
        // If needs_setup is false, service has restarted in normal mode
        if (data.data && !data.data.needs_setup) {
          serviceReady.value = true
          // Redirect to login page after a short delay
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500)
          return
        }
      }
    } catch {
      // Service not ready or network error during restart, continue polling
    }

    await new Promise((resolve) => setTimeout(resolve, interval))
  }

  // If we reach here, service didn't restart in time
  // Show a message to refresh manually
  errorMessage.value = t('setup.status.timeout')
}
</script>
