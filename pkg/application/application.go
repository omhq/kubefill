package application

import (
	"github.com/kubefill/kubefill/pkg/db"
)

func NewService(db *db.Connection) *Service {
	return &Service{
		db: db,
	}
}

func (s *Service) List() []Application {
	var applications []Application
	s.db.Find(&applications)
	return applications
}

func (s *Service) Create(payload Application) Application {
	application := db.Application{Name: payload.Name, RepoID: payload.RepoID, ManifestPath: payload.ManifestPath}
	s.db.Create(&application)
	payload.Id = int(application.ID)
	payload.Created_At = application.CreatedAt.String()
	return payload
}

func (s *Service) Get(id uint) (db.Application, error) {
	application := db.Application{}
	err := s.db.First(&application, id).Error

	if err != nil {
		return application, err
	}

	return application, nil
}

func (s *Service) Update(application db.Application) error {
	err := s.db.Save(&application).Error

	if err != nil {
		return err
	}

	return nil
}

func (s *Service) Delete(application db.Application) error {
	err := s.db.Unscoped().Delete(&application).Error

	if err != nil {
		return err
	}

	return nil
}
