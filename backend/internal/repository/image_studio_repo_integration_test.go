//go:build integration

package repository

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/lib/pq"
	"github.com/stretchr/testify/require"
)

func TestImageStudioRepository_Lifecycle(t *testing.T) {
	ctx := context.Background()
	var userID int64
	email := fmt.Sprintf("image-studio-%d@example.com", time.Now().UnixNano())
	require.NoError(t, integrationDB.QueryRowContext(ctx, `INSERT INTO users (email, password_hash) VALUES ($1, 'x') RETURNING id`, email).Scan(&userID))
	t.Cleanup(func() {
		_, _ = integrationDB.ExecContext(context.Background(), `DELETE FROM users WHERE id = $1`, userID)
	})

	repo := NewImageStudioRepository(integrationDB)
	job := &service.ImageStudioJob{UserID: userID, APIKeyID: 1, Status: service.ImageStudioStatusQueued, Kind: service.ImageStudioKindGenerate, Model: "gpt-image-2", Prompt: "pelican", Params: []byte(`{"n":2}`)}
	require.NoError(t, repo.CreateJob(ctx, job))
	require.Positive(t, job.ID)

	count, err := repo.CountUnfinishedJobs(ctx, userID)
	require.NoError(t, err)
	require.Equal(t, 1, count)

	_, err = repo.DeleteJob(ctx, userID, job.ID)
	require.ErrorIs(t, err, service.ErrImageStudioJobRunning)

	require.NoError(t, repo.MarkJobRunning(ctx, job.ID))
	job.Status, job.ImageCount = service.ImageStudioStatusSucceeded, 2
	duration := int64(1234)
	job.DurationMs = &duration
	require.NoError(t, repo.FinishJob(ctx, job, []service.ImageStudioAsset{
		{JobID: job.ID, UserID: userID, StorageKey: "studio/a.png", MimeType: "image/png", Bytes: 10, RevisedPrompt: "rp"},
		{JobID: job.ID, UserID: userID, StorageKey: "studio/b.png", MimeType: "image/png", Bytes: 20},
	}))

	got, err := repo.GetJob(ctx, userID, job.ID)
	require.NoError(t, err)
	require.Equal(t, service.ImageStudioStatusSucceeded, got.Status)
	require.NotNil(t, got.StartedAt)
	require.NotNil(t, got.CompletedAt)
	require.Len(t, got.Assets, 2)
	require.Equal(t, "rp", got.Assets[0].RevisedPrompt)

	_, err = repo.GetJob(ctx, userID+1, job.ID)
	require.ErrorIs(t, err, service.ErrImageStudioNotFound, "other users must not see the job")
	_, err = repo.GetAsset(ctx, userID+1, got.Assets[0].ID)
	require.ErrorIs(t, err, service.ErrImageStudioNotFound)

	jobs, total, err := repo.ListJobs(ctx, userID, 1, 20)
	require.NoError(t, err)
	require.EqualValues(t, 1, total)
	require.Len(t, jobs[0].Assets, 2)

	key, err := repo.DeleteAsset(ctx, userID, got.Assets[0].ID)
	require.NoError(t, err)
	require.Equal(t, "studio/a.png", key)

	assets, total, err := repo.ListAssets(ctx, userID, 1, 20)
	require.NoError(t, err)
	require.EqualValues(t, 1, total)
	require.Equal(t, "studio/b.png", assets[0].StorageKey)

	keys, err := repo.DeleteJob(ctx, userID, job.ID)
	require.NoError(t, err)
	require.Equal(t, []string{"studio/b.png"}, keys)
	_, total, err = repo.ListAssets(ctx, userID, 1, 20)
	require.NoError(t, err)
	require.Zero(t, total, "deleting a job cascades to its assets")

	stale := &service.ImageStudioJob{UserID: userID, APIKeyID: 1, Status: service.ImageStudioStatusQueued, Kind: service.ImageStudioKindGenerate, Model: "m", Prompt: "p", Params: []byte(`{}`)}
	require.NoError(t, repo.CreateJob(ctx, stale))
	require.NoError(t, repo.FailStaleJobs(ctx, userID, time.Now().Add(time.Minute), "interrupted"))
	count, err = repo.CountUnfinishedJobs(ctx, userID)
	require.NoError(t, err)
	require.Zero(t, count)
}

func TestImageStudioRepository_DeleteExpiredJobs(t *testing.T) {
	ctx := context.Background()
	var userID int64
	email := fmt.Sprintf("image-studio-retention-%d@example.com", time.Now().UnixNano())
	require.NoError(t, integrationDB.QueryRowContext(ctx, `INSERT INTO users (email, password_hash) VALUES ($1, 'x') RETURNING id`, email).Scan(&userID))
	t.Cleanup(func() {
		_, _ = integrationDB.ExecContext(context.Background(), `DELETE FROM users WHERE id = $1`, userID)
	})

	repo := NewImageStudioRepository(integrationDB)
	newJob := func(status string) *service.ImageStudioJob {
		job := &service.ImageStudioJob{UserID: userID, APIKeyID: 1, Status: status, Kind: service.ImageStudioKindGenerate, Model: "m", Prompt: "p", Params: []byte(`{}`)}
		require.NoError(t, repo.CreateJob(ctx, job))
		return job
	}
	old := newJob(service.ImageStudioStatusQueued)
	old.Status = service.ImageStudioStatusSucceeded
	require.NoError(t, repo.FinishJob(ctx, old, []service.ImageStudioAsset{{JobID: old.ID, UserID: userID, StorageKey: "studio/old.png", MimeType: "image/png", Bytes: 1}}))
	running := newJob(service.ImageStudioStatusRunning)
	_, err := integrationDB.ExecContext(ctx, `UPDATE image_studio_jobs SET created_at = NOW() - INTERVAL '40 days' WHERE id = ANY($1)`, pq.Array([]int64{old.ID, running.ID}))
	require.NoError(t, err)
	fresh := newJob(service.ImageStudioStatusQueued)
	fresh.Status = service.ImageStudioStatusFailed
	require.NoError(t, repo.FinishJob(ctx, fresh, nil))

	keys, deleted, err := repo.DeleteExpiredJobs(ctx, time.Now().Add(-30*24*time.Hour), 100)
	require.NoError(t, err)
	require.GreaterOrEqual(t, deleted, 1)
	require.Contains(t, keys, "studio/old.png")

	_, err = repo.GetJob(ctx, userID, old.ID)
	require.ErrorIs(t, err, service.ErrImageStudioNotFound)
	_, err = repo.GetJob(ctx, userID, running.ID)
	require.NoError(t, err, "unfinished jobs are never expired")
	_, err = repo.GetJob(ctx, userID, fresh.ID)
	require.NoError(t, err, "jobs inside the retention window are kept")
}
