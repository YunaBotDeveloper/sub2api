package service

import "testing"

func TestOpenAIAccountRuntimeStatsSignals(t *testing.T) {
	var nilStats *openAIAccountRuntimeStats
	if rate, ttft := nilStats.signals(1); rate != nil || ttft != nil {
		t.Fatalf("nil stats: want nil signals, got %v %v", rate, ttft)
	}

	stats := newOpenAIAccountRuntimeStats()
	if rate, ttft := stats.signals(1); rate != nil || ttft != nil {
		t.Fatalf("unsampled account: want nil signals, got %v %v", rate, ttft)
	}

	stats.report(1, false, nil)
	rate, ttft := stats.signals(1)
	if rate == nil || *rate <= 0 {
		t.Fatalf("failed sample: want positive error rate, got %v", rate)
	}
	if ttft != nil {
		t.Fatalf("no TTFT sample: want nil ttft, got %v", *ttft)
	}

	ms := 800
	stats.report(1, true, &ms)
	if _, ttft = stats.signals(1); ttft == nil || *ttft != 800 {
		t.Fatalf("first TTFT sample: want 800, got %v", ttft)
	}
}
