package server

import (
	"time"

	"github.com/kubefill/kubefill/pkg/client"
	"github.com/kubefill/kubefill/pkg/db"
	"github.com/kubefill/kubefill/reposerver"
	v1 "k8s.io/api/batch/v1"
)

type RepoResp struct {
	App       db.Application                `json:"app"`
	Manifests *reposerver.ManifestsResponse `json:"manifests"`
}

type SettingsHttpResponse struct {
	RepoRoot   string `json:"repo_root"`
	SshRoot    string `json:"ssh_root"`
	PrivateKey string `json:"private_key"`
}

type RepoHttpResponse struct {
	Id         int    `json:"id"`
	Url        string `json:"url"`
	Commit     string `json:"commit"`
	Hash       string `json:"hash"`
	Created_At string `json:"created_at"`
	Updated_At string `json:"updated_at"`
	Deleted_At string `json:"deleted_at"`
}

type AppManifestHttpResp struct {
	App       db.Application                `json:"app"`
	Manifests *reposerver.ManifestsResponse `json:"manifests"`
}

type JobRunResponse struct {
	Job    db.Job           `json:"job"`
	Config client.JobConfig `json:"config"`
	Spec   v1.JobSpec       `json:"spec"`
	Status v1.JobStatus     `json:"status"`
}

type RetainedLogs struct {
	Logs []string `json:"logs"`
}

type FileData struct {
	DateCreated time.Time `json:"date_created"`
	Path        string    `json:"path"`
	Logs        []string  `json:"logs"`
}

type Pair struct {
	Key   string   `json:"file"`
	Value FileData `json:"file_data"`
}

type PairList []Pair

func (p PairList) Swap(i, j int)      { p[i], p[j] = p[j], p[i] }
func (p PairList) Len() int           { return len(p) }
func (p PairList) Less(i, j int) bool { return p[i].Value.DateCreated.Before(p[j].Value.DateCreated) }

type SelfHttpResponse struct {
	User string `json:"user"`
}

type TokenRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type TokenHttpResponse struct {
	Token string `json:"token"`
}
