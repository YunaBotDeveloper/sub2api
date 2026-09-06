package service

// 分组并发接管用户并发的判定；订阅套餐把额度挂在分组上，
// 分组并发为 0 时必须原样回退到用户级，否则买了套餐的用户会被降到 0 并发。

import "testing"

func TestAPIKeyEffectiveConcurrency(t *testing.T) {
	cases := []struct {
		name string
		key  *APIKey
		want int
	}{
		{
			name: "分组未配置并发时回退用户级",
			key:  &APIKey{User: &User{Concurrency: 5}, Group: &Group{Concurrency: 0}},
			want: 5,
		},
		{
			name: "分组配置正数时接管",
			key:  &APIKey{User: &User{Concurrency: 5}, Group: &Group{Concurrency: 20}},
			want: 20,
		},
		{
			name: "分组并发低于用户级时同样接管",
			key:  &APIKey{User: &User{Concurrency: 50}, Group: &Group{Concurrency: 3}},
			want: 3,
		},
		{
			name: "无分组的 Key 用用户级",
			key:  &APIKey{User: &User{Concurrency: 7}},
			want: 7,
		},
		{
			name: "分组并发为负数视为未配置",
			key:  &APIKey{User: &User{Concurrency: 5}, Group: &Group{Concurrency: -1}},
			want: 5,
		},
		{
			name: "缺少用户时返回 0 而不是 panic",
			key:  &APIKey{Group: &Group{Concurrency: 0}},
			want: 0,
		},
		{
			name: "nil Key 返回 0",
			key:  nil,
			want: 0,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := tc.key.EffectiveConcurrency(); got != tc.want {
				t.Fatalf("EffectiveConcurrency() = %d, want %d", got, tc.want)
			}
		})
	}
}
