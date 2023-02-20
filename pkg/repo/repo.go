package repo

import (
	"github.com/kubefill/kubefill/pkg/db"
)

func NewService(db *db.Connection) *Service {
	return &Service{
		db: db,
	}
}

func (s *Service) List() []Repo {
	var repos []Repo
	s.db.Find(&repos)
	return repos
}

func (s *Service) Create(payload Repo) db.Repo {
	repo := db.Repo{Url: payload.Url, Branch: payload.Branch}
	s.db.Create(&repo)
	return repo
}

func (s *Service) Get(id uint) (db.Repo, error) {
	repo := db.Repo{}
	err := s.db.First(&repo, id).Error

	if err != nil {
		return repo, err
	}

	return repo, nil
}

func (s *Service) Update(repo db.Repo) error {
	err := s.db.Save(&repo).Error

	if err != nil {
		return err
	}

	return nil
}

func (s *Service) Delete(repo db.Repo) error {
	err := s.db.Unscoped().Delete(&repo).Error

	if err != nil {
		return err
	}

	return nil
}
