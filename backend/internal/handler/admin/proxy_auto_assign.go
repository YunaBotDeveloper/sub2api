package admin

import (
	"context"
	"fmt"
	"sort"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/pkg/response"
	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
)

// AutoAssignPair 记录一次自动分配的「账号 ← 代理」配对。
type AutoAssignPair struct {
	AccountID   int64  `json:"account_id"`
	AccountName string `json:"account_name"`
	ProxyID     int64  `json:"proxy_id"`
	ProxyName   string `json:"proxy_name"`
}

// AutoAssignResult 是一键分配的执行结果。
type AutoAssignResult struct {
	Assigned          int              `json:"assigned"`
	Failed            int              `json:"failed"`
	RemainingProxies  int              `json:"remaining_proxies"`
	RemainingAccounts int              `json:"remaining_accounts"`
	Pairs             []AutoAssignPair `json:"pairs"`
	Errors            []string         `json:"errors,omitempty"`
}

// AutoAssign 把每个空闲代理（启用中、未过期、当前无账号占用）按 ID 顺序 1:1 绑定到
// 一个尚未配置代理的账号上，多出来的一方保持空闲。
// POST /api/v1/admin/proxies/auto-assign
func (h *ProxyHandler) AutoAssign(c *gin.Context) {
	ctx := c.Request.Context()

	freeProxies, err := h.listFreeProxies(ctx)
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	freeAccounts, err := h.listAccountsWithoutProxy(ctx)
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}

	pairCount := min(len(freeProxies), len(freeAccounts))
	result := AutoAssignResult{Pairs: make([]AutoAssignPair, 0, pairCount)}

	for i := 0; i < pairCount; i++ {
		proxyID := freeProxies[i].ID
		account := freeAccounts[i]
		if _, err := h.adminService.BulkUpdateAccounts(ctx, &service.BulkUpdateAccountsInput{
			AccountIDs: []int64{account.ID},
			ProxyID:    &proxyID,
		}); err != nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("account %d: %v", account.ID, err))
			continue
		}
		result.Assigned++
		result.Pairs = append(result.Pairs, AutoAssignPair{
			AccountID:   account.ID,
			AccountName: account.Name,
			ProxyID:     proxyID,
			ProxyName:   freeProxies[i].Name,
		})
	}

	result.RemainingProxies = len(freeProxies) - result.Assigned
	result.RemainingAccounts = len(freeAccounts) - result.Assigned

	response.Success(c, result)
}

// listFreeProxies 返回可用且当前没有任何账号绑定的代理，按 ID 升序。
func (h *ProxyHandler) listFreeProxies(ctx context.Context) ([]service.Proxy, error) {
	proxies, err := h.adminService.GetAllProxiesWithAccountCount(ctx)
	if err != nil {
		return nil, err
	}
	now := time.Now()
	free := make([]service.Proxy, 0, len(proxies))
	for i := range proxies {
		p := proxies[i]
		if p.AccountCount > 0 || !p.IsActive() || p.IsExpired(now) {
			continue
		}
		free = append(free, p.Proxy)
	}
	sort.Slice(free, func(i, j int) bool { return free[i].ID < free[j].ID })
	return free, nil
}

// listAccountsWithoutProxy 返回未绑定代理的账号，按 ID 升序。
// 影子账号的代理恒继承母账号，不参与分配。
func (h *ProxyHandler) listAccountsWithoutProxy(ctx context.Context) ([]service.Account, error) {
	const pageSize = 500
	page := 1
	scanned := 0
	var free []service.Account
	for {
		accounts, total, err := h.adminService.ListAccounts(ctx, page, pageSize, "", "", "", "", 0, "", "", "")
		if err != nil {
			return nil, err
		}
		if len(accounts) == 0 {
			break
		}
		scanned += len(accounts)
		for i := range accounts {
			if accounts[i].ProxyID != nil || accounts[i].IsCredentialShadow() {
				continue
			}
			free = append(free, accounts[i])
		}
		if int64(scanned) >= total {
			break
		}
		page++
	}
	sort.Slice(free, func(i, j int) bool { return free[i].ID < free[j].ID })
	return free, nil
}
