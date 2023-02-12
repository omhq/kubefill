package secret

import (
	"github.com/kubefill/kubefill/pkg/db"
)

func NewService(db *db.Connection) *SecretService {
	return &SecretService{
		db: db,
	}
}

func (s *SecretService) GetAllByAppId(appId uint) ([]db.Secret, error) {
	var secrets []db.Secret
	err := s.db.Where("application_id = ?", appId).Find(&secrets).Error
	return secrets, err
}

func (s *SecretService) GetByKey(name string) (db.Secret, error) {
	secret := db.Secret{}
	err := s.db.Where("name = ?", name).First(&secret).Error

	if err != nil {
		return secret, err
	}

	return secret, nil
}

func (s *SecretService) Create(data Secret) db.Secret {
	secret := db.Secret{Name: data.Name, Value: data.Value, ApplicationID: data.ApplicationID}
	s.db.Create(&secret)
	return secret
}

func (s *SecretService) Get(id uint) (db.Secret, error) {
	secret := db.Secret{}
	err := s.db.First(&secret, id).Error

	if err != nil {
		return secret, err
	}

	return secret, nil
}

func (s *SecretService) Update(secret db.Secret) error {
	err := s.db.Save(&secret).Error

	if err != nil {
		return err
	}

	return nil
}

func (s *SecretService) Delete(secret db.Secret) error {
	err := s.db.Unscoped().Delete(&secret).Error

	if err != nil {
		return err
	}

	return nil
}
