package repo

import "github.com/kubefill/kubefill/pkg/db"

type Repo struct {
	Id         int    `json:"id"`
	Url        string `json:"url"`
	Commit     string `json:"commit"`
	Hash       string `json:"hash"`
	Branch     string `json:"branch"`
	Created_At string `json:"created_at"`
	Updated_At string `json:"updated_at"`
	Deleted_At string `json:"deleted_at"`
}

type RepoCreate struct {
	Url             string `json:"url"`
	Branch          string `json:"branch"`
	Ssh_Private_Key string `json:"ssh_private_key"`
}

type RepoUpdate struct {
	Url             string `json:"url"`
	Branch          string `json:"branch"`
	Ssh_Private_Key string `json:"ssh_private_key"`
}

type Service struct {
	db *db.Connection
}
