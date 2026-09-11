import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
export const useExchangeRates = () => {
  // State
  const rates = ref([])
  const counterparties = ref([])
  const currencyPairs = ref([])
  const loading = ref(false)
  const error = ref(null)
  const selectedDate = ref(new Date().toISOString().split('T')[0])

  // Fetch all active counterparties
  const fetchCounterparties = async () => {
    try {
      loading.value = true
      const { data, error: err } = await supabase
        .from('counterparties')
        .select('*')
        .order('priority', { ascending: true })
        console.log("counterparties:", data)
      if (err) throw err
      counterparties.value = data || []
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Fetch all active currency pairs
  const fetchCurrencyPairs = async () => {
    try {
      const { data, error: err } = await supabase
        .from('currency_pairs')
        .select('*')
        .eq('is_active', true)
        .order('from_currency', { ascending: true })

      if (err) throw err
      currencyPairs.value = data || []
    } catch (err) {
      error.value = err.message
    }
  }

  // Fetch exchange rates for a specific date
  const fetchRatesByDate = async (date = selectedDate.value) => {
    try {
      loading.value = true
      const { data, error: err } = await supabase
        .from('exchange_rates')
        .select(`
          *,
          counterparty:counterparty_id(id, name, logo_url),
          currency_pair:currency_pair_id(from_currency, to_currency)
        `)
        .eq('rate_date', date)
        .eq('is_active', true)
        .order('counterparty_id', { ascending: true })

      if (err) throw err
      rates.value = data || []
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Get rates grouped by counterparty
  const ratesByCounterparty = computed(() => {
    const grouped = {}
    rates.value.forEach(rate => {
      const cpName = rate.counterparty?.name || 'Unknown'
      if (!grouped[cpName]) {
        grouped[cpName] = {
          counterparty: rate.counterparty,
          rates: []
        }
      }
      grouped[cpName].rates.push(rate)
    })
    return Object.values(grouped)
  })

  // Get rate for specific currency pair and counterparty
  const getRate = (counterpartyId, currencyPairId, direction = 'BUY') => {
    return rates.value.find(r =>
      r.counterparty_id === counterpartyId &&
      r.currency_pair_id === currencyPairId &&
      (r.direction === direction || r.direction === 'BOTH')
    )?.rate
  }

  // Create new exchange rate
  const createRate = async (payload) => {
    try {
      const { data, error: err } = await supabase
        .from('exchange_rates')
        .insert([payload])
        .select()

      if (err) throw err
      return data?.[0]
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // Update exchange rate
  const updateRate = async (id, updates) => {
    try {
      const { data, error: err } = await supabase
        .from('exchange_rates')
        .update(updates)
        .eq('id', id)
        .select()

      if (err) throw err
      return data?.[0]
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // Create counterparty
  const createCounterparty = async (payload) => {
    try {
      const { data, error: err } = await supabase
        .from('counterparties')
        .insert([payload])
        .select()

      if (err) throw err
      return data?.[0]
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // Create currency pair
  const createCurrencyPair = async (fromCurrency, toCurrency) => {
    try {
      const { data, error: err } = await supabase
        .from('currency_pairs')
        .insert([{
          from_currency: fromCurrency,
          to_currency: toCurrency
        }])
        .select()

      if (err) throw err
      return data?.[0]
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  return {
    rates,
    counterparties,
    currencyPairs,
    loading,
    error,
    selectedDate,
    fetchCounterparties,
    fetchCurrencyPairs,
    fetchRatesByDate,
    ratesByCounterparty,
    getRate,
    createRate,
    updateRate,
    createCounterparty,
    createCurrencyPair
  }
}