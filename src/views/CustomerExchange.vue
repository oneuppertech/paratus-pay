<template>
  <div class="min-h-screen bg-gradient-to-br from-red-50 to-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 bg-red-600 rounded flex items-center justify-center">
            <span class="text-white font-bold text-xl">P</span>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Exchange Rates</h1>
            <p class="text-gray-600">Compare and send money with the best rates</p>
          </div>
        </div>
      </div>

      <!-- Send Money Direction Tabs -->
      <div class="mb-6">
        <div class="flex gap-3 bg-white rounded-lg shadow-sm p-1 w-fit">
          <button
            @click="direction = 'NGN_TO_FOREIGN'"
            :class="[
              'px-6 py-3 rounded-md font-semibold transition-all',
              direction === 'NGN_TO_FOREIGN'
                ? 'bg-red-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            ]"
          >
            <i class="fas fa-arrow-right mr-2"></i>Send from Nigeria
          </button>
          <button
            @click="direction = 'FOREIGN_TO_NGN'"
            :class="[
              'px-6 py-3 rounded-md font-semibold transition-all',
              direction === 'FOREIGN_TO_NGN'
                ? 'bg-red-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            ]"
          >
            <i class="fas fa-arrow-left mr-2"></i>Send to Nigeria
          </button>
        </div>
      </div>

      <!-- Rate Date -->
      <div class="bg-white rounded-lg shadow-sm p-4 mb-6 text-center">
        <p class="text-sm text-gray-600">
          Rates effective <span class="font-semibold text-gray-900">{{ formatDate(selectedDate) }}</span>
        </p>
      </div>

      <!-- Currency Converter -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Currency Converter</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <!-- From Currency -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">From</label>
            <div class="relative">
              <input
                v-model.number="converterForm.fromAmount"
                type="number"
                step="0.01"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter amount"
              />
            </div>
            <select
              v-model="converterForm.fromCurrency"
              @change="updateConversion"
              class="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option v-for="pair in availablePairs" :key="`from-${pair.id}`" :value="pair.from_currency">
                {{ pair.from_currency }}
              </option>
            </select>
          </div>

          <!-- Swap Button -->
          <div class="flex justify-center">
            <button
              @click="swapCurrencies"
              class="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md transition-all transform hover:scale-110"
              title="Swap currencies"
            >
              <i class="fas fa-exchange-alt"></i>
            </button>
          </div>

          <!-- To Currency -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">To</label>
            <div class="relative">
              <input
                :value="converterForm.toAmount"
                type="number"
                disabled
                class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-semibold"
                placeholder="0.00"
              />
            </div>
            <select
              v-model="converterForm.toCurrency"
              @change="updateConversion"
              class="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option v-for="pair in availablePairs" :key="`to-${pair.id}`" :value="pair.to_currency">
                {{ pair.to_currency }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="converterRate" class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p class="text-sm text-gray-700">
            <span class="font-semibold">1 {{ converterForm.fromCurrency }}</span> = 
            <span class="font-semibold text-blue-600">{{ converterRate.toFixed(4) }} {{ converterForm.toCurrency }}</span>
          </p>
        </div>

        <button
          v-if="converterForm.fromAmount > 0"
          class="w-full mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
        >
          <i class="fas fa-paper-plane mr-2"></i>Proceed to Exchange
        </button>
      </div>

      <!-- Exchange Rates by Counterparty -->
      <div v-if="loading" class="text-center py-12">
        <i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
      </div>

      <div v-else-if="ratesByCounterparty.length" class="space-y-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Best Rates by Provider</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="group in filteredRatesByCounterparty"
            :key="group.counterparty.id"
            class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            <!-- Counterparty Header -->
            <div class="bg-gradient-to-r from-red-600 to-red-700 p-4 text-white">
              <div class="flex items-center gap-3 mb-2">
                <img
                  v-if="group.counterparty.logo_url"
                  :src="group.counterparty.logo_url"
                  :alt="group.counterparty.name"
                  class="w-10 h-10 object-cover rounded bg-white p-1"
                />
                <h3 class="text-lg font-bold">{{ group.counterparty.name }}</h3>
              </div>
              <p class="text-red-100 text-sm">{{ group.counterparty.description }}</p>
            </div>

            <!-- Rates -->
            <div class="p-6">
              <div class="space-y-3">
                <div
                  v-for="rate in group.rates"
                  :key="rate.id"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div class="flex-1">
                    <div class="font-semibold text-gray-900">
                      {{ rate.currency_pair.from_currency }} → {{ rate.currency_pair.to_currency }}
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                      {{ formatDirection(rate.direction) }}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-2xl font-bold text-red-600 font-mono">
                      {{ rate.rate.toFixed(4) }}
                    </div>
                    <div class="text-xs text-gray-500">per 1 {{ rate.currency_pair.from_currency }}</div>
                  </div>
                </div>
              </div>

              <!-- CTA -->
              <button
                class="w-full mt-6 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
              >
                <i class="fas fa-arrow-right"></i>
                Send Money with {{ group.counterparty.name }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="bg-white rounded-lg shadow p-8 text-center">
        <p class="text-gray-600">No rates available for {{ formatDate(selectedDate) }}</p>
      </div>

      <!-- Features Section -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
        <div class="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-md transition">
          <i class="fas fa-bolt text-red-600 text-3xl mb-3"></i>
          <h4 class="font-bold text-gray-900 mb-2">Fast Transfers</h4>
          <p class="text-sm text-gray-600">Money arrives in minutes</p>
        </div>

        <div class="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-md transition">
          <i class="fas fa-shield-alt text-red-600 text-3xl mb-3"></i>
          <h4 class="font-bold text-gray-900 mb-2">Secure Transactions</h4>
          <p class="text-sm text-gray-600">Bank-level encryption</p>
        </div>

        <div class="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-md transition">
          <i class="fas fa-percent text-red-600 text-3xl mb-3"></i>
          <h4 class="font-bold text-gray-900 mb-2">Competitive Rates</h4>
          <p class="text-sm text-gray-600">Best rates in the market</p>
        </div>

        <div class="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-md transition">
          <i class="fas fa-users text-red-600 text-3xl mb-3"></i>
          <h4 class="font-bold text-gray-900 mb-2">Trusted by Families</h4>
          <p class="text-sm text-gray-600">Millions send safely</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useExchangeRates } from '@/composables/Useexchangerate'

const {
  rates,
  ratesByCounterparty,
  loading,
  selectedDate,
  fetchRatesByDate,
  fetchCounterparties,
  fetchCurrencyPairs,
  getRate
} = useExchangeRates()

// Direction state
const direction = ref('NGN_TO_FOREIGN')

// Converter form
const converterForm = ref({
  fromAmount: '',
  fromCurrency: 'NGN',
  toCurrency: 'GBP',
  toAmount: 0
})

const converterRate = ref(null)

// Initialize
onMounted(async () => {
  await fetchCounterparties()
  await fetchCurrencyPairs()
  await fetchRatesByDate()
  
  // Set default currencies based on direction
  updateConverterCurrencies()
})

// Computed properties
const availablePairs = computed(() => {
  if (direction.value === 'NGN_TO_FOREIGN') {
    return rates.value
      .filter(r => r.currency_pair.from_currency === 'NGN')
      .map(r => r.currency_pair)
      .filter((pair, index, self) => 
        index === self.findIndex(p => p.id === pair.id)
      )
  } else {
    return rates.value
      .filter(r => r.currency_pair.from_currency !== 'NGN')
      .map(r => r.currency_pair)
      .filter((pair, index, self) => 
        index === self.findIndex(p => p.id === pair.id)
      )
  }
})

const filteredRatesByCounterparty = computed(() => {
  return ratesByCounterparty.value.map(group => ({
    ...group,
    rates: group.rates.filter(rate => {
      if (direction.value === 'NGN_TO_FOREIGN') {
        return rate.currency_pair.from_currency === 'NGN'
      } else {
        return rate.currency_pair.from_currency !== 'NGN'
      }
    })
  })).filter(group => group.rates.length > 0)
})

// Methods
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatDirection = (direction) => {
  const directionMap = {
    'BUY': 'Buy rate',
    'SELL': 'Sell rate',
    'BOTH': 'Mid-market rate'
  }
  return directionMap[direction] || direction
}

const updateConverterCurrencies = () => {
  if (direction.value === 'NGN_TO_FOREIGN') {
    converterForm.value.fromCurrency = 'NGN'
    converterForm.value.toCurrency = 'GBP'
  } else {
    converterForm.value.fromCurrency = 'GBP'
    converterForm.value.toCurrency = 'NGN'
  }
  updateConversion()
}

const updateConversion = () => {
  if (!converterForm.value.fromAmount) {
    converterForm.value.toAmount = 0
    converterRate.value = null
    return
  }

  // Find the rate for the selected currency pair
  const matchingRate = rates.value.find(r =>
    r.currency_pair.from_currency === converterForm.value.fromCurrency &&
    r.currency_pair.to_currency === converterForm.value.toCurrency
  )

  if (matchingRate) {
    converterRate.value = matchingRate.rate
    converterForm.value.toAmount = (converterForm.value.fromAmount * matchingRate.rate).toFixed(2)
  } else {
    converterRate.value = null
    converterForm.value.toAmount = 0
  }
}

const swapCurrencies = () => {
  const temp = converterForm.value.fromCurrency
  converterForm.value.fromCurrency = converterForm.value.toCurrency
  converterForm.value.toCurrency = temp
  updateConversion()
}

// Watch direction changes
watch(() => direction.value, updateConverterCurrencies)
</script>