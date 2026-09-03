//go:build unit

package service

import (
	"testing"
	"time"

	"github.com/shopspring/decimal"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseVietcombankUSDSellRate(t *testing.T) {
	t.Parallel()

	body := []byte(`<?xml version="1.0" encoding="UTF-8"?>
<ExrateList>
  <DateTime>9/4/2026 8:30:00 AM</DateTime>
  <Exrate CurrencyCode="AUD" CurrencyName="AUST.DOLLAR" Buy="16,500.00" Transfer="16,600.00" Sell="17,100.00" />
  <Exrate CurrencyCode="USD" CurrencyName="US DOLLAR" Buy="25,900.00" Transfer="25,930.00" Sell="26,260.00" />
</ExrateList>`)

	rate, err := parseVietcombankUSDSellRate(body)
	require.NoError(t, err)
	// The thousand separators must be stripped, and it is the Sell column we
	// price against — not Buy or Transfer.
	assert.True(t, rate.Equal(decimal.RequireFromString("26260")), "got %s", rate)
}

func TestParseVietcombankUSDSellRateRejectsMissingUSD(t *testing.T) {
	t.Parallel()

	_, err := parseVietcombankUSDSellRate([]byte(`<ExrateList><Exrate CurrencyCode="AUD" Sell="17,100.00" /></ExrateList>`))
	require.Error(t, err)

	_, err = parseVietcombankUSDSellRate([]byte("not xml at all"))
	require.Error(t, err)
}

func TestResolveOrderAmountsConvertsBothDirections(t *testing.T) {
	t.Parallel()

	svc := &PaymentService{}
	rateSvc := NewExchangeRateService(nil)
	rateSvc.cached = &ExchangeRateSnapshot{Rate: decimal.RequireFromString("26260"), FetchedAt: time.Now()}
	svc.SetExchangeRateService(rateSvc)

	// Typed in VND: charge exactly that, credit the USD it buys.
	charge, credit, err := svc.resolveOrderAmounts(t.Context(), CreateOrderRequest{
		Amount: 262600, AmountCurrency: "VND", OrderType: "balance",
	}, "VND")
	require.NoError(t, err)
	assert.InDelta(t, 262600, charge, 0.001)
	assert.InDelta(t, 10, credit, 0.001)

	// Typed in USD: credit exactly that, charge the VND it costs.
	charge, credit, err = svc.resolveOrderAmounts(t.Context(), CreateOrderRequest{
		Amount: 10, AmountCurrency: "usd", OrderType: "balance",
	}, "VND")
	require.NoError(t, err)
	assert.InDelta(t, 262600, charge, 0.001)
	assert.InDelta(t, 10, credit, 0.001)
}

func TestResolveOrderAmountsRoundsAwayFromUs(t *testing.T) {
	t.Parallel()

	svc := &PaymentService{}
	rateSvc := NewExchangeRateService(nil)
	rateSvc.cached = &ExchangeRateSnapshot{Rate: decimal.RequireFromString("26260"), FetchedAt: time.Now()}
	svc.SetExchangeRateService(rateSvc)

	// VND has no minor unit: the charge must land on a whole dong, rounded up.
	charge, _, err := svc.resolveOrderAmounts(t.Context(), CreateOrderRequest{
		Amount: 1.005, AmountCurrency: "USD", OrderType: "balance",
	}, "VND")
	require.NoError(t, err)
	assert.InDelta(t, 26392, charge, 0.001)

	// Credited USD is truncated, never rounded up: 100,000 VND buys 3.808... USD.
	_, credit, err := svc.resolveOrderAmounts(t.Context(), CreateOrderRequest{
		Amount: 100000, AmountCurrency: "VND", OrderType: "balance",
	}, "VND")
	require.NoError(t, err)
	assert.InDelta(t, 3.80, credit, 0.001)
}

func TestResolveOrderAmountsBlocksWhenRateIsMissing(t *testing.T) {
	t.Parallel()

	// No rate service at all: pricing a VND charge against USD balance would be
	// a guess, so order creation must fail rather than invent a number.
	svc := &PaymentService{}
	_, _, err := svc.resolveOrderAmounts(t.Context(), CreateOrderRequest{
		Amount: 10, AmountCurrency: "USD", OrderType: "balance",
	}, "VND")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "exchange rate")
}

func TestNormalizeAmountCurrency(t *testing.T) {
	t.Parallel()

	assert.Equal(t, "USD", NormalizeAmountCurrency(" usd ", "VND"))
	assert.Equal(t, "VND", NormalizeAmountCurrency("", "VND"))
	// An unknown code is not an error, it just means "the gateway currency".
	assert.Equal(t, "VND", NormalizeAmountCurrency("EUR", "vnd"))
}
