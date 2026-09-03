//go:build unit

package provider

import (
	"context"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/payment"
)

const nowPaymentsTestIPNSecret = "ipn-secret"

// nowPaymentsTestBody 的键故意乱序，且包含一个小数与一个带尖括号的字符串——
// 这三点正是签名规范化最容易出错的地方。
const nowPaymentsTestBody = `{"payment_status":"finished","order_id":"sub2_20240101_0001",` +
	`"price_amount":10.5,"payment_id":5745459419,"actually_paid":0.00034,` +
	`"price_currency":"usd","pay_currency":"btc","order_description":"a<b&c","invoice_id":4522625843}`

// nowPaymentsTestCanonical 是上面这段回调体排序后的规范形式，逐字节手写：
// 键名按字典序、数字保持字面量、尖括号与 & 不转义。签名就是对这串字节算的。
const nowPaymentsTestCanonical = `{"actually_paid":0.00034,"invoice_id":4522625843,` +
	`"order_description":"a<b&c","order_id":"sub2_20240101_0001","pay_currency":"btc",` +
	`"payment_id":5745459419,"payment_status":"finished","price_amount":10.5,"price_currency":"usd"}`

func newTestNowPayments(t *testing.T) *NowPayments {
	t.Helper()
	provider, err := NewNowPayments("1", map[string]string{
		"apiKey":       "test-api-key",
		"ipnSecretKey": nowPaymentsTestIPNSecret,
		"env":          "sandbox",
		"currency":     "USD",
	})
	if err != nil {
		t.Fatalf("NewNowPayments: %v", err)
	}
	return provider
}

func TestNowPaymentsCanonicalJSON(t *testing.T) {
	canonical, err := nowPaymentsCanonicalJSON(nowPaymentsTestBody)
	if err != nil {
		t.Fatalf("canonicalize: %v", err)
	}
	if string(canonical) != nowPaymentsTestCanonical {
		t.Fatalf("canonical form mismatch:\n got: %s\nwant: %s", canonical, nowPaymentsTestCanonical)
	}
}

func TestNowPaymentsVerifyNotification(t *testing.T) {
	provider := newTestNowPayments(t)
	signature := nowPaymentsSign([]byte(nowPaymentsTestCanonical), nowPaymentsTestIPNSecret)

	notification, err := provider.VerifyNotification(context.Background(), nowPaymentsTestBody, map[string]string{
		"x-nowpayments-sig": signature,
	})
	if err != nil {
		t.Fatalf("VerifyNotification: %v", err)
	}
	if notification == nil {
		t.Fatal("VerifyNotification returned no notification for a finished payment")
	}
	if notification.Status != payment.NotificationStatusSuccess {
		t.Fatalf("status = %q, want %q", notification.Status, payment.NotificationStatusSuccess)
	}
	if notification.OrderID != "sub2_20240101_0001" {
		t.Fatalf("order id = %q", notification.OrderID)
	}
	if notification.TradeNo != "5745459419" {
		t.Fatalf("trade no = %q, want the payment_id", notification.TradeNo)
	}
	// 金额必须取法币计价的 price_amount，而不是链上实付的 actually_paid。
	if got := notification.Amount.String(); got != "10.5" {
		t.Fatalf("amount = %s, want 10.5", got)
	}
}

func TestNowPaymentsVerifyNotificationRejectsBadSignature(t *testing.T) {
	provider := newTestNowPayments(t)

	cases := map[string]map[string]string{
		"missing header": {},
		"wrong signature": {
			"x-nowpayments-sig": nowPaymentsSign([]byte(nowPaymentsTestCanonical), "other-secret"),
		},
		"signature over unsorted body": {
			"x-nowpayments-sig": nowPaymentsSign([]byte(nowPaymentsTestBody), nowPaymentsTestIPNSecret),
		},
	}
	for name, headers := range cases {
		t.Run(name, func(t *testing.T) {
			if _, err := provider.VerifyNotification(context.Background(), nowPaymentsTestBody, headers); err == nil {
				t.Fatal("expected signature verification to fail")
			}
		})
	}
}

func TestNowPaymentsVerifyNotificationIgnoresIntermediateStatus(t *testing.T) {
	provider := newTestNowPayments(t)
	// partially_paid 是「收到钱但不够」，必须当作未结算事件放过，
	// 不能按不足额的金额履约。
	body := `{"order_id":"sub2_20240101_0001","payment_status":"partially_paid","price_amount":10.5,"price_currency":"usd"}`
	canonical, err := nowPaymentsCanonicalJSON(body)
	if err != nil {
		t.Fatalf("canonicalize: %v", err)
	}

	notification, err := provider.VerifyNotification(context.Background(), body, map[string]string{
		"x-nowpayments-sig": nowPaymentsSign(canonical, nowPaymentsTestIPNSecret),
	})
	if err != nil {
		t.Fatalf("VerifyNotification: %v", err)
	}
	if notification != nil {
		t.Fatalf("expected no notification for partially_paid, got %+v", notification)
	}
}

func TestNowPaymentsVerifyNotificationRejectsCurrencyMismatch(t *testing.T) {
	provider := newTestNowPayments(t)
	body := `{"order_id":"sub2_20240101_0001","payment_status":"finished","price_amount":10.5,"price_currency":"vnd"}`
	canonical, err := nowPaymentsCanonicalJSON(body)
	if err != nil {
		t.Fatalf("canonicalize: %v", err)
	}

	if _, err := provider.VerifyNotification(context.Background(), body, map[string]string{
		"x-nowpayments-sig": nowPaymentsSign(canonical, nowPaymentsTestIPNSecret),
	}); err == nil {
		t.Fatal("expected a currency mismatch to be rejected")
	}
}

func TestNowPaymentsRequiresIPNSecret(t *testing.T) {
	if _, err := NewNowPayments("1", map[string]string{"apiKey": "test-api-key"}); err == nil {
		t.Fatal("expected a missing ipnSecretKey to be rejected")
	}
}

func TestNowPaymentsStatusMapping(t *testing.T) {
	cases := map[string]string{
		"finished":       payment.ProviderStatusPaid,
		"waiting":        payment.ProviderStatusPending,
		"confirming":     payment.ProviderStatusPending,
		"sending":        payment.ProviderStatusPending,
		"partially_paid": payment.ProviderStatusPending,
		"something_new":  payment.ProviderStatusPending,
		"failed":         payment.ProviderStatusFailed,
		"expired":        payment.ProviderStatusFailed,
		"refunded":       payment.ProviderStatusRefunded,
	}
	for status, want := range cases {
		if got := nowPaymentsStatusToProviderStatus(status); got != want {
			t.Errorf("status %q = %q, want %q", status, got, want)
		}
	}
}

func TestGetBasePaymentTypeCoversNowPayments(t *testing.T) {
	if got := payment.GetBasePaymentType(payment.TypeNowPaymentsCrypto); got != payment.TypeNowPayments {
		t.Fatalf("base type = %q, want %q", got, payment.TypeNowPayments)
	}
	if got := payment.GetBasePaymentType(payment.TypeSePayCard); got != payment.TypeSePay {
		t.Fatalf("base type = %q, want %q", got, payment.TypeSePay)
	}
}
