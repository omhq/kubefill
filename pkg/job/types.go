package job

import (
	"github.com/kubefill/kubefill/pkg/db"
)

type Job struct {
	Id            int    `json:"id"`
	ApplicationID uint   `json:"application_id"`
	Name          string `json:"name"`
	Phase         string `json:"phase"`
	Spec          string `json:"spec"`
	Created_At    string `json:"created_at"`
	Updated_At    string `json:"updated_at"`
	Deleted_At    string `json:"deleted_at"`
}

type JobService struct {
	db *db.Connection
}
