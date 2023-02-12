package job

import (
	"github.com/kubefill/kubefill/pkg/db"
)

func NewService(db *db.Connection) *JobService {
	return &JobService{
		db: db,
	}
}

func (s *JobService) GetAllByAppId(appId uint) ([]db.Job, error) {
	var jobs []db.Job
	err := s.db.Where("application_id = ?", appId).Find(&jobs).Error
	return jobs, err
}

func (s *JobService) Create(data Job) db.Job {
	job := db.Job{Name: data.Name, ApplicationID: data.ApplicationID}
	s.db.Create(&job)
	return job
}

func (s *JobService) Get(id uint) (db.Job, error) {
	job := db.Job{}
	err := s.db.First(&job, id).Error

	if err != nil {
		return job, err
	}

	return job, nil
}

func (s *JobService) Update(job db.Job) error {
	err := s.db.Save(&job).Error

	if err != nil {
		return err
	}

	return nil
}

func (s *JobService) Delete(job db.Job) error {
	err := s.db.Unscoped().Delete(&job).Error

	if err != nil {
		return err
	}

	return nil
}
