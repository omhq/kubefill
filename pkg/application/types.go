package application

import "github.com/kubefill/kubefill/pkg/db"

type Application struct {
	Id           int    `json:"id"`
	Name         string `json:"name"`
	RepoID       uint   `json:"repo_id"`
	ManifestPath string `json:"manifest_path"`
	Created_At   string `json:"created_at"`
	Updated_At   string `json:"updated_at"`
	Deleted_At   string `json:"deleted_at"`
}

type ApplicationUpdate struct {
	Name         string `json:"name"`
	RepoID       uint   `json:"repo_id"`
	ManifestPath string `json:"manifest_path"`
}

type Service struct {
	db *db.Connection
}
