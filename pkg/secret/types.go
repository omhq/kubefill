package secret

import (
	"github.com/kubefill/kubefill/pkg/db"
)

type Secret struct {
	Id            int    `json:"id"`
	ApplicationID uint   `json:"application_id"`
	Name          string `json:"name"`
	Value         string `json:"value"`
	Created_At    string `json:"created_at"`
	Updated_At    string `json:"updated_at"`
	Deleted_At    string `json:"deleted_at"`
}

type SecretUpdate struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type SecretHttpResp struct {
	Id         uint   `json:"id"`
	Name       string `json:"name"`
	Created_At string `json:"created_at"`
	Updated_At string `json:"updated_at"`
}

type SecretService struct {
	db *db.Connection
}
