<template>
  <div class="p-6 max-w-7xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Exchange Rate Management</h1>
      <p class="text-gray-600">Manage counterparties, currency pairs, and exchange rates</p>
    </div>

    <!-- Date Selector -->
    <div class="mb-6 bg-white rounded-lg shadow p-4">
      <div class="flex items-center gap-4">
        <label class="text-sm font-medium text-gray-700">Rate Date:</label>
        <input
          v-model="selectedDate"
          type="date"
          @change="fetchRatesByDate"
          class="px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <button
          @click="setToday"
          class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium"
        >
          Today
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="bg-white rounded-lg shadow">
      <div class="border-b border-gray-200">
        <nav class="flex gap-0" aria-label="Tabs">
          <button
            @click="activeTab = 'rates'"
            :class="[
              'px-6 py-4 font-medium text-sm border-b-2 transition-colors',
              activeTab === 'rates'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            ]"
          >
            Exchange Rates
          </button>
          <button
            @click="activeTab = 'counterparties'"
            :class="[
              'px-6 py-4 font-medium text-sm border-b-2 transition-colors',
              activeTab === 'counterparties'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            ]"
          >
            Counterparties
          </button>
          <button
            @click="activeTab = 'pairs'"
            :class="[
              'px-6 py-4 font-medium text-sm border-b-2 transition-colors',
              activeTab === 'pairs'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            ]"
          >
            Currency Pairs
          </button>
        </nav>
      </div>

      <!-- Exchange Rates Tab -->
      <div v-if="activeTab === 'rates'" class="p-6">
        <div class="mb-6">
          <button
            @click="showRateForm = !showRateForm"
            class="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700"
          >
            <i class="fas fa-plus mr-2"></i>Add Rate
          </button>
        </div>

        <!-- Add/Edit Rate Form -->
        <div v-if="showRateForm" class="mb-6 bg-gray-50 rounded-lg p-4">
          <h3 class="font-semibold mb-4">{{ editingRateId ? 'Edit Rate' : 'Add New Rate' }}</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Counterparty</label>
              <select
                v-model="rateForm.counterparty_id"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Select counterparty</option>
                <option v-for="cp in counterparties" :key="cp.id" :value="cp.id">
                  {{ cp.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Currency Pair</label>
              <select
                v-model="rateForm.currency_pair_id"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Select pair</option>
                <option v-for="pair in currencyPairs" :key="pair.id" :value="pair.id">
                  {{ pair.from_currency }} → {{ pair.to_currency }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Rate</label>
              <input
                v-model.number="rateForm.rate"
                type="number"
                step="0.0001"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="0.0000"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Direction</label>
              <select
                v-model="rateForm.direction"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="BUY">Buy</option>
                <option value="SELL">Sell</option>
                <option value="BOTH">Both</option>
              </select>
            </div>
          </div>

          <div class="flex gap-2 mt-4">
            <button
              @click="saveRate"
              :disabled="!rateForm.counterparty_id || !rateForm.currency_pair_id || !rateForm.rate"
              class="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ editingRateId ? 'Update' : 'Add' }}
            </button>
            <button
              @click="cancelRateForm"
              class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- Rates Table -->
        <div v-if="loading" class="text-center py-8">
          <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-gray-900">Counterparty</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-900">Pair</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-900">Rate</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-900">Direction</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-900">Date</th>
                <th class="px-4 py-3 text-center font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="rate in rates" :key="rate.id" class="border-t hover:bg-gray-50">
                <td class="px-4 py-3 text-gray-900">{{ rate.counterparty?.name }}</td>
                <td class="px-4 py-3 text-gray-900">
                  {{ rate.currency_pair?.from_currency }} → {{ rate.currency_pair?.to_currency }}
                </td>
                <td class="px-4 py-3 font-mono text-gray-900">{{ rate.rate.toFixed(4) }}</td>
                <td class="px-4 py-3 text-gray-900">{{ rate.direction }}</td>
                <td class="px-4 py-3 text-gray-900">{{ formatDate(rate.rate_date) }}</td>
                <td class="px-4 py-3 text-center">
                  <button
                    @click="editRate(rate)"
                    class="text-blue-600 hover:text-blue-900 mr-3"
                    title="Edit"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    @click="deleteRate(rate.id)"
                    class="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="!rates.length">
                <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                  No rates found for {{ formatDate(selectedDate) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Counterparties Tab -->
      <div v-if="activeTab === 'counterparties'" class="p-6">
        <div class="mb-6">
          <button
            @click="showCounterpartyForm = !showCounterpartyForm"
            class="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700"
          >
            <i class="fas fa-plus mr-2"></i>Add Counterparty
          </button>
        </div>

        <!-- Add Counterparty Form -->
        <div v-if="showCounterpartyForm" class="mb-6 bg-gray-50 rounded-lg p-4">
          <h3 class="font-semibold mb-4">Add New Counterparty</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                v-model="counterpartyForm.name"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="e.g., Prune"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <input
                v-model="counterpartyForm.logo_url"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="https://..."
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                v-model="counterpartyForm.description"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows="3"
                placeholder="Enter description"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <input
                v-model.number="counterpartyForm.priority"
                type="number"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          <div class="flex gap-2 mt-4">
            <button
              @click="saveCounterparty"
              :disabled="!counterpartyForm.name"
              class="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:opacity-50"
            >
              Add
            </button>
            <button
              @click="showCounterpartyForm = false"
              class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- Counterparties List -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="cp in counterparties"
            :key="cp.id"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
          >
            <div class="flex items-start gap-3">
              <img
                v-if="cp.logo_url"
                :src="cp.logo_url"
                :alt="cp.name"
                class="w-12 h-12 object-cover rounded"
              />
              <div class="flex-1">
                <h4 class="font-semibold text-gray-900">{{ cp.name }}</h4>
                <p class="text-sm text-gray-600">{{ cp.description }}</p>
                <div class="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <i class="fas fa-layer-group"></i>Priority: {{ cp.priority }}
                </div>
              </div>
              <div class="flex gap-2">
                <button
                  @click="toggleCounterpartyActive(cp.id, !cp.is_active)"
                  :class="[
                    'px-2 py-1 rounded text-xs font-medium',
                    cp.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  ]"
                >
                  {{ cp.is_active ? 'Active' : 'Inactive' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Currency Pairs Tab -->
      <div v-if="activeTab === 'pairs'" class="p-6">
        <div class="mb-6">
          <button
            @click="showPairForm = !showPairForm"
            class="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700"
          >
            <i class="fas fa-plus mr-2"></i>Add Pair
          </button>
        </div>

        <!-- Add Pair Form -->
        <div v-if="showPairForm" class="mb-6 bg-gray-50 rounded-lg p-4">
          <h3 class="font-semibold mb-4">Add New Currency Pair</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">From Currency</label>
              <input
                v-model="pairForm.from_currency"
                type="text"
                maxlength="10"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm uppercase"
                placeholder="NGN"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">To Currency</label>
              <input
                v-model="pairForm.to_currency"
                type="text"
                maxlength="10"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm uppercase"
                placeholder="GBP"
              />
            </div>
          </div>

          <div class="flex gap-2 mt-4">
            <button
              @click="savePair"
              :disabled="!pairForm.from_currency || !pairForm.to_currency"
              class="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:opacity-50"
            >
              Add
            </button>
            <button
              @click="showPairForm = false"
              class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- Pairs List -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            v-for="pair in currencyPairs"
            :key="pair.id"
            class="border border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50"
          >
            <div class="font-mono text-lg font-semibold text-gray-900">
              {{ pair.from_currency }} <i class="fas fa-arrow-right text-red-600 text-sm mx-2"></i> {{ pair.to_currency }}
            </div>
            <div class="text-xs text-gray-500 mt-2">
              {{ pair.is_active ? '✓ Active' : '✗ Inactive' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useExchangeRates } from '@/composables/Useexchangerate.ts'

const {
  rates,
  counterparties,
  currencyPairs,
  loading,
  selectedDate,
  fetchRatesByDate,
  fetchCounterparties,
  fetchCurrencyPairs,
  createRate,
  updateRate,
  createCounterparty,
  createCurrencyPair
} = useExchangeRates()

// UI State
const activeTab = ref('rates')
const showRateForm = ref(false)
const showCounterpartyForm = ref(false)
const showPairForm = ref(false)
const editingRateId = ref(null)

// Form State
const rateForm = ref({
  counterparty_id: '',
  currency_pair_id: '',
  rate: null,
  direction: 'BOTH'
})

const counterpartyForm = ref({
  name: '',
  logo_url: '',
  description: '',
  priority: 1
})

const pairForm = ref({
  from_currency: '',
  to_currency: ''
})

// Initialize
onMounted(async () => {
  await fetchCounterparties()
  await fetchCurrencyPairs()
  await fetchRatesByDate()
})

// Methods
const setToday = () => {
  selectedDate.value = new Date().toISOString().split('T')[0]
  fetchRatesByDate()
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const editRate = (rate) => {
  editingRateId.value = rate.id
  rateForm.value = {
    counterparty_id: rate.counterparty_id,
    currency_pair_id: rate.currency_pair_id,
    rate: rate.rate,
    direction: rate.direction
  }
  showRateForm.value = true
}

const cancelRateForm = () => {
  showRateForm.value = false
  editingRateId.value = null
  rateForm.value = {
    counterparty_id: '',
    currency_pair_id: '',
    rate: null,
    direction: 'BOTH'
  }
}

const saveRate = async () => {
  try {
    if (editingRateId.value) {
      await updateRate(editingRateId.value, {
        ...rateForm.value,
        rate_date: selectedDate.value
      })
    } else {
      await createRate({
        ...rateForm.value,
        rate_date: selectedDate.value
      })
    }
    await fetchRatesByDate()
    cancelRateForm()
  } catch (err) {
    console.error('Error saving rate:', err)
  }
}

const deleteRate = async (id) => {
  if (confirm('Are you sure you want to delete this rate?')) {
    // Implement soft delete or hard delete based on your needs
    console.log('Delete rate:', id)
  }
}

const saveCounterparty = async () => {
  try {
    await createCounterparty(counterpartyForm.value)
    await fetchCounterparties()
    showCounterpartyForm.value = false
    counterpartyForm.value = {
      name: '',
      logo_url: '',
      description: '',
      priority: 1
    }
  } catch (err) {
    console.error('Error saving counterparty:', err)
  }
}

const toggleCounterpartyActive = async (id, isActive) => {
  // Implement toggle active status
  console.log('Toggle counterparty active:', id, isActive)
}

const savePair = async () => {
  try {
    await createCurrencyPair(
      pairForm.value.from_currency.toUpperCase(),
      pairForm.value.to_currency.toUpperCase()
    )
    await fetchCurrencyPairs()
    showPairForm.value = false
    pairForm.value = {
      from_currency: '',
      to_currency: ''
    }
  } catch (err) {
    console.error('Error saving pair:', err)
  }
}
</script>