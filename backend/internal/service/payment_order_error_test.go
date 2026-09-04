//go:build unit

package service

import (
	"errors"
	"testing"

	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestClassifyCreatePaymentErrorKeepsProviderDetail(t *testing.T) {
	t.Parallel()

	// The provider already knows which parameter the gateway rejected. Rewrapping
	// it produces a bare "payment gateway error" and throws that away, which
	// leaves the only diagnosis path as guesswork.
	providerErr := infraerrors.ServiceUnavailable("PAYMENT_GATEWAY_ERROR",
		"nowpayments create payment: upstream returned 500: INTERNAL_ERROR").
		WithMetadata(map[string]string{"price_currency": "vnd", "price_amount": "250000"})

	err := classifyCreatePaymentError(CreateOrderRequest{}, "nowpayments", providerErr)
	require.Error(t, err)

	var appErr *infraerrors.ApplicationError
	require.ErrorAs(t, err, &appErr)
	assert.Equal(t, "vnd", appErr.Metadata["price_currency"])
	assert.Equal(t, "250000", appErr.Metadata["price_amount"])
	assert.Contains(t, appErr.Message, "INTERNAL_ERROR")
}

func TestClassifyCreatePaymentErrorWrapsPlainErrors(t *testing.T) {
	t.Parallel()

	err := classifyCreatePaymentError(CreateOrderRequest{}, "sepay", errors.New("dial tcp: timeout"))
	require.Error(t, err)

	var appErr *infraerrors.ApplicationError
	require.ErrorAs(t, err, &appErr)
	assert.Equal(t, "PAYMENT_GATEWAY_ERROR", appErr.Reason)
	assert.Contains(t, appErr.Message, "dial tcp: timeout")
	assert.Equal(t, "sepay", appErr.Metadata["provider_key"])

	assert.NoError(t, classifyCreatePaymentError(CreateOrderRequest{}, "sepay", nil))
}
